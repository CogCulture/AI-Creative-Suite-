import { useState, useEffect } from "react";
import { Plus, X, Zap, Clock, Trash2, ChevronRight, FolderOpen, Sparkles, Brain, CheckCircle, Loader2, Building2, Users, UserPlus, Mail, Shield, Trash } from "lucide-react";
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
  if (!iso) return "";
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

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export default function ProjectsScreen({ t, nav, showToast, setActiveProject }) {
  const [projects, setProjects] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Team Invite Modal States
  const [teamModalProject, setTeamModalProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Editor");
  const [inviteError, setInviteError] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  const [form, setForm] = useState({
    name: "",
    brief: "",
    brandId: "",
    assetType: "Instagram Ad Image",
  });
  const [nameError, setNameError] = useState(false);
  const [briefError, setBriefError] = useState(false);
  const [brandError, setBrandError] = useState(false);
  const [aiPhase, setAiPhase] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  // Helper to deduplicate brand list by brandName
  const deduplicateBrands = (list) => {
    const seen = new Set();
    const result = [];
    for (const b of list) {
      if (!b || !b.brandName) continue;
      const key = b.brandName.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(b);
      }
    }
    return result;
  };

  const fetchBrands = () => {
    fetch("/bff/brands", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const brandList = Array.isArray(data) ? deduplicateBrands(data) : [];
        setBrands(brandList);
        if (brandList.length > 0 && !form.brandId) {
          setForm((f) => ({ ...f, brandId: brandList[0].id || brandList[0].brandName }));
        }
      })
      .catch(() => {
        const local = JSON.parse(localStorage.getItem("studio-brands") || "[]");
        setBrands(deduplicateBrands(local));
      });
  };

  // Load brands and projects on mount and listen to brand creation events
  useEffect(() => {
    fetchBrands();

    const handleBrandCreated = () => fetchBrands();
    window.addEventListener("studio-brand-created", handleBrandCreated);

    // 2. Fetch Projects for active authenticated user
    fetch("/bff/projects", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        const localProjects = JSON.parse(localStorage.getItem("studio-projects") || "[]");
        setProjects(localProjects);
      })
      .finally(() => setLoadingProjects(false));

    return () => {
      window.removeEventListener("studio-brand-created", handleBrandCreated);
    };
  }, []);

  // Filter projects by selected brand (matches brand_id, brand_name, or legacy unassigned projects)
  const selectedBrandObj = brands.find((b) => (b.id || b.brandName) === selectedBrandFilter || b.brandName === selectedBrandFilter);
  const targetFilterName = selectedBrandObj ? selectedBrandObj.brandName.toLowerCase() : selectedBrandFilter.toLowerCase();
  const targetFilterId = selectedBrandObj ? (selectedBrandObj.id || "").toLowerCase() : selectedBrandFilter.toLowerCase();

  const filteredProjects = selectedBrandFilter === "all"
    ? projects
    : projects.filter((p) => {
        if (!p) return false;
        const pBrandId = (p.brand_id || p.brandId || "").toLowerCase();
        const pBrandName = (p.brand_name || p.brandName || "").toLowerCase();
        
        // Show legacy unassigned campaigns alongside brand campaigns so no user data is lost
        if (!pBrandId && !pBrandName) return true;

        return (
          (targetFilterId && pBrandId === targetFilterId) ||
          (targetFilterName && pBrandName === targetFilterName) ||
          pBrandId === selectedBrandFilter.toLowerCase() ||
          pBrandName === selectedBrandFilter.toLowerCase()
        );
      });

  // Open Team Invite Modal & Load Members
  const openTeamModal = async (e, project) => {
    e.stopPropagation();
    setTeamModalProject(project);
    setInviteEmail("");
    setInviteError("");
    setLoadingMembers(true);

    const userInfo = JSON.parse(localStorage.getItem("studio-user-info") || "{}");
    const activeEmail = userInfo.email || "you@agency.com";
    const activeName = userInfo.name || activeEmail.split("@")[0];

    try {
      const res = await fetch(`/bff/projects/${project.id}/members`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        // Replace default fallback emails if returned
        const resolved = (data || []).map(m => {
          if (m.isOwner && (m.email === "owner@agency.com" || m.email === "user@agency.com" || m.email === "you@agency.com")) {
            return { ...m, email: activeEmail, name: activeName };
          }
          return m;
        });
        setMembers(resolved);
      } else {
        setMembers([{ id: "owner", email: activeEmail, name: activeName, role: "Owner", isOwner: true }]);
      }
    } catch (_) {
      setMembers([{ id: "owner", email: activeEmail, name: activeName, role: "Owner", isOwner: true }]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Send Team Invite
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address.");
      return;
    }
    setSendingInvite(true);
    setInviteError("");

    try {
      const res = await fetch(`/bff/projects/${teamModalProject.id}/invites`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (res.ok) {
        const newInvite = await res.json();
        setMembers((prev) => [
          ...prev,
          {
            id: newInvite.id,
            email: newInvite.email,
            name: newInvite.email.split("@")[0],
            role: newInvite.role,
            status: "pending",
            isOwner: false,
          },
        ]);
        setInviteEmail("");
        showToast(`Invitation sent to ${newInvite.email} (${newInvite.role})`);
      } else {
        const err = await res.json();
        setInviteError(err.detail || "Failed to send invitation.");
      }
    } catch (_) {
      setInviteError("Network error. Could not send invite.");
    } finally {
      setSendingInvite(false);
    }
  };

  // Remove / Revoke Team Invite
  const handleRemoveMember = async (inviteId) => {
    try {
      await fetch(`/bff/projects/${teamModalProject.id}/invites/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setMembers((prev) => prev.filter((m) => m.id !== inviteId));
      showToast("Team invitation revoked");
    } catch (_) {
      showToast("Failed to remove member");
    }
  };

  const handleCreate = async () => {
    const brandObj = brands.find(b => (b.id || b.brandName) === form.brandId) || brands[0];
    const targetBrandId = brandObj ? (brandObj.id || brandObj.brandName) : "";
    const targetBrandName = brandObj ? brandObj.brandName : "";

    setNameError(!form.name.trim());
    setBriefError(!form.brief.trim());
    setBrandError(!targetBrandId);

    if (!form.name.trim() || !form.brief.trim() || !targetBrandId) return;

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
          brand_name: targetBrandName,
        }),
      });
      if (res.ok) {
        workflowConfig = await res.json();
        setAiResult(workflowConfig);
        setAiPhase("done");
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
          brand_id: targetBrandId,
          brand_name: targetBrandName,
          workflow_config: workflowConfig,
        }),
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects((prev) => [newProject, ...prev]);

        // Save to localStorage as fallback
        try {
          const localProjects = JSON.parse(localStorage.getItem("studio-projects") || "[]");
          localStorage.setItem("studio-projects", JSON.stringify([newProject, ...localProjects]));
        } catch (_) {}

        setShowModal(false);
        setAiPhase(null);
        setAiResult(null);
        setForm({ name: "", brief: "", brandId: brands[0]?.id || "", assetType: "Instagram Ad Image" });
        setNameError(false);
        setBriefError(false);
        setBrandError(false);
        showToast(`✨ Campaign "${newProject.name}" linked to ${targetBrandName} — opening storyboard...`);
        setActiveProject(newProject);
        nav("storyboard", newProject);
      } else {
        throw new Error("Failed to save campaign project");
      }
    } catch (err) {
      showToast("Failed to save campaign project. Please try again.");
      setAiPhase(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`/bff/projects/${id}`, { method: "DELETE", credentials: "include" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Campaign project deleted");
    } catch (err) {
      showToast("Failed to delete project");
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
          <H1 t={t}>Campaign Projects</H1>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: t.text2, marginTop: 6, lineHeight: 1.5 }}>
            Manage brand campaigns. Select a brand to view linked campaigns, invite team members, or launch multi-agent workflows.
          </p>
        </div>
        <Btn t={t} kind="dark" icon={Plus} onClick={() => setShowModal(true)}>
          New Campaign
        </Btn>
      </div>

      {/* Brand Selection Filter Bar */}
      <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: t.surface, border: `1px solid ${t.border}`, padding: "12px 18px", borderRadius: R.md }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Building2 size={16} style={{ color: t.accent }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: FONT }}>Filter by Brand:</span>
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: R.md,
              border: `1px solid ${t.borderStrong}`,
              background: t.surface2,
              color: t.text,
              fontFamily: FONT,
              fontSize: 13,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Brands ({brands.length})</option>
            {brands.map((b) => (
              <option key={b.id || b.brandName} value={b.id || b.brandName}>
                {b.brandName} {b.industry ? `(${b.industry})` : ""}
              </option>
            ))}
          </select>
        </div>

        {brands.length === 0 && (
          <span style={{ fontSize: 12, color: t.text3, fontFamily: FONT }}>
            No brands onboarded yet. Create a brand to link campaigns.
          </span>
        )}
      </div>

      {/* Campaign list */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        {loadingProjects ? (
          <Card t={t} style={{ padding: "48px 32px", textAlign: "center" }}>
            <Loader2 size={24} style={{ color: t.text3, margin: "0 auto 12px", animation: "spin 1s linear infinite" }} />
            <div style={{ fontFamily: FONT, fontSize: 13, color: t.text3 }}>Loading campaign projects...</div>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card t={t} style={{ padding: "48px 32px", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
              background: `linear-gradient(135deg, ${t.accent}20, ${t.brain}10)`,
              border: `1px solid ${t.border}`,
              display: "grid", placeItems: "center",
            }}>
              <FolderOpen size={28} style={{ color: t.text3 }} />
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17, color: t.text }}>No campaigns found</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: t.text3, marginTop: 6, maxWidth: 360, margin: "6px auto 0" }}>
              {selectedBrandFilter === "all"
                ? "Create your first campaign project to launch a multi-agent workflow — Strategy → Copy Agent → Image Engine."
                : "No campaigns created for this brand yet."}
            </div>
            <Btn t={t} kind="accent" icon={Sparkles} onClick={() => setShowModal(true)}
              style={{ marginTop: 20, display: "inline-flex" }}>
              Create New Campaign
            </Btn>
          </Card>
        ) : (
          filteredProjects.map((p) => {
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{p.name}</span>
                    {p.brand_name && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, fontFamily: MONO, color: t.accentText,
                        background: t.accentSoft, border: `1px solid ${t.border}`, padding: "2px 8px", borderRadius: 999
                      }}>
                        {p.brand_name}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12.5, color: t.text2, marginTop: 4,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.brief}
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} /> {timeSince(p.createdAt)}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{p.assetType || p.asset_type}</span>
                  </div>
                </div>

                {/* Team Members Button & Status */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveProject(p);
                      nav("storyboard", p);
                    }}
                    title="Open campaign storyboard planner"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: R.md,
                      border: `1px solid ${t.borderStrong}`, background: t.surface2,
                      color: t.text2, fontFamily: FONT, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all .15s"
                    }}
                  >
                    <Sparkles size={13} style={{ color: t.brain }} />
                    <span>Storyboard</span>
                  </button>

                  <button
                    onClick={(e) => openTeamModal(e, p)}
                    title="Invite & manage campaign team members"
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: R.md,
                      border: `1px solid ${t.borderStrong}`, background: t.surface2,
                      color: t.text2, fontFamily: FONT, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", transition: "all .15s"
                    }}
                  >
                    <UserPlus size={13} style={{ color: t.accent }} />
                    <span>Invite Team</span>
                  </button>

                  <span style={{
                    fontFamily: MONO, fontSize: 10, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
                    background: sc.bg, color: sc.text,
                  }}>
                    ● {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                  <button onClick={(e) => handleDelete(e, p.id)}
                    title="Delete project"
                    style={{
                      background: "none", border: "none", color: t.text3,
                      cursor: "pointer", padding: 6, borderRadius: R.md,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "color .15s, background .15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = t.text3; e.currentTarget.style.background = "none"; }}
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={16} style={{ color: t.text3 }} />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Team Invites Modal ── */}
      {teamModalProject && (
        <div
          onClick={() => setTeamModalProject(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(5px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480, background: t.surface, borderRadius: R.xl,
              border: `1px solid ${t.border}`, boxShadow: t.shadowLg, padding: 28, fontFamily: FONT,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Users size={18} style={{ color: t.accent }} />
                  <span style={{ fontWeight: 800, fontSize: 17, color: t.text }}>Campaign Collaborators</span>
                </div>
                <div style={{ fontSize: 12, color: t.text3 }}>
                  Invite team members to work on <b style={{ color: t.text }}>{teamModalProject.name}</b>
                </div>
              </div>
              <button
                onClick={() => setTeamModalProject(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: t.text3, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Invite Row */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                Invite by Email
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  placeholder="colleague@agency.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: R.md,
                    border: `1px solid ${inviteError ? "#EF4444" : t.borderStrong}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, fontSize: 13, outline: "none",
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    padding: "9px 10px", borderRadius: R.md,
                    border: `1px solid ${t.borderStrong}`, background: t.surface2,
                    color: t.text, fontFamily: FONT, fontSize: 12, outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Admin">Admin</option>
                </select>
                <button
                  onClick={handleSendInvite}
                  disabled={sendingInvite}
                  style={{
                    padding: "9px 16px", borderRadius: R.md, background: t.accent,
                    color: "#fff", border: "none", fontFamily: FONT, fontSize: 13, fontWeight: 600,
                    cursor: sendingInvite ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {sendingInvite ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Send"}
                </button>
              </div>
              {inviteError && <p style={{ fontSize: 11, color: "#EF4444", margin: "6px 0 0" }}>{inviteError}</p>}
            </div>

            {/* Members & Invites List */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
                Active Members ({members.length})
              </div>

              {loadingMembers ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: t.text3 }}>Loading team...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {members.map((m) => (
                    <div
                      key={m.id || m.email}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", background: t.surface2, border: `1px solid ${t.border}`, borderRadius: R.md,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 30, height: 30, borderRadius: "50%",
                            background: m.isOwner ? t.accent : t.brain,
                            color: "#fff", display: "grid", placeItems: "center",
                            fontSize: 11, fontWeight: 700, fontFamily: MONO,
                          }}
                        >
                          {m.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                            {m.name || m.email.split("@")[0]}
                          </div>
                          <div style={{ fontSize: 11, color: t.text3, fontFamily: MONO }}>{m.email}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, fontFamily: MONO,
                            padding: "2px 8px", borderRadius: 999,
                            background: m.isOwner ? t.accentSoft : t.surface3,
                            color: m.isOwner ? t.accentText : t.text2,
                            border: `1px solid ${t.border}`,
                          }}
                        >
                          {m.role} {m.status === "pending" ? "(Pending)" : ""}
                        </span>

                        {!m.isOwner && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            title="Remove invitation"
                            style={{ background: "none", border: "none", color: t.text3, cursor: "pointer", padding: 4 }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
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
                  Link campaign to a brand and launch the multi-agent workflow.
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
              
              {/* Brand Selector */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                  Select Brand <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select
                  value={form.brandId}
                  onChange={(e) => { setForm((f) => ({ ...f, brandId: e.target.value })); setBrandError(false); }}
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md, boxSizing: "border-box",
                    border: `1px solid ${brandError ? "#EF4444" : t.border}`, background: t.surface2,
                    color: t.text, fontFamily: FONT, fontSize: 13.5, outline: "none",
                  }}
                >
                  {brands.length === 0 && <option value="">No brands available</option>}
                  {brands.map((b) => (
                    <option key={b.id || b.brandName} value={b.id || b.brandName}>
                      {b.brandName} {b.industry ? `(${b.industry})` : ""}
                    </option>
                  ))}
                </select>
                {brandError && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>Brand selection is required.</p>}
              </div>

              {/* Campaign Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                  Campaign Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setNameError(false); }}
                  placeholder="e.g. Q3 Festive Push"
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: R.md, boxSizing: "border-box",
                    border: `1px solid ${nameError ? "#EF4444" : t.border}`,
                    background: t.surface2, color: t.text, fontFamily: FONT, fontSize: 13.5, outline: "none",
                    transition: "border-color .15s",
                  }}
                />
                {nameError && <p style={{ fontSize: 11, color: "#EF4444", margin: "4px 0 0" }}>Campaign name is required.</p>}
              </div>

              {/* Campaign Brief */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                  Campaign Brief <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  value={form.brief}
                  onChange={(e) => { setForm((f) => ({ ...f, brief: e.target.value })); setBriefError(false); }}
                  placeholder="Describe your campaign — product, target audience, key message, visual goals..."
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

              {/* Asset Type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: t.text, display: "block", marginBottom: 6 }}>
                  Primary Target Asset Type
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
                      ? "rgba(34,197,94,0.15)"
                      : `linear-gradient(135deg, ${t.brain}, ${t.accent})`,
                    display: "grid", placeItems: "center",
                    boxShadow: aiPhase === "done" ? "0 8px 24px rgba(34,197,94,0.2)" : `0 8px 24px ${t.brain}33`,
                  }}>
                    {aiPhase === "done" ? (
                      <CheckCircle size={28} style={{ color: "#22C55E" }} />
                    ) : (
                      <Brain size={28} color="#fff" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                    )}
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: t.text, marginBottom: 4 }}>
                      {aiPhase === "analyzing" && "Analyzing Campaign Brief..."}
                      {aiPhase === "designing" && "Configuring Multi-Agent Workflow..."}
                      {aiPhase === "done" && "Workflow Configured!"}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 11.5, color: t.text3 }}>
                      {aiPhase === "analyzing" && "Extracting brand voice, audience & key message"}
                      {aiPhase === "designing" && "Setting up Strategy → Copy → Image Agents"}
                      {aiPhase === "done" && `${aiResult?.recommended_flow?.length || 4} workflow steps initialized`}
                    </div>
                  </div>

                  {aiPhase === "done" && aiResult?.recommended_flow && (
                    <div style={{
                      display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center",
                      maxWidth: 380, marginTop: 4,
                    }}>
                      {aiResult.recommended_flow.map((step, idx) => (
                        <span key={idx} style={{
                          fontFamily: MONO, fontSize: 10, padding: "3px 8px", borderRadius: 4,
                          background: t.surface2, border: `1px solid ${t.border}`, color: t.text2,
                        }}>
                          {idx + 1}. {step.agent || step}
                        </span>
                      ))}
                    </div>
                  )}

                  {aiPhase !== "done" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <Loader2 size={14} style={{ color: t.brain, animation: "spin 1s linear infinite" }} />
                      <span style={{ fontFamily: MONO, fontSize: 11, color: t.brain }}>AI Studio Engine active</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${t.border}` }}>
              <Btn t={t} kind="ghost" onClick={() => { setShowModal(false); setAiPhase(null); setAiResult(null); }} disabled={!!aiPhase}>
                Cancel
              </Btn>
              <Btn t={t} kind="accent" icon={Sparkles} onClick={handleCreate} disabled={!!aiPhase}>
                Launch Workflow →
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
