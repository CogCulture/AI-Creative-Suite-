import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { marked } from "marked";
import {
  Play, Loader2, Image as ImageIcon, MessageSquare, ShieldCheck, PenLine,
  FileText, Compass, Sliders, X, Crown, Terminal,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Zap, Sparkles, Trash2,
  RotateCcw, Settings, ArrowDown, ExternalLink, Plus, ArrowLeft, Clock
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Card, Btn } from "../components/primitives/index.jsx";

// ── Pipeline node definitions ────────────────────────────────────────────────
const PIPELINE = [
  {
    id: "brief", type: "tool", step: 1,
    label: "Campaign Brief", subtitle: "Input · Start of pipeline",
    icon: FileText, color: "#E8850C",
    logo: null,
  },
  {
    id: "agent_strategy", type: "agent", step: 2,
    label: "Strategy Agent", subtitle: "Intermediary · Brief → Copy",
    icon: Compass, color: "#6D4AE8",
    logo: null,
    defaultPrompt: "You are an expert Strategy Agent. Analyze campaign briefs and formulate structured strategy specs: Target Audience, Key Value Proposition, Tone of Voice, and Copywriting Angle for the Copy Agent.",
  },
  {
    id: "copy", type: "tool", step: 3,
    label: "Copy Agent", subtitle: "copyagennt.in · API",
    icon: PenLine, color: "#8B5CF6",
    logo: "/images/copy_agent_logo.png",
  },
  {
    id: "agent_artdir", type: "agent", step: 4,
    label: "Art Director Agent", subtitle: "Intermediary · Copy → Visual",
    icon: Sliders, color: "#E8552A",
    logo: null,
    defaultPrompt: "You are a World-Class Visual Art Director. Given campaign copy, select optimal Genfy visual parameters and write a detailed image generation prompt aligned with the brand tone.",
  },
  {
    id: "genfy", type: "tool", step: 5,
    label: "Genfy Image Engine", subtitle: "Nanobanana 2 · Vertex AI",
    icon: ImageIcon, color: "#E8552A",
    logo: "/images/genfy_logo.png",
  },
];

const MODELS = [
  { id: "claude-sonnet-5", label: "Claude Sonnet 5", description: "Creative & Brand Voice" },
  { id: "gpt-6-luna", label: "GPT-6 Luna", description: "Fast & Efficient" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", description: "Advanced Reasoning & Strategy" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "High Speed & Multimodal" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", description: "Deep Complex Reasoning" },
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", description: "In-depth Analysis" }
];
const ASSET_TYPES = ["Instagram Ad Image", "Story Banner (9:16)", "Hero Banner (16:9)", "Facebook Ad", "LinkedIn Post Visual", "YouTube Thumbnail"];
const RATIOS = ["1:1", "9:16", "16:9", "4:3", "3:2"];
const QUALITIES = ["High", "Standard", "Ultra"];

const PREDEFINED_WORKFLOWS = [
  {
    id: "full",
    name: "Full Multi-Agent Pipeline",
    desc: "Brief → Strategy Agent → Copy Agent → Art Director → Genfy",
    badge: "5 Nodes · End-to-End",
    nodes: ["brief", "agent_strategy", "copy", "agent_artdir", "genfy"],
  },
  {
    id: "strategy_copy",
    name: "Strategy & Copywriting",
    desc: "Brief → Strategy Agent → Copy Agent",
    badge: "3 Nodes · Messaging",
    nodes: ["brief", "agent_strategy", "copy"],
  },
  {
    id: "direct_genfy",
    name: "Direct Visual Creator",
    desc: "Brief → Genfy Image Engine",
    badge: "2 Nodes · Visuals",
    nodes: ["brief", "genfy"],
  },
  {
    id: "quick_copy",
    name: "Quick Copy Agent",
    desc: "Brief → Copy Agent",
    badge: "2 Nodes · Copy",
    nodes: ["brief", "copy"],
  },
];

// ── Node Icon / Logo Badge ──────────────────────────────────────────────────
function NodeIconBadge({ node, isAgent, containerSize = 32, radius, size = 15 }) {
  if (!node) return null;
  const r = radius !== undefined ? radius : (isAgent ? 10 : 8);

  // 1. Copy Agent Logo
  if (node.id === "copy" || node.id === "copy_agent") {
    return (
      <div
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: r,
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.12)",
          position: "relative"
        }}
        title="Copy Agent"
      >
        <img
          src="/images/copy_agent_logo.png"
          alt="Copy Agent"
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.15)" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.parentElement.querySelector(".ca-logo-fallback");
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div
          className="ca-logo-fallback"
          style={{
            display: "none",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            background: "#000000",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: Math.round(containerSize * 0.44),
            fontFamily: "Inter, sans-serif",
            userSelect: "none",
            letterSpacing: "-0.03em"
          }}
        >
          CA
        </div>
      </div>
    );
  }

  // 2. Genfy Tool Logo
  if (node.id === "genfy") {
    return (
      <div
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: r,
          background: "rgba(232, 85, 42, 0.12)",
          border: "1px solid rgba(232, 85, 42, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
          boxShadow: "0 0 10px rgba(232, 85, 42, 0.25)",
        }}
        title="Genfy Image Engine"
      >
        <img
          src="/images/genfy_logo.png"
          alt="Genfy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "drop-shadow(0 0 3px rgba(232, 85, 42, 0.6))",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.parentElement.querySelector(".genfy-logo-fallback");
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div
          className="genfy-logo-fallback"
          style={{
            display: "none",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            color: "#E8552A"
          }}
        >
          <ImageIcon size={size} color="#E8552A" />
        </div>
      </div>
    );
  }

  // 3. Campaign Brief
  if (node.id === "brief") {
    const Icon = node.icon || FileText;
    return (
      <div
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: r,
          flexShrink: 0,
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)",
          color: "#ffffff"
        }}
        title="Campaign Brief"
      >
        <Icon size={size} color="#ffffff" />
      </div>
    );
  }

  // 4. Strategy Agent
  if (node.id === "agent_strategy") {
    const Icon = node.icon || Compass;
    return (
      <div
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: r,
          flexShrink: 0,
          background: "linear-gradient(135deg, #6D4AE8, #4F46E5)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 3px 10px rgba(109, 74, 232, 0.35)",
          color: "#ffffff"
        }}
        title="Strategy Agent"
      >
        <Icon size={size} color="#ffffff" />
      </div>
    );
  }

  // 5. Art Director Agent
  if (node.id === "agent_artdir") {
    const Icon = node.icon || Sliders;
    return (
      <div
        style={{
          width: containerSize,
          height: containerSize,
          borderRadius: r,
          flexShrink: 0,
          background: "linear-gradient(135deg, #E8552A, #C2410C)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 3px 10px rgba(232, 85, 42, 0.35)",
          color: "#ffffff"
        }}
        title="Art Director Agent"
      >
        <Icon size={size} color="#ffffff" />
      </div>
    );
  }

  // Fallback for custom nodes
  const Icon = node.icon;
  return (
    <div
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius: r,
        flexShrink: 0,
        background: isAgent
          ? `linear-gradient(135deg, ${node.color || "#6D4AE8"}, ${(node.color || "#6D4AE8")}BB)`
          : `${node.color || "#6D4AE8"}18`,
        display: "grid",
        placeItems: "center",
        boxShadow: isAgent ? `0 3px 10px ${(node.color || "#6D4AE8")}55` : "none",
        color: isAgent ? "#fff" : node.color,
      }}
      title={node.label}
    >
      {Icon && <Icon size={size} color={isAgent ? "#fff" : node.color} />}
    </div>
  );
}

// ── Node connector line ──────────────────────────────────────────────────────
function Connector({ color, active, done, ready }) {
  const isGlowing = active || ready;
  const c = done ? "#22C55E" : isGlowing ? color : "rgba(130,130,130,0.22)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 0", position: "relative" }}>
      <div style={{
        width: isGlowing ? 2.5 : 2, height: 36,
        background: isGlowing
          ? `linear-gradient(to bottom, #22C55E, ${c})`
          : `linear-gradient(to bottom, ${c}, ${c}44)`,
        borderRadius: 2, transition: "all .4s ease",
        boxShadow: isGlowing ? `0 0 10px ${color}88` : "none",
      }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: `7px solid ${c}`,
        transition: "border-color .4s ease",
        filter: isGlowing ? `drop-shadow(0 2px 5px ${color}77)` : "none",
      }} />
      {ready && (
        <span style={{
          position: "absolute", right: -56, top: 10,
          fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color,
          background: `${color}18`, border: `1px solid ${color}40`,
          padding: "1px 6px", borderRadius: 10, letterSpacing: "0.04em",
          textTransform: "uppercase"
        }}>
          flow ready ↓
        </span>
      )}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    idle:    { bg: "rgba(130,130,130,0.12)", text: "rgba(130,130,130,0.7)", label: "IDLE" },
    active:  { bg: "rgba(245,158,27,0.18)",  text: "#F59E1B", label: "RUNNING" },
    done:    { bg: "rgba(34,197,94,0.15)",   text: "#22C55E", label: "DONE" },
    error:   { bg: "rgba(239,68,68,0.15)",   text: "#EF4444", label: "ERROR" },
  }[status] || { bg: "rgba(130,130,130,0.12)", text: "rgba(130,130,130,0.7)", label: "IDLE" };
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, fontWeight: 700, padding: "2px 8px",
      borderRadius: 20, background: cfg.bg, color: cfg.text, letterSpacing: "0.04em",
      display: "flex", alignItems: "center", gap: 4,
    }}>
      {status === "active" ? <Loader2 size={9} className="spin" /> : null}
      {cfg.label}
    </span>
  );
}

