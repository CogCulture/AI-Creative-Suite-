# Genfy Image Tool — API Reference

> **Base URL:** `https://your-server:8005`  
> **API Version:** v1 (current)  
> **Interactive Docs:** `GET /docs` (auto-generated Swagger UI)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Image Generation](#2-image-generation)
3. [Image Editing & Enhancement](#3-image-editing--enhancement)
4. [Tool Translation (Server-Side)](#4-tool-translation-server-side)
5. [Style Configuration](#5-style-configuration)
6. [Prompt Helpers](#6-prompt-helpers)
7. [Upscale](#7-upscale)
8. [Quota & Usage](#8-quota--usage)
9. [Download](#9-download)
10. [History](#10-history)
11. [Model Comparison Arena](#11-model-comparison-arena)
12. [Complete Flow Example](#12-complete-flow-example)
13. [Error Handling](#13-error-handling)
14. [Rate Limits & Quotas](#14-rate-limits--quotas)

---

## 1. Authentication

### How it works

All protected endpoints require authentication via **one of two methods** (checked in order):

| Method | Header | Use Case |
|---|---|---|
| **Bearer Token** | `Authorization: Bearer {token}` | Suite agent / API calls |
| **Session Cookie** | `Cookie: session_token={token}` | Browser UI (auto-set by login) |

The token is a **JWT** (7-day expiry) created on login. Both methods decode the same JWT — they're interchangeable.

---

### `POST /api/users/login`

> **Auth Required:** No

Authenticate with email/password. Returns user info and sets a session cookie.

**Request:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response** `200`:
```json
{
  "status": "success",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "is_active": true,
    "profile_picture": "url-or-null",
    "email_verified": true,
    "created_at": "2026-01-15T10:30:00"
  }
}
```

> [!IMPORTANT]
> **For suite agent use:** The JWT token is set in the `Set-Cookie: session_token=...` response header. Extract it and pass it as `Authorization: Bearer {token}` on all subsequent calls.

**cURL:**
```bash
curl -X POST https://your-server:8005/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@genfy.com","password":"your-password"}' \
  -c cookies.txt -v
# Extract token from: Set-Cookie: session_token=eyJ...
```

**Python:**
```python
import requests

r = requests.post(f"{BASE}/api/users/login", json={
    "email": "you@genfy.com", "password": "your-password"
})
token = r.cookies.get("session_token")
headers = {"Authorization": f"Bearer {token}"}
```

**Error** `401`:
```json
{ "detail": "Invalid email or password" }
```

**Error** `403` (email not verified):
```json
{ "status": "error", "message": "Please verify your email.", "email_verified": false }
```

---

### `POST /api/users/google-signin`

> **Auth Required:** No

Google OAuth sign-in. Creates user if first time.

**Request:**
```json
{
  "credential": "string (Google ID token or access token)",
  "is_access_token": false,
  "name": "optional display name"
}
```

**Response:** Same shape as `/login`.

---

### `GET /api/users/me`

> **Auth Required:** Yes

Returns the authenticated user's profile.

**Response** `200`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "user | admin",
  "is_active": true,
  "profile_picture": "url-or-null"
}
```

---

## 2. Image Generation

### `POST /api/sessions`

> **Auth Required:** Yes

Create a new image generation session. Runs **asynchronously** — returns immediately with a session ID, then generates in the background.

**Request:**
```json
{
  "prompt": "string (required) — the user's text prompt",
  "model_ids": ["string"] ,
  "ratio": "string (default: '1:1')",
  "quality": "string (default: 'Standard')",
  "active_configs": {},
  "parent_session_id": "string | null — for edit lineage",
  "reference_image_id": "string | null",
  "image_base64": "string | null — base64-encoded reference image",
  "vision_description": "string | null — pre-analyzed reference image description",
  "edit_instruction": "string | null — raw edit instruction for edit flows",
  "prompt_history": ["string"] 
}
```

**Field details:**

| Field | Type | Default | Description |
|---|---|---|---|
| `prompt` | string | *required* | User's text prompt. Style selections should be appended here. |
| `model_ids` | string[] | *required* | One or more model IDs. See [Models](#available-models). |
| `ratio` | string | `"1:1"` | Aspect ratio. See [Ratios](#available-ratios). |
| `quality` | string | `"Standard"` | Quality tier: `Standard` (1K), `High` (2K), `Ultra` (4K). |
| `active_configs` | object | `{}` | Key-value configs, e.g. `{"chatgpt_model": "gpt-image-2"}` |
| `image_base64` | string\|null | `null` | Base64 image for img2img or edit operations. |
| `edit_instruction` | string\|null | `null` | Raw edit instruction (triggers EDIT-FIX backend path). |
| `prompt_history` | string[]\|null | `null` | Chronological list of past prompts for multi-turn editing. |

**Response** `200`:
```json
{
  "session_id": "abc-123-def",
  "images": [
    {
      "image_id": "img-456-ghi",
      "model_id": "Nanobanana 2",
      "status": "pending",
      "url": null
    }
  ]
}
```

> [!NOTE]
> When `model_ids` contains multiple models (e.g. `["Nanobanana 2", "ChatGPT"]`), each model gets its own `image_id` in the response array. All run in parallel.

---

### `GET /api/sessions/{session_id}`

> **Auth Required:** Yes

Poll for generation results. Call this every ~2 seconds until all images have `status != "pending"`.

**Path params:** `session_id` — from the create response.

**Response** `200`:
```json
{
  "id": "abc-123-def",
  "session_id": "abc-123-def",
  "parent_session_id": "string | null",
  "prompt": "the prompt used",
  "enhanced_prompt": "the full final prompt sent to the model (after SmartComposer)",
  "pipeline_type": "COMMERCIAL | CINEMATIC | PORTRAIT | LANDSCAPE | AUTHENTIC | ARTISTIC | null",
  "models": ["Nanobanana 2"],
  "active_configs": {},
  "settings": {
    "models": ["Nanobanana 2"],
    "active_configs": {}
  },
  "reference_image_id": "string | null",
  "preview_images": ["https://cdn.example.com/img1.png"],
  "images": [
    {
      "id": "img-456-ghi",
      "session_id": "abc-123-def",
      "model_id": "Nanobanana 2",
      "status": "pending | completed | failed",
      "url": "https://cdn.example.com/img1.png | null",
      "error_msg": "string | null",
      "created_at": "2026-07-27T12:00:00"
    }
  ]
}
```

**Image status values:**

| Status | Meaning |
|---|---|
| `pending` | Generation in progress |
| `completed` | Done — `url` contains the image URL |
| `failed` | Error — check `error_msg` |

> [!TIP]
> The `images` array contains ALL images in the entire family tree (parent + all edits). The most recent images appear first (descending `created_at`).

---

### Available Models

| Model ID | Status | Notes |
|---|---|---|
| `Nanobanana 2` | ✅ Integrated | Default. Gemini 3.1 Flash Image backend. |
| `Nanobanana Pro` | ✅ Integrated | Gemini 3 Pro Image. Higher quality, slower. |
| `ChatGPT` | ✅ Integrated | Uses `gpt-image-2` by default. Sub-model selectable via `active_configs.chatgpt_model`. |
| `Kling` | ✅ Integrated | Kling AI image generation. |
| `Flux.1` | ✅ Integrated | Black Forest Labs Flux. |
| `Midjourney` | 🔜 Coming soon | — |
| `Stable Diffusion` | 🔜 Coming soon | — |
| `Grok-2` | 🔜 Coming soon | — |

**ChatGPT sub-models** (set via `active_configs.chatgpt_model`):

| Sub-model ID | Description |
|---|---|
| `gpt-image-2` | State-of-the-art (default) |
| `gpt-image-1.5` | Previous flagship |
| `chatgpt-image-latest` | Latest default |
| `gpt-image-1` | Previous generation |
| `gpt-image-1-mini` | Cost-efficient |

### Available Ratios

`1:1` · `16:9` · `9:16` · `4:5` · `3:2` · `2:3` · `4:3` · `3:4` · `5:4` · `4:1` · `1:4` · `8:1` · `1:8` · `21:9`

### Available Qualities

| ID | Resolution | Speed |
|---|---|---|
| `Standard` | 1K (1024px) | Fast |
| `High` | 2K (2048px) | Balanced |
| `Ultra` | 4K (4096px) | Slow, max detail |

---

## 3. Image Editing & Enhancement

### `POST /api/sessions/{session_id}/images/{image_id}/edit`

> **Auth Required:** Yes

Edit an existing generated image. Creates a child session. Runs asynchronously.

**Path params:**
- `session_id` — the session that owns the source image
- `image_id` — the specific image to edit

**Request:**
```json
{
  "edit_prompt": "string (required) — the edit instruction",
  "full_prompt_override": "string | null",
  "reference_image_id": "string | null",
  "config_overrides": {"key": "value"},
  "image_base64": "string | null — source image base64 (auto-fetched if omitted)",
  "vision_description": "string | null",
  "ratio": "string (default: '1:1')",
  "quality": "string (default: 'standard')",
  "model_ids": ["string"] 
}
```

**Field details:**

| Field | Type | Default | Description |
|---|---|---|---|
| `edit_prompt` | string | *required* | The edit instruction text. This is what comes from the UI tools or your agent. |
| `full_prompt_override` | string\|null | `null` | Full prompt override for pure style changes (no edit instruction). **Ignored when `edit_prompt` is set.** |
| `image_base64` | string\|null | `null` | Base64 of source image. **Server auto-fetches from URL if not provided.** |
| `model_ids` | string[]\|null | `null` | Override model(s). Defaults to the source image's model. |
| `ratio` | string | `"1:1"` | New aspect ratio (or keep parent's). |
| `quality` | string | `"standard"` | New quality tier. |

**Response** `200`:
```json
{
  "session_id": "child-session-id",
  "child_session_id": "child-session-id",
  "image": {
    "image_id": "new-img-id",
    "model_id": "Nanobanana 2",
    "status": "pending",
    "url": null
  }
}
```

> [!IMPORTANT]
> Poll `GET /api/sessions/{child_session_id}` to get the result — same as initial generation.

**Example edit instructions for common operations:**

```
Relight:        "Add a warm golden-amber light source from the upper-right..."
Skin Enhance:   "Enhance the skin and facial quality in this image..."
Camera Angle:   "re-render the exact same scene from a low-angle shot..."
Free text:      "make the sky pink and add rain"
Upscale:        "enhance", "upscale", "sharpen" (auto-detected)
```

> [!TIP]
> Use the [Tool Translation endpoints](#4-tool-translation-server-side) to generate these instructions from structured UI controls.

---

## 4. Tool Translation (Server-Side)

These endpoints convert structured UI control values into the exact text instruction that should be passed as `edit_prompt` to the edit endpoint. Use these for **agent-to-agent** calls where no human UI is involved.

---

### `POST /api/tools/relight/translate`

> **Auth Required:** No

**Request:**
```json
{
  "rotate": 45,
  "elevation": 30,
  "color_hex": "#ff22aa"
}
```

| Field | Type | Range | Default | Description |
|---|---|---|---|---|
| `rotate` | float | -180 to 180 | 0 | Horizontal light position. 0=front, 90=right, -90=left, 180=behind |
| `elevation` | float | -90 to 90 | 0 | Vertical light position. 0=level, 90=overhead, -90=below |
| `color_hex` | string | hex color | `"#ffffff"` | Light color. Use preset hex values or any custom color. |

**Preset colors:**

| Hex | Preset Name |
|---|---|
| `#e2e8f0` | Original Image Light (Match) — repositions existing light |
| `#ffffff` | Neutral Studio — clean white light |
| `#ffaa33` | Golden Hour — warm amber |
| `#ff5522` | Warm Sunset — orange-red |
| `#22ccff` | Cool Cinematic — cyan-blue |
| `#ff22aa` | Cyberpunk Neon — magenta-pink |

**Response** `200`:
```json
{
  "instruction": "Add a vivid magenta-pink light source to the scene, from the upper-right. Illuminate surfaces facing this new light and cast natural shadows...",
  "direction": "from the upper-right",
  "color_id": "neon"
}
```

---

### `POST /api/tools/skin-enhancer/translate`

> **Auth Required:** No

**Request:**
```json
{
  "version": "Flexible",
  "optimize_for": "Enhance skin",
  "sharpen": 0,
  "smart_grain": 13
}
```

| Field | Type | Options | Default |
|---|---|---|---|
| `version` | string | `Faithful` · `Creative` · `Flexible` | `Flexible` |
| `optimize_for` | string | `Enhance skin` · `Enhance everything` · `Improve light` · `Transform to real` · `No makeup` | `Enhance skin` |
| `sharpen` | int | 0–100 | 0 |
| `smart_grain` | int | 0–100 | 13 |

**Version descriptions:**

| Version | Behavior |
|---|---|
| `Faithful` | Subtly refine, preserving natural features and pores |
| `Creative` | Elevated luminosity, polished editorial finish |
| `Flexible` | Balanced — cleaner than natural, less polished than commercial |

**Optimize-for descriptions:**

| Mode | Focus |
|---|---|
| `Enhance skin` | Skin texture: reduce blemishes, even tone, improve pore quality |
| `Enhance everything` | All facial features: skin, eyes, lips, hair, overall sharpness |
| `Improve light` | Skin luminosity: add glow, fix dull/flat areas |
| `Transform to real` | Remove AI smoothness, restore real pore texture and imperfections |
| `No makeup` | Clean natural look: even tone without cosmetic sheen |

**Response** `200`:
```json
{
  "instruction": "Enhance the skin and facial quality in this image: improve skin in a balanced way...",
  "version": "Flexible",
  "optimize_for": "Enhance skin"
}
```

---

### `POST /api/tools/camera/translate`

> **Auth Required:** No

**Request:**
```json
{
  "rotate": 0,
  "vertical": 0,
  "zoom": 5
}
```

| Field | Type | Range | Default | Description |
|---|---|---|---|---|
| `rotate` | float | -180 to 180 | 0 | Horizontal orbit. 0=front, 90=right, -90=left, 180=behind |
| `vertical` | float | -90 to 90 | 0 | Elevation. 0=eye level, 90=bird's eye, -90=worm's eye |
| `zoom` | float | 1 to 10 | 5 | Framing. 1=extreme close-up, 5=medium, 10=wide establishing |

**Response** `200`:
```json
{
  "instruction": "re-render the exact same scene from a eye-level shot, straight on, medium shot, strictly preserving the exact same subjects, identity, and environment details",
  "parts": ["eye-level shot", "straight on", "medium shot"]
}
```

---

## 5. Style Configuration

### `GET /api/styles`

> **Auth Required:** No

Returns the complete style catalog for rendering the Image Tool UI. This includes all categories your boss designed, plus ratios, qualities, models, edit tools, and relight presets.

**Response** `200`:
```json
{
  "categories": {
    "style": [
      {
        "id": "cinematic",
        "label": "Cinematic",
        "desc": "Film-style dramatic visuals",
        "prompt": "cinematic style, dramatic lighting, film still, high contrast, movie quality",
        "gradient": ["#0D0D1A", "#E94560", "#533483"],
        "thumbnail": "/previews/Cinematic.jpg"
      }
    ],
    "medium": [...],
    "lighting": [...],
    "composition": [...],
    "camera": [...],
    "lens": [...],
    "mood": [...],
    "color": [...],
    "camera_body": [...]
  },
  "ratios": [
    { "id": "16:9", "label": "Landscape", "prompt": "landscape 16:9 widescreen aspect ratio" }
  ],
  "qualities": [
    { "id": "Standard", "label": "Standard", "resolution": "1K", "desc": "Fast · 1024px" }
  ],
  "models": [
    { "id": "Nanobanana 2", "integrated": true, "coming_soon": false },
    { "id": "ChatGPT", "integrated": true, "coming_soon": false, "sub_models": [...] }
  ],
  "edit_tools": [
    { "id": "relight", "label": "Relight", "icon": "sun", "endpoint": "/api/tools/relight/translate" }
  ],
  "relight_presets": [
    { "id": "golden", "label": "Golden Hour", "hex": "#ffaa33" }
  ]
}
```

**Category counts:**

| Category | Items |
|---|---|
| `style` | 8 (Photorealistic, Cinematic, Anime, Oil Painting, Watercolor, Concept Art, 3D Render, Minimalist) |
| `medium` | 6 (Digital Art, Photography, Charcoal, Ink, Acrylic, Mixed Media) |
| `lighting` | 9 (Natural, Golden Hour, Blue Hour, Studio, Dramatic, Neon, Volumetric, Moonlight, Candlelight) |
| `composition` | 4 (Centered, Rule of Thirds, Flat Lay, Panoramic) |
| `camera` | 8 (Worm's Eye, Dutch Angle, Bird's Eye, Extreme Close-Up, Wide Shot, Medium Shot, Close-Up, Low Angle) |
| `lens` | 6 (24mm, 50mm, 85mm, 135mm, Macro, Fisheye) |
| `mood` | 8 (Serene, Dramatic, Ethereal, Mysterious, Melancholic, Futuristic, Romantic, Epic) |
| `color` | 8 (Vibrant, Muted, Pastel, Monochrome, Earth, Neon/Cyber, Warm, Cool) |
| `camera_body` | 7 (Hasselblad, Phase One, Canon R5, Sony A7RV, Leica M11, Fujifilm GFX, Nikon Z9) |

> [!TIP]
> **How to use style selections:** Append each selected item's `prompt` field to the user's prompt string before sending to `POST /api/sessions`.
> ```
> user_prompt = "a woman in a hotel lobby"
> selected = ["cinematic style, dramatic lighting...", "golden hour lighting..."]
> final_prompt = f"{user_prompt}, {', '.join(selected)}"
> ```

---

## 6. Prompt Helpers

### `POST /api/suggest-from-prompt`

> **Auth Required:** No (optional auth)

AI-suggests style category selections based on a prompt.

**Request:**
```json
{
  "prompt": "a cyberpunk city at night"
}
```

**Response** `200`:
```json
{
  "suggestions": {
    "style": "cinematic",
    "lighting": "neon",
    "mood": "futuristic",
    "color": "neon-cyber"
  }
}
```

---

### `POST /api/recommend-styles`

> **Auth Required:** No (optional auth)

Given currently selected styles, recommend complementary selections.

**Request:**
```json
{
  "selections": { "style": "cinematic", "lighting": "dramatic" },
  "prompt": "a warrior standing on a cliff"
}
```

**Response** `200`: AI-recommended additional category selections.

---

### `POST /api/refine-prompt`

> **Auth Required:** No (optional auth)

Rewrites the user's prompt to incorporate new style selections.

**Request:**
```json
{
  "prompt": "a woman in a garden",
  "ratio": "16:9",
  "quality": "High",
  "selections": { "style": "watercolor", "mood": "serene", "lighting": "golden" }
}
```

**Response** `200`:
```json
{
  "refined_prompt": "a serene woman standing in a sunlit garden, watercolor painting style, golden hour lighting, soft shadows, peaceful atmosphere, balanced 16:9 widescreen composition"
}
```

---

### `POST /api/analyze-image`

> **Auth Required:** Yes

Analyze an uploaded reference image using Vision AI (Gemini 2.5 Flash).

**Request:**
```json
{
  "image_base64": "string (base64-encoded image)",
  "categories_context": "string | null — optional context about style categories"
}
```

**Response** `200`:
```json
{
  "description": "A detailed text description of the image content, style, lighting, mood, composition..."
}
```

---

## 7. Upscale

### `POST /api/upscale`

> **Auth Required:** Yes

Upscale a generated image to higher resolution.

**Request:**
```json
{
  "image_id": "string — ID of the image to upscale"
}
```

**Response** `200`:
```json
{
  "upscale_id": "string",
  "status": "pending"
}
```

---

### `GET /api/upscales`

> **Auth Required:** Yes

List user's upscale jobs and their results.

---

## 8. Quota & Usage

### `GET /api/quota`

> **Auth Required:** Yes

Returns the authenticated user's current usage and limits.

**Response** `200`:
```json
{
  "images_used_this_week": 23,
  "images_limit_per_week": 50,
  "upscales_used_today": 2,
  "upscales_limit_per_day": 5
}
```

> [!NOTE]
> Admin users get `-1` for limits (unlimited). Regular users default to 50 images/week and 5 upscales/day.

---

## 9. Download

### `GET /api/download`

> **Auth Required:** No

Proxy-download a generated image in the requested format.

**Query params:**

| Param | Type | Default | Options |
|---|---|---|---|
| `url` | string | *required* | The image URL (from `images[].url`) |
| `format` | string | `"png"` | `png` · `jpg` / `jpeg` · `tiff` |

**Response:** Binary image file with `Content-Disposition: attachment` header.

**cURL:**
```bash
curl "https://your-server:8005/api/download?url=https://cdn.../img.png&format=jpg" -o image.jpg
```

---

## 10. History

### `GET /api/history`

> **Auth Required:** Yes

List user's past generation sessions (paginated).

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `limit` | int | 20 | Items per page |

**Response** `200`:
```json
{
  "sessions": [...],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

### `GET /api/history/{session_id}`

> **Auth Required:** Yes

Get full details of a specific historical session.

---

### `DELETE /api/history/{session_id}`

> **Auth Required:** Yes

Delete a session and its images from history.

---

## 11. Model Comparison Arena

### `POST /api/compare/start`

> **Auth Required:** Yes

Start a side-by-side comparison across multiple models.

**Request:**
```json
{
  "prompt": "a futuristic cityscape",
  "models": ["Nanobanana 2", "ChatGPT", "Flux.1"],
  "ratio": "16:9",
  "quality": "High",
  "categories": {},
  "chatgpt_model": "gpt-image-2",
  "image_base64": "string | null",
  "vision_description": "string | null"
}
```

**Response** `200`:
```json
{
  "compare_session_id": "cmp-abc-123",
  "images": [
    { "id": "cmp-img-1", "model_id": "Nanobanana 2", "status": "pending" },
    { "id": "cmp-img-2", "model_id": "ChatGPT", "status": "pending" },
    { "id": "cmp-img-3", "model_id": "Flux.1", "status": "pending" }
  ]
}
```

---

### `GET /api/compare/{compare_session_id}`

> **Auth Required:** Yes

Poll comparison results.

---

### `POST /api/compare/{compare_session_id}/feedback`

> **Auth Required:** Yes

Submit preference feedback (which model won).

**Request:**
```json
{
  "selected_image_id": "cmp-img-2"
}
```

---

## 12. Complete Flow Example

### Python — Full generation + edit pipeline

```python
import requests
import time

BASE = "https://your-server:8005"

# ─── 1. Authenticate ───────────────────────────────────────────────
r = requests.post(f"{BASE}/api/users/login", json={
    "email": "you@genfy.com",
    "password": "your-password"
})
token = r.cookies.get("session_token")
headers = {"Authorization": f"Bearer {token}"}
print(f"✅ Logged in as {r.json()['user']['email']}")


# ─── 2. Fetch style catalog ────────────────────────────────────────
styles = requests.get(f"{BASE}/api/styles").json()
# Pick: Cinematic style + Golden Hour lighting + Low Angle camera
style_prompts = [
    next(s["prompt"] for s in styles["categories"]["style"] if s["id"] == "cinematic"),
    next(s["prompt"] for s in styles["categories"]["lighting"] if s["id"] == "golden"),
    next(s["prompt"] for s in styles["categories"]["camera"] if s["id"] == "low-angle"),
]


# ─── 3. Generate ───────────────────────────────────────────────────
user_prompt = "a warrior standing on a cliff overlooking a vast kingdom"
full_prompt = f"{user_prompt}, {', '.join(style_prompts)}"

r = requests.post(f"{BASE}/api/sessions", json={
    "prompt": full_prompt,
    "model_ids": ["Nanobanana 2"],
    "ratio": "16:9",
    "quality": "High",
    "active_configs": {}
}, headers=headers)

session = r.json()
session_id = session["session_id"]
image_id = session["images"][0]["image_id"]
print(f"⏳ Generation started: session={session_id}")


# ─── 4. Poll for results ───────────────────────────────────────────
while True:
    r = requests.get(f"{BASE}/api/sessions/{session_id}", headers=headers)
    img = next(i for i in r.json()["images"] if i["id"] == image_id)
    if img["status"] == "completed":
        image_url = img["url"]
        print(f"✅ Image ready: {image_url}")
        break
    elif img["status"] == "failed":
        print(f"❌ Failed: {img['error_msg']}")
        break
    time.sleep(2)


# ─── 5. Relight via tool translation ───────────────────────────────
relight = requests.post(f"{BASE}/api/tools/relight/translate", json={
    "rotate": 45,
    "elevation": 30,
    "color_hex": "#ffaa33"  # Golden Hour
}).json()
print(f"🔦 Relight instruction: {relight['instruction'][:80]}...")


# ─── 6. Apply the edit ─────────────────────────────────────────────
r = requests.post(
    f"{BASE}/api/sessions/{session_id}/images/{image_id}/edit",
    json={
        "edit_prompt": relight["instruction"],
        "ratio": "16:9",
        "quality": "High"
    },
    headers=headers
)
edit = r.json()
child_session_id = edit["child_session_id"]
edit_image_id = edit["image"]["image_id"]
print(f"⏳ Edit started: child_session={child_session_id}")


# ─── 7. Poll edit result ───────────────────────────────────────────
while True:
    r = requests.get(f"{BASE}/api/sessions/{child_session_id}", headers=headers)
    img = next(i for i in r.json()["images"] if i["id"] == edit_image_id)
    if img["status"] == "completed":
        edited_url = img["url"]
        print(f"✅ Edited image ready: {edited_url}")
        break
    elif img["status"] == "failed":
        print(f"❌ Edit failed: {img['error_msg']}")
        break
    time.sleep(2)


# ─── 8. Skin enhance the edited image ──────────────────────────────
skin = requests.post(f"{BASE}/api/tools/skin-enhancer/translate", json={
    "version": "Flexible",
    "optimize_for": "Enhance skin",
    "sharpen": 15,
    "smart_grain": 20
}).json()

r = requests.post(
    f"{BASE}/api/sessions/{child_session_id}/images/{edit_image_id}/edit",
    json={
        "edit_prompt": skin["instruction"],
        "ratio": "16:9",
        "quality": "High"
    },
    headers=headers
)
# ... poll again ...


# ─── 9. Download final result ──────────────────────────────────────
r = requests.get(f"{BASE}/api/download?url={edited_url}&format=png")
with open("final_image.png", "wb") as f:
    f.write(r.content)
print("💾 Saved to final_image.png")
```

---

## 13. Error Handling

All errors return JSON with a `detail` field:

```json
{ "detail": "Error message here" }
```

| HTTP Code | Meaning |
|---|---|
| `400` | Bad request — invalid input |
| `401` | Not authenticated — missing or invalid token |
| `403` | Forbidden — email not verified, or feature not allowed |
| `404` | Not found — session/image doesn't exist or belongs to another user |
| `429` | Rate limited — quota exhausted |
| `500` | Server error — check server logs |

---

## 14. Rate Limits & Quotas

| Resource | Default Limit | Period |
|---|---|---|
| Image generations | 50 | per week |
| Upscales | 5 | per day |

Check current usage via `GET /api/quota`.

> [!NOTE]
> Admin users have unlimited quotas (`-1`). Limits are configurable per user via admin endpoints.

---

## Quick Reference Card

```
AUTH
  POST /api/users/login                              → Get session token
  GET  /api/users/me                                  → Current user profile

GENERATE
  POST /api/sessions                                  → Start generation
  GET  /api/sessions/{id}                             → Poll results

EDIT
  POST /api/sessions/{id}/images/{img}/edit           → Edit image

TOOLS (translate UI → instruction text)
  POST /api/tools/relight/translate                   → Relight controls
  POST /api/tools/skin-enhancer/translate              → Skin enhancer controls
  POST /api/tools/camera/translate                     → Camera angle controls

CONFIG
  GET  /api/styles                                    → All categories, ratios, models

HELPERS
  POST /api/suggest-from-prompt                        → Auto-suggest styles
  POST /api/recommend-styles                           → Complementary style recs
  POST /api/refine-prompt                              → Rewrite prompt with styles
  POST /api/analyze-image                              → Vision analysis of image

UTILITY
  POST /api/upscale                                   → Upscale image
  GET  /api/quota                                     → Usage and limits
  GET  /api/download?url=...&format=png               → Download image
  GET  /api/history                                   → Past sessions
```
