import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Sparkles, RefreshCw, CheckCircle2, Plus, Play,
  GripVertical, Edit3, Instagram, Mail, Linkedin, TrendingUp,
  Star, ChevronRight, Loader2, X, Check, MessageSquare,
  Image as ImageIcon, PenLine, Target, Wand2, Zap, BarChart2,
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Btn, Card } from "../components/primitives/index.jsx";

// ── Constants ──────────────────────────────────────────────────────────────────

const CHANNELS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#E1306C" },
  { id: "email",     label: "Email",     icon: Mail,      color: "#2E6BE6" },
  { id: "linkedin",  label: "LinkedIn",  icon: Linkedin,  color: "#0A66C2" },
  { id: "paid",      label: "Paid Ads",  icon: TrendingUp, color: "#2FA36B" },
];

const CARD_STATUS_CONFIG = {
  not_started: { label: "Not started",  bg: null,               color: null,     dot: "#94a3b8" },
  in_progress:  { label: "In progress", bg: "rgba(232,133,12,.10)", color: "#E8850C", dot: "#E8850C" },
  complete:     { label: "Complete",    bg: "rgba(30,127,79,.10)",  color: "#1E7F4F", dot: "#1E7F4F" },
  approved:     { label: "Approved",    bg: "rgba(30,127,79,.15)",  color: "#1E7F4F", dot: "#1E7F4F" },
};

const TOOL_COLORS = {
  strategy: "#2FA36B",
  copy:     "#2E6BE6",
  genfy:    "#E8552A",
  edit:     "#B84FD8",
  deck:     "#DE9B18",
  leads:    "#E0447A",
  hr:       "#12A0A0",
};

const TOOL_ICONS = {
  strategy: Target,
  copy:     PenLine,
  genfy:    ImageIcon,
  edit:     Wand2,
  deck:     BarChart2,
};

const GENERATION_PHASES = [
  "✦  Reading brand DNA…",
  "◈  Mapping campaign channels…",
  "▦  Composing storyboard…",
  "✓  Storyboard ready",
];

// ── Helper: Editable field ─────────────────────────────────────────────────────

function EditableField({ t, label, value, onChange, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const ref = useRef(null);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onChange(draft.trim());
  };

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: t.text3, marginBottom: 4 }}>
        {label}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            ref={ref}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === "Escape" && (setDraft(value), setEditing(false))}
            rows={3}
            style={{
              width: "100%", padding: "6px 8px", fontFamily: FONT, fontSize: 12.5,
              color: t.text, background: t.surface2, border: `1px solid ${t.accent}`,
              outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5,
            }}
          />
        ) : (
          <input
            ref={ref}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
            style={{
              width: "100%", padding: "6px 8px", fontFamily: FONT, fontSize: 12.5,
              color: t.text, background: t.surface2, border: `1px solid ${t.accent}`,
              outline: "none", boxSizing: "border-box",
            }}
          />
        )
      ) : (
        <div
          onClick={() => { setDraft(value); setEditing(true); }}
          title="Click to edit"
          style={{
            fontFamily: FONT, fontSize: 12.5, color: value ? t.text2 : t.text3,
            lineHeight: 1.5, cursor: "text", padding: "4px 0",
            borderBottom: `1px dashed ${t.border}`,
            fontStyle: value ? "normal" : "italic",
          }}
        >
          {value || "Click to add…"}
          <Edit3 size={10} style={{ marginLeft: 6, opacity: 0.4, verticalAlign: "middle" }} />
        </div>
      )}
    </div>
  );
}

// ── Storyboard Card ────────────────────────────────────────────────────────────

