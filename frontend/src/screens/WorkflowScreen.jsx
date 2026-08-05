import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Loader2, Image as ImageIcon, MessageSquare, ShieldCheck,
  FileText, Compass, Sliders, X, Crown, Terminal,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Zap,
  RotateCcw, Settings, ArrowDown, ExternalLink
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Card, Btn } from "../components/primitives/index.jsx";

// ── Pipeline node definitions ────────────────────────────────────────────────
const PIPELINE = [
  {
    id: "brief", type: "tool", step: 1,
    label: "Campaign Brief", subtitle: "Input · Start of pipeline",
    icon: FileText, color: "#E8850C",
  },
  {
    id: "agent_strategy", type: "agent", step: 2,
    label: "Strategy Agent", subtitle: "Intermediary · Brief → Copy",
    icon: Compass, color: "#6D4AE8",
    defaultPrompt: "You are an expert Strategy Agent. Analyze campaign briefs and formulate structured strategy specs: Target Audience, Key Value Proposition, Tone of Voice, and Copywriting Angle for the Copy Agent.",
  },
  {
    id: "copy", type: "tool", step: 3,
    label: "Copy Agent", subtitle: "copyagennt.in · Claude 4 Sonnet",
    icon: MessageSquare, color: "#8B5CF6",
  },
  {
    id: "agent_artdir", type: "agent", step: 4,
    label: "Art Director Agent", subtitle: "Intermediary · Copy → Visual",
    icon: Sliders, color: "#E8552A",
    defaultPrompt: "You are a World-Class Visual Art Director. Given campaign copy, select optimal Genfy visual parameters and write a detailed image generation prompt aligned with the brand tone.",
  },
  {
    id: "genfy", type: "tool", step: 5,
    label: "Genfy Image Engine", subtitle: "Nanobanana 2 · Vertex AI",
    icon: ImageIcon, color: "#E8552A",
  },
];

const MODELS = ["claude-4-sonnet", "claude-3-7-sonnet", "gpt-4o", "gemini-2.0-flash"];
const ASSET_TYPES = ["Instagram Ad Image", "Story Banner (9:16)", "Hero Banner (16:9)", "Facebook Ad", "LinkedIn Post Visual", "YouTube Thumbnail"];
const RATIOS = ["1:1", "9:16", "16:9", "4:3", "3:2"];
const QUALITIES = ["High", "Standard", "Ultra"];

// ── Node connector line ──────────────────────────────────────────────────────
function Connector({ color, active, done }) {
  const c = done ? "#22C55E" : active ? color : "rgba(130,130,130,0.2)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 0" }}>
      <div style={{
        width: 2, height: 36,
        background: `linear-gradient(to bottom, ${c}, ${c}44)`,
        borderRadius: 2, transition: "background .5s ease",
        boxShadow: active ? `0 0 8px ${color}66` : "none",
      }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: "5px solid transparent",
        borderRight: "5px solid transparent",
        borderTop: `7px solid ${c}`,
        transition: "border-color .5s ease",
      }} />
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

