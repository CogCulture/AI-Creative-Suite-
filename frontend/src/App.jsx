import { useState, useEffect, useRef } from "react";
import { TOKENS } from "./tokens.js";
import { NAV } from "./data.js";
import Sidebar from "./components/shell/Sidebar.jsx";
import TopBar from "./components/shell/TopBar.jsx";
import Onboarding from "./components/Onboarding.jsx";
import WorkspaceModal from "./components/WorkspaceModal.jsx";
import { Toast } from "./components/primitives/index.jsx";
import PublicShell from "./components/PublicShell.jsx";

// Screens
import HomeScreen from "./screens/HomeScreen.jsx";
import ToolsScreen from "./screens/ToolsScreen.jsx";
import ToolDetail from "./screens/ToolDetail.jsx";
import WorkflowScreen from "./screens/WorkflowScreen.jsx";
import ProjectsScreen from "./screens/ProjectsScreen.jsx";
import BrainScreen from "./screens/BrainScreen.jsx";
import WorkspaceScreen from "./screens/WorkspaceScreen.jsx";
import AssetsScreen from "./screens/AssetsScreen.jsx";
import GenfyScreen from "./screens/GenfyScreen.jsx";
import StoryboardScreen from "./screens/StoryboardScreen.jsx";

/* ── useTheme hook ─────────────────────────────────────── */
function useTheme() {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem("studio-theme") || "light";
    } catch {
      return "light";
    }
  });

  const toggle = () =>
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      try { localStorage.setItem("studio-theme", next); } catch (_) {}
      return next;
    });

  return { t: TOKENS[mode], mode, toggle };
}

