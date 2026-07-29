import { useState, useEffect, useRef } from "react";
import {
  Home, Boxes, LayoutGrid, Library, Brain, Search, Plus, Bell, Sun, Moon,
  ArrowRight, Check, Lock, AlertTriangle, Sparkles, ChevronRight, ChevronsUpDown,
  Target, PenLine, Image as ImageIcon, Wand2, Presentation, Users, UserCog,
  X, Upload, FileText, Loader2, Circle, RefreshCw, Send, ShieldCheck, Zap, Copy as CopyIcon,
  Sliders, HelpCircle, Video, Eye, ZoomIn, Download, Trash2, Layers
} from "lucide-react";

/* ============================================================
   STUDIO OS — Studio-OS workflow, Aura design system.
   Warm amber accent · neutral gray base · light + dark tokens.
   Two modes: à-la-carte tools + orchestrated workflows, both
   fed by one Brand Brain (shared RAG memory).
   ============================================================ */
const TOKENS = {
  light: {
    bg: "#F7F6F4", surface: "#FFFFFF", surface2: "#F1EFEC", surface3: "#E9E6E1",
    border: "#E3E0DA", borderStrong: "#CFCAC2",
    text: "#211E1A", text2: "#5C574F", text3: "#8B857B",
    accent: "#E8850C", accentHover: "#D1770A", accentSoft: "#FBEDD9", accentText: "#8A4E03", onAccent: "#FFFFFF",
    // brand-brain identity (kept purple — it's the memory layer, distinct from the accent)
    brain: "#6D4AE8", brain2: "#8A6BF2", brainSoft: "#EDE8FC", brainText: "#4A2FA0",
    success: "#1E7F4F", successSoft: "#DDF2E6",
    warn: "#B57611", warnSoft: "#FBF0D6",
    danger: "#C23B2E", dangerSoft: "#FAE4E1",
    sideBg: "#1C1A16", sideText: "#B7B2A7", sideActive: "rgba(255,255,255,.09)",
    shadow: "0 1px 2px rgba(30,25,18,.05), 0 4px 16px rgba(30,25,18,.06)",
    shadowLg: "0 8px 32px rgba(30,25,18,.16)",
  },
  dark: {
    bg: "#151311", surface: "#1E1B18", surface2: "#26221E", surface3: "#2E2924",
    border: "#332E28", borderStrong: "#474037",
    text: "#F2EFEA", text2: "#B4ADA2", text3: "#847D71",
    accent: "#F59E2B", accentHover: "#FFAE45", accentSoft: "#3A2B14", accentText: "#F7B85C", onAccent: "#1A1206",
    brain: "#8A6BF2", brain2: "#A78BFF", brainSoft: "#241B3D", brainText: "#C4B4F7",
    success: "#4CC98A", successSoft: "#16301F",
    warn: "#E0A94A", warnSoft: "#332811",
    danger: "#F07A6E", dangerSoft: "#3A1F1B",
    sideBg: "#100E0C", sideText: "#9A948A", sideActive: "rgba(255,255,255,.08)",
    shadow: "0 1px 2px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.35)",
    shadowLg: "0 8px 32px rgba(0,0,0,.5)",
  },
};
const FONT = `"Manrope", ui-sans-serif, system-ui, -apple-system, sans-serif`;
const MONO = `"JetBrains Mono", ui-monospace, Menlo, monospace`;
const R = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };

/* ---- the seven tools; each carries its own accent (one system, many faces) ---- */
const TOOLS = [
  { id: "strategy", name: "Strategy", icon: Target, hue: "#2FA36B", tags: ["POSITIONING", "BRIEF"], desc: "Positioning, audience and campaign angles — the brief that seeds everything downstream." },
  { id: "copy", name: "Copy Agent", icon: PenLine, hue: "#2E6BE6", tags: ["SOCIAL", "EMAIL", "ADS"], desc: "Captions, emails, ads and scripts from a library of high-performing templates." },
  { id: "genfy", name: "Genfy · Image", icon: ImageIcon, hue: "#E8552A", tags: ["T2I", "CONTROLS"], desc: "On-brand visuals with style, lighting and camera controls. Text-to-image + references." },
  { id: "edit", name: "Image Editor", icon: Wand2, hue: "#B84FD8", tags: ["INPAINT", "UPSCALE"], desc: "Retouch, inpaint, upscale and swap backgrounds. Polish any generation before it ships." },
  { id: "deck", name: "Deck Builder", icon: Presentation, hue: "#DE9B18", tags: ["PPTX", "TEMPLATES"], desc: "Turn strategy, copy and visuals into a branded deck — pitch-ready in minutes." },
  { id: "leads", name: "Lead Agent", icon: Users, hue: "#E0447A", tags: ["SEQUENCES", "SCORING"], desc: "Build, score and sequence outreach lists. Wire approved copy into campaigns." },
  { id: "hr", name: "HR Studio", icon: UserCog, hue: "#12A0A0", tags: ["JD", "COMMS"], desc: "Job posts, JDs and internal comms — in the company's own voice." },
];
const toolById = id => TOOLS.find(t => t.id === id);

/* ---- shared brand context (the Brand Brain output) ---- */
const BRAND = {
  name: "OFFGRID", av: "OG", avHue: "#E8552A",
  voice: ["Direct", "Gritty", "Confident"],
  audience: ["17–35 urban", "Commuters"],
  never: ["luxurious", "game-changer", "synergy"],
  palette: ["#1A1712", "#EDE9DF", "#E8552A"],
  sources: 4, assets: 42, match: 96,
};

/* ---- workflow pipeline state ---- */
const PIPELINE = [
  { tool: "strategy", step: 1, status: "done", out: "Positioning: “technical, not precious.” 3 campaign angles + audience segments locked.", by: "Kanishk" },
  { tool: "copy", step: 2, status: "done", out: "3 Instagram captions, 96% on-brand. Winner locked.", by: "Aria" },
  { tool: "genfy", step: 3, status: "active", out: "Generating 4 key visuals from the locked copy + brand palette.", pass: "copy + palette →" },
  { tool: "edit", step: 4, status: "queued", out: "Retouch + 9:16 story crops for the chosen visual.", pass: "final assets →" },
  { tool: "deck", step: 5, status: "queued", out: "Assembles the launch deck: strategy, copy + visuals, OFFGRID template." },
];

const WORKFLOW_TEMPLATES = [
  { name: "Campaign Launch", flow: ["strategy", "copy", "genfy", "edit", "deck"] },
  { name: "Social Content Sprint", flow: ["copy", "genfy", "edit"] },
  { name: "Lead Gen Sequence", flow: ["strategy", "copy", "leads"] },
];

