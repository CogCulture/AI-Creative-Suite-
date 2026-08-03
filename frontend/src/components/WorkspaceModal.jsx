import { useState } from "react";
import { X, Users, Mail, FolderPlus } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Btn } from "./primitives/index.jsx";

function loadInitialWorkspace() {
  try {
    return JSON.parse(localStorage.getItem("studio-active-workspace") || "null");
  } catch {
    return null;
  }
}

function parseEmails(value) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/g)
        .map((v) => v.trim())
        .filter(Boolean)
    )
  );
}

export default function WorkspaceModal({ t, mode = "create", workspace, onClose, showToast, onWorkspaceCreated }) {
  const inviteMode = mode === "invite";
  const current = workspace || (inviteMode ? loadInitialWorkspace() : null);
  const [name, setName] = useState(current?.name || "");
  const [emails, setEmails] = useState((current?.members || []).join(", "));
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = (name || current?.name || "").trim();
    if (!trimmed) {
      setError("Workspace name is required.");
      return;
    }

    const members = Array.from(new Set([...(current?.members || []), ...parseEmails(emails)]));
    const savedWorkspace = {
      id: current?.id || `workspace_${Date.now()}`,
      name: trimmed,
      members,
      createdAt: current?.createdAt || new Date().toISOString(),
      sharedProjects: current?.sharedProjects || [],
    };

    try {
      const list = JSON.parse(localStorage.getItem("studio-workspaces") || "[]");
      const next = Array.isArray(list) ? list.filter((w) => w.id !== savedWorkspace.id).concat(savedWorkspace) : [savedWorkspace];
      localStorage.setItem("studio-workspaces", JSON.stringify(next));
      localStorage.setItem("studio-active-workspace", JSON.stringify(savedWorkspace));
      localStorage.setItem("studio-workspace-invites", JSON.stringify(members));
    } catch (_) {}

    onWorkspaceCreated?.(savedWorkspace);
    showToast?.(
      inviteMode
        ? `${members.length} invite${members.length === 1 ? "" : "s"} updated for ${trimmed}.`
        : members.length
          ? `${trimmed} workspace ready with ${members.length} invite${members.length === 1 ? "" : "s"}.`
          : `${trimmed} workspace created.`
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add workspace"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 180,
        background: "rgba(15,12,8,.62)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: "100%",
          background: t.surface,
          borderRadius: 0,
          boxShadow: t.shadowLg,
          border: `1px solid ${t.border}`,
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 28px 0" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: t.text3, display: "flex", alignItems: "center", gap: 6 }}>
              <FolderPlus size={12} color={t.accent} />
              {inviteMode ? "Invite Friend" : "Add Workspace"}
            </div>
            <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: t.text, margin: "6px 0 0", letterSpacing: "-.02em" }}>
              {inviteMode ? "Invite people to this workspace" : "Create a shared team workspace"}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "none", color: t.text3, cursor: "pointer", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "22px 28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: 14, borderRadius: R.md, background: t.surface2, border: `1px solid ${t.border}` }}>
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>
              Shared access
            </div>
            <div style={{ fontSize: 13, color: t.text2, lineHeight: 1.55 }}>
              {inviteMode
                ? "Add teammates now and we'll keep this workspace synced for shared project access, brand assets, and future team invites."
                : "Add teammates now and we'll keep this workspace ready for shared project access, brand assets, and future team invites."}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
              Workspace / Team name
            </label>
            <input
              type="text"
              value={name}
              readOnly={inviteMode}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. OFFGRID Creative Team"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: R.md,
                border: `1px solid ${error ? t.danger : t.borderStrong}`,
                background: t.surface2,
                color: t.text,
                fontFamily: FONT,
                outline: "none",
              }}
            />
            {error && <p style={{ color: t.danger, fontSize: 11, marginTop: 4 }}>{error}</p>}
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 6 }}>
              <Users size={14} />
              Invite colleagues by email
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="name@company.com, teammate@company.com"
              rows={4}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: R.md,
                border: `1px solid ${t.borderStrong}`,
                background: t.surface2,
                color: t.text,
                fontFamily: FONT,
                outline: "none",
                resize: "vertical",
                lineHeight: 1.55,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: t.text3, fontSize: 11.5 }}>
              <Mail size={12} />
              Emails are stored locally for now and will be wired to the invite flow next.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn t={t} kind="secondary" onClick={onClose}>
              Cancel
            </Btn>
            <Btn t={t} kind="dark" onClick={handleSave}>
              {inviteMode ? "Invite Friend" : "Create Workspace"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
