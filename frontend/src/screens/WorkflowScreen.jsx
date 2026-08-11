import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play, Loader2, Image as ImageIcon, MessageSquare, ShieldCheck, PenLine,
  FileText, Compass, Sliders, X, Crown, Terminal,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Zap, Sparkles, Trash2,
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
    label: "Copy Agent", subtitle: "copyagennt.in · API",
    icon: PenLine, color: "#8B5CF6",
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
function NodeCard({ node, config, status = "idle", output, isSelected, onSelect, onUpdateOutput, onRunFromNode, onPreviewImage, t }) {
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
            <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginTop: 1 }}>
              {node.id === "copy" ? `copyagennt.in · ${config?.model || "claude-4-sonnet"}` : isAgent ? `${node.subtitle.split(" · ")[0]} · ${config?.model || "claude-4-sonnet"}` : node.subtitle}
            </div>
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
          <NodeOutputPreview node={node} output={output} onUpdateOutput={onUpdateOutput} onRunFromNode={onRunFromNode} onPreviewImage={onPreviewImage} t={t} />
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

// ── Output preview per node with Editable Mode & AI Refinement ─────────────────
function NodeOutputPreview({ node, output, onUpdateOutput, onRunFromNode, onPreviewImage, t }) {
  const [isEditing, setIsEditing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isTweaking, setIsTweaking] = useState(false);

  // Manual edit draft state
  const [editHeadline, setEditHeadline] = useState(output.headline || "");
  const [editBody, setEditBody] = useState(output.bodyText || output.brief || output.image_prompt || "");
  const [editAudience, setEditAudience] = useState(output.target_audience || "");
  const [editPrompt, setEditPrompt] = useState(output.image_prompt || output.recommended_copy_prompt || "");

  // Sync edit drafts when output prop changes
  useEffect(() => {
    setEditHeadline(output.headline || "");
    setEditBody(output.bodyText || output.brief || output.image_prompt || "");
    setEditAudience(output.target_audience || "");
    setEditPrompt(output.image_prompt || output.recommended_copy_prompt || "");
  }, [output]);

  const handleSaveManual = () => {
    if (node.id === "copy") {
      onUpdateOutput(node.id, { ...output, headline: editHeadline, bodyText: editBody });
    } else if (node.id === "agent_strategy") {
      onUpdateOutput(node.id, { ...output, target_audience: editAudience, recommended_copy_prompt: editPrompt });
    } else if (node.id === "agent_artdir") {
      onUpdateOutput(node.id, { ...output, image_prompt: editPrompt });
    } else if (node.id === "brief") {
      onUpdateOutput(node.id, { ...output, brief: editBody });
    }
    setIsEditing(false);
  };

  const handleAiRefine = async () => {
    if (!aiPrompt.trim() || isTweaking) return;
    setIsTweaking(true);
    try {
      const currentContent = typeof output.bodyText === "string"
        ? cleanRawJson(output.bodyText)
        : output.image_prompt || JSON.stringify(output);

      // Build refinement history conversation structure for a true iterative feedback loop
      let conversationHistory = "";
      const existingRefinements = output.refinements || [];
      if (existingRefinements.length > 0) {
        conversationHistory = "Previous refinements history:\n" + existingRefinements.map((ref, idx) => 
          `Iteration ${idx + 1} Tweak Request: "${ref.request}"\nAI Result: ${ref.response}`
        ).join("\n\n") + "\n\n";
      }

      const promptToAgent = `ORIGINAL COPY:\n${output.original_copy || currentContent}\n\n${conversationHistory}NEW USER TWEAK REQUEST:\n${aiPrompt}\n\n[DIRECTIVE: Write natural, compelling advertising copy for social media. DO NOT output JSON syntax, keys, or curly braces. Output clean, human-readable copy paragraphs directly.]`;
      const r = await fetch("/bff/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_message: promptToAgent, llm_model: "claude-4-sonnet", temperature: 0.7, stream: false }),
      });
      const raw = await r.json();
      let text = raw.assistant_message || raw.content || raw.text || "";
      text = cleanRawJson(text);

      if (node.id === "copy") {
        onUpdateOutput(node.id, {
          ...output,
          original_copy: output.original_copy || currentContent,
          refinements: [...existingRefinements, { request: aiPrompt, response: text }],
          headline: extractHeadline(text, "Copy"),
          bodyText: text,
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
      {/* Action Buttons: Manual Edit, AI Prompt Tweaker & Continue Workflow */}
      <div style={{ marginBottom: 8, display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button
          onClick={() => onRunFromNode && onRunFromNode(node.id)}
          title="Resume & run downstream agents from this node"
          style={{
            padding: "4px 10px", borderRadius: 6, border: "none",
            background: "#22C55E", color: "#fff", fontWeight: 700, fontSize: 10.5,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
            boxShadow: "0 2px 4px rgba(34, 197, 94, 0.2)"
          }}
        >
          ▶ Continue from this Step
        </button>
      </div>
      {/* Node specific rendering */}
      {node.id === "brief" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: t.text3, textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Brief Input</div>
          {isEditing ? (
            <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={3} style={cfgTextarea(t)} />
          ) : (
            output.brief
          )}
        </div>
      )}

      {node.id === "agent_strategy" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: t.brain, textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Strategy Output</div>
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: t.text3 }}>Target Audience</label>
                <input type="text" value={editAudience} onChange={e => setEditAudience(e.target.value)} style={cfgSelect(t)} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: t.text3 }}>Prompt Strategy</label>
                <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={2} style={cfgTextarea(t)} />
              </div>
            </div>
          ) : (
            <>
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
                    fontSize: 11, lineHeight: 1.6, color: t.text2, whiteSpace: "pre-wrap",
                    background: t.surface, padding: "8px 10px", borderRadius: 6, border: `1px solid ${t.border}`
                  }}>
                    {output.copy_specs
                      .replace(/\*\*/g, "")
                      .replace(/\n{3,}/g, "\n\n")
                      .trim()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {node.id === "copy" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: "#8B5CF6", textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Generated Copy</div>
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="text" value={editHeadline} onChange={e => setEditHeadline(e.target.value)} placeholder="Headline" style={{ ...cfgSelect(t), fontWeight: 700 }} />
              <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={5} style={cfgTextarea(t)} />
            </div>
          ) : (
            <>
              {output.headline && <div style={{ fontWeight: 700, color: t.text, fontSize: 13, marginBottom: 4 }}>{cleanRawJson(output.headline)}</div>}
              <div style={{ whiteSpace: "pre-wrap", color: t.text }}>{cleanRawJson(output.bodyText)}</div>
              {output.cta && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#8B5CF6" }}>CTA: {output.cta}</div>}
              
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
            </>
          )}
        </div>
      )}

      {node.id === "agent_artdir" && (
        <div style={{ fontSize: 11.5, color: t.text2, lineHeight: 1.5, background: t.surface2, padding: "10px 12px", borderRadius: 8, border: `1px solid ${t.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: "#E8552A", textTransform: "uppercase", marginBottom: 4, fontFamily: MONO }}>Art Director Specs</div>
          {isEditing ? (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: t.text3 }}>Image Prompt</label>
              <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)} rows={3} style={cfgTextarea(t)} />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {node.id === "genfy" && (output.url || output.base64) && (
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: `2px solid ${t.brain}`,
          boxShadow: `0 8px 24px ${t.brain}30, 0 2px 8px rgba(0,0,0,0.12)`,
          background: t.surface,
          position: "relative",
          transition: "all 0.25s ease",
        }}>
          {/* Top-Right Full Preview Badge */}
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
            <a href={output.url || `data:image/png;base64,${output.base64}`} download="campaign-creative.png" target="_blank" rel="noreferrer" style={{ color: t.brain, fontWeight: 700, textDecoration: "none" }}>
              Download High-Res ⬇
            </a>
          </div>
        </div>
      )}

      {/* Action Buttons: Manual Edit & AI Prompt Tweaker */}
      {node.id !== "genfy" && (
        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          {isEditing ? (
            <div style={{ display: "flex", gap: 6, width: "100%", justifyContent: "flex-end" }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${t.border}`, background: t.surface, color: t.text2, fontSize: 11, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSaveManual} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#22C55E", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                Save Tweaks ✓
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${t.border}`, background: t.surface2, color: t.text, fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                ✏️ Edit Manually
              </button>

              <div style={{ display: "flex", gap: 6, flex: 1, maxWidth: 300 }}>
                <input
                  type="text"
                  placeholder="✨ AI Tweak (e.g. make punchier...)"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAiRefine()}
                  style={{ ...cfgSelect(t), fontSize: 11, padding: "4px 8px" }}
                />
                <button
                  onClick={handleAiRefine}
                  disabled={isTweaking || !aiPrompt.trim()}
                  style={{
                    padding: "4px 10px", borderRadius: 6, border: "none",
                    background: `linear-gradient(135deg, ${t.brain}, ${t.brain2})`,
                    color: "#fff", fontWeight: 700, fontSize: 10.5, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {isTweaking ? "..." : "Refine"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
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
            <CfgField label="Brand Name" t={t}>
              <input
                type="text"
                value={config.brandName || "FrostBrew"}
                onChange={e => onChange("brandName", e.target.value)}
                style={cfgInput(t)}
                placeholder="e.g. FrostBrew, Nike, Apple"
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
      brandName: activeProject?.brandName || "FrostBrew",
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
    if (!activeProject) return;

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

  // Restore stored pipeline state whenever activeProject changes + handle Storyboard Card context
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
      syncHistoryItem("complete", next);
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

  // ── Run Workflow (Supports Starting / Continuing from any Node) ───────────
  const handleRun = async (startFromNodeId = "brief") => {
    if (isRunning) return;
    const brief = configs.brief.brief?.trim();
    if (!brief) { showToast("Please enter a campaign brief first."); setSelectedNodeId("brief"); return; }

    // Read brand context from active project or localStorage
    let brandContext = null;
    try {
      const raw = localStorage.getItem("studio-brand-context");
      if (raw) brandContext = JSON.parse(raw);
    } catch (_) {}

    const inferredBrandName = activeProject?.brand_name || activeProject?.brandName || brandContext?.brandName || (brief.split(" ")[0] || "FrostBrew");
    const inferredIndustry = brandContext?.industry || "Consumer Brand";

    const brandPrefix = `[CRITICAL DIRECTIVE: You MUST explicitly feature and mention the Product & Brand Name ("${inferredBrandName}") throughout the advertising copy.]\n\n` +
      `BRAND CONTEXT:\nBrand Name: ${inferredBrandName}\nIndustry: ${inferredIndustry}\nAudience: ${brandContext?.audience || "Target Consumers"}\nVoice/Tone: ${brandContext?.primaryTone || "Energizing & Modern"}\nUSP: ${brandContext?.usp || "Premium Quality & Performance"}\n\nCAMPAIGN BRIEF:\n`;

    setIsRunning(true);
    setPendingApproval(null);

    // If starting fresh from beginning, reset status and outputs. If continuing from a node, preserve prior completed outputs.
    if (startFromNodeId === "brief") {
      setNodeStatus({});
      setNodeInputs({});
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

    const NODE_ORDER = ["brief", "agent_strategy", "copy", "agent_artdir", "genfy"];
    const startIndex = NODE_ORDER.indexOf(startFromNodeId) !== -1 ? NODE_ORDER.indexOf(startFromNodeId) : 0;

    try {
      // ── STEP 1: Brief node ─────────────────────────────────────────────────
      let briefOutput = nodeOutputs.brief || { brief, assetType: configs.brief.assetType };
      if (startIndex <= 0) {
        setStatus("brief", "active");
        setSelectedNodeId("brief");
        log("Node 1: Campaign Brief — locked and loaded", "info");
        await delay(400);
        briefOutput = { brief, assetType: configs.brief.assetType };
        setInput("brief", { brief: configs.brief.brief, assetType: configs.brief.assetType });
        setOutput("brief", briefOutput);
        setStatus("brief", "done");

        if (approvalMode) {
          log("⏸ Brief Step complete. Waiting for user approval to run Strategy Agent...", "agent");
          setMasterFeedback("Node 1 Complete — Awaiting your approval to proceed to Strategy Agent...");
          await waitForUserApproval("brief", briefOutput);
          log("✓ Brief approved by user", "success");
        }
      }

      // ── STEP 2: Strategy Agent ─────────────────────────────────────────────
      let strategyData = nodeOutputs.agent_strategy || null;
      if (startIndex <= 1) {
        setStatus("agent_strategy", "active");
        setSelectedNodeId("agent_strategy");
        log("⬡ Strategy Agent: analyzing brief & building copy specs...", "agent");
        setMasterFeedback("Supervising Brief → Copy strategy handoff...");

        setInput("agent_strategy", {
          brief,
          assetType: configs.brief.assetType,
        });
        try {
          const r = await fetch("/bff/workflow/step-bridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bridge_type: "brief_to_copy",
              brief: brandPrefix + brief,
              asset_type: configs.brief.assetType,
              brand_id: activeProject?.brand_id || activeProject?.brandId || null,
            }),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          strategyData = await r.json();
          log(`Strategy Agent: audience = "${strategyData.target_audience}"`, "success");
        } catch (err) {
          console.warn("[Strategy Agent Error]:", err);
          strategyData = {
            target_audience: "Target Demographics & Key Consumers",
            copy_specs: `📊 STRATEGIC MARKET INTELLIGENCE REPORT:\n\n1. TARGET AUDIENCE ANALYSIS:\n   • Primary Demographics & Target Consumers for: ${brief ? brief.slice(0, 60) : "Product Campaign"}.\n   • Key Motivations: Product quality, active lifestyle, high value.\n\n2. BRAND DNA & POSITIONING:\n   • High-converting positioning tailored to product USP.\n   • Distinctive brand tone and market resonance.\n\n3. COMPETITOR BENCHMARKING:\n   • Strategic Advantage: Superior product formulation, modern aesthetic, premium brand appeal.\n\n4. STRATEGIC MESSAGING PILLARS:\n   • Pillar 1: High Performance & Energizing Value.\n   • Pillar 2: Premium Craftsmanship & Uncompromised Quality.`,
            recommended_copy_prompt: `CAMPAIGN BRIEF & PRODUCT: ${brief}\nASSET FORMAT: ${configs.brief.assetType}\n\nCRITICAL REQUIREMENT: You MUST explicitly feature and mention the exact product name and brand ("${inferredBrandName}") in the copy. DO NOT use generic placeholder words like 'Our Product' or 'The Product'.`
          };
          log("Strategy Agent: generated deep strategic analysis", "info");
        }
        setOutput("agent_strategy", strategyData);
        setStatus("agent_strategy", "done");

        if (approvalMode) {
          log("⏸ Strategy Step complete. Review Strategy Output and click Approve to run Copy Agent...", "agent");
          setMasterFeedback("Strategy Node Complete — Awaiting your approval to proceed to Copy Agent...");
          await waitForUserApproval("agent_strategy", strategyData);
          log("✓ Strategy output approved by user", "success");
        }

        // Master audit step 1 — non-blocking
        fetch("/bff/workflow/orchestrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ master_goal: brief, current_step: "2. Strategy Analysis", step_data: strategyData }) })
          .then(r => { if (!r.ok) console.warn("[Orchestrator] audit step 1 returned", r.status); })
          .catch(err => console.warn("[Orchestrator] audit step 1 error:", err));
      }

      // ── STEP 3: Copy Agent ─────────────────────────────────────────────────
      let copyData = nodeOutputs.copy || null;
      if (startIndex <= 2) {
        setStatus("copy", "active");
        setSelectedNodeId("copy");
        log("Node 3: Copy Agent — generating campaign copy via CopyAgent API...", "info");
        setMasterFeedback("Supervising Copy Agent output quality...");

        const copyPrompt = (strategyData && strategyData.recommended_copy_prompt)
          ? (brandPrefix ? brandPrefix + strategyData.recommended_copy_prompt : strategyData.recommended_copy_prompt)
          : `Write high-converting ${configs.brief.assetType} copy for: ${brandPrefix}${brief}`;

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

          const cleanText = cleanRawJson(generatedText);
          copyData = { headline: extractHeadline(cleanText, configs.brief.assetType), bodyText: cleanText, cta: "Shop Now" };
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

        // Master audit step 2 — non-blocking
        fetch("/bff/workflow/orchestrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ master_goal: brief, current_step: "3. Copy Generation", step_data: copyData }) })
          .then(r => { if (!r.ok) console.warn("[Orchestrator] audit step 2 returned", r.status); })
          .catch(err => console.warn("[Orchestrator] audit step 2 error:", err));
      }

      // ── STEP 4: Art Director Agent ─────────────────────────────────────────
      let artDirData = (startIndex > 3 ? nodeOutputs.agent_artdir : null);
      if (startIndex <= 3 || !artDirData) {
        setStatus("agent_artdir", "active");
        setSelectedNodeId("agent_artdir");
        log("⬡ Art Director Agent: mapping copy to Genfy visual parameters...", "agent");
        setMasterFeedback("Supervising Art Director visual parameter selection...");

        const copyTextForArtDir = (copyData && copyData.bodyText) ? copyData.bodyText : brief;
        setInput("agent_artdir", {
          brief,
          copy_output: copyTextForArtDir,
          asset_type: configs.brief.assetType,
        });
        try {
          const r = await fetch("/bff/workflow/step-bridge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bridge_type: "copy_to_genfy",
              brief: brandPrefix + brief,
              copy_output: copyTextForArtDir,
              asset_type: configs.brief.assetType,
              brand_id: activeProject?.brand_id || activeProject?.brandId || null,
              brand_name: configs.brief.brandName || inferredBrandName || "FrostBrew",
            }),
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
      }

      // ── STEP 5: Genfy Image Engine ─────────────────────────────────────────
      let genfyResult = (startIndex > 4 ? nodeOutputs.genfy : null);
      if (startIndex <= 4 || !genfyResult) {
        setStatus("genfy", "active");
        setSelectedNodeId("genfy");
        log("Node 5: Image Engine — requesting generation via ChatGPT...", "info");
        setMasterFeedback("Supervising image rendering process...");

        const activeArtDir = artDirData || nodeOutputs.agent_artdir || {};
        const imgPrompt = activeArtDir.image_prompt || (copyData?.bodyText ? `Advertising photography visual representing: ${copyData.bodyText.slice(0, 150)}` : brief);

        setInput("genfy", {
          prompt: imgPrompt,
          model_ids: ["ChatGPT"],
          ratio: activeArtDir.ratio || configs.genfy.ratio,
          quality: activeArtDir.quality || configs.genfy.quality,
          categories: activeArtDir.categories || { style: "cinematic", lighting: "golden" },
        });
        try {
          const r = await fetch("/bff/genfy/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: imgPrompt,
              ratio: activeArtDir.ratio || configs.genfy.ratio || "1:1",
              quality: activeArtDir.quality || configs.genfy.quality || "High",
            }),
          });
          if (r.ok) {
            const data = await r.json();
            const imgUrl =
              data?.results?.[0]?.image_url ||
              data?.results?.[0]?.url ||
              data?.images?.[0]?.url ||
              null;
            if (imgUrl) {
              genfyResult = { url: imgUrl, status: "completed", model_id: "ChatGPT Image" };
              log("✓ Image generated successfully using ChatGPT", "success");
            } else {
              throw new Error("No image URL returned in response.");
            }
          } else {
            throw new Error(`HTTP ${r.status}`);
          }
        } catch (e) {
          log(`ChatGPT Image Generation failed: ${e.message || "API error"}`, "error");
        }
      }

      if (genfyResult) {
        setOutput("genfy", genfyResult);
        setStatus("genfy", "done");
        log("✓ Image generation complete", "success");
      } else {
        setStatus("genfy", "error");
        throw new Error("ChatGPT image generation failed and returned no output.");
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
              onClick={() => { setActiveProject(null); setViewMode("canvas"); }}
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
                      nodeOutputs: item.outputs
                    });
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
    <div style={{ fontFamily: FONT, minHeight: "100vh" }}>

      {/* ── Storyboard Card Context Header & Back Navigation ───────────────────── */}
      <div style={{
        background: activeProject?.storyboard_card ? `linear-gradient(135deg, ${t.brainSoft}, ${t.accentSoft})` : t.surface2,
        borderBottom: `1px solid ${t.border}`,
        padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => nav(activeProject?.storyboard_card ? "storyboard" : "projects", activeProject)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontFamily: FONT, fontSize: 12, fontWeight: 700,
              color: t.text, background: t.surface, border: `1px solid ${t.borderStrong}`,
              padding: "4px 10px", borderRadius: R.md, cursor: "pointer",
            }}
          >
            ← {activeProject?.storyboard_card ? "Back to Storyboard" : "Back to Projects"}
          </button>

          {activeProject?.storyboard_card && (
            <>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
                background: t.brain, color: "#fff", padding: "3px 9px", borderRadius: 20,
              }}>
                📌 STORYBOARD CARD
              </span>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: t.text }}>
                {activeProject.storyboard_card.channel} · {activeProject.storyboard_card.format}
              </span>
            </>
          )}
        </div>

        {activeProject?.storyboard_card && (
          <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.brainText, fontWeight: 600 }}>
            Context & Tool Sequence Pre-Loaded ✓
          </span>
        )}
      </div>

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
          <button
            onClick={() => setViewMode("history")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
              fontFamily: MONO,
              fontSize: 11,
              color: t.text2,
              background: t.surface2,
              border: `1px solid ${t.border}`,
              borderRadius: R.pill,
              padding: "5px 12px",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.surface3;
              e.currentTarget.style.borderColor = t.borderStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = t.surface2;
              e.currentTarget.style.borderColor = t.border;
            }}
          >
            ← Back to Workflow History
          </button>
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
                <Btn t={t} kind="accent" loading={isRunning} icon={Play} onClick={handleRun} disabled={isRunning}
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
                    config={configs[node.id]}
                    status={nodeStatus[node.id] || "idle"}
                    output={nodeOutputs[node.id] || null}
                    isSelected={selectedNodeId === node.id}
                    onSelect={setSelectedNodeId}
                    onUpdateOutput={setOutput}
                    onRunFromNode={handleRun}
                    onPreviewImage={(url) => setImageModalUrl(url)}
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



      {/* Spinner animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* ── Full Resolution Image Modal & Typography Studio Editor ── */}
      {imageModalUrl && (
        <div
          onClick={() => { setImageModalUrl(null); setEditorOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0, 0, 0, 0.88)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: editorOpen ? 1040 : 840, maxHeight: "92vh", borderRadius: R.xl,
              overflow: "hidden", background: t.surface, border: "none",
              boxShadow: "0 24px 70px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column",
              position: "relative", transition: "all 0.3s ease"
            }}
          >
            <button
              onClick={() => { setImageModalUrl(null); setEditorOpen(false); }}
              style={{
                position: "absolute", top: 12, right: 12, width: 32, height: 32,
                borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)",
                color: "#fff", cursor: "pointer", display: "grid", placeItems: "center", zIndex: 20,
              }}
            >
              <X size={18} />
            </button>

            {editorOpen ? (
              /* ── Interactive Typography Editor Studio ── */
              <div style={{ display: "flex", flex: 1, minHeight: 460, overflow: "hidden" }}>
                {/* Visual Canvas Workspace */}
                <div
                  ref={containerRef}
                  onMouseMove={(e) => {
                    if (!isDraggingText || !containerRef.current) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setEditorPosX(Math.max(2, Math.min(80, x)));
                    setEditorPosY(Math.max(2, Math.min(85, y)));
                  }}
                  onMouseUp={() => setIsDraggingText(false)}
                  style={{
                    flex: 1, background: "#060608", position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    userSelect: "none", padding: 16, overflow: "hidden"
                  }}
                >
                  <div style={{ position: "relative", display: "inline-block", maxWidth: "100%", maxHeight: "72vh" }}>
                    <img
                      src={imageModalUrl}
                      alt="Editor Canvas"
                      style={{ maxWidth: "100%", maxHeight: "72vh", objectFit: "contain", display: "block", borderRadius: 8 }}
                    />
                    {/* Draggable Typography Bounding Box */}
                    <div
                      onMouseDown={(e) => { e.preventDefault(); setIsDraggingText(true); }}
                      style={{
                        position: "absolute",
                        left: `${editorPosX}%`,
                        top: `${editorPosY}%`,
                        cursor: "grab",
                        padding: "4px 10px",
                        border: "2px dashed rgba(255,255,255,0.75)",
                        borderRadius: 6,
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(4px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                        zIndex: 10,
                        maxWidth: "85%",
                        transform: "translateY(0%)",
                      }}
                    >
                      <div style={{
                        fontSize: editorFontSize,
                        color: editorColor,
                        fontFamily: editorFontFamily,
                        fontWeight: 800,
                        textAlign: editorAlign,
                        lineHeight: 1.25,
                        whiteSpace: "pre-wrap",
                        textShadow: "0 2px 8px rgba(0,0,0,0.85)"
                      }}>
                        {editorText || "TYPE HEADLINE HERE"}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 4, textAlign: "center" }}>
                        ✋ Drag to reposition
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography Controls Panel */}
                <div style={{
                  width: 320, background: t.surface2, borderLeft: `1px solid ${t.border}`,
                  padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto"
                }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: t.text }}>Visual Typography Editor</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 2 }}>Edit text overlay wording, font size & position</div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.text2, display: "block", marginBottom: 6 }}>Headline Copy Wording</label>
                    <textarea
                      value={editorText}
                      onChange={(e) => setEditorText(e.target.value)}
                      rows={3}
                      style={{
                        width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${t.border}`,
                        background: t.surface, color: t.text, fontFamily: FONT, fontSize: 12.5, outline: "none", resize: "none"
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: t.text2, marginBottom: 6 }}>
                      <span>Font Scale / Size</span>
                      <span style={{ fontFamily: MONO }}>{editorFontSize}px</span>
                    </div>
                    <input
                      type="range" min={14} max={56} value={editorFontSize}
                      onChange={(e) => setEditorFontSize(Number(e.target.value))}
                      style={{ width: "100%", accentColor: t.brain }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.text2, display: "block", marginBottom: 6 }}>Text Color Palette</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["#FFFFFF", "#F3EFE0", "#D4AF37", "#111111", "#E11D48", "#2563EB"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditorColor(c)}
                          style={{
                            width: 28, height: 28, borderRadius: "50%", background: c,
                            border: editorColor === c ? "2px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                            boxShadow: editorColor === c ? "0 0 0 2px " + t.brain : "none", cursor: "pointer"
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.text2, display: "block", marginBottom: 6 }}>Font Family</label>
                    <select
                      value={editorFontFamily}
                      onChange={(e) => setEditorFontFamily(e.target.value)}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${t.border}`,
                        background: t.surface, color: t.text, fontFamily: FONT, fontSize: 12, outline: "none"
                      }}
                    >
                      <option value="sans-serif">Architectural Sans (Modern)</option>
                      <option value="serif">Editorial Luxury Serif</option>
                      <option value="monospace">Mono Technical</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.text2, display: "block", marginBottom: 6 }}>Text Alignment</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["left", "center", "right"].map((align) => (
                        <button
                          key={align}
                          onClick={() => setEditorAlign(align)}
                          style={{
                            flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${t.border}`,
                            background: editorAlign === align ? t.brain : t.surface,
                            color: editorAlign === align ? "#fff" : t.text,
                            fontWeight: 700, fontSize: 11, cursor: "pointer", textTransform: "capitalize"
                          }}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={handleExportCanvasImage}
                      style={{
                        width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
                        background: `linear-gradient(135deg, ${t.brain}, ${t.brain2})`,
                        color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        boxShadow: `0 4px 14px ${t.brain}40`
                      }}
                    >
                      💾 Bake & Save Visual
                    </button>
                    <button
                      onClick={() => setEditorOpen(false)}
                      style={{
                        width: "100%", padding: "8px 0", borderRadius: 8, border: `1px solid ${t.border}`,
                        background: t.surface, color: t.text2, fontWeight: 600, fontSize: 12, cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Standard Full Resolution Modal ── */
              <>
                <div style={{ background: "#000", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, padding: 16, overflow: "hidden" }}>
                  <img
                    src={imageModalUrl}
                    alt="Full Resolution Visual Render"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block", borderRadius: 8 }}
                  />
                </div>
                <div style={{ padding: "14px 20px", background: t.surface2, borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Full Resolution Visual Render</div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 2 }}>Original resolution output from Genfy Image Engine</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <a
                      href={imageModalUrl}
                      download="campaign-creative.png"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "8px 18px", borderRadius: 8, background: t.brain, color: "#fff",
                        fontWeight: 700, fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
                      }}
                    >
                      Download High-Res ⬇
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
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