const PROJECTS = [
  { name: "Spring Drop Launch", meta: "Campaign Launch · 5 steps · 3d ago", tag: "In progress — Genfy", tagHue: "#E8552A", steps: ["Strategy", "Copy", "Images", "Edit", "Deck"], done: 2, active: 2, view: "workflow" },
  { name: "Q3 Retention Emails", meta: "Lifecycle · 4 steps · 1w ago", tag: "Awaiting review — Leads", tagHue: "#B57611", steps: ["Strategy", "Copy", "Leads", "Send"], done: 2, active: 2 },
  { name: "Founder LinkedIn Series", meta: "Thought Leadership · 4 steps · done", tag: "Complete — 12 assets", tagHue: "#1E7F4F", steps: ["Strategy", "Copy", "Images", "Publish"], done: 4, active: -1 },
];

/* ---------------- primitives (Aura component library) ---------------- */
function useTheme() {
  const [mode, setMode] = useState("light");
  return { t: TOKENS[mode], mode, toggle: () => setMode(m => m === "light" ? "dark" : "light") };
}
const Mono = ({ t, children, style }) => <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: t.text3, ...style }}>{children}</span>;

function Btn({ t, kind = "primary", children, icon: Icon, onClick, disabled, loading, small, hue, style }) {
  const [h, setH] = useState(false);
  const acc = hue || t.accent;
  const kinds = {
    primary: { background: disabled ? t.surface3 : h ? (hue ? hue : t.accentHover) : acc, color: disabled ? t.text3 : (hue ? "#fff" : t.onAccent), filter: h && hue ? "brightness(.93)" : "none" },
    secondary: { background: h && !disabled ? t.surface3 : t.surface2, color: t.text, border: `1px solid ${h ? t.borderStrong : t.border}` },
    ghost: { background: h && !disabled ? t.surface2 : "transparent", color: t.text2 },
    dark: { background: h && !disabled ? "#000" : t.text, color: t.bg },
    success: { background: h && !disabled ? t.success : t.success, color: "#fff", filter: h ? "brightness(1.08)" : "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: FONT, fontWeight: 600, fontSize: small ? 12.5 : 13.5, borderRadius: R.md, padding: small ? "6px 12px" : "9px 15px", border: "1px solid transparent", cursor: disabled || loading ? "not-allowed" : "pointer", opacity: disabled ? .55 : 1, transition: "all .14s", ...kinds[kind], ...style }}>
      {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : Icon && <Icon size={small ? 14 : 15} />}
      {children}
    </button>
  );
}
function Chip({ t, children, dot, hue, banned }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: R.pill, background: banned ? t.dangerSoft : t.surface2, color: banned ? t.danger : t.text2, border: `1px solid ${t.border}`, textDecoration: banned ? "line-through" : "none" }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: hue }} />}{children}
    </span>
  );
}
function Card({ t, children, style, onClick, hoverable, accentTop }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: "relative", overflow: accentTop ? "hidden" : "visible", background: t.surface, border: `1px solid ${h && hoverable ? t.borderStrong : t.border}`, borderRadius: R.lg, boxShadow: h && hoverable ? t.shadow : "none", transition: "all .16s", cursor: onClick ? "pointer" : "default", transform: h && hoverable ? "translateY(-2px)" : "none", ...style }}>
      {accentTop && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accentTop }} />}
      {children}
    </div>
  );
}
function Toast({ t, toast }) {
  if (!toast) return null;
  return <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: t.text, color: t.bg, fontFamily: FONT, fontSize: 13.5, fontWeight: 600, padding: "12px 20px", borderRadius: R.md, boxShadow: t.shadowLg, display: "flex", gap: 10, alignItems: "center", animation: "slideUp .25s ease" }}><Check size={16} style={{ color: t.accent }} />{toast}</div>;
}
const Eyebrow = ({ t, children }) => <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: t.text3, marginBottom: 12 }}>{children}</div>;
const H1 = ({ t, children, style }) => <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 32, letterSpacing: "-.025em", lineHeight: 1.06, color: t.text, margin: 0, ...style }}>{children}</h1>;
const Sub = ({ t, children }) => <p style={{ fontFamily: FONT, fontSize: 15, color: t.text2, marginTop: 8, maxWidth: "62ch", lineHeight: 1.55 }}>{children}</p>;
function SectionH({ t, title, link, onLink }) {
  return <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "38px 0 16px" }}>
    <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 19, letterSpacing: "-.02em", color: t.text, margin: 0 }}>{title}</h2>
    {link && <button onClick={onLink} style={{ fontFamily: MONO, fontSize: 12, color: t.text3, background: "none", border: "none", cursor: "pointer" }}>{link}</button>}
  </div>;
}

/* status pill for pipeline nodes / steps */
function StatusPill({ t, status, hue }) {
  const map = {
    done: [Check, "Done", t.success, t.successSoft],
    active: [Loader2, "Running", hue, `${hue}22`],
    queued: [Circle, "Queued", t.text3, t.surface2],
  };
  const [Icon, label, color, bg] = map[status];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: R.pill, color, background: bg }}>
    <Icon size={10} style={status === "active" ? { animation: "spin 1s linear infinite" } : {}} />{label}
  </span>;
}

