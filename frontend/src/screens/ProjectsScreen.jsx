import { useState, useEffect } from "react";
import { Plus, X, Zap, Clock, Trash2, ChevronRight, FolderOpen, Sparkles, Brain, CheckCircle, Loader2 } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Card, Btn, Eyebrow, H1 } from "../components/primitives/index.jsx";

const ASSET_TYPES = [
  "Instagram Ad Image",
  "Story Banner (9:16)",
  "Hero Banner (16:9)",
  "Facebook Ad",
  "LinkedIn Post Visual",
  "YouTube Thumbnail",
  "Email Header",
];

function timeSince(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_COLORS = {
  draft:    { bg: "rgba(232, 133, 12, 0.12)", text: "#E8850C" },
  running:  { bg: "rgba(109, 74, 232, 0.12)", text: "#6D4AE8" },
  complete: { bg: "rgba(34, 197, 94, 0.12)",  text: "#22C55E" },
};

export default function ProjectsScreen({ t, nav, showToast, setActiveProject }) {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", brief: "", assetType: "Instagram Ad Image" });
  const [nameError, setNameError] = useState(false);
  const [briefError, setBriefError] = useState(false);
  const [aiPhase, setAiPhase] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  // Load projects from server on mount
  useEffect(() => {
    fetch("/bff/projects", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setProjects(Array.isArray(data) ? data : []); })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  const handleCreate = async () => {
    setNameError(!form.name.trim());
    setBriefError(!form.brief.trim());
    if (!form.name.trim() || !form.brief.trim()) return;

    setAiPhase("analyzing");
    setAiResult(null);

    let workflowConfig = null;
    try {
      setAiPhase("designing");
      const res = await fetch("/bff/workflow/analyze-brief", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: form.brief.trim(),
          asset_type: form.assetType,
          project_name: form.name.trim(),
        }),
      });
      if (res.ok) {
        workflowConfig = await res.json();
        setAiResult(workflowConfig);
        setAiPhase("done");
        // 800ms so user sees the "✅ Workflow configured!" confirmation before navigating
        await delay(800);
      }
    } catch (err) {
      console.warn("[AI Workflow Designer] Error:", err);
    }

    // Save to server
    try {
      const res = await fetch("/bff/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          brief: form.brief.trim(),
          asset_type: form.assetType,
          workflow_config: workflowConfig,
        }),
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects(prev => [newProject, ...prev]);
        setShowModal(false);
        setAiPhase(null);
        setAiResult(null);
        setForm({ name: "", brief: "", assetType: "Instagram Ad Image" });
        setNameError(false);
        setBriefError(false);
        showToast(`✨ "${newProject.name}" configured by AI — opening canvas...`);
        setActiveProject(newProject);
        nav("workflow", newProject);
      } else {
        throw new Error("Failed to save project");
      }
    } catch (err) {
      showToast("Failed to save project. Please try again.");
      setAiPhase(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`/bff/projects/${id}`, { method: "DELETE", credentials: "include" });
      setProjects(prev => prev.filter(p => p.id !== id));
      showToast("Project removed.");
    } catch {
      showToast("Failed to delete project.");
    }
  };

  const openProject = (project) => {
    setActiveProject(project);
    nav("workflow", project);
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <Eyebrow t={t}>Mode 02 · Orchestrated</Eyebrow>
          <H1 t={t}>Projects</H1>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: t.text2, marginTop: 6, lineHeight: 1.5 }}>
            Each project holds your campaign brief and runs it through the full multi-agent workflow pipeline.
          </p>
        </div>
        <Btn t={t} kind="dark" icon={Plus} onClick={() => setShowModal(true)}>
          New Project
        </Btn>
      </div>

      {/* Project list */}
      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        {loadingProjects ? (
          <Card t={t} style={{ padding: "48px 32px", textAlign: "center" }}>
            <Loader2 size={24} style={{ color: t.text3, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontFamily: FONT, fontSize: 13, color: t.text3 }}>Loading projects...</div>
          </Card>
        ) : projects.length === 0 ? (
          <Card t={t} style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
              background: `linear-gradient(135deg, ${t.accent}20, ${t.brain}10)`,
              border: `1px solid ${t.border}`,
              display: "grid", placeItems: "center",
            }}>
              <FolderOpen size={28} style={{ color: t.text3 }} />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17, color: t.text }}>No projects yet</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: t.text3, marginTop: 6, maxWidth: 340, margin: "6px auto 0" }}>
              Create your first project to launch a multi-agent campaign workflow — Brief → Copy Agent → Image Engine.
            </div>
            <Btn t={t} kind="accent" icon={Sparkles} onClick={() => setShowModal(true)}
              style={{ marginTop: 20, display: "inline-flex" }}>
              Create First Project
            </Btn>
          </Card>
        ) : (
          projects.map((p) => {
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
            return (
              <Card key={p.id} t={t} hoverable onClick={() => openProject(p)}
                style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>

                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${t.accent}20, ${t.accent}06)`,
                  border: `1px solid ${t.accent}30`,
                  display: "grid", placeItems: "center",
                }}>
                  <Zap size={20} style={{ color: t.accent }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{p.name}</div>
                  <div style={{
                    fontSize: 12.5, color: t.text2, marginTop: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.brief}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} /> {timeSince(p.createdAt)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{p.assetType}</span>
                  </div>
                </div>

                {/* Status + Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
                    background: sc.bg, color: sc.text,
                  }}>
                    ● {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                  <button onClick={(e) => handleDelete(e, p.id)}
                    title="Delete project"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: t.text3, padding: "5px", borderRadius: 6, display: "flex",
                      transition: "color .15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                    onMouseLeave={e => e.currentTarget.style.color = t.text3}>
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} style={{ color: t.text3 }} />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Create Project Modal ─────────────────────────────────── */}
      {showModal && (
        <div
          onClick={() => { if (!aiPhase) { setShowModal(false); setAiPhase(null); setAiResult(null); } }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            cursor: aiPhase ? "wait" : "default",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 520, background: t.surface, borderRadius: R.xl,
              border: `1px solid ${t.border}`, boxShadow: t.shadowLg, padding: 28, fontFamily: FONT,
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${t.accent}, ${t.brain})`,
                    display: "grid", placeItems: "center",
                  }}>
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 17, color: t.text }}>New Campaign Project</span>
                </div>
                <p style={{ fontSize: 12.5, color: t.text3, margin: 0, paddingLeft: 40 }}>
                  Opens the multi-agent workflow canvas with your brief pre-loaded.
                </p>
              </div>
              <button
                onClick={() => { if (!aiPhase) { setShowModal(false); setAiPhase(null); setAiResult(null); } }}
                disabled={!!aiPhase}
                style={{ background: "none", border: "none", cursor: aiPhase ? "not-allowed" : "pointer", color: aiPhase ? t.text3 + "55" : t.text3, padding: 4, marginTop: -2, transition: "color .15s" }}>
                <X size={18} />
              </button>
            </div>

            {/* Form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                  Project Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setNameError(false); }}
                  placeholder="e.g. Spring Drop Campaign"
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md, boxSizing: "border-box",
                    border: `1px solid ${nameError ? "#EF4444" : t.border}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, fontSize: 13.5, outline: "none",
                    transition: "border-color .15s",
                  }}
                />
                {nameError && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>Project name is required.</p>}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                  Campaign Brief <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  value={form.brief}
                  onChange={(e) => { setForm((f) => ({ ...f, brief: e.target.value })); setBriefError(false); }}
                  placeholder="Describe your campaign — product, audience, tone, visual style, goals..."
                  rows={4}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md, boxSizing: "border-box",
                    border: `1px solid ${briefError ? "#EF4444" : t.border}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, fontSize: 13, outline: "none",
                    resize: "vertical", lineHeight: 1.55, transition: "border-color .15s",
                  }}
                />
                {briefError && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>Brief is required.</p>}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                  Target Asset Type
                </label>
                <select
                  value={form.assetType}
                  onChange={(e) => setForm((f) => ({ ...f, assetType: e.target.value }))}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md, boxSizing: "border-box",
                    border: `1px solid ${t.border}`, background: t.surface2,
                    color: t.text, fontFamily: FONT, fontSize: 13, outline: "none",
                  }}
                >
                  {ASSET_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* AI analysis overlay */}
              {aiPhase && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: R.xl,
                  background: aiPhase === "done"
                    ? "rgba(34,197,94,0.04)"
                    : `linear-gradient(135deg, ${t.brain}12, ${t.brain}04)`,
                  backdropFilter: "blur(2px)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  zIndex: 10, gap: 14, padding: 24, transition: "background .3s",
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: aiPhase === "done"
                      ? "linear-gradient(135deg, #22C55E, #16A34A)"
                      : `linear-gradient(135deg, ${t.brain}, ${t.brain2})`,
                    display: "grid", placeItems: "center",
                    boxShadow: aiPhase === "done" ? "0 6px 20px rgba(34,197,94,0.4)" : `0 6px 20px ${t.brain}55`,
                    transition: "all .4s",
                  }}>
                    {aiPhase === "done"
                      ? <CheckCircle size={26} color="#fff" />
                      : <Brain size={26} color="#fff" style={{ animation: "pulse 1.2s ease-in-out infinite" }} />}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: t.text, marginBottom: 5 }}>
                      {aiPhase === "analyzing" && "🧠 Reading your brief..."}
                      {aiPhase === "designing" && "⚙️ Designing workflow..."}
                      {aiPhase === "done" && "✅ Workflow configured!"}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, maxWidth: 280, lineHeight: 1.5 }}>
                      {aiPhase === "analyzing" && "AI agent is analyzing brand, industry, tone, and visual style from your brief."}
                      {aiPhase === "designing" && "Configuring agent system prompts, models, temperatures, and Genfy parameters."}
                      {aiPhase === "done" && aiResult && (
                        <span style={{ color: t.brain }}>
                          {aiResult.workflow_name}{aiResult.inferred?.industry ? ` · ${aiResult.inferred.industry}` : ""}
                        </span>
                      )}
                    </div>
                    {aiPhase === "done" && aiResult?.reasoning && (
                      <div style={{
                        marginTop: 10, padding: "8px 12px", borderRadius: R.md,
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                        fontSize: 11.5, color: t.text2, lineHeight: 1.5, textAlign: "left",
                      }}>
                        {aiResult.reasoning}
                      </div>
                    )}
                  </div>
                  {aiPhase !== "done" && (
                    <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: 3,
                          background: t.brain,
                          opacity: 0.4,
                          animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                        }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Btn t={t} kind="accent" icon={aiPhase ? Loader2 : Brain} onClick={handleCreate}
                disabled={!!aiPhase}
                style={{ width: "100%", justifyContent: "center", marginTop: 6, position: "relative", zIndex: 5 }}>
                {aiPhase ? "AI Designing Workflow..." : "🧠 Analyze & Design Workflow →"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.85; } }
        @keyframes bounce { 0%,100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-5px); opacity: 1; } }
      `}</style>
    </div>
  );
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
