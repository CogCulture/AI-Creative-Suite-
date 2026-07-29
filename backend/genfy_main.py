import sys
import uvicorn
import os
import warnings

# Force UTF-8 output on Windows to prevent UnicodeEncodeError from box-drawing
# characters (──, ━━, etc.) in print statements when the console uses cp1252.
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Suppress Pydantic shadowing warnings from libraries (like google-genai)
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")
import io
import time
import base64
import jwt  # pyjwt
import httpx
import json
import openai as openai_lib
import uuid
from datetime import datetime
import asyncio
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# --- AUTH AND DATABASE IMPORTS ---
from sqlalchemy.orm import Session
from database.db import get_db, init_db, SessionLocal
from database.models import User, Session as DBSession, Image as DBImage, CompareSession as DBCompareSession, CompareImage as DBCompareImage
from database.storyboard_models import Storyboard, StoryboardCharacter, StoryboardFrame
from utils.auth_middleware import get_current_user, get_optional_user
from routes.users import router as users_router
# ---------------------------------

# Import Google GenAI
from google import genai
from google.genai import types
from PIL import Image

# Load environment variables — override=True ensures .env always wins over stale shell exports
load_dotenv(override=True)
PROJECT_ID    = os.environ.get("GCP_PROJECT_ID")       # Vertex AI fallback
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")       # Google AI Studio (preferred)
KLING_API_KEY  = os.environ.get("KLING_API_KEY")
KLING_API_SECRET = os.environ.get("KLING_API_SECRET")
KLING_BASE_URL = "https://api.klingai.com"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
BFL_API_KEY    = os.environ.get("BFL_API_KEY")

# ── GLOBAL GEMINI CLIENTS ───────────────────────────────────────────────────
# Prefer Vertex AI (GCP_PROJECT_ID) as it handles high-volume image generation cleanly.
# Falls back to Google AI Studio (GEMINI_API_KEY) if GCP is not configured.
if PROJECT_ID:
    print("[Gemini] Using Vertex AI (GCP_PROJECT_ID) - Most reliable for image generation")
    global_client = genai.Client(vertexai=True, project=PROJECT_ID, location="global")
    flash_client  = genai.Client(vertexai=True, project=PROJECT_ID, location="us-central1")
elif GEMINI_API_KEY:
    print("[Gemini] Using Google AI Studio key (GEMINI_API_KEY) - Note: Free tier blocks image generation")
    global_client = genai.Client(api_key=GEMINI_API_KEY)
    flash_client  = genai.Client(api_key=GEMINI_API_KEY)
else:
    # Neither key set — clients will be None; _gemini_generate will raise a clear error.
    global_client = None
    flash_client  = None

# Simple in-memory cache for prompt sanitization (+ prompt: target prompt)
SANITIZATION_CACHE: Dict[str, str] = {}


class ContentBlockedError(Exception):
    """Raised when a model blocks the prompt due to content policy.
    Caught by model orchestrators to trigger the prompt sanitizer middleman."""
    pass

app = FastAPI(title="Genfy Studio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Production domain
        "http://genfyy.in",
        "https://genfyy.in",
        "http://www.genfyy.in",
        "https://www.genfyy.in",
        # Local development
        "http://localhost:3000",
        "http://localhost:3005",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3005",
        # Docker internal (Next.js → FastAPI rewrites inside same compose network)
        "http://genfy-frontend:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Auth Router
from routes.auth import router as auth_router
from routes.history import router as history_router
from routes.storyboard import router as storyboard_router
from fastapi.staticfiles import StaticFiles

app.mount("/exports", StaticFiles(directory="exports"), name="exports")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(history_router)
app.include_router(storyboard_router)

# Initialize database
@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/health")
async def health_check():
    """Health check endpoint for Docker and load balancers."""
    return {"status": "ok"}


def _utcnow() -> datetime:
    return datetime.utcnow()


def _trial_is_active(user: User) -> bool:
    if not getattr(user, "is_trial", False) or not getattr(user, "trial_ends_at", None):
        return False
    return _utcnow() < user.trial_ends_at


def _generation_access_error(user: User) -> Optional[HTTPException]:
    if not user.email_verified:
        return HTTPException(status_code=403, detail="Please verify your email first.")
    if _trial_is_active(user):
        return None
    if user.plan_type != "not_selected":
        return None
    return HTTPException(status_code=402, detail="Please select a plan to continue.")


def _ensure_session_owner(db: Session, session_id: str, user_id: str) -> None:
    session = db.query(DBSession.id).filter(DBSession.id == session_id, DBSession.user_id == user_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")


def _ensure_compare_session_owner(db: Session, compare_session_id: str, user_id: str) -> None:
    session = db.query(DBCompareSession.id).filter(
        DBCompareSession.id == compare_session_id,
        DBCompareSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Compare session not found")


class GenerateRequest(BaseModel):
    prompt: str
    ratio: str
    quality: str
    categories: dict[str, str]
    models: List[str] = Field(default_factory=list)
    image_base64: Optional[str] = None
    chatgpt_model: str = "gpt-image-2"
    session_id: Optional[str] = None
    prompt_history: Optional[List[str]] = None   # Chronological list of past prompts for this image lineage


class RecommendRequest(BaseModel):
    selections: Dict[str, str]
    prompt: Optional[str] = ""

class AnalyzeRequest(BaseModel):
    image_base64: str
    categories_context: Optional[str] = None


# ── VISION ANALYSIS CONFIG ───────────────────────────────────────────────────
# Model cascade for vision analysis: tries each in order, retrying up to
# MAX_RETRIES_PER_MODEL times with exponential backoff before moving to next.
VISION_MODELS = [
    "gemini-2.5-flash",
]
MAX_RETRIES_PER_MODEL = 3
BASE_RETRY_DELAY = 2  # seconds, doubles each retry

class SessionCreateRequest(BaseModel):
    prompt: str
    model_ids: List[str]
    active_configs: dict = Field(default_factory=dict)
    parent_session_id: Optional[str] = None
    reference_image_id: Optional[str] = None
    ratio: str = "1:1"
    quality: str = "Standard"
    image_base64: Optional[str] = None

class CompareStartRequest(BaseModel):
    prompt: str
    models: List[str]
    ratio: str = "1:1"
    quality: str = "Standard"
    categories: dict = Field(default_factory=dict)
    image_base64: Optional[str] = None
    chatgpt_model: str = "gpt-image-2"
    session_id: Optional[str] = None

class CompareFeedbackRequest(BaseModel):
    feedbacks: Dict[str, str]   # { modelId: feedbackText }
    ratio: str = "1:1"
    quality: str = "Standard"
    image_base64: Optional[str] = None

class EditImageRequest(BaseModel):
    edit_prompt: str
    reference_image_id: Optional[str] = None
    config_overrides: Optional[dict[str, str]] = None
    image_base64: Optional[str] = None
    ratio: str = "1:1"
    quality: str = "standard"


# ── MAPPINGS ────────────────────────────────────────────────────────────────

RATIO_MAP = {
    "1:1": "1:1",
    "1:4": "1:4",
    "1:8": "1:8",
    "2:3": "2:3",
    "3:2": "3:2",
    "3:4": "3:4",
    "4:1": "4:1",
    "4:3": "4:3",
    "4:5": "4:5",
    "5:4": "5:4",
    "8:1": "8:1",
    "9:16": "9:16",
    "16:9": "16:9",
    "21:9": "21:9",
}

QUALITY_MAP = {
    "Standard": "1K",
    "High": "2K",
    "Ultra": "4K",
}

# Kling supported ratios
KLING_RATIO_MAP = {
    "1:1": "1:1",
    "1:4": "1:4",
    "1:8": "1:8",
    "2:3": "2:3",
    "3:2": "3:2",
    "3:4": "3:4",
    "4:1": "4:1",
    "4:3": "4:3",
    "4:5": "4:5",
    "5:4": "5:4",
    "8:1": "8:1",
    "9:16": "9:16",
    "16:9": "16:9",
    "21:9": "21:9",
}


# ── KLING HELPERS ────────────────────────────────────────────────────────────

def _kling_jwt() -> str:
    """Generate a short-lived JWT for Kling API authentication."""
    now = int(time.time())
    payload = {
        "iss": KLING_API_KEY,
        "exp": now + 1800,  # 30 minutes
        "nbf": now - 5,
    }
    token = jwt.encode(payload, KLING_API_SECRET, algorithm="HS256")
    return token


async def _kling_generate(prompt: str, ratio: str, image_b64: Optional[str] = None, quality: str = "Standard") -> List[str]:
    """Call Kling image generation API and poll until done. Returns list of image URLs."""
    if not KLING_API_KEY or not KLING_API_SECRET:
        raise HTTPException(status_code=500, detail="KLING_API_KEY / KLING_API_SECRET not set in .env")

    token = _kling_jwt()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    kling_ratio = KLING_RATIO_MAP.get(ratio, "1:1")

    payload: dict = {
        "model_name": "kling-v1",
        "prompt": prompt,
        "aspect_ratio": kling_ratio,
        "n": 1,
    }

    # Add reference image if provided
    if image_b64:
        b64_str = image_b64
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        payload["image"] = b64_str

    print(f"[Kling] Submitting generation task. Ratio: {kling_ratio}")

    async with httpx.AsyncClient(timeout=90) as client:
        # Submit the task
        resp = await client.post(
            f"{KLING_BASE_URL}/v1/images/generations",
            json=payload,
            headers=headers,
        )

        print(f"[Kling] Submit response: {resp.status_code} {resp.text[:400]}")

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Kling API error: {resp.text}")

        data = resp.json()

        # Extract task_id
        task_id = None
        try:
            task_id = data["data"]["task_id"]
        except (KeyError, TypeError):
            # Some versions return data directly as list
            try:
                task_id = data["data"][0]["task_id"]
            except Exception:
                pass

        if not task_id:
            # Maybe images are returned directly (synchronous mode)
            images = _extract_kling_images(data)
            if images:
                return images
            raise HTTPException(status_code=502, detail=f"Kling: no task_id in response: {data}")

        print(f"[Kling] Task ID: {task_id}. Polling for result...")

        # Poll for completion (max 120s)
        for attempt in range(40):
            await _async_sleep(3)

            # Re-generate token if needed (each 30 min expiry, but we're safe here)
            poll_token = _kling_jwt()
            poll_headers = {
                "Authorization": f"Bearer {poll_token}",
                "Content-Type": "application/json",
            }

            poll_resp = await client.get(
                f"{KLING_BASE_URL}/v1/images/generations/{task_id}",
                headers=poll_headers,
            )

            print(f"[Kling] Poll attempt {attempt+1}: {poll_resp.status_code}")

            if poll_resp.status_code != 200:
                continue

            poll_data = poll_resp.json()
            status = ""
            try:
                status = poll_data["data"]["task_status"]
            except (KeyError, TypeError):
                pass

            print(f"[Kling] Task status: {status}")

            if status == "succeed":
                return _extract_kling_images(poll_data)
            elif status == "failed":
                err = poll_data.get("data", {}).get("task_status_msg", "Unknown error")
                raise HTTPException(status_code=502, detail=f"Kling task failed: {err}")
            # else: still processing, keep polling

        raise HTTPException(status_code=504, detail="Kling task timed out after 120 seconds")


def _extract_kling_images(data: dict) -> List[str]:
    """Extract image URLs from Kling API response."""
    urls = []
    try:
        works = data["data"].get("task_result", {}).get("images", [])
        for img in works:
            url = img.get("url") or img.get("image_url")
            if url:
                urls.append(url)
    except Exception:
        pass
    return urls


async def _materialize_image_url(url: Optional[str]) -> Optional[str]:
    """Convert remote image URLs into durable data URIs when possible.
    
    IMPORTANT: Also downloads BFL/Flux images immediately because their signed URLs expire.
    """
    if not url:
        return url
    if url.startswith("data:image"):
        return url
    if not url.startswith(("http://", "https://")):
        return url

    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "image/png").split(";")[0].strip() or "image/png"
            b64 = base64.b64encode(resp.content).decode("ascii")
            return f"data:{content_type};base64,{b64}"
    except Exception as e:
        print(f"[_materialize_image_url] Failed to download {url[:80]}...: {e}")
        return url


async def _async_sleep(seconds: float):
    """Async-compatible sleep."""
    import asyncio
    await asyncio.sleep(seconds)


# ── GEMINI HELPER ─────────────────────────────────────────────────────────────

async def _sanitize_prompt(original_prompt: str) -> str:
    """Use gemini-2.5-flash to rewrite a prompt that triggered IMAGE_PROHIBITED_CONTENT.
    Replaces copyrighted characters / real people with generic visual descriptions,
    while preserving scene context and action details.
    """
    if original_prompt in SANITIZATION_CACHE:
        print(f"[Middleman] Using cached sanitized prompt.")
        return SANITIZATION_CACHE[original_prompt]

    print(f"[Middleman] Sanitizing blocked prompt: {original_prompt[:120]}")

    system_instruction = (
        "You are a prompt rewriter for an AI image generation tool. "
        "The user's original prompt was blocked because it references copyrighted characters, "
        "trademarked intellectual property, or real living people. "
        "Your task: rewrite the prompt so it describes the SAME scene and action, "
        "but replaces any copyrighted/real-person references with vivid, generic visual descriptions "
        "(e.g. instead of 'Thanos' write 'a massive purple-skinned alien warlord in golden armor'). "
        "Keep the rewritten prompt concise and suitable for image generation. "
        "Output ONLY the rewritten prompt text, no explanation, no quotes."
    )

    # Vertex AI uses specific model IDs; 'gemini-flash-latest' only works on Google AI Studio
    SANITIZER_MODELS = ["gemini-2.5-flash-lite", "gemini-1.5-flash"]

    # ── Attempt: Gemini Flash (with Vertex-compatible model names) ──
    gemini_client = flash_client if flash_client else global_client
    if gemini_client:
        for sanitizer_model in SANITIZER_MODELS:
            MAX_SANITIZATION_RETRIES = 2
            for attempt in range(MAX_SANITIZATION_RETRIES):
                try:
                    if attempt > 0:
                        await asyncio.sleep(2 * attempt)
                    response = gemini_client.models.generate_content(
                        model=sanitizer_model,
                        contents=[f"Rewrite this image generation prompt:\n\n{original_prompt}"],
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.4,
                        ),
                    )
                    sanitized = response.text.strip()
                    SANITIZATION_CACHE[original_prompt] = sanitized
                    print(f"[Middleman] [OK] Rewritten via {sanitizer_model}: {sanitized[:200]}")
                    return sanitized
                except Exception as e:
                    err_str = str(e)
                    print(f"[Middleman] {sanitizer_model} attempt {attempt+1} failed: {err_str[:150]}")
                    if "503" in err_str or "high demand" in err_str.lower():
                        continue  # retry same model
                    break  # try next model

    # ── Fallback: GPT-4o-mini rewrite ──
    if OPENAI_API_KEY:
        try:
            print("[Middleman] Gemini sanitizer unavailable, using GPT-4o-mini...")
            oai_client = openai_lib.OpenAI(api_key=OPENAI_API_KEY)
            resp = await asyncio.to_thread(
                oai_client.chat.completions.create,
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": f"Rewrite this image generation prompt:\n\n{original_prompt}"},
                ],
                max_tokens=300,
                temperature=0.4,
            )
            sanitized = resp.choices[0].message.content.strip()
            SANITIZATION_CACHE[original_prompt] = sanitized
            print(f"[Middleman] [OK] Rewritten via GPT-4o-mini: {sanitized[:200]}")
            return sanitized
        except Exception as e:
            print(f"[Middleman] GPT-4o-mini fallback failed: {e}")

    print(f"[Middleman] All sanitization attempts failed. Using original prompt.")
    return original_prompt