function StoryboardCard({ t, card, channelId, onUpdate, onStart, onDelete, dragHandleProps }) {
  const cfg = CARD_STATUS_CONFIG[card.status] || CARD_STATUS_CONFIG.not_started;
  const isHero = card.priority === "hero";

  const update = (field, val) => onUpdate(card.id, { ...card, [field]: val });

  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${card.status === "approved" ? t.success : card.status === "in_progress" ? t.accent : t.border}`,
        borderLeft: card.status === "in_progress" ? `3px solid ${t.accent}` : card.status === "approved" ? `3px solid ${t.success}` : `1px solid ${t.border}`,
        boxShadow: card.status === "in_progress" ? `0 0 0 2px ${t.accentSoft}` : "none",
        transition: "all .2s",
        position: "relative",
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 8px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {/* Drag handle */}
          <div {...dragHandleProps} style={{ cursor: "grab", color: t.text3, display: "flex", alignItems: "center" }}>
            <GripVertical size={13} />
          </div>
          {isHero && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 9, color: "#DE9B18", background: "rgba(222,155,24,.12)", border: "1px solid rgba(222,155,24,.3)", padding: "2px 7px" }}>
              <Star size={8} fill="#DE9B18" /> HERO
            </span>
          )}
          <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: t.text }}>{card.format}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {cfg.dot && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9.5, color: cfg.color || t.text3 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
              {cfg.label}
            </span>
          )}
          <button onClick={() => onDelete(card.id)} style={{ background: "none", border: "none", color: t.text3, cursor: "pointer", display: "flex", padding: 2 }}>
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "12px 12px 0" }}>
        <EditableField t={t} label="Hook" value={card.hook} onChange={v => update("hook", v)} multiline />
        <EditableField t={t} label="Copy Angle" value={card.copy_angle} onChange={v => update("copy_angle", v)} />
        <EditableField t={t} label="Visual Direction" value={card.visual_direction} onChange={v => update("visual_direction", v)} multiline />
      </div>

      {/* Tool sequence */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${t.border}`, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {(card.tool_sequence || []).map((toolId, i) => {
            const ToolIcon = TOOL_ICONS[toolId] || Zap;
            const hue = TOOL_COLORS[toolId] || "#888";
            return (
              <div key={toolId} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <ChevronRight size={10} style={{ color: t.text3 }} />}
                <div title={toolId} style={{ width: 22, height: 22, borderRadius: 5, background: `${hue}18`, color: hue, border: `1px solid ${hue}35`, display: "grid", placeItems: "center" }}>
                  <ToolIcon size={11} />
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => onStart(card)}
          disabled={card.status === "approved"}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
            background: card.status === "complete" || card.status === "approved" ? t.successSoft : t.text,
            color: card.status === "complete" || card.status === "approved" ? t.success : t.bg,
            border: "none", padding: "5px 10px", cursor: card.status === "approved" ? "default" : "pointer",
            transition: "all .15s",
          }}
        >
          {card.status === "complete" || card.status === "approved" ? <Check size={11} /> : <Play size={10} fill="currentColor" />}
          {card.status === "approved" ? "Approved" : card.status === "complete" ? "Redo" : "Start"}
        </button>
      </div>
    </div>
  );
}

// ── Add Card modal (inline) ────────────────────────────────────────────────────