// Safe image downloader that prevents about:blank#blocked on data URIs
function downloadImageFile(url, filename = "campaign-creative.png") {
  if (!url) return;
  if (url.startsWith("data:")) {
    try {
      const parts = url.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
      const binStr = atob(parts[1]);
      const len = binStr.length;
      const u8arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8arr[i] = binStr.charCodeAt(i);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return;
    } catch (_) {}
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Markdown and Copy Text Cleaners (Strip raw MD, human-readable format) ────
function stripMarkdownSymbols(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/^#+\s*/gm, "")           // remove leading #, ##, ### on any line
    .replace(/\*\*([^*]+)\*\*/g, "$1") // remove **bold**
    .replace(/\*([^*]+)\*/g, "$1")     // remove *italic*
    .replace(/__([^_]+)__/g, "$1")     // remove __bold__
    .replace(/^["']|["']$/g, "")       // remove quotes
    .trim();
}

function cleanHeadline(text) {
  if (!text || typeof text !== "string") return "";
  return stripMarkdownSymbols(text)
    .replace(/^Headline:\s*/i, "")
    .replace(/^Copy:\s*/i, "")
    .trim();
}

// Strip headline from body copy so it is never displayed or saved twice
function stripHeadlineFromBody(body, headline) {
  if (!body || typeof body !== "string") return "";
  let cleanBody = cleanRawJson(body).trim();
  if (!headline) return cleanBody;

  const cleanH = cleanHeadline(headline).toLowerCase();
  const lines = cleanBody.split("\n");

  while (lines.length > 0) {
    const firstLineRaw = lines[0].trim();
    if (!firstLineRaw || /^[•●\-\*\._\s~]+$/.test(firstLineRaw)) {
      lines.shift();
      continue;
    }
    const firstLineClean = cleanHeadline(firstLineRaw).toLowerCase();
    if (
      firstLineClean === cleanH ||
      (cleanH.length > 10 && cleanH.startsWith(firstLineClean)) ||
      (firstLineClean.length > 10 && firstLineClean.startsWith(cleanH)) ||
      (cleanH.length > 10 && cleanH.includes(firstLineClean) && firstLineClean.length > 15) ||
      /^headline\s*:/i.test(firstLineRaw)
    ) {
      lines.shift();
      continue;
    }
    break;
  }

  return lines.join("\n").trim();
}

// Format copy plain text into clean, styled HTML without any raw markdown tokens or stray bullets
function formatCopyHtml(raw, headline) {
  if (!raw || typeof raw !== "string") return "";
  let text = stripHeadlineFromBody(raw, headline);
  text = text.replace(/^#+\s*/gm, "");
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");

  const lines = text.split("\n");
  const htmlParts = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip stray spacer lines like ".", "•", "-", "---", "***", etc.
    if (/^[•●\-\*\._\s~]+$/.test(line)) continue;

    // Check if line is a section header (e.g. Scene:, Tension:, Payoff:, Hook:, CTA:, etc.)
    const isSectionHeader = /^(Scene|Tension|Payoff|Hook|Angle|CTA|Call to Action|Audience|Tone|Concept|Key Message|Why Choose Us|Visual Direction|Format|Specs|Benefits?|Features?)\s*:?/i.test(line)
      || (line.endsWith(":") && line.length < 50);

    if (isSectionHeader) {
      // Section headers must NEVER have bullet dots! Clean uppercase header.
      const cleanHeader = line.replace(/^[•●\-\*]\s*/, "");
      htmlParts.push(`<div style="font-weight: 800; color: #8B5CF6; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 12px; margin-bottom: 3px;">${cleanHeader}</div>`);
      continue;
    }

    // Check if line is a true bullet item (e.g. "• Superior Quality: Designed for those...")
    const hasBulletPrefix = /^[•●\-\*]\s*/.test(line);
    const stripped = line.replace(/^[•●\-\*]\s*/, "").trim();
    const bulletMatch = stripped.match(/^([^:]+):\s*(.+)$/);

    if (hasBulletPrefix && bulletMatch && bulletMatch[1].length < 40) {
      const key = bulletMatch[1].trim();
      const val = bulletMatch[2].trim();
      htmlParts.push(`
        <div style="margin-bottom: 6px; line-height: 1.55; display: flex; gap: 7px; align-items: baseline; padding-left: 2px;">
          <span style="color: #8B5CF6; font-weight: 700; font-size: 12px;">•</span>
          <div>
            <strong style="color: inherit; font-weight: 700;">${key}:</strong> <span>${val}</span>
          </div>
        </div>
      `);
    } else if (hasBulletPrefix) {
      if (stripped) {
        htmlParts.push(`
          <div style="margin-bottom: 6px; line-height: 1.55; display: flex; gap: 7px; align-items: baseline; padding-left: 2px;">
            <span style="color: #8B5CF6; font-weight: 700; font-size: 12px;">•</span>
            <span>${stripped}</span>
          </div>
        `);
      }
    } else {
      htmlParts.push(`<p style="margin: 0 0 8px 0; line-height: 1.6;">${line}</p>`);
    }
  }

  return htmlParts.join("");
}

// ── Integrated Rock-Solid Copy Box (Headline + Body + CTA all inside one box) ──
function IntegratedCopyBox({ output, onUpdateOutput, nodeId, t }) {
  const [headline, setHeadline] = useState(cleanHeadline(output.headline) || "");
  const [bodyText, setBodyText] = useState(
    stripMarkdownSymbols(stripHeadlineFromBody(output.bodyText, output.headline)) || ""
  );
  const [cta, setCta] = useState(cleanHeadline(output.cta) || "Shop Now");
  const textareaRef = useRef(null);
  const timerRef = useRef(null);

  // Sync internal state when output changes externally
  useEffect(() => {
    setHeadline(cleanHeadline(output.headline) || "");
    setBodyText(stripMarkdownSymbols(stripHeadlineFromBody(output.bodyText, output.headline)) || "");
    setCta(cleanHeadline(output.cta) || "Shop Now");
  }, [output.headline, output.bodyText, output.cta]);

  // Auto-resize textarea to fit content smoothly without glitchy scrollbars
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(140, textareaRef.current.scrollHeight)}px`;
    }
  }, [bodyText]);

  const scheduleSave = (newH, newBody, newCta) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onUpdateOutput(nodeId, {
        ...output,
        headline: newH,
        bodyText: newBody,
        cta: newCta,
      });
    }, 500);
  };

  const handleHeadlineChange = (e) => {
    const val = cleanHeadline(e.target.value);
    setHeadline(val);
    scheduleSave(val, bodyText, cta);
  };

  const handleBodyChange = (e) => {
    const val = stripMarkdownSymbols(e.target.value);
    setBodyText(val);
    scheduleSave(headline, val, cta);
  };

  const handleCtaChange = (e) => {
    const val = cleanHeadline(e.target.value);
    setCta(val);
    scheduleSave(headline, bodyText, val);
  };

  return (
    <div style={{
      background: t.surface,
      border: `1.5px solid rgba(139, 92, 246, 0.4)`,
      borderRadius: 8,
      padding: "12px 14px",
      boxShadow: "0 2px 10px rgba(139, 92, 246, 0.08)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      {/* 1. Single Clean Headline (In-place editable, no markdown) */}
      <div>
        <input
          type="text"
          value={headline}
          onChange={handleHeadlineChange}
          placeholder="Campaign Headline..."
          title="Campaign Headline"
          style={{
            width: "100%",
            fontWeight: 800,
            fontSize: 14.5,
            color: t.text,
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${t.border}`,
            paddingBottom: 6,
            outline: "none",
            letterSpacing: "-0.01em",
            fontFamily: FONT,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* 2. Body Text (Clean human readable copy, native textarea, rock solid, never glitchy) */}
      <div>
        <textarea
          ref={textareaRef}
          value={bodyText}
          onChange={handleBodyChange}
          placeholder="Campaign copy paragraphs..."
          className="thin-scrollbar"
          style={{
            width: "100%",
            minHeight: 140,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: 12,
            lineHeight: 1.6,
            color: t.text,
            fontFamily: FONT,
            padding: 0,
            margin: 0,
            boxSizing: "border-box",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(140, 140, 160, 0.22) transparent",
          }}
        />
      </div>

      {/* 3. CTA (INSIDE the copy box as an integral part of copy) */}
      <div style={{
        paddingTop: 8,
        borderTop: `1px dashed ${t.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 180 }}>
          <span style={{
            fontSize: 9.5,
            fontFamily: MONO,
            fontWeight: 800,
            color: "#8B5CF6",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}>
            CTA:
          </span>
          <input
            type="text"
            value={cta}
            onChange={handleCtaChange}
            placeholder="e.g. Shop Now"
            title="Call to Action"
            style={{
              flex: 1,
              maxWidth: 220,
              background: t.surface2,
              border: `1px solid rgba(139, 92, 246, 0.35)`,
              borderRadius: 6,
              padding: "4px 9px",
              fontSize: 11,
              fontWeight: 700,
              color: "#8B5CF6",
              outline: "none",
            }}
          />
        </div>
        <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3 }}>
          Autosaved ✓
        </span>
      </div>
    </div>
  );
}

function RichFormattedText({ text, headline, t }) {
  if (!text || typeof text !== "string") return null;

  let cleanText = cleanRawJson(text).trim();
  const html = formatCopyHtml(cleanText, headline);

  return (
    <div
      className="rich-copy-output"
      style={{
        fontSize: 12,
        lineHeight: 1.6,
        color: t.text,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Node Card ─────────────────────────────────────────────────────────────────
function NodeCard({
  node, config, status = "idle", output, isSelected,
  onSelect, onUpdateOutput, onRunFromNode, onPreviewImage, onRemove,
  canRunThisStep = false, nextStepId = null, nextStepLabel = null, t
}) {
  const isAgent = node.type === "agent";
  const isDone = status === "done";
  const isActive = status === "active";
  const [isTweaking, setIsTweaking] = useState(false);

  const boxShadow = isActive
    ? `0 0 0 2px ${node.color}88, 0 4px 20px ${node.color}33`
    : isSelected
    ? `0 0 0 2px ${node.color}55`
    : t.shadow;

  return (
    <div
      className="node-card thin-scrollbar"
      onClick={() => onSelect(node.id)}
      style={{
        borderRadius: R.lg,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all .25s ease",
        background: isAgent
          ? `linear-gradient(135deg, ${node.color}0E, ${node.color}04)`
          : t.surface,
        border: isActive
          ? `1.5px solid ${node.color}`
          : isDone
          ? `1.5px solid #22C55E44`
          : isAgent
          ? `1px dashed ${node.color}55`
          : `1px solid ${t.border}`,
        boxShadow,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Full-Node Spinner Overlay on AI Refine ONLY (clean spinner only, no text) */}
      {isTweaking && (
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 35,
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: R.lg,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.5)",
            border: `2px solid ${node.color || "#8B5CF6"}`,
            display: "grid", placeItems: "center",
            boxShadow: `0 0 24px ${node.color || "#8B5CF6"}77`,
          }}>
            <Loader2 size={24} className="spin" color={node.color || "#8B5CF6"} />
          </div>
        </div>
      )}

      {/* Left color accent for tool nodes */}
      {!isAgent && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: isDone ? "#22C55E" : isActive ? node.color : `${node.color}44`,
          borderRadius: "8px 0 0 8px",
          transition: "background .3s",
        }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: isAgent ? 0 : 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NodeIconBadge node={node} isAgent={isAgent} containerSize={32} radius={isAgent ? 10 : 8} size={15} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: t.text, lineHeight: 1.2 }}>{node.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginTop: 1 }}>
              {node.id === "copy" ? `copyagennt.in · ${config?.model || "claude-sonnet-5"}` : isAgent ? `${node.subtitle.split(" · ")[0]} · ${config?.model || "claude-sonnet-5"}` : node.subtitle}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isDone && <CheckCircle size={14} color="#22C55E" />}
          <StatusBadge status={status} />
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(node.id); }}
              title="Remove node from workflow"
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: t.text3, padding: "2px 4px", borderRadius: 4, display: "flex", alignItems: "center",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = t.text3; }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Ready to Run Action Button for Idle Connected Node */}
      {status === "idle" && canRunThisStep && !isActive && (
        <div style={{
          marginTop: 10, paddingTop: 10, paddingLeft: isAgent ? 0 : 6,
          borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ fontSize: 11, color: t.text3, fontFamily: MONO }}>
            Pipeline ready for this step
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRunFromNode && onRunFromNode(node.id);
            }}
            style={{
              padding: "5px 13px", borderRadius: 7, border: "none",
              background: `linear-gradient(135deg, ${node.color || "#8B5CF6"}, ${(node.color || "#8B5CF6")}DD)`,
              color: "#fff", fontWeight: 700, fontSize: 11,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
              boxShadow: `0 2px 8px ${(node.color || "#8B5CF6")}40`,
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Play size={11} fill="#fff" />
            Run this Step ({node.label})
          </button>
        </div>
      )}

      {/* Output Preview */}
      {output && (
        <div style={{
          marginTop: 10, paddingTop: 10, paddingLeft: isAgent ? 0 : 6,
          borderTop: `1px solid ${t.border}`,
        }}>
          <NodeOutputPreview
            node={node}
            output={output}
            onUpdateOutput={onUpdateOutput}
            onRunFromNode={onRunFromNode}
            onPreviewImage={onPreviewImage}
            isTweaking={isTweaking}
            setIsTweaking={setIsTweaking}
            nextStepId={nextStepId}
            nextStepLabel={nextStepLabel}
            t={t}
          />
        </div>
      )}

      {/* Active shimmer */}
      {isActive && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `linear-gradient(90deg, transparent, ${node.color}08, transparent)`,
          animation: "shimmer 1.5s infinite",
        }} />
      )}
    </div>
  );
}