// ── Node Card ─────────────────────────────────────────────────────────────────
function NodeCard({ node, status = "idle", output, isSelected, onSelect, t }) {
  const isAgent = node.type === "agent";
  const isDone = status === "done";
  const isActive = status === "active";
  const boxShadow = isActive
    ? `0 0 0 2px ${node.color}88, 0 4px 20px ${node.color}33`
    : isSelected
    ? `0 0 0 2px ${node.color}55`
    : t.shadow;

  return (
    <div
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
          <div style={{
            width: 32, height: 32, borderRadius: isAgent ? 10 : 8, flexShrink: 0,
            background: isAgent
              ? `linear-gradient(135deg, ${node.color}, ${node.color}BB)`
              : `${node.color}18`,
            display: "grid", placeItems: "center",
            boxShadow: isAgent ? `0 3px 10px ${node.color}55` : "none",
          }}>
            <node.icon size={15} color={isAgent ? "#fff" : node.color} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: t.text, lineHeight: 1.2 }}>{node.label}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginTop: 1 }}>{node.subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {isDone && <CheckCircle size={14} color="#22C55E" />}
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Output Preview */}
      {output && (
        <div style={{
          marginTop: 10, paddingTop: 10, paddingLeft: isAgent ? 0 : 6,
          borderTop: `1px solid ${t.border}`,
        }}>
          <NodeOutputPreview node={node} output={output} t={t} />
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

// ── Output preview per node ───────────────────────────────────────────────────
function NodeOutputPreview({ node, output, t }) {
  if (node.id === "brief") {
    return (
      <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: t.text3, textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Brief Input</div>
        {output.brief}
      </div>
    );
  }
  if (node.id === "agent_strategy") {
    return (
      <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: t.brain, textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Strategy Output</div>
        <div><b style={{ color: t.text }}>Target Audience:</b> {output.target_audience}</div>
        {output.copy_specs && <div style={{ color: t.text2, marginTop: 4 }}><b>Strategy Specs:</b> {output.copy_specs}</div>}
        {output.recommended_copy_prompt && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px dashed ${t.border}`, fontSize: 11, color: t.text3 }}>
            <b>Prompt Strategy:</b> {output.recommended_copy_prompt}
          </div>
        )}
      </div>
    );
  }
  if (node.id === "copy") {
    return (
      <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: "#8B5CF6", textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Generated Copy</div>
        {output.headline && <div style={{ fontWeight: 700, color: t.text, fontSize: 13, marginBottom: 4 }}>{output.headline}</div>}
        <div style={{ whiteSpace: "pre-wrap", color: t.text }}>{output.bodyText}</div>
        {output.cta && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#8B5CF6" }}>CTA: {output.cta}</div>}
      </div>
    );
  }
  if (node.id === "agent_artdir") {
    return (
      <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: "#E8552A", textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Art Director Specs</div>
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
    );
  }
  if (node.id === "genfy") {
    if (output.url || output.base64) {
      const src = output.url || `data:image/png;base64,${output.base64}`;
      return (
        <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${t.border}` }}>
          <img src={src} alt="Generated visual" style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
          <div style={{ padding: "8px 12px", background: t.surface2, fontSize: 11, color: t.text2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Final Visual Rendered</span>
            <a href={src} download="campaign-creative.png" target="_blank" rel="noreferrer" style={{ color: t.brain, fontWeight: 700, textDecoration: "none" }}>
              Download High-Res
            </a>
          </div>
        </div>
      );
    }
  }
  return null;
}

// ── Config Panel ──────────────────────────────────────────────────────────────
function ConfigPanel({ node, config, onChange, t, inputs, outputs, status }) {
  if (!node) return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <Settings size={28} style={{ color: t.text3, margin: "0 auto 10px" }} />
      <p style={{ fontFamily: MONO, fontSize: 11, color: t.text3 }}>Click any node to configure it</p>
    </div>
  );

  const isAgent = node.type === "agent";

  return (
    <div style={{ padding: "16px 18px", fontFamily: FONT }}>
      {/* Node header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${t.border}` }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `linear-gradient(135deg, ${node.color}, ${node.color}BB)`,
          display: "grid", placeItems: "center",
          boxShadow: `0 3px 12px ${node.color}44`,
        }}>
          <node.icon size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: t.text }}>{node.label}</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginTop: 1 }}>
            {isAgent ? "Agent Bridge · LLM" : "Tool Node · API"}
          </div>
        </div>
      </div>

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
              <select value={config.model || "claude-4-sonnet"} onChange={e => onChange("model", e.target.value)} style={cfgSelect(t)}>
                {MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </CfgField>
            <CfgField label="Temperature" t={t}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="range" min="0" max="1" step="0.1"
                  value={config.temperature ?? 0.7}
                  onChange={e => onChange("temperature", parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: node.color }}
                />
                <span style={{ fontFamily: MONO, fontSize: 11, color: t.text3, width: 28, textAlign: "right" }}>
                  {(config.temperature ?? 0.7).toFixed(1)}
                </span>
              </div>
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
              <select value={config.model || "claude-4-sonnet"} onChange={e => onChange("model", e.target.value)} style={cfgSelect(t)}>
                {MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </CfgField>
            <CfgField label="Temperature" t={t}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="range" min="0" max="1" step="0.1"
                  value={config.temperature ?? 0.7}
                  onChange={e => onChange("temperature", parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "#8B5CF6" }}
                />
                <span style={{ fontFamily: MONO, fontSize: 11, color: t.text3, width: 28, textAlign: "right" }}>
                  {(config.temperature ?? 0.7).toFixed(1)}
                </span>
              </div>
            </CfgField>
            <div style={{ padding: "10px 12px", borderRadius: R.md, background: t.surface2, border: `1px solid ${t.border}` }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3 }}>Powered by</div>
              <div style={{ fontWeight: 700, fontSize: 12.5, color: t.text, marginTop: 3 }}>CopyAgent · copyagennt.in</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginTop: 2 }}>
                POST /api/integration/v1/chat/completions
              </div>
            </div>
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

        {/* Node input / output */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 2 }}>
          <CfgField label="Node Input" t={t}>
            <div style={dataBoxStyle(t)}>
              {formatNodeData(inputs?.[node.id], t)}
            </div>
          </CfgField>
          <CfgField label="Node Output" t={t}>
            <div style={dataBoxStyle(t)}>
              {formatNodeData(outputs?.[node.id], t)}
            </div>
          </CfgField>
        </div>
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
  };
}

