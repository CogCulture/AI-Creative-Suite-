import { useState, useEffect, useRef } from "react";
import {
  Brain, Plus, Trash2, Globe, Target, Sparkles, Building2,
  BookOpen, Layers, ExternalLink, ArrowRight, Link2, Link2Off,
  Upload, FileText, CheckCircle2, AlertCircle, Loader2, X,
  ChevronDown, Database, Zap
} from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Btn } from "../components/primitives/index.jsx";

// ── RAG status badge ──────────────────────────────────────────────────────────
function RagBadge({ linked, clientKey }) {
  if (linked && clientKey) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "rgba(16,185,129,0.12)", color: "#10b981",
        border: "1px solid rgba(16,185,129,0.30)",
        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
        Linked to Knowledge Base
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: "rgba(107,114,128,0.10)", color: "rgba(255,255,255,0.45)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "inline-block" }} />
      Not Linked
    </span>
  );
}

// ── RAG match modal ───────────────────────────────────────────────────────────
function RagMatchModal({ brand, onClose, onLinked, showToast }) {
  const [loading, setLoading]       = useState(true);
  const [matchData, setMatchData]   = useState(null);
  const [selected, setSelected]     = useState(null);
  const [customKey, setCustomKey]   = useState("");
  const [useCustom, setUseCustom]   = useState(false);
  const [linking, setLinking]       = useState(false);

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

  const tierColor = (tier) => tier === 1 ? "#10b981" : "#f59e0b";
  const tierLabel = (tier) => tier === 1 ? "High match" : "Possible match";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "linear-gradient(135deg,#0f1219 0%,#161b28 100%)",
        border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20,
        padding: "36px 40px", maxWidth: 560, width: "100%",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Database size={20} color="#8b5cf6" />
              <span style={{ color: "#fff", fontSize: 17, fontWeight: 700 }}>Link to Knowledge Base</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 13, margin: 0 }}>
              Select the Pinecone client key that matches <strong style={{ color: "#c4b5fd" }}>{brand.brandName}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.5)", padding: "20px 0" }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            <span>Scanning knowledge base…</span>
          </div>
        ) : !matchData?.rag_available ? (
          <div style={{ color: "#f87171", padding: "16px 0", fontSize: 14 }}>
            ⚠ RAG engine is not available. Check your PINECONE_API_KEY in backend config.
          </div>
        ) : (
          <>
            {/* Matches list */}
            {matchData.matches?.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Detected Matches</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {matchData.matches.map(m => (
                    <label key={m.client} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                      border: selected === m.client && !useCustom
                        ? `1.5px solid ${tierColor(m.tier)}`
                        : "1px solid rgba(255,255,255,0.08)",
                      background: selected === m.client && !useCustom
                        ? `rgba(${m.tier === 1 ? "16,185,129" : "245,158,11"},0.08)`
                        : "rgba(255,255,255,0.03)",
                      transition: "all 0.15s",
                    }}>
                      <input
                        type="radio" name="ragclient"
                        value={m.client}
                        checked={selected === m.client && !useCustom}
                        onChange={() => { setSelected(m.client); setUseCustom(false); }}
                        style={{ accentColor: tierColor(m.tier) }}
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{m.client}</span>
                        <span style={{ marginLeft: 10, fontSize: 11, color: tierColor(m.tier), background: `rgba(${m.tier === 1 ? "16,185,129" : "245,158,11"},0.12)`, borderRadius: 8, padding: "2px 7px" }}>
                          {tierLabel(m.tier)}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{Math.round(m.similarity * 100)}% match</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, padding: "12px 0", marginBottom: 8 }}>
                No close matches found in the knowledge base. You can enter a custom key below.
              </div>
            )}

            {/* Custom key option */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                <input type="radio" name="ragclient" checked={useCustom} onChange={() => setUseCustom(true)} />
                <span style={{ color: "rgba(255,255,255,0.70)", fontSize: 13 }}>Enter a custom client key</span>
              </label>
              {useCustom && (
                <input
                  type="text"
                  placeholder="e.g. my-brand-name"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
                    color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                />
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "11px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)",
                background: "transparent", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 14,
              }}>Cancel</button>
              <button
                onClick={handleLink}
                disabled={linking || (!selected && !customKey.trim())}
                style={{
                  flex: 2, padding: "11px 0", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  opacity: (linking || (!selected && !customKey.trim())) ? 0.5 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {linking ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Link2 size={16} />}
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
function DamPanel({ brand, showToast }) {
  const [files, setFiles]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen]         = useState(false);
  const fileRef                 = useRef(null);

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
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = res.ok ? await res.json() : null;
      if (data) {
        showToast(data.message || "✅ File uploaded");
        fetchFiles();
      } else {
        showToast("❌ Upload failed");
      }
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
      if (res.ok) {
        showToast(`🗑️ "${name}" removed`);
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        showToast("❌ Delete failed");
      }
    } catch (_) {
      showToast("❌ Network error");
    }
  };

  const statusIcon = (status) => {
    if (status === "ingested")     return <CheckCircle2 size={13} color="#10b981" />;
    if (status === "failed")       return <AlertCircle  size={13} color="#f87171" />;
    if (status === "queued")       return <Loader2      size={13} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />;
    return <FileText size={13} color="rgba(255,255,255,0.30)" />;
  };

  const statusColor = (s) =>
    s === "ingested" ? "#10b981" : s === "failed" ? "#f87171" : s === "queued" ? "#f59e0b" : "rgba(255,255,255,0.30)";

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, marginTop: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Upload size={13} />
          {brand.ragLinked ? "Manage Knowledge Assets" : "Upload Files (link brand first)"}
        </span>
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{ marginTop: 12 }}>
          {/* Upload button */}
          <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !brand.ragLinked}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 10,
              border: "1.5px dashed rgba(139,92,246,0.4)",
              background: "rgba(139,92,246,0.05)",
              color: brand.ragLinked ? "#c4b5fd" : "rgba(255,255,255,0.25)",
              fontSize: 12, fontWeight: 600, cursor: brand.ragLinked ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "all 0.2s",
            }}
          >
            {uploading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={13} />}
            {uploading ? "Uploading…" : brand.ragLinked ? "Upload PDF / Doc / Image" : "Link brand to enable uploads"}
          </button>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {files.map(f => (
                <div key={f.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {statusIcon(f.ragStatus)}
                  <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {f.correctedName || f.originalName}
                  </span>
                  {f.chunkCount && (
                    <span style={{ fontSize: 10, color: statusColor(f.ragStatus), background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 6px" }}>
                      {f.chunkCount} chunks
                    </span>
                  )}
                  <button onClick={() => handleDeleteFile(f.id, f.correctedName || f.originalName)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 2 }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && brand.ragLinked && (
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center", margin: "10px 0 0" }}>
              No files uploaded yet. Upload a brand book, brief, or SOW.
            </p>
          )}
        </div>
      )}
    </div>
  );
}


// ── Main BrainScreen ──────────────────────────────────────────────────────────
export default function BrainScreen({ t, nav, showToast, onAddBrandDNA }) {
  const [brands, setBrands]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deletingId, setDeletingId]     = useState(null);
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

  const handleUnlink = async (brandId, brandName) => {
    if (!window.confirm(`Unlink "${brandName}" from the knowledge base?`)) return;
    try {
      const res = await fetch(`/bff/brands/${brandId}/rag-link`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinecone_client_key: null }),
      });
      if (res.ok) {
        showToast(`🔗 "${brandName}" unlinked from knowledge base`);
        setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ragLinked: false, pineconeClientKey: null } : b));
      } else {
        showToast("❌ Unlink failed");
      }
    } catch (_) {
      showToast("❌ Network error");
    }
  };

  const handleRagLinked = (brandId, clientKey) => {
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, ragLinked: true, pineconeClientKey: clientKey } : b));
  };

  return (
    <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      {/* Background glow effects */}
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 420, height: 420, top: -90, right: -80, opacity: 0.12 }} />
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 260, height: 260, bottom: -60, left: -90, opacity: 0.08 }} />

      {/* Top Banner */}
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg,rgba(139,92,246,0.12) 0%,rgba(99,102,241,0.08) 100%)",
        border: "1px solid rgba(139,92,246,0.20)",
        borderRadius: 20, padding: "28px 36px", marginBottom: 36,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(139,92,246,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={24} color="#c4b5fd" />
            </div>
            <div>
              <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>Brand Brain</h1>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>Onboarded brands + connected knowledge bases</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onAddBrandDNA}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 22px", borderRadius: 12,
              background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
              border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >
            <Plus size={15} />
            Add Brand DNA
          </button>
        </div>
      </div>

      {/* RAG info banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.20)",
        borderRadius: 12, padding: "12px 20px", marginBottom: 28, fontSize: 13,
        color: "rgba(255,255,255,0.65)",
      }}>
        <Zap size={15} color="#10b981" />
        <span>
          <strong style={{ color: "#10b981" }}>Knowledge Base (RAG)</strong> — Link each brand to its Pinecone knowledge index.
          Once linked, every copy generated for that brand automatically retrieves relevant brand materials.
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "40px 0", color: "rgba(255,255,255,0.45)" }}>
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading brands…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && brands.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Brain size={48} color="rgba(139,92,246,0.3)" style={{ marginBottom: 16 }} />
          <h2 style={{ color: "rgba(255,255,255,0.35)", fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No brands yet</h2>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 14, marginBottom: 24 }}>Add your first brand to start building your AI brand brain.</p>
          <button onClick={onAddBrandDNA} style={{ padding: "11px 28px", borderRadius: 12, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            <Plus size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Add Brand DNA
          </button>
        </div>
      )}

      {/* Brand cards grid */}
      {!loading && brands.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(380px,1fr))", gap: 22 }}>
          {brands.map((brand) => (
            <div
              key={brand.id}
              style={{
                background: "linear-gradient(145deg,rgba(15,18,30,0.95) 0%,rgba(20,24,40,0.95) 100%)",
                border: brand.ragLinked
                  ? "1px solid rgba(16,185,129,0.25)"
                  : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
                padding: "22px 24px",
                position: "relative",
                overflow: "hidden",
                boxShadow: brand.ragLinked ? "0 0 30px rgba(16,185,129,0.06)" : "0 4px 24px rgba(0,0,0,0.25)",
                transition: "border-color 0.3s, box-shadow 0.3s",
              }}
            >
              {/* Card top glow */}
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: brand.ragLinked ? "rgba(16,185,129,0.08)" : "rgba(139,92,246,0.08)", filter: "blur(30px)", pointerEvents: "none" }} />

              {/* Card header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.15))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#c4b5fd", fontSize: 16, fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {brand.brandName?.slice(0, 2).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{brand.brandName}</h3>
                    {brand.industry && (
                      <span style={{ fontSize: 11, color: "#a78bfa", background: "rgba(139,92,246,0.12)", borderRadius: 8, padding: "2px 8px" }}>
                        {brand.industry}
                      </span>
                    )}
                  </div>
                </div>
                {/* Delete */}
                <button
                  onClick={() => handleDeleteBrand(brand.id, brand.brandName)}
                  disabled={deletingId === brand.id}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", padding: 4, opacity: deletingId === brand.id ? 0.4 : 1 }}
                  title="Delete brand"
                >
                  {deletingId === brand.id ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={15} />}
                </button>
              </div>

              {/* RAG Badge */}
              <div style={{ marginBottom: 14 }}>
                <RagBadge linked={brand.ragLinked} clientKey={brand.pineconeClientKey} />
              </div>

              {/* Brand details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {brand.website && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
                    <Globe size={12} />
                    <a href={brand.website.startsWith("http") ? brand.website : `https://${brand.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "none" }}>{brand.website}</a>
                  </div>
                )}
                {brand.voice && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
                    <Sparkles size={12} />
                    <span>Voice: <span style={{ color: "rgba(255,255,255,0.75)" }}>{brand.voice}</span></span>
                  </div>
                )}
                {brand.archetype && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
                    <Target size={12} />
                    <span>Archetype: <span style={{ color: "rgba(255,255,255,0.75)" }}>{brand.archetype}</span></span>
                  </div>
                )}
                {brand.usp && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
                    <BookOpen size={12} style={{ marginTop: 2 }} />
                    <span style={{ lineHeight: 1.5 }}>USP: <span style={{ color: "rgba(255,255,255,0.70)" }}>{brand.usp.length > 80 ? brand.usp.slice(0, 80) + "…" : brand.usp}</span></span>
                  </div>
                )}
              </div>

              {/* RAG Link / Unlink controls */}
              {brand.ragLinked ? (
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, padding: "7px 12px", borderRadius: 8, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)", fontSize: 11, color: "#34d399" }}>
                    <Database size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {brand.pineconeClientKey}
                  </div>
                  <button
                    onClick={() => handleUnlink(brand.id, brand.brandName)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.06)", color: "#f87171", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                    title="Unlink"
                  >
                    <Link2Off size={11} />
                    Unlink
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRagModalBrand(brand)}
                  style={{
                    width: "100%", padding: "9px 0", marginBottom: 12, borderRadius: 10,
                    border: "1.5px solid rgba(139,92,246,0.35)",
                    background: "rgba(139,92,246,0.08)",
                    color: "#c4b5fd", fontWeight: 700, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    transition: "all 0.2s",
                  }}
                >
                  <Link2 size={14} />
                  Link to Knowledge Base
                </button>
              )}

              {/* DAM Panel */}
              <DamPanel brand={brand} showToast={showToast} />

              {/* Create Campaign CTA */}
              <button
                onClick={() => nav("projects")}
                style={{
                  marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 12,
                  background: "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.10))",
                  border: "1px solid rgba(139,92,246,0.25)",
                  color: "#c4b5fd", fontWeight: 600, fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                }}
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
          brand={ragModalBrand}
          onClose={() => setRagModalBrand(null)}
          onLinked={handleRagLinked}
          showToast={showToast}
        />
      )}
    </div>
  );
}