/* horizontal step tracker (used on project cards) */
function Steps({ t, steps, done, active }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", margin: "14px 0 2px" }}>
      {steps.map((s, i) => {
        const isDone = i < done, isActive = i === active;
        return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
            {i < steps.length - 1 && <div style={{ position: "absolute", top: 8, left: "calc(50% + 11px)", right: "calc(-50% + 11px)", height: 2, background: isDone ? t.success : t.border }} />}
            <div style={{ width: 17, height: 17, borderRadius: 9, zIndex: 1, display: "grid", placeItems: "center", background: isDone ? t.success : isActive ? t.surface : t.surface2, border: `2px solid ${isDone ? t.success : isActive ? t.accent : t.border}`, boxShadow: isActive ? `0 0 0 3px ${t.accentSoft}` : "none" }}>
              {isDone ? <Check size={9} color="#fff" /> : isActive ? <span style={{ width: 5, height: 5, borderRadius: 3, background: t.accent }} /> : null}
            </div>
            <span style={{ fontFamily: MONO, fontSize: 9.5, color: isDone || isActive ? t.text2 : t.text3, textAlign: "center" }}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- shell: sidebar + topbar ---------------- */
const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "projects", label: "Projects", icon: Boxes, count: 3 },
  { id: "tools", label: "Tools", icon: LayoutGrid, count: 7 },
  { id: "brain", label: "Brand Brain", icon: Brain, brain: true },
  { id: "assets", label: "Assets", icon: Library, count: 42 },
];
function Sidebar({ t, view, nav, compact, onboard }) {
  return (
    <aside style={{ width: compact ? 64 : 248, flexShrink: 0, background: t.sideBg, display: "flex", flexDirection: "column", padding: "14px 12px", gap: 4, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: compact ? "8px 0 12px" : "8px 8px 12px", justifyContent: compact ? "center" : "flex-start" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: t.accent, display: "grid", placeItems: "center", boxShadow: `0 6px 16px -6px ${t.accent}` }}>
          <Sparkles size={16} color={t.onAccent} />
        </div>
        {!compact && <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.02em", color: "#fff" }}>Studio<span style={{ color: t.accent }}>OS</span></span>}
      </div>

      <button onClick={onboard} style={{ display: "flex", alignItems: "center", gap: 9, margin: "2px 4px 10px", padding: compact ? 9 : "9px 10px", borderRadius: R.md, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", cursor: "pointer", justifyContent: compact ? "center" : "flex-start" }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: BRAND.avHue, display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{BRAND.av}</div>
        {!compact && <><div style={{ flex: 1, minWidth: 0, textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{BRAND.name}</div><div style={{ fontFamily: MONO, fontSize: 10.5, color: t.sideText }}>client workspace</div></div><ChevronsUpDown size={14} color={t.sideText} /></>}
      </button>

      {!compact && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", color: "#6a655c", textTransform: "uppercase", padding: "10px 10px 5px" }}>Workspace</div>}
      {NAV.map(n => {
        const active = view === n.id || (n.id === "tools" && (view === "tool-detail" || view === "genfy-detail")) || (n.id === "projects" && view === "workflow");
        return (
          <button key={n.id} onClick={() => nav(n.id)} title={n.label} style={{ display: "flex", alignItems: "center", gap: 11, padding: compact ? 10 : "8px 10px", borderRadius: R.sm, border: "none", cursor: "pointer", background: active ? t.sideActive : "transparent", color: active ? "#fff" : t.sideText, fontSize: 13.5, fontWeight: active ? 600 : 500, fontFamily: FONT, position: "relative", justifyContent: compact ? "center" : "flex-start", transition: "background .12s" }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.05)"; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
            {active && <span style={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", width: 3, height: 17, borderRadius: "0 3px 3px 0", background: n.brain ? t.brain2 : t.accent }} />}
            <n.icon size={17} style={{ opacity: .9 }} />
            {!compact && <span>{n.label}</span>}
            {!compact && n.count != null && <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10.5, color: t.sideText, background: "rgba(255,255,255,.06)", padding: "1px 6px", borderRadius: 20 }}>{n.count}</span>}
          </button>
        );
      })}


    </aside>
  );
}

function TopBar({ t, mode, toggle, view, nav, onboard }) {
  const labels = { home: "Home", projects: "Projects", tools: "Tools", brain: "Brand Brain", assets: "Assets", workflow: "Spring Drop Launch", "tool-detail": "Copy Agent" };
  return (
    <div style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 14, padding: "0 24px", borderBottom: `1px solid ${t.border}`, background: t.bg, position: "sticky", top: 0, zIndex: 5, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.text2, fontWeight: 500 }}>
        <b style={{ color: t.text, fontWeight: 600 }}>{BRAND.name}</b><span style={{ color: t.text3 }}>/</span><span>{labels[view]}</span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        <button aria-label="Toggle theme" onClick={toggle} style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", border: `1px solid ${t.border}`, background: t.surface, color: t.text2, cursor: "pointer" }}>{mode === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
        <button aria-label="Add client" onClick={onboard} style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", border: `1px solid ${t.border}`, background: t.surface, color: t.text2, cursor: "pointer" }}><Plus size={17} /></button>
      </div>
    </div>
  );
}

/* ---------------- Brand context rail + compliance (reused) ---------------- */
function BrandContextRail({ t, showToast }) {
  const Block = ({ label, children }) => <div style={{ marginTop: 12 }}><div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: t.brain2, marginBottom: 6 }}>{label}</div>{children}</div>;
  const Tag = ({ children, ban }) => <span style={{ fontFamily: MONO, fontSize: 10.5, padding: "3px 8px", borderRadius: 6, background: ban ? "rgba(224,68,122,.16)" : "rgba(255,255,255,.11)", border: `1px solid ${ban ? "rgba(224,68,122,.3)" : "rgba(255,255,255,.13)"}`, color: ban ? "#f7b7ce" : "#EDE9F8", textDecoration: ban ? "line-through" : "none" }}>{children}</span>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ borderRadius: R.lg, padding: 18, color: "#EDE9F8", position: "relative", overflow: "hidden", background: `linear-gradient(160deg, ${t.brain}, ${t.brainText})`, boxShadow: t.shadow }}>
        <div style={{ position: "absolute", top: "-30%", right: "-20%", width: "60%", height: "80%", background: `radial-gradient(circle, ${t.brain2}66, transparent 70%)` }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><Brain size={15} /><b style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14 }}>Brand context in</b></div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#c9bef2" }}>pulled from Brand Brain · always on</div>
          <Block label="Voice"><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{BRAND.voice.map(v => <Tag key={v}>{v}</Tag>)}</div></Block>
          <Block label="Audience"><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{BRAND.audience.map(v => <Tag key={v}>{v}</Tag>)}</div></Block>
          <Block label="Never say"><div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{BRAND.never.map(v => <Tag key={v} ban>{v}</Tag>)}</div></Block>
          <Block label="Palette"><div style={{ display: "flex", gap: 5 }}>{BRAND.palette.map(c => <span key={c} style={{ width: 26, height: 26, borderRadius: 6, background: c, border: "1px solid rgba(255,255,255,.2)" }} />)}</div></Block>
        </div>
      </div>
      <Card t={t} style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <b style={{ fontFamily: FONT, fontSize: 12.5, color: t.text }}>Brand compliance</b>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: t.success }}>{BRAND.match}%</span>
        </div>
        <div style={{ height: 7, borderRadius: 20, background: t.surface2, overflow: "hidden" }}><div style={{ width: `${BRAND.match}%`, height: "100%", background: `linear-gradient(90deg, ${t.success}, #5cc78e)` }} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {[[true, "Voice matches (direct, no fluff)"], [true, "No banned phrases"], [false, "Caption 2 is 4 chars over limit"]].map(([ok, txt], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT, fontSize: 11.5, color: t.text2 }}>
              <span style={{ width: 15, height: 15, borderRadius: 8, display: "grid", placeItems: "center", background: ok ? t.success : t.warn }}>{ok ? <Check size={8} color="#fff" /> : <AlertTriangle size={8} color="#fff" />}</span>{txt}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- HOME ---------------- */
function HomeScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <Eyebrow t={t}>OFFGRID workspace</Eyebrow>
      <H1 t={t}>Two ways to work.</H1>
      <Sub t={t}>Open a single tool for a quick task, or chain tools into a workflow where each step's output becomes context for the next. Both read OFFGRID's brand automatically.</Sub>

      {/* the two modes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 30 }} className="two-col">
        <Card t={t} hoverable onClick={() => nav("tools")} style={{ padding: 24 }}>
          <Mono t={t}>Mode 01 · à la carte</Mono>
          <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 21, margin: "14px 0 8px", letterSpacing: "-.02em", color: t.text }}>Open a tool</h3>
          <p style={{ fontSize: 13.5, color: t.text2, lineHeight: 1.5, maxWidth: "34ch" }}>Jump straight into any of the seven tools. Brand context is injected the moment it opens — no setup.</p>
          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {TOOLS.slice(0, 5).map(tool => <div key={tool.id} style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: `${tool.hue}1F`, color: tool.hue, border: `1px solid ${t.border}` }}><tool.icon size={15} /></div>)}
          </div>
          <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: t.text }}>Browse tools <ArrowRight size={15} /></div>
        </Card>

        <Card t={t} hoverable onClick={() => nav("workflow")} style={{ padding: 24, background: `linear-gradient(140deg, ${t.text}, ${t.surface3})`, border: "none", color: "#fff" }}>
          <Mono t={t} style={{ color: "rgba(255,255,255,.55)" }}>Mode 02 · orchestrated</Mono>
          <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 21, margin: "14px 0 8px", letterSpacing: "-.02em", color: t.bg === "#151311" ? t.text : "#fff" }}>Start a workflow</h3>
          <p style={{ fontSize: 13.5, color: t.bg === "#151311" ? t.text2 : "rgba(255,255,255,.8)", lineHeight: 1.5, maxWidth: "34ch" }}>Chain tools into a campaign. The output of each step becomes context for the next — automatically.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 16 }}>
            {[Target, PenLine, ImageIcon, Presentation].map((Icon, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>{i > 0 && <span style={{ width: 14, height: 2, background: "rgba(255,255,255,.25)", borderRadius: 2 }} />}<div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.16)", display: "grid", placeItems: "center", color: "#fff" }}><Icon size={13} /></div></div>)}
          </div>
          <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: t.bg === "#151311" ? t.text : "#fff" }}>See a live workflow <ArrowRight size={15} /></div>
        </Card>
      </div>

      {/* active projects */}
      <SectionH t={t} title="Active projects" link="View all →" onLink={() => nav("projects")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {PROJECTS.map(p => (
          <Card key={p.name} t={t} hoverable onClick={() => nav(p.view || "projects")} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div><div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text }}>{p.name}</div><div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 2 }}>workflow</div></div>
              <Chip t={t} dot hue={p.tagHue}>{p.tag.split(" — ")[0]}</Chip>
            </div>
            <Steps t={t} steps={p.steps} done={p.done} active={p.active} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
              <Mono t={t}>{p.meta.split(" · ").slice(-1)}</Mono>
              <span style={{ fontFamily: MONO, fontSize: 11, color: t.text2 }}>{p.done}/{p.steps.length} approved</span>
            </div>
          </Card>
        ))}
      </div>


    </div>
  );
}

