"""
BFF (Backend-For-Frontend) Proxy for Creative Suite UI
-------------------------------------------------------
Thin FastAPI service that:
  1. Holds the X-Suite-API-Key securely (never sent to the browser)
  2. Forwards chat requests to the Copy Agent endpoint at copyagennt.in
  3. Supports both JSON and SSE streaming responses
  4. Provides real email/password + Google auth with OTP email verification
  5. Syncs verified users to CopyAgent via /api/users/register-suite-user

Auth endpoints:
  POST /auth/signup       — create pending user, send OTP
  POST /auth/verify-otp  — verify OTP, create user, sync to CopyAgent
  POST /auth/resend-otp  — resend OTP
  POST /auth/login       — login with email + password
  POST /auth/google      — verify Google credential, create/sync user
  GET  /auth/me          — return current user from JWT cookie
  POST /auth/logout      — clear cookie

BFF endpoints (unchanged):
  POST /bff/chat/completions
  GET  /bff/genfy/styles
  *    /bff/genfy/{path}
"""

import os
import json
import asyncio
import uuid
import hashlib
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import AsyncGenerator, Optional

import httpx
from fastapi import FastAPI, HTTPException, Request, Response, BackgroundTasks, Cookie, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# SQLAlchemy for local SQLite suite users DB
from sqlalchemy import create_engine, Column, String, Boolean, DateTime, Text, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from passlib.context import CryptContext
from jose import JWTError, jwt as jose_jwt

# ── Load environment ──────────────────────────────────────────────────────────
load_dotenv()

SUITE_API_KEY: str    = os.getenv("SUITE_API_KEY", "")
STATIC_USER_ID: str   = os.getenv("USER_ID", "")          # fallback for unauthenticated use
COPYAGENT_URL: str    = os.getenv(
    "COPYAGENT_URL",
    "https://www.copyagennt.in/api/integration/v1/chat/completions",
)
FRONTEND_ORIGIN: str  = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
COPYAGENT_BASE_URL: str = os.getenv("COPYAGENT_BASE_URL", "https://www.copyagennt.in")

if not SUITE_API_KEY:
    raise RuntimeError("SUITE_API_KEY is not set in environment.")

# ── Suite auth config ─────────────────────────────────────────────────────────
SUITE_SECRET_KEY: str  = os.getenv("SUITE_SECRET_KEY", "fallback-insecure-key")
SUITE_DB_URL: str      = os.getenv("SUITE_DB_URL", "sqlite:///./suite.db")
JWT_ALGORITHM          = "HS256"
JWT_EXPIRE_DAYS        = 7
OTP_EXPIRE_MINUTES     = 10
GOOGLE_CLIENT_ID       = "802361061203-55201dnd5a513n745tu2o0rv0uadsao2.apps.googleusercontent.com"

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── SQLite database setup ─────────────────────────────────────────────────────
SuiteBase = declarative_base()
suite_engine = create_engine(
    SUITE_DB_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

@event.listens_for(suite_engine, "connect")
def _set_wal(dbapi_conn, _record):
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA synchronous=NORMAL")
    cur.close()

SuiteSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=suite_engine)


class SuiteUser(SuiteBase):
    """Verified Creative Suite users."""
    __tablename__ = "suite_users"
    id                = Column(String(36), primary_key=True)
    email             = Column(String(255), unique=True, nullable=False, index=True)
    password_hash     = Column(String(255), nullable=True)
    name              = Column(String(255), nullable=True)
    auth_provider     = Column(String(50), default="email")
    google_id         = Column(String(255), nullable=True, unique=True)
    profile_picture   = Column(Text, nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    copyagent_synced  = Column(Boolean, default=False)
    copyagent_user_id = Column(String(36), nullable=True)


class SuitePendingUser(SuiteBase):
    """Unverified signups waiting for OTP confirmation."""
    __tablename__ = "suite_pending_users"
    id             = Column(String(36), primary_key=True)
    email          = Column(String(255), unique=True, nullable=False, index=True)
    password_hash  = Column(String(255), nullable=False)
    name           = Column(String(255), nullable=True)
    otp_hash       = Column(String(64), nullable=False)
    otp_expires_at = Column(DateTime, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow)


# Create tables on first startup
SuiteBase.metadata.create_all(suite_engine)


def get_suite_db():
    db = SuiteSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Auth utilities ────────────────────────────────────────────────────────────

def _hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)