function AddCardModal({ t, channelId, onAdd, onClose }) {
  const FORMATS = {
    instagram: ["Carousel Post", "Single Image", "Reel", "Story Ad (9:16)"],
    email:     ["Launch Announce", "Follow-up", "Nurture", "Re-engagement"],
    linkedin:  ["Thought Leadership", "Product Post", "Case Study", "Team Story"],
    paid:      ["Banner Ad", "Video Ad", "Responsive Display", "Lead Form Ad"],
  };
  const TOOLS = ["strategy", "copy", "genfy", "edit"];
  const [format, setFormat] = useState(FORMATS[channelId]?.[0] || "Custom");
  const [hook, setHook] = useState("");
  const [sequence, setSequence] = useState(["copy", "genfy"]);

  const toggleTool = (id) => setSequence(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  return (
    <div style={{ background: t.surface2, border: `1px solid ${t.border}`, padding: 16, marginTop: 10 }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 12 }}>Add Card</div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontFamily: MONO, fontSize: 10, color: t.text3, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".1em" }}>Format</label>
        <select value={format} onChange={e => setFormat(e.target.value)} style={{ width: "100%", padding: "7px 10px", background: t.surface, border: `1px solid ${t.borderStrong}`, color: t.text, fontFamily: FONT, fontSize: 12.5, outline: "none" }}>
          {(FORMATS[channelId] || ["Custom"]).map(f => <option key={f}>{f}</option>)}
          <option>Custom</option>
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontFamily: MONO, fontSize: 10, color: t.text3, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".1em" }}>Hook (optional)</label>
        <input value={hook} onChange={e => setHook(e.target.value)} placeholder="What's the opening idea?" style={{ width: "100%", padding: "7px 10px", background: t.surface, border: `1px solid ${t.borderStrong}`, color: t.text, fontFamily: FONT, fontSize: 12.5, outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontFamily: MONO, fontSize: 10, color: t.text3, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".1em" }}>Tool Sequence</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TOOLS.map(id => {
            const hue = TOOL_COLORS[id] || "#888";
            const active = sequence.includes(id);
            return (
              <button key={id} onClick={() => toggleTool(id)} style={{ fontFamily: MONO, fontSize: 10.5, padding: "4px 10px", border: `1px solid ${active ? hue : t.border}`, background: active ? `${hue}18` : t.surface, color: active ? hue : t.text3, cursor: "pointer" }}>
                {id}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn t={t} kind="dark" small onClick={() => onAdd({ format, hook, tool_sequence: sequence })} style={{ flex: 1 }}>Add Card</Btn>
        <Btn t={t} kind="secondary" small onClick={onClose}>Cancel</Btn>
      </div>
    </div>
  );
}

// ── Main: StoryboardScreen ─────────────────────────────────────────────────────

export default function StoryboardScreen({ t, nav, showToast, activeProject }) {
  const [storyboard, setStoryboard]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [generating, setGenerating]   = useState(false);
  const [genPhase, setGenPhase]       = useState(0);
  const [activeChannel, setActiveChannel] = useState("instagram");
  const [showAddCard, setShowAddCard] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [approving, setApproving]     = useState(false);
  const phaseTimer = useRef(null);

  const project = activeProject;

  // ── Load or generate storyboard on mount ──
  useEffect(() => {
    if (!project?.id) {
      setLoading(false);
      return;
    }
    fetch(`/bff/projects/${project.id}/storyboard`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.channels) {
          setStoryboard(data);
          setLoading(false);
        } else {
          // No storyboard yet — generate one
          generateStoryboard();
        }
      })
      .catch(() => generateStoryboard());
  }, [project?.id]);

  // ── Animated phase ticker ──
  const runPhaseAnimation = useCallback(() => {
    let phase = 0;
    setGenPhase(0);
    phaseTimer.current = setInterval(() => {
      phase += 1;
      if (phase >= GENERATION_PHASES.length - 1) {
        clearInterval(phaseTimer.current);
      }
      setGenPhase(phase);
    }, 1800);
  }, []);

  const generateStoryboard = useCallback(async () => {
    if (!project?.id) return;
    setGenerating(true);
    setLoading(false);
    runPhaseAnimation();

    try {
      const res = await fetch(`/bff/projects/${project.id}/storyboard/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: project.brief || "",
          brand_name: project.brand_name || project.brandName || "",
          campaign_name: project.name || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        clearInterval(phaseTimer.current);
        setGenPhase(GENERATION_PHASES.length - 1);
        await new Promise(r => setTimeout(r, 600));
        setStoryboard(data);
        setGenerating(false);
        // Set first channel with cards as active
        if (data.channels?.[0]) setActiveChannel(data.channels[0].id);
      } else {
        throw new Error("Generation failed");
      }
    } catch (err) {
      clearInterval(phaseTimer.current);
      setGenerating(false);
      showToast("Could not generate storyboard — using starter template");
      // Fallback starter storyboard
      setStoryboard(makeStarterStoryboard(project));
    }
  }, [project, runPhaseAnimation, showToast]);

  // ── Persist storyboard changes ──
  const saveStoryboard = useCallback(async (updated) => {
    if (!project?.id) return;
    setSaving(true);
    try {
      await fetch(`/bff/projects/${project.id}/storyboard`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (_) {}
    setSaving(false);
  }, [project?.id]);

  // ── Card CRUD ──
  const channelCards = storyboard?.channels?.find(c => c.id === activeChannel)?.cards || [];

  const updateCard = (cardId, updated) => {
    const next = {
      ...storyboard,
      channels: storyboard.channels.map(ch => ({
        ...ch,
        cards: ch.cards.map(c => c.id === cardId ? updated : c),
      })),
    };
    setStoryboard(next);
    saveStoryboard(next);
  };

  const deleteCard = (cardId) => {
    const next = {
      ...storyboard,
      channels: storyboard.channels.map(ch => ({
        ...ch,
        cards: ch.cards.filter(c => c.id !== cardId),
      })),
    };
    setStoryboard(next);
    saveStoryboard(next);
    showToast("Card removed");
  };

  const addCard = ({ format, hook, tool_sequence }) => {
    const newCard = {
      id: `card-${Date.now()}`,
      format,
      hook,
      copy_angle: "",
      visual_direction: "",
      tool_sequence,
      priority: "supporting",
      status: "not_started",
    };
    const next = {
      ...storyboard,
      channels: storyboard.channels.map(ch =>
        ch.id === activeChannel ? { ...ch, cards: [...ch.cards, newCard] } : ch
      ),
    };
    setStoryboard(next);
    saveStoryboard(next);
    setShowAddCard(false);
    showToast("Card added to storyboard");
  };

  const startCard = (card) => {
    const enrichedProject = {
      ...project,
      storyboard_card: {
        card_id: card.id,
        channel: activeChannel,
        format: card.format,
        hook: card.hook,
        copy_angle: card.copy_angle,
        visual_direction: card.visual_direction,
        tool_sequence: card.tool_sequence,
      },
    };
    // Update card to in_progress
    updateCard(card.id, { ...card, status: "in_progress" });
    // Navigate to workflow
    nav("workflow", enrichedProject);
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await fetch(`/bff/projects/${project.id}/storyboard/approve`, {
        method: "POST", credentials: "include",
      });
      showToast("✓ Storyboard approved — production begins");
      nav("projects");
    } catch (_) {
      showToast("Failed to approve storyboard");
    }
    setApproving(false);
  };

  const totalCards = storyboard?.channels?.reduce((sum, ch) => sum + ch.cards.length, 0) || 0;
  const completeCards = storyboard?.channels?.reduce((sum, ch) => sum + ch.cards.filter(c => c.status === "complete" || c.status === "approved").length, 0) || 0;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader2 size={24} style={{ color: t.text3, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // ── Generating state ──
  if (generating) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "80px 40px", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`, display: "grid", placeItems: "center", margin: "0 auto 28px", boxShadow: `0 16px 40px -10px ${t.brain}88` }}>
          <Sparkles size={28} color="#fff" style={{ animation: "spin 3s linear infinite" }} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".14em", textTransform: "uppercase", color: t.text3, marginBottom: 16 }}>
          AI Campaign Storyboarding
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: t.text, letterSpacing: "-.02em", marginBottom: 24 }}>
          {project?.name || "Building your campaign"}
        </div>

        {/* Animated phase steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 32 }}>
          {GENERATION_PHASES.map((phase, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: i <= genPhase ? 1 : 0.3, transition: "opacity .4s" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: i < genPhase ? t.success : i === genPhase ? t.accent : t.surface2, border: `1px solid ${i <= genPhase ? "transparent" : t.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                {i < genPhase ? <Check size={10} color="#fff" /> : i === genPhase ? <Loader2 size={10} color="#fff" style={{ animation: "spin 1s linear infinite" }} /> : null}
              </span>
              <span style={{ fontFamily: FONT, fontSize: 13.5, color: i <= genPhase ? t.text : t.text3, fontWeight: i === genPhase ? 600 : 400 }}>{phase}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: t.surface2, borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg, ${t.brain}, ${t.accent})`, width: `${((genPhase + 1) / GENERATION_PHASES.length) * 100}%`, transition: "width 1.8s ease" }} />
        </div>
      </div>
    );
  }

  // ── No project guard ──
  if (!project) {
    return (
      <div style={{ maxWidth: 520, margin: "80px auto", textAlign: "center", padding: "0 40px" }}>
        <div style={{ fontFamily: FONT, fontSize: 16, color: t.text2, marginBottom: 16 }}>No project selected.</div>
        <Btn t={t} kind="dark" onClick={() => nav("projects")}>← Back to Projects</Btn>
      </div>
    );
  }

  // ── Main canvas ──
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 36px 80px", fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div>
          <button
            onClick={() => nav("projects")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: t.text3, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 14, letterSpacing: ".08em", textTransform: "uppercase" }}
          >
            <ArrowLeft size={13} /> Campaign Projects
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: t.text, letterSpacing: "-.025em", margin: 0 }}>
              {project.name}
            </h1>
            {saving && <Loader2 size={14} style={{ color: t.text3, animation: "spin 1s linear infinite" }} />}
          </div>
          {storyboard?.campaign_goal && (
            <p style={{ fontFamily: FONT, fontSize: 13.5, color: t.text2, margin: "0 0 8px", lineHeight: 1.5, maxWidth: "60ch" }}>
              {storyboard.campaign_goal}
            </p>
          )}
          {storyboard?.tagline_suggestion && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11, color: t.accentText, background: t.accentSoft, border: `1px solid ${t.accent}44`, padding: "5px 12px", letterSpacing: ".06em" }}>
              <MessageSquare size={11} />
              "{storyboard.tagline_suggestion}"
              <span style={{ color: t.text3, cursor: "pointer", fontSize: 10 }} title="Use this tagline" onClick={() => showToast("Tagline copied to clipboard!")}>↗</span>
            </div>
          )}
        </div>

        {/* Stats + actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, textTransform: "uppercase", letterSpacing: ".1em" }}>Progress</div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text }}>{completeCards}/{totalCards} cards</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, textTransform: "uppercase", letterSpacing: ".1em" }}>Channels</div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text }}>{storyboard?.channels?.length || 0}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn t={t} kind="secondary" small icon={RefreshCw} onClick={generateStoryboard}>
              Regenerate
            </Btn>
            <Btn t={t} kind="dark" small icon={CheckCircle2} onClick={handleApprove} loading={approving}>
              Approve & Begin
            </Btn>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {totalCards > 0 && (
        <div style={{ height: 4, background: t.surface2, borderRadius: 999, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg, ${t.success}, ${t.brain})`, width: `${(completeCards / totalCards) * 100}%`, transition: "width .5s ease" }} />
        </div>
      )}

      {/* Channel tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: `1px solid ${t.border}`, marginBottom: 24 }}>
        {CHANNELS.map(ch => {
          const ChIcon = ch.icon;
          const channelData = storyboard?.channels?.find(c => c.id === ch.id);
          const cardCount = channelData?.cards?.length || 0;
          const isActive = activeChannel === ch.id;
          const hasCards = cardCount > 0;
          if (!hasCards && !isActive) return null; // hide empty channels unless active
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                fontFamily: FONT, fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? t.text : t.text3,
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 16px", borderBottom: `2px solid ${isActive ? t.text : "transparent"}`,
                transition: "all .15s",
              }}
            >
              <ChIcon size={14} style={{ color: isActive ? ch.color : t.text3 }} />
              {ch.label}
              {hasCards && (
                <span style={{ fontFamily: MONO, fontSize: 10, color: isActive ? t.text : t.text3, background: isActive ? t.surface2 : t.surface, border: `1px solid ${t.border}`, padding: "1px 6px" }}>
                  {cardCount}
                </span>
              )}
            </button>
          );
        })}
        {/* Show hidden empty channels as dimmed */}
        {CHANNELS.filter(ch => {
          const cardCount = storyboard?.channels?.find(c => c.id === ch.id)?.cards?.length || 0;
          return cardCount === 0 && activeChannel !== ch.id;
        }).map(ch => {
          const ChIcon = ch.icon;
          return (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT, fontSize: 12.5, fontWeight: 400, color: t.text3, background: "none", border: "none", cursor: "pointer", padding: "10px 14px", opacity: 0.5 }}
            >
              <ChIcon size={13} />
              {ch.label}
              <Plus size={10} />
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {channelCards.map(card => (
          <StoryboardCard
            key={card.id}
            t={t}
            card={card}
            channelId={activeChannel}
            onUpdate={updateCard}
            onStart={startCard}
            onDelete={deleteCard}
            dragHandleProps={{}}
          />
        ))}

        {/* Add card tile */}
        {showAddCard ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <AddCardModal t={t} channelId={activeChannel} onAdd={addCard} onClose={() => setShowAddCard(false)} />
          </div>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, minHeight: 180, background: "none",
              border: `1.5px dashed ${t.border}`, cursor: "pointer", color: t.text3,
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.text3; }}
          >
            <Plus size={20} />
            <span style={{ fontFamily: FONT, fontSize: 12.5, fontWeight: 600 }}>Add Card</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
        <Btn t={t} kind="ghost" onClick={() => nav("projects")}>← Edit Brief</Btn>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn t={t} kind="secondary" icon={RefreshCw} onClick={generateStoryboard}>Regenerate Storyboard</Btn>
          <Btn t={t} kind="dark" icon={CheckCircle2} onClick={handleApprove} loading={approving}>✓ Approve & Begin Production</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Fallback starter storyboard ────────────────────────────────────────────────

function makeStarterStoryboard(project) {
  const name = project?.name || "Campaign";
  const brand = project?.brand_name || project?.brandName || "Brand";
  return {
    campaign_name: name,
    campaign_goal: `Drive awareness and engagement for ${brand}'s ${name} campaign.`,
    tagline_suggestion: "",
    estimated_assets: 6,
    channels: [
      {
        id: "instagram",
        cards: [
          {
            id: `card-${Date.now()}-1`,
            format: "Carousel Post",
            hook: "Lead with the core problem your audience faces, resolve with your product.",
            copy_angle: "Functional → Emotional arc",
            visual_direction: "High-contrast photography, brand palette, minimal text overlay.",
            tool_sequence: ["strategy", "copy", "genfy"],
            priority: "hero",
            status: "not_started",
          },
          {
            id: `card-${Date.now()}-2`,
            format: "Story Ad (9:16)",
            hook: "Product-first: single striking visual, CTA within 3 seconds.",
            copy_angle: "Short form, punchy stat or claim",
            visual_direction: "Clean studio, tight crop, brand color background.",
            tool_sequence: ["copy", "genfy", "edit"],
            priority: "supporting",
            status: "not_started",
          },
        ],
      },
      {
        id: "email",
        cards: [
          {
            id: `card-${Date.now()}-3`,
            format: "Launch Announce",
            hook: "Subject line: curiosity-gap. Body: story → proof → offer → CTA.",
            copy_angle: "Narrative-led, brand voice throughout",
            visual_direction: "Email header image, brand colours, one hero image.",
            tool_sequence: ["copy"],
            priority: "hero",
            status: "not_started",
          },
        ],
      },
    ],
  };
}
