import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Plus, Check, ArrowRight, RefreshCw, Copy as CopyIcon,
  Send, X, Loader2, Image as ImageIcon, Sliders, Sun, HelpCircle,
  Video, Eye, ZoomIn, Download, Trash2, Layers
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Card, Btn, Chip, Mono, Eyebrow } from "../components/primitives/index.jsx";

const DUMMY_PREVIEWS = {
  "photorealistic": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500&auto=format&fit=crop&q=80",
  "cinematic": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80",
  "anime": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
  "oil-paint": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop&q=80",
  "watercolor": "https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?w=500&auto=format&fit=crop&q=80",
  "concept-art": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
  "3d-render": "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&auto=format&fit=crop&q=80",
  "minimalist": "https://images.unsplash.com/photo-1604871000636-074fa5117945?w=500&auto=format&fit=crop&q=80"
};

export default function GenfyScreen({ t, nav, showToast }) {
  // ── Data states ──────────────────────────────────────────
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // ── Selection states ─────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedMedium, setSelectedMedium] = useState(null);
  const [selectedLighting, setSelectedLighting] = useState(null);
  const [selectedComposition, setSelectedComposition] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedLens, setSelectedLens] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedCameraBody, setSelectedCameraBody] = useState(null);

  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedQuality, setSelectedQuality] = useState("Standard");
  const [selectedModels, setSelectedModels] = useState(["Nanobanana"]);
  const [chatgptModel, setChatgptModel] = useState("gpt-image-2");

  // ── Live generation states ────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [activeImage, setActiveImage] = useState(null);

  // ── Inline Edit Panel states ──────────────────────────────
  const [activeTool, setActiveTool] = useState(null); // 'relight' | 'skin' | 'camera'
  
  // Relight tool parameters
  const [lightRotate, setLightRotate] = useState(45);
  const [lightElevation, setLightElevation] = useState(30);
  const [lightColorHex, setLightColorHex] = useState("#ffaa33");
  
  // Skin Enhancer tool parameters
  const [skinVersion, setSkinVersion] = useState("Flexible");
  const [skinOptimize, setSkinOptimize] = useState("Enhance skin");
  const [skinSharpen, setSkinSharpen] = useState(0);
  const [skinGrain, setSkinGrain] = useState(13);

  // Camera Angle tool parameters
  const [camRotate, setCamRotate] = useState(0);
  const [camVertical, setCamVertical] = useState(0);
  const [camZoom, setCamZoom] = useState(5);

  const [isEditing, setIsEditing] = useState(false);

  // ── Load styles dynamic catalog ───────────────────────────
  useEffect(() => {
    fetch("/bff/genfy/styles")
      .then(res => res.json())
      .then(data => {
        setCatalog(data);
        setLoadingCatalog(false);
      })
      .catch(() => {
        showToast("Failed to fetch style catalog from BFF");
        setLoadingCatalog(false);
      });

    try {
      const seed = localStorage.getItem("genfy_seed_prompt");
      if (seed) {
        setPrompt(seed);
        localStorage.removeItem("genfy_seed_prompt");
        showToast("Pre-filled prompt from Copy Agent!");
      }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Poll current session ─────────────────────────────────
  const pollTimerRef = useRef(null);
  const pollTimeoutRef = useRef(null);

  const startPolling = (sessionId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

    // Safety: stop polling after 90 seconds no matter what
    pollTimeoutRef.current = setTimeout(() => {
      clearInterval(pollTimerRef.current);
      setIsGenerating(false);
      setIsEditing(false);
      showToast("Generation timed out after 90 seconds.");
    }, 90000);

    pollTimerRef.current = setInterval(() => {
      fetch(`/bff/genfy/sessions/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          // API wraps result under data.session; fall back to data.images for compat
          const imagesArr = (data && data.session && data.session.images) || (data && data.images);
          if (imagesArr) {
            // Update live states
            const allImages = imagesArr;
            setGeneratedImages(allImages);

            const active = allImages[0];
            if (active) {
              setActiveImage(active);
            }

            // Check if all images finished (none still pending)
            const pending = allImages.some(img => img.status === "pending");
            if (!pending) {
              clearTimeout(pollTimeoutRef.current);
              clearInterval(pollTimerRef.current);
              setIsGenerating(false);
              setIsEditing(false);
              const anyCompleted = allImages.some(img => img.status === "completed");
              const anyFailed    = allImages.some(img => img.status === "failed");
              if (anyCompleted) {
                showToast("Image generation complete!");
              } else if (anyFailed) {
                showToast("Generation failed — check image for details.");
              }
            }
          }
        })
        .catch(err => {
          console.error("Polling error:", err);
        });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      clearInterval(pollTimerRef.current);
      clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  // ── Trigger standard generation ─────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt first.");
      return;
    }

    setIsGenerating(true);
    showToast("Starting image generation session...");

    // Build compound prompt incorporating styles
    let finalPrompt = prompt.trim();
    const styleParts = [];
    if (selectedStyle && catalog) {
      const item = catalog.categories.style.find(x => x.id === selectedStyle);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedMedium && catalog) {
      const item = catalog.categories.medium.find(x => x.id === selectedMedium);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedLighting && catalog) {
      const item = catalog.categories.lighting.find(x => x.id === selectedLighting);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedComposition && catalog) {
      const item = catalog.categories.composition.find(x => x.id === selectedComposition);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedCamera && catalog) {
      const item = catalog.categories.camera.find(x => x.id === selectedCamera);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedLens && catalog) {
      const item = catalog.categories.lens.find(x => x.id === selectedLens);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedMood && catalog) {
      const item = catalog.categories.mood.find(x => x.id === selectedMood);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedColor && catalog) {
      const item = catalog.categories.color.find(x => x.id === selectedColor);
      if (item) styleParts.push(item.prompt);
    }
    if (selectedCameraBody && catalog) {
      const item = catalog.categories.camera_body.find(x => x.id === selectedCameraBody);
      if (item) styleParts.push(item.prompt);
    }

    if (styleParts.length > 0) {
      finalPrompt = `${finalPrompt}, ${styleParts.join(", ")}`;
    }

    // Build categories map for Genfy API
    const categories = {};
    if (selectedStyle) categories.style = selectedStyle;
    if (selectedMedium) categories.medium = selectedMedium;
    if (selectedLighting) categories.lighting = selectedLighting;
    if (selectedComposition) categories.composition = selectedComposition;
    if (selectedCamera) categories.camera = selectedCamera;
    if (selectedLens) categories.lens = selectedLens;
    if (selectedMood) categories.mood = selectedMood;
    if (selectedColor) categories.color = selectedColor;
    if (selectedCameraBody) categories.camera_body = selectedCameraBody;

    try {
      const payload = {
        prompt: finalPrompt,
        model_ids: selectedModels,
        ratio: selectedRatio,
        quality: selectedQuality,
        categories: categories,
      };

      if (selectedModels.includes("ChatGPT")) {
        payload.chatgpt_model = chatgptModel;
      }

      const response = await fetch("/bff/genfy/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.session_id) {
        setCurrentSessionId(data.session_id);
        startPolling(data.session_id);
      } else {
        setIsGenerating(false);
        showToast(data.detail || "Failed to start session.");
      }
    } catch (err) {
      setIsGenerating(false);
      showToast("Error communicating with Genfy backend.");
    }
  };

  // ── Trigger post-gen edit tool ───────────────────────────
  const handleApplyEdit = async () => {
    if (!activeImage || !currentSessionId) return;
    
    setIsEditing(true);
    showToast("Translating controls and applying edit...");

    let translateUrl = "";
    let translateBody = {};

    if (activeTool === "relight") {
      translateUrl = "/bff/genfy/tools/relight/translate";
      translateBody = { rotate: parseFloat(lightRotate), elevation: parseFloat(lightElevation), color_hex: lightColorHex };
    } else if (activeTool === "skin") {
      translateUrl = "/bff/genfy/tools/skin-enhancer/translate";
      translateBody = { version: skinVersion, optimize_for: skinOptimize, sharpen: parseInt(skinSharpen), smart_grain: parseInt(skinGrain) };
    } else if (activeTool === "camera") {
      translateUrl = "/bff/genfy/tools/camera/translate";
      translateBody = { rotate: parseFloat(camRotate), vertical: parseFloat(camVertical), zoom: parseFloat(camZoom) };
    }

    try {
      // 1. Translate controls to text instruction
      const translateRes = await fetch(translateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(translateBody)
      });
      const translateData = await translateRes.json();

      if (!translateRes.ok || !translateData.instruction) {
        setIsEditing(false);
        showToast("Failed to translate edit controls.");
        return;
      }

      // 2. Submit edit session request
      const imgId = activeImage.image_id || activeImage.id;
      const editRes = await fetch(`/bff/genfy/sessions/${currentSessionId}/images/${imgId}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          edit_prompt: translateData.instruction,
          ratio: selectedRatio,
          quality: selectedQuality,
          model_ids: [activeImage.model_id]
        })
      });

      const editData = await editRes.json();
      if (editRes.ok && editData.child_session_id) {
        startPolling(editData.child_session_id);
      } else {
        setIsEditing(false);
        showToast(editData.detail || "Failed to start edit session.");
      }
    } catch (err) {
      setIsEditing(false);
      showToast("Error connecting to backend services.");
    }
  };

  const handleUpscale = async () => {
    if (!activeImage) return;
    showToast("Submitting upscale task...");
    const imgId = activeImage.image_id || activeImage.id;
    try {
      const response = await fetch("/bff/genfy/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_id: imgId })
      });
      if (response.ok) {
        showToast("Upscale task started successfully!");
      } else {
        const data = await response.json();
        showToast(data.detail || "Failed to trigger upscale.");
      }
    } catch (err) {
      showToast("Error connecting to upscale services.");
    }
  };

  // Toggle model selection helper
  const toggleModel = (model) => {
    if (selectedModels.includes(model)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter(m => m !== model));
      }
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", fontFamily: FONT }}>
      {/* ── Settings Sidebar Rail ───────────────────────────── */}
      <div
        style={{
          width: 320,
          background: t.surface,
          borderRight: `1px solid ${t.border}`,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          padding: 24,
        }}
      >
        <Eyebrow t={t}>Engine Config</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 20px" }}>
          <img
            src="/images/genfy_logo.png"
            alt="Genfy Logo"
            style={{
              height: "28px",
              width: "auto",
              objectFit: "contain",
              filter: t.bg === "#151311" ? "none" : "invert(1) hue-rotate(180deg)",
            }}
          />
        </div>

        {/* Models list */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: t.text2, display: "block", marginBottom: 10 }}>
            Active Models
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {catalog && catalog.models ? (
              catalog.models.map(m => (
                <div
                  key={m.id}
                  onClick={() => !m.coming_soon && toggleModel(m.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: selectedModels.includes(m.id) ? t.accentSoft : t.bg,
                    border: `1px solid ${selectedModels.includes(m.id) ? t.accent : t.border}`,
                    borderRadius: 8,
                    cursor: m.coming_soon ? "not-allowed" : "pointer",
                    opacity: m.coming_soon ? 0.5 : 1,
                    transition: "all .2s"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedModels.includes(m.id)}
                    disabled={m.coming_soon}
                    onChange={() => {}}
                    style={{ accentColor: t.accent }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: selectedModels.includes(m.id) ? t.accentText : t.text }}>
                      {m.id}
                    </span>
                  </div>
                  {m.coming_soon && (
                    <span style={{ fontSize: 9.5, fontFamily: MONO, background: t.surface, padding: "2px 5px", borderRadius: 4, border: `1px solid ${t.border}` }}>
                      SOON
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span style={{ fontSize: 12, color: t.text3 }}>Loading models list...</span>
            )}
          </div>
        </div>

        {/* Aspect ratios */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: t.text2, display: "block", marginBottom: 10 }}>
            Aspect Ratio
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {catalog && catalog.ratios ? (
              catalog.ratios.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRatio(r.id)}
                  style={{
                    background: selectedRatio === r.id ? t.accentSoft : t.bg,
                    border: `1px solid ${selectedRatio === r.id ? t.accent : t.border}`,
                    borderRadius: 6,
                    padding: "10px 4px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    transition: "all .2s"
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: selectedRatio === r.id ? t.accentText : t.text2 }}>
                    {r.id}
                  </span>
                  <span style={{ fontSize: 9, color: t.text3, textTransform: "uppercase" }}>
                    {r.label.split(" ")[1] || r.label.split(" ")[0]}
                  </span>
                </button>
              ))
            ) : (
              <span style={{ fontSize: 12, color: t.text3 }}>Loading ratios...</span>
            )}
          </div>
        </div>

        {/* Quality level */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: t.text2, display: "block", marginBottom: 10 }}>
            Quality Tier
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {catalog && catalog.qualities ? (
              catalog.qualities.map(q => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuality(q.id)}
                  style={{
                    flex: 1,
                    background: selectedQuality === q.id ? t.accentSoft : t.bg,
                    border: `1px solid ${selectedQuality === q.id ? t.accent : t.border}`,
                    borderRadius: 6,
                    padding: "8px 0",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: selectedQuality === q.id ? t.accentText : t.text,
                    transition: "all .2s"
                  }}
                >
                  {q.id} ({q.resolution})
                </button>
              ))
            ) : (
              <span style={{ fontSize: 12, color: t.text3 }}>Loading quality tiers...</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Canvas Area ──────────────────────────────── */}
      <div
        style={{
          flex: 1,
          background: t.bg,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* Top prompt bar */}
        <div
          style={{
            padding: 32,
            borderBottom: `1px solid ${t.border}`,
            background: t.surface,
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="A warm golden hour portrait of an athlete in city commuter outerwear..."
                style={{
                  width: "100%",
                  height: 64,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1px solid ${t.borderStrong}`,
                  background: t.bg,
                  color: t.text,
                  fontFamily: FONT,
                  fontSize: 14.5,
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>
            <Btn
              t={t}
              hue="#E8552A"
              disabled={isGenerating || isEditing}
              onClick={handleGenerate}
              style={{ padding: "0 28px", height: 64, borderRadius: 12, display: "flex", gap: 10, alignItems: "center" }}
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              <span style={{ fontWeight: 700 }}>Generate</span>
            </Btn>
          </div>

          {/* Active selections strip */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>Styles:</span>
            {selectedStyle && (
              <Chip t={t} removable onRemove={() => setSelectedStyle(null)}>Style: {selectedStyle}</Chip>
            )}
            {selectedMedium && (
              <Chip t={t} removable onRemove={() => setSelectedMedium(null)}>Medium: {selectedMedium}</Chip>
            )}
            {selectedLighting && (
              <Chip t={t} removable onRemove={() => setSelectedLighting(null)}>Lighting: {selectedLighting}</Chip>
            )}
            {selectedComposition && (
              <Chip t={t} removable onRemove={() => setSelectedComposition(null)}>Composition: {selectedComposition}</Chip>
            )}
            {selectedCamera && (
              <Chip t={t} removable onRemove={() => setSelectedCamera(null)}>Camera: {selectedCamera}</Chip>
            )}
            {selectedLens && (
              <Chip t={t} removable onRemove={() => setSelectedLens(null)}>Lens: {selectedLens}</Chip>
            )}
            {selectedMood && (
              <Chip t={t} removable onRemove={() => setSelectedMood(null)}>Mood: {selectedMood}</Chip>
            )}
            {selectedColor && (
              <Chip t={t} removable onRemove={() => setSelectedColor(null)}>Color: {selectedColor}</Chip>
            )}
            {selectedCameraBody && (
              <Chip t={t} removable onRemove={() => setSelectedCameraBody(null)}>Body: {selectedCameraBody}</Chip>
            )}
            {!selectedStyle && !selectedMedium && !selectedLighting && !selectedComposition && !selectedCamera && !selectedLens && !selectedMood && !selectedColor && !selectedCameraBody && (
              <span style={{ fontSize: 12, color: t.text3, fontStyle: "italic" }}>None selected (Off-grid default)</span>
            )}
          </div>
        </div>

        {/* Content workspace */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Main output canvas & style categories */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: 32, gap: 32 }}>
            
            {/* Live generation result card */}
            {isGenerating && (
              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: 16,
                  padding: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  boxShadow: t.shadow
                }}
              >
                <Loader2 className="animate-spin" size={24} style={{ color: t.accent }} />
                <div>
                  <h4 style={{ fontWeight: 700, color: t.text, margin: 0 }}>Generating Visuals...</h4>
                  <p style={{ fontSize: 12.5, color: t.text2, margin: "2px 0 0" }}>
                    Polling Genfy backend for results. This typically takes 15–30 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* Generated display workspace */}
            {activeImage && (
              <div style={{ display: "flex", gap: 24, background: t.surface, padding: 24, borderRadius: 16, border: `1px solid ${t.border}` }}>
                {/* Visual canvas */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 500,
                      aspectRatio: activeImage.url ? "auto" : "1/1",
                      borderRadius: 12,
                      overflow: "hidden",
                      background: t.bg,
                      border: `1px solid ${t.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative"
                    }}
                  >
                    {activeImage.status === "pending" ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <Loader2 className="animate-spin" size={32} style={{ color: t.accent }} />
                        <span style={{ fontSize: 12, color: t.text3 }}>Processing image...</span>
                      </div>
                    ) : activeImage.status === "failed" ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 20, textAlign: "center" }}>
                        <X size={32} style={{ color: t.danger }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Generation Failed</span>
                        <span style={{ fontSize: 11, color: t.text3 }}>{activeImage.error_msg}</span>
                      </div>
                    ) : (
                      <img
                        src={activeImage.url}
                        alt="Generated visual"
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                    )}
                  </div>

                  {/* Canvas actions bar */}
                  {activeImage.status === "completed" && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <Btn
                        t={t}
                        kind="secondary"
                        onClick={() => {
                          const imgId = activeImage.image_id || activeImage.id;
                          const link = document.createElement("a");
                          link.href = activeImage.url;
                          link.download = `genfy-${imgId}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        icon={Download}
                        style={{ fontSize: 12, padding: "8px 16px" }}
                      >
                        Download
                      </Btn>
                      <Btn
                        t={t}
                        kind="secondary"
                        onClick={handleUpscale}
                        icon={Sparkles}
                        style={{ fontSize: 12, padding: "8px 16px" }}
                      >
                        Upscale
                      </Btn>
                    </div>
                  )}
                </div>

                {/* Edit & parameters sidebar panel */}
                <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>Model</span>
                    <h4 style={{ margin: "4px 0 0", color: t.text }}>{activeImage.model_id}</h4>
                  </div>

                  {activeImage.status === "completed" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase", marginBottom: 4 }}>
                        Creative Refinements
                      </span>
                      
                      {/* Tool selection buttons */}
                      <button
                        onClick={() => setActiveTool(activeTool === "relight" ? null : "relight")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${activeTool === "relight" ? t.accent : t.border}`,
                          background: activeTool === "relight" ? t.accentSoft : t.bg,
                          color: activeTool === "relight" ? t.accentText : t.text,
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                      >
                        <Sun size={18} />
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Relight Tool</span>
                      </button>

                      {activeTool === "relight" && (
                        <div style={{ padding: 12, background: t.bg, borderRadius: 8, border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "between", fontSize: 11, color: t.text2, marginBottom: 4 }}>
                              <span>Rotate: {lightRotate}°</span>
                            </div>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              value={lightRotate}
                              onChange={e => setLightRotate(e.target.value)}
                              style={{ width: "100%", accentColor: t.accent }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "between", fontSize: 11, color: t.text2, marginBottom: 4 }}>
                              <span>Elevation: {lightElevation}°</span>
                            </div>
                            <input
                              type="range"
                              min="-90"
                              max="90"
                              value={lightElevation}
                              onChange={e => setLightElevation(e.target.value)}
                              style={{ width: "100%", accentColor: t.accent }}
                            />
                          </div>

                          <div>
                            <span style={{ fontSize: 11, color: t.text2, display: "block", marginBottom: 6 }}>Light Presets</span>
                            <div style={{ display: "flex", gap: 6 }}>
                              {catalog && catalog.relight_presets && catalog.relight_presets.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => setLightColorHex(p.hex)}
                                  title={p.label}
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 6,
                                    background: p.hex,
                                    border: `2px solid ${lightColorHex === p.hex ? t.accent : "transparent"}`,
                                    cursor: "pointer"
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <Btn t={t} hue="#E8552A" disabled={isEditing} onClick={handleApplyEdit} style={{ width: "100%", fontSize: 12, padding: "8px 0" }}>
                            {isEditing ? "Applying..." : "Apply Relight"}
                          </Btn>
                        </div>
                      )}

                      <button
                        onClick={() => setActiveTool(activeTool === "skin" ? null : "skin")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${activeTool === "skin" ? t.accent : t.border}`,
                          background: activeTool === "skin" ? t.accentSoft : t.bg,
                          color: activeTool === "skin" ? t.accentText : t.text,
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                      >
                        <Sparkles size={18} />
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Skin Enhancer</span>
                      </button>

                      {activeTool === "skin" && (
                        <div style={{ padding: 12, background: t.bg, borderRadius: 8, border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, color: t.text2, display: "block", marginBottom: 4 }}>Optimize For</label>
                            <select
                              value={skinOptimize}
                              onChange={e => setSkinOptimize(e.target.value)}
                              style={{ width: "100%", padding: "6px 8px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: 6, fontSize: 12, color: t.text }}
                            >
                              <option>Enhance skin</option>
                              <option>Enhance everything</option>
                              <option>Improve light</option>
                              <option>Transform to real</option>
                              <option>No makeup</option>
                            </select>
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "between", fontSize: 11, color: t.text2, marginBottom: 4 }}>
                              <span>Sharpen: {skinSharpen}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={skinSharpen}
                              onChange={e => setSkinSharpen(e.target.value)}
                              style={{ width: "100%", accentColor: t.accent }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "between", fontSize: 11, color: t.text2, marginBottom: 4 }}>
                              <span>Smart Grain: {skinGrain}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={skinGrain}
                              onChange={e => setSkinGrain(e.target.value)}
                              style={{ width: "100%", accentColor: t.accent }}
                            />
                          </div>

                          <Btn t={t} hue="#E8552A" disabled={isEditing} onClick={handleApplyEdit} style={{ width: "100%", fontSize: 12, padding: "8px 0" }}>
                            {isEditing ? "Applying..." : "Apply Enhance"}
                          </Btn>
                        </div>
                      )}

                      <button
                        onClick={() => setActiveTool(activeTool === "camera" ? null : "camera")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${activeTool === "camera" ? t.accent : t.border}`,
                          background: activeTool === "camera" ? t.accentSoft : t.bg,
                          color: activeTool === "camera" ? t.accentText : t.text,
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                      >
                        <Video size={18} />
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>Camera Angle</span>
                      </button>

                      {activeTool === "camera" && (
                        <div style={{ padding: 12, background: t.bg, borderRadius: 8, border: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                          <div>
                            <div style={{ display: "flex", justifyContent: "between", fontSize: 11, color: t.text2, marginBottom: 4 }}>
                              <span>Horizontal Orbit: {camRotate}°</span>
                            </div>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              value={camRotate}
                              onChange={e => setCamRotate(e.target.value)}
                              style={{ width: "100%", accentColor: t.accent }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "between", fontSize: 11, color: t.text2, marginBottom: 4 }}>
                              <span>Elevation Orbit: {camVertical}°</span>
                            </div>
                            <input
                              type="range"
                              min="-90"
                              max="90"
                              value={camVertical}
                              onChange={e => setCamVertical(e.target.value)}
                              style={{ width: "100%", accentColor: t.accent }}
                            />
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "between", fontSize: 11, color: t.text2, marginBottom: 4 }}>
                              <span>Zoom Framing: {camZoom}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={camZoom}
                              onChange={e => setCamZoom(e.target.value)}
                              style={{ width: "100%", accentColor: t.accent }}
                            />
                          </div>

                          <Btn t={t} hue="#E8552A" disabled={isEditing} onClick={handleApplyEdit} style={{ width: "100%", fontSize: 12, padding: "8px 0" }}>
                            {isEditing ? "Applying..." : "Apply Camera"}
                          </Btn>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dynamic style configurations catalog */}
            {loadingCatalog ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="animate-spin" size={16} />
                <span style={{ fontSize: 12, color: t.text3 }}>Loading dynamic style catalog...</span>
              </div>
            ) : catalog && catalog.categories ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {Object.keys(catalog.categories).map(catKey => (
                  <div key={catKey}>
                    <SectionHeading text={catKey.replace("_", " ")} />
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        padding: "8px 0",
                        scrollbarWidth: "thin",
                      }}
                    >
                      {catalog.categories[catKey].map(item => {
                        const isSelected =
                          catKey === "style" ? selectedStyle === item.id :
                          catKey === "medium" ? selectedMedium === item.id :
                          catKey === "lighting" ? selectedLighting === item.id :
                          catKey === "composition" ? selectedComposition === item.id :
                          catKey === "camera" ? selectedCamera === item.id :
                          catKey === "lens" ? selectedLens === item.id :
                          catKey === "mood" ? selectedMood === item.id :
                          catKey === "color" ? selectedColor === item.id :
                          catKey === "camera_body" ? selectedCameraBody === item.id : false;

                        const setFunc =
                          catKey === "style" ? setSelectedStyle :
                          catKey === "medium" ? setSelectedMedium :
                          catKey === "lighting" ? setSelectedLighting :
                          catKey === "composition" ? setSelectedComposition :
                          catKey === "camera" ? setSelectedCamera :
                          catKey === "lens" ? setSelectedLens :
                          catKey === "mood" ? setSelectedMood :
                          catKey === "color" ? setSelectedColor :
                          catKey === "camera_body" ? setSelectedCameraBody : () => {};

                        const thumbnail = DUMMY_PREVIEWS[item.id] || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80";

                        return (
                          <div
                            key={item.id}
                            onClick={() => setFunc(isSelected ? null : item.id)}
                            style={{
                              flex: "0 0 160px",
                              height: 110,
                              borderRadius: 12,
                              overflow: "hidden",
                              position: "relative",
                              cursor: "pointer",
                              border: `2px solid ${isSelected ? t.accent : "transparent"}`,
                              boxShadow: t.shadow,
                              transition: "all .2s"
                            }}
                          >
                            <img
                              src={thumbnail}
                              alt={item.label}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                            {/* Overlay gradient */}
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 80%)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-end",
                                padding: 12
                              }}
                            >
                              <span style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: 700 }}>
                                {item.label}
                              </span>
                              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 9.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                                {item.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Right generation history sidebar */}
          <div
            style={{
              width: 240,
              background: t.surface,
              borderLeft: `1px solid ${t.border}`,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              padding: 20,
              gap: 16
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>
              Session History
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {generatedImages.map((img, idx) => {
                const imgId = img.image_id || img.id || idx;
                const activeImgId = activeImage ? (activeImage.image_id || activeImage.id) : null;
                return (
                  <div
                    key={imgId}
                    onClick={() => setActiveImage(img)}
                    style={{
                      borderRadius: 10,
                      overflow: "hidden",
                      border: `2px solid ${activeImgId && activeImgId === imgId ? t.accent : "transparent"}`,
                    cursor: "pointer",
                    position: "relative",
                    background: t.bg,
                    aspectRatio: "1/1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {img.status === "completed" ? (
                    <img src={img.url} alt={`History ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <Loader2 className="animate-spin" size={16} style={{ color: t.accent }} />
                      <span style={{ fontSize: 9, color: t.text3 }}>Pending...</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.6)", color: "#FFF", fontSize: 8.5, fontFamily: MONO, padding: "2px 5px", borderRadius: 4 }}>
                    {img.model_id.split(" ")[0]}
                  </div>
                </div>
              );
            })}

              {generatedImages.length === 0 && (
                <div style={{ padding: "40px 0", textAlign: "center", color: t.text3, fontSize: 12.5 }}>
                  No generations this session.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ text }) {
  return (
    <h3
      style={{
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 700,
        color: "#847D71",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "0 0 10px 0",
      }}
    >
      {text}
    </h3>
  );
}