def _extract_images_from_response(response) -> List[str]:
    """Parse a Gemini response and return base64 data URIs. Returns empty list if blocked."""
    results = []
    if not response.candidates:
        return results
    candidate = response.candidates[0]
    if not candidate.content or not candidate.content.parts:
        return results
    for part in candidate.content.parts:
        if part.inline_data and part.inline_data.data:
            raw_bytes = part.inline_data.data
            mime = getattr(part.inline_data, 'mime_type', None) or 'image/png'
            data_len = len(raw_bytes) if raw_bytes else 0
            print(f"[Gemini] Image part: mime={mime}, size={data_len} bytes, magic={raw_bytes[:4].hex()}")

            # ── Step 1: Detect if Vertex AI returned already-base64-encoded bytes ──
            # Vertex AI sometimes returns the image as a base64 string stored as bytes
            # (e.g. b'iVBOR...' which is base64 of \x89PNG).
            # Detect this by checking if all bytes are valid base64 ASCII characters.
            image_bytes = raw_bytes  # default: assume raw binary
            try:
                decoded_str = raw_bytes.decode('ascii')
                # If it decodes as ASCII and looks like base64 (alphanumeric + /+=)
                import re as _re
                if _re.match(r'^[A-Za-z0-9+/=\r\n]+$', decoded_str.strip()):
                    decoded = base64.b64decode(decoded_str.strip())
                    print(f"[Gemini] Detected pre-encoded base64 from Vertex AI, decoded to {len(decoded)} bytes, magic={decoded[:4].hex()}")
                    image_bytes = decoded  # use the decoded raw image bytes
            except Exception:
                pass  # Not ASCII/base64, treat as raw binary

            # ── Step 2: Try PIL (re-encodes to clean PNG) ──
            try:
                gen_img = Image.open(io.BytesIO(image_bytes))
                buffer = io.BytesIO()
                gen_img.save(buffer, format="PNG")
                b64_img = base64.b64encode(buffer.getvalue()).decode("utf-8")
                results.append(f"data:image/png;base64,{b64_img}")
                print(f"[Gemini] [OK] Image extracted via PIL ({gen_img.size})")
                continue
            except Exception as pil_err:
                print(f"[Gemini] PIL failed: {pil_err}. Trying raw base64...")

            # ── Step 3: Use image_bytes directly with magic-byte detection ──
            try:
                b64_img = base64.b64encode(image_bytes).decode("utf-8")
                if image_bytes[:2] == b'\xff\xd8':  # JPEG
                    results.append(f"data:image/jpeg;base64,{b64_img}")
                    print(f"[Gemini] [OK] Image extracted as raw JPEG ({len(image_bytes)} bytes)")
                elif image_bytes[:4] == b'\x89PNG':  # PNG
                    results.append(f"data:image/png;base64,{b64_img}")
                    print(f"[Gemini] [OK] Image extracted as raw PNG ({len(image_bytes)} bytes)")
                elif image_bytes[:4] == b'RIFF':  # WebP
                    results.append(f"data:image/webp;base64,{b64_img}")
                    print(f"[Gemini] [OK] Image extracted as raw WebP ({len(image_bytes)} bytes)")
                else:
                    results.append(f"data:{mime};base64,{b64_img}")
                    print(f"[Gemini] [OK] Image extracted as raw {mime} ({len(image_bytes)} bytes, magic: {image_bytes[:4].hex()})")
            except Exception as raw_err:
                print(f"[Gemini] Raw base64 also failed: {raw_err}")
    return results


async def _gemini_generate(prompt: str, ratio: str, quality: str, image_b64: Optional[str] = None) -> List[str]:
    """Generate with Google Gemini (Nanobanana) and return base64 data URIs.
    
    Route B middleman: if the first attempt is blocked with IMAGE_PROHIBITED_CONTENT,
    the prompt is automatically rewritten by gemini-2.5-flash and retried once.
    """
    if not PROJECT_ID and not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Neither GCP_PROJECT_ID nor GEMINI_API_KEY set in backend .env")

    gemini_ratio = RATIO_MAP.get(ratio, "1:1")
    # Normalize quality to Title Case so "ultra", "Ultra", "ULTRA" all resolve
    gemini_quality = QUALITY_MAP.get(quality.strip().title(), "1K")

    print(f"[Gemini] Quality received: '{quality}' → resolved to: '{gemini_quality}'. Ratio: {gemini_ratio}")
    print(f"[Gemini] Realized prompt: {prompt[:100]}...")
    
    if GEMINI_API_KEY:
        client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        client = genai.Client(vertexai=True, project=PROJECT_ID, location="global")

    # Build the image part list (without the text prompt — added inside helper)
    image_parts = []
    if image_b64:
        b64_str = str(image_b64)
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        try:
            image_bytes = base64.b64decode(b64_str)
            image_parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
        except Exception as e:
            print("Error decoding uploaded image:", e)

    # ── Attempt 1: original prompt ──────────────────────────────────────────
    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-3.1-flash-image-preview",
        contents=image_parts + [prompt],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio=gemini_ratio,
                image_size=gemini_quality,
            ),
        ),
    )

    # Check if blocked by IMAGE_PROHIBITED_CONTENT → trigger the middleman
    blocked = False
    if not response.candidates:
        blocked = True
    else:
        candidate = response.candidates[0]
        if not candidate.content or not candidate.content.parts:
            finish = str(getattr(candidate, 'finish_reason', 'UNKNOWN'))
            if "IMAGE_PROHIBITED_CONTENT" in finish:
                blocked = True
            else:
                raise HTTPException(status_code=400, detail=f"Image generation failed. Reason: {finish}")

    if not blocked:
        results = _extract_images_from_response(response)
        if results:
            return results

    # ── Attempt 2: middleman rewrite + retry ────────────────────────────────
    print("[Gemini] Blocked by IMAGE_PROHIBITED_CONTENT — invoking prompt middleman...")
    sanitized_prompt = await _sanitize_prompt(prompt)

    # Use us-central1 client for the retry (same region as vision)
    if GEMINI_API_KEY:
        retry_client = genai.Client(api_key=GEMINI_API_KEY)
    else:
        retry_client = genai.Client(vertexai=True, project=PROJECT_ID, location="global")
    retry_response = await asyncio.to_thread(
        retry_client.models.generate_content,
        model="gemini-3.1-flash-image-preview",
        contents=image_parts + [sanitized_prompt],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
            image_config=types.ImageConfig(
                aspect_ratio=gemini_ratio,
                image_size=gemini_quality,
            ),
        ),
    )

    if not retry_response.candidates:
        raise HTTPException(status_code=400, detail="Blocked by content policy even after prompt rewrite.")

    retry_candidate = retry_response.candidates[0]
    if not retry_candidate.content or not retry_candidate.content.parts:
        finish = str(getattr(retry_candidate, 'finish_reason', 'UNKNOWN'))
        raise HTTPException(status_code=400, detail=f"Retry also blocked. Reason: {finish}")

    results = _extract_images_from_response(retry_response)
    if results:
        print(f"[Middleman] Retry succeeded with sanitized prompt.")
    return results


# ── CHATGPT IMAGE QUALITY PIPELINE ────────────────────────────────────────────
# Mirrors the Nanobanana quality.py approach for maximum image fidelity

CHATGPT_QUALITY_SUFFIX = (
    "ultra high quality, maximum detail, 8K resolution, masterpiece, "
    "sharp crisp edges, photorealistic textures, correct anatomy, "
    "coherent background, no artifacts, no noise, no distortion, "
    "professional studio lighting, accurate perspective, flawless render"
)

CHATGPT_ARTIFACT_GUARDS = (
    "clean edges and boundaries, "
    "correct proportions throughout, "
    "coherent background without smearing, "
    "accurate facial features if present, "
    "natural smooth skin tones if present, "
    "proper hands and fingers if present, "
    "realistic material surfaces"
)

CHATGPT_CONSISTENCY_BONUS = (
    "consistent lighting, consistent color palette, consistent mood"
)

# ── SHARED QUALITY PIPELINE ──
# Mirrors the original logic added for ChatGPT to ensure high-fidelity generation across all models.
# (Logic originally from quality.py)

CHATGPT_VALID_MODELS = {
    "chatgpt-image-latest",
    "gpt-image-2",
    "gpt-image-1.5",
    "gpt-image-1",
    "gpt-image-1-mini",
    "dall-e-3",
    "dall-e-2",
}


