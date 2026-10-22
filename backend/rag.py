"""
rag.py — Pinecone RAG engine for Creative Suite
------------------------------------------------
Handles:
  - Embedding via Google text-embedding-004
  - Pinecone index connection (cograg, __default__ namespace)
  - Brand ↔ Pinecone client key fuzzy-matching
  - Context retrieval for brand-scoped RAG queries
  - File ingestion: chunk → embed → upsert
  - DAM file Pinecone vector deletion

Usage in main.py:
    from rag import rag_engine
    context = await rag_engine.retrieve_brand_context(brand, user_query)
"""

import os
import re
import io
import time
import uuid
import asyncio
import logging
from typing import Optional, List, Dict, Any
log = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
PINECONE_API_KEY     = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME  = os.getenv("PINECONE_INDEX_NAME", "cograg")
PINECONE_INDEX_HOST  = os.getenv("PINECONE_INDEX_HOST", "https://cograg-oubkmcx.svc.aped-4627-b74a.pinecone.io")
PINECONE_NAMESPACE   = os.getenv("PINECONE_NAMESPACE", "")
GEMINI_API_KEY       = os.getenv("GOOGLE_GEMINI_API_KEY", "")
EMBEDDING_MODEL      = os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2")
EMBEDDING_DIM        = 768    # llama-text-embed-v2 dimension matching cograg index
CHUNK_TARGET_WORDS   = 350
CHUNK_OVERLAP_WORDS  = 70
RETRIEVAL_TOP_K      = 8
CONTEXT_TOKEN_BUDGET = 2000

# ── Lazy imports (avoid crashing main.py if deps are missing) ─────────────────
try:
    from pinecone import Pinecone as PineconeClient
    _PINECONE_AVAILABLE = True
except ImportError:
    _PINECONE_AVAILABLE = False
    log.warning("[RAG] pinecone package not installed — RAG disabled.")

try:
    import tiktoken
    _TIKTOKEN_AVAILABLE = True
except ImportError:
    _TIKTOKEN_AVAILABLE = False

try:
    import PyPDF2
    _PYPDF2_AVAILABLE = True
except ImportError:
    _PYPDF2_AVAILABLE = False


# ── Text tokeniser & chunker (from DAM-Test-Repo) ─────────────────────────────
def _count_tokens(text: str) -> int:
    if _TIKTOKEN_AVAILABLE:
        try:
            enc = tiktoken.get_encoding("cl100k_base")
            return len(enc.encode(text))
        except Exception:
            pass
    return len(text) // 4   # rough fallback: 1 token ≈ 4 chars


def chunk_text(text: str, chunk_words: int = CHUNK_TARGET_WORDS, overlap_words: int = CHUNK_OVERLAP_WORDS) -> List[Dict[str, Any]]:
    """
    Word-based chunking with overlap matching DAM-Test-Repo embed_to_pinecone.py.
    Returns list of dicts: [{'index': int, 'text': str}, ...]
    """
    words = re.findall(r"\S+", text)
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_words, len(words))
        chunks.append({"index": len(chunks), "text": " ".join(words[start:end])})
        if end >= len(words):
            break
        start = end - overlap_words
    return chunks


# ── String similarity (Levenshtein ratio) ────────────────────────────────────
def _levenshtein_ratio(a: str, b: str) -> float:
    a, b = a.lower(), b.lower()
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    la, lb = len(a), len(b)
    dp = list(range(lb + 1))
    for i, ca in enumerate(a):
        ndp = [i + 1]
        for j, cb in enumerate(b):
            ndp.append(min(dp[j + 1] + 1, ndp[j] + 1, dp[j] + (0 if ca == cb else 1)))
        dp = ndp
    return 1.0 - dp[lb] / max(la, lb)


def _normalize_name(name: str) -> str:
    """Lowercase, strip punctuation/symbols for fuzzy comparison."""
    return re.sub(r"[^a-z0-9 ]", "", name.lower()).strip()


