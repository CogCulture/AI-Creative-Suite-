import { useState, useEffect, useRef } from "react";
import LandingNavbar from "./LandingNavbar.jsx";
import LandingPage from "./LandingPage.jsx";
import PricingPage from "./PricingPage.jsx";
import EnterprisePage from "./EnterprisePage.jsx";
import LoginSignup from "./LoginSignup.jsx";

function getHash() {
  const raw = window.location.hash.replace("#", "").trim();
  return raw || "home";
}

export default function PublicShell({ onLogin }) {
  const [currentHash, setCurrentHash] = useState(getHash);

  // Cursor ref — position updated directly, no React state re-render
  const cursorRef = useRef(null);
  const rafRef = useRef(null);

  // --- Hash routing ---
  useEffect(() => {
    const onHashChange = () => setCurrentHash(getHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Auto-trigger login from ?login=true query param
  useEffect(() => {
    if (window.location.search.includes("login=true")) {
      window.location.hash = "login";
    }
  }, []);

  // --- Ref-based cursor (zero React re-render on move) ---
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    const onMove = (e) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
        el.style.opacity = "1";
      });
    };

    const onLeave = () => { el.style.opacity = "0"; };
    const onEnter = () => { el.style.opacity = "1"; };

    const onOver = (e) => {
      if (e.target.closest('a, button, select, input, textarea, summary, [role="button"], .suite-tab')) {
        el.style.opacity = "0";
      }
    };
    const onOut = (e) => {
      if (e.target.closest('a, button, select, input, textarea, summary, [role="button"], .suite-tab')) {
        el.style.opacity = "1";
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  const goTo = (hash) => { window.location.hash = hash; };

  return (
    <div className="landing-page-root" style={{ minHeight: "100vh", backgroundColor: "#fff", overflowX: "hidden" }}>
      {/* Shared Custom Dot Cursor — position via ref+RAF, no React re-render */}
      <div
        ref={cursorRef}
        id="custom-cursor"
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 9999,
          borderRadius: "50%",
          backgroundColor: "#fff",
          mixBlendMode: "difference",
          top: 0,
          left: 0,
          width: "16px",
          height: "16px",
          opacity: 0,
          transform: "translate3d(-50px, -50px, 0)",
          transition: "opacity 0.15s ease-out",
          willChange: "transform, opacity",
        }}
      />

      {/* Shared Navbar — always visible on all public pages */}
      <LandingNavbar currentHash={currentHash} onLogin={onLogin} />

      {/* Page Content */}
      {currentHash === "home" && (
        <LandingPage
          onLogin={onLogin}
          onNavigate={goTo}
        />
      )}
      {currentHash === "pricing" && (
        <PricingPage
          onLogin={onLogin}
          onNavigate={goTo}
        />
      )}
      {currentHash === "enterprise" && (
        <EnterprisePage
          onLogin={onLogin}
          onNavigate={goTo}
        />
      )}
      {(currentHash === "login" || currentHash === "signup") && (
        <LoginSignup
          onLogin={onLogin}
          onNavigate={goTo}
          defaultSignUp={currentHash === "signup"}
        />
      )}
    </div>
  );
}