def _build_chatgpt_enhanced_prompt(user_prompt: str, quality: str = "Standard") -> str:
    """Inject quality suffix + artifact guards into the user prompt (Nanobanana style)."""
    parts = [user_prompt.strip()]
    parts.append(CHATGPT_ARTIFACT_GUARDS)
    parts.append(CHATGPT_QUALITY_SUFFIX)
    parts.append(CHATGPT_CONSISTENCY_BONUS)
    return ", ".join(p.strip(", ") for p in parts if p)

def _build_nanobanana_enhanced_prompt(user_prompt: str, quality: str = "Standard") -> str:
    parts = [user_prompt.strip()]
    parts.append(CHATGPT_ARTIFACT_GUARDS)
    parts.append(CHATGPT_QUALITY_SUFFIX)
    parts.append(CHATGPT_CONSISTENCY_BONUS)
    return ", ".join(p.strip(", ") for p in parts if p)

def _build_kling_enhanced_prompt(user_prompt: str, quality: str = "Standard") -> str:
    parts = [user_prompt.strip(), CHATGPT_ARTIFACT_GUARDS]
    parts.append(CHATGPT_QUALITY_SUFFIX)
    parts.append(CHATGPT_CONSISTENCY_BONUS)
    return ", ".join(p.strip(", ") for p in parts if p)

def _build_flux_enhanced_prompt(user_prompt: str, quality: str = "Standard") -> str:
    parts = [user_prompt.strip(), CHATGPT_ARTIFACT_GUARDS]
    parts.append(CHATGPT_QUALITY_SUFFIX)
    parts.append(CHATGPT_CONSISTENCY_BONUS)
    return ", ".join(p.strip(", ") for p in parts if p)

def _build_openai_enhanced_prompt(user_prompt: str, quality: str = "Standard") -> str:
    return f"{user_prompt.strip()}. {CHATGPT_QUALITY_SUFFIX} {CHATGPT_CONSISTENCY_BONUS}"