def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def _create_jwt(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    return jose_jwt.encode({"sub": user_id, "exp": expire}, SUITE_SECRET_KEY, algorithm=JWT_ALGORITHM)

def _decode_jwt(token: str) -> Optional[str]:
    try:
        payload = jose_jwt.decode(token, SUITE_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

def _generate_otp():
    """Return (otp_plain, otp_hash)."""
    otp      = str(secrets.randbelow(1000000)).zfill(6)
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    return otp, otp_hash

def _set_auth_cookie(response: Response, user_id: str):
    token = _create_jwt(user_id)
    response.set_cookie(
        key="suite_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * JWT_EXPIRE_DAYS,
        path="/",
    )


# ── Mail config ───────────────────────────────────────────────────────────────
MAIL_SERVER    = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT      = int(os.getenv("MAIL_PORT", "587"))
MAIL_USERNAME  = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD  = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM      = os.getenv("MAIL_FROM", "")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Creative Suite")


def _send_otp_email_sync(to_email: str, otp: str, name: str = ""):
    try:
        display = name or to_email.split("@")[0]
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Creative Suite verification code"
        msg["From"]    = f"{MAIL_FROM_NAME} <{MAIL_FROM}>"
        msg["To"]      = to_email
        html = f"""
        <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
          <h2 style="font-size:22px;font-weight:600;color:#16192b;margin:0 0 8px;">Verify your email</h2>
          <p style="color:#555;font-size:14px;margin:0 0 32px;">
            Hi {display}, enter this code to activate your Creative Suite account:
          </p>
          <div style="background:#f4f4f4;border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#16192b;">{otp}</span>
          </div>
          <p style="color:#888;font-size:12px;">
            This code expires in {OTP_EXPIRE_MINUTES} minutes.
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
        """
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
            server.starttls()
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_FROM, to_email, msg.as_string())
        print(f"[Auth] OTP sent to {to_email}")
    except Exception as exc:
        print(f"[Auth] Failed to send OTP to {to_email}: {exc}")


async def _send_otp_email(to_email: str, otp: str, name: str = ""):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_otp_email_sync, to_email, otp, name)


# ── CopyAgent sync ────────────────────────────────────────────────────────────

def _build_copyagent_user_payload(
    user_id: str,
    email: str,
    name: str,
    password_hash: Optional[str],
    auth_provider: str = "email",
    google_id: Optional[str] = None,
    profile_picture: Optional[str] = None,
) -> dict:
    return {
        "id":              user_id,
        "email":           email,
        "name":            name or email.split("@")[0],
        "password_hash":   password_hash,
        "auth_provider":   auth_provider,
        "google_id":       google_id,
        "profile_picture": profile_picture,
        "plan_type":       "agency",
        "plan_name":       "agency",
    }


async def _sync_to_copyagent(
    user_id: str,
    email: str,
    name: str,
    password_hash: Optional[str],
    auth_provider: str = "email",
    google_id: Optional[str] = None,
    profile_picture: Optional[str] = None,
) -> bool:
    payload = _build_copyagent_user_payload(
        user_id=user_id,
        email=email,
        name=name,
        password_hash=password_hash,
        auth_provider=auth_provider,
        google_id=google_id,
        profile_picture=profile_picture,
    )
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{COPYAGENT_BASE_URL}/api/users/register-suite-user",
                json=payload,
                headers={"X-Suite-API-Key": SUITE_API_KEY},
            )
        if resp.status_code in {200, 201, 202}:
            print(f"[Auth] CopyAgent sync OK for {email}: {resp.json().get('status')}")
            return True
        print(f"[Auth] CopyAgent sync FAILED ({resp.status_code}) for {email}: {resp.text[:300]}")
        return False
    except Exception as exc:
        print(f"[Auth] CopyAgent sync ERROR for {email}: {exc}")
        return False


# ── Request schemas ───────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResendOTPRequest(BaseModel):
    email: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleAuthRequest(BaseModel):
    credential: str

class ChatRequest(BaseModel):
    user_message: str
    llm_model: Optional[str] = "claude-4-sonnet"
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False
    conversation_id: Optional[str] = None
    external_project_data: Optional[dict] = None


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Creative Suite BFF Proxy",
    description="Thin proxy that securely forwards Copy Agent requests + handles Suite auth",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Accept", "Origin", "Authorization"],
)


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/bff/auth/signup")
async def auth_signup(
    body: SignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_suite_db),
):
    """Step 1: Validate, create pending user, send OTP."""
    email    = body.email.lower().strip()
    password = body.password

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    if db.query(SuiteUser).filter(SuiteUser.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    pw_hash     = _hash_password(password)
    otp, otp_hash = _generate_otp()
    expires_at  = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    pending = db.query(SuitePendingUser).filter(SuitePendingUser.email == email).first()
    if pending:
        pending.password_hash  = pw_hash
        pending.name           = body.name or pending.name
        pending.otp_hash       = otp_hash
        pending.otp_expires_at = expires_at
    else:
        pending = SuitePendingUser(
            id=str(uuid.uuid4()),
            email=email,
            password_hash=pw_hash,
            name=body.name,
            otp_hash=otp_hash,
            otp_expires_at=expires_at,
        )
        db.add(pending)
    db.commit()

    background_tasks.add_task(_send_otp_email, email, otp, body.name or "")

    return {"status": "otp_sent", "message": "Verification code sent to your email."}


@app.post("/bff/auth/verify-otp")
async def auth_verify_otp(
    body: VerifyOTPRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_suite_db),
):
    """Step 2: Verify OTP → create suite user → sync to CopyAgent → set cookie."""
    email    = body.email.lower().strip()
    otp_hash = hashlib.sha256(body.otp.strip().encode()).hexdigest()

    pending = db.query(SuitePendingUser).filter(SuitePendingUser.email == email).first()
    if not pending:
        raise HTTPException(status_code=400, detail="No pending signup found. Please sign up first.")

    if datetime.utcnow() > pending.otp_expires_at:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please sign up again.")

    if pending.otp_hash != otp_hash:
        raise HTTPException(status_code=400, detail="Incorrect verification code.")

    user_id  = pending.id
    pw_hash  = pending.password_hash
    name     = pending.name

    new_user = SuiteUser(
        id=user_id,
        email=email,
        password_hash=pw_hash,
        name=name,
        auth_provider="email",
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.delete(pending)
    db.commit()
    db.refresh(new_user)

    # Sync to CopyAgent immediately (await inline for instant provisioning)
    await _sync_to_copyagent(
        user_id=user_id,
        email=email,
        name=name or email.split("@")[0],
        password_hash=pw_hash,
        auth_provider="email",
    )

    _set_auth_cookie(response, user_id)
    return {
        "status": "success",
        "user": {"id": user_id, "email": email, "name": name, "auth_provider": "email"},
    }


@app.post("/bff/auth/resend-otp")
async def auth_resend_otp(
    body: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_suite_db),
):
    """Re-generate and resend OTP for a pending signup."""
    email = body.email.lower().strip()
    pending = db.query(SuitePendingUser).filter(SuitePendingUser.email == email).first()
    if not pending:
        raise HTTPException(status_code=404, detail="No pending signup found for this email.")

    otp, otp_hash = _generate_otp()
    pending.otp_hash       = otp_hash
    pending.otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    db.commit()

    background_tasks.add_task(_send_otp_email, email, otp, pending.name or "")
    return {"status": "otp_resent", "message": "New verification code sent."}


