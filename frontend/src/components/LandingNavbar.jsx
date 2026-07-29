export default function LandingNavbar({ currentHash, onLogin }) {
  const go = (hash) => {
    window.location.hash = hash;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-white/85 backdrop-blur" style={{ borderBottom: "1px solid rgba(230,232,238,0.7)", backgroundColor: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)" }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-[70px]" style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", height: "64px", alignItems: "center", justifyContent: "space-between", padding: "0 70px" }}>

        {/* Logo */}
        <a href="#home" onClick={(e) => { e.preventDefault(); go("home"); }} style={{ display: "flex", alignItems: "center" }}>
          <img src="/images/Cog logo full (1).svg" alt="Cog Logo" style={{ height: "160px", width: "160px" }} />
        </a>

        {/* Nav Links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>

          {/* AI Intelligence Suite Dropdown */}
          <div className="dropdown relative" style={{ position: "relative" }}>
            <button
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 12px", fontSize: "14px", fontWeight: 500, color: "#16192b", background: "none", border: "none", cursor: "none", fontFamily: "Inter, system-ui, sans-serif", opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
            >
              AI Intelligence Suite
              <svg className="dropdown-caret" style={{ height: "14px", width: "14px", transition: "transform 0.2s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="dropdown-panel" style={{ position: "absolute", left: "50%", top: "100%", zIndex: 50, width: "640px", transform: "translateX(-50%)", paddingTop: "8px" }}>
              <div style={{ border: "1px solid #e6e8ee", backgroundColor: "#fff", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.12)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "32px" }}>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#16192b", marginBottom: "12px", fontFamily: "Inter Tight, system-ui, sans-serif" }}>Create</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {["Image", "Video", "Copy", "Presentation"].map(item => (
                      <a key={item} href="#" style={{ display: "block", fontSize: "13px", color: "#6b7080", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none", transition: "color 0.15s" }}
                        onMouseEnter={e => e.target.style.color = "#16192b"}
                        onMouseLeave={e => e.target.style.color = "#6b7080"}
                      >{item}</a>
                    ))}
                  </div>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#16192b", marginBottom: "12px", fontFamily: "Inter Tight, system-ui, sans-serif" }}>Manage</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {["HR", "Manage"].map(item => (
                      <a key={item} href="#" style={{ display: "block", fontSize: "13px", color: "#6b7080", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none", transition: "color 0.15s" }}
                        onMouseEnter={e => e.target.style.color = "#16192b"}
                        onMouseLeave={e => e.target.style.color = "#6b7080"}
                      >{item}</a>
                    ))}
                  </div>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#16192b", marginBottom: "12px", fontFamily: "Inter Tight, system-ui, sans-serif" }}>Research</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {["Marketplace", "Dam"].map(item => (
                      <a key={item} href="#" style={{ display: "block", fontSize: "13px", color: "#6b7080", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none", transition: "color 0.15s" }}
                        onMouseEnter={e => e.target.style.color = "#16192b"}
                        onMouseLeave={e => e.target.style.color = "#6b7080"}
                      >{item}</a>
                    ))}
                  </div>
                </div>
                <div>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#16192b", marginBottom: "12px", fontFamily: "Inter Tight, system-ui, sans-serif" }}>Build</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {["Website", "App"].map(item => (
                      <a key={item} href="#" style={{ display: "block", fontSize: "13px", color: "#6b7080", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none", transition: "color 0.15s" }}
                        onMouseEnter={e => e.target.style.color = "#16192b"}
                        onMouseLeave={e => e.target.style.color = "#6b7080"}
                      >{item}</a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resources Dropdown */}
          <div className="dropdown relative" style={{ position: "relative" }}>
            <button
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 12px", fontSize: "14px", fontWeight: 500, color: "#16192b", background: "none", border: "none", cursor: "none", fontFamily: "Inter, system-ui, sans-serif", opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
            >
              Resources
              <svg className="dropdown-caret" style={{ height: "14px", width: "14px", transition: "transform 0.2s" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div className="dropdown-panel" style={{ position: "absolute", left: "50%", top: "100%", zIndex: 50, width: "224px", transform: "translateX(-50%)", paddingTop: "8px" }}>
              <div style={{ border: "1px solid #e6e8ee", backgroundColor: "#fff", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}>
                <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#16192b", marginBottom: "12px", fontFamily: "Inter Tight, system-ui, sans-serif" }}>Resources</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {["Marketplace", "Company", "Blog", "Support"].map(item => (
                    <a key={item} href="#" style={{ display: "block", fontSize: "13px", color: "#6b7080", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none", transition: "color 0.15s" }}
                      onMouseEnter={e => e.target.style.color = "#16192b"}
                      onMouseLeave={e => e.target.style.color = "#6b7080"}
                    >{item}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise */}
          <a
            href="#enterprise"
            onClick={(e) => { e.preventDefault(); go("enterprise"); }}
            style={{ padding: "8px 12px", fontSize: "14px", fontWeight: currentHash === "enterprise" ? 600 : 500, color: "#16192b", opacity: currentHash === "enterprise" ? 1 : 0.8, textDecoration: "none", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Enterprise
          </a>

          {/* Pricing */}
          <a
            href="#pricing"
            onClick={(e) => { e.preventDefault(); go("pricing"); }}
            style={{ padding: "8px 12px", fontSize: "14px", fontWeight: currentHash === "pricing" ? 600 : 500, color: "#16192b", opacity: currentHash === "pricing" ? 1 : 0.8, textDecoration: "none", fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Pricing
          </a>
        </nav>

        {/* Auth Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => go("login")}
            style={{ padding: "8px 12px", fontSize: "14px", fontWeight: 500, color: "#16192b", opacity: 0.8, background: "none", border: "none", cursor: "none", fontFamily: "Inter, system-ui, sans-serif" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
          >
            Login
          </button>
          <button
            onClick={() => go("login")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "14px", fontWeight: 600, color: "#fff", backgroundColor: "#000", border: "none", cursor: "none", fontFamily: "Inter, system-ui, sans-serif", transition: "all 0.3s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(1)"; }}
          >
            <span>Sign Up</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </header>
  );
}
