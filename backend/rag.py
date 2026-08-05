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
PINECONE_NAMESPACE   = os.getenv("PINECONE_NAMESPACE", "__default__")
GEMINI_API_KEY       = os.getenv("GOOGLE_GEMINI_API_KEY", "")
EMBEDDING_MODEL      = "intfloat/e5-base-v2"
EMBEDDING_DIM        = 768    # intfloat/e5-base-v2 dimension matching cograg index
CHUNK_TARGET_TOKENS  = 600
CHUNK_OVERLAP_RATIO  = 0.15
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


# ── Text tokeniser (fallback to char count if tiktoken missing) ───────────────
def _count_tokens(text: str) -> int:
    if _TIKTOKEN_AVAILABLE:
        try:
            enc = tiktoken.get_encoding("cl100k_base")
            return len(enc.encode(text))
        except Exception:
            pass
    return len(text) // 4   # rough fallback: 1 token ≈ 4 chars


def _split_to_chunks(text: str, target: int = CHUNK_TARGET_TOKENS, overlap_ratio: float = CHUNK_OVERLAP_RATIO) -> List[str]:
    """Split text into overlapping chunks of ~target tokens."""
    if _TIKTOKEN_AVAILABLE:
        try:
            enc = tiktoken.get_encoding("cl100k_base")
            tokens = enc.encode(text)
            step = max(1, int(target * (1 - overlap_ratio)))
            chunks = []
            for i in range(0, len(tokens), step):
                chunk_tokens = tokens[i: i + target]
                chunks.append(enc.decode(chunk_tokens))
                if i + target >= len(tokens):
                    break
            return chunks if chunks else [text]
        except Exception:
            pass

    # Char-based fallback
    char_target = target * 4
    char_step   = int(char_target * (1 - overlap_ratio))
    chunks = []
    for i in range(0, len(text), char_step):
        chunks.append(text[i: i + char_target])
        if i + char_target >= len(text):
            break
    return chunks if chunks else [text]


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