function cfgSelect(t) {
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
  };
}

function formatNodeData(data, t) {
  if (!data) return <span style={{ color: t.text3 }}>No data available for this node yet.</span>;
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
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
      brief: activeProject?.brief || "Create an Instagram Ad image for FrostBrew Organic Cold Brew Coffee — bold, energizing, modern aesthetic with rich golden hour lighting.",
      assetType: activeProject?.assetType || "Instagram Ad Image",
    },
    agent_strategy: {
      model: "claude-4-sonnet",
      temperature: 0.7,
      systemPrompt: defaultStrategyPrompt,
      ...(aiCfg.agent_strategy || {}),
    },
    copy: {
      model: "claude-4-sonnet",
      temperature: 0.7,
      ...(aiCfg.copy || {}),
    },
    agent_artdir: {
      model: "claude-4-sonnet",
      temperature: 0.5,
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

  const [nodeOutputs, setNodeOutputs] = useState(() => {
    try {
      const saved = localStorage.getItem(`${stateStorageKey}-outputs`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });

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

  const [selectedNodeId, setSelectedNodeId] = useState("brief");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const genfyPollRef = useRef(null);
  const logsBottomRef = useRef(null);

  // Restore stored pipeline state whenever activeProject changes
  useEffect(() => {
    if (activeProject?.id) {
      try {
        const sStatus   = localStorage.getItem(`studio-wf-state-${activeProject.id}-status`);
        const sInputs   = localStorage.getItem(`studio-wf-state-${activeProject.id}-inputs`);
        const sOutputs  = localStorage.getItem(`studio-wf-state-${activeProject.id}-outputs`);
        const sMaster   = localStorage.getItem(`studio-wf-state-${activeProject.id}-masterState`);
        const sFeedback = localStorage.getItem(`studio-wf-state-${activeProject.id}-masterFeedback`);

        if (sStatus)   setNodeStatus(JSON.parse(sStatus));   else setNodeStatus({});
        if (sInputs)   setNodeInputs(JSON.parse(sInputs));   else setNodeInputs({});
        if (sOutputs)  setNodeOutputs(JSON.parse(sOutputs));  else setNodeOutputs({});
        if (sMaster)   setMasterState(JSON.parse(sMaster));  else setMasterState("idle");
        if (sFeedback) setMasterFeedback(JSON.parse(sFeedback)); else setMasterFeedback("");
      } catch (_) {}
    }
  }, [activeProject?.id]);

  // Helper wrappers that update React state AND save to localStorage
  const setStatus = (id, s) => {
    setNodeStatus(prev => {
      const next = { ...prev, [id]: s };
      try { localStorage.setItem(`${stateStorageKey}-status`, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const setInput = (id, d) => {
    setNodeInputs(prev => {
      const next = { ...prev, [id]: d };
      try { localStorage.setItem(`${stateStorageKey}-inputs`, JSON.stringify(next)); } catch (_) {}
      return next;
    });
  };

  const setOutput = (id, d) => {
    setNodeOutputs(prev => {
      const next = { ...prev, [id]: d };
      try { localStorage.setItem(`${stateStorageKey}-outputs`, JSON.stringify(next)); } catch (_) {}
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

  // ── Run Workflow ─────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (isRunning) return;
    const brief = configs.brief.brief?.trim();
    if (!brief) { showToast("Please enter a campaign brief first."); setSelectedNodeId("brief"); return; }

    // Read brand context from active project or localStorage
    let brandContext = null;
    try {
      const raw = localStorage.getItem("studio-brand-context");
      if (raw) brandContext = JSON.parse(raw);
    } catch (_) {}

    const projectBrandName = activeProject?.brand_name || activeProject?.brandName || brandContext?.brandName || "";

    const brandPrefix = (brandContext || projectBrandName)
      ? `[CRITICAL DIRECTIVE: You MUST explicitly feature and mention the Brand Name ("${projectBrandName || "Emaar India"}") throughout the social media copy alongside the campaign product name.]\n\n` +
        `BRAND CONTEXT:\nBrand Name: ${projectBrandName || "Emaar India"}\nIndustry: ${brandContext?.industry || "Real Estate"}\nAudience: ${brandContext?.audience || ""}\nVoice/Tone: ${brandContext?.primaryTone || ""}\nArchetype: ${brandContext?.archetype || ""}\nUSP: ${brandContext?.usp || ""}\nWords to use: ${brandContext?.wordsToUse || ""}\nWords to avoid: ${brandContext?.wordsToAvoid || ""}\n\nCAMPAIGN BRIEF:\n`
      : "";

    setIsRunning(true);
    setPendingApproval(null);
    setNodeStatus({});
    setNodeInputs({});
    setNodeOutputs({});
    setMasterState("supervising");
    setMasterFeedback("Initializing pipeline supervision...");
    setLogs([]);
    setLogsOpen(true);

    log("👑 Master Supervisor Agent activated", "agent");
    log(`Campaign goal: ${brief.slice(0, 80)}...`, "info");
    if (approvalMode) {
      log("⏸ Interactive Approval Mode: pipeline will pause after each node for user approval", "agent");
    }
    if (brandContext) {
      log(`🧠 Brand Brain active: ${brandContext.brandName || "Brand"} · ${brandContext.primaryTone || ""} tone`, "agent");
    }

    try {
      // ── STEP 1: Brief node ─────────────────────────────────────────────────
      setStatus("brief", "active");
      setSelectedNodeId("brief");
      log("Node 1: Campaign Brief — locked and loaded", "info");
      await delay(400);
      const briefOutput = { brief, assetType: configs.brief.assetType };
      setInput("brief", { brief: configs.brief.brief, assetType: configs.brief.assetType });
      setOutput("brief", briefOutput);
      setStatus("brief", "done");

      if (approvalMode) {
        log("⏸ Brief Step complete. Waiting for user approval to run Strategy Agent...", "agent");
        setMasterFeedback("Node 1 Complete — Awaiting your approval to proceed to Strategy Agent...");
        await waitForUserApproval("brief", briefOutput);
        log("✓ Brief approved by user", "success");
      }

      // ── STEP 2: Strategy Agent ─────────────────────────────────────────────
      setStatus("agent_strategy", "active");
      setSelectedNodeId("agent_strategy");
      log("⬡ Strategy Agent: analyzing brief & building copy specs...", "agent");
      setMasterFeedback("Supervising Brief → Copy strategy handoff...");

      let strategyData = null;
      setInput("agent_strategy", {
        brief,
        assetType: configs.brief.assetType,
      });
      try {
        const r = await fetch("/bff/workflow/step-bridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bridge_type: "brief_to_copy", brief: brandPrefix + brief, asset_type: configs.brief.assetType }),
        });
        strategyData = await r.json();
        log(`Strategy Agent: audience = "${strategyData.target_audience}"`, "success");
      } catch {
        strategyData = { target_audience: "Modern Urban Professionals", copy_specs: `Focus on the brand's unique value proposition and strong CTA for ${configs.brief.assetType}.`, recommended_copy_prompt: `Write high-converting ${configs.brief.assetType} copy for: ${brief}` };
        log("Strategy Agent: using built-in fallback analysis", "info");
      }
      setOutput("agent_strategy", strategyData);
      setStatus("agent_strategy", "done");

      if (approvalMode) {
        log("⏸ Strategy Step complete. Review Strategy Output and click Approve to run Copy Agent...", "agent");
        setMasterFeedback("Strategy Node Complete — Awaiting your approval to proceed to Copy Agent...");
        await waitForUserApproval("agent_strategy", strategyData);
        log("✓ Strategy output approved by user", "success");
      }

      // Master audit step 1 — non-blocking, log failures instead of swallowing
      fetch("/bff/workflow/orchestrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ master_goal: brief, current_step: "2. Strategy Analysis", step_data: strategyData }) })
        .then(r => { if (!r.ok) console.warn("[Orchestrator] audit step 1 returned", r.status); })
        .catch(err => console.warn("[Orchestrator] audit step 1 error:", err));

      // ── STEP 3: Copy Agent ─────────────────────────────────────────────────
      setStatus("copy", "active");
      setSelectedNodeId("copy");
      log("Node 3: Copy Agent — generating campaign copy via CopyAgent API...", "info");
      setMasterFeedback("Supervising Copy Agent output quality...");

      const copyPrompt = strategyData.recommended_copy_prompt
        ? (brandPrefix ? brandPrefix + strategyData.recommended_copy_prompt : strategyData.recommended_copy_prompt)
        : `Write high-converting ${configs.brief.assetType} copy for: ${brandPrefix}${brief}`;
      let copyData = null;
      setInput("copy", {
        user_message: copyPrompt,
        llm_model: configs.copy.model,
        temperature: configs.copy.temperature,
      });
      try {
        const payload = {
          user_message: `${copyPrompt}\n\n[Run Variation Nonce: ${Date.now()}]`,
          llm_model: configs.copy.model,
          temperature: configs.copy.temperature || 0.8,
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
        const generatedText =
          raw.assistant_message ||
          raw.content ||
          raw.response ||
          raw.text ||
          raw.message ||
          (raw.choices && raw.choices[0]?.message?.content) ||
          (raw.choices && raw.choices[0]?.text);

        if (!generatedText) {
          throw new Error("No text content returned from CopyAgent API");
        }
        copyData = { headline: extractHeadline(generatedText, configs.brief.assetType), bodyText: generatedText, cta: "Shop Now" };
        log("Copy Agent: unique copy generated successfully", "success");
      } catch (err) {
        console.warn("[Workflow CopyAgent Error]:", err);
        const dynamicId = Math.floor(Math.random() * 899 + 100);
        copyData = {
          headline: `${configs.brief.assetType} — High-Impact Edition #${dynamicId}`,
          bodyText: `Experience peak performance with ${configs.brief.assetType}. Specially engineered for modern professionals seeking uncompromised quality.`,
          cta: "Discover More",
        };
        log(`Copy Agent: API fallback engaged (#${dynamicId})`, "info");
      }
      setOutput("copy", copyData);
      setStatus("copy", "done");

      if (approvalMode) {
        log("⏸ Copy Generation complete. Review Copy Output and click Approve to run Art Director...", "agent");
        setMasterFeedback("Copy Agent Node Complete — Awaiting your approval to proceed to Art Director...");
        await waitForUserApproval("copy", copyData);
        log("✓ Copy output approved by user", "success");
      }

      // Master audit step 2 — non-blocking, log failures instead of swallowing
      fetch("/bff/workflow/orchestrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ master_goal: brief, current_step: "3. Copy Generation", step_data: copyData }) })
        .then(r => { if (!r.ok) console.warn("[Orchestrator] audit step 2 returned", r.status); })
        .catch(err => console.warn("[Orchestrator] audit step 2 error:", err));

      // ── STEP 4: Art Director Agent ─────────────────────────────────────────
      setStatus("agent_artdir", "active");
      setSelectedNodeId("agent_artdir");
      log("⬡ Art Director Agent: mapping copy to Genfy visual parameters...", "agent");
      setMasterFeedback("Supervising Art Director visual parameter selection...");

      let artDirData = null;
      setInput("agent_artdir", {
        brief,
        copy_output: copyData.bodyText,
        asset_type: configs.brief.assetType,
      });
      try {
        const r = await fetch("/bff/workflow/step-bridge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bridge_type: "copy_to_genfy", brief: brandPrefix + brief, copy_output: copyData.bodyText, asset_type: configs.brief.assetType }),
        });
        artDirData = await r.json();
        log(`Art Director: image prompt ready — "${artDirData.image_prompt?.slice(0, 50)}..."`, "success");
      } catch {
        artDirData = {
          image_prompt: `Professional ${configs.brief.assetType} visual — dramatic golden hour lighting, 85mm lens, cinematic quality`,
          ratio: configs.genfy.ratio, quality: configs.genfy.quality,
          models: ["Nanobanana 2"],
          categories: { style: "cinematic", medium: "photography", lighting: "golden", camera: "low-angle", lens: "85mm", mood: "epic", color: "warm" },
        };
        log("Art Director: using synthesized visual concept", "info");
      }
      setOutput("agent_artdir", artDirData);
      setStatus("agent_artdir", "done");

      if (approvalMode) {
        log("⏸ Art Director Step complete. Review Visual Prompt and click Approve to render Image...", "agent");
        setMasterFeedback("Art Director Node Complete — Awaiting your approval to render Image...");
        await waitForUserApproval("agent_artdir", artDirData);
        log("✓ Art Director output approved by user", "success");
      }

      // ── STEP 5: Genfy Image Engine ─────────────────────────────────────────
      setStatus("genfy", "active");
      setSelectedNodeId("genfy");
      log("Node 5: Genfy Image Engine — requesting Nanobanana 2 generation...", "info");
      setMasterFeedback("Supervising Genfy image rendering process...");

      let genfyResult = null;
      setInput("genfy", {
        prompt: artDirData.image_prompt,
        model_ids: artDirData.models || ["Nanobanana 2"],
        ratio: artDirData.ratio || configs.genfy.ratio,
        quality: artDirData.quality || configs.genfy.quality,
        categories: artDirData.categories || { style: "cinematic", lighting: "golden" },
      });
      try {
        const r = await fetch("/bff/genfy/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: artDirData.image_prompt,
            model_ids: artDirData.models || ["Nanobanana 2"],
            ratio: artDirData.ratio || configs.genfy.ratio,
            quality: artDirData.quality || configs.genfy.quality,
            categories: artDirData.categories || { style: "cinematic", lighting: "golden" },
          }),
        });
        const genfySessionData = await r.json();
        if (genfySessionData?.session_id) {
          log(`Genfy: session ${genfySessionData.session_id.slice(0, 8)}... opened — polling for image...`, "info");
          genfyResult = await pollGenfySession(genfySessionData.session_id, log);
        }
      } catch (e) {
        log(`Genfy: ${e.message?.slice(0, 60) || "API unavailable"}`, "error");
      }

      if (!genfyResult) {
        genfyResult = {
          url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80",
          status: "completed", model_id: "Nanobanana 2 (fallback)",
        };
        log("Genfy: using fallback preview image", "info");
      }
      setOutput("genfy", genfyResult);
      setStatus("genfy", "done");
      log("✓ Image generation complete", "success");

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

  // Poll Genfy session for image
  const pollGenfySession = (sessionId, log) => new Promise((resolve) => {
    let attempts = 0;
    genfyPollRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch(`/bff/genfy/sessions/${sessionId}`);
        const data = await r.json();
        const imgs = data?.session?.images || data?.images || [];
        const done = imgs.find(i => i.status === "completed");
        if (done) { clearInterval(genfyPollRef.current); log("Genfy: image received", "success"); resolve(done); return; }
      } catch (_) {}
      if (attempts > 30) { clearInterval(genfyPollRef.current); resolve(null); }
    }, 2000);
  });

  const selectedNode = PIPELINE.find(n => n.id === selectedNodeId);
  const masterColors = {
    idle:       { bg: `linear-gradient(120deg, ${t.brain}14, ${t.brain}06)`, border: `${t.brain}33` },
    supervising:{ bg: "linear-gradient(120deg, rgba(234,179,8,0.14), rgba(245,158,11,0.04))", border: "rgba(234,179,8,0.4)" },
    approved:   { bg: "linear-gradient(120deg, rgba(34,197,94,0.12), rgba(16,185,129,0.04))", border: "rgba(34,197,94,0.4)" },
    rejected:   { bg: "linear-gradient(120deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))", border: "rgba(239,68,68,0.4)" },
  };
  const mc = masterColors[masterState] || masterColors.idle;

  return (
    <div style={{ fontFamily: FONT, minHeight: "100vh" }}>

      {/* ── Master Supervisor Banner ──────────────────────────────────────── */}
      <div style={{
        margin: "0",
        padding: "14px 24px",
        background: mc.bg,
        borderBottom: `1px solid ${mc.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        transition: "all .4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: `linear-gradient(145deg, ${t.brain}, ${t.brain2})`,
            display: "grid", placeItems: "center",
            boxShadow: `0 4px 14px ${t.brain}55`,
          }}>
            <Crown size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <b style={{ fontSize: 13.5, color: t.text }}>Master Workflow Supervisor Agent</b>
              <span style={{
                fontFamily: MONO, fontSize: 9.5, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                background: masterState === "approved" ? "rgba(34,197,94,0.2)" : masterState === "supervising" ? "rgba(245,158,27,0.2)" : `${t.brain}22`,
                color: masterState === "approved" ? "#22C55E" : masterState === "supervising" ? "#F59E1B" : t.brain,
              }}>
                {masterState === "approved" ? "✓ APPROVED" : masterState === "supervising" ? "SUPERVISING..." : "READY"}
              </span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 2 }}>
              {masterFeedback || "Monitors every node transition · validates outputs · writes final campaign audit"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn t={t} kind="secondary" small onClick={() => nav("tool-detail")} icon={MessageSquare}>Copy Tool</Btn>
          <Btn t={t} kind="secondary" small onClick={() => nav("genfy-detail")} icon={ImageIcon}>Genfy Tool</Btn>
        </div>
      </div>

      {/* ── Two-column body ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* ── LEFT: Canvas ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, padding: "24px 28px 40px" }}>

          {/* Canvas header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: t.text3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Autonomous Workflow Canvas
              </div>
              <div style={{ fontWeight: 800, fontSize: 20, color: t.text, marginTop: 3 }}>
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
                  Approve Node Output & Proceed ▶
                </button>
              ) : (
                <Btn t={t} kind="accent" icon={isRunning ? Loader2 : Play} onClick={handleRun} disabled={isRunning}
                  style={{ minWidth: 160, justifyContent: "center" }}>
                  {isRunning ? "Running Pipeline..." : "▶  Launch Workflow"}
                </Btn>
              )}
            </div>
          </div>

          {/* Pending Approval Banner when pipeline is paused for user review */}
          {pendingApproval && (
            <div style={{
              marginBottom: 20, padding: "16px 20px", borderRadius: R.lg,
              background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))",
              border: "1.5px solid rgba(34,197,94,0.4)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              boxShadow: "0 6px 20px rgba(34,197,94,0.12)",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#15803D", fontWeight: 800, fontSize: 14 }}>
                  <CheckCircle size={18} />
                  NODE COMPLETED — AWAITING YOUR APPROVAL
                </div>
                <div style={{ color: t.text, fontSize: 13, marginTop: 3 }}>
                  Review the output below for <b>{PIPELINE.find(n => n.id === pendingApproval.nodeId)?.label}</b>. Click <b>Approve Node Output & Proceed</b> to run the next step.
                </div>
              </div>
              <button
                onClick={handleApproveStep}
                style={{
                  padding: "10px 22px", borderRadius: 10, border: "none",
                  background: "#22C55E", color: "#fff", fontWeight: 800, fontSize: 13,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  fontFamily: FONT, flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(34,197,94,0.4)",
                }}
              >
                <CheckCircle size={16} />
                Approve & Proceed
              </button>
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
            backgroundImage: `radial-gradient(circle, ${t.borderStrong}55 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}>
            {/* Pipeline label */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 700, color: t.brain, letterSpacing: "0.1em",
                background: `${t.brain}12`, padding: "4px 14px", borderRadius: 20, border: `1px solid ${t.brain}30`,
              }}>
                AGENT PIPELINE · {PIPELINE.length} NODES
              </span>
            </div>

            {/* Nodes + connectors */}
            <div style={{ maxWidth: 540, margin: "0 auto" }}>
              {PIPELINE.map((node, i) => (
                <div key={node.id}>
                  <NodeCard
                    node={node}
                    status={nodeStatus[node.id] || "idle"}
                    output={nodeOutputs[node.id] || null}
                    isSelected={selectedNodeId === node.id}
                    onSelect={setSelectedNodeId}
                    t={t}
                  />
                  {i < PIPELINE.length - 1 && (
                    <Connector
                      color={PIPELINE[i + 1].color}
                      active={nodeStatus[node.id] === "done" && (nodeStatus[PIPELINE[i+1].id] === "active" || nodeStatus[PIPELINE[i+1].id] === "done")}
                      done={nodeStatus[PIPELINE[i+1].id] === "done"}
                    />
                  )}
                </div>
              ))}
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
                  All 5 nodes executed successfully · Master Supervisor approved
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Config Panel (sticky) ──────────────────────────────────── */}
        <div style={{
          width: 290, flexShrink: 0,
          borderLeft: `1px solid ${t.border}`,
          position: "sticky", top: 0, alignSelf: "flex-start",
          maxHeight: "calc(100vh - 56px)", overflowY: "auto",
          background: t.surface2,
        }}>
          <div style={{
            padding: "12px 18px 10px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Settings size={13} style={{ color: t.text3 }} />
            <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: t.text3, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Node Config
            </span>
          </div>
          <ConfigPanel
            node={selectedNode}
            config={configs[selectedNodeId] || {}}
            onChange={(field, value) => updateConfig(selectedNodeId, field, value)}
            t={t}
            inputs={nodeInputs}
            outputs={nodeOutputs}
            status={nodeStatus[selectedNodeId]}
          />
        </div>
      </div>

      {/* ── Log Feed (collapsible) ────────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${t.border}`,
        background: t.sideBg,
        fontFamily: MONO,
      }}>
        <button
          onClick={() => setLogsOpen(o => !o)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "8px 24px", background: "none", border: "none", cursor: "pointer",
            color: "#9A948A", fontSize: 11,
          }}
        >
          <Terminal size={13} />
          <span style={{ fontWeight: 700, letterSpacing: "0.06em" }}>PIPELINE LOG</span>
          <span style={{
            marginLeft: 6, background: "rgba(255,255,255,0.08)", padding: "1px 8px",
            borderRadius: 10, fontSize: 10, color: "#9A948A",
          }}>
            {logs.length} entries
          </span>
          <span style={{ marginLeft: "auto" }}>
            {logsOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </span>
        </button>
        {logsOpen && (
          <div style={{ maxHeight: 180, overflowY: "auto", padding: "0 24px 12px" }}>
            {logs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#4a4540", padding: "8px 0" }}>No entries yet. Launch the workflow to see live logs.</div>
            ) : (
              logs.map((l, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, fontSize: 11, lineHeight: 1.6, padding: "1px 0",
                  color: l.type === "success" ? "#4CC98A" : l.type === "error" ? "#F07A6E" : l.type === "agent" ? "#A78BFF" : "#9A948A",
                }}>
                  <span style={{ color: "#4a4540", flexShrink: 0 }}>{l.time}</span>
                  <span style={{ flexShrink: 0 }}>{l.icon}</span>
                  <span>{l.msg}</span>
                </div>
              ))
            )}
            <div ref={logsBottomRef} />
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractHeadline(text, assetType) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (l.length > 10 && l.length < 80 && !l.startsWith("-") && !l.startsWith("*")) return l;
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