async def _chatgpt_image_generate(
    prompt: str,
    ratio: str,
    quality: str = "Standard",
    image_b64: Optional[str] = None,
    model: str = "gpt-image-2",
) -> List[str]:
    """Generate image via OpenAI ChatGPT Image models.

    Supports:
      - chatgpt-image-latest  (default in UI)
      - gpt-image-2         (state-of-the-art)
      - gpt-image-1           (previous gen)
      - gpt-image-1-mini      (cost-efficient)

    When image_b64 is provided, uses images.edit() endpoint (reference-based generation).
    Otherwise uses images.generate() endpoint (text-only).

    Returns list of base64 data URIs (same format as Gemini).
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set in .env")

    # Validate model name
    if model not in CHATGPT_VALID_MODELS:
        model = "gpt-image-2"

    # Map ratio -> pixel dimensions
    size_map = {
        "1:1":  "1024x1024",
        "16:9": "1536x1024",
        "9:16": "1024x1536",
    }
    size = size_map.get(ratio, "1024x1024")

    # API quality param: "high" for High/Ultra, "low" for Standard
    api_quality = "high" if quality in ("High", "Ultra") else "low"

    # Enhance prompt with quality pipeline
    enhanced_prompt = _build_chatgpt_enhanced_prompt(prompt, quality)

    print(f"[ChatGPT] Model: {model}, Size: {size}, Quality: {api_quality}")
    print(f"[ChatGPT] Enhanced prompt: {enhanced_prompt[:150]}...")
    print(f"[ChatGPT] Reference image: {image_b64 is not None}")

    # _try_generate_chatgpt: takes the active cascade model as a parameter
    # so each cascade step uses the correct model (not the outer `model` param)
    async def _try_generate_chatgpt(use_prompt: str, active_model: str, active_client, active_size: str, active_quality: str):
        try:
            if image_b64:
                return await _chatgpt_with_reference(
                    active_client, use_prompt, active_model, active_size, active_quality, image_b64
                )
            else:
                return await _chatgpt_from_text(
                    active_client, use_prompt, active_model, active_size, active_quality
                )
        except Exception as e:
            err_str = str(e).lower()
            if any(x in err_str for x in ["moderation", "content policy", "safety system", "rejected", "blocked"]):
                return "BLOCKED"
            raise

    # ── MODEL CASCADE: try each model until one succeeds ──
    # Order: gpt-image-2 (best, needs org verify) → gpt-image-1.5 → chatgpt-image-latest → gpt-image-1 → gpt-image-1-mini → dall-e-3 (always works)
    CHATGPT_MODEL_CASCADE = [
        "gpt-image-2", 
        "gpt-image-1.5", 
        "chatgpt-image-latest", 
        "gpt-image-1", 
        "gpt-image-1-mini", 
        "dall-e-3", 
        "dall-e-2"
    ]
    # Build cascade starting from the user's chosen model
    if model not in CHATGPT_MODEL_CASCADE:
        model = "gpt-image-1"  # safe default
    cascade_start = CHATGPT_MODEL_CASCADE.index(model)
    model_cascade = CHATGPT_MODEL_CASCADE[cascade_start:]

    # dall-e-3 uses different size/quality params
    DALLE3_SIZE_MAP = {
        "1:1": "1024x1024", "16:9": "1792x1024", "9:16": "1024x1792",
    }

    last_model_error: Optional[Exception] = None
    for cascade_model in model_cascade:
        try:
            cascade_client = openai_lib.OpenAI(api_key=OPENAI_API_KEY)

            # Adjust size/quality for this specific model
            if cascade_model in ("dall-e-3", "dall-e-2"):
                cascade_size = DALLE3_SIZE_MAP.get(ratio, "1024x1024")
                cascade_quality = "hd" if quality in ("High", "Ultra") else "standard"
            else:
                cascade_size = size
                cascade_quality = api_quality

            print(f"[ChatGPT] Trying cascade model: {cascade_model}, size={cascade_size}, quality={cascade_quality}")

            MAX_RETRIES = 2
            for retry in range(MAX_RETRIES):
                try:
                    if retry > 0:
                        backoff = 3 * retry
                        print(f"[ChatGPT] Retry {retry}/{MAX_RETRIES-1} for {cascade_model} (backoff {backoff}s)...")
                        await asyncio.sleep(backoff)

                    res = await _try_generate_chatgpt(enhanced_prompt, cascade_model, cascade_client, cascade_size, cascade_quality)

                    if res == "BLOCKED":
                        print("[ChatGPT] Blocked by content policy — invoking prompt middleman...")
                        sanitized = await _sanitize_prompt(prompt)
                        enhanced_sanitized = _build_chatgpt_enhanced_prompt(sanitized, quality)
                        res = await _try_generate_chatgpt(enhanced_sanitized, cascade_model, cascade_client, cascade_size, cascade_quality)
                        if res == "BLOCKED":
                            res = await _try_generate_chatgpt(sanitized, cascade_model, cascade_client, cascade_size, cascade_quality)
                        if res == "BLOCKED":
                            raise HTTPException(status_code=400, detail="ChatGPT blocked even after prompt rewrites.")

                    return res

                except openai_lib.RateLimitError as rle:
                    print(f"[ChatGPT] RateLimitError on {cascade_model} (attempt {retry+1}): {rle}")
                    last_model_error = rle
                    if retry < MAX_RETRIES - 1:
                        continue
                    raise
                except openai_lib.InternalServerError as ise:
                    print(f"[ChatGPT] InternalServerError on {cascade_model} (attempt {retry+1}): {ise}")
                    last_model_error = ise
                    if retry < MAX_RETRIES - 1:
                        continue
                    raise

        except openai_lib.BadRequestError as e:
            print(f"[ChatGPT] BadRequestError on {cascade_model}: {e}")
            raise HTTPException(status_code=502, detail=f"ChatGPT bad request: {e}")
        except openai_lib.AuthenticationError as e:
            print(f"[ChatGPT] AuthenticationError: {e}")
            raise HTTPException(status_code=502, detail="Invalid OpenAI API key.")
        except Exception as e:
            err_str = str(e)
            last_model_error = e
            # 403 = org not verified for THIS model — skip immediately, don't retry
            if "403" in err_str or "must be verified" in err_str or "PermissionDeniedError" in err_str:
                print(f"[ChatGPT] {cascade_model}: org not verified / no access (403), skipping to next model")
            else:
                print(f"[ChatGPT] {cascade_model} failed: {err_str[:200]}. Trying next model...")
            continue

    raise HTTPException(
        status_code=502,
        detail=f"ChatGPT: all models in cascade failed. Last error: {last_model_error}"
    )


async def _chatgpt_from_text(client, prompt, model, size, quality) -> List[str]:
    """Generate from text prompt only via images.generate()."""
    print(f"[ChatGPT] Calling images.generate (text-only) with {model}")
    response = await asyncio.to_thread(
        client.images.generate,
        model=model,
        prompt=prompt,
        n=1,
        size=size,
        quality=quality,
    )
    return await _chatgpt_extract_images(response)


async def _chatgpt_with_reference(client, prompt, model, size, quality, ref_b64) -> List[str]:
    print(f"[ChatGPT] Calling images.edit (with reference) with {model}")

    # Decode and resize reference to match target size
    b64_str = str(ref_b64)
    if "," in b64_str:
        b64_str = b64_str.split(",")[1]
    img_bytes = base64.b64decode(b64_str)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    w, h = map(int, size.split("x"))
    if img.size != (w, h):
        img = img.resize((w, h), Image.LANCZOS)

    # Save to PNG bytes
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    ref_png_bytes = buf.getvalue()

    # Wrap in BytesIO with filename for SDK
    ref_file = io.BytesIO(ref_png_bytes)
    ref_file.name = "reference.png"

    response = await asyncio.to_thread(
        client.images.edit,
        model=model,
        image=ref_file,
        prompt=prompt,
        n=1,
        size=size,
    )
    return await _chatgpt_extract_images(response)


async def _chatgpt_extract_images(response) -> List[str]:
    """Extract image data from OpenAI response and return as base64 data URIs."""
    if not hasattr(response, 'data') or response.data is None or len(response.data) == 0:
        print(f"[ChatGPT] No image data in response")
        return []

    results = []
    async with httpx.AsyncClient(timeout=30) as client:
        for item in response.data:
            image_data = None
            # Try URL first
            if hasattr(item, 'url') and item.url is not None:
                print(f"[ChatGPT] Fetching image from URL...")
                img_resp = await client.get(item.url)
                img_resp.raise_for_status()
                image_data = img_resp.content
            # Try base64
            elif hasattr(item, 'b64_json') and item.b64_json is not None:
                print(f"[ChatGPT] Using base64 from response")
                image_data = base64.b64decode(item.b64_json)
            else:
                print(f"[ChatGPT] No URL or base64 in response item")
                continue

            b64 = base64.b64encode(image_data).decode("utf-8")
            results.append(f"data:image/png;base64,{b64}")
            print(f"[ChatGPT] Image extracted successfully (b64 len: {len(b64)})")

    return results


# ── FLUX.1 (Black Forest Labs) ───────────────────────────────────────────────

async def _flux_generate(prompt: str, ratio: str, quality: str = "Standard", image_b64: Optional[str] = None) -> List[str]:
    """Generate image via BFL Flux Pro 1.1. Returns base64 data URIs."""
    if not BFL_API_KEY:
        raise HTTPException(status_code=500, detail="BFL_API_KEY not set in .env")

    # Map ratio to width/height
    ratio_to_wh = {
        "1:1": (1024, 1024), "16:9": (1456, 816), "9:16": (816, 1456),
        "4:3": (1216, 896), "3:4": (896, 1216), "3:2": (1344, 896),
        "2:3": (896, 1344), "4:5": (896, 1120), "5:4": (1120, 896),
        "21:9": (1568, 672),
    }
    w, h = ratio_to_wh.get(ratio, (1024, 1024))

    enhanced = _build_flux_enhanced_prompt(prompt, quality)
    print(f"[Flux] Submitting. Size: {w}x{h}. Prompt: {enhanced[:100]}...")

    payload: dict = {
        "prompt": enhanced,
        "width": w,
        "height": h,
        "prompt_upsampling": False,
        "safety_tolerance": 2,
        "output_format": "png",
    }

    # Image-to-image: include reference image if provided
    if image_b64:
        b64_str = str(image_b64)
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        payload["image_prompt"] = b64_str

    headers = {"x-key": BFL_API_KEY, "Content-Type": "application/json"}
    endpoint = "https://api.us1.bfl.ai/v1/flux-pro-1.1"

    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(endpoint, json=payload, headers=headers)
        print(f"[Flux] Submit response: {resp.status_code} {resp.text[:300]}")
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Flux API error: {resp.text[:300]}")

        task_data = resp.json()
        task_id = task_data.get("id")
        if not task_id:
            raise HTTPException(status_code=502, detail=f"Flux: no task id in response: {task_data}")

        print(f"[Flux] Task ID: {task_id}. Polling...")

        # Poll for result (max 120s)
        for attempt in range(40):
            await asyncio.sleep(3)
            poll = await client.get(
                f"https://api.us1.bfl.ai/v1/get_result?id={task_id}",
                headers={"x-key": BFL_API_KEY},
            )
            if poll.status_code != 200:
                continue
            poll_data = poll.json()
            status = poll_data.get("status", "")
            print(f"[Flux] Poll {attempt+1}: status={status}")

            if status == "Ready":
                result_url = poll_data.get("result", {}).get("sample")
                if result_url:
                    # Download and convert to base64 data URI
                    img_resp = await client.get(result_url)
                    img_resp.raise_for_status()
                    b64 = base64.b64encode(img_resp.content).decode("utf-8")
                    print(f"[Flux] Success. Image size: {len(img_resp.content)} bytes")
                    return [f"data:image/png;base64,{b64}"]
                raise HTTPException(status_code=502, detail="Flux: Ready but no sample URL")
            elif status in ("Error", "Failed", "Content Moderated"):
                raise HTTPException(status_code=502, detail=f"Flux task {status}: {poll_data}")

        raise HTTPException(status_code=504, detail="Flux task timed out after 120s")


# ── AI PROMPT OPTIMIZER (single-model) ────────────────────────────────────────
# Uses GPT-4o-mini (text) to intelligently append model-specific modifiers.
# Falls back to the base prompt silently if the API call fails or times out.

MODEL_OPTIMIZER_HINTS = {
    "Nanobanana": "Google Gemini — excels at creative illustration, cohesive color palettes, dreamy conceptual art",
    "ChatGPT":    "OpenAI GPT Image 1.5 — state-of-the-art photorealism, complex multi-subject scenes, commercial photography, hyper-detailed textures",
    "Kling":      "Kling v1 — cinematic photography, hyper-detailed textures, fashion & portrait quality, dramatic film lighting",
    "Flux.1":     "Flux Pro 1.1 — precise prompt adherence, vivid commercial-grade images, sharp typography, accurate human subjects",
}

async def _ai_optimize_prompt(base_prompt: str, model: str) -> str:
    """Use GPT-4o-mini to append model-specific quality modifiers (< 30 words).
    Returns base_prompt unchanged if the call fails."""
    if not OPENAI_API_KEY:
        return base_prompt
    model_hint = MODEL_OPTIMIZER_HINTS.get(model, "General AI image model")
    system = (
        "You are an expert AI image prompt engineer. "
        "Your ONLY job is to append a SHORT list (≤25 words) of technical modifiers "
        "to the END of the user's prompt that will help the specified model produce "
        "a high-quality, artifact-free image. "
        "NEVER change, rephrase, or remove any part of the user's original prompt. "
        "NEVER change the subject or scene. "
        "The FIRST WORDS of your output MUST be exactly the user's original prompt, character for character. "
        "Respond with ONLY the final prompt string — nothing else."
    )
    user_msg = (
        f"Target model: {model} ({model_hint})\n"
        f"Original prompt: {base_prompt}\n"
        f"Return the original prompt VERBATIM with your modifiers appended at the end."
    )
    try:
        client = openai_lib.OpenAI(api_key=OPENAI_API_KEY)

        # Run synchronous OpenAI call in a thread to avoid blocking the event loop
        def _call():
            return client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": system},
                          {"role": "user",   "content": user_msg}],
                max_tokens=400,
                temperature=0.3,
            )
        resp = await asyncio.to_thread(_call)
        optimized = resp.choices[0].message.content.strip()
        # Remove any surrounding quotes GPT might add
        if optimized.startswith('"') and optimized.endswith('"'):
            optimized = optimized[1:-1]

        # Safety check: verify the original prompt's key words are preserved.
        # Use word-overlap instead of strict prefix match (GPT sometimes adjusts casing/articles).
        original_words = set(base_prompt.lower().split()[:8])  # first 8 words
        optimized_words = set(optimized.lower().split()[:12])  # allow slight expansion
        overlap = len(original_words & optimized_words)
        if len(original_words) > 3 and overlap < len(original_words) * 0.5:
            print(f"[AIOptimizer] Safety fallback for {model}: output diverged (overlap {overlap}/{len(original_words)} words).")
            return base_prompt

        print(f"[AIOptimizer] [OK] Optimized for {model}: ...{optimized[-120:]}")
        return optimized
    except Exception as e:
        print(f"[AIOptimizer] Skipped ({model}): {e}")
        return base_prompt


async def _synthesize_edit_prompt(prompt_history: List[str], current_edit: str) -> str:
    """Synthesize a contradiction-free prompt by resolving the full edit history.

    Uses gemini-2.5-flash as a fast, lightweight LLM Middleman to understand
    chronological intent and produce a single, unified image prompt that eliminates
    all contradictions (e.g. 'yellow text' -> 'black text' across iterations).
    Falls back silently to the raw current_edit if the LLM call fails.
    """
    if not prompt_history:
        return current_edit

    # Build a human-readable history for the LLM to reason over
    history_lines = "\n".join(
        [f"Step {i+1}: {p}" for i, p in enumerate(prompt_history)]
    )
    system_prompt = (
        "You are an expert Image Prompt Synthesizer. "
        "A user has been iteratively editing an AI-generated image over multiple steps. "
        "Your ONLY job is to produce a single, cohesive, contradiction-free image generation prompt "
        "that incorporates the latest instruction while correctly superseding any contradicted older instructions. "
        "Rules:\n"
        "- If the new step CHANGES something from a previous step (e.g. color, object, style), the new value WINS and the old value must be REMOVED.\n"
        "- If the new step ADDS something new, preserve all prior elements and append the new element.\n"
        "- NEVER produce a prompt with contradictory attributes (e.g. 'yellow text' and 'black text' together).\n"
        "- Output ONLY the final synthesized prompt string — no explanation, no labels, no quotes."
    )
    user_msg = (
        f"Here is the chronological edit history for this image:\n{history_lines}\n\n"
        f"Latest instruction: {current_edit}\n\n"
        f"Synthesize all of the above into one perfect, unified, contradiction-free image prompt."
    )

    try:
        # Prefer Gemini 2.5 Flash (fast, cheap, available)
        if global_client:
            def _gemini_call():
                return global_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=user_msg,
                    config={"system_instruction": system_prompt, "temperature": 0.2, "max_output_tokens": 400},
                )
            resp = await asyncio.to_thread(_gemini_call)
            synthesized = resp.text.strip().strip('"')
            print(f"[PromptSynthesizer] [OK] History depth={len(prompt_history)}: ...{synthesized[-150:]}")
            return synthesized

        # Fallback: GPT-4o-mini if Gemini unavailable
        if OPENAI_API_KEY:
            client = openai_lib.OpenAI(api_key=OPENAI_API_KEY)
            def _oai_call():
                return client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user",   "content": user_msg},
                    ],
                    max_tokens=400,
                    temperature=0.2,
                )
            resp = await asyncio.to_thread(_oai_call)
            synthesized = resp.choices[0].message.content.strip().strip('"')
            print(f"[PromptSynthesizer] [OK] (OAI fallback) History depth={len(prompt_history)}: ...{synthesized[-150:]}")
            return synthesized

    except Exception as e:
        print(f"[PromptSynthesizer] Failed, using raw edit prompt: {e}")

    return current_edit


# ── MAIN ENDPOINT ─────────────────────────────────────────────────────────────

@app.post("/api/generate")
async def generate_image(
    request: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    access_error = _generation_access_error(current_user)
    if access_error:
        raise access_error

    if request.session_id:
        existing_session = db.query(DBSession).filter(DBSession.id == request.session_id).first()
        if existing_session and existing_session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Session not found")

    print(f"[API] Received request for models: {request.models}, prompt: {request.prompt[:80]}")
    print(f"[API-DEBUG] Received prompt_history from frontend: {request.prompt_history}")

    # ── Prompt Synthesis (edit mode) or AI Optimization (first generation) ──
    optimized_prompt = request.prompt
    if request.prompt_history:
        # Edit with history: synthesize contradiction-free prompt via LLM Middleman
        print(f"[API] ── PROMPT SYNTHESIZER ── history depth={len(request.prompt_history)}")
        optimized_prompt = await _synthesize_edit_prompt(request.prompt_history, request.prompt)
        print(f"[API] ── SYNTHESIZED PROMPT ── {optimized_prompt[:200]}")
    elif len(request.models) == 1 and OPENAI_API_KEY:
        # First-time generation: use standard AI optimizer
        print(f"[API] ── BEFORE AI OPTIMIZER ── {request.prompt[:120]}")
        optimized_prompt = await _ai_optimize_prompt(request.prompt, request.models[0])
        if optimized_prompt != request.prompt:
            print(f"[API] ── AFTER  AI OPTIMIZER ── {optimized_prompt[:200]}")
        else:
            print(f"[API] ── AI OPTIMIZER: no change (fallback to original) ──")

    results: List[dict] = []
    errors: List[str] = []

    # ── Nanobanana / Gemini (with auto-fallback to ChatGPT on quota exhaustion) ──
    if "Nanobanana" in request.models:
        gemini_quota_exhausted = False
        try:
            imgs = await _gemini_generate(
                prompt=optimized_prompt,
                ratio=request.ratio,
                quality=request.quality,
                image_b64=request.image_base64,
            )
            for img in imgs:
                results.append({"model": "Nanobanana", "url": img})
            print(f"[Gemini] Got {len(imgs)} image(s)")
        except Exception as e:
            err_msg = str(e)
            is_quota = "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg or "quota" in err_msg.lower()
            gemini_quota_exhausted = is_quota
            if not is_quota:
                # Non-quota error: record and move on
                results.append({"model": "Nanobanana", "url": None, "error": err_msg})
                errors.append(f"Nanobanana: {err_msg}")
            print(f"[Gemini] Error ({'quota exhausted → auto-fallback' if is_quota else 'failed'}): {err_msg[:200]}")

        # Auto-fallback: Gemini quota exhausted → try ChatGPT transparently
        if gemini_quota_exhausted and OPENAI_API_KEY:
            print("[Fallback] Gemini quota exhausted. Auto-retrying with ChatGPT (gpt-image-2)...")
            try:
                fallback_imgs = await _chatgpt_image_generate(
                    prompt=optimized_prompt,
                    ratio=request.ratio,
                    quality=request.quality,
                    image_b64=request.image_base64,
                    model=request.chatgpt_model or "gpt-image-2",
                )
                for img in fallback_imgs:
                    # Label as ChatGPT so the frontend knows which model generated it
                    results.append({"model": "ChatGPT", "url": img})
                print(f"[Fallback] ChatGPT succeeded with {len(fallback_imgs)} image(s)")
            except Exception as fe:
                fallback_err = str(fe)
                results.append({"model": "Nanobanana", "url": None,
                                 "error": f"Gemini quota exhausted; ChatGPT fallback also failed: {fallback_err}"})
                errors.append(f"Nanobanana (quota) + ChatGPT fallback: {fallback_err}")
                print(f"[Fallback] ChatGPT fallback also failed: {fallback_err[:200]}")
        elif gemini_quota_exhausted:
            # No OpenAI key available for fallback
            results.append({"model": "Nanobanana", "url": None, "error": "Gemini quota exhausted; no fallback key configured"})
            errors.append("Nanobanana: RESOURCE_EXHAUSTED (no fallback available)")

    # ── ChatGPT Image ──
    if "ChatGPT" in request.models:
        try:
            imgs = await _chatgpt_image_generate(
                prompt=optimized_prompt,
                ratio=request.ratio,
                quality=request.quality,
                image_b64=request.image_base64,
                model=request.chatgpt_model,
            )
            for img in imgs:
                results.append({"model": "ChatGPT", "url": img})
            print(f"[ChatGPT] Got {len(imgs)} image(s)")
        except Exception as e:
            err_msg = str(e)
            results.append({"model": "ChatGPT", "url": None, "error": err_msg})
            errors.append(f"ChatGPT: {err_msg}")
            print(f"[ChatGPT] Error: {err_msg}")

    # ── Kling ──
    if "Kling" in request.models:
        try:
            imgs = await _kling_generate(
                prompt=optimized_prompt,
                ratio=request.ratio,
                image_b64=request.image_base64,
                quality=request.quality
            )
            for img in imgs:
                results.append({"model": "Kling", "url": img})
            print(f"[Kling] Got {len(imgs)} image(s)")
        except Exception as e:
            err_msg = str(e)
            results.append({"model": "Kling", "url": None, "error": err_msg})
            errors.append(f"Kling: {err_msg}")
            print(f"[Kling] Error: {err_msg}")

    # ── Flux.1 ──
    if "Flux.1" in request.models:
        try:
            imgs = await _flux_generate(
                prompt=optimized_prompt,
                ratio=request.ratio,
                quality=request.quality
            )
            for img in imgs:
                results.append({"model": "Flux.1", "url": img})
            print(f"[Flux.1] Got {len(imgs)} image(s)")
        except Exception as e:
            err_msg = str(e)
            results.append({"model": "Flux.1", "url": None, "error": err_msg})
            errors.append(f"Flux.1: {err_msg}")
            print(f"[Flux.1] Error: {err_msg}")

    # ── OpenAI (DALL-E 3) ──
    if "OpenAI" in request.models:
        try:
            imgs = await _openai_generate(
                prompt=request.prompt,
                ratio=request.ratio,
                quality=request.quality
            )
            for img in imgs:
                results.append({"model": "OpenAI", "url": img})
            print(f"[OpenAI] Got {len(imgs)} image(s)")
        except Exception as e:
            err_msg = str(e)
            results.append({"model": "OpenAI", "url": None, "error": err_msg})
            errors.append(f"OpenAI: {err_msg}")
            print(f"[OpenAI] Error: {err_msg}")

    if not any(r["url"] for r in results) and errors:
        combined = "; ".join(errors)
        # Detect quota exhaustion — surface as 429 (not 502) so the frontend can show a clear message
        if "RESOURCE_EXHAUSTED" in combined or "429" in combined or "quota" in combined.lower():
            raise HTTPException(
                status_code=429,
                detail=f"API quota exhausted. Your free-tier limit has been reached. "
                       f"Please wait a few minutes or switch to ChatGPT / Flux. Details: {combined[:300]}"
            )
        raise HTTPException(status_code=502, detail=combined)

    session_id = request.session_id or str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    user_id = current_user.id

    # Save to Database
    try:
        existing_session = db.query(DBSession).filter(DBSession.id == session_id).first()
        if not existing_session:
            new_session = DBSession(
                id=session_id,
                user_id=user_id,
                parent_session_id=None,
                prompt=request.prompt,
                models=json.dumps(request.models),
                active_configs=json.dumps(request.categories),
                reference_image_id=None,
                ratio=request.ratio,
                quality=request.quality,
                created_at=now
            )
            db.add(new_session)

        for res in results:
            new_image = DBImage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                user_id=user_id,
                model_id=res["model"],
                status="completed" if res["url"] else "failed",
                url=res["url"] if res["url"] else "",
                created_at=now
            )
            db.add(new_image)
        db.commit()
    except Exception as e:
        print(f"[Database Error] Failed to save session: {e}")
        db.rollback()

    return {
        "status": "success",
        "session_id": session_id,
        "images": [r["url"] for r in results if r["url"]], # for backward compatibility if needed
        "results": results,
        "models_ran": [m for m in request.models if m in ("Nanobanana", "ChatGPT", "Kling", "Flux.1", "OpenAI")],
        "errors": errors,
    }


class PromptSuggestRequest(BaseModel):
    prompt: str


@app.post("/api/suggest-from-prompt")
async def suggest_from_prompt(request: PromptSuggestRequest):
    """Analyze a text prompt and suggest a complete 8-category style configuration.
    
    Primary: Gemini Flash (fast, free-tier)
    Fallback: GPT-4o-mini (if Gemini quota exhausted)
    """
    prompt_text = f"""You are a visual style expert for an AI image generation app.

