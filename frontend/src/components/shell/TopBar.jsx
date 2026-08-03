import { useState, useEffect } from "react";
import { Moon, Sun, Plus, LogOut, ChevronsUpDown } from "lucide-react";
import { FONT, MONO, R } from "../../tokens.js";
import { BRAND } from "../../data.js";

const VIEW_LABELS = {
  home: "Home",
  projects: "Projects",
  tools: "Tools",
  workspace: "Workspace",
  brain: "Brand Brain",
  assets: "Assets",
  workflow: "Spring Drop Launch",
  "tool-detail": "Copy Agent",
};

export default function TopBar({ t, mode, toggle, view, nav, activeWorkspace, workspaces = [], onSelectWorkspace, onAddWorkspace }) {
  const [userInfo, setUserInfo] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem("studio-user-info");
      if (data) setUserInfo(JSON.parse(data));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    const close = () => setShowDropdown(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showDropdown]);

  useEffect(() => {
    if (!showWorkspaceMenu) return;
    const close = () => setShowWorkspaceMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showWorkspaceMenu]);

  const handleLogout = () => {
    try {
      localStorage.removeItem("studio-logged-in");
      localStorage.removeItem("studio-user-info");
    } catch (_) {}
    fetch("/bff/auth/logout", { method: "POST" }).finally(() => {
      window.location.hash = "home";
      window.location.reload();
    });
  };

  return (
    <div
      style={{
        height: 56,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 24px",
        borderBottom: `1px solid ${t.border}`,
        background: t.bg,
        position: "sticky",
        top: 0,
        zIndex: 5,
        fontFamily: FONT,
      }}
    >
      {/* Breadcrumb */}
      <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShowWorkspaceMenu((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: t.text2,
            fontWeight: 500,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: FONT,
          }}
        >
          <b style={{ color: t.text, fontWeight: 600 }}>{activeWorkspace?.name || BRAND.name}</b>
          <ChevronsUpDown size={14} color={t.text3} />
          <span style={{ color: t.text3 }}>/</span>
          <span>{VIEW_LABELS[view] || view}</span>
        </button>

        {showWorkspaceMenu && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "calc(100% + 8px)",
              width: 260,
              background: "#fff",
              border: "1px solid #e6e8ee",
              boxShadow: t.shadowLg,
              padding: 10,
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div className="text-brand" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", padding: "4px 6px 2px" }}>
              Workspaces
            </div>
            {(workspaces.length ? workspaces : activeWorkspace ? [activeWorkspace] : []).map((workspace) => {
              const active = workspace?.id && activeWorkspace?.id === workspace.id;
              return (
                <button
                  key={workspace.id}
                  onClick={() => {
                    onSelectWorkspace?.(workspace);
                    setShowWorkspaceMenu(false);
                  }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "none",
                      background: active ? "rgba(0,0,0,.04)" : "transparent",
                      color: "#16192b",
                      cursor: "pointer",
                      fontFamily: FONT,
                      textAlign: "left",
                    }}
                  >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{workspace.name}</span>
                  {active && <span className="text-brand" style={{ fontFamily: MONO, fontSize: 10 }}>Active</span>}
                  </button>
                );
              })}
              <button
              onClick={() => {
                setShowWorkspaceMenu(false);
                onAddWorkspace?.();
              }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f7f8fa",
                  color: "#16192b",
                  cursor: "pointer",
                  fontFamily: FONT,
                  fontWeight: 600,
                  textAlign: "left",
                }}
            >
              <Plus size={15} />
              Add new workspace
            </button>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Theme toggle */}
        <button
          aria-label="Toggle theme"
          onClick={toggle}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            display: "grid",
            placeItems: "center",
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text2,
            cursor: "pointer",
          }}
        >
          {mode === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Profile Dropdown */}
        <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text2,
              cursor: "pointer",
              overflow: "hidden",
              padding: 0,
            }}
          >
            {userInfo?.picture ? (
              <img src={userInfo.picture} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>
                {(userInfo?.name || userInfo?.email || "U").substring(0, 1).toUpperCase()}
              </span>
            )}
          </button>

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 220,
                background: t.surface,
                border: `1px solid ${t.border}`,
                boxShadow: t.shadowLg,
                padding: "12px 16px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ borderBottom: `1px solid ${t.border}`, paddingBottom: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userInfo?.name || "User"}
                </div>
                <div style={{ fontSize: 11, color: t.text3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userInfo?.email || "no email provided"}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 8px",
                  background: "none",
                  border: "none",
                  color: t.danger,
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: FONT,
                  borderRadius: R.sm,
                  textAlign: "left",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = t.dangerSoft}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
