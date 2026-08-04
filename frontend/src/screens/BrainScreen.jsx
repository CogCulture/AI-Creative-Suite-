import { useState, useEffect } from "react";
import { Brain, Plus, Trash2, Globe, Target, Sparkles, Building2, BookOpen, Layers, ExternalLink, ArrowRight } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Btn } from "../components/primitives/index.jsx";

export default function BrainScreen({ t, nav, showToast, onAddBrandDNA }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchBrands = () => {
    setLoading(true);
    fetch("/bff/brands", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrands();

    const handleBrandCreated = () => fetchBrands();
    window.addEventListener("studio-brand-created", handleBrandCreated);
    return () => window.removeEventListener("studio-brand-created", handleBrandCreated);
  }, []);

  const handleDeleteBrand = async (brandId, brandName) => {
    if (!window.confirm(`Are you sure you want to delete Brand DNA for "${brandName}"?`)) return;
    setDeletingId(brandId);
    try {
      const res = await fetch(`/bff/brands/${brandId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        showToast(`🗑️ Brand "${brandName}" deleted successfully`);
        setBrands((prev) => prev.filter((b) => b.id !== brandId));
      } else {
        showToast("❌ Failed to delete brand");
      }
    } catch (_) {
      showToast("❌ Error deleting brand");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      {/* Background glow effects */}
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 420, height: 420, top: -90, right: -80, opacity: 0.12 }} />
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 260, height: 260, bottom: -60, left: -90, opacity: 0.08 }} />

      {/* Top Banner */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderRadius: R.lg,
          padding: "32px 36px",
          color: "#EDE9F8",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${t.brainText}, ${t.brain})`,
          boxShadow: t.shadowLg,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 88% 20%, ${t.brain2}55, transparent 40%),
                         radial-gradient(circle at 5% 95%, ${t.brain}66, transparent 42%)`,
          }}
        />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(255,255,255,.15)",
                display: "grid",
                placeItems: "center",
                marginBottom: 16,
                backdropFilter: "blur(4px)",
              }}
            >
              <Brain size={26} />
            </div>
            <h1 className="font-display" style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, letterSpacing: "-.02em", margin: 0 }}>
              Master Brand Brain
            </h1>
            <p className="font-sans" style={{ fontSize: 14, color: "#c9bef2", marginTop: 8, maxWidth: "60ch", lineHeight: 1.6 }}>
              The central RAG knowledge base storing all your onboarded Brand DNAs. Every AI tool in Creative Suite queries this memory to generate on-brand copy, strategy, and campaign assets.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              {[`${brands.length} Active Brand${brands.length === 1 ? "" : "s"} Onboarded`, "Every tool reads it", "Gets smarter each campaign"].map((f) => (
                <span
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: MONO,
                    fontSize: 11,
                    background: "rgba(255,255,255,.12)",
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,.16)",
                    fontWeight: 600,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <Btn t={t} kind="dark" onClick={onAddBrandDNA} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px" }}>
            <Plus size={16} /> Add Brand DNA
          </Btn>
        </div>
      </div>

      {/* Brands List Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: 0 }}>
            Onboarded Brand Vault ({brands.length})
          </h2>
          <p style={{ fontSize: 13, color: t.sub, margin: "4px 0 0" }}>
            Manage your agency's client brand profiles and active Brand Brain parameters.
          </p>
        </div>

        <Btn t={t} kind="secondary" onClick={fetchBrands} style={{ fontSize: 12, padding: "6px 14px" }}>
          Refresh List
        </Btn>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: t.sub, fontFamily: MONO, fontSize: 13 }}>
          ✨ Loading Master Brand Brain records...
        </div>
      )}

      {/* Empty State */}
      {!loading && brands.length === 0 && (
        <div
          style={{
            background: t.surface,
            border: `1.5px dashed ${t.border}`,
            borderRadius: R.lg,
            padding: "50px 30px",
            textAlign: "center",
            maxWidth: 600,
            margin: "20px auto 0",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `${t.accent}15`,
              color: t.accent,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <Building2 size={26} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: 0 }}>No Brands Onboarded Yet</h3>
          <p style={{ fontSize: 14, color: t.sub, marginTop: 8, lineHeight: 1.5 }}>
            Onboard your first brand to create a Master RAG knowledge base. All AI strategy, copy, and image tools will automatically use your Brand DNA.
          </p>
          <Btn t={t} kind="primary" onClick={onAddBrandDNA} style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> Onboard Brand DNA
          </Btn>
        </div>
      )}

      {/* Brands Cards Grid */}
      {!loading && brands.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 }}>
          {brands.map((b) => (
            <div
              key={b.id || b.brandName}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: R.lg,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                boxShadow: t.shadowSm,
                transition: "all 0.2s ease",
              }}
            >
              {/* Card Top: Brand Icon, Title, Industry, Actions */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${t.accent}, #6d4ae8)`,
                      color: "#fff",
                      fontSize: 20,
                      fontWeight: 800,
                      display: "grid",
                      placeItems: "center",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {b.brandName ? b.brandName.slice(0, 2) : "BD"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.3 }}>
                      {b.brandName}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      {b.industry && (
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: MONO,
                            background: `${t.accent}15`,
                            color: t.accent,
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontWeight: 600,
                          }}
                        >
                          {b.industry}
                        </span>
                      )}
                      {b.website && (
                        <a
                          href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: 12, color: t.sub, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                        >
                          <Globe size={12} /> {b.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteBrand(b.id, b.brandName)}
                  disabled={deletingId === b.id}
                  title="Delete Brand DNA"
                  style={{
                    background: "none",
                    border: "none",
                    color: t.sub,
                    cursor: "pointer",
                    padding: 6,
                    borderRadius: 6,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e53e3e")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = t.sub)}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Product / USP Preview */}
              {(b.productDesc || b.usp) && (
                <div style={{ background: t.bg, borderRadius: R.md, padding: 14, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 11, fontFamily: MONO, color: t.sub, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                    Product & USP
                  </div>
                  <p style={{ fontSize: 13, color: t.text, margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {b.usp || b.productDesc}
                  </p>
                </div>
              )}

              {/* Brand Attributes: Archetype, Voice, Audience */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {b.voice && (
                  <div style={{ background: t.bg, borderRadius: R.sm, padding: 10, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 10, fontFamily: MONO, color: t.sub, textTransform: "uppercase", marginBottom: 2 }}>Brand Voice</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{b.voice}</div>
                  </div>
                )}
                {b.archetype && (
                  <div style={{ background: t.bg, borderRadius: R.sm, padding: 10, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 10, fontFamily: MONO, color: t.sub, textTransform: "uppercase", marginBottom: 2 }}>Archetype</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{b.archetype}</div>
                  </div>
                )}
              </div>

              {/* Target Audience */}
              {b.audience && (
                <div style={{ fontSize: 12, color: t.sub, display: "flex", alignItems: "center", gap: 6 }}>
                  <Target size={14} style={{ color: t.accent, flexShrink: 0 }} />
                  <span style={{ color: t.text, fontWeight: 500 }}>Target:</span> {b.audience}
                </div>
              )}

              {/* Words to Use / Words to Avoid */}
              {(b.wordsToUse || b.wordsToAvoid) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {b.wordsToUse && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                      <span style={{ fontFamily: MONO, color: "#16a34a", fontWeight: 700 }}>✓ DO:</span>
                      {b.wordsToUse.split(",").slice(0, 4).map((w, idx) => (
                        <span key={idx} style={{ background: "rgba(22, 163, 74, 0.1)", color: "#15803d", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                          {w.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {b.wordsToAvoid && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                      <span style={{ fontFamily: MONO, color: "#dc2626", fontWeight: 700 }}>✗ AVOID:</span>
                      {b.wordsToAvoid.split(",").slice(0, 4).map((w, idx) => (
                        <span key={idx} style={{ background: "rgba(220, 38, 38, 0.1)", color: "#b91c1c", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                          {w.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Competitors List */}
              {Array.isArray(b.competitors) && b.competitors.length > 0 && (
                <div style={{ fontSize: 12, color: t.sub }}>
                  <span style={{ fontWeight: 600, color: t.text }}>Competitors: </span>
                  {b.competitors.map((c) => (typeof c === "string" ? c : c.name)).join(", ")}
                </div>
              )}

              {/* SOW Attached File */}
              {b.sowFileName && (
                <div style={{ fontSize: 11, fontFamily: MONO, color: t.sub, display: "flex", alignItems: "center", gap: 6, background: t.bg, padding: "6px 10px", borderRadius: 6 }}>
                  <BookOpen size={13} style={{ color: t.accent }} /> SOW Attached: <span style={{ color: t.text, fontWeight: 600 }}>{b.sowFileName}</span>
                </div>
              )}

              {/* Card Footer Action: Create Campaign under this Brand */}
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16, marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                <Btn
                  t={t}
                  kind="primary"
                  onClick={() => {
                    if (nav) nav("projects");
                  }}
                  style={{ width: "100%", justifyContent: "center", gap: 8, fontSize: 13, padding: "10px 16px" }}
                >
                  Create Campaign under {b.brandName} <ArrowRight size={14} />
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