The user has typed this image generation prompt:
"{request.prompt}"

Based on this prompt, suggest the single best complete configuration across all 8 style categories.
Pick the options that would make this prompt produce the most visually stunning result.

Available options for each category:
- visualStyle: Photorealistic, Cinematic, Anime, Oil Painting, Watercolor, Concept Art, 3D Render, Minimalist
- medium: Digital Art, Photography, Charcoal, Ink Drawing, Acrylic, Mixed Media
- lighting: Golden Hour, Blue Hour, Studio, Dramatic, Neon, Volumetric, Moonlight, Candlelight
- composition: Centered, Rule of Thirds, Flat Lay, Panoramic
- cameraAngle: Worm's Eye View, Dutch Angle, Bird's Eye, Extreme Close-Up, Wide Shot, Medium Shot, Close-Up, Low Angle
- lens: 24mm Wide, 50mm Normal, 85mm Portrait, 135mm Telephoto, Macro, Fisheye
- mood: Serene, Dramatic, Ethereal, Mysterious, Melancholic, Futuristic, Romantic, Epic
- colorPalette: Vibrant, Muted, Pastel, Monochrome, Earth Tones, Neon/Cyber, Warm Tones, Cool Tones

IMPORTANT:
- You MUST pick exactly one value from each category's available options above.
- Do NOT invent new options.
- Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON.

{{
  "suggested": {{
    "visualStyle": "",
    "medium": "",
    "lighting": "",
    "composition": "",
    "cameraAngle": "",
    "lens": "",
    "mood": "",
    "colorPalette": ""
  }},
  "reason": "one short sentence explaining why this combination suits the prompt"
}}"""

    # ── Attempt 1: Gemini Flash (primary) ──
    gemini_client = flash_client if flash_client else global_client
    if gemini_client:
        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[prompt_text],
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                )
            )
            text_content = response.text.strip()
            parsed = json.loads(text_content)
            if parsed.get("suggested") and isinstance(parsed["suggested"], dict):
                print(f"[PromptSuggest] [OK] Gemini succeeded")
                return parsed
        except Exception as e:
            print(f"[PromptSuggest] Gemini failed: {e}")

    # ── Attempt 2: GPT-4o-mini fallback ──
    if OPENAI_API_KEY:
        try:
            print("[PromptSuggest] Falling back to GPT-4o-mini...")
            oai_client = openai_lib.OpenAI(api_key=OPENAI_API_KEY)
            resp = await asyncio.to_thread(
                oai_client.chat.completions.create,
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a visual style expert. Respond ONLY with valid JSON, no markdown."},
                    {"role": "user", "content": prompt_text},
                ],
                max_tokens=500,
                temperature=0.7,
                response_format={"type": "json_object"},
            )
            text_content = resp.choices[0].message.content.strip()
            parsed = json.loads(text_content)
            if parsed.get("suggested") and isinstance(parsed["suggested"], dict):
                print(f"[PromptSuggest] [OK] GPT-4o-mini fallback succeeded")
                return parsed
        except Exception as e:
            print(f"[PromptSuggest] GPT-4o-mini fallback failed: {e}")

    print("[PromptSuggest] All providers failed, returning empty.")
    return {"suggested": {}, "reason": ""}


@app.post("/api/recommend-styles")
async def recommend_styles(request: RecommendRequest, current_user: User = Depends(get_current_user)):
    """AI-driven style recommendations based on user selections.
    
    Primary: Gemini Flash
    Fallback: GPT-4o-mini (if Gemini quota exhausted)
    """
    access_error = _generation_access_error(current_user)
    if access_error:
        raise access_error

    # Read the compatibility JSON to feed to the AI
    try:
        with open("style_compatibility.json", "r") as f:
            style_data = json.load(f)["compatibilityRules"]
    except Exception as e:
        print(f"[AI Recommend] Failed to read rules: {e}")
        style_data = {"visualStyle": ["Photorealistic", "Cinematic", "Anime", "Oil Painting", "Watercolor", "Concept Art", "3D Render", "Minimalist"]}

    selected_list = "\n".join([f"- {k}: {v}" for k, v in request.selections.items()])
    free_text_line = f'\nThe user also described their vision as: "{request.prompt.strip()}"' if request.prompt.strip() else ""

    prompt_text = f"""You are a visual style expert for an AI image generation app called Fasty.

The user is configuring a style for their image. Here is what they have selected so far:
{selected_list}
{free_text_line}

Your job:
1. Recommend the single best complete configuration across all 8 categories (visualStyle, medium, lighting, composition, cameraAngle, lens, mood, colorPalette)
2. For any category the user already selected, keep their choice UNLESS it strongly conflicts with another selection
3. If there is a conflict, suggest a fix and explain it in one short sentence
4. Write a single sentence (max 15 words) explaining why this combination works visually
5. Suggest 2 alternative complete configurations the user might also love

IMPORTANT: Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON.

{{
  "recommended": {{
    "visualStyle": "",
    "medium": "",
    "lighting": "",
    "composition": "",
    "cameraAngle": "",
    "lens": "",
    "mood": "",
    "colorPalette": ""
  }},
  "reason": "",
  "conflicts": [
    {{ "category": "", "userPicked": "", "suggested": "", "why": "" }}
  ],
  "alternatives": [
    {{
      "label": "",
      "visualStyle": "", "medium": "", "lighting": "", "composition": "",
      "cameraAngle": "", "lens": "", "mood": "", "colorPalette": ""
    }}
  ]
}}"""

    empty_result = {
        "recommended": {},
        "reason": "AI recommendation unavailable. Kept your original choices.",
        "conflicts": [],
        "alternatives": []
    }

    # ── Attempt 1: Gemini Flash (primary) ──
    gemini_client = flash_client if flash_client else global_client
    if gemini_client:
        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[prompt_text],
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    response_mime_type="application/json",
                )
            )
            text_content = response.text.strip()
            parsed = json.loads(text_content)
            print(f"[AI Recommend] [OK] Gemini succeeded")
            return parsed
        except Exception as e:
            print(f"[AI Recommend] Gemini failed: {e}")

    # ── Attempt 2: GPT-4o-mini fallback ──
    if OPENAI_API_KEY:
        try:
            print("[AI Recommend] Falling back to GPT-4o-mini...")
            oai_client = openai_lib.OpenAI(api_key=OPENAI_API_KEY)
            resp = await asyncio.to_thread(
                oai_client.chat.completions.create,
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a visual style expert. Respond ONLY with valid JSON, no markdown."},
                    {"role": "user", "content": prompt_text},
                ],
                max_tokens=800,
                temperature=0.7,
                response_format={"type": "json_object"},
            )
            text_content = resp.choices[0].message.content.strip()
            parsed = json.loads(text_content)
            print(f"[AI Recommend] [OK] GPT-4o-mini fallback succeeded")
            return parsed
        except Exception as e:
            print(f"[AI Recommend] GPT-4o-mini fallback failed: {e}")

    print("[AI Recommend] All providers failed.")
    return empty_result



@app.post("/api/analyze-image")
async def analyze_image(request: AnalyzeRequest, current_user: User = Depends(get_current_user)):
    """Analyze an uploaded image using Gemini Vision.
    
    Uses a retry + model cascade fallback:
      1. Try each model in VISION_MODELS order
      2. Retry each model up to MAX_RETRIES_PER_MODEL times (exponential backoff)
      3. If ALL models fail, return an empty-field dict — never raises 500
    """
    access_error = _generation_access_error(current_user)
    if access_error:
        raise access_error

    if not PROJECT_ID and not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Neither GCP_PROJECT_ID nor GEMINI_API_KEY set")

    print("[Vision] Analyzing image with fallback cascade...")

    b64_str = request.image_base64
    if "," in b64_str:
        b64_str = b64_str.split(",")[1]

    try:
        image_bytes = base64.b64decode(b64_str)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {e}")

    categories_context_str = request.categories_context or ""
    prompt = f"""You are a visual style analyzer for an AI image generation tool.
