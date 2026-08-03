import { Plus, Users, Check } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Card, Btn } from "../components/primitives/index.jsx";

export default function WorkspaceScreen({
  t,
  activeWorkspace,
  workspaceList = [],
  showToast,
  onSelectWorkspace,
  onInviteFriend,
  onAddWorkspace,
}) {
  const currentList = workspaceList.length ? workspaceList : activeWorkspace ? [activeWorkspace] : [];

  return (
    <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 420, height: 420, top: -100, right: -110, opacity: 0.14 }} />
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 280, height: 280, bottom: -60, left: -80, opacity: 0.08 }} />
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div className="text-brand" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase" }}>
            Workspace
          </div>
          <h1 className="font-display text-ink" style={{ margin: "6px 0 0", fontSize: 30, lineHeight: 1.1, letterSpacing: "-.03em" }}>
            Manage shared workspaces
          </h1>
          <p className="text-muted font-sans" style={{ margin: "10px 0 0", maxWidth: "62ch", lineHeight: 1.6 }}>
            Switch between workspaces, keep shared access organized, and invite teammates from one place.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Btn t={t} kind="secondary" icon={Users} onClick={() => onInviteFriend?.(activeWorkspace)}>
            Invite Friend
          </Btn>
          <Btn t={t} kind="dark" icon={Plus} onClick={onAddWorkspace}>
            Add New Workspace
          </Btn>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 16 }} className="two-col">
        <Card t={t} style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div className="text-brand" style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em" }}>
                Current Workspace
              </div>
              <h2 className="font-display text-ink" style={{ margin: "6px 0 0", fontSize: 20 }}>
                {activeWorkspace?.name || "No workspace selected"}
              </h2>
            </div>
            {activeWorkspace && (
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: t.accent, background: t.accentSoft, padding: "4px 8px", borderRadius: 999 }}>
                Active
              </span>
            )}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 14, borderRadius: R.md, background: t.surface2, border: `1px solid ${t.border}` }}>
              <div className="text-brand" style={{ fontFamily: MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em" }}>
                Members
              </div>
              <div className="text-ink font-sans" style={{ marginTop: 8, fontSize: 14 }}>
                {activeWorkspace?.members?.length ? `${activeWorkspace.members.length} invited colleague${activeWorkspace.members.length === 1 ? "" : "s"}` : "No invites yet"}
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: R.md, background: t.surface2, border: `1px solid ${t.border}` }}>
              <div className="text-brand" style={{ fontFamily: MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em" }}>
                Shared Projects
              </div>
              <div className="text-ink font-sans" style={{ marginTop: 8, fontSize: 14 }}>
                {activeWorkspace?.sharedProjects?.length ? `${activeWorkspace.sharedProjects.length} projects linked` : "No shared projects linked"}
              </div>
            </div>
          </div>
        </Card>

        <Card t={t} style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div className="text-brand" style={{ fontFamily: MONO, fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em" }}>
                Workspaces
              </div>
              <h2 className="font-display text-ink" style={{ margin: "6px 0 0", fontSize: 20 }}>
                Switch or manage
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {currentList.length ? currentList.map((workspace) => {
              const active = activeWorkspace?.id === workspace.id;
              return (
                <button
                  key={workspace.id}
                  onClick={() => {
                    onSelectWorkspace?.(workspace);
                    showToast?.(`${workspace.name} selected`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 14,
                    borderRadius: R.md,
                    border: `1px solid ${active ? t.accent : t.border}`,
                    background: active ? t.accentSoft : t.surface2,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="text-ink" style={{ fontSize: 14, fontWeight: 700 }}>
                      {workspace.name}
                    </div>
                    <div className="text-muted" style={{ fontFamily: MONO, fontSize: 10.5, marginTop: 3 }}>
                      {workspace.members?.length ? `${workspace.members.length} members` : "No members yet"}
                    </div>
                  </div>
                  {active && <Check size={16} color={t.accent} />}
                </button>
              );
            }) : (
              <div style={{ padding: 16, borderRadius: R.md, background: t.surface2, border: `1px dashed ${t.border}`, color: t.text2, fontSize: 13, lineHeight: 1.5 }}>
                No workspaces yet. Use Add New Workspace to create one, then invite teammates from here.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
