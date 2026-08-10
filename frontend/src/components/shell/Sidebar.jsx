import { useState, useEffect, useRef } from "react";
import { ChevronsUpDown, Plus, Settings, Trash2 } from "lucide-react";
import { FONT, MONO, R } from "../../tokens.js";
import { BRAND, NAV } from "../../data.js";

export default function Sidebar({ t, view, nav, compact, activeWorkspace, onOpenWorkspace, workspaces = [], onSelectWorkspace, onAddWorkspace, onDeleteWorkspace }) {
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [activeMenuWorkspaceId, setActiveMenuWorkspaceId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!showWorkspaceMenu) return;
    const close = () => {
      setShowWorkspaceMenu(false);
      setActiveMenuWorkspaceId(null);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showWorkspaceMenu]);
  return (
    <aside
      style={{
        width: compact ? 64 : 248,
        flexShrink: 0,
        background: t.bg,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${t.border}`,
          boxSizing: "border-box",
          padding: "0 14px",
        }}
      >
        <img
          src="/images/Cog logo full (1).svg"
          alt="Cog Logo"
          style={{
            height: compact ? "28px" : "36px",
            width: "auto",
            objectFit: "contain",
            filter: t.bg === "#151311" ? "brightness(0) invert(1)" : "none",
          }}
        />
      </div>

      {/* Nav Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "14px 12px",
          gap: 4,
          flex: 1,
        }}
      >
        {/* Workspace switcher */}
        <div style={{ position: "relative" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowWorkspaceMenu(v => !v);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              width: "100%",
              margin: "2px 0 10px",
              padding: compact ? 7 : "6px 10px",
              borderRadius: R.md,
              background: t.bg === "#151311" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
              border: `1px solid ${t.border}`,
              cursor: "pointer",
              justifyContent: compact ? "center" : "flex-start",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: "#000000",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {(activeWorkspace?.name || BRAND.name).slice(0, 1).toUpperCase()}
            </div>
            {!compact && (
              <>
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{activeWorkspace?.name || BRAND.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>
                    {activeWorkspace?.type === "personal"
                      ? "personal workspace"
                      : (activeWorkspace?.members?.length ? `${activeWorkspace.members.length} members` : "client workspace")}
                  </div>
                </div>
                {/* Dropdown arrow icon */}
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={t.text3} 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{
                    transform: showWorkspaceMenu ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s"
                  }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </>
            )}
          </button>

          {showWorkspaceMenu && !compact && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(100% - 4px)",
                background: t.bg === "#151311" ? t.surface : "#fff",
                border: `1px solid ${t.border}`,
                borderRadius: R.md,
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                padding: "6px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {/* Team list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(workspaces.length ? workspaces : activeWorkspace ? [activeWorkspace] : []).map((workspace) => {
                  const active = workspace?.id && activeWorkspace?.id === workspace.id;
                  return (
                    <div
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
                        padding: "6px 8px",
                        borderRadius: R.sm,
                        background: active ? (t.bg === "#151311" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.03)") : "transparent",
                        color: t.text,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        position: "relative"
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = t.bg === "#151311" ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.02)";
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            background: "#000000",
                            display: "grid",
                            placeItems: "center",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 11,
                            flexShrink: 0,
                          }}
                        >
                          {workspace.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {workspace.name}
                        </span>
                      </div>
                      
                      {/* Three dots menu */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          setActiveMenuWorkspaceId(activeMenuWorkspaceId === workspace.id ? null : workspace.id);
                        }}
                        style={{ color: t.text3, padding: "2px", display: "flex", alignItems: "center", cursor: "pointer" }}
                        title="Workspace options"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                        </svg>
                      </div>

                      {activeMenuWorkspaceId === workspace.id && (
                        <div style={{
                          position: 'fixed',
                          top: menuPos.top,
                          right: menuPos.right,
                          background: t.bg === "#151311" ? t.surface : "#fff",
                          border: `1px solid ${t.border}`,
                          borderRadius: R.sm,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          padding: '4px',
                          zIndex: 9999,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          minWidth: 120,
                        }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              nav("workspace");
                              setShowWorkspaceMenu(false);
                              setActiveMenuWorkspaceId(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: 'transparent',
                              border: 'none',
                              color: t.text,
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              borderRadius: R.sm,
                              textAlign: 'left',
                              width: '100%',
                              fontFamily: FONT
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = t.bg === "#151311" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.03)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Settings size={12} />
                            Manage
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete workspace "${workspace.name}"?`)) {
                                onDeleteWorkspace?.(workspace.id);
                                setShowWorkspaceMenu(false);
                              }
                              setActiveMenuWorkspaceId(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: 'transparent',
                              border: 'none',
                              color: t.danger,
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              borderRadius: R.sm,
                              textAlign: 'left',
                              width: '100%',
                              fontFamily: FONT
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = t.dangerSoft}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Create new team divider & button */}
              <div style={{ borderTop: `1px solid ${t.border}`, marginTop: "4px", paddingTop: "4px" }}>
                <button
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onAddWorkspace?.();
                    nav("workspace");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px",
                    borderRadius: R.sm,
                    border: "none",
                    background: "transparent",
                    color: t.text,
                    cursor: "pointer",
                    fontFamily: FONT,
                    fontWeight: 600,
                    fontSize: 12.5,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = t.bg === "#151311" ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Plus size={15} />
                  Create new team
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section label */}
        {!compact && (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".14em",
              color: t.text3,
              textTransform: "uppercase",
              padding: "10px 10px 5px",
            }}
          >
            Workspace
          </div>
        )}

        {/* Nav items */}
        {NAV.map((n) => {
          const active =
            view === n.id ||
            (n.id === "tools" && (view === "tool-detail" || view === "genfy-detail")) ||
            (n.id === "projects" && view === "workflow");
          const itemBg = active 
            ? (t.bg === "#151311" ? t.sideActive : "rgba(0,0,0,.06)") 
            : "transparent";
          return (
            <button
              key={n.id}
              onClick={() => nav(n.id)}
              title={n.label}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = t.bg === "#151311" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: compact ? 10 : "8px 10px",
                borderRadius: R.sm,
                border: "none",
                cursor: "pointer",
                background: itemBg,
                color: active ? t.text : t.text2,
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                fontFamily: FONT,
                position: "relative",
                justifyContent: compact ? "center" : "flex-start",
                transition: "background .12s",
              }}
            >
              <n.icon size={17} style={{ opacity: 0.9 }} />
              {!compact && <span>{n.label}</span>}
              {!compact && n.count != null && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: MONO,
                    fontSize: 10.5,
                    color: t.text2,
                    background: t.bg === "#151311" ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)",
                    padding: "1px 6px",
                    borderRadius: 20,
                  }}
                >
                  {n.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
