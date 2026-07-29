export default function EnterprisePage({ onLogin, onNavigate }) {
  const go = (hash) => { window.location.hash = hash; };

  const features = [
    {
      icon: (
        <svg style={{ width: "32px", height: "32px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 11 11 13 15 9" />
        </svg>
      ),
      title: "Closed-Loop Security",
      desc: "Your prompts, outputs, and brand assets never leave your isolated environment. We never train public models on your private content."
    },
    {
      icon: (
        <svg style={{ width: "32px", height: "32px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="15" y="3" width="6" height="6" rx="1" />
          <rect x="9" y="15" width="6" height="6" rx="1" />
          <path d="M6 9v3h12V9" /><path d="M12 12v-3" />
        </svg>
      ),
      title: "Brand Alignment Engine",
      desc: "Train a private model on your brand guidelines, tone of voice, and visual identity. Every output is unmistakably yours."
    },
    {
      icon: (
        <svg style={{ width: "32px", height: "32px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: "Team & Role Management",
      desc: "Granular permissions, approval workflows, and real-time collaboration across unlimited seats."
    },
    {
      icon: (
        <svg style={{ width: "32px", height: "32px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: "Usage Analytics",
      desc: "Understand adoption, content performance, and team productivity with enterprise dashboards and export."
    },
    {
      icon: (
        <svg style={{ width: "32px", height: "32px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
        </svg>
      ),
      title: "Dedicated Support",
      desc: "A named Customer Success Manager, SLA-backed uptime guarantees, and 24/7 priority support channels."
    },
    {
      icon: (
        <svg style={{ width: "32px", height: "32px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
      title: "API & Integrations",
      desc: "Connect Cog Culture to your existing stack with a robust REST API, webhooks, and native integrations."
    }
  ];

  const trustedBy = [
    { name: "Bharti", src: "/images/bb.png" },
    { name: "Panasonic", src: "/images/pp.png" },
    { name: "Cashfree", src: "/images/cp.png" },
  ];

  return (
    <div style={{ backgroundColor: "#fff", color: "#16192b", fontFamily: "Inter, system-ui, sans-serif", overflowX: "hidden" }}>

      {/* HERO */}
      <section style={{ position: "relative", backgroundColor: "#fff", padding: "80px 0 64px", textAlign: "center", overflow: "hidden" }}>
        <div className="spectrum-rainbow-top" style={{ opacity: 0.18 }} />
        <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: "550px", height: "550px", top: "-100px", right: "-100px", opacity: 0.22 }} />
        <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: "400px", height: "400px", bottom: 0, left: "-120px", opacity: 0.18 }} />
        <div style={{ position: "relative", zIndex: 10, maxWidth: "800px", margin: "0 auto", padding: "0 70px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "16px" }}>ENTERPRISE</p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#16192b", fontFamily: "Inter Tight, system-ui, sans-serif", margin: "0 0 24px" }}>
            AI built for the way<br /><span style={{ color: "#000", fontWeight: 700 }}>enterprise teams create.</span>
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#6b7080", maxWidth: "600px", margin: "0 auto 40px" }}>
            Security, control, and brand alignment at scale. Give every team the full power of Cog Culture inside a private, compliant environment tailored to your organisation.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => go("login")}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 36px", fontSize: "14px", fontWeight: 600, color: "#fff", backgroundColor: "#000", border: "none", cursor: "none", fontFamily: "Inter, system-ui, sans-serif", transition: "all 0.3s ease" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.filter = "brightness(1)"; }}
            >
              <span>Talk to our team</span>
              <span>→</span>
            </button>
            <a
              href="#pricing"
              onClick={e => { e.preventDefault(); go("pricing"); }}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 36px", fontSize: "14px", fontWeight: 600, color: "#16192b", backgroundColor: "#fff", border: "0.5px solid #000", cursor: "none", fontFamily: "Inter, system-ui, sans-serif", textDecoration: "none", transition: "all 0.3s ease" }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#ddd"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#fff"; }}
            >
              See pricing
            </a>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section style={{ backgroundColor: "#f7f8fa", padding: "40px 70px", borderTop: "1px solid #e6e8ee", borderBottom: "1px solid #e6e8ee" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap", justifyContent: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b7080", flexShrink: 0 }}>TRUSTED BY</p>
          {trustedBy.map(b => (
            <img key={b.name} src={b.src} alt={b.name} style={{ height: "40px", width: "auto", objectFit: "contain", opacity: 0.7, filter: "grayscale(100%)" }} />
          ))}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section style={{ backgroundColor: "#fff", padding: "80px 70px" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "12px" }}>WHAT YOU GET</p>
            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-0.02em", color: "#16192b", fontFamily: "Inter Tight, system-ui, sans-serif" }}>
              Everything a modern enterprise needs.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "7px" }}>
            {features.map((f, i) => (
              <div key={i} style={{ border: "0.5px solid rgba(22,25,43,0.18)", padding: "32px", backgroundColor: "#fff", transition: "border-color 0.3s, background-color 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(22,25,43,0.5)"; e.currentTarget.style.backgroundColor = "#f7f8fa"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(22,25,43,0.18)"; e.currentTarget.style.backgroundColor = "#fff"; }}
              >
                <div style={{ marginBottom: "16px", color: "#000" }}>{f.icon}</div>
                <h3 style={{ fontSize: "17px", fontWeight: 600, fontFamily: "Inter Tight, system-ui, sans-serif", color: "#16192b", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#6b7080" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", overflow: "hidden", padding: "80px 70px", textAlign: "center", backgroundColor: "#000", color: "#fff" }}>
        <div style={{ position: "relative", zIndex: 2, maxWidth: "720px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "Inter Tight, system-ui, sans-serif", marginBottom: "20px" }}>
            Ready to bring Cog Culture to your enterprise?
          </h2>
          <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.75)", marginBottom: "36px", maxWidth: "520px", margin: "0 auto 36px" }}>
            Our team will walk you through the security model, onboarding, and custom deployment options for your organisation.
          </p>
          <button
            onClick={() => go("login")}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 40px", fontSize: "14px", fontWeight: 600, color: "#000", backgroundColor: "#fff", border: "none", cursor: "none", fontFamily: "Inter, system-ui, sans-serif", transition: "all 0.3s ease" }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#ddd"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#fff"; }}
          >
            <span>Book a demo</span>
            <span>→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "#dddddd", paddingTop: "64px" }}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 70px 64px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "48px" }}>
          {[
            { title: "AI Intelligence Suite", links: ["Create", "Manage", "Research", "Build"] },
            { title: "Support", links: ["Help Centre", "Download and install", "Cog Community", "Cog Learn"] },
            { title: "Enterprise", links: ["Marketplace", "Company", "Blog"] },
            { title: "Company", links: ["Careers", "Contact", "Press"] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#000", marginBottom: "24px" }}>{col.title}</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {col.links.map(l => (
                  <li key={l}><a href="#" style={{ fontSize: "13px", color: "#000", textDecoration: "none" }} onMouseEnter={e => e.target.style.textDecoration = "underline"} onMouseLeave={e => e.target.style.textDecoration = "none"}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: "#000", padding: "28px 70px" }}>
          <div style={{ maxWidth: "80rem", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#fff" }}>COPYRIGHT COG CULTURE {new Date().getFullYear()}</p>
            <div style={{ display: "flex", gap: "20px" }}>
              {["Privacy", "Terms", "Cookies"].map(l => (
                <a key={l} href="#" style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "#fff"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.7)"}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