def match_brand_to_clients(brand_name: str, known_clients: List[str], tier1: float = 0.85, tier2: float = 0.50):
    """
    Returns list of match dicts sorted by similarity descending.
    Each dict: { client, similarity, tier }
      tier 1 = high confidence (>= tier1)
      tier 2 = medium  (>= tier2)
      tier 3 = low / no match (< tier2)
    """
    norm_name = _normalize_name(brand_name)
    results = []
    for client in known_clients:
        norm_client = _normalize_name(client)
        sim = _levenshtein_ratio(norm_name, norm_client)
        # Check substring match (e.g. "Aarize" matches "Aarize Group")
        if norm_name and norm_client and (norm_name in norm_client or norm_client in norm_name):
            sub_sim = min(len(norm_name), len(norm_client)) / max(len(norm_name), len(norm_client))
            sim = max(sim, 0.85 * (0.8 + 0.2 * sub_sim))
        if sim >= tier2:
            tier = 1 if sim >= tier1 else 2
            results.append({"client": client, "similarity": round(sim, 4), "tier": tier})
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:5]   # return top 5 candidates


# ── Main RAG Engine ───────────────────────────────────────────────────────────
class RAGEngine:
    def __init__(self):
        self._index = None
        self._pc    = None

    def _ensure_index(self):
        if self._index is not None:
            return True
        if not _PINECONE_AVAILABLE or not PINECONE_API_KEY:
            log.warning("[RAG] Pinecone unavailable or API key missing.")
            return False
        try:
            self._pc    = PineconeClient(api_key=PINECONE_API_KEY)
            self._index = self._pc.Index(name=PINECONE_INDEX_NAME, host=PINECONE_INDEX_HOST)
            log.info(f"[RAG] Connected to Pinecone index '{PINECONE_INDEX_NAME}' at {PINECONE_INDEX_HOST}")
            return True
        except Exception as exc:
            log.error(f"[RAG] Failed to connect to Pinecone: {exc}")
            return False

    # ── Hosted Inference (llama-text-embed-v2 via Pinecone API) ───────────────
    def _post_pinecone_embed(self, payload: dict) -> dict:
        """Call Pinecone hosted embedding inference endpoint."""
        import urllib.request, json
        req = urllib.request.Request(
            "https://api.pinecone.io/embed",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Api-Key": PINECONE_API_KEY,
                "Content-Type": "application/json",
                "X-Pinecone-Api-Version": "2025-04",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))

    async def _embed_passages(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Embed text chunks using Pinecone hosted inference (llama-text-embed-v2, 768d) in batches of 96."""
        if not chunks or not PINECONE_API_KEY:
            return chunks
        loop = asyncio.get_event_loop()
        for start in range(0, len(chunks), 96):
            batch = chunks[start:start + 96]
            payload = {
                "model": EMBEDDING_MODEL,
                "parameters": {"input_type": "passage", "truncate": "END", "dimension": EMBEDDING_DIM},
                "inputs": [{"text": chunk["text"]} for chunk in batch],
            }
            result = await loop.run_in_executor(None, self._post_pinecone_embed, payload)
            vectors = result.get("data", [])
            if len(vectors) != len(batch):
                raise RuntimeError(f"Pinecone returned {len(vectors)} embeddings for {len(batch)} inputs")
            for chunk, vector in zip(batch, vectors):
                chunk["embedding"] = vector["values"]
        return chunks

    async def _embed_query(self, query: str) -> Optional[List[float]]:
        """Embed search query using Pinecone hosted inference (llama-text-embed-v2, 768d)."""
        if not PINECONE_API_KEY or not query.strip():
            return None
        loop = asyncio.get_event_loop()
        payload = {
            "model": EMBEDDING_MODEL,
            "parameters": {"input_type": "query", "truncate": "END", "dimension": EMBEDDING_DIM},
            "inputs": [{"text": query.strip()}],
        }
        try:
            result = await loop.run_in_executor(None, self._post_pinecone_embed, payload)
            data = result.get("data", [])
            if data and "values" in data[0]:
                return data[0]["values"]
        except Exception as exc:
            log.error(f"[RAG] Query embedding error: {exc}")
        return None
    # ── Known Clients ─────────────────────────────────────────────────────────
    def get_known_clients(self) -> List[str]:
        """
        Fetch distinct `client` metadata values from Pinecone cograg index.
        Cached in-memory for 10 minutes to ensure instant response times.
        """
        now = time.time()
        if hasattr(self, "_clients_cache") and self._clients_cache and (now - getattr(self, "_clients_cache_time", 0) < 600):
            return self._clients_cache

        known = {
            "Aarize Group", "Emaar India", "Ganga Realty", "OZAR",
            "Pyramid Infratech", "Rising Homes", "SPJ Group", "Santur Group",
            "Signature Global", "SRHU", "TVS Emerald", "Trehan IRIS"
        }

        if not self._ensure_index():
            return sorted(list(known))

        try:
            resp = self._index.query(
                vector=[0.01] * EMBEDDING_DIM,
                top_k=100,
                include_metadata=True,
                namespace=PINECONE_NAMESPACE
            )
            matches = resp.get("matches", []) if isinstance(resp, dict) else getattr(resp, "matches", [])
            for m in matches:
                meta = m.get("metadata") if isinstance(m, dict) else getattr(m, "metadata", None)
                if meta and meta.get("client"):
                    c = str(meta["client"]).strip()
                    if c:
                        known.add(c)
        except Exception as exc:
            log.warning(f"[RAG] Client discovery query error: {exc}")

        result = sorted(list(known))
        self._clients_cache = result
        self._clients_cache_time = now
        return result

    # ── Retrieval ─────────────────────────────────────────────────────────────
    async def retrieve_brand_context(
        self,
        pinecone_client_key: str,
        query: str,
        top_k: int = RETRIEVAL_TOP_K,
        media_type_bias: Optional[str] = None,
    ) -> str:
        """
        Embed query via Pinecone llama-text-embed-v2 → query cograg index
        filtered by client key → assemble context string.
        Returns empty string if retrieval fails or brand is not linked.
        """
        if not self._ensure_index() or not pinecone_client_key:
            return ""

        embedding = await self._embed_query(query)
        if not embedding:
            return ""

        try:
            pinecone_filter: Dict[str, Any] = {"client": {"$eq": pinecone_client_key}}
            if media_type_bias:
                pinecone_filter["media_type"] = {"$eq": media_type_bias}

            resp = self._index.query(
                vector=embedding,
                top_k=top_k,
                filter=pinecone_filter,
                include_metadata=True,
                namespace=PINECONE_NAMESPACE,
            )
            matches = resp.get("matches", []) if isinstance(resp, dict) else getattr(resp, "matches", [])
            if not matches:
                log.info(f"[RAG] No Pinecone results for client='{pinecone_client_key}' query='{query[:60]}'")
                return ""

            seen_texts = set()
            chunks = []
            total_tokens = 0
            for m in matches:
                meta = m.get("metadata") if isinstance(m, dict) else getattr(m, "metadata", None)
                if not meta:
                    continue
                text = (meta.get("text") or "").strip()
                if not text or text in seen_texts:
                    continue
                seen_texts.add(text)
                tokens = _count_tokens(text)
                if total_tokens + tokens > CONTEXT_TOKEN_BUDGET:
                    break
                score = m.get("score", 0) if isinstance(m, dict) else getattr(m, "score", 0)
                chunks.append({
                    "text": text,
                    "file": meta.get("file_name", "unknown"),
                    "score": round(float(score or 0), 3),
                })
                total_tokens += tokens

            if not chunks:
                return ""

            context_lines = [f"--- Brand Knowledge Base Context (top {len(chunks)} relevant excerpts) ---"]
            for i, c in enumerate(chunks, 1):
                context_lines.append(f"\n[Excerpt {i} | source: {c['file']} | relevance: {c['score']}]\n{c['text']}")
            context_lines.append("\n--- End of Brand Context ---")
            return "\n".join(context_lines)

        except Exception as exc:
            log.error(f"[RAG] Retrieval error for client='{pinecone_client_key}': {exc}")
            return ""

    # ── File Text Extraction (from DAM-Test-Repo) ────────────────────────────
    def extract_text_from_file(self, content: bytes, filename: str) -> str:
        """Extract text from PDF, DOCX, or plain text bytes."""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        if ext == "pdf":
            if not _PYPDF2_AVAILABLE:
                log.warning("[RAG] PyPDF2 not available — cannot extract PDF text.")
                return ""
            try:
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                texts = []
                for page in reader.pages:
                    t = page.extract_text() or ""
                    texts.append(t)
                return "\n".join(texts).strip()
            except Exception as exc:
                log.error(f"[RAG] PDF extraction error for {filename}: {exc}")
                return ""

        # Treat as plain text / markdown / utf-8
        try:
            return content.decode("utf-8-sig", errors="replace").strip()
        except Exception:
            try:
                return content.decode("utf-8", errors="replace").strip()
            except Exception:
                return ""

    # ── Ingestion (from DAM-Test-Repo embed_to_pinecone) ─────────────────────
    async def ingest_file(
        self,
        dam_file_id: str,
        pinecone_client_key: str,
        filename: str,
        content: bytes,
        project_id: Optional[str] = None,
        media_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Extract text → chunk (words=350, overlap=70) → embed with hosted llama-text-embed-v2 → upsert to cograg.
        Returns { success, chunk_count, error }.
        """
        if not self._ensure_index():
            return {"success": False, "chunk_count": 0, "error": "Pinecone cograg index unavailable"}

        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"
        inferred_media_type = media_type or ("images" if ext in {"jpg", "jpeg", "png", "gif", "webp", "svg"} else "pdfs" if ext == "pdf" else "docs")

        text = self.extract_text_from_file(content, filename)
        if not text:
            return {"success": False, "chunk_count": 0, "error": "Could not extract text from file"}

        chunks = chunk_text(text, chunk_words=CHUNK_TARGET_WORDS, overlap_words=CHUNK_OVERLAP_WORDS)
        if not chunks:
            return {"success": False, "chunk_count": 0, "error": "No text chunks produced"}

        try:
            await self._embed_passages(chunks)
        except Exception as emb_err:
            log.error(f"[RAG] Embedding failed: {emb_err}")
            return {"success": False, "chunk_count": 0, "error": f"Embedding failed: {emb_err}"}

        client_slug = re.sub(r"[^a-zA-Z0-9_-]", "-", pinecone_client_key).strip("-").lower()
        file_slug = re.sub(r"[^a-zA-Z0-9_-]", "-", filename).strip("-").lower()

        vectors = []
        for chunk in chunks:
            emb = chunk.get("embedding")
            if not emb:
                continue
            vector_id = f"{client_slug}_{dam_file_id}_chunk-{chunk['index']}"
            vectors.append({
                "id": vector_id,
                "values": emb,
                "metadata": {
                    "client": pinecone_client_key,
                    "file_name": filename,
                    "dam_file_id": dam_file_id,
                    "media_type": inferred_media_type,
                    "chunk_index": chunk["index"],
                    "text": chunk["text"][:3000],    # within Pinecone metadata limit
                    "project_id": project_id or "",
                    "embedding_model": EMBEDDING_MODEL,
                }
            })

        if not vectors:
            return {"success": False, "chunk_count": 0, "error": "Embedding failed for all chunks"}

        try:
            batch_size = 100
            for j in range(0, len(vectors), batch_size):
                batch = vectors[j: j + batch_size]
                self._index.upsert(vectors=batch, namespace=PINECONE_NAMESPACE)
            log.info(f"[RAG] Upserted {len(vectors)} vectors to cograg for dam_file_id={dam_file_id}, client={pinecone_client_key}")
            return {"success": True, "chunk_count": len(vectors), "error": None}
        except Exception as exc:
            log.error(f"[RAG] Upsert error for {dam_file_id}: {exc}")
            return {"success": False, "chunk_count": 0, "error": str(exc)}

    # ── Deletion ──────────────────────────────────────────────────────────────
    def delete_file_vectors(self, dam_file_id: str, pinecone_client_key: str) -> bool:
        """Delete all Pinecone vectors associated with a DAM file."""
        if not self._ensure_index():
            return False
        try:
            prefix = f"{pinecone_client_key}_{dam_file_id}_chunk-"
            try:
                ids = [v for v in self._index.list(prefix=prefix, namespace=PINECONE_NAMESPACE)]
                if ids:
                    self._index.delete(ids=ids, namespace=PINECONE_NAMESPACE)
                    log.info(f"[RAG] Deleted {len(ids)} vectors for dam_file_id={dam_file_id}")
            except Exception:
                resp = self._index.query(
                    vector=[0.0] * EMBEDDING_DIM,
                    top_k=1000,
                    filter={"dam_file_id": {"$eq": dam_file_id}},
                    include_metadata=False,
                    namespace=PINECONE_NAMESPACE,
                )
                matches = resp.get("matches", []) if isinstance(resp, dict) else getattr(resp, "matches", [])
                ids = [m["id"] if isinstance(m, dict) else m.id for m in matches]
                if ids:
                    self._index.delete(ids=ids, namespace=PINECONE_NAMESPACE)
                    log.info(f"[RAG] Deleted {len(ids)} vectors for dam_file_id={dam_file_id}")
            return True
        except Exception as exc:
            log.error(f"[RAG] Delete error for {dam_file_id}: {exc}")
            return False


# Singleton engine instance
rag_engine = RAGEngine()

