import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Camera,
  Sun,
  Wand2,
  Maximize2,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  History,
  Layers,
  RefreshCw,
  Sliders,
  Check,
  Eye,
  Trash2,
  Film,
  Palette,
  Compass,
  Aperture,
  Smile,
  Zap,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import {
  cats,
  ratioData,
  qualityData,
  AVAILABLE_MODELS,
  INTEGRATED_MODELS,
  getShapeSVG,
} from "../utils/studio-data.jsx";
import { CameraControlPopover } from "../components/CameraControlPopover.jsx";
import { RelightControlPopover } from "../components/RelightControlPopover.jsx";
import { SkinEnhancerPopover } from "../components/SkinEnhancerPopover.jsx";

const CATEGORY_TABS = [
  { id: "style", label: "Visual Style", icon: Palette },
  { id: "medium", label: "Medium", icon: Layers },
  { id: "lighting", label: "Lighting", icon: Sun },
  { id: "composition", label: "Composition", icon: Compass },
  { id: "camera", label: "Camera Angle", icon: Camera },
  { id: "lens", label: "Lens", icon: Aperture },
  { id: "mood", label: "Mood", icon: Smile },
  { id: "color", label: "Color Palette", icon: Zap },
];

export default function GenfyScreen({ t, nav, showToast }) {
  // ── View Mode: "presets" (Library/Setup) vs "canvas" (Generation Studio) ──
  const [view, setView] = useState("presets");

  // ── Prompt & Inputs ──
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState(ratioData[1]); // Default 16:9
  const [quality, setQuality] = useState(qualityData[1]); // Default High 2K
  const [selectedModel, setSelectedModel] = useState("Nanobanana 2");

  // Dropdown states
  const [ratioOpen, setRatioOpen] = useState(false);
  const [qualOpen, setQualOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  // Style Selections
  const [activeCat, setActiveCat] = useState("style");
  const [selections, setSelections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isEnhancingBrand, setIsEnhancingBrand] = useState(false);

  // Generation Lifecycle
  const [generating, setGenerating] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imageItems, setImageItems] = useState([]);
  const [focusedImgIndex, setFocusedImgIndex] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [sessionLineage, setSessionLineage] = useState([]);

  // Dedicated Image Edit & Iteration Mode
  const [editMode, setEditMode] = useState(false);
  const [editTargetIndex, setEditTargetIndex] = useState(0);
  const [editInstruction, setEditInstruction] = useState("");
  const [editGenerating, setEditGenerating] = useState(false);

  // Popovers
  const [showCameraPopover, setShowCameraPopover] = useState(false);
  const [showRelightPopover, setShowRelightPopover] = useState(false);
  const [showSkinPopover, setShowSkinPopover] = useState(false);
  const [upscaling, setUpscaling] = useState(false);

  const pollingRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const formatImageUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
      return url;
    }
    return `https://genfyy.in${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const toggleThumb = (catKey, id) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[catKey] === id) {
        delete next[catKey];
      } else {
        next[catKey] = id;
      }
      return next;
    });
  };

  const removeChip = (catKey) => {
    setSelections((prev) => {
      const next = { ...prev };
      delete next[catKey];
      return next;
    });
  };

  const handleBrandEnhance = async () => {
    if (!prompt.trim() || isEnhancingBrand) return;
    setIsEnhancingBrand(true);
    try {
      const res = await fetch("/bff/genfy/enhance-brand-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, campaign_id: "" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.enhanced_prompt) {
          setPrompt(data.enhanced_prompt);
          if (showToast) showToast("Prompt enhanced with Brand Intelligence!");
        }
      }
    } catch (e) {
      console.warn("Brand enhance fallback:", e);
    } finally {
      setIsEnhancingBrand(false);
    }
  };

  // ── Core Generation API Call ──
  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setView("canvas"); // Switch to canvas view to watch generation

    let fullPrompt = prompt.trim();
    const activeStylePrompts = [];
    Object.entries(selections).forEach(([catKey, valId]) => {
      const item = cats[catKey]?.find((x) => x.id === valId);
      if (item?.prompt) activeStylePrompts.push(item.prompt);
    });

    if (activeStylePrompts.length > 0) {
      fullPrompt += ` -- ${activeStylePrompts.join(", ")}`;
    }
    if (ratio?.prompt) fullPrompt += `, ${ratio.prompt}`;
    if (quality?.prompt) fullPrompt += `, ${quality.prompt}`;

    try {
      const payload = {
        prompt: fullPrompt,
        model_ids: [selectedModel],
        ratio: ratio.id,
        quality: quality.id,
        active_configs: selections,
        style_preset: selections.style || "",
        iterations: 1,
      };

      const res = await fetch("/bff/genfy/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned ${res.status}`);
      }

      const data = await res.json();
      const sessionId = data.id || data.session_id;

      if (!sessionId) throw new Error("No session ID returned from Genfy server");

      setCurrentSessionId(sessionId);
      setSessionLineage((prev) => [
        {
          id: sessionId,
          prompt: prompt.trim(),
          model: selectedModel,
          ratio: ratio.id,
          quality: quality.id,
          timestamp: new Date().toLocaleTimeString(),
          images: [],
          status: "processing",
        },
        ...prev,
      ]);

      pollSession(sessionId);
    } catch (err) {
      console.error("Genfy generation failed:", err);
      setGenerating(false);
      if (showToast) showToast(err.message || "Failed to start generation.");
    }
  };

  const pollSession = (sessionId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;
    const maxAttempts = 60;

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/bff/genfy/sessions/${sessionId}`);
        if (!res.ok) return;

        const data = await res.json();
        const rawImgs = data.session?.images || data.images || [];

        const completedImgs = rawImgs.filter((img) => {
          if (typeof img === "string") return true;
          return img && img.status === "completed" && img.url;
        });

        if (completedImgs.length > 0) {
          const formatted = completedImgs
            .map((img) => (typeof img === "string" ? img : img.url))
            .map(formatImageUrl)
            .filter(Boolean);

          if (formatted.length > 0) {
            const rawFirst = completedImgs[0];
            const firstId =
              (typeof rawFirst === "object" && (rawFirst.id || rawFirst.image_id)) ||
              `img-${Date.now()}`;

            const newItem = {
              id: firstId,
              url: formatted[0],
              prompt: prompt.trim(),
              sessionId: sessionId,
              model: selectedModel,
              ratio: ratio.id,
              quality: quality.id,
              iteration: 1,
              type: "original",
              createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setImageItems((prev) => [newItem, ...prev.filter((x) => x.sessionId !== sessionId)]);
            setGeneratedImages((prev) => [...new Set([...formatted, ...prev])]);
            setSessionLineage((prev) =>
              prev.map((s) => (s.id === sessionId ? { ...s, images: formatted, status: "complete" } : s))
            );
            clearInterval(pollingRef.current);
            setGenerating(false);
            setFocusedImgIndex(0);
            if (showToast) showToast("Image generated successfully!");
            return;
          }
        }

        const isFailed =
          data.status === "failed" ||
          data.status === "error" ||
          rawImgs.some((img) => typeof img === "object" && img?.status === "failed");

        if (isFailed) {
          clearInterval(pollingRef.current);
          setGenerating(false);
          if (showToast) showToast(data.error || "Generation failed on Genfy server");
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollingRef.current);
          setGenerating(false);
          if (showToast) showToast("Generation timed out. Please try again.");
        }
      } catch (e) {
        console.warn("Polling error:", e);
      }
    }, 2000);
  };

  // ── Image Edit & Variation Handlers ──
  const startEditing = (idx = focusedImgIndex) => {
    setEditTargetIndex(idx);
    setEditMode(true);
    setEditInstruction("");
    setView("canvas");
  };

  const cancelEditing = () => {
    setEditMode(false);
    setEditInstruction("");
  };

  const handleApplyEdit = async () => {
    if (!editInstruction.trim() || editGenerating) return;
    setEditGenerating(true);

    const source = imageItems[editTargetIndex] || {
      id: "img-source",
      url: generatedImages[editTargetIndex],
      sessionId: currentSessionId,
      iteration: editTargetIndex + 1,
      prompt: prompt,
    };

    try {
      let childSessionId = null;

      // 1. Try dedicated image edit endpoint on live server
      if (source.sessionId && source.id) {
        try {
          const editPayload = {
            edit_prompt: editInstruction.trim(),
            ratio: ratio.id,
            quality: quality.id,
            config_overrides: selections,
          };
          const res = await fetch(`/bff/genfy/sessions/${source.sessionId}/images/${source.id}/edit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editPayload),
          });
          if (res.ok) {
            const data = await res.json();
            childSessionId = data.child_session_id || data.session_id;
          }
        } catch (e) {
          console.warn("Direct image edit call failed, trying fallback:", e);
        }
      }

      // 2. Fallback to /sessions with parent_session_id
      if (!childSessionId) {
        const fallbackPayload = {
          prompt: `${source.prompt || prompt} -- edit: ${editInstruction.trim()}`,
          model_ids: [selectedModel],
          ratio: ratio.id,
          quality: quality.id,
          parent_session_id: source.sessionId || currentSessionId,
          active_configs: selections,
          iterations: 1,
        };
        const res = await fetch("/bff/genfy/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackPayload),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned ${res.status}`);
        }
        const data = await res.json();
        childSessionId = data.session_id || data.id;
      }

      if (!childSessionId) throw new Error("Could not start edit session on Genfy server");

      // 3. Poll edit session
      let attempts = 0;
      const maxAttempts = 60;
      const pollTimer = setInterval(async () => {
        attempts++;
        try {
          const pRes = await fetch(`/bff/genfy/sessions/${childSessionId}`);
          if (!pRes.ok) return;
          const pData = await pRes.json();
          const rawImgs = pData.session?.images || pData.images || [];
          const completedImgs = rawImgs.filter((img) => {
            if (typeof img === "string") return true;
            return img && img.status === "completed" && img.url;
          });

          if (completedImgs.length > 0) {
            clearInterval(pollTimer);
            const firstImg = completedImgs[0];
            const newUrl = formatImageUrl(typeof firstImg === "string" ? firstImg : firstImg.url);
            const newEditItem = {
              id: typeof firstImg === "object" ? (firstImg.id || firstImg.image_id) : `edit-${Date.now()}`,
              url: newUrl,
              prompt: `${source.prompt || prompt} (${editInstruction.trim()})`,
              editInstruction: editInstruction.trim(),
              sessionId: childSessionId,
              parentSessionId: source.sessionId,
              model: selectedModel,
              ratio: ratio.id,
              quality: quality.id,
              iteration: (source.iteration || 1) + 1,
              type: "edit",
              createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setImageItems((prev) => [newEditItem, ...prev]);
            setGeneratedImages((prev) => [newUrl, ...prev]);
            setFocusedImgIndex(0);
            setEditGenerating(false);
            setEditMode(false);
            if (showToast) showToast("Edited image iteration generated!");
            return;
          }

          if (pData.status === "failed" || pData.status === "error") {
            clearInterval(pollTimer);
            setEditGenerating(false);
            if (showToast) showToast(pData.error || "Edit generation failed on server");
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollTimer);
            setEditGenerating(false);
            if (showToast) showToast("Edit generation timed out.");
          }
        } catch (e) {
          console.warn("Edit poll error:", e);
        }
      }, 2000);
    } catch (err) {
      console.error("Edit generation failed:", err);
      setEditGenerating(false);
      if (showToast) showToast(err.message || "Failed to start edit generation.");
    }
  };

  const handleApplyCamera = (instruction) => {
    setShowCameraPopover(false);
    if (editMode) {
      setEditInstruction((prev) => `${prev.trim() ? prev.trim() + ", " : ""}${instruction}`);
    } else {
      setPrompt((prev) => `${prev.trim()}, ${instruction}`);
    }
    if (showToast) showToast("Camera angle applied");
  };

  const handleApplyRelight = (instruction) => {
    setShowRelightPopover(false);
    if (editMode) {
      setEditInstruction((prev) => `${prev.trim() ? prev.trim() + ", " : ""}${instruction}`);
    } else {
      setPrompt((prev) => `${prev.trim()}, ${instruction}`);
    }
    if (showToast) showToast("Lighting setup applied");
  };

  const handleApplySkin = (instruction) => {
    setShowSkinPopover(false);
    if (editMode) {
      setEditInstruction((prev) => `${prev.trim() ? prev.trim() + ", " : ""}${instruction}`);
    } else {
      setPrompt((prev) => `${prev.trim()}, ${instruction}`);
    }
    if (showToast) showToast("Skin enhancer applied");
  };

  const handleUpscale = async () => {
    const curImg = generatedImages[focusedImgIndex];
    if (!curImg || upscaling) return;
    setUpscaling(true);
    try {
      const res = await fetch("/bff/genfy/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: curImg, scale: 2 }),
      });
      if (!res.ok) throw new Error("Upscale request failed");
      const data = await res.json();
      if (data.url || data.upscaled_url) {
        const newUrl = formatImageUrl(data.url || data.upscaled_url);
        setGeneratedImages((prev) => [newUrl, ...prev]);
        setFocusedImgIndex(0);
        if (showToast) showToast("Upscaled image ready in Ultra 4K!");
      }
    } catch (e) {
      if (showToast) showToast("Upscale failed: " + e.message);
    } finally {
      setUpscaling(false);
    }
  };

  const activeImageUrl = generatedImages[focusedImgIndex] || null;

  // Filter items in active category by search term
  const activeItems = (cats[activeCat] || []).filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.label.toLowerCase().includes(term) ||
      (item.desc && item.desc.toLowerCase().includes(term))
    );
  });

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "calc(100vh - 65px)",
        padding: "20px 32px 40px",
        fontFamily: FONT,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header Row (matching Prompts Library in Image 1) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: "-.02em",
              color: t.text,
            }}
          >
            Genfy Image Studio
          </div>
          <div style={{ fontSize: 12.5, color: t.text3, letterSpacing: "0em" }}>
            Generate, style, and edit images using live Genfy AI models and cinematic presets.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* View Switcher Pill */}
          <div
            style={{
              display: "flex",
              background: t.surface2,
              border: `1px solid ${t.border}`,
              borderRadius: R.pill,
              padding: "3px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setView("presets")}
              style={{
                background: view === "presets" ? (t.bg === "#151311" ? t.surface : "#ffffff") : "transparent",
                border: "none",
                borderRadius: R.pill,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: view === "presets" ? 700 : 500,
                color: view === "presets" ? t.text : t.text3,
                cursor: "pointer",
                boxShadow: view === "presets" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Palette size={13} />
              Presets & Prompt
            </button>
            <button
              onClick={() => setView("canvas")}
              style={{
                background: view === "canvas" ? (t.bg === "#151311" ? t.surface : "#ffffff") : "transparent",
                border: "none",
                borderRadius: R.pill,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: view === "canvas" ? 700 : 500,
                color: view === "canvas" ? t.text : t.text3,
                cursor: "pointer",
                boxShadow: view === "canvas" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Film size={13} />
              Studio Canvas
              {generatedImages.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    background: t.accent || "#FF6B2B",
                    color: "#fff",
                    padding: "1px 6px",
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  {generatedImages.length}
                </span>
              )}
            </button>
          </div>

          {/* Back to Tools Button */}
          <button
            onClick={() => nav("tools")}
            style={{
              fontFamily: MONO,
              fontSize: 11.5,
              color: t.text2,
              background: t.surface2,
              border: `1px solid ${t.border}`,
              borderRadius: R.pill,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            ← Back to tools
          </button>
        </div>
      </div>

      {/* ── Main Container Card ── */}
      <div
        style={{
          background: t.bg === "#151311" ? t.surface : "#ffffff",
          border: `1px solid ${t.border}`,
          borderRadius: R.md,
          overflow: "hidden",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 160px)",
          padding: "24px 28px",
          boxShadow: t.shadow || "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── VIEW 1: PRESETS & PROMPT (Matching Image 1) ──            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {view === "presets" && (
          <div>
            {/* Top Prompt Search & Action Bar */}
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              {/* Prompt Input Box */}
              <div
                style={{
                  flex: 1,
                  minWidth: 280,
                  display: "flex",
                  alignItems: "center",
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: R.sm,
                  padding: "0 12px",
                  height: 42,
                }}
              >
                <input
                  type="text"
                  placeholder="Describe the image you want to generate (e.g. A hyperrealistic cybernetic tiger in Tokyo)..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGenerate();
                  }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: t.text,
                    fontFamily: FONT,
                  }}
                />
                {prompt.length > 0 && (
                  <button
                    onClick={() => setPrompt("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: t.text3,
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Model Selector Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setModelOpen(!modelOpen);
                    setRatioOpen(false);
                    setQualOpen(false);
                  }}
                  style={{
                    height: 42,
                    padding: "0 14px",
                    borderRadius: R.sm,
                    background: t.surface,
                    border: `1px solid ${modelOpen ? t.text : t.border}`,
                    color: t.text,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Sliders size={13} color={t.text3} />
                  <span>{selectedModel}</span>
                  <span style={{ fontSize: 9, opacity: 0.5 }}>▼</span>
                </button>
                {modelOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      background: t.bg === "#151311" ? t.surface : "#ffffff",
                      border: `1px solid ${t.border}`,
                      borderRadius: R.sm,
                      padding: 6,
                      minWidth: 180,
                      zIndex: 100,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    {INTEGRATED_MODELS.map((m) => (
                      <div
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setModelOpen(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                          color: selectedModel === m ? t.accent : t.text,
                          fontWeight: selectedModel === m ? 700 : 500,
                          background: selectedModel === m ? t.surface2 : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{m}</span>
                        {selectedModel === m && <Check size={13} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ratio Selector Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setRatioOpen(!ratioOpen);
                    setModelOpen(false);
                    setQualOpen(false);
                  }}
                  style={{
                    height: 42,
                    padding: "0 14px",
                    borderRadius: R.sm,
                    background: t.surface,
                    border: `1px solid ${ratioOpen ? t.text : t.border}`,
                    color: t.text,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>Ratio: {ratio.id}</span>
                  <span style={{ fontSize: 9, opacity: 0.5 }}>▼</span>
                </button>
                {ratioOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      background: t.bg === "#151311" ? t.surface : "#ffffff",
                      border: `1px solid ${t.border}`,
                      borderRadius: R.sm,
                      padding: 8,
                      minWidth: 220,
                      zIndex: 100,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    {ratioData.slice(0, 6).map((r) => (
                      <div
                        key={r.id}
                        onClick={() => {
                          setRatio(r);
                          setRatioOpen(false);
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                          color: ratio.id === r.id ? t.accent : t.text,
                          fontWeight: ratio.id === r.id ? 700 : 500,
                          background: ratio.id === r.id ? t.surface2 : "transparent",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{r.id} ({r.name})</span>
                        {ratio.id === r.id && <Check size={13} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Selector Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setQualOpen(!qualOpen);
                    setRatioOpen(false);
                    setModelOpen(false);
                  }}
                  style={{
                    height: 42,
                    padding: "0 14px",
                    borderRadius: R.sm,
                    background: t.surface,
                    border: `1px solid ${qualOpen ? t.text : t.border}`,
                    color: t.text,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>Quality: {quality.id}</span>
                  <span style={{ fontSize: 9, opacity: 0.5 }}>▼</span>
                </button>
                {qualOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      right: 0,
                      background: t.bg === "#151311" ? t.surface : "#ffffff",
                      border: `1px solid ${t.border}`,
                      borderRadius: R.sm,
                      padding: 6,
                      minWidth: 190,
                      zIndex: 100,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    {qualityData.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => {
                          setQuality(q);
                          setQualOpen(false);
                        }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer",
                          color: quality.id === q.id ? t.accent : t.text,
                          fontWeight: quality.id === q.id ? 700 : 500,
                          background: quality.id === q.id ? t.surface2 : "transparent",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>{q.label} ({q.res})</span>
                        {quality.id === q.id && <Check size={13} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brand Enhance Button */}
              <button
                onClick={handleBrandEnhance}
                disabled={isEnhancingBrand || !prompt.trim()}
                style={{
                  height: 42,
                  padding: "0 14px",
                  borderRadius: R.sm,
                  background: t.surface2,
                  border: `1px solid ${t.border}`,
                  color: isEnhancingBrand || !prompt.trim() ? t.text3 : t.text,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: isEnhancingBrand || !prompt.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
              >
                <Sparkles size={14} color="#10A37F" />
                <span>{isEnhancingBrand ? "Enhancing..." : "Enhance"}</span>
              </button>

              {/* Primary Generate Button (matching Write your own > from Image 1) */}
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                style={{
                  height: 42,
                  padding: "0 20px",
                  borderRadius: R.sm,
                  background: "#000000",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor: generating || !prompt.trim() ? "not-allowed" : "pointer",
                  opacity: generating || !prompt.trim() ? 0.45 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "all 0.15s",
                }}
              >
                <span>{generating ? "Generating..." : "Generate Image"}</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* ── Category Cards Row (matching the 6 category cards in Image 1) ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              {CATEGORY_TABS.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = activeCat === cat.id;
                const hasSelectedItems = Boolean(selections[cat.id]);

                return (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    style={{
                      padding: "14px 12px",
                      borderRadius: R.sm,
                      border: isSelected ? "2px solid #000000" : `1px solid ${t.border}`,
                      background: isSelected
                        ? (t.bg === "#151311" ? "rgba(255,255,255,0.06)" : "#ffffff")
                        : t.surface,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      textAlign: "center",
                      transition: "all 0.2s",
                      position: "relative",
                      boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.08)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = t.text2;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.borderColor = t.border;
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isSelected ? "rgba(0,0,0,0.05)" : "#ffffff",
                        border: `1px solid ${t.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isSelected ? "#000000" : t.text2,
                      }}
                    >
                      <IconComponent size={18} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{cat.label}</div>
                    {hasSelectedItems && (
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#FF6B2B",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Active Selections Strip ── */}
            {Object.keys(selections).length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  padding: "10px 14px",
                  background: t.surface,
                  borderRadius: R.sm,
                  marginBottom: 20,
                  border: `1px solid ${t.border}`,
                }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>
                  Selected Presets:
                </span>
                {Object.entries(selections).map(([catKey, id]) => {
                  const item = cats[catKey]?.find((i) => i.id === id);
                  if (!item) return null;
                  return (
                    <div
                      key={catKey}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#ffffff",
                        border: `1px solid ${t.border}`,
                        padding: "4px 10px",
                        borderRadius: R.pill,
                        fontSize: 12,
                        color: t.text,
                        fontWeight: 600,
                      }}
                    >
                      {item.img && (
                        <img
                          src={item.img}
                          alt={item.label}
                          style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover" }}
                        />
                      )}
                      <span>{item.label}</span>
                      <span
                        onClick={() => removeChip(catKey)}
                        style={{ cursor: "pointer", color: t.text3, marginLeft: 2 }}
                      >
                        ✕
                      </span>
                    </div>
                  );
                })}
                <button
                  onClick={() => setSelections({})}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: t.accent || "#FF6B2B",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ── Section Title: Style Presets ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>
                {CATEGORY_TABS.find((c) => c.id === activeCat)?.label} Presets
              </div>
              <div style={{ fontSize: 12, color: t.text3 }}>
                Click a card to apply to your generation prompt
              </div>
            </div>

            {/* ── Grid of Style Cards (matching Recent Prompts in Image 1) ── */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {activeItems.map((item) => {
                const isSelected = selections[activeCat] === item.id;
                const [c1, c2] = item.grad || ["#4A5568", "#2D3748"];

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleThumb(activeCat, item.id)}
                    style={{
                      border: isSelected ? "2px solid #000000" : `1px solid ${t.border}`,
                      borderRadius: R.sm,
                      background: isSelected ? (t.bg === "#151311" ? t.surface2 : "#FBFBFA") : "#ffffff",
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? "0 4px 16px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = t.text2;
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = t.border;
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {/* Visual Artwork Thumbnail */}
                    <div
                      style={{
                        height: 140,
                        width: "100%",
                        position: "relative",
                        background: `linear-gradient(135deg, ${c1}, ${c2})`,
                        overflow: "hidden",
                      }}
                    >
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.label}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : null}
                      <svg
                        viewBox="0 0 170 190"
                        preserveAspectRatio="xMidYMid slice"
                        style={{
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          inset: 0,
                          zIndex: 0,
                        }}
                      >
                        {getShapeSVG(item.id, activeCat, item)}
                      </svg>
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#000000",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Content / Labels */}
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{item.label}</div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: t.text3,
                          marginTop: 4,
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.desc || item.prompt}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── VIEW 2: STUDIO CANVAS & GENERATION WORKSPACE ──           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {view === "canvas" && (
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "360px 1fr",
              gap: 24,
              minHeight: "calc(100vh - 210px)",
              alignItems: "stretch",
            }}
          >
            {/* ── Left Sidebar: Create OR Edit Workspace ── */}
            <div
              style={{
                width: 360,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                borderRight: `1px solid ${t.border}`,
                paddingRight: 22,
              }}
            >
              {editMode ? (
                /* ── EDIT MODE CONTROLS ── */
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 12,
                      borderBottom: `1px solid ${t.border}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          background: "#FF6B2B",
                          color: "#ffffff",
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        ✦ Edit Mode
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>
                        Editing Iteration #{imageItems[editTargetIndex]?.iteration || editTargetIndex + 1}
                      </span>
                    </div>
                    <button
                      onClick={cancelEditing}
                      style={{
                        background: "none",
                        border: `1px solid ${t.border}`,
                        borderRadius: R.pill,
                        padding: "3px 10px",
                        fontSize: 11,
                        color: t.text3,
                        cursor: "pointer",
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>

                  {/* Source Image Thumbnail */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>
                      Source Image to Modify
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        marginTop: 6,
                        padding: 10,
                        borderRadius: R.sm,
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      <img
                        src={generatedImages[editTargetIndex] || activeImageUrl}
                        alt="Source"
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 6,
                          objectFit: "cover",
                          border: `1px solid ${t.border}`,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: t.text3, fontWeight: 600 }}>Active Base</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: t.text,
                            fontWeight: 500,
                            lineHeight: 1.35,
                            marginTop: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {imageItems[editTargetIndex]?.prompt || prompt || "Original image"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Instructions Textarea */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>
                      Edit / Refinement Instructions
                    </label>
                    <textarea
                      value={editInstruction}
                      onChange={(e) => setEditInstruction(e.target.value)}
                      rows={3}
                      placeholder="Describe what to change or add (e.g. Add aviator sunglasses, change lighting to warm golden hour, make background a modern city penthouse)..."
                      style={{
                        width: "100%",
                        marginTop: 6,
                        padding: 10,
                        borderRadius: R.sm,
                        background: t.surface,
                        border: `1px solid #FF6B2B`,
                        color: t.text,
                        fontSize: 12.5,
                        fontFamily: FONT,
                        resize: "vertical",
                        outline: "none",
                        boxShadow: "0 0 0 2px rgba(255, 107, 43, 0.15)",
                      }}
                    />
                  </div>

                  {/* Quick Edit Suggestions */}
                  <div>
                    <label style={{ fontSize: 10.5, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>
                      Quick Edit Presets:
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {[
                        "Add stylish sunglasses",
                        "Change background to cyberpunk neon city",
                        "Golden hour warm sunset lighting",
                        "Soft studio portrait lighting",
                        "Dramatic cinematic rim light",
                        "Clear smooth skin with natural eye shine",
                        "35mm film bokeh blur",
                      ].map((sug) => (
                        <button
                          key={sug}
                          onClick={() =>
                            setEditInstruction((prev) => (prev.trim() ? `${prev.trim()}, ${sug}` : sug))
                          }
                          style={{
                            padding: "4px 8px",
                            borderRadius: R.pill,
                            border: `1px solid ${t.border}`,
                            background: t.surface,
                            color: t.text2,
                            fontSize: 11,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#FF6B2B";
                            e.currentTarget.style.color = t.text;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = t.border;
                            e.currentTarget.style.color = t.text2;
                          }}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Apply Edit Action Button */}
                  <button
                    onClick={handleApplyEdit}
                    disabled={editGenerating || !editInstruction.trim()}
                    style={{
                      width: "100%",
                      height: 44,
                      borderRadius: R.sm,
                      background: "#000000",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 700,
                      border: "none",
                      cursor: editGenerating || !editInstruction.trim() ? "not-allowed" : "pointer",
                      opacity: editGenerating || !editInstruction.trim() ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                    }}
                  >
                    <RefreshCw size={14} className={editGenerating ? "animate-spin" : ""} />
                    <span>{editGenerating ? "Generating Edit..." : "Apply Edit & Generate Variation →"}</span>
                  </button>

                  {/* Refinement Triggers for Edit Mode */}
                  <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase", marginBottom: 8 }}>
                      Quick Tool Modifiers
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <button
                        onClick={() => setShowCameraPopover(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Camera size={13} color="#4B8BFF" />
                        <span>Camera</span>
                      </button>
                      <button
                        onClick={() => setShowRelightPopover(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Sun size={13} color="#FFAA33" />
                        <span>Relight</span>
                      </button>
                      <button
                        onClick={() => setShowSkinPopover(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Wand2 size={13} color="#E040FB" />
                        <span>Skin Enhancer</span>
                      </button>
                      <button
                        onClick={handleUpscale}
                        disabled={!activeImageUrl || upscaling}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 10px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: !activeImageUrl || upscaling ? "not-allowed" : "pointer",
                          opacity: !activeImageUrl || upscaling ? 0.5 : 1,
                        }}
                      >
                        <Maximize2 size={13} color="#10A37F" />
                        <span>{upscaling ? "Upscaling..." : "4K Upscale"}</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* ── REGULAR GENERATION CONTROLS ── */
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase" }}>
                      Active Prompt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      placeholder="Describe the image to generate..."
                      style={{
                        width: "100%",
                        marginTop: 6,
                        padding: 10,
                        borderRadius: R.sm,
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        color: t.text,
                        fontSize: 12.5,
                        fontFamily: FONT,
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Settings Badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <span
                      style={{
                        background: t.surface2,
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        color: t.text2,
                      }}
                    >
                      Model: {selectedModel}
                    </span>
                    <span
                      style={{
                        background: t.surface2,
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        color: t.text2,
                      }}
                    >
                      Ratio: {ratio.id}
                    </span>
                    <span
                      style={{
                        background: t.surface2,
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        color: t.text2,
                      }}
                    >
                      Quality: {quality.id}
                    </span>
                  </div>

                  {/* Regenerate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    style={{
                      width: "100%",
                      height: 42,
                      borderRadius: R.sm,
                      background: "#000000",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 700,
                      border: "none",
                      cursor: generating || !prompt.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
                    <span>{generating ? "Generating..." : "Generate New Image"}</span>
                  </button>

                  {/* Creative Refinement Tools */}
                  <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase", marginBottom: 10 }}>
                      Creative Refinement Tools
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => setShowCameraPopover(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Camera size={15} color="#4B8BFF" />
                        <span>Camera Angle & Viewport</span>
                      </button>
                      <button
                        onClick={() => setShowRelightPopover(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Sun size={15} color="#FFAA33" />
                        <span>Relight Scene (Directional)</span>
                      </button>
                      <button
                        onClick={() => setShowSkinPopover(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Wand2 size={15} color="#E040FB" />
                        <span>Skin & Facial Enhancer</span>
                      </button>
                      <button
                        onClick={handleUpscale}
                        disabled={!activeImageUrl || upscaling}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: R.sm,
                          background: t.surface,
                          border: `1px solid ${t.border}`,
                          color: t.text,
                          fontSize: 12.5,
                          fontWeight: 600,
                          cursor: !activeImageUrl || upscaling ? "not-allowed" : "pointer",
                          opacity: !activeImageUrl || upscaling ? 0.5 : 1,
                          textAlign: "left",
                        }}
                      >
                        <Maximize2 size={15} color="#10A37F" />
                        <span>{upscaling ? "Upscaling..." : "AI 4K Upscale"}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Right Main Canvas: Expansive Studio Viewport ── */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                background: t.surface,
                borderRadius: R.sm,
                border: `1px solid ${t.border}`,
                padding: "20px 24px",
                position: "relative",
              }}
            >
              {/* Top Viewport Header */}
              {activeImageUrl && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 14,
                    marginBottom: 14,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: "#000000",
                        color: "#ffffff",
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                      }}
                    >
                      ✦ Iteration #{imageItems[focusedImgIndex]?.iteration || focusedImgIndex + 1}
                    </span>
                    <span
                      style={{
                        background: t.surface2,
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        color: t.text2,
                        fontWeight: 600,
                      }}
                    >
                      {ratio.id}
                    </span>
                    <span
                      style={{
                        background: t.surface2,
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        color: t.text2,
                        fontWeight: 600,
                      }}
                    >
                      {selectedModel}
                    </span>
                    {imageItems[focusedImgIndex]?.type === "edit" && (
                      <span
                        style={{
                          background: "rgba(255, 107, 43, 0.1)",
                          color: "#FF6B2B",
                          border: "1px solid rgba(255, 107, 43, 0.3)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                        }}
                      >
                        Refined Variation
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={() => setLightboxImg(activeImageUrl)}
                      style={{
                        background: t.surface2,
                        border: `1px solid ${t.border}`,
                        borderRadius: R.sm,
                        padding: "5px 10px",
                        fontSize: 11.5,
                        color: t.text,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={13} /> Fullscreen
                    </button>
                  </div>
                </div>
              )}

              {/* Center Main Stage */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  minHeight: 460,
                  background:
                    t.bg === "#151311"
                      ? "radial-gradient(circle at 50% 50%, #1e1b18 0%, #151311 100%)"
                      : "radial-gradient(circle at 50% 50%, #f7f8fa 0%, #edf0f5 100%)",
                  borderRadius: R.sm,
                  padding: 20,
                  border: `1px solid ${t.border}`,
                  overflow: "hidden",
                }}
              >
                {(generating || editGenerating) && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(255,255,255,0.85)",
                      backdropFilter: "blur(6px)",
                      zIndex: 30,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "3.5px solid #E5E7EB",
                        borderTopColor: editGenerating ? "#FF6B2B" : "#000000",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: t.text }}>
                      {editGenerating ? "Applying edits on Genfy servers..." : "Creating your image on Genfy..."}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: t.text3 }}>
                      Synthesizing neural features on live model clusters (5-15s)
                    </div>
                  </div>
                )}

                {activeImageUrl ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <img
                      src={activeImageUrl}
                      alt="Genfy Generation"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "58vh",
                        borderRadius: 10,
                        objectFit: "contain",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.16)",
                        border: `1px solid rgba(0,0,0,0.06)`,
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", color: t.text3, padding: 32 }}>
                    <Sparkles size={40} style={{ margin: "0 auto 14px", opacity: 0.35 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>No image generated yet</div>
                    <div style={{ fontSize: 12.5, marginTop: 4, maxWidth: 320 }}>
                      Enter a prompt in the left sidebar or select from Presets to generate your first studio visual.
                    </div>
                  </div>
                )}
              </div>

              {/* ── Prominent Action Bar directly below image ── */}
              {activeImageUrl && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    marginTop: 18,
                    flexWrap: "wrap",
                  }}
                >
                  {/* EDIT IMAGE BUTTON (Highlighted boldly so user immediately sees it!) */}
                  <button
                    onClick={() => startEditing(focusedImgIndex)}
                    style={{
                      padding: "9px 18px",
                      borderRadius: R.sm,
                      background: editMode ? "#FF6B2B" : "#000000",
                      color: "#ffffff",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      border: "none",
                      boxShadow: "0 3px 12px rgba(0,0,0,0.18)",
                      transition: "all 0.15s",
                    }}
                  >
                    <Edit3 size={15} />
                    <span>{editMode ? "Currently Editing" : "Edit / Iterate Image"}</span>
                  </button>

                  <button
                    onClick={handleUpscale}
                    disabled={upscaling}
                    style={{
                      padding: "9px 16px",
                      borderRadius: R.sm,
                      background: t.surface,
                      border: `1px solid ${t.border}`,
                      color: t.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: upscaling ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Maximize2 size={14} color="#10A37F" />
                    <span>{upscaling ? "Upscaling..." : "AI 4K Upscale"}</span>
                  </button>

                  <a
                    href={activeImageUrl}
                    download={`genfy-iter-${focusedImgIndex + 1}.png`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "9px 16px",
                      borderRadius: R.sm,
                      background: t.surface,
                      border: `1px solid ${t.border}`,
                      color: t.text,
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      textDecoration: "none",
                    }}
                  >
                    <Download size={14} /> Download
                  </a>

                  <button
                    onClick={() => setLightboxImg(activeImageUrl)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: R.sm,
                      background: t.surface,
                      border: `1px solid ${t.border}`,
                      color: t.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Eye size={14} /> Fullscreen
                  </button>

                  <button
                    onClick={() => {
                      if (nav) nav("storyboard");
                      if (showToast) showToast("Sent image to Storyboard!");
                    }}
                    style={{
                      padding: "9px 16px",
                      borderRadius: R.sm,
                      background: t.surface2,
                      border: `1px solid ${t.border}`,
                      color: t.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Film size={14} /> Add to Storyboard
                  </button>
                </div>
              )}

              {/* ── Bottom Iterations Filmstrip & History ── */}
              {generatedImages.length > 0 && (
                <div
                  style={{
                    width: "100%",
                    marginTop: 18,
                    paddingTop: 16,
                    borderTop: `1px solid ${t.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.text3, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Lineage & Iterations ({generatedImages.length})
                    </div>
                    <div style={{ fontSize: 11, color: t.text3 }}>Click thumbnail to view or edit from that point</div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      overflowX: "auto",
                      paddingBottom: 4,
                    }}
                  >
                    {generatedImages.map((img, idx) => {
                      const isSel = idx === focusedImgIndex;
                      const itemMeta = imageItems[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => setFocusedImgIndex(idx)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "6px 10px 6px 6px",
                            borderRadius: R.sm,
                            border: isSel ? "2px solid #000000" : `1px solid ${t.border}`,
                            background: isSel ? (t.bg === "#151311" ? t.surface2 : "#ffffff") : t.surface,
                            cursor: "pointer",
                            flexShrink: 0,
                            boxShadow: isSel ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                            transition: "all 0.15s",
                          }}
                        >
                          <img
                            src={img}
                            alt={`iter-${idx}`}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 6,
                              objectFit: "cover",
                            }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 80 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>
                              #{itemMeta?.iteration || generatedImages.length - idx} {itemMeta?.type === "edit" ? "(Edit)" : ""}
                            </div>
                            <div style={{ fontSize: 10.5, color: t.text3 }}>{itemMeta?.createdAt || "Live"}</div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(idx);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#FF6B2B",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                padding: 0,
                                textAlign: "left",
                                marginTop: 2,
                              }}
                            >
                              ✏️ Edit this
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── TOOL POPOVERS ── */}
      {showCameraPopover && (
        <CameraControlPopover
          imageUrl={activeImageUrl}
          onApply={handleApplyCamera}
          onClose={() => setShowCameraPopover(false)}
        />
      )}

      {showRelightPopover && (
        <RelightControlPopover
          imageUrl={activeImageUrl}
          onApply={handleApplyRelight}
          onClose={() => setShowRelightPopover(false)}
        />
      )}

      {showSkinPopover && (
        <SkinEnhancerPopover
          onApply={handleApplySkin}
          onClose={() => setShowSkinPopover(false)}
        />
      )}

      {/* ── FULLSCREEN LIGHTBOX MODAL ── */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.92)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <img
            src={lightboxImg}
            alt="Lightbox view"
            style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 8 }}
          />
          <button
            onClick={() => setLightboxImg(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