/* ── App root ──────────────────────────────────────────── */
export default function App() {
  // null = still checking with server, false = not logged in, true = confirmed by server
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem("studio-logged-in") === "true" ? true : null;
    } catch (_) {
      return null;
    }
  });
  const [goToLibrarySignal, setGoToLibrarySignal] = useState(0);

  useEffect(() => {
    // Validate session with the server on every load.
    fetch("/bff/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          return res.json().then((user) => {
            try { localStorage.setItem("studio-user-info", JSON.stringify(user)); } catch (_) {}
            if (window.location.hash === "#login" || window.location.hash === "#signup") {
              window.history.replaceState(null, "", window.location.pathname.replace(/^\/+/, "/"));
            }
            setIsLoggedIn(true);
          });
        }
        // Cookie missing or expired — force login screen
        try { localStorage.removeItem("studio-logged-in"); } catch (_) {}
        setIsLoggedIn(false);
      })
      .catch(() => {
        // Network error — do not log out if we already have a session state from localStorage
        setIsLoggedIn((prev) => (prev === true ? true : false));
      });
  }, []);

  const { t, mode, toggle } = useTheme();
  const [view, setViewState] = useState(() => {
    try {
      return localStorage.getItem("studio-current-view") || "home";
    } catch (_) {
      return "home";
    }
  });
  const setView = (v) => {
    setViewState(v);
    try { localStorage.setItem("studio-current-view", v); } catch (_) {}
  };

  const [activeProject, setActiveProjectState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("studio-active-project") || "null");
    } catch (_) {
      return null;
    }
  });
  const setActiveProject = (p) => {
    setActiveProjectState(p);
    try {
      if (p) localStorage.setItem("studio-active-project", JSON.stringify(p));
      else localStorage.removeItem("studio-active-project");
    } catch (_) {}
  };
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("studio-active-workspace") || "null");
    } catch (_) {
      return null;
    }
  });
  const [workspaceList, setWorkspaceList] = useState(() => {
    try {
      let list = JSON.parse(localStorage.getItem("studio-workspaces") || "[]");
      if (Array.isArray(list) && list.length > 0) {
        if (!list.some(w => w.id === "personal-workspace")) {
          list.unshift({
            id: "personal-workspace",
            name: "Personal Workspace",
            type: "personal",
            members: [],
            sharedProjects: []
          });
        }
        if (!list.some(w => w.id === "offgrid-workspace")) {
          list.push({
            id: "offgrid-workspace",
            name: "OFFGRID",
            type: "client",
            members: [],
            sharedProjects: []
          });
        }
        return list;
      }
    } catch (_) {}
    return [
      {
        id: "personal-workspace",
        name: "Personal Workspace",
        type: "personal",
        members: [],
        sharedProjects: []
      },
      {
        id: "offgrid-workspace",
        name: "OFFGRID",
        type: "client",
        members: [],
        sharedProjects: []
      }
    ];
  });
  const [toast, setToast] = useState(null);
  const [showBrandDNA, setShowBrandDNA] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceModalMode, setWorkspaceModalMode] = useState("create");
  const [workspaceModalWorkspace, setWorkspaceModalWorkspace] = useState(null);
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1300);
  const timerRef = useRef(null);

  /* Responsive width tracking */
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  /* CSS selection highlight updates with theme */
  useEffect(() => {
    const style = document.getElementById("theme-selection-style") ||
      (() => {
        const el = document.createElement("style");
        el.id = "theme-selection-style";
        document.head.appendChild(el);
        return el;
      })();
    style.textContent = `::selection { background: ${t.accentSoft}; }`;
    document.body.style.background = t.bg;
    document.body.className = mode === "dark" ? "dark" : "light";
  }, [t, mode]);

  /* Custom scrollbar color tracking */
  useEffect(() => {
    const style = document.getElementById("scrollbar-style") ||
      (() => {
        const el = document.createElement("style");
        el.id = "scrollbar-style";
        document.head.appendChild(el);
        return el;
      })();
    style.textContent = `
      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      ::-webkit-scrollbar-track {
        background: transparent !important;
      }
      ::-webkit-scrollbar-thumb,
      .studio-scroll::-webkit-scrollbar-thumb,
      .thin-scrollbar::-webkit-scrollbar-thumb {
        background: ${t.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'};
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover,
      .studio-scroll::-webkit-scrollbar-thumb:hover,
      .thin-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${t.mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'};
      }
    `; 
  }, [t]);

  useEffect(() => {
    try {
      if (activeWorkspace) {
        localStorage.setItem("studio-active-workspace", JSON.stringify(activeWorkspace));
      } else {
        localStorage.removeItem("studio-active-workspace");
      }
    } catch (_) {}
  }, [activeWorkspace]);

  useEffect(() => {
    try {
      localStorage.setItem("studio-workspaces", JSON.stringify(workspaceList));
    } catch (_) {}
  }, [workspaceList]);

  useEffect(() => {
    if (!activeWorkspace && workspaceList.length > 0) {
      setActiveWorkspace(workspaceList[0]);
    }
  }, [activeWorkspace, workspaceList]);

  const showToast = (msg) => {
    clearTimeout(timerRef.current);
    let strMsg = msg;
    if (typeof msg !== "string") {
      if (Array.isArray(msg)) {
        strMsg = msg.map(m => (typeof m === "object" ? (m.msg || JSON.stringify(m)) : String(m))).join(", ");
      } else if (typeof msg === "object" && msg !== null) {
        strMsg = msg.detail
          ? (typeof msg.detail === "string" ? msg.detail : JSON.stringify(msg.detail))
          : (msg.message || JSON.stringify(msg));
      } else {
        strMsg = String(msg || "");
      }
    }
    setToast(strMsg);
    timerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const nav = (id, projectData, options) => {
    if (id === "hr") {
      window.location.href = "https://testhr.duckdns.org/";
      return;
    }
    if (projectData !== undefined) setActiveProject(projectData);
    if (options?.fresh) {
      setActiveProject(null);
      // Clear default workflow state from localStorage
      try {
        localStorage.removeItem("studio-wf-state-default-status");
        localStorage.removeItem("studio-wf-state-default-inputs");
        localStorage.removeItem("studio-wf-state-default-outputs");
        localStorage.removeItem("studio-wf-state-default-masterState");
        localStorage.removeItem("studio-wf-state-default-masterFeedback");
      } catch (_) {}
    }
    setView(id);
    const s = document.getElementById("studio-scroll");
    if (s) s.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openCreateWorkspace = () => {
    setWorkspaceModalMode("create");
    setWorkspaceModalWorkspace(null);
    setShowWorkspaceModal(true);
  };

  const openInviteWorkspace = (workspace = activeWorkspace) => {
    setWorkspaceModalMode("invite");
    setWorkspaceModalWorkspace(workspace || null);
    setShowWorkspaceModal(true);
  };

  const handleWorkspaceSaved = (workspace) => {
    setActiveWorkspace(workspace);
    setWorkspaceList((prev) => {
      const next = prev.filter((w) => w.id !== workspace.id).concat(workspace);
      return next;
    });
  };

  const handleDeleteWorkspace = (workspaceId) => {
    setWorkspaceList((prev) => {
      const next = prev.filter((w) => w.id !== workspaceId);
      return next;
    });
    if (activeWorkspace?.id === workspaceId) {
      setActiveWorkspace(null);
    }
  };

  const compact = w < 1080;
  const shared = { t, nav, showToast, activeWorkspace, workspaceList };

  if (isLoggedIn === null) {
    // Still verifying session with server — show blank screen to avoid flash
    return (
      <div style={{ height: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid #e5e7eb", borderTopColor: "#111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <PublicShell
        onLogin={() => {
          setIsLoggedIn(true);
          try { localStorage.setItem("studio-logged-in", "true"); } catch (_) {}
        }}
      />
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        background: t.bg,
        display: "flex",
        overflow: "hidden",
        transition: "background .2s",
      }}
    >
      {/* Sidebar — hidden on mobile */}
      {w > 720 && (
        <Sidebar
          t={t}
          view={view}
          nav={nav}
          compact={compact}
          activeWorkspace={activeWorkspace}
          onOpenWorkspace={() => nav("workspace")}
          workspaces={workspaceList}
          onSelectWorkspace={handleWorkspaceSaved}
          onAddWorkspace={openCreateWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
        />
      )}

      {/* Main area */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar
          t={t}
          mode={mode}
          toggle={toggle}
          view={view}
          nav={nav}
          activeWorkspace={activeWorkspace}
          workspaces={workspaceList}
          onSelectWorkspace={(workspace) => handleWorkspaceSaved(workspace)}
          onAddWorkspace={openCreateWorkspace}
          onNavigateToLibrary={() => setGoToLibrarySignal(s => s + 1)}
        />

        <div
          id="studio-scroll"
          className="studio-scroll"
          style={{ flex: 1, overflowY: "auto" }}
        >
          {view === "home"        && <HomeScreen {...shared} />}
          {view === "tools"       && <ToolsScreen {...shared} />}
          {view === "tool-detail" && <ToolDetail {...shared} goToLibrarySignal={goToLibrarySignal} />}
          {view === "workflow"    && <WorkflowScreen {...shared} activeProject={activeProject} setActiveProject={setActiveProject} />}
          {view === "projects"    && <ProjectsScreen {...shared} setActiveProject={setActiveProject} />}
          {view === "workspace"   && <WorkspaceScreen {...shared} onSelectWorkspace={handleWorkspaceSaved} onInviteFriend={openInviteWorkspace} onAddWorkspace={openCreateWorkspace} />}
          {view === "brain"       && <BrainScreen {...shared} onAddBrandDNA={() => setShowBrandDNA(true)} />}
          {view === "assets"      && <AssetsScreen {...shared} />}
          {view === "genfy-detail" && <GenfyScreen {...shared} />}
          {view === "storyboard"   && <StoryboardScreen {...shared} activeProject={activeProject} />}
        </div>

        {/* Mobile bottom nav */}
        {w <= 720 && (
          <nav
            style={{
              display: "flex",
              background: t.sideBg,
              padding: "6px 4px calc(6px + env(safe-area-inset-bottom))",
            }}
          >
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => nav(n.id)}
                aria-label={n.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  padding: "7px 0",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: view === n.id ? t.accent : t.sideText,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9.5,
                }}
              >
                <n.icon size={18} />
                {n.label.split(" ")[0]}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Overlays */}
      {showBrandDNA && (
        <Onboarding
          t={t}
          onClose={() => setShowBrandDNA(false)}
          showToast={showToast}
          nav={nav}
        />
      )}
      {showWorkspaceModal && (
        <WorkspaceModal
          t={t}
          mode={workspaceModalMode}
          workspace={workspaceModalWorkspace}
          onClose={() => setShowWorkspaceModal(false)}
          showToast={showToast}
          onWorkspaceCreated={handleWorkspaceSaved}
        />
      )}
      <Toast t={t} toast={toast} />
    </div>
  );
}