/* ---------------- WORKFLOW CANVAS (the pipeline) ---------------- */
function Connector({ t, label, live, hue }) {
  return (
    <div style={{ flex: "0 0 66px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "center" }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: t.text2, background: t.surface, border: `1px solid ${t.border}`, borderRadius: 20, padding: "3px 8px", whiteSpace: "nowrap", textAlign: "center", lineHeight: 1.2, boxShadow: t.shadow }}>{label}</div>
      <div style={{ width: "100%", height: 2, background: live ? `${hue}66` : t.border, borderRadius: 2, position: "relative", overflow: "hidden" }}>
        {live && <div style={{ position: "absolute", top: -1, width: 16, height: 4, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${hue})`, animation: "travel 1.5s linear infinite" }} />}
      </div>
      <ArrowRight size={13} style={{ color: t.text3 }} />
    </div>
  );
}
function WorkflowScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Eyebrow t={t}>Mode 02 · orchestrated workflow</Eyebrow>
          <H1 t={t}>Spring Drop Launch</H1>
          <Sub t={t}>Workflow: <b style={{ color: t.text }}>Campaign Launch</b>. Each tool runs as a step — the output of one becomes context for the next. Reorder, add or remove steps anytime.</Sub>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>
          <Btn t={t} kind="secondary" small onClick={() => showToast("Step editor opened")}>Edit steps</Btn>
          <Btn t={t} kind="dark" small icon={Zap} onClick={() => showToast("Running Genfy — step 3 of 5")}>Run next step</Btn>
        </div>
      </div>

      {/* brand brain feeds everything */}
      <div style={{ marginTop: 24, borderRadius: R.lg, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, background: `linear-gradient(120deg, ${t.brain}1A, ${t.brain}08)`, border: `1px solid ${t.brain}4D` }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0, boxShadow: `0 6px 14px -6px ${t.brain}` }}><Brain size={18} /></div>
        <div><b style={{ fontFamily: FONT, fontSize: 13, color: t.brainText }}>Brand Brain</b><div style={{ fontFamily: MONO, fontSize: 11, color: t.text2 }}>voice · palette · rules · past approved work</div></div>
        <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10.5, color: t.brain, display: "flex", alignItems: "center", gap: 6 }}>feeds every step ↓</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", padding: "0 60px", marginTop: -2 }}>{[0, 1, 2, 3, 4].map(i => <span key={i} style={{ width: 2, height: 22, background: `linear-gradient(${t.brain2}, transparent)`, opacity: .5 }} />)}</div>

      {/* pipeline */}
      <div style={{ display: "flex", alignItems: "stretch", marginTop: 6, overflowX: "auto", paddingBottom: 10 }}>
        {PIPELINE.map((node, i) => {
          const tool = toolById(node.tool);
          return (
            <div key={node.tool} style={{ display: "flex" }}>
              <Card t={t} hoverable onClick={() => node.tool === "copy" ? nav("tool-detail") : showToast(`Opening ${tool.name}`)} style={{ flex: "0 0 212px", width: 212, padding: 16, border: node.status === "active" ? `1px solid ${tool.hue}` : undefined, boxShadow: node.status === "active" ? `0 0 0 3px ${tool.hue}22` : undefined, opacity: node.status === "queued" ? .62 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: `${tool.hue}1F`, color: tool.hue }}><tool.icon size={17} /></div>
                  <div><div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, letterSpacing: "-.01em", color: t.text }}>{tool.name}</div><div style={{ fontFamily: MONO, fontSize: 9.5, color: t.text3 }}>STEP 0{node.step}</div></div>
                </div>
                <div style={{ marginBottom: 10 }}><StatusPill t={t} status={node.status} hue={tool.hue} /></div>
                <div style={{ fontFamily: FONT, fontSize: 11.5, color: t.text2, lineHeight: 1.45, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 9, padding: 10 }}>
                  {node.out}
                  {node.status === "active" && <div style={{ display: "flex", gap: 4, marginTop: 8 }}>{[0, 1, 2].map(k => <div key={k} style={{ flex: 1, aspectRatio: "1", borderRadius: 5, background: `${tool.hue}22`, border: `1px solid ${tool.hue}44` }} />)}</div>}
                </div>
                {node.by && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10.5, color: t.success }}><Check size={12} />Approved by {node.by}</div>}
                {node.status === "active" && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10.5, color: t.warn }}><AlertTriangle size={12} />Awaiting approval</div>}
              </Card>
              {i < PIPELINE.length - 1 && <Connector t={t} label={node.pass || "context →"} live={node.status !== "queued" && PIPELINE[i + 1] && PIPELINE[i].status === "active"} hue={tool.hue} />}
            </div>
          );
        })}
      </div>

      {/* tail: approval gates + loop */}
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="two-col">
        <Card t={t} style={{ padding: 18, display: "flex", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0, background: t.warnSoft, color: t.warn }}><Lock size={19} /></div>
          <div><h4 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, margin: "0 0 4px", color: t.text }}>Approval gates</h4><p style={{ fontFamily: FONT, fontSize: 12, color: t.text2, lineHeight: 1.5 }}>Nothing advances to the next tool until a human approves it — that's what keeps every step brand-safe and stops mistakes compounding down the chain.</p></div>
        </Card>
        <Card t={t} style={{ padding: 18, display: "flex", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", flexShrink: 0, background: t.brainSoft, color: t.brain }}><RefreshCw size={19} /></div>
          <div><h4 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, margin: "0 0 4px", color: t.text }}>The loop closes</h4><p style={{ fontFamily: FONT, fontSize: 12, color: t.text2, lineHeight: 1.5 }}>Every approved output lands in <b style={{ color: t.text }}>Assets</b> and feeds back into the <b style={{ color: t.text }}>Brand Brain</b> — so the next campaign starts smarter than this one did.</p></div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- TOOL DETAIL (Copy Agent, à la carte) ---------------- */
function ToolDetail({ t, nav, showToast }) {
  const tool = toolById("copy");
  const [tmpl, setTmpl] = useState("Instagram Captions");
  const [approved, setApproved] = useState(false);
  const templates = ["Instagram Captions", "LinkedIn Post", "Ad Copy", "Blog Outline"];
  const captions = [
    "🌧️ The forecast doesn't get a vote. Spring Drop lands Friday — technical shells that pack down smaller than your excuses. #OFFGRID",
    "Built for the 8am sprint to the platform, not the summit. Weatherproof, weightless, and yeah — it looks good off the trail too.",
    "Wet streets. Dry you. The Spring Drop is engineered for the city that never checks the radar. Link in bio Friday.",
  ];
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, display: "grid", placeItems: "center", background: `${tool.hue}1F`, color: tool.hue }}><tool.icon size={20} /></div>
        <div><div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: "-.02em", color: t.text }}>{tool.name}</div><div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>tools · à la carte · OFFGRID brand injected</div></div>
        <button onClick={() => nav("tools")} style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11.5, color: t.text2, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: R.pill, padding: "5px 12px", cursor: "pointer" }}>← Back to tools</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }} className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* composer */}
          <Card t={t} style={{ padding: 18 }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: t.text3, marginBottom: 8 }}>Template</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {templates.map(x => (
                <button key={x} onClick={() => setTmpl(x)} style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 500, padding: "6px 11px", borderRadius: 8, cursor: "pointer", background: tmpl === x ? tool.hue : t.surface2, color: tmpl === x ? "#fff" : t.text2, border: `1px solid ${tmpl === x ? tool.hue : t.border}` }}>{x}</button>
              ))}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: t.text3, margin: "18px 0 8px" }}>Your prompt</div>
            <div style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: R.md, padding: 14, fontSize: 13.5, color: t.text, lineHeight: 1.5 }}>
              Write 3 Instagram captions for the <b>Spring Drop</b> — lightweight technical outerwear for city commutes. <span style={{ color: t.text3 }}>Angle: beat the weather without looking like you're dressed for it.</span>
            </div>
            <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
              <Btn t={t} hue={tool.hue} icon={Sparkles} onClick={() => showToast("Generating 3 captions…")}>Generate</Btn>
              <Btn t={t} kind="secondary" icon={Plus}>Add reference</Btn>
            </div>
          </Card>

          {/* output */}
          <Card t={t} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${t.border}` }}>
              <Mono t={t}>Output · 3 captions</Mono>
              <Chip t={t} dot hue={t.success}>{BRAND.match}% on-brand</Chip>
            </div>
            {captions.map((c, i) => <div key={i} style={{ padding: "14px 18px", borderBottom: i < 2 ? `1px solid ${t.border}` : "none", fontFamily: FONT, fontSize: 14, lineHeight: 1.55, color: t.text }}>{c}</div>)}
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "14px 18px", background: t.surface2, borderTop: `1px solid ${t.border}`, flexWrap: "wrap" }}>
              <Btn t={t} kind={approved ? "secondary" : "success"} icon={Check} onClick={() => { setApproved(true); showToast("Approved — saved to Assets & fed back to Brand Brain"); }}>{approved ? "Approved" : "Approve & save"}</Btn>
              <Btn t={t} icon={ArrowRight} hue={toolById("genfy").hue} onClick={() => nav("workflow")} style={{ background: `${toolById("genfy").hue}18`, color: toolById("genfy").hue, border: `1px solid ${toolById("genfy").hue}44` }}>Send to Genfy →</Btn>
              <Btn t={t} kind="ghost" small icon={RefreshCw} onClick={() => showToast("Regenerating…")}>Regenerate</Btn>
            </div>
          </Card>
        </div>

        <BrandContextRail t={t} showToast={showToast} />
      </div>
    </div>
  );
}

