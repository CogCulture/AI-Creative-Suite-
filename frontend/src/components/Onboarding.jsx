import { useState } from "react";
import { Brain, Check, Upload, FileText, X, Sparkles, AlertCircle } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Btn } from "./primitives/index.jsx";

export default function Onboarding({ t, onClose, showToast, nav }) {
  const [step, setStep] = useState(1);
  const steps = ["Foundation", "Voice & Tone", "Upload Assets", "Ready"];

  // Form States
  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [audience, setAudience] = useState("");
  
  const [primaryTone, setPrimaryTone] = useState("Confident");
  const [archetype, setArchetype] = useState("The Creator");
  const [usp, setUsp] = useState("");
  const [wordsToUse, setWordsToUse] = useState("");
  const [wordsToAvoid, setWordsToAvoid] = useState("");

  const [files, setFiles] = useState([
    { name: "brand-guidelines-2025.pdf", size: "2.4 MB" }
  ]);

  const [errors, setErrors] = useState({});

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!brandName.trim()) errs.brandName = "Brand name is required";
      if (!industry.trim()) errs.industry = "Industry is required";
      if (!productDesc.trim()) errs.productDesc = "Product description is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;

    if (step < 4) {
      setStep(step + 1);
    } else {
      onClose();
      showToast(`${brandName || "New"} workspace created — Brand Brain live`);
      nav("home");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const nextLabel =
    step === 4 ? "Enter workspace →" : step === 3 ? "Generate Brand Brain" : "Continue";

  const archetypes = [
    "The Creator", "The Outlaw", "The Adventurer", "The Seducer", 
    "The Sage", "The Magician", "The Hero", "The Everyman"
  ];

  const tones = [
    "Confident", "Charismatic", "Seductive", "Adventurous", 
    "Professional", "Playful", "Empathetic", "Direct"
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New Brand Project Creation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: "rgba(15,12,8,.65)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeIn .18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 580,
          maxWidth: "100%",
          background: t.surface,
          borderRadius: R.xl,
          boxShadow: t.shadowLg,
          overflow: "hidden",
          fontFamily: FONT,
          border: `1px solid ${t.border}`,
          animation: "slideUp .25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "24px 28px 0",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: t.text3,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={12} color={t.accent} />
              Project Onboarding
            </div>
            <h2
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 22,
                color: t.text,
                margin: "6px 0 0",
                letterSpacing: "-.02em",
              }}
            >
              {step === 4 ? "Brand DNA Synthesized" : "Define Brand DNA"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "none",
              color: t.text3,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step markers */}
        <div style={{ display: "flex", gap: 10, padding: "18px 28px", flexWrap: "wrap", borderBottom: `1px solid ${t.border}` }}>
          {steps.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const cur = n === step;
            return (
              <div
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: MONO,
                  fontSize: 11,
                  color: done ? t.success : cur ? t.text : t.text3,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    background: done ? t.success : cur ? t.accent : t.surface2,
                    color: done || cur ? "#fff" : t.text3,
                    border: done || cur ? "none" : `1px solid ${t.border}`,
                  }}
                >
                  {done ? <Check size={11} /> : n}
                </span>
                {s}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div style={{ padding: "24px 28px", minHeight: 280, maxHeight: "60vh", overflowY: "auto" }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                  Brand/Company Name <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wild Stone"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md,
                    border: `1px solid ${errors.brandName ? "red" : t.borderStrong}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                  }}
                />
                {errors.brandName && <p style={{ color: "red", fontSize: 11, marginTop: 4 }}>{errors.brandName}</p>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                    Industry <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Men's Grooming"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: R.md,
                      border: `1px solid ${errors.industry ? "red" : t.borderStrong}`,
                      background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                    }}
                  />
                  {errors.industry && <p style={{ color: "red", fontSize: 11, marginTop: 4 }}>{errors.industry}</p>}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                    Company Website
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. wildstone.in"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: R.md,
                      border: `1px solid ${t.borderStrong}`,
                      background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                  Product/Service Description <span style={{ color: "red" }}>*</span>
                </label>
                <textarea
                  placeholder="What products or services do you offer? Describe your brand promise..."
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md,
                    border: `1px solid ${errors.productDesc ? "red" : t.borderStrong}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, outline: "none", resize: "none"
                  }}
                />
                {errors.productDesc && <p style={{ color: "red", fontSize: 11, marginTop: 4 }}>{errors.productDesc}</p>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                  Target Audience
                </label>
                <input
                  type="text"
                  placeholder="e.g. Men aged 18–35, value-conscious yet aspirational"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md,
                    border: `1px solid ${t.borderStrong}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                  }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                    Primary Tone
                  </label>
                  <select
                    value={primaryTone}
                    onChange={(e) => setPrimaryTone(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: R.md,
                      border: `1px solid ${t.borderStrong}`,
                      background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                    }}
                  >
                    {tones.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                    Brand Archetype
                  </label>
                  <select
                    value={archetype}
                    onChange={(e) => setArchetype(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: R.md,
                      border: `1px solid ${t.borderStrong}`,
                      background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                    }}
                  >
                    {archetypes.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                  Unique Selling Points / Competitive Edge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Luxury-feel fragrance at accessible price points"
                  value={usp}
                  onChange={(e) => setUsp(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md,
                    border: `1px solid ${t.borderStrong}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                  Words to USE (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="confidence, adventure, premium, affordable"
                  value={wordsToUse}
                  onChange={(e) => setWordsToUse(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md,
                    border: `1px solid ${t.borderStrong}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
                  Words to AVOID (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="cheap, basic, ordinary, generic"
                  value={wordsToAvoid}
                  onChange={(e) => setWordsToAvoid(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md,
                    border: `1px solid ${t.borderStrong}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, outline: "none"
                  }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text, margin: "0 0 6px" }}>
                Upload Reference Materials
              </h3>
              <p style={{ fontFamily: FONT, fontSize: 13, color: t.text2, lineHeight: 1.5, margin: "0 0 16px" }}>
                Drop in your PDF brand guidelines, logo files, and tone documents to initialize the vector memory context.
              </p>
              <div
                style={{
                  border: `1.5px dashed ${t.borderStrong}`,
                  borderRadius: R.md,
                  padding: "26px 20px",
                  textAlign: "center",
                  background: t.surface2,
                  cursor: "pointer",
                }}
              >
                <Upload size={22} style={{ color: t.text3, marginBottom: 8 }} />
                <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: t.text }}>
                  Drop files or browse
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, marginTop: 4 }}>
                  PDF · DOCX · PNG · FIGMA · URL
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                {files.map((f) => (
                  <div
                    key={f.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: `1px solid ${t.border}`,
                    }}
                  >
                    <FileText size={16} style={{ color: t.text3 }} />
                    <div style={{ flex: 1, fontFamily: FONT, fontSize: 13, color: t.text }}>
                      {f.name} <span style={{ color: t.text3, fontSize: 11 }}>({f.size})</span>
                    </div>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: MONO,
                        fontSize: 10,
                        color: t.success,
                      }}
                    >
                      <Check size={11} />Indexed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`,
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 18px",
                  boxShadow: `0 12px 30px -10px ${t.brain}`,
                }}
              >
                <Brain size={30} color="#fff" />
              </div>
              <h3
                style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: t.text, margin: 0 }}
              >
                {brandName || "Brand"} is ready
              </h3>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 13.5,
                  color: t.text2,
                  maxWidth: "38ch",
                  margin: "8px auto 0",
                  lineHeight: 1.55,
                }}
              >
                The Brand Brain has been synthesized. Copy Agent and all active tools will automatically speak in {brandName || "your brand"}'s customized voice.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 28px",
            borderTop: `1px solid ${t.border}`,
            background: t.surface2,
          }}
        >
          <button
            onClick={handleBack}
            style={{
              visibility: step > 1 ? "visible" : "hidden",
              fontFamily: FONT,
              fontSize: 12.5,
              fontWeight: 600,
              color: t.text2,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <Btn t={t} kind="dark" onClick={handleNext}>
            {nextLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}