Analyze the provided image and return a JSON object with exactly these keys:
- "description": 1 concise sentence describing the image subject and mood,
  written in a generation-ready style (e.g. "a woman standing in golden hour light with dramatic shadows").
- "style": the best matching style label from the valid options, or "" if none match well.
- "lighting": the best matching lighting label from the valid options, or "" if none match well.
- "composition": the best matching composition label from the valid options, or "" if none match well.
- "visual_style_prompt": a short comma-separated string of visual attributes
  extracted from the image that can be injected directly into an image generation prompt
  (e.g. "warm tones, shallow depth of field, cinematic look, golden hour lighting").

Valid options:
{categories_context_str}

Return ONLY valid JSON, no markdown, no preamble."""

    last_error = None
    for model_name in VISION_MODELS:
        delay = 1
        for attempt in range(MAX_RETRIES_PER_MODEL):
            try:
                print(f"[Vision] Trying {model_name}, attempt {attempt + 1}...")
                response = flash_client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        prompt
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                result = json.loads(response.text)
                # Ensure all expected keys exist
                result.setdefault("description", "")
                result.setdefault("style", "")
                result.setdefault("lighting", "")
                result.setdefault("composition", "")
                result.setdefault("visual_style_prompt", "")
                result["_model_used"] = model_name
                print(f"[Vision] Success via {model_name}: {result}")
                return result
            except Exception as e:
                last_error = e
                print(f"[Vision] {model_name} attempt {attempt + 1} failed: {e}")
                if attempt < MAX_RETRIES_PER_MODEL - 1:
                    await asyncio.sleep(delay)
                    delay *= 2  # exponential backoff

    # All models + retries exhausted — return minimal valid object, never 500
    print(f"[Vision] All fallbacks exhausted. Last error: {last_error}")
    return {
        "description": "",
        "style": "",
        "lighting": "",
        "composition": "",
        "visual_style_prompt": "",
        "_model_used": "none",
        "_fallback_exhausted": True
    }


async def _process_session_batch(session_id: str, request: SessionCreateRequest):
    db: Session = SessionLocal()
    try:
        images = db.query(DBImage).filter(DBImage.session_id == session_id).all()

        async def run_model(img_id, model_id):
            url = None
            status = "failed"
            error_msg = None
            try:
                print(f"[Session:{session_id}] Starting model: {model_id}")
                if model_id == "Nanobanana":
                    imgs = await _gemini_generate(request.prompt, request.ratio, request.quality, request.image_base64)
                    if imgs: url = imgs[0]
                elif model_id == "ChatGPT":
                    chatgpt_m = request.active_configs.get("chatgpt_model", "gpt-image-2")
                    imgs = await _chatgpt_image_generate(request.prompt, request.ratio, request.quality, request.image_base64, chatgpt_m)
                    if imgs: url = imgs[0]
                elif model_id == "Flux.1":
                    imgs = await _flux_generate(request.prompt, request.ratio, request.quality, image_b64=request.image_base64)
                    if imgs: url = imgs[0]
                elif model_id == "Kling":
                    imgs = await _kling_generate(request.prompt, request.ratio, request.image_base64, request.quality)
                    if imgs: url = imgs[0]
                elif model_id == "OpenAI":
                    imgs = await _chatgpt_image_generate(request.prompt, request.ratio, request.quality, request.image_base64, "gpt-image-2")
                    if imgs: url = imgs[0]
                else:
                    print(f"[Session:{session_id}] Unknown model: {model_id} — skipping")
                    error_msg = f"Unknown model: {model_id}"
                
                if url:
                    status = "completed"
                    print(f"[Session:{session_id}] {model_id} completed successfully")
                else:
                    print(f"[Session:{session_id}] {model_id} returned no image")
            except Exception as e:
                error_msg = str(e)
                print(f"[Session:{session_id}] {model_id} FAILED: {e}")

            url = await _materialize_image_url(url)

            # Re-fetch or use a new session to update
            try:
                update_db = SessionLocal()
                try:
                    update_db.query(DBImage).filter(DBImage.id == img_id).update({
                        "status": status, 
                        "url": url,
                        "error_msg": error_msg
                    })
                    update_db.commit()
                except Exception as db_err:
                    print(f"Database update failed for image {img_id}: {db_err}")
                    update_db.rollback()
                finally:
                    update_db.close()
            except Exception as e:
                print(f"Could not create database session for image {img_id}: {e}")

        tasks = [run_model(img.id, img.model_id) for img in images]
        await asyncio.gather(*tasks)
    finally:
        db.close()


@app.post("/api/sessions")
async def create_session(
    request: SessionCreateRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    access_error = _generation_access_error(user)
    if access_error:
        raise access_error

    session_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    # Store Active Configs as flat string from dict
    new_session = DBSession(
        id=session_id,
        user_id=user.id,
        parent_session_id=request.parent_session_id,
        prompt=request.prompt,
        models=json.dumps(request.model_ids),
        active_configs=json.dumps(request.active_configs),
        reference_image_id=request.reference_image_id,
        ratio=request.ratio,
        quality=request.quality,
        created_at=now
    )
    db.add(new_session)

    image_slots = []
    for model_id in request.model_ids:
        img_id = str(uuid.uuid4())
        new_image = DBImage(
            id=img_id,
            session_id=session_id,
            user_id=user.id,
            model_id=model_id,
            status="pending",
            url=None,
            created_at=now
        )
        db.add(new_image)
        image_slots.append({"image_id": img_id, "model_id": model_id, "status": "pending", "url": None})

    db.commit()

    background_tasks.add_task(_process_session_batch, session_id, request)

    return {"session_id": session_id, "images": image_slots}


@app.get("/api/sessions/{session_id}")
async def get_session(
    session_id: str, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    _ensure_session_owner(db, session_id, user.id)

    session_row = db.query(DBSession).filter(DBSession.id == session_id, DBSession.user_id == user.id).first()
    if not session_row:
        raise HTTPException(status_code=404, detail="Session not found")

    images_rows = []
    curr_sess = session_row
    visited_sess = {session_row.id}
    while curr_sess:
        curr_images = db.query(DBImage).filter(DBImage.session_id == curr_sess.id).order_by(DBImage.created_at.desc(), DBImage.id.desc()).all()
        images_rows.extend(curr_images)
        if curr_sess.parent_session_id and curr_sess.parent_session_id not in visited_sess:
            visited_sess.add(curr_sess.parent_session_id)
            curr_sess = db.query(DBSession).filter(DBSession.id == curr_sess.parent_session_id).first()
        else:
            curr_sess = None
    preview_images = [await _materialize_image_url(img.url) for img in images_rows if img.url]
    parsed_models = json.loads(session_row.models or "[]")
    parsed_configs = json.loads(session_row.active_configs or "{}")

    return {
        "id": session_row.id,
        "session_id": session_row.id,
        "parent_session_id": session_row.parent_session_id,
        "prompt": session_row.prompt,
        "models": parsed_models,
        "active_configs": parsed_configs,
        "settings": {
            "models": parsed_models,
            "active_configs": parsed_configs,
        },
        "reference_image_id": session_row.reference_image_id,
        "preview_images": preview_images,
        "images": [
            {
                "id": img.id,
                "session_id": img.session_id,
                "model_id": img.model_id,
                "status": img.status,
                "url": await _materialize_image_url(img.url),
                "error_msg": img.error_msg,
                "created_at": img.created_at
            } for img in images_rows
        ]
    }


@app.post("/api/sessions/{session_id}/images/{image_id}/edit")
async def edit_session_image(
    session_id: str, 
    image_id: str, 
    request: EditImageRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    parent_session = db.query(DBSession).filter(DBSession.id == session_id, DBSession.user_id == user.id).first()
    source_image = db.query(DBImage).filter(DBImage.id == image_id, DBImage.session_id == session_id).first()
    
    if not parent_session or not source_image:
        raise HTTPException(status_code=404, detail="Session or Image not found")

    active_configs = json.loads(parent_session.active_configs)
    if request.config_overrides:
        active_configs.update(request.config_overrides)

    child_session_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    merged_prompt = f"{parent_session.prompt}, {request.edit_prompt}" if request.edit_prompt else parent_session.prompt
    model_id = source_image.model_id
    models_list = [model_id]

    new_session = DBSession(
        id=child_session_id,
        user_id=user.id,
        parent_session_id=session_id,
        prompt=merged_prompt,
        models=json.dumps(models_list),
        active_configs=json.dumps(active_configs),
        reference_image_id=request.reference_image_id,
        ratio=request.ratio or parent_session.ratio,
        quality=request.quality or parent_session.quality,
        created_at=now
    )
    db.add(new_session)

    new_img_id = str(uuid.uuid4())
    new_image = DBImage(
        id=new_img_id,
        session_id=child_session_id,
        user_id=user.id,
        model_id=model_id,
        status="pending",
        url=None,
        created_at=now
    )
    db.add(new_image)
    db.commit()

    bg_req = SessionCreateRequest(
        prompt=merged_prompt,
        model_ids=models_list,
        active_configs=active_configs,
        reference_image_id=request.reference_image_id,
        ratio=request.ratio,
        quality=request.quality,
        image_base64=request.image_base64
    )
    background_tasks.add_task(_process_session_batch, child_session_id, bg_req)

    return {
        "session_id": child_session_id,
        "child_session_id": child_session_id,
        "image": {"image_id": new_img_id, "model_id": model_id, "status": "pending", "url": None}
    }


class RefinePromptRequest(BaseModel):
    prompt: str
    ratio: str = "1:1"
    quality: str = "Standard"
    selections: dict = Field(default_factory=dict)  # e.g. {"style": "cinematic", "lighting": "dramatic"}

@app.post("/api/refine-prompt")
async def refine_prompt(request: RefinePromptRequest, current_user: Optional[User] = Depends(get_optional_user)):
    """Use AI to rewrite the prompt to incorporate newly selected settings.
    Auth is optional — this is a lightweight text-only helper, no image credits consumed.
    """

    # Build a human-readable settings description
    settings_lines = [f"- Aspect Ratio: {request.ratio}"]
    settings_lines.append(f"- Quality: {request.quality}")
    label_map = {
        "style": "Visual Style", "medium": "Medium", "lighting": "Lighting",
        "composition": "Composition", "camera": "Camera Angle",
        "lens": "Lens", "mood": "Mood", "color": "Color Palette"
    }
    for key, val in request.selections.items():
        label = label_map.get(key, key.title())
        settings_lines.append(f"- {label}: {val}")
    settings_text = "\n".join(settings_lines)

    system_instruction = (
        "You are an expert AI image prompt engineer. Your ONLY job is to apply a user's newly selected "
        "UI settings into their existing prompt — nothing more.\n\n"

        "STRICT RULES (never break these):\n"
        "1. ZERO HALLUCINATION: Do NOT invent new subjects, actions, scenes, backgrounds, or details "
        "that do not exist in the original prompt. If the original prompt says 'formula one car', "
        "do NOT add 'racing on a track', 'cheering fans', 'speed lines', or anything else.\n"
        "2. PRESERVE THE CORE: Keep the original prompt's subject, scene, and all existing details "
        "100% intact. Only add/change the things the user explicitly selected.\n"
        "3. CONFLICT RESOLUTION: If the original prompt contains settings (e.g. '16:9', 'cinematic', "
        "'dark mood', 'black and white') that CONFLICT with the newly selected settings, REMOVE the "
        "old conflicting mention and apply the new one. Do not keep both.\n"
        "4. CLEAN INTEGRATION: Naturally weave the new settings in. Do NOT just dump a comma list "
        "at the end if it can flow naturally. If the prompt is very short, a clean descriptor list "
        "is acceptable.\n"
        "5. NO EXPANSION: Do not make a short prompt long. Do not pad or elaborate.\n"
        "6. OUTPUT ONLY: Return ONLY the final prompt text — no explanations, no headers, no bullets.\n"
        "7. MULTI-PARAGRAPH: If the original prompt spans multiple paragraphs, keep that structure.\n\n"

        "FEW-SHOT EXAMPLES:\n\n"

        "Example 1 — Short prompt, no conflicts:\n"
        "  Original: 'Formula one car'\n"
        "  New settings: Aspect Ratio: 1:1, Visual Style: Cinematic, Lighting: Golden Hour\n"
        "  CORRECT output: 'Formula one car, cinematic style, golden hour lighting, 1:1 aspect ratio.'\n"
        "  WRONG output: 'A formula one car racing down a vibrant track with cheering fans under golden hour lighting...'\n\n"

        "Example 2 — Conflict resolution:\n"
        "  Original: 'A stray cat on a wall, wide 16:9 cinematic shot, dark moody lighting.'\n"
        "  New settings: Aspect Ratio: 1:1, Mood: Serene, Lighting: Golden Hour\n"
        "  CORRECT output: 'A stray cat on a wall, serene mood, golden hour lighting, 1:1 aspect ratio.'\n"
        "  WRONG output: 'A stray cat on a wall, wide 16:9 cinematic shot, dark moody lighting, serene, golden hour, 1:1.'\n\n"

        "Example 3 — Long prompt, partial update:\n"
        "  Original: 'A modern skyscraper at sunset. The glass facade reflects orange hues. "
        "Street level shows busy pedestrians and yellow taxis.'\n"
        "  New settings: Visual Style: Watercolor, Color Palette: Muted\n"
        "  CORRECT output: 'A modern skyscraper at sunset, watercolor style, muted color palette. "
        "The glass facade reflects soft orange hues. Street level shows busy pedestrians and yellow taxis.'\n"
    )

    user_message = (
        f"Original prompt:\n{request.prompt}\n\n"
        f"New settings selected by the user (apply these exactly, resolve any conflicts):\n{settings_text}\n\n"
        "Rewrite the prompt following the rules above. Return ONLY the rewritten prompt text."
    )

    # ── Attempt 1: Gemini Flash ──
    gemini_client = flash_client if flash_client else global_client
    if gemini_client:
        try:
            response = gemini_client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=user_message,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.4,
                    max_output_tokens=2048,
                )
            )
            refined = response.text.strip()
            print(f"[refine-prompt] [OK] Gemini succeeded")
            return {"status": "success", "refined_prompt": refined}
        except Exception as e:
            print(f"[refine-prompt] Gemini failed: {e}")

    # ── Attempt 2: GPT-4o-mini fallback ──
    if OPENAI_API_KEY:
        try:
            print("[refine-prompt] Falling back to GPT-4o-mini...")
            oai_client = openai_lib.OpenAI(api_key=OPENAI_API_KEY)
            resp = await asyncio.to_thread(
                oai_client.chat.completions.create,
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_message},
                ],
                max_tokens=2048,
                temperature=0.4,
            )
            refined = resp.choices[0].message.content.strip()
            print(f"[refine-prompt] [OK] GPT-4o-mini fallback succeeded")
            return {"status": "success", "refined_prompt": refined}
        except Exception as e:
            print(f"[refine-prompt] GPT-4o-mini fallback failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    raise HTTPException(status_code=500, detail="No AI provider available for prompt refinement.")


# ── OPENAI DALL·E 3 HELPER ────────────────────────────────────────────────────

async def _openai_generate(prompt: str, ratio: str, quality: str = "Standard") -> List[str]:
    """Generate image via OpenAI DALL·E 3. Returns list of image URLs.
    quality: Standard → standard, High/Ultra → hd
    """
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not set in .env")

    size_map = {
        "1:1":  "1024x1024",
        "16:9": "1792x1024",
        "9:16": "1024x1792",
    }
    size = size_map.get(ratio, "1024x1024")
    # HD mode costs 2× but is noticeably sharper — use for High / Ultra
    dalle_quality = "hd" if quality in ("High", "Ultra") else "standard"
    enhanced_prompt = _build_openai_enhanced_prompt(prompt, quality)

    print(f"[OpenAI] Generating. Size: {size}, DalleQuality: {dalle_quality}, Prompt: {enhanced_prompt[:100]}...")

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            "https://api.openai.com/v1/images/generations",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "dall-e-3",
                "prompt": enhanced_prompt,
                "n": 1,
                "size": size,
                "quality": dalle_quality,
                "response_format": "url"
            }
        )
        print(f"[OpenAI] Response: {resp.status_code}")
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"OpenAI API error: {resp.text}")
        data = resp.json()
        urls = [item["url"] for item in data.get("data", [])]
        print(f"[OpenAI] Got {len(urls)} image URL(s)")
        return urls


# ── BLACK FOREST LABS FLUX HELPER ────────────────────────────────────────────

async def _flux_generate(prompt: str, ratio: str, quality: str = "Standard", image_b64: Optional[str] = None) -> List[str]:
    """Generate image via BFL Flux.

    Nanobanana-grade resilience:
      1. Model cascade:  Ultra → Pro on failure
      2. Prompt sanitizer middleman:  content-moderated → _sanitize_prompt → retry
      3. Resilient auto-retries:  3 attempts per submit with exponential backoff

    quality: Standard -> flux-pro-1.1
             High     -> flux-pro-1.1 + prompt_upsampling
             Ultra    -> flux-pro-1.1-ultra (highest quality endpoint)
    image_b64: Optional reference image for image-to-image generation.
    """
    if not BFL_API_KEY:
        raise HTTPException(status_code=500, detail="BFL_API_KEY not set in .env")

    headers = {"X-Key": BFL_API_KEY, "Content-Type": "application/json"}

    def _build_payload(use_prompt: str, use_quality: str) -> tuple:
        """Build endpoint + payload for a given quality tier."""
        ep = _build_flux_enhanced_prompt(use_prompt, use_quality)
        if use_quality == "Ultra":
            endpoint = "https://api.bfl.ai/v1/flux-pro-1.1-ultra"
            ar_map = {"1:1": "1:1", "16:9": "16:9", "9:16": "9:16", "4:5": "4:5", "3:2": "3:2", "4:3": "4:3"}
            pl: Dict = {
                "prompt": ep,
                "aspect_ratio": ar_map.get(ratio, "1:1"),
                "safety_tolerance": 2,
                "output_format": "jpeg",
                "raw": False,
            }
            return endpoint, pl
        else:
            endpoint = "https://api.bfl.ai/v1/flux-pro-1.1"
            dim_map = {
                "1:1": (1024, 1024), "16:9": (1344, 768), "9:16": (768, 1344),
                "4:5": (896, 1120), "3:2": (1216, 832), "4:3": (1152, 896),
            }
            width, height = dim_map.get(ratio, (1024, 1024))
            pl = {
                "prompt": ep,
                "width": width, "height": height,
                "prompt_upsampling": use_quality in ("High", "Ultra"),
                "safety_tolerance": 2,
                "output_format": "jpeg",
            }
            return endpoint, pl

    async def _submit_and_poll(use_prompt: str, use_quality: str) -> List[str]:
        """Submit to Flux and poll with retries. Raises ContentBlockedError on moderation."""
        endpoint, payload = _build_payload(use_prompt, use_quality)
        print(f"[Flux] {use_quality} mode -> {endpoint.split('/')[-1]}")
        print(f"[Flux] Prompt: {use_prompt[:100]}...")

        # ── Resilient submit with 3 retries + exponential backoff ──
        last_exc: Optional[Exception] = None
        resp = None
        for attempt in range(3):
            try:
                if attempt > 0:
                    backoff = 3 * attempt
                    print(f"[Flux] Submit retry {attempt}/2 (backoff {backoff}s)...")
                    await asyncio.sleep(backoff)
                async with httpx.AsyncClient(timeout=180) as client:
                    resp = await client.post(endpoint, headers=headers, json=payload)
                    print(f"[Flux] Submit: {resp.status_code} {resp.text[:200]}")
                    if resp.status_code in (500, 502, 503):
                        raise Exception(f"BFL server error {resp.status_code}")
                    break
            except Exception as e:
                err_str = str(e)
                is_transient = any(x in err_str for x in ["500", "502", "503", "timeout", "Timeout", "UNAVAILABLE"])
                if is_transient:
                    last_exc = e
                    continue
                raise
        else:
            raise HTTPException(status_code=503, detail=f"Flux: all submit retries exhausted. Last error: {last_exc}")

        if resp is None or resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"BFL API error: {resp.text if resp else 'no response'}")

        task_id = resp.json().get("id")
        if not task_id:
            raise HTTPException(status_code=502, detail="BFL API: no task ID returned")

        print(f"[Flux] Task ID: {task_id}. Polling...")

        # Poll for result (max 150s, 50 x 3s)
        async with httpx.AsyncClient(timeout=180) as client:
            for poll_attempt in range(50):
                await asyncio.sleep(3)
                poll_resp = await client.get(
                    "https://api.bfl.ai/v1/get_result",
                    headers=headers,
                    params={"id": task_id}
                )
                if poll_resp.status_code != 200:
                    continue
                result = poll_resp.json()
                status = result.get("status")
                print(f"[Flux] Poll {poll_attempt+1}: {status}")

                if status == "Ready":
                    sample = result.get("result", {}).get("sample")
                    if sample:
                        print(f"[Flux] Materializing BFL URL immediately...")
                        materialized = await _materialize_image_url(sample)
                        return [materialized] if materialized else [sample]
                    raise HTTPException(status_code=502, detail="BFL: no sample in result")
                elif status in ("Content Moderated", "Request Moderated"):
                    raise ContentBlockedError(f"BFL task moderated: {status}")
                elif status == "Error":
                    raise HTTPException(status_code=502, detail=f"BFL task failed: {status}")

        raise HTTPException(status_code=504, detail="BFL Flux task timed out after 150s")

    # ── Main orchestration: cascade + sanitizer middleman ──
    # Quality cascade: Ultra → High → Standard (downgrades on failure)
    quality_cascade = []
    if quality == "Ultra":
        quality_cascade = ["Ultra", "High"]
    elif quality == "High":
        quality_cascade = ["High", "Standard"]
    else:
        quality_cascade = ["Standard"]

    last_error: Optional[Exception] = None
    for q_tier in quality_cascade:
        try:
            # Attempt 1: enhanced prompt
            return await _submit_and_poll(prompt, q_tier)
        except ContentBlockedError as cbe:
            # ── Prompt Sanitizer Middleman (Nanobanana Pillar #2) ──
            print(f"[Flux] Blocked by content moderation ({q_tier}) — invoking prompt middleman...")
            sanitized = await _sanitize_prompt(prompt)
            try:
                return await _submit_and_poll(sanitized, q_tier)
            except ContentBlockedError:
                print(f"[Flux] Still blocked after sanitization on {q_tier}. Trying lower tier...")
                last_error = cbe
            except Exception as e2:
                last_error = e2
                print(f"[Flux] {q_tier} sanitized retry failed: {e2}. Trying lower tier...")
        except Exception as e:
            last_error = e
            print(f"[Flux] {q_tier} failed: {str(e)[:200]}. Trying lower tier...")

    raise HTTPException(
        status_code=502,
        detail=f"Flux: all quality tiers in cascade failed. Last error: {last_error}"
    )


# ── CLAUDE PROMPT TAILORING HELPER ───────────────────────────────────────────

async def _claude_tailor_prompts(base_prompt: str, models: List[str]) -> Dict[str, str]:
    """Uses Gemini to tailor a prompt for each specified model's strengths (Anthropic fallback)."""
    # Anthropic API was returning 404s, so we use the working Gemini Flash instead.
    client = flash_client if flash_client else global_client
    if not client:
        return {m: base_prompt for m in models}

    model_descriptions = {
        "Nanobanana": "Google Gemini image generation — excels at creative illustration, dreamy conceptual images, cohesive color palettes, and whimsical fantasy art",
        "ChatGPT":    "OpenAI ChatGPT Image (GPT Image 1.5) — state-of-the-art at photorealistic imagery, complex multi-subject scenes, hyper-detailed textures, precise compositional control, and commercial photography quality with built-in quality enhancement pipeline",
        "Kling":      "Kling v1 AI — specializes in cinematic photography, hyper-detailed textures, fashion and portrait photography, and dramatic film-quality lighting",
        "Flux.1":     "Black Forest Labs Flux Pro 1.1 — state-of-the-art at typography integration, precise prompt adherence, vivid commercial-grade images, and realistic human subjects",
    }

    model_list_str = "\n".join([
        f"- {m}: {model_descriptions.get(m, 'General purpose AI image generation model')}"
        for m in models
    ])

    prompt_text = f"""You are an expert prompt engineer for AI image generation models.

The user wants to generate images with this base prompt:
\"{base_prompt}\"

They want to run this on the following {len(models)} AI models simultaneously:
{model_list_str}

CRITICAL RULES — follow these exactly:
1. The SUBJECT, SCENE, and CORE CONTENT of the user's prompt must NEVER change.
   - Do NOT replace the subject with something else (e.g. do NOT turn an architecture prompt into an astronaut scene).
2. Your ONLY job is to APPEND a short list of model-specific technical modifiers to the END of the original prompt.
   - Modifiers include: render quality descriptors, lighting terms, camera/lens terms, artistic medium terms.
   - Keep the appended suffix under 30 words.
   - The original prompt text MUST appear VERBATIM at the START of each tailored prompt.
3. Do NOT rewrite, rephrase, or summarize the user's prompt.
4. Do NOT invent a new subject or narrative.

Example of CORRECT behavior:
- User prompt: "a minimalist concrete building at dusk"
- Nanobanana: "a minimalist concrete building at dusk, soft painterly light, cohesive cool color palette, concept art quality"
- ChatGPT: "a minimalist concrete building at dusk, ultra-detailed photorealistic textures, commercial photography quality, sharp focus"

Example of WRONG behavior (NEVER do this):
- User prompt: "a minimalist concrete building at dusk"
- WRONG: "a solitary astronaut standing on an alien planet at dusk" <- changed the subject entirely

Respond ONLY with a valid JSON object. No markdown, no explanation outside JSON.

{{"tailored_prompts": {{ {', '.join([f'"{m}": ""' for m in models])} }} }}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=[prompt_text],
            config=types.GenerateContentConfig(
                temperature=0.3,  # Low temperature = more faithful, less hallucination
                response_mime_type="application/json",
            )
        )
        text = response.text.strip()
        parsed = json.loads(text)
        tailored = parsed.get("tailored_prompts", {})
        result = {}
        # Safety check prefix length — use min(40, len) to avoid index errors on short prompts
        check_len = min(40, len(base_prompt))
        for m in models:
            tp = tailored.get(m, base_prompt)
            # If Gemini diverged (didn't start with the original prompt), fall back to base
            if check_len > 10 and not tp.lower().startswith(base_prompt[:check_len].lower()):
                print(f"[TailorPrompts] Safety fallback for {m}: tailored prompt diverged. Using base prompt.")
                tp = base_prompt
            result[m] = tp
        print(f"[TailorPrompts] Tailored for {models} using Gemini Flash")
        return result
    except Exception as e:
        print(f"[TailorPrompts] Gemini error: {e}. Falling back to base prompt.")
        return {m: base_prompt for m in models}


# ── COMPARE BACKGROUND BATCH PROCESSOR ───────────────────────────────────────

async def _process_compare_batch(
    compare_session_id: str,
    image_slots: List[Dict],
    ratio: str,
    quality: str,
    image_base64: Optional[str],
    chatgpt_model: str = "gpt-image-2",
):
    """Run each model generation in parallel and update compare_images table."""

    async def run_one(img_id: str, model_id: str, tailored_prompt: str):
        url = None
        error_msg = None
        status = "failed"
        try:
            if model_id == "Nanobanana":
                imgs = await _gemini_generate(tailored_prompt, ratio, quality, image_base64)
                if imgs: url = imgs[0]
            elif model_id == "ChatGPT":
                imgs = await _chatgpt_image_generate(tailored_prompt, ratio, quality, image_base64, model=chatgpt_model)
                if imgs: url = imgs[0]
            elif model_id == "Kling":
                imgs = await _kling_generate(tailored_prompt, ratio, image_base64, quality)
                if imgs: url = imgs[0]
            elif model_id == "OpenAI":
                imgs = await _openai_generate(tailored_prompt, ratio, quality)
                if imgs: url = imgs[0]
            elif model_id == "Flux.1":
                imgs = await _flux_generate(tailored_prompt, ratio, quality)
                if imgs: url = imgs[0]
            else:
                error_msg = f"Model '{model_id}' is not yet integrated in this backend."

            if url:
                status = "completed"
            elif not error_msg:
                error_msg = "Model returned no image."

        except HTTPException as e:
            error_msg = e.detail
            print(f"[Compare] HTTPException for {model_id}: {e.detail}")
        except Exception as e:
            error_msg = str(e)
            print(f"[Compare] Unexpected error for {model_id}: {e}")

        try:
            update_db = SessionLocal()
            try:
                url = await _materialize_image_url(url)
                update_db.query(DBCompareImage).filter(DBCompareImage.id == img_id).update({
                    "status": status, 
                    "url": url, 
                    "error_msg": error_msg
                })
                update_db.commit()
            except Exception as db_err:
                print(f"[Compare] Database update failed for {model_id}: {db_err}")
                update_db.rollback()
            finally:
                update_db.close()
        except Exception as e:
            print(f"[Compare] Could not create database session for {model_id}: {e}")
        
        print(f"[Compare] {model_id} -> {status}")

    tasks = [run_one(s["id"], s["model_id"], s["tailored_prompt"]) for s in image_slots]
    await asyncio.gather(*tasks)


# ── COMPARE ENDPOINTS ─────────────────────────────────────────────────────────

@app.post("/api/compare/start")
async def compare_start(
    request: CompareStartRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    access_error = _generation_access_error(user)
    if access_error:
        raise access_error

    """Start a multi-model comparison session. Returns compare_session_id and pending image slots."""
    compare_session_id = request.session_id or str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    if request.session_id:
        existing_session = db.query(DBCompareSession).filter(DBCompareSession.id == request.session_id).first()
        if existing_session and existing_session.user_id != user.id:
            raise HTTPException(status_code=404, detail="Compare session not found")

    print(f"[Compare] Starting session {compare_session_id} with models: {request.models}")

    # Tailor prompt for each model via Claude
    tailored = await _claude_tailor_prompts(request.prompt, request.models)

    # Check if session exists
    existing_session = db.query(DBCompareSession).filter(DBCompareSession.id == compare_session_id).first()
    if not existing_session:
        new_comp_session = DBCompareSession(
            id=compare_session_id,
            user_id=user.id,
            original_prompt=request.prompt,
            models=json.dumps(request.models),
            ratio=request.ratio,
            quality=request.quality,
            active_configs=json.dumps(request.categories),
            created_at=now
        )
        db.add(new_comp_session)

    image_slots = []
    for model_id in request.models:
        img_id = str(uuid.uuid4())
        tp = tailored.get(model_id, request.prompt)
        new_comp_img = DBCompareImage(
            id=img_id,
            compare_session_id=compare_session_id,
            user_id=user.id,
            model_id=model_id,
            original_prompt=request.prompt,
            tailored_prompt=tp,
            status="pending",
            url=None,
            error_msg=None,
            iteration=0,
            created_at=now
        )
        db.add(new_comp_img)
        image_slots.append({"id": img_id, "model_id": model_id, "tailored_prompt": tp})

    db.commit()

    background_tasks.add_task(
        _process_compare_batch,
        compare_session_id, image_slots, request.ratio, request.quality, request.image_base64,
        chatgpt_model=request.chatgpt_model,
    )

    return {
        "compare_session_id": compare_session_id,
        "images": [
            {
                "id": s["id"],
                "model_id": s["model_id"],
                "original_prompt": request.prompt,
                "tailored_prompt": s["tailored_prompt"],
                "status": "pending",
                "url": None,
                "error_msg": None,
                "iteration": 0
            }
            for s in image_slots
        ]
    }


@app.get("/api/compare/{compare_session_id}")
async def get_compare_session(
    compare_session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Poll the status of all images in a compare session."""
    _ensure_compare_session_owner(db, compare_session_id, user.id)
    session = db.query(DBCompareSession).filter(DBCompareSession.id == compare_session_id, DBCompareSession.user_id == user.id).first()

    images = db.query(DBCompareImage).filter(DBCompareImage.compare_session_id == compare_session_id).all()

    return {
        "id": session.id,
        "original_prompt": session.original_prompt,
        "models": json.loads(session.models),
        "ratio": session.ratio,
        "quality": session.quality,
        "active_configs": json.loads(session.active_configs),
        "created_at": session.created_at,
        "images": [
            {
                "id": img.id,
                "model_id": img.model_id,
                "original_prompt": img.original_prompt,
                "tailored_prompt": img.tailored_prompt,
                "status": img.status,
                "url": img.url,
                "error_msg": img.error_msg,
                "iteration": img.iteration,
                "created_at": img.created_at
            }
            for img in images
        ]
    }