def match_brand_to_clients(brand_name: str, known_clients: List[str], tier1: float = 0.90, tier2: float = 0.60):
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
        sim = _levenshtein_ratio(norm_name, _normalize_name(client))
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
            self._index = self._pc.Index(PINECONE_INDEX_NAME)
            log.info(f"[RAG] Connected to Pinecone index '{PINECONE_INDEX_NAME}'")
            return True
        except Exception as exc:
            log.error(f"[RAG] Failed to connect to Pinecone: {exc}")
            return False

    # ── Embedding (intfloat/e5-base-v2) ───────────────────────────────────────
    def _get_model(self):
        if not hasattr(self, "_e5_model") or self._e5_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                log.info("[RAG] Loading intfloat/e5-base-v2 embedding model...")
                self._e5_model = SentenceTransformer("intfloat/e5-base-v2")
            except Exception as exc:
                log.error(f"[RAG] Failed to load intfloat/e5-base-v2: {exc}")
                self._e5_model = None
        return self._e5_model

    async def _embed(self, text: str) -> Optional[List[float]]:
        """Embed search query using intfloat/e5-base-v2 with 'query: ' prefix."""
        try:
            model = self._get_model()
            if not model:
                return None
            loop = asyncio.get_event_loop()
            # E5 models require 'query: ' prefix for asymmetric retrieval queries
            formatted_text = f"query: {text.strip()}"
            embedding = await loop.run_in_executor(
                None,
                lambda: model.encode(formatted_text, normalize_embeddings=True).tolist()
            )
            return embedding
        except Exception as exc:
            log.error(f"[RAG] E5 Query Embedding error: {exc}")
            return None

    async def _embed_document(self, text: str) -> Optional[List[float]]:
        """Embed a document chunk using intfloat/e5-base-v2 with 'passage: ' prefix."""
        try:
            model = self._get_model()
            if not model:
                return None
            loop = asyncio.get_event_loop()
            # E5 models require 'passage: ' prefix for document passages
            formatted_text = f"passage: {text.strip()}"
            embedding = await loop.run_in_executor(
                None,
                lambda: model.encode(formatted_text, normalize_embeddings=True).tolist()
            )
            return embedding
        except Exception as exc:
            log.error(f"[RAG] E5 Document Embedding error: {exc}")
            return None

    # ── Known Clients ─────────────────────────────────────────────────────────
    def get_known_clients(self) -> List[str]:
        """
        Fetch distinct `client` metadata values from Pinecone by iterating
        over indexed vector IDs and fetching metadata in batches.
        Cached in-memory for 10 minutes to ensure instant response times.
        """
        now = time.time()
        if hasattr(self, "_clients_cache") and self._clients_cache and (now - getattr(self, "_clients_cache_time", 0) < 600):
            return self._clients_cache

        if not self._ensure_index():
            return []
        try:
            clients = set()
            # Fetch sample pages of IDs from index
            raw_pages = list(self._index.list())
            vector_ids = []
            for page in raw_pages:
                for item in page:
                    item_id = item.id if hasattr(item, "id") else str(item)
                    vector_ids.append(item_id)
                if len(vector_ids) >= 200:
                    break

            # Fetch metadata in batches of 50
            batch_size = 50
            for i in range(0, min(len(vector_ids), 200), batch_size):
                batch_ids = vector_ids[i : i + batch_size]
                try:
                    fetched = self._index.fetch(ids=batch_ids, namespace=PINECONE_NAMESPACE)
                    for vec in fetched.vectors.values():
                        if vec.metadata and vec.metadata.get("client"):
                            clients.add(vec.metadata["client"].strip())
                except Exception as b_err:
                    log.warning(f"[RAG] Batch fetch error: {b_err}")

            result = sorted([c for c in clients if c])
            if result:
                self._clients_cache = result
                self._clients_cache_time = now
            return result
        except Exception as exc:
            log.error(f"[RAG] get_known_clients error: {exc}")
            return getattr(self, "_clients_cache", [])



    # ── Retrieval ─────────────────────────────────────────────────────────────
    async def retrieve_brand_context(
        self,
        pinecone_client_key: str,
        query: str,
        top_k: int = RETRIEVAL_TOP_K,
        media_type_bias: Optional[str] = None,
    ) -> str:
        """
        Embed query → Pinecone query filtered by client key → assemble context string.
        Returns empty string if retrieval fails or brand is not linked.
        """
        if not self._ensure_index():
            return ""
        if not pinecone_client_key:
            return ""

        embedding = await self._embed(query)
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
            matches = resp.get("matches", [])
            if not matches:
                log.info(f"[RAG] No Pinecone results for client='{pinecone_client_key}' query='{query[:60]}'")
                return ""

            # Dedupe by text content, trim to token budget
            seen_texts = set()
            chunks = []
            total_tokens = 0
            for m in matches:
                meta = m.get("metadata") or {}
                text = meta.get("text", "").strip()
                if not text or text in seen_texts:
                    continue
                seen_texts.add(text)
                tokens = _count_tokens(text)
                if total_tokens + tokens > CONTEXT_TOKEN_BUDGET:
                    break
                chunks.append({
                    "text": text,
                    "file": meta.get("file_name", "unknown"),
                    "score": round(m.get("score", 0), 3),
                })
                total_tokens += tokens

            if not chunks:
                return ""

            # Format as clean context block
            context_lines = [f"--- Brand Knowledge Base Context (top {len(chunks)} relevant excerpts) ---"]
            for i, c in enumerate(chunks, 1):
                context_lines.append(f"\n[Excerpt {i} | source: {c['file']} | relevance: {c['score']}]\n{c['text']}")
            context_lines.append("\n--- End of Brand Context ---")
            return "\n".join(context_lines)

        except Exception as exc:
            log.error(f"[RAG] Retrieval error for client='{pinecone_client_key}': {exc}")
            return ""

    # ── PDF Text Extraction ───────────────────────────────────────────────────
    def extract_text_from_file(self, content: bytes, filename: str) -> str:
        """Extract text from PDF or plain text bytes."""
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
        # Treat as plain text
        try:
            return content.decode("utf-8", errors="replace").strip()
        except Exception:
            return ""

    # ── Ingestion ─────────────────────────────────────────────────────────────
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
        Extract text → chunk → embed → upsert to Pinecone.
        Returns { success, chunk_count, error }.
        """
        if not self._ensure_index():
            return {"success": False, "chunk_count": 0, "error": "Pinecone unavailable"}

        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"
        inferred_media_type = media_type or ("images" if ext in {"jpg", "jpeg", "png", "gif", "webp", "svg"} else "pdfs" if ext == "pdf" else "docs")

        text = self.extract_text_from_file(content, filename)
        if not text:
            return {"success": False, "chunk_count": 0, "error": "Could not extract text from file"}

        chunks = _split_to_chunks(text)
        if not chunks:
            return {"success": False, "chunk_count": 0, "error": "No text chunks produced"}

        # Embed all chunks (sequential to respect rate limits)
        vectors = []
        for i, chunk in enumerate(chunks):
            emb = await self._embed_document(chunk)
            if not emb:
                continue
            vector_id = f"{pinecone_client_key}_{dam_file_id}_chunk-{i}"
            vectors.append({
                "id": vector_id,
                "values": emb,
                "metadata": {
                    "client":           pinecone_client_key,
                    "file_name":        filename,
                    "dam_file_id":      dam_file_id,
                    "media_type":       inferred_media_type,
                    "chunk_index":      i,
                    "text":             chunk[:3000],    # cap at Pinecone metadata limit
                    "project_id":       project_id or "",
                    "embedding_model":  EMBEDDING_MODEL,
                }
            })
            # Small delay between embed calls to avoid rate limiting
            if (i + 1) % 5 == 0:
                await asyncio.sleep(0.2)

        if not vectors:
            return {"success": False, "chunk_count": 0, "error": "Embedding failed for all chunks"}

        # Upsert in batches of 100
        try:
            batch_size = 100
            for j in range(0, len(vectors), batch_size):
                batch = vectors[j: j + batch_size]
                self._index.upsert(vectors=batch, namespace=PINECONE_NAMESPACE)
            log.info(f"[RAG] Upserted {len(vectors)} vectors for dam_file_id={dam_file_id}, client={pinecone_client_key}")
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
            # Pinecone v3: delete by ID prefix using list + delete
            prefix = f"{pinecone_client_key}_{dam_file_id}_chunk-"
            try:
                # Try list (serverless)
                ids = [v for v in self._index.list(prefix=prefix, namespace=PINECONE_NAMESPACE)]
                if ids:
                    self._index.delete(ids=ids, namespace=PINECONE_NAMESPACE)
                    log.info(f"[RAG] Deleted {len(ids)} vectors for dam_file_id={dam_file_id}")
            except AttributeError:
                # Fallback for pod-based indexes: query by metadata then delete
                dummy = [0.0] * EMBEDDING_DIM
                resp = self._index.query(
                    vector=dummy,
                    top_k=1000,
                    filter={"dam_file_id": {"$eq": dam_file_id}},
                    include_metadata=False,
                    namespace=PINECONE_NAMESPACE,
                )
                ids = [m["id"] for m in resp.get("matches", [])]
                if ids:
                    self._index.delete(ids=ids, namespace=PINECONE_NAMESPACE)
                    log.info(f"[RAG] Deleted {len(ids)} vectors for dam_file_id={dam_file_id}")
            return True
        except Exception as exc:
            log.error(f"[RAG] Delete error for {dam_file_id}: {exc}")
            return False


# Singleton engine instance
rag_engine = RAGEngine()