@app.post("/bff/auth/login")
async def auth_login(
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_suite_db),
):
    """Authenticate with email + password. Returns JWT cookie."""
    email = body.email.lower().strip()
    user  = db.query(SuiteUser).filter(SuiteUser.email == email).first()

    if not user or user.auth_provider != "email":
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.password_hash or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    _set_auth_cookie(response, user.id)
    return {
        "status": "success",
        "user": {
            "id": user.id, "email": user.email, "name": user.name,
            "auth_provider": user.auth_provider, "profile_picture": user.profile_picture,
        },
    }


@app.post("/bff/auth/google")
async def auth_google(
    body: GoogleAuthRequest,
    response: Response,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_suite_db),
):
    """Verify Google credential, create/find user. No OTP needed (Google verified the email)."""
    try:
        from google.oauth2 import id_token as g_id_token
        try:
            from google.auth.transport import requests as g_requests
            request = g_requests.Request()
        except Exception:
            from google.auth.transport import urllib3 as g_urllib3
            request = g_urllib3.Request()

        idinfo = g_id_token.verify_oauth2_token(
            body.credential, request, GOOGLE_CLIENT_ID,
        )
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Google token verification failed: {exc}")

    email     = idinfo.get("email", "").lower().strip()
    google_id = idinfo.get("sub", "")
    name      = idinfo.get("name", "")
    picture   = idinfo.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email.")

    user = (
        db.query(SuiteUser).filter(SuiteUser.google_id == google_id).first()
        or db.query(SuiteUser).filter(SuiteUser.email == email).first()
    )

    if user:
        user.google_id       = google_id
        user.profile_picture = picture or user.profile_picture
        user.name            = name or user.name
        db.commit()
        db.refresh(user)
        user_id = user.id
    else:
        user_id = str(uuid.uuid4())
        user = SuiteUser(
            id=user_id, email=email, name=name,
            auth_provider="google", google_id=google_id,
            profile_picture=picture, created_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Sync to CopyAgent immediately (await inline for instant provisioning)
        await _sync_to_copyagent(
            user_id=user_id, email=email, name=name,
            password_hash=None, auth_provider="google",
            google_id=google_id, profile_picture=picture,
        )

    _set_auth_cookie(response, user_id)
    return {
        "status": "success",
        "user": {"id": user_id, "email": email, "name": name,
                 "auth_provider": "google", "profile_picture": picture},
    }


@app.get("/bff/auth/me")
async def auth_me(
    suite_session: Optional[str] = Cookie(None),
    db: Session = Depends(get_suite_db),
):
    """Return current user from session cookie."""
    if not suite_session:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user_id = _decode_jwt(suite_session)
    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired.")
    user = db.query(SuiteUser).filter(SuiteUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    return {
        "id": user.id, "email": user.email, "name": user.name,
        "auth_provider": user.auth_provider, "profile_picture": user.profile_picture,
    }


@app.post("/bff/auth/logout")
async def auth_logout(response: Response):
    """Clear the session cookie."""
    response.delete_cookie(key="suite_session", path="/")
    return {"status": "logged_out"}


# ── Upstream headers (API key injected server-side) ───────────────────────────
def _upstream_headers(user_id: Optional[str] = None) -> dict:
    effective_user_id = user_id or STATIC_USER_ID
    return {
        "Content-Type":    "application/json",
        "X-Suite-API-Key": SUITE_API_KEY,
        "X-User-Id":       effective_user_id,
    }


# ── SSE streaming passthrough ─────────────────────────────────────────────────
async def _stream_from_upstream(payload: dict, user_id: Optional[str]) -> AsyncGenerator[str, None]:
    """Open an SSE connection to copyagennt.in and yield each raw SSE line back."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            COPYAGENT_URL,
            headers=_upstream_headers(user_id),
            json=payload,
        ) as upstream:
            if upstream.status_code != 200:
                error_body = await upstream.aread()
                error_text = error_body.decode("utf-8", errors="replace")
                snippet    = error_text[:300]
                err_payload = json.dumps({"error": f"Upstream error {upstream.status_code}: {snippet}"})
                yield f"data: {err_payload}\n\n"
                return
            async for line in upstream.aiter_lines():
                if line:
                    yield f"{line}\n\n"


# ── Main chat endpoint ────────────────────────────────────────────────────────
@app.post("/bff/chat/completions")
async def chat_completions(
    request: Request,
    body: ChatRequest,
    suite_session: Optional[str] = Cookie(None),
):
    """
    Forward a chat completion request to the Copy Agent backend.
    User-id is read from the JWT cookie; falls back to env USER_ID.
    """
    user_id: Optional[str] = None
    if suite_session:
        user_id = _decode_jwt(suite_session)
    if not user_id:
        user_id = STATIC_USER_ID

    upstream_payload = {
        "user_message":    body.user_message,
        "llm_model":       body.llm_model or "claude-4-sonnet",
        "temperature":     body.temperature if body.temperature is not None else 0.7,
        "stream":          body.stream or False,
        "conversation_id": body.conversation_id,
    }
    if body.external_project_data:
        upstream_payload["external_project_data"] = body.external_project_data

    if body.stream:
        return StreamingResponse(
            _stream_from_upstream(upstream_payload, user_id),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            upstream = await client.post(
                COPYAGENT_URL,
                headers=_upstream_headers(user_id),
                json=upstream_payload,
            )
        if not upstream.is_success:
            raise HTTPException(status_code=upstream.status_code, detail=upstream.text[:500])
        return upstream.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream Copy Agent timed out.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach Copy Agent: {exc}")


# ── Genfy Integration ──────────────────────────────────────────────────────────
GENFY_URL: str   = os.getenv("GENFY_URL", "http://host.docker.internal:8005")
GENFY_TOKEN: str = ""

async def _get_genfy_token() -> str:
    global GENFY_TOKEN
    if GENFY_TOKEN:
        return GENFY_TOKEN
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            r = await client.post(
                f"{GENFY_URL}/api/users/login",
                json={"email": "admin@genfy.app", "password": "Genfy@Admin123!Secure"},
            )
            print(f"Genfy login status: {r.status_code}")
            if r.status_code == 200:
                token = r.cookies.get("session_token")
                if not token:
                    raw = r.headers.get("set-cookie", "")
                    print(f"Raw Set-Cookie: {raw[:120]}")
                    for part in raw.split(";"):
                        part = part.strip()
                        if part.lower().startswith("session_token="):
                            token = part.split("=", 1)[1]
                            break
                if token:
                    GENFY_TOKEN = token
                    print(f"Genfy token obtained (length={len(token)})")
                    return GENFY_TOKEN
                else:
                    print("Genfy login 200 but no session_token cookie found")
        except Exception as exc:
            print(f"Error logging into Genfy: {exc}")
    return ""

@app.get("/bff/genfy/styles")
async def get_genfy_styles():
    """Return the style configuration catalog for Genfy UI."""
    return {
        "categories": {
            "style": [
                { "id": "photorealistic", "label": "Photorealistic", "desc": "Real-world photographic quality", "prompt": "photorealistic, ultra realistic, highly detailed textures, natural lighting", "gradient": ["#8BA8C0", "#C9A96E", "#6B8E7F"], "thumbnail": "/previews/Photorealistic.jpg" },
                { "id": "cinematic", "label": "Cinematic", "desc": "Film-style dramatic visuals", "prompt": "cinematic style, dramatic lighting, film still, high contrast, movie quality", "gradient": ["#0D0D1A", "#E94560", "#533483"], "thumbnail": "/previews/Cinematic.jpg" },
                { "id": "anime", "label": "Anime", "desc": "Japanese animation style", "prompt": "anime style, cel shading, vibrant colors, clean outlines", "gradient": ["#FFB7C5", "#87CEEB", "#DDA0DD"], "thumbnail": "/previews/Anime.jpg" },
                { "id": "oil-paint", "label": "Oil Painting", "desc": "Classic painterly look", "prompt": "oil painting, visible brush strokes, rich textures, classical art style", "gradient": ["#8B4513", "#D2691E", "#A0522D"], "thumbnail": "/previews/Oilpainting.jpg" },
                { "id": "watercolor", "label": "Watercolor", "desc": "Soft blended paint", "prompt": "watercolor painting, soft edges, translucent colors, artistic wash", "gradient": ["#B5EAD7", "#FFDAC1", "#C7CEEA"], "thumbnail": "/previews/Watercolor.jpg" },
                { "id": "concept-art", "label": "Concept Art", "desc": "Detailed creative illustration", "prompt": "concept art, highly detailed, digital painting, production design style", "gradient": ["#1C1C4E", "#C05C7E", "#F3826F"], "thumbnail": "/previews/Conceptart.jpg" },
                { "id": "3d-render", "label": "3D Render", "desc": "CGI generated look", "prompt": "3D render, octane render, global illumination, volumetric lighting", "gradient": ["#1A1A2E", "#16213E", "#4FC3F7"], "thumbnail": "/previews/3drender.jpg" },
                { "id": "minimalist", "label": "Minimalist", "desc": "Clean and simple composition", "prompt": "minimalist, clean composition, simple forms, lots of negative space", "gradient": ["#E8E8E3", "#D4D4CF", "#BFBFBA"], "thumbnail": "/previews/Minimalist.jpg" }
            ],
            "medium": [
                { "id": "digital", "label": "Digital Art", "desc": "Modern digital painting", "prompt": "digital art, smooth shading, modern illustration", "gradient": ["#1A0533", "#6C3483", "#D2B4DE"], "thumbnail": "/previews/Digitalart.jpg" },
                { "id": "photography", "label": "Photography", "desc": "Captured via camera", "prompt": "professional photography, realistic lighting, high dynamic range", "gradient": ["#2C3E50", "#7F8C8D", "#ECF0F1"], "thumbnail": "/previews/Photography.jpg" },
                { "id": "charcoal", "label": "Charcoal", "desc": "Dark textured strokes", "prompt": "charcoal drawing, rough texture, high contrast shading", "gradient": ["#1C1C1C", "#404040", "#808080"], "thumbnail": "/previews/Charcoal.jpg" },
                { "id": "ink", "label": "Ink Drawing", "desc": "Line-based art", "prompt": "ink drawing, black lines, detailed linework, high contrast", "gradient": ["#0D0D0D", "#1A1A1A", "#F5F5F0"], "thumbnail": "/previews/Inkdrawing.jpg" },
                { "id": "acrylic", "label": "Acrylic", "desc": "Bold opaque paint", "prompt": "acrylic painting, bold colors, thick paint texture", "gradient": ["#FF6B6B", "#FFE66D", "#4ECDC4"], "thumbnail": "/previews/Acrylic.jpg" },
                { "id": "collage", "label": "Mixed Media", "desc": "Layered textures", "prompt": "mixed media collage, layered textures, experimental composition", "gradient": ["#E74C3C", "#F39C12", "#2ECC71"], "thumbnail": "/previews/Mixedmedia.jpg" }
            ],
            "lighting": [
                { "id": "natural", "label": "Natural", "desc": "Soft daylight", "prompt": "natural lighting, soft diffused daylight, no harsh shadows, even illumination", "gradient": ["#E8F5E9", "#A5D6A7", "#66BB6A"], "thumbnail": "/previews/Natural.jpg" },
                { "id": "golden", "label": "Golden Hour", "desc": "Warm sunlight", "prompt": "golden hour lighting, warm sunlight, soft shadows, sunset glow", "gradient": ["#FF8C42", "#FF5D01", "#FFBA08"], "thumbnail": "/previews/Goldenhour.jpg" },
                { "id": "blue-hour", "label": "Blue Hour", "desc": "Cool twilight", "prompt": "blue hour lighting, cool tones, soft ambient light", "gradient": ["#0D3349", "#1B6CA8", "#89C4F4"], "thumbnail": "/previews/Bluehour.jpg" },
                { "id": "studio", "label": "Studio", "desc": "Controlled lighting", "prompt": "studio lighting, softbox lighting, evenly lit subject", "gradient": ["#F0F0F0", "#D0D0D0", "#B0B0B0"], "thumbnail": "/previews/Studio.jpg" },
                { "id": "dramatic", "label": "Dramatic", "desc": "High contrast", "prompt": "dramatic lighting, deep shadows, strong highlights", "gradient": ["#0A0A0A", "#1C1C1C", "#8B0000"], "thumbnail": "/previews/Dramatic.jpg" },
                { "id": "neon", "label": "Neon", "desc": "Colorful artificial light", "prompt": "neon lighting, glowing lights, vibrant colors, cyberpunk glow", "gradient": ["#FF00FF", "#00FFFF", "#0A0A2E"], "thumbnail": "/previews/Neon.jpg" },
                { "id": "volumetric", "label": "Volumetric", "desc": "Light rays", "prompt": "volumetric lighting, god rays, fog, light beams", "gradient": ["#FFF8E1", "#F3E5AB", "#C5A028"], "thumbnail": "/previews/Volumetric.jpg" },
                { "id": "moonlight", "label": "Moonlight", "desc": "Night lighting", "prompt": "moonlight, cool blue tones, soft shadows", "gradient": ["#1C2951", "#2E4A7A", "#C8D8F0"], "thumbnail": "/previews/Moonlight.jpg" },
                { "id": "candlelight", "label": "Candlelight", "desc": "Warm soft glow", "prompt": "candlelight, warm glow, soft flickering light", "gradient": ["#FF6600", "#FF9900", "#FFCC00"], "thumbnail": "/previews/Candlelight.jpg" }
            ],
            "composition": [
                { "id": "centered", "label": "Centered", "desc": "Symmetrical framing", "prompt": "centered composition, symmetrical framing", "gradient": ["#2C3E50", "#3498DB", "#ECF0F1"], "thumbnail": "/previews/Centred.jpg" },
                { "id": "rule-thirds", "label": "Rule of Thirds", "desc": "Off-center balance", "prompt": "rule of thirds composition, balanced framing", "gradient": ["#1A472A", "#2D6A4F", "#74C69D"], "thumbnail": "/previews/Ruleofthirds.jpg" },
                { "id": "flat-lay", "label": "Flat Lay", "desc": "Top-down arrangement", "prompt": "flat lay, top down view", "gradient": ["#F8F0E3", "#E8D5B7", "#CBBAA0"], "thumbnail": "/previews/Flatlay.jpg" },
                { "id": "panoramic", "label": "Panoramic", "desc": "Ultra-wide landscape", "prompt": "panoramic composition, ultra wide view", "gradient": ["#0077B6", "#00B4D8", "#90E0EF"], "thumbnail": "/previews/Panoramic.jpg" }
            ],
            "camera": [
                { "id": "worms-eye", "label": "Worm's Eye View", "desc": "Looking straight up", "prompt": "worm's eye view, extreme low angle, looking up perspective", "gradient": ["#0A0A1A", "#1E1E3E", "#4040A0"], "thumbnail": "/previews/Wormseyeview.jpg" },
                { "id": "dutch", "label": "Dutch Angle", "desc": "Tilted dramatic frame", "prompt": "dutch angle, tilted frame, dynamic composition", "gradient": ["#1A0A0A", "#3E1E1E", "#A04040"], "thumbnail": "/previews/Dutchangle.jpg" },
                { "id": "birds-eye", "label": "Bird's Eye", "desc": "Looking down from above", "prompt": "bird's eye view, top down perspective", "gradient": ["#0A1A0A", "#1E3E1E", "#4040A0"], "thumbnail": "/previews/Birdseye.jpg" },
                { "id": "extreme-cu", "label": "Extreme Close-Up", "desc": "Macro extreme detail", "prompt": "extreme close-up, macro detail, highly detailed subject", "gradient": ["#1A1A0A", "#3E3E1E", "#A0A040"], "thumbnail": "/previews/Extremecloseup.jpg" },
                { "id": "wide-shot", "label": "Wide Shot", "desc": "Full environment view", "prompt": "wide shot, full scene view, environmental composition", "gradient": ["#0A1A1A", "#1E3E3E", "#40A0A0"], "thumbnail": "/previews/Wideshot.jpg" },
                { "id": "medium-shot", "label": "Medium Shot", "desc": "Waist-up portrait", "prompt": "medium shot, waist-up framing", "gradient": ["#1A0A1A", "#3E1E3E", "#A04040"], "thumbnail": "/previews/Mediumshot.jpg" },
                { "id": "close-up", "label": "Close-Up", "desc": "Face or detail fill", "prompt": "close-up shot, detailed subject focus", "gradient": ["#1A0A08", "#3E2018", "#C06040"], "thumbnail": "/previews/Closeup.jpg" },
                { "id": "low-angle", "label": "Low Angle", "desc": "Looking up, heroic", "prompt": "low angle shot, looking up, dramatic perspective", "gradient": ["#080A1A", "#18203E", "#4060C0"], "thumbnail": "/previews/Lowangle.jpg" }
            ],
            "lens": [
                { "id": "24mm", "label": "24mm Wide", "desc": "Broad environmental", "prompt": "24mm wide lens, wide perspective, environmental depth", "gradient": ["#1A2A1A", "#2A4A2A", "#4A8A4A"], "thumbnail": "/previews/24mmwideperspective.jpg" },
                { "id": "50mm", "label": "50mm Normal", "desc": "Natural eye perspective", "prompt": "50mm lens, natural perspective", "gradient": ["#2A1A1A", "#4A2A2A", "#8A4A8A"], "thumbnail": "/previews/50mmnaturalview.jpg" },
                { "id": "85mm", "label": "85mm Portrait", "desc": "Flattering compression", "prompt": "85mm lens, portrait compression, shallow depth of field", "gradient": ["#1A1A2A", "#2A2A4A", "#4A4A8A"], "thumbnail": "/previews/85mmportraitcompression.jpg" },
                { "id": "135mm", "label": "135mm Telephoto", "desc": "Subject separation", "prompt": "135mm telephoto lens, strong subject isolation", "gradient": ["#2A1A2A", "#4A2A4A", "#8A4A8A"], "thumbnail": "/previews/135mmtelephotoisolation.jpg" },
                { "id": "macro", "label": "Macro", "desc": "Extreme close detail", "prompt": "macro photography, extreme close-up, shallow depth of field, fine details", "gradient": ["#1A2A2A", "#2A4A4A", "#4A8A8A"], "thumbnail": "/previews/Macroextremedetail.jpg" },
                { "id": "fisheye", "label": "Fisheye", "desc": "Distorted 180° view", "prompt": "fisheye lens, ultra wide distortion, curved perspective", "gradient": ["#2A2A1A", "#4A4A2A", "#8A8A4A"], "thumbnail": "/previews/Fisheyecurveddistortion.jpg" }
            ],
            "mood": [
                { "id": "serene", "label": "Serene", "desc": "Calm and peaceful", "prompt": "serene atmosphere, calm, peaceful", "gradient": ["#AED6F1", "#D6EAF8", "#EBF5FB"], "thumbnail": "/previews/Serene.jpg" },
                { "id": "dramatic-mood", "label": "Dramatic", "desc": "Intense and powerful", "prompt": "dramatic mood, intense, powerful", "gradient": ["#17202A", "#922B21", "#E74C3C"], "thumbnail": "/previews/Dramatic Intense.jpg" },
                { "id": "ethereal", "label": "Ethereal", "desc": "Dreamy, otherworldly", "prompt": "ethereal, dreamy, soft glow, otherworldly", "gradient": ["#D7BDE2", "#E8DAEF", "#FDFEFE"], "thumbnail": "/previews/Ethereal.jpg" },
                { "id": "mysterious", "label": "Mysterious", "desc": "Dark and intriguing", "prompt": "mysterious atmosphere, dark, cinematic shadows", "gradient": ["#0B0C10", "#1F2833", "#45A29E"], "thumbnail": "/previews/Mysterious.jpg" },
                { "id": "melancholic", "label": "Melancholic", "desc": "Introspective, foggy", "prompt": "melancholic mood, foggy, muted tones", "gradient": ["#5D6D7E", "#85929E", "#BFC9CA"], "thumbnail": "/previews/Melancholic.jpg" },
                { "id": "futuristic", "label": "Futuristic", "desc": "Tech neon cyberpunk", "prompt": "futuristic, cyberpunk, advanced technology", "gradient": ["#00FFFF", "#FF00FF", "#0A0A2E"], "thumbnail": "/previews/Futuristic.jpg" },
                { "id": "romantic", "label": "Romantic", "desc": "Soft warm tender", "prompt": "romantic mood, soft lighting, warm tones", "gradient": ["#FADBD8", "#F1948A", "#E74C3C"], "thumbnail": "/previews/Romantic.jpg" },
                { "id": "epic", "label": "Epic", "desc": "Grand awe-inspiring", "prompt": "epic scale, grand, cinematic, awe-inspiring", "gradient": ["#1A1A2E", "#C0392B", "#F39C12"], "thumbnail": "/previews/Epic.jpg" }
            ],
            "color": [
                { "id": "vibrant", "label": "Vibrant", "desc": "Bold saturated energy", "prompt": "vibrant colors, highly saturated", "gradient": ["#FF0055", "#00CCFF", "#FFFF00"], "thumbnail": "/previews/Vibrant.jpg" },
                { "id": "muted", "label": "Muted", "desc": "Desaturated film tones", "prompt": "muted colors, desaturated tones", "gradient": ["#9E9E9E", "#BDBDBD", "#757575"], "thumbnail": "/previews/Muted.jpg" },
                { "id": "pastel", "label": "Pastel", "desc": "Soft dreamy palette", "prompt": "pastel colors, soft tones", "gradient": ["#FFCCCC", "#CCFFCC", "#CCCCFF"], "thumbnail": "/previews/Pastel.jpg" },
                { "id": "monochrome", "label": "Monochrome", "desc": "Black white and grey", "prompt": "monochrome, black and white", "gradient": ["#000000", "#888888", "#FFFFFF"], "thumbnail": "/previews/Monochrome.jpg" },
                { "id": "earth", "label": "Earth Tones", "desc": "Browns terracottas", "prompt": "earth tones, natural colors, browns and greens", "gradient": ["#8B4513", "#556B2F", "#D2B48C"], "thumbnail": "/previews/Earthtones.jpg" },
                { "id": "neon-cyber", "label": "Neon/Cyber", "desc": "Electric on dark", "prompt": "neon cyberpunk colors, glowing accents", "gradient": ["#FF00FF", "#00FFFF", "#0D0D0D"], "thumbnail": "/previews/Neoncyber.jpg" },
                { "id": "warm", "label": "Warm Tones", "desc": "Oranges reds golds", "prompt": "warm color palette, reds, oranges, golden hues", "gradient": ["#FF6B35", "#FF8C42", "#FFC857"], "thumbnail": "/previews/Warm.jpg" },
                { "id": "cool", "label": "Cool Tones", "desc": "Blues cyans purples", "prompt": "cool color palette, blues, cyans, purples", "gradient": ["#0077B6", "#00B4D8", "#90E0EF"], "thumbnail": "/previews/Cool.jpg" }
            ],
            "camera_body": [
                { "id": "hasselblad", "label": "Hasselblad", "desc": "Medium format richness", "prompt": "shot on Hasselblad medium format camera, extremely rich colors, highly detailed", "gradient": ["#2C3E50", "#2980B9", "#BDC3C7"] },
                { "id": "phaseone", "label": "Phase One", "desc": "Ultra high resolution", "prompt": "shot on Phase One camera, ultra high resolution, perfect details", "gradient": ["#1A5276", "#2E4053", "#EBEDEF"] },
                { "id": "canon", "label": "Canon R5", "desc": "Balanced color accuracy", "prompt": "shot on Canon EOS R5 camera, perfect color fidelity, professional output", "gradient": ["#E74C3C", "#C0392B", "#FADBD8"] },
                { "id": "sony", "label": "Sony A7RV", "desc": "Extreme detail and contrast", "prompt": "shot on Sony A7RV camera, pin-sharp details, high contrast, studio quality", "gradient": ["#2E4053", "#34495E", "#D5DBDB"] },
                { "id": "leica", "label": "Leica M11", "desc": "Timeless fine-art feel", "prompt": "shot on Leica M11 camera, timeless fine-art look, rich contrast, soft organic texture", "gradient": ["#7B241C", "#922B21", "#E6B0AA"] },
                { "id": "fujifilm", "label": "Fujifilm GFX", "desc": "Vibrant film-like tones", "prompt": "shot on Fujifilm GFX camera, vibrant film simulation colors, high dynamic range", "gradient": ["#196F3D", "#229954", "#D5F5E3"] },
                { "id": "nikon", "label": "Nikon Z9", "desc": "Fast action and precision", "prompt": "shot on Nikon Z9 camera, precise details, high dynamic range, perfect focus", "gradient": ["#F39C12", "#D68910", "#FCF3CF"] }
            ]
        },
        "ratios": [
            { "id": "1:1",  "label": "1:1 Square",      "prompt": "square 1:1 aspect ratio" },
            { "id": "16:9", "label": "16:9 Landscape",  "prompt": "landscape 16:9 widescreen aspect ratio" },
            { "id": "9:16", "label": "9:16 Portrait",   "prompt": "portrait 9:16 vertical aspect ratio" },
            { "id": "4:5",  "label": "4:5 Social",      "prompt": "social media 4:5 aspect ratio" },
            { "id": "3:2",  "label": "3:2 Photo Print", "prompt": "photo print 3:2 aspect ratio" },
            { "id": "2:3",  "label": "2:3 Poster",      "prompt": "poster 2:3 vertical aspect ratio" },
            { "id": "4:3",  "label": "4:3 Standard TV", "prompt": "standard 4:3 aspect ratio" },
            { "id": "3:4",  "label": "3:4 Vertical",    "prompt": "vertical 3:4 aspect ratio" },
            { "id": "5:4",  "label": "5:4 Classic",     "prompt": "classic 5:4 aspect ratio" },
            { "id": "4:1",  "label": "4:1 Wide Banner", "prompt": "wide banner 4:1 aspect ratio" },
            { "id": "1:4",  "label": "1:4 Tall Banner", "prompt": "tall banner 1:4 aspect ratio" },
            { "id": "8:1",  "label": "8:1 Panoramic",   "prompt": "panoramic 8:1 aspect ratio" },
            { "id": "1:8",  "label": "1:8 Ultra Tall",  "prompt": "ultra-tall 1:8 aspect ratio" },
            { "id": "21:9", "label": "21:9 Cinematic",  "prompt": "cinematic ultrawide 21:9 aspect ratio" }
        ],
        "qualities": [
            { "id": "Standard", "label": "Standard", "resolution": "1K", "desc": "Fast · 1024px",            "prompt": "standard quality" },
            { "id": "High",     "label": "High",     "resolution": "2K", "desc": "Balanced · 2048px",        "prompt": "high quality, highly detailed" },
            { "id": "Ultra",    "label": "Ultra",    "resolution": "4K", "desc": "Slow, max detail · 4096px","prompt": "ultra quality, maximum detail, 8K resolution, masterpiece" }
        ],
        "models": [
            { "id": "Nanobanana",       "label": "Nanobanana",    "integrated": True,  "coming_soon": False },
            { "id": "ChatGPT",          "label": "ChatGPT",       "integrated": True,  "coming_soon": False, "sub_models": [
                { "id": "gpt-image-2",          "label": "GPT Image 2",          "desc": "State-of-the-art" },
                { "id": "gpt-image-1.5",        "label": "GPT Image 1.5",        "desc": "Previous flagship" },
                { "id": "chatgpt-image-latest", "label": "ChatGPT Image Latest", "desc": "Latest default" },
                { "id": "gpt-image-1",          "label": "GPT Image 1",          "desc": "Previous generation" },
                { "id": "gpt-image-1-mini",     "label": "GPT Image 1 Mini",     "desc": "Cost-efficient" }
            ] },
            { "id": "Flux.1",           "label": "Flux.1",        "integrated": True,  "coming_soon": False },
            { "id": "Kling",            "label": "Kling",         "integrated": True,  "coming_soon": False },
            { "id": "OpenAI",           "label": "OpenAI DALL·E", "integrated": True,  "coming_soon": False },
            { "id": "Midjourney",       "integrated": False, "coming_soon": True },
            { "id": "Stable Diffusion", "integrated": False, "coming_soon": True },
            { "id": "Grok-2",           "integrated": False, "coming_soon": True }
        ],
        "edit_tools": [
            { "id": "relight",       "label": "Relight",      "icon": "sun",      "endpoint": "/api/tools/relight/translate" },
            { "id": "skin-enhancer", "label": "Skin Enhance", "icon": "sparkles", "endpoint": "/api/tools/skin-enhancer/translate" },
            { "id": "camera",        "label": "Camera Angle", "icon": "video",    "endpoint": "/api/tools/camera/translate" }
        ],
        "relight_presets": [
            { "id": "golden",    "label": "Golden Hour",    "hex": "#ffaa33" },
            { "id": "sunset",    "label": "Warm Sunset",    "hex": "#ff5522" },
            { "id": "cinematic", "label": "Cool Cinematic", "hex": "#22ccff" },
            { "id": "neon",      "label": "Cyberpunk Neon", "hex": "#ff22aa" }
        ]
    }

@app.api_route("/bff/genfy/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_genfy(path: str, request: Request):
    global GENFY_TOKEN
    token = await _get_genfy_token()

    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)
    headers["cookie"] = f"session_token={token}"
    if token:
        headers["authorization"] = f"Bearer {token}"

    method = request.method
    params = dict(request.query_params)
    body   = await request.body()
    url    = f"{GENFY_URL}/api/{path}"
    print(f"Genfy proxy: {method} {url} token_len={len(token)}")

    async def _do_request(client: httpx.AsyncClient, hdrs: dict) -> httpx.Response:
        return await client.request(method, url, headers=hdrs, params=params, content=body, follow_redirects=True)

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            upstream = await _do_request(client, headers)

            if upstream.status_code == 401 or (upstream.status_code == 200 and b"Not authenticated" in upstream.content):
                print("Genfy 401 — clearing token and retrying...")
                GENFY_TOKEN = ""
                token = await _get_genfy_token()
                headers["cookie"] = f"session_token={token}"
                if token:
                    headers["authorization"] = f"Bearer {token}"
                upstream = await _do_request(client, headers)
                print(f"Genfy retry status: {upstream.status_code}")

            content_type = upstream.headers.get("content-type", "application/json")
            return Response(
                content=upstream.content,
                status_code=upstream.status_code,
                media_type=content_type,
                headers={"Content-Disposition": upstream.headers.get("Content-Disposition", "")},
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Upstream Genfy API timed out.")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Failed to reach Genfy: {exc}")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "creative-suite-bff"}


@app.get("/")
async def root():
    return {"message": "Creative Suite BFF Proxy", "docs": "/docs"}