// ── Output preview per node with In-place Editing & AI Refinement ───────────────
function NodeOutputPreview({
  node, output, onUpdateOutput, onRunFromNode, onPreviewImage,
  isTweaking, setIsTweaking, nextStepId, nextStepLabel, t
}) {
  const [aiPrompt, setAiPrompt] = useState("");

  const handleAiRefine = async () => {
    if (!aiPrompt.trim() || isTweaking) return;
    setIsTweaking(true);
    try {
      const currentContent = typeof output.bodyText === "string"
        ? cleanRawJson(output.bodyText)
        : output.image_prompt || JSON.stringify(output);

      let conversationHistory = "";
      const existingRefinements = output.refinements || [];
      if (existingRefinements.length > 0) {
        conversationHistory = "Previous refinements history:\n" + existingRefinements.map((ref, idx) =>
          `Iteration ${idx + 1} Tweak Request: "${ref.request}"\nAI Result: ${ref.response}`
        ).join("\n\n") + "\n\n";
      }

      const promptToAgent = `ORIGINAL COPY:\n${output.original_copy || currentContent}\n\n${conversationHistory}NEW USER TWEAK REQUEST:\n${aiPrompt}\n\n[DIRECTIVE: Write natural, compelling advertising copy for social media. DO NOT output JSON syntax, keys, or curly braces. Output clean, human-readable copy paragraphs directly without markdown hashes.]`;
      const r = await fetch("/bff/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: promptToAgent, llm_model: "claude-sonnet-5", stream: false }),
      });
      const raw = await r.json();
      let text = raw.assistant_message || raw.content || raw.text || "";
      text = stripMarkdownSymbols(cleanRawJson(text));

      if (node.id === "copy") {
        const headline = cleanHeadline(extractHeadline(text, "Copy"));
        const bodyText = stripHeadlineFromBody(text, headline);
        onUpdateOutput(node.id, {
          ...output,
          original_copy: output.original_copy || currentContent,
          refinements: [...existingRefinements, { request: aiPrompt, response: text }],
          headline,
          bodyText,
          cta: output.cta || "Shop Now",
        });
      } else if (node.id === "agent_artdir") {
        onUpdateOutput(node.id, {
          ...output,
          original_copy: output.original_copy || currentContent,
          refinements: [...existingRefinements, { request: aiPrompt, response: text }],
          image_prompt: text
        });
      } else if (node.id === "agent_strategy") {
        onUpdateOutput(node.id, {
          ...output,
          original_copy: output.original_copy || currentContent,
          refinements: [...existingRefinements, { request: aiPrompt, response: text }],
          copy_specs: text
        });
      } else if (node.id === "brief") {
        onUpdateOutput(node.id, {
          ...output,
          brief: text
        });
      }
      setAiPrompt("");
    } catch (e) {
      console.warn("[AI Tweak Error]:", e);
    } finally {
      setIsTweaking(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Top Action Bar: Run Next Step / Re-run */}
      <div style={{ marginBottom: 8, display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
        <button
          onClick={() => onRunFromNode && onRunFromNode(node.id)}
          title="Re-run this node step"
          style={{
            padding: "3px 9px", borderRadius: 6, border: `1px solid ${t.border}`,
            background: t.surface2, color: t.text2, fontWeight: 600, fontSize: 10,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
          }}
        >
          ↺ Re-run Step
        </button>
        {nextStepId && (
          <button
            onClick={() => onRunFromNode && onRunFromNode(nextStepId)}
            title={`Proceed and execute next step: ${nextStepLabel}`}
            style={{
              padding: "4px 11px", borderRadius: 6, border: "none",
              background: "#22C55E", color: "#fff", fontWeight: 700, fontSize: 10.5,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
              boxShadow: "0 2px 5px rgba(34, 197, 94, 0.25)"
            }}
          >
            ▶ Run Next Step ({nextStepLabel})
          </button>
        )}
      </div>

      {/* 1. Brief Node Output */}
      {node.id === "brief" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: t.text3, textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Brief Input</div>
          <div style={{ whiteSpace: "pre-wrap", color: t.text }}>{output.brief}</div>
        </div>
      )}

      {/* 2. Strategy Agent Output */}
      {node.id === "agent_strategy" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: t.brain, textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Strategy Output</div>
          {output.error && (
            <div style={{
              padding: "8px 12px", borderRadius: 6, marginBottom: 8,
              background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#EF4444", fontSize: 11.5, fontWeight: 700,
            }}>
              ⚠️ Upstream Error: {output.error}
            </div>
          )}
          <div>
            <b style={{ color: t.text }}>Target Audience:</b> {
              (output.target_audience && output.target_audience.trim().toUpperCase() !== "ANALYSIS" && output.target_audience.length > 5)
                ? output.target_audience
                : "Target Demographics & Key Consumers"
            }
          </div>
          {output.copy_specs && (
            <div style={{ color: t.text2, marginTop: 8 }}>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 11, marginBottom: 4 }}>Strategy Specs:</div>
              <div style={{
                fontSize: 11.5, lineHeight: 1.6, color: t.text,
                background: t.surface, padding: "10px 12px", borderRadius: 6, border: `1px solid ${t.border}`
              }}>
                <RichFormattedText text={output.copy_specs} t={t} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Copy Agent Output — Rock-solid Integrated Copy Box (Headline, Body & CTA) */}
      {node.id === "copy" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 10, color: "#8B5CF6", textTransform: "uppercase", fontFamily: MONO }}>
              Generated Copy
            </div>
          </div>

          {output.error && (
            <div style={{
              padding: "8px 12px", borderRadius: 6, marginBottom: 8,
              background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#EF4444", fontSize: 11.5, fontWeight: 700,
            }}>
              ⚠️ Upstream Error: {output.error}
            </div>
          )}

          {/* Unified copy box: headline, auto-growing clean textarea body, and nested CTA inside */}
          <IntegratedCopyBox
            output={output}
            onUpdateOutput={onUpdateOutput}
            nodeId={node.id}
            t={t}
          />

          {output.refinements && output.refinements.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${t.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 9.5, color: t.text3, textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Refinement History</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {output.refinements.map((ref, rIdx) => (
                  <div key={rIdx} style={{ fontSize: 11, color: t.text2 }}>
                    <span style={{ fontWeight: 600, color: "#8B5CF6", marginRight: 4 }}>v{rIdx + 1}:</span>
                    <span style={{ fontStyle: "italic" }}>"{ref.request}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Art Director Agent Output */}
      {node.id === "agent_artdir" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: "#E8552A", textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Art Director Specs</div>
          {output.error && (
            <div style={{
              padding: "8px 12px", borderRadius: 6, marginBottom: 8,
              background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "#EF4444", fontSize: 11.5, fontWeight: 700,
            }}>
              ⚠️ Upstream Error: {output.error}
            </div>
          )}
          <div><b style={{ color: t.text }}>Image Prompt:</b> {output.image_prompt}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {["ratio", "quality", "style", "lighting", "medium"].map(k => output[k] && (
              <span key={k} style={{ fontFamily: MONO, fontSize: 10, background: t.surface, padding: "3px 8px", borderRadius: 5, color: t.text, border: `1px solid ${t.border}` }}>
                {k}: {output[k]}
              </span>
            ))}
            {output.categories && Object.entries(output.categories).map(([k, v]) => (
              <span key={k} style={{ fontFamily: MONO, fontSize: 10, background: t.surface, padding: "3px 8px", borderRadius: 5, color: t.text, border: `1px solid ${t.border}` }}>
                {k}: {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Genfy Image Engine Output */}
      {node.id === "genfy" && (output.url || output.base64) && (
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: `2px solid ${t.brain}`,
          boxShadow: `0 8px 24px ${t.brain}30, 0 2px 8px rgba(0,0,0,0.12)`,
          background: t.surface,
          position: "relative",
          transition: "all 0.25s ease",
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onPreviewImage) onPreviewImage(output.url || `data:image/png;base64,${output.base64}`);
            }}
            title="Click to view full resolution visual preview"
            style={{
              position: "absolute", top: 10, right: 10, zIndex: 10,
              background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(6px)",
              color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: 20, padding: "5px 12px", fontSize: 10.5, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
              boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)"; e.currentTarget.style.transform = "scale(1.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.75)"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            🔍 Full Preview
          </button>

          <img
            src={output.url || `data:image/png;base64,${output.base64}`}
            alt="Generated visual"
            onClick={() => onPreviewImage && onPreviewImage(output.url || `data:image/png;base64,${output.base64}`)}
            style={{ width: "100%", height: "auto", display: "block", cursor: "pointer" }}
          />
          <div style={{ padding: "10px 14px", background: t.surface2, fontSize: 11, color: t.text2, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${t.border}` }}>
            <span style={{ fontWeight: 700, color: t.text }}>Final Visual Rendered</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadImageFile(output.url || `data:image/png;base64,${output.base64}`);
              }}
              style={{ background: "transparent", border: "none", color: t.brain, fontWeight: 700, cursor: "pointer", fontSize: 11, padding: 0 }}
            >
              Download High-Res ⬇
            </button>
          </div>
        </div>
      )}

      {/* AI Prompt Tweaker Bar (Always accessible, triggers full-card spinner overlay) */}
      {node.id !== "genfy" && (
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flex: 1, maxWidth: 360, marginLeft: "auto" }}>
            <input
              type="text"
              placeholder="✨ AI Tweak (e.g. make punchier, bolder...)"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAiRefine()}
              style={{ ...cfgSelect(t), fontSize: 11, padding: "5px 9px", borderRadius: 6 }}
            />
            <button
              onClick={handleAiRefine}
              disabled={isTweaking || !aiPrompt.trim()}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "none",
                background: `linear-gradient(135deg, ${t.brain}, ${t.brain2})`,
                color: "#fff", fontWeight: 700, fontSize: 11, cursor: isTweaking ? "not-allowed" : "pointer", flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              {isTweaking ? <Loader2 size={11} className="spin" /> : "Refine"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Node Data Box (Supports Structured/Readable and Raw JSON Views, with Inline Editing) ────
function NodeDataBox({ label, data, t, editable = false, onSave = null, nodeId = null }) {
  const [mode, setMode] = useState("readable"); // 'readable' | 'raw'
  const [copied, setCopied] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawError, setRawError] = useState(null);

  // Sync rawText whenever data or mode changes
  useEffect(() => {
    if (data !== undefined && data !== null) {
      setRawText(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      setRawError(null);
    } else {
      setRawText("");
    }
  }, [data, mode]);

  const triggerSavedFeedback = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1800);
  };

  const handleCopy = () => {
    try {
      const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleFieldChange = (field, val) => {
    if (!onSave) return;
    const current = (typeof data === "object" && data !== null) ? { ...data } : {};
    current[field] = val;
    onSave(current);
    triggerSavedFeedback();
  };

  const handleStringChange = (val) => {
    if (!onSave) return;
    onSave(val);
    triggerSavedFeedback();
  };

  const handleRawChange = (e) => {
    const val = e.target.value;
    setRawText(val);
    if (!onSave) return;
    try {
      const parsed = JSON.parse(val);
      setRawError(null);
      onSave(parsed);
      triggerSavedFeedback();
    } catch (err) {
      setRawError("Invalid JSON (will save when valid)");
    }
  };

  const handleFormatRaw = () => {
    try {
      const parsed = JSON.parse(rawText);
      const formatted = JSON.stringify(parsed, null, 2);
      setRawText(formatted);
      setRawError(null);
      if (onSave) onSave(parsed);
      triggerSavedFeedback();
    } catch (err) {
      setRawError("Cannot format: " + err.message);
    }
  };

  const renderReadableContent = () => {
    if (!data && !editable) {
      return <span style={{ color: t.text3 }}>No data recorded for this node yet.</span>;
    }

    if (!data && editable) {
      return (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <button
            onClick={() => {
              if (onSave) onSave({ prompt: "", ratio: "1:1", quality: "High" });
            }}
            style={{
              padding: "5px 12px", borderRadius: 6, border: `1px solid ${t.brain}`,
              background: `${t.brain}15`, color: t.brain, fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: FONT
            }}
          >
            + Customize Input for this Node
          </button>
        </div>
      );
    }

    // String content
    if (typeof data === "string") {
      if (editable && onSave) {
        return (
          <textarea
            value={data}
            onChange={(e) => handleStringChange(e.target.value)}
            rows={5}
            placeholder="Enter value..."
            style={{ ...cfgTextarea(t), minHeight: 110 }}
          />
        );
      }
      return (
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
          {cleanRawJson(data)}
        </div>
      );
    }

    if (typeof data === "object" && data !== null) {
      // Editable Mode for Object Data
      if (editable && onSave) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Visual Prompt (Genfy or Art Director) */}
            {data.prompt !== undefined && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700 }}>
                    PROMPT (FROM PRIOR NODE):
                  </label>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: t.brain, fontWeight: 600 }}>Editable</span>
                </div>
                <textarea
                  value={data.prompt || ""}
                  onChange={(e) => handleFieldChange("prompt", e.target.value)}
                  rows={4}
                  placeholder="Visual generation prompt..."
                  style={{ ...cfgTextarea(t), minHeight: 85 }}
                />
              </div>
            )}

            {/* Copy Agent user_message */}
            {data.user_message !== undefined && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700 }}>
                    USER MESSAGE / PROMPT:
                  </label>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: t.brain, fontWeight: 600 }}>Editable</span>
                </div>
                <textarea
                  value={data.user_message || ""}
                  onChange={(e) => handleFieldChange("user_message", e.target.value)}
                  rows={4}
                  placeholder="Prompt for copywriter..."
                  style={{ ...cfgTextarea(t), minHeight: 85 }}
                />
              </div>
            )}

            {/* Brief */}
            {data.brief !== undefined && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700 }}>
                    CAMPAIGN BRIEF:
                  </label>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: t.brain, fontWeight: 600 }}>Editable</span>
                </div>
                <textarea
                  value={data.brief || ""}
                  onChange={(e) => handleFieldChange("brief", e.target.value)}
                  rows={3}
                  placeholder="Campaign brief context..."
                  style={{ ...cfgTextarea(t), minHeight: 70 }}
                />
              </div>
            )}

            {/* Copy Output Reference */}
            {data.copy_output !== undefined && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700 }}>
                    COPY REFERENCE (FROM COPY NODE):
                  </label>
                  <span style={{ fontSize: 9, fontFamily: MONO, color: t.brain, fontWeight: 600 }}>Editable</span>
                </div>
                <textarea
                  value={data.copy_output || ""}
                  onChange={(e) => handleFieldChange("copy_output", e.target.value)}
                  rows={3}
                  placeholder="Copy text reference..."
                  style={{ ...cfgTextarea(t), minHeight: 70 }}
                />
              </div>
            )}

            {/* Ratio & Quality in 2 columns */}
            {(data.ratio !== undefined || data.quality !== undefined) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {data.ratio !== undefined && (
                  <div>
                    <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700, display: "block", marginBottom: 3 }}>
                      RATIO:
                    </label>
                    <select
                      value={data.ratio || "1:1"}
                      onChange={(e) => handleFieldChange("ratio", e.target.value)}
                      style={cfgSelect(t)}
                    >
                      {RATIOS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}
                {data.quality !== undefined && (
                  <div>
                    <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700, display: "block", marginBottom: 3 }}>
                      QUALITY:
                    </label>
                    <select
                      value={data.quality || "High"}
                      onChange={(e) => handleFieldChange("quality", e.target.value)}
                      style={cfgSelect(t)}
                    >
                      {QUALITIES.map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Model IDs */}
            {data.model_ids !== undefined && (
              <div>
                <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700, display: "block", marginBottom: 3 }}>
                  MODEL IDS:
                </label>
                <input
                  type="text"
                  value={Array.isArray(data.model_ids) ? data.model_ids.join(", ") : (data.model_ids || "")}
                  onChange={(e) => handleFieldChange("model_ids", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  placeholder="e.g. ChatGPT, DALL-E 3"
                  style={cfgInput(t)}
                />
              </div>
            )}

            {/* LLM Model */}
            {data.llm_model !== undefined && (
              <div>
                <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700, display: "block", marginBottom: 3 }}>
                  LLM MODEL:
                </label>
                <select
                  value={data.llm_model || "claude-sonnet-5"}
                  onChange={(e) => handleFieldChange("llm_model", e.target.value)}
                  style={cfgSelect(t)}
                >
                  {MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Categories / Style object */}
            {data.categories !== undefined && (
              <div>
                <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700, display: "block", marginBottom: 3 }}>
                  CATEGORIES / STYLE:
                </label>
                {typeof data.categories === "object" && data.categories !== null ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, background: t.surface, padding: "8px 10px", borderRadius: 6, border: `1px solid ${t.border}` }}>
                    {Object.entries(data.categories).map(([ck, cv]) => (
                      <div key={ck} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, width: 65, textTransform: "uppercase" }}>{ck}:</span>
                        <input
                          type="text"
                          value={String(cv)}
                          onChange={(e) => {
                            const nextCats = { ...(data.categories || {}), [ck]: e.target.value };
                            handleFieldChange("categories", nextCats);
                          }}
                          style={{
                            flex: 1, background: t.bg, border: `1px solid ${t.border}`,
                            borderRadius: 4, padding: "4px 8px", fontSize: 11, color: t.text, fontFamily: FONT
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={String(data.categories)}
                    onChange={(e) => handleFieldChange("categories", e.target.value)}
                    style={cfgInput(t)}
                  />
                )}
              </div>
            )}

            {/* Any other keys */}
            {Object.entries(data).filter(([k]) => !["prompt", "user_message", "brief", "copy_output", "ratio", "quality", "model_ids", "llm_model", "categories"].includes(k)).map(([k, v]) => (
              <div key={k}>
                <label style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, fontWeight: 700, display: "block", marginBottom: 3, textTransform: "uppercase" }}>
                  {k}:
                </label>
                <input
                  type="text"
                  value={typeof v === "object" ? JSON.stringify(v) : String(v)}
                  onChange={(e) => {
                    let val = e.target.value;
                    try {
                      if (val.startsWith("{") || val.startsWith("[")) val = JSON.parse(val);
                    } catch (_) {}
                    handleFieldChange(k, val);
                  }}
                  style={cfgInput(t)}
                />
              </div>
            ))}
          </div>
        );
      }

      // Read-Only Mode for Object Data (Outputs or uneditable inputs)
      // 1. CopyAgent / LLM input payload (user_message, llm_model)
      if (data.user_message) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.llm_model && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3 }}>MODEL:</span>
                <span style={{
                  fontSize: 10, fontFamily: MONO, fontWeight: 700,
                  padding: "2px 7px", borderRadius: 4, background: "#8B5CF618",
                  color: "#8B5CF6", border: "1px solid #8B5CF633"
                }}>
                  {data.llm_model}
                </span>
              </div>
            )}
            <div style={{
              fontSize: 11, lineHeight: 1.55, color: t.text,
              background: t.surface, padding: "8px 10px", borderRadius: 6,
              border: `1px solid ${t.border}`, whiteSpace: "pre-wrap"
            }}>
              {data.user_message}
            </div>
          </div>
        );
      }

      // 2. CopyAgent output (headline, bodyText, cta)
      if (data.headline || data.bodyText) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.headline && (
              <div>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, textTransform: "uppercase" }}>Headline:</span>
                <div style={{ fontWeight: 800, fontSize: 13, color: t.text, marginTop: 2 }}>
                  {cleanHeadline(data.headline)}
                </div>
              </div>
            )}
            {data.bodyText && (
              <div>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3, textTransform: "uppercase" }}>Body Copy:</span>
                <div style={{
                  fontSize: 11.5, lineHeight: 1.6, color: t.text2, marginTop: 4,
                  background: t.surface, padding: "8px 10px", borderRadius: 6,
                  border: `1px solid ${t.border}`, whiteSpace: "pre-wrap"
                }}>
                  {stripMarkdownSymbols(stripHeadlineFromBody(data.bodyText, data.headline))}
                </div>
              </div>
            )}
            {data.cta && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3 }}>CTA:</span>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: "#8B5CF615", color: "#8B5CF6", border: "1px solid #8B5CF644"
                }}>
                  {cleanHeadline(data.cta)}
                </span>
              </div>
            )}
          </div>
        );
      }

      // 3. Strategy output (target_audience, copy_specs)
      if (data.target_audience || data.copy_specs) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.target_audience && (
              <div>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3 }}>TARGET AUDIENCE:</span>
                <div style={{ fontWeight: 700, fontSize: 12, color: t.text, marginTop: 2 }}>
                  {data.target_audience}
                </div>
              </div>
            )}
            {data.copy_specs && (
              <div>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3 }}>SPECS:</span>
                <div style={{
                  fontSize: 11, lineHeight: 1.55, color: t.text2, marginTop: 4,
                  background: t.surface, padding: "8px 10px", borderRadius: 6,
                  border: `1px solid ${t.border}`, whiteSpace: "pre-wrap"
                }}>
                  {stripMarkdownSymbols(data.copy_specs)}
                </div>
              </div>
            )}
          </div>
        );
      }

      // 4. Genfy image or Art Dir prompt
      if (data.image_prompt || data.url) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.image_prompt && (
              <div>
                <span style={{ fontSize: 9.5, fontFamily: MONO, color: t.text3 }}>PROMPT:</span>
                <div style={{ fontSize: 11, lineHeight: 1.5, color: t.text, marginTop: 2 }}>
                  {data.image_prompt}
                </div>
              </div>
            )}
            {data.url && (
              <div>
                <img src={data.url} alt="Output" style={{ maxWidth: "100%", maxHeight: 140, borderRadius: 6, display: "block" }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {["ratio", "quality", "style"].map(k => data[k] && (
                <span key={k} style={{ fontFamily: MONO, fontSize: 9.5, background: t.surface, padding: "2px 6px", borderRadius: 4, border: `1px solid ${t.border}`, color: t.text2 }}>
                  {k}: {data[k]}
                </span>
              ))}
            </div>
          </div>
        );
      }

      // 5. Generic object: render key/values cleanly
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(data).map(([k, v]) => (
            <div key={k} style={{ fontSize: 11 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: t.text3 }}>{k}: </span>
              <span style={{ color: t.text, wordBreak: "break-word" }}>
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return String(data);
  };

  return (
    <div style={{ marginTop: 2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 10.5, fontWeight: 700, color: t.text2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {label}
          </label>
          {editable && (
            <span style={{
              fontSize: 8.5, fontFamily: MONO, fontWeight: 700, padding: "1px 5px",
              borderRadius: 4, background: "#8B5CF618", color: "#8B5CF6", border: "1px solid #8B5CF633"
            }}>
              EDITABLE
            </span>
          )}
          {savedBadge && (
            <span style={{ fontSize: 9, fontFamily: MONO, color: "#22C55E", fontWeight: 700 }}>
              ✓ Saved
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {/* Toggle buttons: Readable vs Raw */}
          <div style={{
            display: "inline-flex", background: t.surface, padding: 2,
            borderRadius: 6, border: `1px solid ${t.border}`
          }}>
            <button
              onClick={() => setMode("readable")}
              style={{
                border: "none",
                background: mode === "readable" ? t.brain : "transparent",
                color: mode === "readable" ? "#fff" : t.text3,
                fontSize: 9.5, fontWeight: 700, fontFamily: MONO,
                padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Readable
            </button>
            <button
              onClick={() => setMode("raw")}
              style={{
                border: "none",
                background: mode === "raw" ? t.brain : "transparent",
                color: mode === "raw" ? "#fff" : t.text3,
                fontSize: 9.5, fontWeight: 700, fontFamily: MONO,
                padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Raw
            </button>
          </div>
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{
              padding: "2px 6px", borderRadius: 4, border: `1px solid ${t.border}`,
              background: t.surface2, color: copied ? "#22C55E" : t.text3,
              fontSize: 9.5, fontFamily: MONO, cursor: "pointer"
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="node-data-box thin-scrollbar" style={dataBoxStyle(t)}>
        {mode === "raw" ? (
          editable && onSave ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea
                value={rawText}
                onChange={handleRawChange}
                rows={8}
                placeholder="Enter valid JSON..."
                style={{
                  width: "100%", background: t.bg, border: `1px solid ${rawError ? "#EF4444" : t.borderStrong}`,
                  borderRadius: 6, padding: "8px 10px", color: t.text, fontFamily: MONO, fontSize: 10.5,
                  lineHeight: 1.5, resize: "vertical", boxSizing: "border-box"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {rawError ? (
                  <span style={{ fontSize: 10, color: "#EF4444", fontFamily: MONO }}>{rawError}</span>
                ) : (
                  <span style={{ fontSize: 10, color: "#22C55E", fontFamily: MONO }}>✓ Valid JSON (Auto-Saved)</span>
                )}
                <button
                  onClick={handleFormatRaw}
                  style={{
                    padding: "2px 8px", borderRadius: 4, border: `1px solid ${t.border}`,
                    background: t.surface, color: t.text2, fontSize: 10, fontFamily: MONO, cursor: "pointer"
                  }}
                >
                  Format JSON
                </button>
              </div>
            </div>
          ) : (
            <pre style={{ margin: 0, fontFamily: MONO, fontSize: 10, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}>
              {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
            </pre>
          )
        ) : (
          renderReadableContent()
        )}
      </div>
    </div>
  );
}

// ── Config Panel ──────────────────────────────────────────────────────────────
function ConfigPanel({
  node, config, onChange, onUpdateInput, t, inputs, outputs, status,
  pendingApproval, onApproveStep
}) {
  if (!node) return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <Settings size={28} style={{ color: t.text3, margin: "0 auto 10px" }} />
      <p style={{ fontFamily: MONO, fontSize: 11, color: t.text3 }}>Click any node to configure it</p>
    </div>
  );

  const isAgent = node.type === "agent";

  // Derive effective node input: recorded nodeInputs or default pipeline synthesis
  const effectiveInput = useMemo(() => {
    if (inputs?.[node.id] && Object.keys(inputs[node.id]).length > 0) {
      return inputs[node.id];
    }
    if (node.id === "brief") {
      return {
        brief: config.brief || "",
        brandName: config.brandName || "",
        assetType: config.assetType || "Instagram Ad Image"
      };
    }
    if (node.id === "agent_strategy") {
      return {
        brief: outputs?.brief?.brief || config.brief || "",
        assetType: outputs?.brief?.assetType || config.assetType || "Instagram Ad Image",
        brandName: config.brandName || ""
      };
    }
    if (node.id === "copy") {
      const stratPrompt = outputs?.agent_strategy?.recommended_copy_prompt;
      return {
        user_message: stratPrompt || `Write high-converting ${config.assetType || "Instagram Ad Image"} copy for: ${outputs?.brief?.brief || config.brief || ""}`,
        llm_model: config.model || "claude-sonnet-5"
      };
    }
    if (node.id === "agent_artdir") {
      return {
        brief: outputs?.brief?.brief || config.brief || "",
        copy_output: outputs?.copy?.bodyText || outputs?.copy?.headline || "",
        asset_type: outputs?.brief?.assetType || config.assetType || "Instagram Ad Image"
      };
    }
    if (node.id === "genfy") {
      const artDirPrompt = outputs?.agent_artdir?.image_prompt;
      const copyBody = outputs?.copy?.bodyText;
      return {
        prompt: artDirPrompt || (copyBody ? `Advertising photography visual representing: ${cleanHeadline(outputs?.copy?.headline || "")}\n\n${copyBody.slice(0, 160)}` : (outputs?.brief?.brief || config.brief || "")),
        model_ids: ["ChatGPT"],
        ratio: outputs?.agent_artdir?.ratio || config.ratio || "1:1",
        quality: outputs?.agent_artdir?.quality || config.quality || "High",
        categories: outputs?.agent_artdir?.categories || { style: "cinematic", lighting: "golden" }
      };
    }
    return null;
  }, [inputs, outputs, config, node.id]);

  return (
    <div style={{ padding: "16px 18px", fontFamily: FONT }}>
      {/* Config fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Brief node */}
        {node.id === "brief" && (
          <>
            <CfgField label="Campaign Brief" t={t}>
              <textarea
                value={config.brief || ""}
                onChange={e => onChange("brief", e.target.value)}
                rows={5}
                style={cfgTextarea(t)}
                placeholder="Describe your campaign..."
              />
            </CfgField>
            <CfgField label="Brand Name" t={t}>
              <input
                type="text"
                value={config.brandName || ""}
                onChange={e => onChange("brandName", e.target.value)}
                style={cfgInput(t)}
                placeholder="e.g. Nike, Apple, Lumina"
              />
            </CfgField>
            <CfgField label="Asset Type" t={t}>
              <select value={config.assetType || "Instagram Ad Image"} onChange={e => onChange("assetType", e.target.value)} style={cfgSelect(t)}>
                {ASSET_TYPES.map(a => <option key={a}>{a}</option>)}
              </select>
            </CfgField>
          </>
        )}

        {/* Agent nodes */}
        {isAgent && (
          <>
            <CfgField label="LLM Model" t={t}>
              <select value={config.model || "claude-sonnet-5"} onChange={e => onChange("model", e.target.value)} style={cfgSelect(t)}>
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.label} · {m.description}
                  </option>
                ))}
              </select>
            </CfgField>
            <CfgField label="System Prompt" t={t}>
              <textarea
                value={config.systemPrompt || node.defaultPrompt || ""}
                onChange={e => onChange("systemPrompt", e.target.value)}
                rows={6}
                style={cfgTextarea(t)}
              />
            </CfgField>
          </>
        )}

        {/* Copy tool node */}
        {node.id === "copy" && (
          <>
            <CfgField label="LLM Model" t={t}>
              <select value={config.model || "claude-sonnet-5"} onChange={e => onChange("model", e.target.value)} style={cfgSelect(t)}>
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.label} · {m.description}
                  </option>
                ))}
              </select>
            </CfgField>
          </>
        )}

        {/* Genfy tool node */}
        {node.id === "genfy" && (
          <>
            <CfgField label="Image Quality" t={t}>
              <select value={config.quality || "High"} onChange={e => onChange("quality", e.target.value)} style={cfgSelect(t)}>
                {QUALITIES.map(q => <option key={q}>{q}</option>)}
              </select>
            </CfgField>
            <CfgField label="Aspect Ratio" t={t}>
              <select value={config.ratio || "1:1"} onChange={e => onChange("ratio", e.target.value)} style={cfgSelect(t)}>
                {RATIOS.map(r => <option key={r}>{r}</option>)}
              </select>
            </CfgField>
            <div style={{ padding: "10px 12px", borderRadius: R.md, background: t.surface2, border: `1px solid ${t.border}` }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3 }}>Image Model</div>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: t.text, marginTop: 3 }}>Nanobanana 2 (Gemini Flash Image)</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginTop: 2 }}>Vertex AI · Global</div>
            </div>
          </>
        )}

        {/* Show output if done */}
        {status === "done" && outputs[node.id] && (
          <div style={{ marginTop: 6, padding: "10px 12px", borderRadius: R.md, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: "#22C55E", fontWeight: 700, marginBottom: 4 }}>✓ NODE COMPLETE</div>
            <div style={{ fontSize: 11, color: t.text2 }}>Output passed to next node in pipeline.</div>
          </div>
        )}

        {/* Node input / output with Structured (Readable) vs Raw Toggle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 2 }}>
          <NodeDataBox
            label="Node Input"
            data={effectiveInput}
            t={t}
            editable={true}
            onSave={(newInput) => onUpdateInput ? onUpdateInput(node.id, newInput) : null}
            nodeId={node.id}
          />
          <NodeDataBox
            label="Node Output"
            data={outputs?.[node.id]}
            t={t}
            editable={false}
            nodeId={node.id}
          />
        </div>

        {/* Step Approval Box directly in Sidebar */}
        {pendingApproval && pendingApproval.nodeId === node.id && (
          <div style={{
            marginTop: 10, padding: "12px 14px", borderRadius: R.md,
            background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(34,197,94,0.35)",
            display: "flex", flexDirection: "column", gap: 8
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#16A34A", fontWeight: 700, fontSize: 12 }}>
              <CheckCircle size={16} />
              <span>Step Output Ready for Review</span>
            </div>
            <div style={{ fontSize: 11, color: t.text2, lineHeight: 1.45 }}>
              Review the Input and Output above. You can customize the input or proceed:
            </div>
            <button
              onClick={onApproveStep}
              style={{
                marginTop: 2, padding: "9px 16px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #22C55E, #16A34A)",
                color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 12px rgba(34,197,94,0.3)", fontFamily: FONT
              }}
            >
              <CheckCircle size={15} /> Approve & Proceed ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CfgField({ label, children, t }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: t.text2, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function cfgTextarea(t) {
  return {
    width: "100%", padding: "9px 11px", borderRadius: R.md, boxSizing: "border-box",
    border: `1px solid ${t.border}`, background: t.bg,
    color: t.text, fontFamily: FONT, fontSize: 12.5, outline: "none",
    resize: "vertical", lineHeight: 1.55,
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(140, 140, 160, 0.22) transparent",
  };
}

function cfgSelect(t) {
  return {
    width: "100%", padding: "8px 10px", borderRadius: R.md, boxSizing: "border-box",
    border: `1px solid ${t.border}`, background: t.bg,
    color: t.text, fontFamily: FONT, fontSize: 12.5, outline: "none",
  };
}

function cfgInput(t) {
  return {
    width: "100%", padding: "8px 10px", borderRadius: R.md, boxSizing: "border-box",
    border: `1px solid ${t.border}`, background: t.bg,
    color: t.text, fontFamily: FONT, fontSize: 12.5, outline: "none",
  };
}

function dataBoxStyle(t) {
  return {
    padding: "9px 11px",
    borderRadius: R.md,
    border: `1px solid ${t.border}`,
    background: t.surface2,
    color: t.text2,
    fontFamily: MONO,
    fontSize: 10.5,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 280,
    overflowY: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(140, 140, 160, 0.22) transparent",
  };
}

// ── Tag mini-component ────────────────────────────────────────────────────────
function Tag({ t, label, value }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, padding: "2px 8px", borderRadius: 6,
      background: t.surface3, color: t.text2,
      display: "inline-flex", gap: 4, alignItems: "center",
    }}>
      <span style={{ color: t.text3 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: t.text }}>{value}</span>
    </span>
  );
}

// ── Main WorkflowScreen ───────────────────────────────────────────────────────
export default function WorkflowScreen({ t, nav, showToast, activeProject, setActiveProject }) {
  const aiCfg = activeProject?.workflowConfig?.node_configs || {};
  const defaultStrategyPrompt = PIPELINE.find(n => n.id === "agent_strategy").defaultPrompt;
  const defaultArtDirPrompt = PIPELINE.find(n => n.id === "agent_artdir").defaultPrompt;

  // Persist configs to localStorage keyed by project id so they survive refresh
  const configStorageKey = activeProject?.id
    ? `studio-wf-config-${activeProject.id}`
    : "studio-wf-config-default";

  const buildDefaultConfigs = () => ({
    brief: {
      brief: activeProject?.brief || "",
      brandName: activeProject?.brandName || activeProject?.brand_name || "",
      assetType: activeProject?.assetType || activeProject?.asset_type || "Instagram Ad Image",
    },
    agent_strategy: {
      model: "claude-sonnet-5",
      systemPrompt: defaultStrategyPrompt,
      ...(aiCfg.agent_strategy || {}),
    },
    copy: {
      model: "claude-sonnet-5",
      ...(aiCfg.copy || {}),
    },
    agent_artdir: {
      model: "claude-sonnet-5",
      systemPrompt: defaultArtDirPrompt,
      ...(aiCfg.agent_artdir || {}),
    },
    genfy: {
      quality: "High",
      ratio: "1:1",
      ...(aiCfg.genfy || {}),
    },
  });

  const [configs, setConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem(configStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If project brief changed (e.g. edited externally), keep server brief
        if (activeProject?.brief) parsed.brief = { ...parsed.brief, brief: activeProject.brief };
        return parsed;
      }
    } catch (_) {}
    return buildDefaultConfigs();
  });

  // Was this workflow designed by AI?
  const aiDesigned = !!activeProject?.workflowConfig;
  const aiWorkflowName = activeProject?.workflowConfig?.workflow_name;
  const aiReasoning = activeProject?.workflowConfig?.reasoning;
  const aiInferred = activeProject?.workflowConfig?.inferred;

  // Storage keys per active project so outputs survive page reloads and screen switches
  const stateStorageKey = activeProject?.id
    ? `studio-wf-state-${activeProject.id}`
    : "studio-wf-state-default";

  const [nodeStatus, setNodeStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(`${stateStorageKey}-status`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });

  const [nodeInputs, setNodeInputs] = useState(() => {
    try {
      const saved = localStorage.getItem(`${stateStorageKey}-inputs`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });
  const nodeInputsRef = useRef(nodeInputs);
  useEffect(() => {
    nodeInputsRef.current = nodeInputs;
  }, [nodeInputs]);

  const [nodeOutputs, setNodeOutputs] = useState(() => {
    try {
      const saved = localStorage.getItem(`${stateStorageKey}-outputs`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });
  const nodeOutputsRef = useRef(nodeOutputs);
  useEffect(() => {
    nodeOutputsRef.current = nodeOutputs;
  }, [nodeOutputs]);

  const [masterState, setMasterState] = useState(() => {
    try {
      const saved = localStorage.getItem(`${stateStorageKey}-masterState`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return "idle";
  });

  const [masterFeedback, setMasterFeedback] = useState(() => {
    try {
      const saved = localStorage.getItem(`${stateStorageKey}-masterFeedback`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return "";
  });

  // ── Workflow History State ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState(() => (activeProject ? "canvas" : "history"));
  const [historySearch, setHistorySearch] = useState("");
  const [historyItems, setHistoryItems] = useState(() => {
    try {
      const saved = localStorage.getItem("studio-workflows-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter(i => i && i.id !== "default-frostbrew" && i.id !== "default-workflow" && i.brief);
        if (valid.length !== parsed.length) {
          localStorage.setItem("studio-workflows-history", JSON.stringify(valid));
        }
        return valid;
      }
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    if (false && !activeProject) {
      setViewMode("history");
    }
  }, [activeProject]);

  useEffect(() => {
    fetch("/bff/projects", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((serverProjects) => {
        const localProjects = JSON.parse(localStorage.getItem("studio-projects") || "[]");
        const allProj = Array.isArray(serverProjects) && serverProjects.length > 0 ? serverProjects : localProjects;
        if (!Array.isArray(allProj) || allProj.length === 0) return;

        setHistoryItems((prev) => {
          const list = [...prev];
          allProj.forEach((p) => {
            if (!p || (!p.brief && !p.name)) return;
            const exists = list.some((item) => item.id === p.id || item.name === p.name);
            if (!exists) {
              list.push({
                id: p.id || `proj-${Date.now()}`,
                name: p.name,
                brief: p.brief || "",
                assetType: p.asset_type || p.assetType || "Instagram Ad Image",
                status: p.status || "complete",
                updatedAt: p.createdAt || p.created_at || new Date().toISOString(),
                outputs: p.workflow_config?.outputs || p.outputs || null,
              });
            }
          });
          return list;
        });
      })
      .catch(() => {});
  }, []);

  const initializedProjectIdRef = useRef(null);

  useEffect(() => {
    if (!activeProject) return;

    // Only run initialization ONCE per project ID to prevent overwriting user-added nodes
    if (initializedProjectIdRef.current === activeProject.id) {
      return;
    }
    initializedProjectIdRef.current = activeProject.id;

    let loadedOutputs = activeProject.outputs || activeProject.nodeOutputs || null;
    if (!loadedOutputs && activeProject.id) {
      try {
        const savedOutputs = localStorage.getItem(`studio-wf-state-${activeProject.id}-outputs`);
        if (savedOutputs) loadedOutputs = JSON.parse(savedOutputs);
      } catch (_) {}
    }

    if (loadedOutputs) {
      setNodeOutputs(loadedOutputs);
      const statusMap = {};
      Object.keys(loadedOutputs).forEach(nodeId => {
        if (loadedOutputs[nodeId]) statusMap[nodeId] = "done";
      });
      setNodeStatus(statusMap);
    }

    let savedNodes = null;
    try {
      const savedStr = localStorage.getItem(`${stateStorageKey}-activeNodes`);
      if (savedStr) savedNodes = JSON.parse(savedStr);
    } catch (_) {}

    if (Array.isArray(savedNodes) && savedNodes.length > 0) {
      setActiveNodes(savedNodes);
    } else if (activeProject.nodes && Array.isArray(activeProject.nodes)) {
      updateActiveNodes(activeProject.nodes);
    } else {
      updateActiveNodes(PIPELINE.map(n => n.id));
    }

    if (activeProject.brief) {
      setConfigs(prev => ({
        ...prev,
        brief: {
          ...prev.brief,
          brief: activeProject.brief,
          assetType: activeProject.assetType || prev.brief?.assetType || "Instagram Ad Image"
        }
      }));
    }
  }, [activeProject]);

  const syncHistoryItem = (statusVal, outputsVal) => {
    try {
      const brief = configs.brief.brief;
      if (!brief || !brief.trim()) return;

      const rawList = JSON.parse(localStorage.getItem("studio-workflows-history") || "[]");
      const list = rawList.filter(i => i && i.id !== "default-frostbrew" && i.id !== "default-workflow" && i.brief);

      const currentId = activeProject?.id || `wf-${Date.now()}`;
      const name = activeProject?.name || brief.slice(0, 38) || "Multi-Agent Campaign";
      const assetType = configs.brief.assetType;
      const newItem = {
        id: currentId,
        name,
        brief,
        assetType,
        status: statusVal || masterState || "complete",
        updatedAt: new Date().toISOString(),
        outputs: outputsVal || nodeOutputs,
        nodes: activeNodes,
      };
      const existingIdx = list.findIndex(i => i.id === currentId);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...newItem };
      } else {
        list.unshift(newItem);
      }
      localStorage.setItem("studio-workflows-history", JSON.stringify(list));
      setHistoryItems(list);
    } catch (_) {}
  };

  const handleDeleteHistoryItem = (e, itemId) => {
    e.stopPropagation();
    try {
      const updated = historyItems.filter(i => i.id !== itemId);
      setHistoryItems(updated);
      localStorage.setItem("studio-workflows-history", JSON.stringify(updated));
      if (showToast) showToast("Workflow run deleted", "info");
    } catch (_) {}
  };

  const selectedNodeIdRef = useRef("brief");
  const [selectedNodeId, setSelectedNodeIdState] = useState("brief");
  const setSelectedNodeId = (id) => {
    selectedNodeIdRef.current = id;
    setSelectedNodeIdState(id);
  };

  const [activeNodes, setActiveNodes] = useState(() => {
    if (activeProject?.nodes && Array.isArray(activeProject.nodes)) {
      return activeProject.nodes;
    }
    if (activeProject) {
      return PIPELINE.map(n => n.id);
    }
    try {
      const saved = localStorage.getItem(`${stateStorageKey}-activeNodes`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });
  const [rightSidebarMode, setRightSidebarMode] = useState("config");

  const updateActiveNodes = (nodes) => {
    setActiveNodes(nodes);
    try {
      localStorage.setItem(`${stateStorageKey}-activeNodes`, JSON.stringify(nodes));
    } catch (_) {}
    if (setActiveProject) {
      setActiveProject(prev => (prev ? { ...prev, nodes } : prev));
    }
  };

  const handleAddNode = (nodeId) => {
    if (!activeNodes.includes(nodeId)) {
      const next = [...activeNodes, nodeId];
      updateActiveNodes(next);
      setSelectedNodeId(nodeId);
      setRightSidebarMode("config");
    } else {
      setSelectedNodeId(nodeId);
      setRightSidebarMode("config");
    }
  };

  const handleRemoveNode = (nodeId) => {
    const next = activeNodes.filter(id => id !== nodeId);
    updateActiveNodes(next);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(next[0] || null);
      if (!next.length) setRightSidebarMode("closed");
    }
  };

  const loadPredefinedWorkflow = (preset) => {
    updateActiveNodes(preset.nodes);
    setSelectedNodeId(preset.nodes[0]);
    setRightSidebarMode("closed");
    if (showToast) showToast(`Loaded "${preset.name}"`, "success");
  };

  const currentPipeline = activeNodes
    .map(id => PIPELINE.find(n => n.id === id))
    .filter(Boolean);
  const [isRunning, setIsRunning] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const genfyPollRef = useRef(null);
  const logsBottomRef = useRef(null);

  // ── Visual Typography Studio Editor State ─────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorText, setEditorText] = useState("YOUR BODY DOESN'T WANT A HACK IT WANTS FUEL THAT SHOWS UP");
  const [editorPosX, setEditorPosX] = useState(8);
  const [editorPosY, setEditorPosY] = useState(10);
  const [editorFontSize, setEditorFontSize] = useState(24);
  const [editorColor, setEditorColor] = useState("#FFFFFF");
  const [editorFontFamily, setEditorFontFamily] = useState("sans-serif");
  const [editorAlign, setEditorAlign] = useState("left");
  const [isDraggingText, setIsDraggingText] = useState(false);
  const containerRef = useRef(null);

  // Close image modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && imageModalUrl) {
        setImageModalUrl(null);
        setEditorOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [imageModalUrl]);

  const handleExportCanvasImage = () => {
    if (!imageModalUrl) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageModalUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth || 1080;
      canvas.height = img.naturalHeight || 1080;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scale = canvas.width / 500;
      const fontSize = editorFontSize * scale;
      ctx.font = `800 ${fontSize}px ${editorFontFamily}, system-ui, sans-serif`;
      ctx.fillStyle = editorColor;
      ctx.textAlign = editorAlign;
      ctx.textBaseline = "top";

      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 10 * scale;
      ctx.shadowOffsetX = 2 * scale;
      ctx.shadowOffsetY = 2 * scale;

      const lines = editorText.split("\n");
      const lineHeight = fontSize * 1.25;
      const startX = (editorPosX / 100) * canvas.width;
      const startY = (editorPosY / 100) * canvas.height;

      lines.forEach((line, i) => {
        ctx.fillText(line.trim(), startX, startY + (i * lineHeight));
      });

      const newUrl = canvas.toDataURL("image/png");
      setImageModalUrl(newUrl);
      setOutput("genfy", { ...(nodeOutputs.genfy || {}), url: newUrl });
      setEditorOpen(false);
      if (showToast) showToast("Visual typography updated & saved!", "success");
    };
  };

  // Persist pipeline generations & status to database
  const persistProjectToDB = async (outputsToSave, statusToSave, nodesToSave) => {
    if (!activeProject?.id || activeProject.id.startsWith("wf-")) return;
    try {
      const payload = {
        outputs: outputsToSave || nodeOutputs,
        node_status: statusToSave || nodeStatus,
        nodes: nodesToSave || activeNodes,
        status: "complete"
      };
      await fetch(`/bff/projects/${activeProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      if (setActiveProject) {
        setActiveProject(prev => prev ? { ...prev, ...payload } : prev);
      }
    } catch (err) {
      console.warn("[Workflow Persist Error]:", err);
    }
  };

  // Restore stored pipeline state whenever activeProject changes + handle Storyboard Card context
  useEffect(() => {
    if (activeProject?.id) {
      let restoredOutputs = null;
      let restoredStatus = null;
      try {
        const sStatus   = localStorage.getItem(`studio-wf-state-${activeProject.id}-status`);
        const sInputs   = localStorage.getItem(`studio-wf-state-${activeProject.id}-inputs`);
        const sOutputs  = localStorage.getItem(`studio-wf-state-${activeProject.id}-outputs`);
        const sMaster   = localStorage.getItem(`studio-wf-state-${activeProject.id}-masterState`);
        const sFeedback = localStorage.getItem(`studio-wf-state-${activeProject.id}-masterFeedback`);

        if (sOutputs)  restoredOutputs = JSON.parse(sOutputs);
        if (sStatus)   restoredStatus = JSON.parse(sStatus);
        if (sInputs)   setNodeInputs(JSON.parse(sInputs));
        if (sMaster)   setMasterState(JSON.parse(sMaster));
        if (sFeedback) setMasterFeedback(JSON.parse(sFeedback));
      } catch (_) {}

      // Fallback to activeProject outputs from DB if not in localStorage
      if (!restoredOutputs || Object.keys(restoredOutputs).length === 0) {
        if (activeProject.outputs && Object.keys(activeProject.outputs).length > 0) {
          restoredOutputs = activeProject.outputs;
        } else if (activeProject.nodeOutputs && Object.keys(activeProject.nodeOutputs).length > 0) {
          restoredOutputs = activeProject.nodeOutputs;
        }
      }

      if (restoredOutputs && Object.keys(restoredOutputs).length > 0) {
        setNodeOutputs(restoredOutputs);
        if (!restoredStatus || Object.keys(restoredStatus).length === 0) {
          const statusMap = {};
          Object.keys(restoredOutputs).forEach(nodeId => {
            if (restoredOutputs[nodeId]) statusMap[nodeId] = "done";
          });
          restoredStatus = statusMap;
        }
        setNodeStatus(restoredStatus);
      }

      // Query database for this project's outputs to ensure freshness and restore on page reload
      if (activeProject.id && !activeProject.id.startsWith("wf-")) {
        fetch(`/bff/projects/${activeProject.id}`, { credentials: "include" })
        .then(r => r.ok ? r.json() : null)
        .then(serverProj => {
          if (serverProj) {
            const sOut = serverProj.outputs || {};
            if (Object.keys(sOut).length > 0) {
              setNodeOutputs(sOut);
              const sMap = serverProj.node_status || {};
              Object.keys(sOut).forEach(nodeId => {
                if (sOut[nodeId] && !sMap[nodeId]) sMap[nodeId] = "done";
              });
              setNodeStatus(sMap);
              try {
                localStorage.setItem(`studio-wf-state-${activeProject.id}-outputs`, JSON.stringify(sOut));
                localStorage.setItem(`studio-wf-state-${activeProject.id}-status`, JSON.stringify(sMap));
              } catch (_) {}
            }
            if (serverProj.nodes && Array.isArray(serverProj.nodes) && serverProj.nodes.length > 0) {
              setActiveNodes(serverProj.nodes);
            }
          }
        })
        .catch(() => {});
      }
    }

    // Auto-populate brief from storyboard card if starting from a storyboard card
    if (activeProject?.storyboard_card) {
      const card = activeProject.storyboard_card;
      const combinedBrief = `[CAMPAIGN FORMAT: ${card.format || "Social Post"} (${card.channel || "Instagram"})]\nHOOK: ${card.hook || ""}\nCOPY ANGLE: ${card.copy_angle || ""}\nVISUAL DIRECTION: ${card.visual_direction || ""}`;
      updateConfig("brief", "brief", combinedBrief);
      if (card.format?.toLowerCase().includes("story") || card.format?.includes("9:16")) {
        updateConfig("brief", "assetType", "Story Banner (9:16)");
      } else if (card.format?.toLowerCase().includes("hero") || card.format?.includes("16:9")) {
        updateConfig("brief", "assetType", "Hero Banner (16:9)");
      }
    }
  }, [activeProject]);

  // Helper wrappers that update React state, save to localStorage AND persist to database
  const setStatus = (id, s) => {
    setNodeStatus(prev => {
      const next = { ...prev, [id]: s };
      try { localStorage.setItem(`${stateStorageKey}-status`, JSON.stringify(next)); } catch (_) {}
      if (s === "done" || s === "error") {
        persistProjectToDB(null, next, null);
      }
      return next;
    });
  };

  const setInput = (id, d) => {
    setNodeInputs(prev => {
      const resolved = typeof d === "function" ? d(prev[id]) : d;
      const next = { ...prev, [id]: resolved };
      nodeInputsRef.current = next;
      try { localStorage.setItem(`${stateStorageKey}-inputs`, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const setOutput = (id, d) => {
    setNodeOutputs(prev => {
      const resolved = typeof d === "function" ? d(prev[id]) : d;
      const next = { ...prev, [id]: resolved };
      nodeOutputsRef.current = next;
      try { localStorage.setItem(`${stateStorageKey}-outputs`, JSON.stringify(next)); } catch (_) {}
      syncHistoryItem("complete", next);
      persistProjectToDB(next, null, null);
      return next;
    });
  };

  const updateMasterState = (state, feedback) => {
    setMasterState(state);
    setMasterFeedback(feedback);
    try {
      localStorage.setItem(`${stateStorageKey}-masterState`, JSON.stringify(state));
      localStorage.setItem(`${stateStorageKey}-masterFeedback`, JSON.stringify(feedback));
    } catch (_) {}
  };

  useEffect(() => {
    return () => { if (genfyPollRef.current) clearInterval(genfyPollRef.current); };
  }, []);

  useEffect(() => {
    if (logsBottomRef.current) logsBottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const log = useCallback((msg, type = "info") => {
    const icons = { info: "›", success: "✓", error: "✗", agent: "⬡" };
    setLogs(prev => [...prev, { msg, type, icon: icons[type] || "›", time: new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);
    setLogsOpen(true);
  }, []);

  const updateConfig = (nodeId, field, value) => {
    setConfigs(prev => {
      const next = { ...prev, [nodeId]: { ...prev[nodeId], [field]: value } };
      try { localStorage.setItem(configStorageKey, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const [approvalMode, setApprovalMode] = useState(true); // Default to Interactive Approval Mode
  const [pendingApproval, setPendingApproval] = useState(null); // { nodeId, output, resolveFn }
  const approvalResolverRef = useRef(null);

  const waitForUserApproval = (nodeId, outputData) => {
    return new Promise((resolve) => {
      setPendingApproval({ nodeId, output: outputData });
      approvalResolverRef.current = resolve;
    });
  };

  const handleApproveStep = () => {
    if (approvalResolverRef.current) {
      const resolve = approvalResolverRef.current;
      approvalResolverRef.current = null;
      setPendingApproval(null);
      resolve({ approved: true });
    }
  };

  // Poll Genfy session for image
  const pollGenfySession = (sessionId, log) => new Promise((resolve) => {
    let attempts = 0;
    if (genfyPollRef.current) clearInterval(genfyPollRef.current);
    genfyPollRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch(`/bff/genfy/sessions/${sessionId}`);
        if (!r.ok) return;
        const data = await r.json();
        const imgs = data?.session?.images || data?.images || [];
        const done = imgs.find((i) => (typeof i === "string" ? Boolean(i) : i.status === "completed" && i.url));
        if (done) {
          clearInterval(genfyPollRef.current);
          if (log) log("Genfy: image generated and received", "success");
          resolve(typeof done === "string" ? { url: done } : done);
          return;
        }
        if (data?.status === "failed" || data?.status === "error") {
          clearInterval(genfyPollRef.current);
          if (log) log(data?.error || "Genfy generation failed", "error");
          resolve(null);
          return;
        }
      } catch (_) {}
      if (attempts > 50) {
        clearInterval(genfyPollRef.current);
        resolve(null);
      }
    }, 2000);
  });

  // ── Run Workflow (Supports Starting / Continuing from any Node) ───────────
  const handleRun = async (startFromNodeId = "brief") => {
    if (isRunning) return;
    const brief = configs.brief.brief?.trim();
    if (!brief) { showToast("Please enter a campaign brief first."); setSelectedNodeId("brief"); setRightSidebarMode("config"); return; }

    // Read brand context from active project or localStorage
    let brandContext = null;
    try {
      const raw = localStorage.getItem("studio-brand-context");
      if (raw) brandContext = JSON.parse(raw);
    } catch (_) {}

    const inferredBrandName = activeProject?.brand_name || activeProject?.brandName || brandContext?.brandName || configs.brief.brandName || (brief ? brief.split(" ")[0] : "");
    const inferredIndustry = brandContext?.industry || "Consumer Brand";

    const brandPrefix = `[CRITICAL DIRECTIVE: You MUST explicitly feature and mention the Product & Brand Name ("${inferredBrandName}") throughout the advertising copy.]\n\n` +
      `BRAND CONTEXT:\nBrand Name: ${inferredBrandName}\nIndustry: ${inferredIndustry}\nAudience: ${brandContext?.audience || "Target Consumers"}\nVoice/Tone: ${brandContext?.primaryTone || "Energizing & Modern"}\nUSP: ${brandContext?.usp || "Premium Quality & Performance"}\n\nCAMPAIGN BRIEF:\n`;

    setIsRunning(true);
    setPendingApproval(null);
    setRightSidebarMode("config"); // Ensure sidebar is open and actively tracking execution

    // If starting fresh from beginning, reset status and outputs. Preserve user custom inputs.
    if (startFromNodeId === "brief") {
      setNodeStatus({});
      setNodeOutputs({});
    }

    setMasterState("supervising");
    setMasterFeedback(`Continuing execution from node: ${startFromNodeId}...`);
    setLogsOpen(true);

    log(`👑 Master Supervisor Agent active (Resuming from ${startFromNodeId})`, "agent");
    log(`Campaign goal: ${brief.slice(0, 80)}...`, "info");
    if (approvalMode) {
      log("⏸ Interactive Approval Mode active", "agent");
    }

    const currentOrder = currentPipeline.map(n => n.id);
    if (currentOrder.length === 0) {
      showToast("Please add at least one node to launch the workflow.");
      setIsRunning(false);
      return;
    }
    const startIndex = currentOrder.indexOf(startFromNodeId) !== -1 ? currentOrder.indexOf(startFromNodeId) : 0;

    try {
      // ── STEP 1: Brief node ─────────────────────────────────────────────────
      let briefOutput = nodeOutputsRef.current.brief || { brief, assetType: configs.brief.assetType };
      if (currentOrder.includes("brief") && startIndex <= currentOrder.indexOf("brief")) {
        setStatus("brief", "active");
        setSelectedNodeId("brief");
        setRightSidebarMode("config");
        log("Node 1: Campaign Brief — locked and loaded", "info");
        await delay(400);

        const currentBriefInput = nodeInputsRef.current.brief || {
          brief: configs.brief.brief,
          brandName: configs.brief.brandName || inferredBrandName,
          assetType: configs.brief.assetType
        };
        setInput("brief", currentBriefInput);

        briefOutput = {
          brief: currentBriefInput.brief || brief,
          assetType: currentBriefInput.assetType || configs.brief.assetType,
          brandName: currentBriefInput.brandName || inferredBrandName
        };
        setOutput("brief", briefOutput);
        setStatus("brief", "done");

        // Pre-seed Step 2 (Strategy) input with briefOutput
        setInput("agent_strategy", prev => ({
          brief: prev?.brief || briefOutput.brief,
          assetType: prev?.assetType || briefOutput.assetType,
          brandName: prev?.brandName || briefOutput.brandName
        }));

        if (approvalMode) {
          log("⏸ Brief Step complete. Waiting for user approval to run Strategy Agent...", "agent");
          setMasterFeedback("Node 1 Complete — Awaiting your approval to proceed to Strategy Agent...");
          setSelectedNodeId("brief");
          setRightSidebarMode("config");
          await waitForUserApproval("brief", briefOutput);
          log("✓ Brief approved by user", "success");
        }
      }

      // ── STEP 2: Strategy Agent ─────────────────────────────────────────────
      let strategyData = nodeOutputsRef.current.agent_strategy || null;
      if (currentOrder.includes("agent_strategy") && startIndex <= currentOrder.indexOf("agent_strategy")) {
        setStatus("agent_strategy", "active");
        setSelectedNodeId("agent_strategy");
        setRightSidebarMode("config");
        log("⬡ Strategy Agent: analyzing brief & building copy specs...", "agent");
        setMasterFeedback("Supervising Brief → Copy strategy handoff...");

        const stratInput = nodeInputsRef.current.agent_strategy || {
          brief: briefOutput?.brief || brief,
          assetType: configs.brief.assetType,
          brandName: configs.brief.brandName || inferredBrandName
        };
        setInput("agent_strategy", stratInput);

        const stratBrief = stratInput.brief || brief;
        const stratAssetType = stratInput.assetType || configs.brief.assetType;

        try {
          const r = await fetch("/bff/workflow/step-bridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bridge_type: "brief_to_copy",
              brief: brandPrefix + stratBrief,
              asset_type: stratAssetType,
              brand_id: activeProject?.brand_id || activeProject?.brandId || null,
            }),
          });
          if (!r.ok) {
            let errorText = `HTTP ${r.status}`;
            try {
              const errJson = await r.json();
              errorText = errJson.detail || errJson.error || JSON.stringify(errJson);
            } catch {}
            throw new Error(errorText);
          }
          strategyData = await r.json();
          log(`Strategy Agent: audience = "${strategyData.target_audience}"`, "success");
          setOutput("agent_strategy", strategyData);
          setStatus("agent_strategy", "done");

          // Pre-seed Step 3 (Copy Agent) input with Strategy output recommendation
          const recCopyPrompt = strategyData.recommended_copy_prompt
            ? (brandPrefix ? brandPrefix + strategyData.recommended_copy_prompt : strategyData.recommended_copy_prompt)
            : `Write high-converting ${stratAssetType} copy for: ${brandPrefix}${stratBrief}`;
          setInput("copy", prev => ({
            user_message: prev?.user_message || recCopyPrompt,
            llm_model: prev?.llm_model || configs.copy.model || "claude-sonnet-5"
          }));
        } catch (err) {
          console.error("[Strategy Agent Error]:", err);
          const errMsg = err.message || "Failed to generate strategy";
          log(`Strategy Agent Error: ${errMsg}`, "error");
          setMasterFeedback(`Strategy Node Failed: ${errMsg}`);
          setStatus("agent_strategy", "error");
          setOutput("agent_strategy", {
            error: errMsg,
            target_audience: "Rate Limit / Strategy Error",
            copy_specs: `⚠️ Strategy Agent Error:\n${errMsg}`,
          });
          setIsRunning(false);
          return;
        }

        if (approvalMode) {
          log("⏸ Strategy Step complete. Review Strategy Output and click Approve to run Copy Agent...", "agent");
          setMasterFeedback("Strategy Node Complete — Awaiting your approval to proceed to Copy Agent...");
          setSelectedNodeId("agent_strategy");
          setRightSidebarMode("config");
          await waitForUserApproval("agent_strategy", strategyData);
          log("✓ Strategy output approved by user", "success");
        }

        // Master audit step 1 — non-blocking
        fetch("/bff/workflow/orchestrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ master_goal: brief, current_step: "2. Strategy Analysis", step_data: strategyData }) })
          .then(r => { if (!r.ok) console.warn("[Orchestrator] audit step 1 returned", r.status); })
          .catch(err => console.warn("[Orchestrator] audit step 1 error:", err));
      }

      // ── STEP 3: Copy Agent ─────────────────────────────────────────────────
      let copyData = nodeOutputsRef.current.copy || null;
      if (currentOrder.includes("copy") && startIndex <= currentOrder.indexOf("copy")) {
        setStatus("copy", "active");
        setSelectedNodeId("copy");
        setRightSidebarMode("config");
        log("Node 3: Copy Agent — generating campaign copy via CopyAgent API...", "info");
        setMasterFeedback("Supervising Copy Agent output quality...");

        const defaultCopyPrompt = (strategyData && strategyData.recommended_copy_prompt)
          ? (brandPrefix ? brandPrefix + strategyData.recommended_copy_prompt : strategyData.recommended_copy_prompt)
          : `Write high-converting ${configs.brief.assetType} copy for: ${brandPrefix}${brief}`;

        // Honor any customized user input from nodeInputsRef
        const copyInput = nodeInputsRef.current.copy || {
          user_message: defaultCopyPrompt,
          llm_model: configs.copy.model || "claude-sonnet-5"
        };
        setInput("copy", copyInput);

        const promptToSend = copyInput.user_message || defaultCopyPrompt;
        const modelToSend = copyInput.llm_model || configs.copy.model || "claude-sonnet-5";

        try {
          const payload = {
            user_message: `${promptToSend}\n\n[Run Variation Nonce: ${Date.now()}]`,
            llm_model: modelToSend,
            stream: false,
          };
          if (activeProject && (activeProject.brand_id || activeProject.brandId)) {
            payload.external_project_data = { brand_id: activeProject.brand_id || activeProject.brandId };
          }
          const r = await fetch("/bff/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!r.ok) {
            throw new Error(`BFF server returned status ${r.status}`);
          }
          const raw = await r.json();
          let extractedFilesText = "";
          if (raw.files) {
            for (const cat in raw.files) {
              if (Array.isArray(raw.files[cat])) {
                for (const f of raw.files[cat]) {
                  if (f.content) extractedFilesText += f.content + "\n\n";
                }
              }
            }
          }

          const generatedText =
            extractedFilesText.trim() ||
            raw.assistant_message ||
            raw.content ||
            raw.response ||
            raw.text ||
            raw.message ||
            (raw.choices && raw.choices[0]?.message?.content) ||
            (raw.choices && raw.choices[0]?.text);

          if (!generatedText) {
            throw new Error("Copy Agent returned an empty response.");
          }
          const cleanText = cleanRawJson(generatedText);
          copyData = { headline: extractHeadline(cleanText, configs.brief.assetType), bodyText: cleanText, cta: "Shop Now" };
          log("Copy Agent: unique copy generated successfully", "success");
          setOutput("copy", copyData);
          setStatus("copy", "done");

          // Pre-seed Step 4 (Art Director) and Step 5 (Genfy) inputs
          const copyTextForArtDir = copyData.bodyText || brief;
          setInput("agent_artdir", prev => ({
            brief: prev?.brief || brief,
            copy_output: prev?.copy_output || copyTextForArtDir,
            asset_type: prev?.asset_type || configs.brief.assetType,
            brand_name: prev?.brand_name || configs.brief.brandName || inferredBrandName
          }));

          const defaultGenfyPrompt = `Advertising photography visual representing: ${cleanHeadline(copyData.headline || "")}\n\n${copyData.bodyText ? copyData.bodyText.slice(0, 160) : brief}`;
          setInput("genfy", prev => ({
            prompt: prev?.prompt || defaultGenfyPrompt,
            model_ids: prev?.model_ids || ["ChatGPT"],
            ratio: prev?.ratio || configs.genfy.ratio || "1:1",
            quality: prev?.quality || configs.genfy.quality || "High",
            categories: prev?.categories || { style: "cinematic", lighting: "golden" }
          }));
        } catch (err) {
          console.error("[Workflow CopyAgent Error]:", err);
          const errMsg = err.message || "Failed to generate copy";
          log(`Copy Agent Error: ${errMsg}`, "error");
          setMasterFeedback(`Copy Agent Node Failed: ${errMsg}`);
          setStatus("copy", "error");
          setOutput("copy", { error: errMsg, headline: "Copy Generation Error", bodyText: `⚠️ Copy Agent Failed:\n${errMsg}` });
          setIsRunning(false);
          return;
        }

        if (approvalMode) {
          log("⏸ Copy Generation complete. Review Copy Output and click Approve to run Art Director...", "agent");
          setMasterFeedback("Copy Agent Node Complete — Awaiting your approval to proceed to Art Director...");
          setSelectedNodeId("copy");
          setRightSidebarMode("config");
          await waitForUserApproval("copy", copyData);
          log("✓ Copy output approved by user", "success");
        }

        // Master audit step 2 — non-blocking
        fetch("/bff/workflow/orchestrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ master_goal: brief, current_step: "3. Copy Generation", step_data: copyData }) })
          .then(r => { if (!r.ok) console.warn("[Orchestrator] audit step 2 returned", r.status); })
          .catch(err => console.warn("[Orchestrator] audit step 2 error:", err));
      }

      // ── STEP 4: Art Director Agent ─────────────────────────────────────────
      let artDirData = (currentOrder.indexOf("agent_artdir") !== -1 && startIndex > currentOrder.indexOf("agent_artdir") ? nodeOutputsRef.current.agent_artdir : null);
      if (currentOrder.includes("agent_artdir") && (startIndex <= currentOrder.indexOf("agent_artdir") || !artDirData)) {
        setStatus("agent_artdir", "active");
        setSelectedNodeId("agent_artdir");
        setRightSidebarMode("config");
        log("⬡ Art Director Agent: mapping copy to Genfy visual parameters...", "agent");
        setMasterFeedback("Supervising Art Director visual parameter selection...");

        const copyTextForArtDir = (copyData && copyData.bodyText) ? copyData.bodyText : brief;
        const artDirInput = nodeInputsRef.current.agent_artdir || {
          brief,
          copy_output: copyTextForArtDir,
          asset_type: configs.brief.assetType,
          brand_name: configs.brief.brandName || inferredBrandName
        };
        setInput("agent_artdir", artDirInput);

        try {
          const r = await fetch("/bff/workflow/step-bridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bridge_type: "copy_to_genfy",
              brief: brandPrefix + (artDirInput.brief || brief),
              copy_output: artDirInput.copy_output || copyTextForArtDir,
              asset_type: artDirInput.asset_type || configs.brief.assetType,
              brand_id: activeProject?.brand_id || activeProject?.brandId || null,
              brand_name: artDirInput.brand_name || configs.brief.brandName || inferredBrandName || "",
            }),
          });
          if (!r.ok) {
            let errorText = `HTTP ${r.status}`;
            try {
              const errJson = await r.json();
              errorText = errJson.detail || errJson.error || JSON.stringify(errJson);
            } catch {}
            throw new Error(errorText);
          }
          artDirData = await r.json();
          log(`Art Director: image prompt ready — "${artDirData.image_prompt?.slice(0, 50)}..."`, "success");
          setOutput("agent_artdir", artDirData);
          setStatus("agent_artdir", "done");

          // Pre-seed Step 5 (Genfy) with Art Director's prompt & settings (or user's customized overrides)
          setInput("genfy", prev => ({
            prompt: prev?.prompt && !prev.prompt.startsWith("Advertising photography visual") ? prev.prompt : (artDirData.image_prompt || prev?.prompt),
            model_ids: prev?.model_ids || ["ChatGPT"],
            ratio: prev?.ratio || artDirData.ratio || configs.genfy.ratio || "1:1",
            quality: prev?.quality || artDirData.quality || configs.genfy.quality || "High",
            categories: prev?.categories || artDirData.categories || { style: "cinematic", lighting: "golden" }
          }));
        } catch (err) {
          console.error("[Art Director Error]:", err);
          const errMsg = err.message || "Failed to generate visual prompt";
          log(`Art Director Error: ${errMsg}`, "error");
          setMasterFeedback(`Art Director Node Failed: ${errMsg}`);
          setStatus("agent_artdir", "error");
          setOutput("agent_artdir", { error: errMsg, image_prompt: `⚠️ Art Director Error:\n${errMsg}` });
          setIsRunning(false);
          return;
        }

        if (approvalMode) {
          log("⏸ Art Director Step complete. Review Visual Prompt and click Approve to render Image...", "agent");
          setMasterFeedback("Art Director Node Complete — Awaiting your approval to render Image...");
          setSelectedNodeId("agent_artdir");
          setRightSidebarMode("config");
          await waitForUserApproval("agent_artdir", artDirData);
          log("✓ Art Director output approved by user", "success");
        }
      }

      // ── STEP 5: Genfy Image Engine ─────────────────────────────────────────
      let genfyResult = (currentOrder.indexOf("genfy") !== -1 && startIndex > currentOrder.indexOf("genfy") ? nodeOutputsRef.current.genfy : null);
      if (currentOrder.includes("genfy") && (startIndex <= currentOrder.indexOf("genfy") || !genfyResult)) {
        setStatus("genfy", "active");
        setSelectedNodeId("genfy");
        setRightSidebarMode("config");
        log("Node 5: Image Engine — requesting generation via ChatGPT...", "info");
        setMasterFeedback("Supervising image rendering process...");

        const activeArtDir = artDirData || nodeOutputsRef.current.agent_artdir || {};
        const fallbackImgPrompt = activeArtDir.image_prompt || (copyData?.bodyText ? `Advertising photography visual representing: ${cleanHeadline(copyData.headline || "")}\n\n${copyData.bodyText.slice(0, 150)}` : brief);

        // Read user-edited Genfy input directly from nodeInputsRef
        const genfyInput = nodeInputsRef.current.genfy || {
          prompt: fallbackImgPrompt,
          model_ids: ["ChatGPT"],
          ratio: activeArtDir.ratio || configs.genfy.ratio || "1:1",
          quality: activeArtDir.quality || configs.genfy.quality || "High",
          categories: activeArtDir.categories || { style: "cinematic", lighting: "golden" },
        };
        setInput("genfy", genfyInput);

        const promptToSend = genfyInput.prompt || fallbackImgPrompt;
        const ratioToSend = genfyInput.ratio || activeArtDir.ratio || configs.genfy.ratio || "1:1";
        const qualityToSend = genfyInput.quality || activeArtDir.quality || configs.genfy.quality || "High";

        try {
          const r = await fetch("/bff/genfy/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: promptToSend,
              ratio: ratioToSend,
              quality: qualityToSend,
              model_ids: ["Nanobanana 2"],
              categories: genfyInput.categories || activeArtDir.categories || undefined,
            }),
          });
          if (r.ok) {
            const data = await r.json();
            let imgUrl =
              data?.results?.[0]?.image_url ||
              data?.results?.[0]?.url ||
              (data?.images?.[0]?.status === "completed" ? data?.images?.[0]?.url : null) ||
              null;

            if (!imgUrl && (data?.session_id || data?.id)) {
              const sid = data.session_id || data.id;
              log("Node 5: Genfy image generation started, rendering neural visual...", "info");
              const polled = await pollGenfySession(sid, log);
              if (polled && (polled.url || polled.image_url)) {
                imgUrl = polled.url || polled.image_url;
              }
            }

            if (imgUrl) {
              genfyResult = { url: imgUrl, status: "completed", model_id: "Nanobanana 2", prompt: promptToSend };
              log("✓ Image generated successfully via Genfy Image Engine", "success");
            } else {
              throw new Error("No image URL returned from Genfy after rendering.");
            }
          } else {
            throw new Error(`HTTP ${r.status}`);
          }
        } catch (e) {
          log(`Genfy Image Generation failed: ${e.message || "API error"}`, "error");
        }
      }

      if (currentOrder.includes("genfy")) {
        if (genfyResult) {
          setOutput("genfy", genfyResult);
          setStatus("genfy", "done");
          setSelectedNodeId("genfy");
          setRightSidebarMode("config");
          log("✓ Image generation complete", "success");
        } else {
          setStatus("genfy", "error");
          throw new Error("ChatGPT image generation failed and returned no output.");
        }
      }

      // Save generated image to assets store so Assets screen can display it
      if (genfyResult?.url || genfyResult?.base64) {
        try {
          const existing = JSON.parse(localStorage.getItem("studio-generated-assets") || "[]");
          const newAsset = {
            name: `${configs.brief.assetType} — ${new Date().toLocaleDateString()}`,
            type: "IMAGE",
            url: genfyResult.url || (genfyResult.base64 ? `data:image/png;base64,${genfyResult.base64}` : null),
            by: "Workflow",
            byHue: "#E8552A",
            date: new Date().toLocaleDateString(),
            gradient: "232 85 42, 232 133 12",
          };
          localStorage.setItem("studio-generated-assets", JSON.stringify([newAsset, ...existing].slice(0, 50)));
        } catch (_) {}
      }

      // ── Master Final Audit ─────────────────────────────────────────────────
      if (currentOrder.includes("copy") || currentOrder.includes("genfy")) {
        log("👑 Master Supervisor: running final campaign audit...", "agent");
        setMasterFeedback("Running final multi-agent pipeline audit...");
        let auditFeedback = "Campaign assets fully aligned with brief. Copy tone, visual style, and audience targeting are coherent. Approved for production.";
        try {
          const r = await fetch("/bff/workflow/orchestrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ master_goal: brief, current_step: "5. Final Audit", step_data: { copy: copyData, image: genfyResult } }),
          });
          const auditData = await r.json();
          auditFeedback = auditData.supervisor_feedback || auditFeedback;
        } catch (_) {}

        updateMasterState("approved", auditFeedback);
        log("👑 Master Supervisor: CAMPAIGN APPROVED ✓", "success");
        showToast("🎉 Multi-Agent Workflow complete!");
      } else {
        updateMasterState("approved", "Custom workflow pipeline completed successfully.");
        showToast("🎉 Workflow complete!");
      }

      // Update project status in localStorage
      if (activeProject?.id) {
        updateProjectStatus(activeProject.id, "complete");
      }

    } catch (err) {
      log(`Pipeline error: ${err.message}`, "error");
      updateMasterState("idle", "");
      showToast("Workflow encountered an error — check logs.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (genfyPollRef.current) clearInterval(genfyPollRef.current);
    setNodeStatus({});
    setNodeInputs({});
    setNodeOutputs({});
    updateMasterState("idle", "");
    setPendingApproval(null);
    setLogs([]);
    setIsRunning(false);
    try {
      localStorage.removeItem(`${stateStorageKey}-status`);
      localStorage.removeItem(`${stateStorageKey}-inputs`);
      localStorage.removeItem(`${stateStorageKey}-outputs`);
      localStorage.removeItem(`${stateStorageKey}-masterState`);
      localStorage.removeItem(`${stateStorageKey}-masterFeedback`);
    } catch (_) {}
  };


  const selectedNode = PIPELINE.find(n => n.id === selectedNodeId);
  const masterColors = {
    idle:       { bg: `linear-gradient(120deg, ${t.brain}14, ${t.brain}06)`, border: `${t.brain}33` },
    supervising:{ bg: "linear-gradient(120deg, rgba(234,179,8,0.14), rgba(245,158,11,0.04))", border: "rgba(234,179,8,0.4)" },
    approved:   { bg: "linear-gradient(120deg, rgba(34,197,94,0.12), rgba(16,185,129,0.04))", border: "rgba(34,197,94,0.4)" },
    rejected:   { bg: "linear-gradient(120deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))", border: "rgba(239,68,68,0.4)" },
  };
  const mc = masterColors[masterState] || masterColors.idle;

  const filteredHistory = historyItems.filter(item => {
    if (!historySearch.trim()) return true;
    const q = historySearch.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.brief || "").toLowerCase().includes(q) ||
      (item.assetType || "").toLowerCase().includes(q)
    );
  });

  if (viewMode === "history") {
    return (
      <div style={{ fontFamily: FONT, minHeight: "100vh", padding: "28px 32px 60px", maxWidth: 1200, margin: "0 auto" }}>
        {/* Top Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                background: `${t.brain}18`, color: t.brain, border: `1px solid ${t.brain}30`,
                letterSpacing: "0.08em", textTransform: "uppercase"
              }}>
                Autonomous Engine
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: t.text, margin: "6px 0 2px", letterSpacing: "-0.02em" }}>
              Workflow History
            </h1>
            <p style={{ fontSize: 13, color: t.text2, margin: 0 }}>
              Saved multi-agent campaign pipeline executions & visual assets
            </p>
          </div>

          <button
            onClick={() => {
              setActiveProject(null);
              updateActiveNodes([]);
              setSelectedNodeId(null);
              setRightSidebarMode("closed");
              setViewMode("canvas");
            }}
            style={{
              padding: "10px 22px", borderRadius: R.md, border: "none",
              background: "#000",
              color: "#fff", fontWeight: 800, fontSize: 13.5, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8, fontFamily: FONT,
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)", transition: "all 0.2s ease",
            }}
          >
            + New Workflow
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search workflow history by campaign brief or name..."
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: R.md,
              border: `1px solid ${t.border}`, background: t.surface,
              color: t.text, fontFamily: FONT, fontSize: 13, outline: "none"
            }}
          />
        </div>

        {/* History Cards Grid */}
        {filteredHistory.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px", borderRadius: R.xl,
            border: `1px dashed ${t.border}`, background: t.surface2
          }}>
            <Crown size={32} style={{ color: t.brain, margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, margin: "0 0 6px" }}>No workflow history found</h3>
            <p style={{ fontSize: 12.5, color: t.text2, margin: "0 0 16px" }}>Launch a new autonomous campaign pipeline to generate strategy, copy, and visuals.</p>
            <button
              onClick={() => {
                setActiveProject(null);
                updateActiveNodes([]);
                setSelectedNodeId(null);
                setRightSidebarMode("closed");
                setViewMode("canvas");
              }}
              style={{
                padding: "9px 20px", borderRadius: 8, border: "none", background: "#000",
                color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
              }}
            >
              + New Workflow
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.id) {
                    setActiveProject({
                      id: item.id,
                      name: item.name,
                      brief: item.brief,
                      assetType: item.assetType,
                      outputs: item.outputs,
                      nodeOutputs: item.outputs,
                      nodes: item.nodes
                    });
                    if (item.nodes && item.nodes.length) {
                      updateActiveNodes(item.nodes);
                      setSelectedNodeId(item.nodes[0]);
                      setRightSidebarMode("closed");
                    } else {
                      updateActiveNodes(PIPELINE.map(n => n.id));
                      setSelectedNodeId("brief");
                      setRightSidebarMode("closed");
                    }
                  }
                  setViewMode("canvas");
                }}
                style={{
                  borderRadius: R.lg, border: `1px solid ${t.border}`,
                  background: t.surface, padding: 14, cursor: "pointer",
                  transition: "all 0.2s ease", position: "relative",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  boxShadow: t.shadow
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.brain; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{
                      fontWeight: 800, fontSize: 13, color: t.text,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1
                    }}>
                      {item.name}
                    </div>
                    <span style={{
                      fontFamily: MONO, fontSize: 8.5, fontWeight: 700, padding: "2px 6px", borderRadius: 20,
                      background: item.status === "complete" ? "rgba(34,197,94,0.15)" : "rgba(245,158,27,0.18)",
                      color: item.status === "complete" ? "#22C55E" : "#F59E1B", flexShrink: 0
                    }}>
                      {item.status === "complete" ? "✓ DONE" : "RUNNING"}
                    </span>
                  </div>

                  {item.outputs?.genfy?.url && (
                    <div style={{ borderRadius: 6, overflow: "hidden", border: `1px solid ${t.border}`, maxHeight: 110, marginBottom: 8, background: "#0a0a0c" }}>
                      <img src={item.outputs.genfy.url} alt="Visual preview" style={{ width: "100%", height: 110, objectFit: "contain", display: "block" }} />
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: 10, borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: t.text3 }}>
                    {new Date(item.updatedAt || Date.now()).toLocaleDateString()}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      title="Delete Workflow"
                      style={{
                        background: "none", border: "none", padding: 4, cursor: "pointer",
                        color: t.text3, borderRadius: 4, display: "grid", placeItems: "center"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                      onMouseLeave={(e) => e.currentTarget.style.color = t.text3}
                    >
                      <Trash2 size={13} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: 11.5, color: t.brain, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      Open ▶
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="workflow-screen" style={{ fontFamily: FONT, minHeight: "100vh" }}>
      {/* ── Global thin transparent scrollbar for workflow nodes & sidebar ── */}
      <style>{`
        .workflow-screen *::-webkit-scrollbar,
        .node-card::-webkit-scrollbar,
        .node-data-box::-webkit-scrollbar,
        .thin-scrollbar::-webkit-scrollbar,
        .workflow-canvas *::-webkit-scrollbar,
        .workflow-screen textarea::-webkit-scrollbar,
        .workflow-screen pre::-webkit-scrollbar {
          width: 4px !important;
          height: 4px !important;
        }
        .workflow-screen *::-webkit-scrollbar-track,
        .node-card::-webkit-scrollbar-track,
        .node-data-box::-webkit-scrollbar-track,
        .thin-scrollbar::-webkit-scrollbar-track,
        .workflow-canvas *::-webkit-scrollbar-track,
        .workflow-screen textarea::-webkit-scrollbar-track,
        .workflow-screen pre::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .workflow-screen *::-webkit-scrollbar-thumb,
        .node-card::-webkit-scrollbar-thumb,
        .node-data-box::-webkit-scrollbar-thumb,
        .thin-scrollbar::-webkit-scrollbar-thumb,
        .workflow-canvas *::-webkit-scrollbar-thumb,
        .workflow-screen textarea::-webkit-scrollbar-thumb,
        .workflow-screen pre::-webkit-scrollbar-thumb {
          background: rgba(140, 140, 160, 0.22) !important;
          border-radius: 9999px !important;
        }
        .workflow-screen *::-webkit-scrollbar-thumb:hover,
        .node-card::-webkit-scrollbar-thumb:hover,
        .node-data-box::-webkit-scrollbar-thumb:hover,
        .thin-scrollbar::-webkit-scrollbar-thumb:hover,
        .workflow-canvas *::-webkit-scrollbar-thumb:hover,
        .workflow-screen textarea::-webkit-scrollbar-thumb:hover,
        .workflow-screen pre::-webkit-scrollbar-thumb:hover {
          background: rgba(140, 140, 160, 0.5) !important;
        }
      `}</style>

      {/* ── Master Supervisor Banner with Inline Back Navigation ─────────── */}
      <div style={{
        margin: "0",
        padding: "12px 24px",
        background: mc.bg,
        borderBottom: `1px solid ${mc.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        transition: "all .4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => nav(activeProject?.storyboard_card ? "storyboard" : "projects", activeProject)}
            title="Back"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: FONT, fontSize: 12, fontWeight: 700,
              color: t.text, background: t.surface, border: `1px solid ${t.borderStrong}`,
              padding: "5px 12px", borderRadius: R.md, cursor: "pointer",
              transition: "all .15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.borderStrong; }}
          >
            <ArrowLeft size={13} />
            {activeProject?.storyboard_card ? "Back to Storyboard" : "Back to Projects"}
          </button>

          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(145deg, ${t.brain}, ${t.brain2})`,
            display: "grid", placeItems: "center",
            boxShadow: `0 4px 14px ${t.brain}55`,
          }}>
            <Crown size={17} color="#fff" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <b style={{ fontSize: 13.5, color: t.text }}>Master Workflow Supervisor Agent</b>
              <span style={{
                fontFamily: MONO, fontSize: 9.5, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                background: masterState === "approved" ? "rgba(34,197,94,0.2)" : masterState === "supervising" ? "rgba(245,158,27,0.2)" : `${t.brain}22`,
                color: masterState === "approved" ? "#22C55E" : masterState === "supervising" ? "#F59E1B" : t.brain,
              }}>
                {masterState === "approved" ? "✓ APPROVED" : masterState === "supervising" ? "SUPERVISING..." : "READY"}
              </span>
              {activeProject?.storyboard_card && (
                <span style={{
                  fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase",
                  background: t.brain, color: "#fff", padding: "2px 8px", borderRadius: 20,
                }}>
                  📌 {activeProject.storyboard_card.channel} · {activeProject.storyboard_card.format}
                </span>
              )}
            </div>
            {masterFeedback && (
              <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 2 }}>
                {masterFeedback}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {activeProject?.storyboard_card && (
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.brainText, fontWeight: 600 }}>
              Context Pre-Loaded ✓
            </span>
          )}
          <Btn t={t} kind="secondary" small onClick={() => setViewMode("history")} icon={Clock}>Workflow History</Btn>
        </div>
      </div>

      {/* ── Two-column body ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* ── LEFT: Canvas ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, padding: "24px 28px 40px" }}>

          {/* Canvas header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: t.text }}>
                {activeProject ? activeProject.name : "Multi-Agent Campaign Pipeline"}
              </div>
              {aiDesigned && aiWorkflowName && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 9.5, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                    background: `${t.brain}18`, color: t.brain, border: `1px solid ${t.brain}30`,
                  }}>
                    🧠 AI CONFIGURED
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{aiWorkflowName}</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                fontSize: 12, fontWeight: 600, color: t.text2, cursor: "pointer",
                background: t.surface2, padding: "6px 12px", borderRadius: 8,
                border: `1px solid ${t.border}`, fontFamily: FONT,
              }}>
                <input
                  type="checkbox"
                  checked={approvalMode}
                  onChange={(e) => setApprovalMode(e.target.checked)}
                  disabled={isRunning}
                  style={{ accentColor: t.brain }}
                />
                Step-by-Step Approval
              </label>

              <button
                onClick={() => setRightSidebarMode(prev => prev === "nodes" ? "closed" : "nodes")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: 8,
                  border: `1px solid ${rightSidebarMode === "nodes" ? t.brain : t.borderStrong}`,
                  background: rightSidebarMode === "nodes" ? `${t.brain}15` : t.surface2,
                  color: rightSidebarMode === "nodes" ? t.brain : t.text,
                  fontFamily: FONT, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.brain; e.currentTarget.style.background = t.surface3; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = rightSidebarMode === "nodes" ? t.brain : t.borderStrong;
                  e.currentTarget.style.background = rightSidebarMode === "nodes" ? `${t.brain}15` : t.surface2;
                }}
              >
                <Plus size={14} color={t.brain} />
                Add Node
              </button>

              {(isRunning || Object.keys(nodeStatus).length > 0) && (
                <Btn t={t} kind="secondary" small icon={RotateCcw} onClick={handleReset} disabled={isRunning}>
                  Reset
                </Btn>
              )}

              {pendingApproval ? (
                <button
                  onClick={handleApproveStep}
                  style={{
                    padding: "9px 20px", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #22C55E, #16A34A)",
                    color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8, fontFamily: FONT,
                    boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
                  }}
                >
                  <CheckCircle size={16} />
                  Approve & Proceed ▶
                </button>
              ) : (
                <Btn t={t} kind="accent" loading={isRunning} icon={Play} onClick={handleRun} disabled={isRunning}
                  style={{ minWidth: 160, justifyContent: "center" }}>
                  {isRunning ? "Running Pipeline..." : "▶  Launch Workflow"}
                </Btn>
              )}
            </div>
          </div>

          {/* Status strip when waiting for step approval */}
          {pendingApproval && (
            <div style={{
              marginBottom: 16, padding: "8px 14px", borderRadius: 8,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
              color: "#16A34A", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8
            }}>
              <CheckCircle size={15} color="#22C55E" />
              <span><b>{PIPELINE.find(n => n.id === pendingApproval.nodeId)?.label}</b> output ready for review — click <b>Approve & Proceed ▶</b> to continue.</span>
            </div>
          )}

          {/* AI reasoning card (only if AI designed the workflow) */}
          {aiDesigned && aiReasoning && (
            <div style={{
              marginBottom: 16, padding: "11px 15px", borderRadius: R.md,
              background: `linear-gradient(135deg, ${t.brain}10, ${t.brain}04)`,
              border: `1px solid ${t.brain}28`,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🧠</span>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: t.brain, letterSpacing: "0.06em", marginBottom: 3 }}>
                  AI WORKFLOW DESIGNER · ANALYSIS
                </div>
                <div style={{ fontSize: 12, color: t.text2, lineHeight: 1.55 }}>{aiReasoning}</div>
                {aiInferred && (
                  <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                    {aiInferred.industry && <Tag t={t} label="Industry" value={aiInferred.industry} />}
                    {aiInferred.brand_tone && <Tag t={t} label="Tone" value={aiInferred.brand_tone} />}
                    {aiInferred.visual_style && <Tag t={t} label="Visual" value={aiInferred.visual_style} />}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Canvas dot-grid background + pipeline nodes */}
          <div style={{
            borderRadius: R.xl,
            border: `1px solid ${t.border}`,
            background: t.surface,
            padding: "28px 24px",
            position: "relative",
            minHeight: 460,
            backgroundImage: `radial-gradient(circle, ${t.borderStrong}55 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}>
            {currentPipeline.length === 0 ? (
              /* n8n-style Empty Canvas */
              <div style={{
                padding: "48px 20px 40px",
                textAlign: "center",
                maxWidth: 560,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}>
                <button
                  onClick={() => setRightSidebarMode("nodes")}
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: `${t.brain}18`, border: `2px dashed ${t.brain}88`,
                    display: "grid", placeItems: "center", marginBottom: 18,
                    color: t.brain, cursor: "pointer", transition: "all 0.2s ease",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.06)"; e.currentTarget.style.borderColor = t.brain; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = `${t.brain}88`; }}
                  title="Add node"
                >
                  <Plus size={30} />
                </button>

                <h3 style={{ fontSize: 19, fontWeight: 800, color: t.text, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                  Empty Workflow Canvas
                </h3>
                <p style={{ fontSize: 13, color: t.text2, margin: "0 0 20px", maxWidth: 420, lineHeight: 1.5 }}>
                  Build your autonomous workflow step-by-step from the node library on the right, or pick a predefined pipeline below.
                </p>

                <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                  <button
                    onClick={() => setRightSidebarMode("nodes")}
                    style={{
                      padding: "10px 22px", borderRadius: R.md, border: "none",
                      background: "#000", color: "#fff", fontWeight: 700, fontSize: 13,
                      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
                      fontFamily: FONT, boxShadow: "0 4px 14px rgba(0,0,0,0.25)"
                    }}
                  >
                    <Plus size={16} />
                    Add Node
                  </button>
                </div>

                {/* Predefined Workflows Quick Grid */}
                <div style={{ width: "100%", borderTop: `1px dashed ${t.border}`, paddingTop: 20, textAlign: "left" }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700, color: t.text3,
                    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, textAlign: "center"
                  }}>
                    Or Start With a Predefined Workflow
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                    {PREDEFINED_WORKFLOWS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => loadPredefinedWorkflow(preset)}
                        style={{
                          padding: "12px 14px", borderRadius: R.md,
                          border: `1px solid ${t.border}`, background: t.surface2,
                          cursor: "pointer", transition: "all 0.18s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.brain; e.currentTarget.style.background = t.surface3; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface2; }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12.5, color: t.text }}>{preset.name}</span>
                          <span style={{ fontFamily: MONO, fontSize: 9, color: t.brain, background: `${t.brain}15`, padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                            {preset.badge.split(" · ")[0]}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: t.text3, lineHeight: 1.4 }}>{preset.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Pipeline label */}
                <div style={{ textAlign: "center", marginBottom: 20, display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700, color: t.brain, letterSpacing: "0.1em",
                    background: `${t.brain}12`, padding: "4px 14px", borderRadius: 20, border: `1px solid ${t.brain}30`,
                  }}>
                    AGENT PIPELINE · {currentPipeline.length} {currentPipeline.length === 1 ? "NODE" : "NODES"}
                  </span>
                  <button
                    onClick={() => {
                      updateActiveNodes([]);
                      setSelectedNodeId(null);
                      setRightSidebarMode("closed");
                    }}
                    style={{
                      background: "transparent", border: "none", color: t.text3,
                      fontSize: 11, fontFamily: MONO, cursor: "pointer", padding: "2px 6px",
                      borderRadius: 4, textDecoration: "underline"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                    onMouseLeave={(e) => e.currentTarget.style.color = t.text3}
                  >
                    Clear Flow
                  </button>
                </div>

                {/* Nodes + connectors */}
                <div style={{ maxWidth: 540, margin: "0 auto" }}>
                  {currentPipeline.map((node, i) => {
                    const prevNode = i > 0 ? currentPipeline[i - 1] : null;
                    const isPrevDone = prevNode ? nodeStatus[prevNode.id] === "done" : true;
                    const canRunThisStep = isPrevDone && (nodeStatus[node.id] === "idle" || !nodeOutputs[node.id]);
                    const nextNode = i < currentPipeline.length - 1 ? currentPipeline[i + 1] : null;
                    const nextStepId = nextNode?.id || null;
                    const nextStepLabel = nextNode?.label || null;

                    return (
                      <div key={node.id}>
                        <NodeCard
                          node={node}
                          config={configs[node.id]}
                          status={nodeStatus[node.id] || "idle"}
                          output={nodeOutputs[node.id] || null}
                          isSelected={selectedNodeId === node.id}
                          onSelect={(id) => {
                            setSelectedNodeId(id);
                            setRightSidebarMode("config");
                          }}
                          onUpdateOutput={setOutput}
                          onRunFromNode={handleRun}
                          onPreviewImage={(url) => setImageModalUrl(url)}
                          onRemove={() => handleRemoveNode(node.id)}
                          canRunThisStep={canRunThisStep}
                          nextStepId={nextStepId}
                          nextStepLabel={nextStepLabel}
                          t={t}
                        />
                        {i < currentPipeline.length - 1 && (
                          <Connector
                            color={currentPipeline[i + 1].color}
                            active={nodeStatus[node.id] === "done" && (nodeStatus[currentPipeline[i+1].id] === "active" || nodeStatus[currentPipeline[i+1].id] === "done")}
                            done={nodeStatus[currentPipeline[i+1].id] === "done"}
                            ready={nodeStatus[node.id] === "done" && nodeStatus[currentPipeline[i+1].id] === "idle"}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Add Next Step Inline Button */}
                  <div style={{ textAlign: "center", marginTop: 14 }}>
                    <button
                      onClick={() => setRightSidebarMode("nodes")}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "7px 16px", borderRadius: R.pill,
                        border: `1px dashed ${t.borderStrong}`, background: t.surface2,
                        color: t.text2, fontSize: 11.5, fontFamily: MONO, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.brain; e.currentTarget.style.color = t.text; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.borderStrong; e.currentTarget.style.color = t.text2; }}
                    >
                      <Plus size={13} /> Add Next Step
                    </button>
                  </div>
                </div>

                {/* Final output card */}
                {nodeOutputs["genfy"] && (
                  <div style={{
                    marginTop: 28, padding: "16px 18px", borderRadius: R.lg,
                    background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))",
                    border: "1px solid rgba(34,197,94,0.3)",
                    textAlign: "center",
                  }}>
                    <CheckCircle size={22} color="#22C55E" style={{ margin: "0 auto 8px" }} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Pipeline Complete</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 4 }}>
                      All pipeline nodes executed successfully · Master Supervisor approved
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: Node Options & Config Panel (sticky) ───────────────────── */}
        {rightSidebarMode !== "closed" && (
          <aside className="thin-scrollbar" style={{
            width: 330, flexShrink: 0,
            borderLeft: `1px solid ${t.border}`,
            position: "sticky", top: 0, alignSelf: "flex-start",
            maxHeight: "calc(100vh - 56px)", overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(140, 140, 160, 0.22) transparent",
            background: t.surface2,
            boxShadow: "-4px 0 20px rgba(0,0,0,0.03)",
            display: "flex", flexDirection: "column"
          }}>
            {/* Dedicated Top Header with Close Button */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderBottom: `1px solid ${t.border}`,
              background: t.surface, position: "sticky", top: 0, zIndex: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {rightSidebarMode === "nodes" ? (
                  <>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: `${t.brain}18`, display: "grid", placeItems: "center"
                    }}>
                      <Plus size={14} color={t.brain} />
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: t.text, letterSpacing: "0.04em" }}>
                        ADD NODES
                      </div>
                      <div style={{ fontSize: 10.5, color: t.text3 }}>Node Library</div>
                    </div>
                  </>
                ) : (
                  <>
                    {selectedNode ? (
                      <NodeIconBadge node={selectedNode} isAgent={selectedNode.type === "agent"} containerSize={26} radius={6} size={13} />
                    ) : (
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: `${t.brain}18`, display: "grid", placeItems: "center"
                      }}>
                        <Settings size={13} color={t.brain} />
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: MONO, fontSize: 11, fontWeight: 800, color: t.text,
                        letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150
                      }}>
                        {selectedNode ? selectedNode.label : "CONFIGURATION"}
                      </div>
                      <div style={{ fontSize: 10.5, color: t.text3 }}>Node Settings</div>
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {rightSidebarMode === "config" && (
                  <button
                    onClick={() => setRightSidebarMode("nodes")}
                    title="Add more nodes"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 8px", borderRadius: 6, border: `1px solid ${t.border}`,
                      background: t.surface2, color: t.text2, fontSize: 10.5, fontFamily: MONO,
                      fontWeight: 600, cursor: "pointer"
                    }}
                  >
                    <Plus size={11} /> Add Node
                  </button>
                )}
                <button
                  onClick={() => setRightSidebarMode("closed")}
                  title="Close sidebar"
                  style={{
                    width: 26, height: 26, borderRadius: 6, border: `1px solid ${t.border}`,
                    background: t.surface2, color: t.text2, display: "grid", placeItems: "center",
                    cursor: "pointer", transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = t.surface3; e.currentTarget.style.color = t.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = t.surface2; e.currentTarget.style.color = t.text2; }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Sidebar Content: Add Nodes vs Node Config */}
            {rightSidebarMode === "nodes" ? (
              <div style={{ padding: "16px 14px", fontFamily: FONT }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: t.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                    Available Nodes
                  </div>
                  <div style={{ fontSize: 11.5, color: t.text2 }}>
                    Click a node to add it to your pipeline
                  </div>
                </div>

                {/* Node Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {PIPELINE.map((pNode) => {
                    const isAdded = activeNodes.includes(pNode.id);
                    const Icon = pNode.icon;
                    return (
                      <div
                        key={pNode.id}
                        onClick={() => handleAddNode(pNode.id)}
                        style={{
                          padding: "10px 12px", borderRadius: R.md,
                          border: `1px solid ${isAdded ? pNode.color + "55" : t.border}`,
                          background: isAdded ? `${pNode.color}0A` : t.surface,
                          cursor: "pointer", transition: "all 0.18s ease",
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                          boxShadow: isAdded ? `0 2px 8px ${pNode.color}15` : "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = pNode.color;
                          e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = isAdded ? pNode.color + "55" : t.border;
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                          <NodeIconBadge node={pNode} isAgent={pNode.type === "agent"} containerSize={28} radius={7} size={14} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {pNode.label}
                            </div>
                            <div style={{ fontFamily: MONO, fontSize: 9.5, color: t.text3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {pNode.subtitle.split(" · ")[0]}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNode(pNode.id);
                          }}
                          style={{
                            padding: "4px 8px", borderRadius: 6, border: "none",
                            background: isAdded ? `${pNode.color}22` : "#000",
                            color: isAdded ? pNode.color : "#fff",
                            fontSize: 10.5, fontWeight: 700, fontFamily: MONO,
                            cursor: "pointer", flexShrink: 0
                          }}
                        >
                          {isAdded ? "✓ Added" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Predefined Workflows Section */}
                <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
                  <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: t.text3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                    Predefined Workflows
                  </div>
                  <div style={{ fontSize: 11.5, color: t.text2, marginBottom: 10 }}>
                    Load ready-to-run multi-agent templates
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {PREDEFINED_WORKFLOWS.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => loadPredefinedWorkflow(preset)}
                        style={{
                          padding: "9px 11px", borderRadius: R.md,
                          border: `1px solid ${t.border}`, background: t.surface,
                          cursor: "pointer", transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.brain; e.currentTarget.style.background = t.surface3; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <div style={{ fontWeight: 700, fontSize: 11.5, color: t.text }}>{preset.name}</div>
                          <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: t.brain, background: `${t.brain}15`, padding: "1px 5px", borderRadius: 4 }}>
                            {preset.badge.split(" · ")[0]}
                          </span>
                        </div>
                        <div style={{ fontSize: 10.5, color: t.text3, lineHeight: 1.35 }}>
                          {preset.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <ConfigPanel
                node={selectedNode}
                config={configs[selectedNodeId] || {}}
                onChange={(field, value) => updateConfig(selectedNodeId, field, value)}
                onUpdateInput={(nodeId, newInput) => setInput(nodeId, newInput)}
                t={t}
                inputs={nodeInputs}
                outputs={nodeOutputs}
                status={nodeStatus[selectedNodeId]}
                pendingApproval={pendingApproval}
                onApproveStep={handleApproveStep}
              />
            )}
          </aside>
        )}
      </div>



      {/* Spinner animation & Rich Markdown Output Styling */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .rich-copy-output p {
          margin: 0 0 8px 0;
          line-height: 1.6;
        }
        .rich-copy-output p:last-child {
          margin-bottom: 0;
        }
        .rich-copy-output strong, .rich-copy-output b {
          font-weight: 750;
          color: inherit;
        }
        .rich-copy-output h1, .rich-copy-output h2, .rich-copy-output h3, .rich-copy-output h4 {
          font-weight: 800;
          margin: 10px 0 4px 0;
          font-size: 13px;
          color: inherit;
        }
        .rich-copy-output ul, .rich-copy-output ol {
          margin: 6px 0 8px 18px;
          padding: 0;
        }
        .rich-copy-output li {
          margin-bottom: 4px;
          line-height: 1.5;
        }
      `}</style>

      {/* ── Pure Full Resolution Image Preview Lightbox (Image only + Top-Right Cross Button) ── */}
      {imageModalUrl && (
        <div
          onClick={() => setImageModalUrl(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "rgba(0, 0, 0, 0.94)", backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, cursor: "zoom-out",
          }}
        >
          {/* Top-Right Cross Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImageModalUrl(null);
            }}
            title="Close Preview (Esc)"
            style={{
              position: "fixed", top: 20, right: 20,
              width: 42, height: 42, borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              background: "rgba(20, 20, 24, 0.8)", backdropFilter: "blur(8px)",
              color: "#ffffff", cursor: "pointer", display: "grid", placeItems: "center",
              zIndex: 100000, boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.9)";
              e.currentTarget.style.borderColor = "#ef4444";
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(20, 20, 24, 0.8)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <X size={20} strokeWidth={2.2} />
          </button>

          {/* Full Resolution Image (Pure Image Only) */}
          <img
            src={imageModalUrl}
            alt="Full Resolution Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw", maxHeight: "92vh",
              width: "auto", height: "auto",
              objectFit: "contain", display: "block",
              borderRadius: 12,
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.12)",
              cursor: "default", userSelect: "none",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function cleanRawJson(text) {
  if (!text || typeof text !== "string") return text || "";
  let str = text.trim();
  str = str.replace(/```json/gi, "").replace(/```/g, "").trim();

  // Handle case where text contains raw JSON object syntax anywhere in the string
  if (str.includes("{") && str.includes("}")) {
    try {
      const jsonStart = str.indexOf("{");
      const jsonEnd = str.lastIndexOf("}") + 1;
      const jsonSub = str.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonSub);
      if (parsed.bodyText) return cleanRawJson(parsed.bodyText);
      if (parsed.content) return cleanRawJson(parsed.content);
      if (parsed.headline && parsed.bodyText) return `${parsed.headline}\n\n${parsed.bodyText}`;
    } catch (_) {}
  }
  return str;
}

function extractHeadline(rawText, assetType) {
  const text = cleanRawJson(rawText);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (l.length > 10 && l.length < 80 && !l.startsWith("-") && !l.startsWith("*") && !l.startsWith("{") && !l.includes('":')) return l;
  }
  return `${assetType} Campaign`;
}

function updateProjectStatus(projectId, status) {
  try {
    const projects = JSON.parse(localStorage.getItem("studio-projects") || "[]");
    const updated = projects.map(p => p.id === projectId ? { ...p, status } : p);
    localStorage.setItem("studio-projects", JSON.stringify(updated));
  } catch (_) {}
}
