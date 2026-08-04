import { useState, useRef } from "react";
import { Brain, Check, Upload, FileText, X, Sparkles, Plus } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Btn } from "./primitives/index.jsx";

export default function Onboarding({ t, onClose, showToast, nav }) {
  const [step, setStep] = useState(1);
  const steps = ["Brand Identity", "Voice & Tone", "Documents", "Brand Brain"];

  // ── Step 1 state ──────────────────────────────────────────────
  const [brandName, setBrandName]       = useState("");
  const [website, setWebsite]           = useState("");
  const [industry, setIndustry]         = useState("");
  const [productDesc, setProductDesc]   = useState("");
  const [audience, setAudience]         = useState("");
  const [engagementType, setEngagementType] = useState(""); // "Project" | "Retainer"
  const [timeline, setTimeline]         = useState("");
  const [scopeOfWork, setScopeOfWork]   = useState("");
  const [sowFile, setSowFile]           = useState(null);
  const [competitors, setCompetitors]   = useState([]);
  const [compName, setCompName]         = useState("");
  const [compUrl, setCompUrl]           = useState("");

  // ── Step 2 state ──────────────────────────────────────────────
  const VOICE_CHIPS = [
    "Bold & Playful",
    "Elegant & Refined",
    "Minimal & Modern",
    "Warm & Approachable",
    "Professional & Trustworthy",
  ];
  const [voiceChip, setVoiceChip]       = useState("");
  const [voiceCustom, setVoiceCustom]   = useState("");
  const archetypes = [
    "The Creator", "The Outlaw", "The Adventurer", "The Seducer",
    "The Sage", "The Magician", "The Hero", "The Everyman",
  ];
  const [archetype, setArchetype]       = useState("The Creator");
  const [usp, setUsp]                   = useState("");
  const [wordsToUse, setWordsToUse]     = useState("");
  const [wordsToAvoid, setWordsToAvoid] = useState("");

  // ── Step 3 state ──────────────────────────────────────────────
  const [files, setFiles]       = useState([]);
  const [skipDocs, setSkipDocs] = useState(false);

  // ── Validation ─────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!brandName.trim())   errs.brandName   = "Brand name is required";
      if (!industry.trim())    errs.industry    = "Industry is required";
      if (!productDesc.trim()) errs.productDesc = "Product / service description is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;
    if (step < 4) {
      setStep(step + 1);
    } else {
      const brandContext = {
        brandName: brandName.trim(),
        website: website.trim(),
        industry: industry.trim(),
        productDesc: productDesc.trim(),
        audience: audience.trim(),
        engagementType,
        timeline: timeline.trim(),
        scopeOfWork: scopeOfWork.trim(),
        sowFileName: sowFile ? sowFile.name : null,
        competitors,
        voice: voiceCustom.trim() || voiceChip,
        archetype,
        usp: usp.trim(),
        wordsToUse: wordsToUse.trim(),
        wordsToAvoid: wordsToAvoid.trim(),
        fileCount: files.length,
        skipDocs,
        synthesizedAt: new Date().toISOString(),
      };
      // 1. Post to Backend Server DB
      try {
        await fetch("/bff/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(brandContext),
        });
      } catch (err) {
        console.error("Failed to persist brand to backend:", err);
      }

      // 2. Save locally for instant UI availability
      try {
        localStorage.setItem("studio-brand-context", JSON.stringify(brandContext));
        localStorage.setItem("studio-brand-brain-active", "true");
      } catch (_) {}

      // 3. Dispatch event for instant UI sync
      window.dispatchEvent(new CustomEvent("studio-brand-created", { detail: brandContext }));

      onClose();
      showToast(`${brandName || "New"} workspace created — Brand Brain live`);
      nav("projects");
    }
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const addCompetitor = () => {
    if (!compName.trim()) return;
    setCompetitors((prev) => [...prev, { name: compName.trim(), url: compUrl.trim() }]);
    setCompName(""); setCompUrl("");
  };

  const removeCompetitor = (idx) =>
    setCompetitors((prev) => prev.filter((_, i) => i !== idx));

  const nextLabel =
    step === 4 ? "Enter workspace →" : step === 3 ? "Synthesize Brand Brain" : "Continue";

  /* ─── shared field styles ─── */
  const input = {
    width: "100%", padding: "10px 12px", borderRadius: R.md,
    border: `1px solid ${t.borderStrong}`,
    background: t.surface2, color: t.text, fontFamily: FONT, outline: "none",
    boxSizing: "border-box",
  };
  const inputErr = (key) => ({ ...input, border: `1px solid ${errors[key] ? "red" : t.borderStrong}` });
  const label = (text, required) => (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
      {text}{required && <span style={{ color: "red" }}> *</span>}
    </label>
  );
  const errMsg = (key) => errors[key] && (
    <p style={{ color: "red", fontSize: 11, marginTop: 4 }}>{errors[key]}</p>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New Brand Project Creation"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 150,
        background: "rgba(15,12,8,.65)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "fadeIn .18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 600, maxWidth: "100%",
          background: t.surface, borderRadius: 0,
          boxShadow: t.shadowLg, overflow: "hidden",
          fontFamily: FONT, border: `1px solid ${t.border}`,
          animation: "slideUp .25s ease",
          display: "flex", flexDirection: "column", maxHeight: "90vh",
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 28px 0" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: t.text3, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={12} color={t.accent} />
              Project Onboarding
            </div>
            <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: t.text, margin: "6px 0 0", letterSpacing: "-.02em" }}>
              {step === 4 ? "Brand Brain Synthesized" : "Define Brand DNA"}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "none", color: t.text3, cursor: "pointer", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Step markers ── */}
        <div style={{ display: "flex", gap: 10, padding: "18px 28px", flexWrap: "wrap", borderBottom: `1px solid ${t.border}` }}>
          {steps.map((s, i) => {
            const n = i + 1; const done = n < step; const cur = n === step;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 11, color: done ? t.success : cur ? t.text : t.text3 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, background: done ? t.success : cur ? t.accent : t.surface2, color: done || cur ? "#fff" : t.text3, border: done || cur ? "none" : `1px solid ${t.border}` }}>
                  {done ? <Check size={11} /> : n}
                </span>
                {s}
              </div>
            );
          })}
        </div>

        {/* ── Step content ── */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>

          {/* ═══════════ STEP 1 — Brand Identity ═══════════ */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Brand Name */}
              <div>
                {label("Brand Name", true)}
                <input type="text" placeholder="e.g. Wild Stone" value={brandName}
                  onChange={(e) => setBrandName(e.target.value)} style={inputErr("brandName")} />
                {errMsg("brandName")}
              </div>

              {/* Industry + Website */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {label("Industry", true)}
                  <input type="text" placeholder="e.g. Real Estate" value={industry}
                    onChange={(e) => setIndustry(e.target.value)} style={inputErr("industry")} />
                  {errMsg("industry")}
                </div>
                <div>
                  {label("Company Website")}
                  <input type="text" placeholder="https://acme.com" value={website}
                    onChange={(e) => setWebsite(e.target.value)} style={input} />
                  <p style={{ fontSize: 11, color: t.text3, marginTop: 4, fontFamily: FONT }}>We'll use this to research your brand automatically.</p>
                </div>
              </div>

              {/* Products / Services */}
              <div>
                {label("Products / Services", true)}
                <textarea placeholder="What do you sell? Describe your brand promise..." value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)} rows={3}
                  style={{ ...inputErr("productDesc"), resize: "none" }} />
                {errMsg("productDesc")}
              </div>

              {/* Target Audience */}
              <div>
                {label("Target Audience")}
                <input type="text" placeholder="e.g. Men aged 18–35, value-conscious yet aspirational" value={audience}
                  onChange={(e) => setAudience(e.target.value)} style={input} />
              </div>

              {/* Engagement Type */}
              <div>
                {label("Engagement Type")}
                <div style={{ display: "flex", gap: 8 }}>
                  {["Project", "Retainer"].map((type) => (
                    <button key={type} type="button"
                      onClick={() => setEngagementType(engagementType === type ? "" : type)}
                      style={{
                        padding: "8px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: FONT, transition: "all .15s",
                        background: engagementType === type ? t.accentSoft : t.surface2,
                        border: `1px solid ${engagementType === type ? t.accent : t.borderStrong}`,
                        color: engagementType === type ? t.accentText : t.text2,
                      }}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline — only visible for Project */}
              {engagementType === "Project" && (
                <div>
                  {label("Tentative Timeline to Close")}
                  <input type="text" placeholder="e.g. 6 weeks, or a target date" value={timeline}
                    onChange={(e) => setTimeline(e.target.value)} style={input} />
                  <p style={{ fontSize: 11, color: t.text3, marginTop: 4, fontFamily: FONT }}>Retainers don't need a close date.</p>
                </div>
              )}

              {/* Scope of Work */}
              <div>
                {label("Scope of Work")}
                <textarea placeholder="What's included? e.g. social copy, monthly campaign creative, brand refresh" value={scopeOfWork}
                  onChange={(e) => setScopeOfWork(e.target.value)} rows={3}
                  style={{ ...input, resize: "none" }} />
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <label htmlFor="sow-file"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: R.md, cursor: "pointer", border: `1px dashed ${t.borderStrong}`, background: t.surface2, fontSize: 12, fontWeight: 600, color: t.text2, fontFamily: FONT, userSelect: "none", flexShrink: 0 }}>
                    <Upload size={13} />
                    {sowFile ? "Replace file" : "Upload file"}
                  </label>
                  <input id="sow-file" type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }}
                    onChange={(e) => setSowFile(e.target.files[0] || null)} />
                  {sowFile ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.text2, fontFamily: FONT, background: t.surface3, padding: "5px 10px", borderRadius: R.md }}>
                      <FileText size={12} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{sowFile.name}</span>
                      <button onClick={() => setSowFile(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: t.text3, display: "flex", alignItems: "center" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: t.text3, fontFamily: FONT }}>PDF, DOC, DOCX or TXT</span>
                  )}
                </div>
              </div>

              {/* Top Competitors */}
              <div>
                {label("Top Competitors")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 10 }}>
                  <input type="text" placeholder="Competitor name" value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                    style={input} />
                  <input type="url" placeholder="https://competitor.com" value={compUrl}
                    onChange={(e) => setCompUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                    style={input} />
                  <button onClick={addCompetitor}
                    style={{ background: t.surface2, border: `1px solid ${t.borderStrong}`, color: t.text2, borderRadius: R.md, padding: "0 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 5 }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
                {competitors.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {competitors.map((c, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, background: t.surface2, border: `1px solid ${t.border}`, borderRadius: R.md, padding: "9px 11px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.text, fontFamily: FONT }}>{c.name}</div>
                          {c.url && <div style={{ fontSize: 11, color: t.text3, fontFamily: MONO, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.url}</div>}
                        </div>
                        <button onClick={() => removeCompetitor(idx)}
                          style={{ background: "none", border: "none", color: t.text3, cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 11, color: t.text3, marginTop: 6, fontFamily: FONT }}>Helps tools position your brand's voice against the market.</p>
              </div>
            </div>
          )}

          {/* ═══════════ STEP 2 — Voice & Tone ═══════════ */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Brand Voice chips */}
              <div>
                {label("Brand Voice")}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {VOICE_CHIPS.map((v) => (
                    <button key={v} type="button"
                      onClick={() => { setVoiceChip(voiceChip === v ? "" : v); if (voiceChip !== v) setVoiceCustom(""); }}
                      style={{
                        padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: FONT, transition: "all .15s",
                        background: voiceChip === v ? t.accentSoft : t.surface2,
                        border: `1px solid ${voiceChip === v ? t.accent : t.borderStrong}`,
                        color: voiceChip === v ? t.accentText : t.text2,
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 8px" }}>
                  <div style={{ flex: 1, height: 1, background: t.border }} />
                  <span style={{ fontSize: 11.5, color: t.text3, fontFamily: FONT, whiteSpace: "nowrap" }}>or describe your own</span>
                  <div style={{ flex: 1, height: 1, background: t.border }} />
                </div>
                <input type="text" placeholder="e.g. Quietly confident, data-driven, never salesy" value={voiceCustom}
                  onChange={(e) => { setVoiceCustom(e.target.value); if (e.target.value) setVoiceChip(""); }}
                  style={input} />
              </div>

              {/* Brand Archetype */}
              <div>
                {label("Brand Archetype")}
                <select value={archetype} onChange={(e) => setArchetype(e.target.value)} style={input}>
                  {archetypes.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* USP */}
              <div>
                {label("Unique Selling Points / Competitive Edge")}
                <input type="text" placeholder="e.g. Luxury-feel fragrance at accessible price points" value={usp}
                  onChange={(e) => setUsp(e.target.value)} style={input} />
              </div>

              {/* Words grids */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  {label("Words to USE")}
                  <input type="text" placeholder="confidence, premium, bold" value={wordsToUse}
                    onChange={(e) => setWordsToUse(e.target.value)} style={input} />
                </div>
                <div>
                  {label("Words to AVOID")}
                  <input type="text" placeholder="cheap, generic, basic" value={wordsToAvoid}
                    onChange={(e) => setWordsToAvoid(e.target.value)} style={input} />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ STEP 3 — Documents ═══════════ */}
          {step === 3 && (
            <div>
              <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text, margin: "0 0 6px" }}>Upload Reference Materials</h3>
              <p style={{ fontFamily: FONT, fontSize: 13, color: t.text2, lineHeight: 1.5, margin: "0 0 16px" }}>
                Style guides, past campaigns, decks — anything here becomes searchable brand knowledge every tool can draw on.
              </p>
              <div style={{ border: `1.5px dashed ${t.borderStrong}`, borderRadius: R.md, padding: "26px 20px", textAlign: "center", background: t.surface2, position: "relative" }}>
                <Upload size={22} style={{ color: t.text3, marginBottom: 8 }} />
                <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: t.text }}>Drop files, or click to browse</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, marginTop: 4 }}>PDFs, PPTs, images — up to 25 files</div>
                <input type="file" multiple
                  onChange={(e) => {
                    const next = Array.from(e.target.files || []).map((f) => ({
                      name: f.name,
                      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
                    }));
                    if (next.length) setFiles((prev) => [...prev, ...next]);
                    e.target.value = "";
                  }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  aria-label="Upload brand files" />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: t.text2, marginTop: 10, cursor: "pointer", fontFamily: FONT }}>
                <input type="checkbox" checked={skipDocs} onChange={(e) => setSkipDocs(e.target.checked)} />
                I don't have documents yet — I'll add them later
              </label>
              <div style={{ marginTop: 14 }}>
                {files.map((f) => (
                  <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                    <FileText size={16} style={{ color: t.text3 }} />
                    <div style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: t.text }}>
                      {f.name} <span style={{ color: t.text3, fontSize: 11 }}>({f.size})</span>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 10, color: t.success }}>
                      <Check size={11} />Indexed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════ STEP 4 — Brand Brain ═══════════ */}
          {step === 4 && (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`, display: "grid", placeItems: "center", margin: "0 auto 18px", boxShadow: `0 12px 30px -10px ${t.brain}` }}>
                <Brain size={30} color="#fff" />
              </div>
              <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: t.text, margin: 0 }}>
                {brandName || "Brand"} is ready
              </h3>
              <p style={{ fontFamily: FONT, fontSize: 13.5, color: t.text2, maxWidth: "38ch", margin: "8px auto 0", lineHeight: 1.55 }}>
                The Brand Brain has been synthesized. Copy Agent and all active tools will automatically speak in {brandName || "your brand"}'s customized voice.
              </p>
              <div style={{ marginTop: 16, padding: 14, borderRadius: R.md, background: t.surface2, border: `1px solid ${t.border}`, textAlign: "left" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Brand Context Active</div>
                <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.7 }}>
                  <div><b style={{ color: t.text }}>Industry:</b> {industry || "Not set"}</div>
                  <div><b style={{ color: t.text }}>Voice:</b> {voiceCustom || voiceChip || "Not set"}</div>
                  <div><b style={{ color: t.text }}>Archetype:</b> {archetype}</div>
                  <div><b style={{ color: t.text }}>Engagement:</b> {engagementType || "Not set"}</div>
                  {competitors.length > 0 && <div><b style={{ color: t.text }}>Competitors:</b> {competitors.map((c) => c.name).join(", ")}</div>}
                  <div><b style={{ color: t.text }}>Assets:</b> {files.length} file{files.length === 1 ? "" : "s"} {skipDocs ? "(docs skipped for now)" : ""}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderTop: `1px solid ${t.border}`, background: t.surface2, flexShrink: 0 }}>
          <button onClick={handleBack}
            style={{ visibility: step > 1 ? "visible" : "hidden", fontFamily: FONT, fontSize: 12.5, fontWeight: 600, color: t.text2, background: "none", border: "none", cursor: "pointer" }}>
            ← Back
          </button>
          <Btn t={t} kind="dark" onClick={handleNext}>{nextLabel}</Btn>
        </div>
      </div>
    </div>
  );
}