/* ---------------- TOOLS LAUNCHER ---------------- */
function ToolsScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <Eyebrow t={t}>Mode 01 · à la carte</Eyebrow>
      <H1 t={t}>Tools</H1>
      <Sub t={t}>Open any tool directly for a quick task — each reads OFFGRID's brand automatically. Or tap + to drop it into a workflow instead.</Sub>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(258px,1fr))", gap: 16, marginTop: 20 }}>
        {TOOLS.map(tool => (
          <Card t={t} key={tool.id} hoverable accentTop={tool.hue} style={{ padding: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", marginBottom: 16, background: `${tool.hue}1F`, color: tool.hue }}><tool.icon size={22} /></div>
            <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16.5, letterSpacing: "-.01em", color: t.text, margin: 0 }}>{tool.name}</h3>
            <p style={{ fontFamily: FONT, fontSize: 12.5, color: t.text2, marginTop: 6, lineHeight: 1.45, minHeight: 54 }}>{tool.desc}</p>
            <div style={{ display: "flex", gap: 5, margin: "14px 0" }}>{tool.tags.map(tg => <span key={tg} style={{ fontFamily: MONO, fontSize: 9.5, color: t.text3, background: t.surface2, padding: "2px 7px", borderRadius: 5, border: `1px solid ${t.border}` }}>{tg}</span>)}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn t={t} hue={tool.hue} onClick={() => tool.id === "copy" ? nav("tool-detail") : tool.id === "genfy" ? nav("genfy-detail") : showToast(`${tool.name} opened — brand injected`)} style={{ flex: 1 }}>Open</Btn>
              <Btn t={t} kind="secondary" onClick={() => showToast(`${tool.name} added to a workflow`)} icon={Plus} style={{ width: 36, padding: 0 }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- PROJECTS ---------------- */
function ProjectsScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div><Eyebrow t={t}>Mode 02 · orchestrated</Eyebrow><H1 t={t}>Projects</H1><Sub t={t}>Each project threads tools into a workflow and carries context between every step.</Sub></div>
        <Btn t={t} kind="dark" icon={Plus} onClick={() => showToast("New project — pick a template")}>New project</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {PROJECTS.map(p => (
          <Card t={t} key={p.name} hoverable onClick={() => nav(p.view || "workflow")} style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1.4fr 2fr auto", gap: 20, alignItems: "center" }} className="proj-row">
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text }}>{p.name}</div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 3 }}>{p.meta}</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9.5, padding: "3px 9px", borderRadius: 20, marginTop: 8, background: `${p.tagHue}1F`, color: p.tagHue }}>● {p.tag}</span>
            </div>
            <Steps t={t} steps={p.steps} done={p.done} active={p.active} />
            <Btn t={t} kind="secondary" small>Open →</Btn>
          </Card>
        ))}
      </div>
      <SectionH t={t} title="Start from a workflow template" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {WORKFLOW_TEMPLATES.map(w => (
          <Card t={t} key={w.name} hoverable onClick={() => showToast(`Starting “${w.name}” workflow`)} style={{ padding: 18 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text, marginBottom: 10 }}>{w.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              {w.flow.map((id, i) => { const tl = toolById(id); return <div key={id} style={{ display: "flex", alignItems: "center", gap: 5 }}>{i > 0 && <ChevronRight size={12} style={{ color: t.text3 }} />}<div style={{ width: 26, height: 26, borderRadius: 7, background: `${tl.hue}1F`, color: tl.hue, display: "grid", placeItems: "center" }} title={tl.name}><tl.icon size={13} /></div></div>; })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- BRAND BRAIN ---------------- */
function BrainScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div style={{ borderRadius: R.lg, padding: 28, color: "#EDE9F8", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${t.brainText}, ${t.brain})`, boxShadow: t.shadowLg }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 88% 20%, ${t.brain2}55, transparent 40%), radial-gradient(circle at 5% 95%, ${t.brain}66, transparent 42%)` }} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "grid", placeItems: "center", marginBottom: 16 }}><Brain size={24} /></div>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", margin: 0 }}>OFFGRID's Brand Brain</h1>
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#c9bef2", marginTop: 8, maxWidth: "56ch" }}>The shared memory every tool reads from and writes back to. Assembled from your uploaded materials and every approved asset since.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {["Every tool reads it", "Approved work feeds it", "Gets smarter each campaign"].map(f => <span key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11, background: "rgba(255,255,255,.1)", padding: "7px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.14)" }}>{f}</span>)}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }} className="two-col">
        <Card t={t} style={{ padding: 20 }}>
          <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: t.text }}><FileText size={16} style={{ color: t.brain }} />Indexed sources</h3>
          {[["brand-guidelines-2025.pdf", "PDF · 18 pages"], ["tone-of-voice.docx", "DOCX · voice + rules"], ["past-campaigns/", "12 approved assets"], ["offgrid.com", "URL · scraped"]].map(([n, s]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: t.surface2, border: `1px solid ${t.border}`, display: "grid", placeItems: "center", color: t.text3, flexShrink: 0 }}><FileText size={16} /></div>
              <div style={{ flex: 1 }}><div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: t.text }}>{n}</div><div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{s}</div></div>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9.5, padding: "3px 8px", borderRadius: 20, background: t.successSoft, color: t.success }}><Check size={10} />Indexed</span>
            </div>
          ))}
          <Btn t={t} kind="secondary" small icon={Upload} style={{ marginTop: 14 }} onClick={() => showToast("Upload dialog opened")}>Add source</Btn>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card t={t} style={{ padding: 20 }}>
            <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: t.text }}><Target size={16} style={{ color: t.brain }} />Extracted brand profile</h3>
            {[["Palette", <div key="p" style={{ display: "flex", gap: 6 }}>{BRAND.palette.map(c => <span key={c} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: `1px solid ${t.border}` }} />)}</div>],
              ["Voice", <div key="v" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{BRAND.voice.map(x => <Chip t={t} key={x}>{x}</Chip>)}</div>],
              ["Audience", <Chip t={t} key="a">17–35 urban commuters</Chip>],
              ["Never say", <div key="n" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{BRAND.never.map(x => <Chip t={t} key={x} banned>{x}</Chip>)}</div>]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, width: 74, flexShrink: 0, textTransform: "uppercase" }}>{label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{val}</div>
              </div>
            ))}
          </Card>
          <Card t={t} style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, background: `linear-gradient(120deg, ${t.brain}14, ${t.brain}05)`, border: `1px solid ${t.brain}40` }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`, display: "grid", placeItems: "center", color: "#fff", flexShrink: 0 }}><Sparkles size={19} /></div>
            <div><h4 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: t.brainText, margin: 0 }}>It grows on its own</h4><p style={{ fontFamily: FONT, fontSize: 12, color: t.text2, marginTop: 2 }}>Every asset you approve is folded back in, so the brand voice sharpens with each campaign.</p></div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- ASSETS ---------------- */
function AssetsScreen({ t, nav, showToast }) {
  const [filter, setFilter] = useState("All");
  const items = [
    { name: "Spring launch — caption set", by: "Aria", byHue: "#2E6BE6", type: "COPY", date: "2h ago", g: null },
    { name: "Campaign key visual", by: "Aria", byHue: "#2E6BE6", type: "GENFY", date: "3h ago", g: "#E8552A,#c93d18" },
    { name: "Story crop — 9:16", by: "Mara", byHue: "#B84FD8", type: "EDITED", date: "1d ago", g: "#B84FD8,#8a2fa8" },
    { name: "Positioning brief", by: "Kanishk", byHue: "#E8552A", type: "STRATEGY", date: "3d ago", g: null },
    { name: "Hero — commuter shot", by: "Aria", byHue: "#2E6BE6", type: "GENFY", date: "3d ago", g: "#2FA36B,#1e7a4f" },
    { name: "Launch deck v2", by: "Kanishk", byHue: "#E8552A", type: "DECK", date: "1w ago", g: "#DE9B18,#b47a0f" },
  ];
  const list = filter === "All" ? items : items.filter(i => (filter === "Copy" ? ["COPY", "STRATEGY"].includes(i.type) : i.g));
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <Eyebrow t={t}>Approved & saved</Eyebrow>
      <H1 t={t}>Assets</H1>
      <Sub t={t}>Every approved output across tools and workflows. All of it feeds back into the Brand Brain.</Sub>
      <div style={{ display: "flex", gap: 8, marginTop: 20, marginBottom: 18 }}>
        {["All", "Copy", "Images"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 500, padding: "6px 13px", borderRadius: R.pill, cursor: "pointer", background: filter === f ? t.accentSoft : t.surface, color: filter === f ? t.accentText : t.text2, border: `1px solid ${filter === f ? t.accent : t.border}` }}>{f}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
        {list.map(a => (
          <Card t={t} key={a.name} hoverable onClick={() => showToast(`Opened “${a.name}”`)} style={{ overflow: "hidden" }}>
            {a.g ? <div style={{ aspectRatio: "4/3", background: `linear-gradient(135deg, ${a.g})`, position: "relative" }}><span style={{ position: "absolute", top: 8, left: 8, fontFamily: MONO, fontSize: 9, color: "#fff", background: "rgba(0,0,0,.4)", padding: "2px 7px", borderRadius: 5 }}>{a.type}</span><span style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: 8, background: t.success, display: "grid", placeItems: "center" }}><Check size={9} color="#fff" /></span></div>
              : <div style={{ aspectRatio: "4/3", background: t.surface2, padding: 14 }}><span style={{ fontFamily: MONO, fontSize: 9, color: t.accentText, background: t.accentSoft, padding: "2px 7px", borderRadius: 5 }}>{a.type}</span><div style={{ fontFamily: FONT, fontSize: 11.5, color: t.text3, lineHeight: 1.5, marginTop: 10 }}>The forecast doesn't get a vote. Spring Drop lands Friday — technical shells that pack down smaller than your excuses…</div></div>}
            <div style={{ padding: "11px 13px" }}>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6 }}>{a.name}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10.5, color: t.text3 }}><span style={{ width: 16, height: 16, borderRadius: 8, background: a.byHue, color: "#fff", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700 }}>{a.by[0]}</span>{a.by}</div>
                <span style={{ fontFamily: MONO, fontSize: 10, color: t.text3 }}>{a.date}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ONBOARDING OVERLAY (assemble the Brand Brain) ---------------- */
function Onboarding({ t, onClose, showToast, nav }) {
  const [step, setStep] = useState(2);
  const steps = ["Workspace", "Upload assets", "Review brand", "Ready"];
  const next = () => { if (step < 4) setStep(step + 1); else { onClose(); showToast("OFFGRID workspace created — Brand Brain live"); nav("home"); } };
  const nextLabel = step === 4 ? "Enter workspace →" : step === 3 ? "Looks right — build Brain" : "Continue";
  return (
    <div role="dialog" aria-modal="true" aria-label="Assemble the Brand Brain" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(15,12,8,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeIn .18s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: "100%", background: t.surface, borderRadius: R.xl, boxShadow: t.shadowLg, overflow: "hidden", fontFamily: FONT, animation: "slideUp .25s ease" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 26px 0" }}>
          <div><div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: t.text3 }}>Client onboarding</div><h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 21, color: t.text, margin: "4px 0 0", letterSpacing: "-.02em" }}>{step === 4 ? "Brand Brain assembled" : "Assemble the Brand Brain"}</h2></div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "none", color: t.text3, cursor: "pointer", padding: 4 }}><X size={18} /></button>
        </div>
        {/* step markers */}
        <div style={{ display: "flex", gap: 8, padding: "18px 26px", flexWrap: "wrap" }}>
          {steps.map((s, i) => { const n = i + 1, done = n < step, cur = n === step; return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 11, color: done ? t.success : cur ? t.text : t.text3 }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, background: done ? t.success : cur ? t.accent : t.surface2, color: done || cur ? "#fff" : t.text3, border: done || cur ? "none" : `1px solid ${t.border}` }}>{done ? <Check size={11} /> : n}</span>{s}
            </div>
          ); })}
        </div>

        <div style={{ padding: "6px 26px 22px", minHeight: 220 }}>
          {step === 2 && <>
            <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text, margin: "0 0 6px" }}>Upload OFFGRID's materials</h3>
            <p style={{ fontFamily: FONT, fontSize: 13, color: t.text2, lineHeight: 1.5, margin: "0 0 16px" }}>Drop in brand guidelines, tone docs and past work. Studio OS indexes them into the Brand Brain so every tool inherits the brand automatically.</p>
            <div style={{ border: `1.5px dashed ${t.borderStrong}`, borderRadius: R.md, padding: "26px 20px", textAlign: "center", background: t.surface2 }}>
              <Upload size={22} style={{ color: t.text3, marginBottom: 8 }} />
              <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: t.text }}>Drop files or browse</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, marginTop: 4 }}>PDF · DOCX · PNG · figma link · URL</div>
            </div>
            <div style={{ marginTop: 14 }}>
              {["brand-guidelines-2025.pdf", "tone-of-voice.docx"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                  <FileText size={16} style={{ color: t.text3 }} /><div style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: t.text }}>{f}</div>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, color: t.success }}><Check size={11} />Indexed</span>
                </div>
              ))}
            </div>
          </>}
          {step === 3 && <>
            <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text, margin: "0 0 6px" }}>We pulled this from the docs</h3>
            <p style={{ fontFamily: FONT, fontSize: 13, color: t.text2, lineHeight: 1.5, margin: "0 0 16px" }}>Confirm or tweak — this becomes the brand context injected into every tool.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Palette", <div key="p" style={{ display: "flex", gap: 6 }}>{BRAND.palette.map(c => <span key={c} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: `1px solid ${t.border}` }} />)}</div>],
                ["Voice", <div key="v" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{["Direct", "Gritty"].map(x => <Chip t={t} key={x}>{x}</Chip>)}</div>],
                ["Audience", <Chip t={t} key="a">17–35 urban</Chip>],
                ["Never say", <div key="n" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{["luxurious", "synergy"].map(x => <Chip t={t} key={x} banned>{x}</Chip>)}</div>]].map(([l, v]) => (
                <div key={l} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}><div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: t.text3, marginBottom: 10 }}>{l}</div>{v}</div>
              ))}
            </div>
          </>}
          {step === 4 && <div style={{ textAlign: "center", padding: "18px 0" }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`, display: "grid", placeItems: "center", margin: "0 auto 18px", boxShadow: `0 12px 30px -10px ${t.brain}` }}><Brain size={30} color="#fff" /></div>
            <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: t.text, margin: 0 }}>OFFGRID is ready</h3>
            <p style={{ fontFamily: FONT, fontSize: 13.5, color: t.text2, maxWidth: "38ch", margin: "8px auto 0", lineHeight: 1.55 }}>The Brand Brain is live. Every tool — used alone or in a workflow — now speaks in OFFGRID's voice.</p>
          </div>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 26px", borderTop: `1px solid ${t.border}`, background: t.surface2 }}>
          <button onClick={() => step > 2 && setStep(step - 1)} style={{ visibility: step > 2 ? "visible" : "hidden", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: t.text2, background: "none", border: "none", cursor: "pointer" }}>← Back</button>
          <Btn t={t} kind="dark" onClick={next}>{nextLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

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

function GenfyScreen({ t, nav, showToast }) {
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
  const [selectedModels, setSelectedModels] = useState(["Nanobanana 2"]);
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
      .catch(err => {
        showToast("Failed to fetch style catalog from BFF");
        setLoadingCatalog(false);
      });
  }, []);

  // ── Poll current session ─────────────────────────────────
  const pollTimerRef = useRef(null);

  const startPolling = (sessionId) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    
    pollTimerRef.current = setInterval(() => {
      fetch(`/bff/genfy/sessions/${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.images) {
            const allImages = data.images;
            setGeneratedImages(allImages);

            const active = allImages[0];
            if (active) {
              setActiveImage(active);
            }

            const pending = allImages.some(img => img.status === "pending");
            if (!pending) {
              clearInterval(pollTimerRef.current);
              setIsGenerating(false);
              setIsEditing(false);
              showToast("Image generation complete!");
            }
          }
        })
        .catch(err => {
          console.error("Polling error:", err);
        });
    }, 2000);
  };

  useEffect(() => {
    return () => clearInterval(pollTimerRef.current);
  }, []);

  // ── Trigger standard generation ─────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt first.");
      return;
    }

    setIsGenerating(true);
    showToast("Starting image generation session...");

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
        <SectionHeading text="Engine Config" />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: "4px 0 20px" }}>
          Image Studio
        </h2>

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

      <div
        style={{
          flex: 1,
          background: t.bg,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
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

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: 32, gap: 32 }}>
            
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

            {activeImage && (
              <div style={{ display: "flex", gap: 24, background: t.surface, padding: 24, borderRadius: 16, border: `1px solid ${t.border}` }}>
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

                  {activeImage.status === "completed" && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <Btn
                        t={t}
                        kind="secondary"
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = activeImage.url;
                          link.download = `genfy-${activeImage.id}.png`;
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
              {generatedImages.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImage(img)}
                  style={{
                    borderRadius: 10,
                    overflow: "hidden",
                    border: `2px solid ${activeImage && activeImage.id === img.id ? t.accent : "transparent"}`,
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
              ))}

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

/* ---------------- APP ROOT ---------------- */
export default function StudioOS() {
  const { t, mode, toggle } = useTheme();
  const [view, setView] = useState("home");
  const [toast, setToast] = useState(null);
  const [onb, setOnb] = useState(false);
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1300);
  const timer = useRef(null);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  const showToast = m => { clearTimeout(timer.current); setToast(m); timer.current = setTimeout(() => setToast(null), 2800); };
  const nav = id => { setView(id); const s = document.getElementById("studio-scroll"); if (s) s.scrollTo({ top: 0 }); };
  const compact = w < 1080;

  const shared = { t, nav, showToast };
  return (
    <div style={{ height: "100vh", background: t.bg, display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.45 } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform: translateY(0) } }
        @keyframes travel { from { left:-16px } to { left:100% } }
        @media (prefers-reduced-motion: reduce){ *{ animation:none!important; transition:none!important } }
        ::selection { background: ${t.accentSoft} }
        button:focus-visible { outline: 2px solid ${t.accent}; outline-offset: 2px; border-radius: 6px }
        #studio-scroll::-webkit-scrollbar { width: 10px } #studio-scroll::-webkit-scrollbar-thumb { background:${t.borderStrong}; border-radius: 20px; border: 3px solid ${t.bg} }
        @media (max-width: 1080px){ .two-col, .detail-grid { grid-template-columns: 1fr !important } }
        @media (max-width: 720px){ .proj-row { grid-template-columns: 1fr !important } }
      `}</style>

      {w > 720 && <Sidebar t={t} view={view} nav={nav} compact={compact} onboard={() => setOnb(true)} />}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar t={t} mode={mode} toggle={toggle} view={view} nav={nav} onboard={() => setOnb(true)} />
        <div id="studio-scroll" style={{ flex: 1, overflowY: "auto" }}>
          {view === "home" && <HomeScreen {...shared} />}
          {view === "tools" && <ToolsScreen {...shared} />}
          {view === "tool-detail" && <ToolDetail {...shared} />}
          {view === "workflow" && <WorkflowScreen {...shared} />}
          {view === "projects" && <ProjectsScreen {...shared} />}
          {view === "brain" && <BrainScreen {...shared} />}
          {view === "assets" && <AssetsScreen {...shared} />}
          {view === "genfy-detail" && <GenfyScreen {...shared} />}
        </div>
        {w <= 720 && (
          <nav style={{ display: "flex", background: t.sideBg, padding: "6px 4px calc(6px + env(safe-area-inset-bottom))" }}>
            {NAV.map(n => <button key={n.id} onClick={() => nav(n.id)} aria-label={n.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "7px 0", border: "none", background: "none", cursor: "pointer", color: view === n.id ? t.accent : t.sideText, fontFamily: MONO, fontSize: 9.5 }}><n.icon size={18} />{n.label.split(" ")[0]}</button>)}
          </nav>
        )}
      </div>

      {onb && <Onboarding t={t} onClose={() => setOnb(false)} showToast={showToast} nav={nav} />}
      <Toast t={t} toast={toast} />
    </div>
  );
}
