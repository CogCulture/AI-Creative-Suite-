import { useState, useEffect, useRef } from "react";
import {
  Brain, Plus, Trash2, Globe, Target, Sparkles,
  BookOpen, ExternalLink, ArrowRight, Link2, Link2Off,
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, X,
  ChevronDown, Database, Zap, Building2
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";

// ── RAG status badge ──────────────────────────────────────────────────────────
function RagBadge({ t, linked, clientKey }) {
  if (linked && clientKey) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: t.successSoft, color: t.success,
        border: `1px solid ${t.success}33`,
        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
        fontFamily: FONT,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.success, display: "inline-block" }} />
        Linked to Knowledge Base
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: t.surface2, color: t.text3,
      border: `1px solid ${t.border}`,
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
      fontFamily: FONT,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: t.text3, display: "inline-block" }} />
      Not Linked
    </span>
  );
}

// ── RAG match modal ───────────────────────────────────────────────────────────
function RagMatchModal({ t, brand, onClose, onLinked, showToast }) {
  const [loading, setLoading]     = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [selected, setSelected]   = useState(null);
  const [customKey, setCustomKey] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [linking, setLinking]     = useState(false);

  useEffect(() => {
    fetch(`/bff/brands/${brand.id}/rag-match`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setMatchData(data);
        if (data?.matches?.length > 0 && data.matches[0].tier === 1) {
          setSelected(data.matches[0].client);
        }
      })
      .catch(() => setMatchData(null))
      .finally(() => setLoading(false));
  }, [brand.id]);

  const handleLink = async () => {
    const key = useCustom ? customKey.trim() : selected;
    if (!key) return;
    setLinking(true);
    try {
      const res = await fetch(`/bff/brands/${brand.id}/rag-link`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinecone_client_key: key }),
      });
      if (res.ok) {
        showToast(`✅ Brand linked to knowledge base: "${key}"`);
        onLinked(brand.id, key);
        onClose();
      } else {
        showToast("❌ Failed to link brand");
      }
    } catch (_) {
      showToast("❌ Network error");
    } finally {
      setLinking(false);
    }
  };

  const tierColor  = (tier) => tier === 1 ? t.success : t.warn;
  const tierBg     = (tier) => tier === 1 ? t.successSoft : t.warnSoft;
  const tierLabel  = (tier) => tier === 1 ? "High match" : "Possible match";

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div style={{
        background: t.bg, border: `1px solid ${t.border}`,
        borderRadius: 16, padding: "32px 36px",
        maxWidth: 540, width: "100%",
        boxShadow: t.shadowLg, fontFamily: FONT,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Database size={20} color={t.brain} />
              <span style={{ color: t.text, fontSize: 17, fontWeight: 700 }}>Link to Knowledge Base</span>
            </div>
            <p style={{ color: t.text2, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Match <strong style={{ color: t.brain }}>{brand.brandName}</strong> to a Pinecone client key
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.text3, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: t.text3, padding: "20px 0" }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            <span>Scanning knowledge base…</span>
          </div>
        ) : !matchData?.rag_available ? (
          <div style={{ color: t.danger, padding: "16px 0", fontSize: 14 }}>
            ⚠ RAG engine unavailable. Check your PINECONE_API_KEY in backend config.
          </div>
        ) : (
          <>
            {matchData.matches?.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: t.text3, fontSize: 11, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                  Detected Matches
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {matchData.matches.map(m => (
                    <label key={m.client} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                      border: selected === m.client && !useCustom
                        ? `2px solid ${tierColor(m.tier)}`
                        : `1px solid ${t.border}`,
                      background: selected === m.client && !useCustom ? tierBg(m.tier) : t.surface,
                      transition: "all 0.15s",
                    }}>
                      <input
                        type="radio" name="ragclient" value={m.client}
                        checked={selected === m.client && !useCustom}
                        onChange={() => { setSelected(m.client); setUseCustom(false); }}
                        style={{ accentColor: tierColor(m.tier) }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: t.text, fontSize: 14, fontWeight: 600 }}>{m.client}</span>
                        <span style={{ marginLeft: 8, fontSize: 11, color: tierColor(m.tier), background: tierBg(m.tier), borderRadius: 6, padding: "2px 7px" }}>
                          {tierLabel(m.tier)}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: t.text3 }}>{Math.round(m.similarity * 100)}%</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: t.text3, fontSize: 13, padding: "12px 0", marginBottom: 8 }}>
                No close matches found. Enter a custom key below to create a fresh link.
              </div>
            )}

            {/* Custom key */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer" }}>
                <input type="radio" name="ragclient" checked={useCustom} onChange={() => setUseCustom(true)} />
                <span style={{ color: t.text2, fontSize: 13 }}>Use a custom client key</span>
              </label>
              {useCustom && (
                <input
                  type="text"
                  placeholder="e.g. my-brand-name"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 8,
                    background: t.surface, border: `1px solid ${t.borderStrong}`,
                    color: t.text, fontSize: 14, outline: "none",
                    boxSizing: "border-box", fontFamily: FONT,
                  }}
                />
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "10px 0", borderRadius: 8,
                border: `1px solid ${t.border}`, background: t.surface,
                color: t.text2, cursor: "pointer", fontSize: 14, fontFamily: FONT,
              }}>Cancel</button>
              <button
                onClick={handleLink}
                disabled={linking || (!selected && !customKey.trim())}
                style={{
                  flex: 2, padding: "10px 0", borderRadius: 8, border: "none",
                  background: t.brain, color: "#fff",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  opacity: (linking || (!selected && !customKey.trim())) ? 0.5 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: FONT,
                }}
              >
                {linking ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Link2 size={15} />}
                {linking ? "Linking…" : "Confirm Link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── DAM File Upload Panel ─────────────────────────────────────────────────────
function DamPanel({ t, brand, showToast }) {
  const [files, setFiles]         = useState([]);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen]           = useState(false);
  const fileRef                   = useRef(null);

  const fetchFiles = () => {
    fetch(`/bff/dam/files?brand_id=${brand.id}`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(setFiles)
      .catch(() => setFiles([]));
  };

  useEffect(() => { if (open) fetchFiles(); }, [open, brand.id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("brand_id", brand.id);
    form.append("file", file);
    try {
      const res = await fetch("/bff/dam/files", {
        method: "POST", credentials: "include", body: form,
      });
      const data = res.ok ? await res.json() : null;
      if (data) { showToast(data.message || "✅ File uploaded"); fetchFiles(); }
      else showToast("❌ Upload failed");
    } catch (_) {
      showToast("❌ Upload error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeleteFile = async (fileId, name) => {
    if (!window.confirm(`Delete "${name}" from knowledge base?`)) return;
    try {
      const res = await fetch(`/bff/dam/files/${fileId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) { showToast(`🗑️ "${name}" removed`); setFiles(prev => prev.filter(f => f.id !== fileId)); }
      else showToast("❌ Delete failed");
    } catch (_) { showToast("❌ Network error"); }
  };

  const statusIcon = (status) => {
    if (status === "ingested") return <CheckCircle2 size={12} color={t.success} />;
    if (status === "failed")   return <AlertCircle  size={12} color={t.danger} />;
    if (status === "queued")   return <Loader2      size={12} color={t.warn} style={{ animation: "spin 1s linear infinite" }} />;
    return <FileText size={12} color={t.text3} />;
  };

  const statusColor = (s) =>
    s === "ingested" ? t.success : s === "failed" ? t.danger : s === "queued" ? t.warn : t.text3;

  return (
    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, marginTop: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", cursor: "pointer",
          color: t.text2, fontSize: 12, fontWeight: 600, fontFamily: FONT,
          padding: 0,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Upload size={12} />
          {brand.ragLinked ? "Manage Knowledge Assets" : "Upload Files (link brand first)"}
        </span>
        <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: t.text3 }} />
      </button>

      {open && (
        <div style={{ marginTop: 10 }}>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !brand.ragLinked}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 8,
              border: `1.5px dashed ${brand.ragLinked ? t.brain : t.border}`,
              background: brand.ragLinked ? t.brainSoft : t.surface2,
              color: brand.ragLinked ? t.brainText : t.text3,
              fontSize: 12, fontWeight: 600, cursor: brand.ragLinked ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all 0.2s", fontFamily: FONT,
            }}
          >
            {uploading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={12} />}
            {uploading ? "Uploading…" : brand.ragLinked ? "Upload PDF / Doc / Image" : "Link brand to enable uploads"}
          </button>

          {files.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
              {files.map(f => (
                <div key={f.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "6px 10px", borderRadius: 7,
                  background: t.surface2, border: `1px solid ${t.border}`,
                }}>
                  {statusIcon(f.ragStatus)}
                  <span style={{ flex: 1, fontSize: 12, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.correctedName || f.originalName}
                  </span>
                  {f.chunkCount && (
                    <span style={{ fontSize: 10, color: statusColor(f.ragStatus), fontWeight: 700 }}>
                      {f.chunkCount} chunks
                    </span>
                  )}
                  <button onClick={() => handleDeleteFile(f.id, f.correctedName || f.originalName)} style={{ background: "none", border: "none", cursor: "pointer", color: t.danger, padding: 2 }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && brand.ragLinked && (
            <p style={{ color: t.text3, fontSize: 11, textAlign: "center", margin: "8px 0 0", fontFamily: FONT }}>
              No files yet. Upload a brand guide, SOW, or reference PDF.
            </p>
          )}
        </div>
      )}
    </div>
  );
}


// ── Main BrainScreen ──────────────────────────────────────────────────────────
export default function BrainScreen({ t, nav, showToast, onAddBrandDNA }) {
  const [brands, setBrands]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState(null);
  const [ragModalBrand, setRagModalBrand] = useState(null);

  const fetchBrands = () => {
    setLoading(true);
    fetch("/bff/brands", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrands();
    const handler = () => fetchBrands();
    window.addEventListener("studio-brand-created", handler);
    return () => window.removeEventListener("studio-brand-created", handler);
  }, []);

  const handleDeleteBrand = async (brandId, brandName) => {
    if (!window.confirm(`Delete Brand DNA for "${brandName}"?`)) return;
    setDeletingId(brandId);
    try {
      const res = await fetch(`/bff/brands/${brandId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        showToast(`🗑️ "${brandName}" deleted`);
        setBrands(prev => prev.filter(b => b.id !== brandId));
      } else showToast("❌ Failed to delete brand");
    } catch (_) { showToast("❌ Error"); }
    finally { setDeletingId(null); }
  };

  const handleUnlink = async (brandId, brandName) => {
    if (!window.confirm(`Unlink "${brandName}" from the knowledge base?`)) return;
    try {
      const res = await fetch(`/bff/brands/${brandId}/rag-link`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinecone_client_key: null }),
      });
      if (res.ok) {
        showToast(`"${brandName}" unlinked`);
        setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ragLinked: false, pineconeClientKey: null } : b));
      } else showToast("❌ Unlink failed");
    } catch (_) { showToast("❌ Network error"); }
  };

  const handleRagLinked = (brandId, clientKey) => {
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ragLinked: true, pineconeClientKey: clientKey } : b));
  };

  return (
    <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 36px 80px", fontFamily: FONT }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16, marginBottom: 28,
        background: t.brainSoft, border: `1px solid ${t.brain}33`,
        borderRadius: 14, padding: "22px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: t.brain, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: t.text, fontSize: 20, fontWeight: 800, margin: "0 0 3px" }}>Brand Brain</h1>
            <p style={{ color: t.text2, fontSize: 13, margin: 0 }}>Onboarded brands + connected knowledge bases</p>
          </div>
        </div>
        <button
          onClick={onAddBrandDNA}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 22px", borderRadius: 8,
            background: t.brain, color: "#fff",
            border: "none", fontWeight: 700, fontSize: 13,
            cursor: "pointer", fontFamily: FONT,
          }}
        >
          <Plus size={15} />
          Add Brand DNA
        </button>
      </div>

      {/* ── RAG info banner ─────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: t.successSoft, border: `1px solid ${t.success}44`,
        borderRadius: 10, padding: "11px 18px", marginBottom: 28,
      }}>
        <Zap size={15} color={t.success} />
        <span style={{ fontSize: 13, color: t.text2, lineHeight: 1.5 }}>
          <strong style={{ color: t.success }}>Knowledge Base (RAG)</strong> — Link each brand to its Pinecone index.
          Once linked, every copy generation for that brand auto-retrieves relevant brand materials.
        </span>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "40px 0", color: t.text3 }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading brands…</span>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!loading && brands.length === 0 && (
        <div style={{ textAlign: "center", padding: "70px 0" }}>
          <Brain size={52} color={t.brain} style={{ opacity: 0.25, marginBottom: 18 }} />
          <h2 style={{ color: t.text2, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>No brands yet</h2>
          <p style={{ color: t.text3, fontSize: 14, marginBottom: 28 }}>Add your first brand to start building your AI brand brain.</p>
          <button
            onClick={onAddBrandDNA}
            style={{
              padding: "11px 30px", borderRadius: 8,
              background: t.brain, border: "none",
              color: "#fff", fontWeight: 700, fontSize: 14,
              cursor: "pointer", fontFamily: FONT,
            }}
          >
            <Plus size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Add Brand DNA
          </button>
        </div>
      )}

      {/* ── Brand cards grid ─────────────────────────────────────────────── */}
      {!loading && brands.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 20 }}>
          {brands.map((brand) => (
            <div
              key={brand.id}
              style={{
                background: t.surface,
                border: `1px solid ${brand.ragLinked ? t.success + "55" : t.border}`,
                borderRadius: 14,
                padding: "20px 22px",
                boxShadow: t.shadow,
                transition: "border-color 0.25s, box-shadow 0.25s",
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: t.brainSoft,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: t.brain, fontSize: 15, fontWeight: 800, flexShrink: 0,
                  }}>
                    {brand.brandName?.slice(0, 2).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 style={{ color: t.text, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{brand.brandName}</h3>
                    {brand.industry && (
                      <span style={{ fontSize: 11, color: t.accentText, background: t.accentSoft, borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                        {brand.industry}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBrand(brand.id, brand.brandName)}
                  disabled={deletingId === brand.id}
                  title="Delete brand"
                  style={{ background: "none", border: "none", cursor: "pointer", color: t.danger, padding: 4, opacity: deletingId === brand.id ? 0.4 : 0.6 }}
                >
                  {deletingId === brand.id
                    ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    : <Trash2 size={14} />}
                </button>
              </div>

              {/* RAG badge */}
              <div style={{ marginBottom: 14 }}>
                <RagBadge t={t} linked={brand.ragLinked} clientKey={brand.pineconeClientKey} />
              </div>

              {/* Brand details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                {brand.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                    <Globe size={11} color={t.text3} />
                    <a
                      href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: t.brain, textDecoration: "none" }}
                    >{brand.website}</a>
                  </div>
                )}
                {brand.voice && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: t.text2 }}>
                    <Sparkles size={11} color={t.text3} />
                    Voice: <span style={{ color: t.text, fontWeight: 600 }}>{brand.voice}</span>
                  </div>
                )}
                {brand.archetype && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: t.text2 }}>
                    <Target size={11} color={t.text3} />
                    Archetype: <span style={{ color: t.text, fontWeight: 600 }}>{brand.archetype}</span>
                  </div>
                )}
                {brand.usp && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
                    <BookOpen size={11} color={t.text3} style={{ marginTop: 2 }} />
                    <span>USP: {brand.usp.length > 90 ? brand.usp.slice(0, 90) + "…" : brand.usp}</span>
                  </div>
                )}
              </div>

              {/* RAG link / unlink controls */}
              {brand.ragLinked ? (
                <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                  <div style={{
                    flex: 1, padding: "7px 11px", borderRadius: 8,
                    background: t.successSoft, border: `1px solid ${t.success}44`,
                    fontSize: 11, color: t.success, fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    <Database size={10} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {brand.pineconeClientKey}
                  </div>
                  <button
                    onClick={() => handleUnlink(brand.id, brand.brandName)}
                    style={{
                      flexShrink: 0, padding: "7px 11px", borderRadius: 8,
                      border: `1px solid ${t.dangerSoft}`,
                      background: t.dangerSoft,
                      color: t.danger, fontSize: 11, fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      fontFamily: FONT,
                    }}
                    title="Unlink"
                  >
                    <Link2Off size={11} /> Unlink
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRagModalBrand(brand)}
                  style={{
                    width: "100%", padding: "9px 0", marginBottom: 12, borderRadius: 8,
                    border: `1.5px solid ${t.brain}`,
                    background: t.brainSoft,
                    color: t.brain, fontWeight: 700, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.15s", fontFamily: FONT,
                  }}
                >
                  <Link2 size={14} />
                  Link to Knowledge Base
                </button>
              )}

              {/* DAM file panel */}
              <DamPanel t={t} brand={brand} showToast={showToast} />

              {/* Create campaign CTA */}
              <button
                onClick={() => nav("projects")}
                style={{
                  marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 8,
                  background: "transparent",
                  border: `1px solid ${t.border}`,
                  color: t.text2, fontWeight: 600, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.15s", fontFamily: FONT,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = t.surface2; e.currentTarget.style.color = t.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.text2; }}
              >
                <ArrowRight size={14} />
                Create Campaign under {brand.brandName}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* RAG Link Modal */}
      {ragModalBrand && (
        <RagMatchModal
          t={t}
          brand={ragModalBrand}
          onClose={() => setRagModalBrand(null)}
          onLinked={handleRagLinked}
          showToast={showToast}
        />
      )}
    </div>
  );
}