@app.post("/api/compare/{compare_session_id}/feedback")
async def compare_feedback(
    compare_session_id: str,
    request: CompareFeedbackRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Regenerate specific models with user feedback appended to their tailored prompt."""
    _ensure_compare_session_owner(db, compare_session_id, user.id)
    session = db.query(DBCompareSession).filter(DBCompareSession.id == compare_session_id, DBCompareSession.user_id == user.id).first()

    now = datetime.utcnow().isoformat()
    new_slots = []

    for model_id, feedback_text in request.feedbacks.items():
        # Find the latest tailored prompt for this model
        latest = db.query(DBCompareImage).filter(
            DBCompareImage.compare_session_id == compare_session_id,
            DBCompareImage.model_id == model_id
        ).order_by(DBCompareImage.iteration.desc()).first()

        base_tp = latest.tailored_prompt if latest else session.original_prompt
        new_tp = f"{base_tp}, {feedback_text.strip()}" if feedback_text.strip() else base_tp
        new_iteration = (latest.iteration + 1) if latest else 1

        new_img_id = str(uuid.uuid4())
        new_comp_img = DBCompareImage(
            id=new_img_id,
            compare_session_id=compare_session_id,
            user_id=user.id,
            model_id=model_id,
            original_prompt=session.original_prompt,
            tailored_prompt=new_tp,
            status="pending",
            url=None,
            error_msg=None,
            iteration=new_iteration,
            created_at=now
        )
        db.add(new_comp_img)
        new_slots.append({"id": new_img_id, "model_id": model_id, "tailored_prompt": new_tp})
        print(f"[Compare/Feedback] {model_id} -> iteration {new_iteration}")

    db.commit()

    background_tasks.add_task(
        _process_compare_batch,
        compare_session_id, new_slots, request.ratio, request.quality, request.image_base64,
        chatgpt_model=request.chatgpt_model if hasattr(request, 'chatgpt_model') else "gpt-image-2",
    )

    return {
        "new_images": [
            {"id": s["id"], "model_id": s["model_id"], "tailored_prompt": s["tailored_prompt"], "status": "pending", "iteration": 0}
            for s in new_slots
        ]
    }


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/download")
async def proxy_download_image(url: str, format: str = "png"):
    from fastapi.responses import Response
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, timeout=30.0)
            resp.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch image: {str(e)}")
            
        try:
            img = Image.open(io.BytesIO(resp.content))
            
            output = io.BytesIO()
            if format.lower() == "tiff":
                # Convert to RGB if necessary (TIFF supports RGBA but sometimes fails with specific palettes)
                if img.mode not in ('L', 'RGB', 'RGBA', 'CMYK'):
                    img = img.convert('RGBA')
                img.save(output, format="TIFF", compression="tiff_deflate")
                media_type = "image/tiff"
                filename = "image.tiff"
            else:
                # Default format is PNG
                img.save(output, format="PNG")
                media_type = "image/png"
                filename = "image.png"
                
            return Response(
                content=output.getvalue(),
                media_type=media_type,
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
