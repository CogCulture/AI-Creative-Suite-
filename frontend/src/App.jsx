import { useState, useEffect, useRef } from "react";
import { TOKENS } from "./tokens.js";
import { NAV } from "./data.js";
import Sidebar from "./components/shell/Sidebar.jsx";
import TopBar from "./components/shell/TopBar.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { Toast } from "./components/primitives/index.jsx";
import PublicShell from "./components/PublicShell.jsx";

// Screens
import HomeScreen from "./screens/HomeScreen.jsx";
import ToolsScreen from "./screens/ToolsScreen.jsx";
import ToolDetail from "./screens/ToolDetail.jsx";
import WorkflowScreen from "./screens/WorkflowScreen.jsx";
import ProjectsScreen from "./screens/ProjectsScreen.jsx";
import BrainScreen from "./screens/BrainScreen.jsx";
import AssetsScreen from "./screens/AssetsScreen.jsx";
import GenfyScreen from "./screens/GenfyScreen.jsx";

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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem("studio-logged-in") === "true";
    } catch (_) {
      return false;
    }
  });
  const { t, mode, toggle } = useTheme();
  const [view, setView] = useState("home");
  const [activeProject, setActiveProject] = useState(null);
  const [toast, setToast] = useState(null);
  const [onb, setOnb] = useState(false);
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
  }, [t]);

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
      .studio-scroll::-webkit-scrollbar-thumb {
        background: ${t.borderStrong};
        border-color: ${t.bg};
      }
    `;
  }, [t]);

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

  const nav = (id, projectData) => {
    if (projectData !== undefined) setActiveProject(projectData);
    setView(id);
    const s = document.getElementById("studio-scroll");
    if (s) s.scrollTo({ top: 0, behavior: "smooth" });
  };

  const compact = w < 1080;
  const shared = { t, nav, showToast };

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
          onboard={() => setOnb(true)}
        />
      )}

      {/* Main area */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar t={t} mode={mode} toggle={toggle} view={view} nav={nav} onboard={() => setOnb(true)} />

        <div
          id="studio-scroll"
          className="studio-scroll"
          style={{ flex: 1, overflowY: "auto" }}
        >
          {view === "home"        && <HomeScreen {...shared} />}
          {view === "tools"       && <ToolsScreen {...shared} />}
          {view === "tool-detail" && <ToolDetail {...shared} />}
          {view === "workflow"    && <WorkflowScreen {...shared} activeProject={activeProject} setActiveProject={setActiveProject} />}
          {view === "projects"    && <ProjectsScreen {...shared} setActiveProject={setActiveProject} />}
          {view === "brain"       && <BrainScreen {...shared} />}
          {view === "assets"      && <AssetsScreen {...shared} />}
          {view === "genfy-detail" && <GenfyScreen {...shared} />}
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
      {onb && (
        <Onboarding
          t={t}
          onClose={() => setOnb(false)}
          showToast={showToast}
          nav={nav}
        />
      )}
      <Toast t={t} toast={toast} />
    </div>
  );
}
