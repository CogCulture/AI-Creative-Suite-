import { ArrowRight } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { BRAND, TOOLS, PROJECTS } from "../data.js";
import { Card, Chip, Steps, SectionH, Eyebrow, H1, Sub, Mono } from "../components/primitives/index.jsx";

export default function HomeScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <Eyebrow t={t}>OFFGRID workspace</Eyebrow>
      <H1 t={t}>Two ways to work.</H1>
      <Sub t={t}>
        Open a single tool for a quick task, or chain tools into a workflow where each step's
        output becomes context for the next. Both read OFFGRID's brand automatically.
      </Sub>

      {/* Mode cards */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 24 }}
        className="two-col"
      >
        <Card t={t} hoverable onClick={() => nav("tools")} style={{ padding: 18 }}>
          <Mono t={t}>Mode 01 · à la carte</Mono>
          <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, margin: "10px 0 6px", letterSpacing: "-.02em", color: t.text }}>
            Open a tool
          </h3>
          <p style={{ fontSize: 12.5, color: t.text2, lineHeight: 1.5, maxWidth: "34ch" }}>
            Jump straight into any of the seven tools. Brand context is injected the moment it
            opens — no setup.
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
            {TOOLS.map((tool) => (
              <div
                key={tool.id}
                style={{
                  width: 24, height: 24, borderRadius: 6, display: "grid", placeItems: "center",
                  background: tool.id === "copy" ? "transparent" : tool.id === "genfy" ? "rgba(232, 85, 42, 0.12)" : `${tool.hue}1F`,
                  color: tool.hue,
                  border: tool.id === "copy" ? "none" : tool.id === "genfy" ? "1px solid rgba(232, 85, 42, 0.35)" : `1px solid ${t.border}`,
                  boxShadow: tool.id === "genfy" ? "0 0 6px rgba(232, 85, 42, 0.25)" : "none",
                  overflow: "hidden",
                }}
              >
                {tool.id === "copy" ? (
                  <img src="/images/copy_agent_logo.png" alt="Copy Agent" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)" }} />
                ) : tool.id === "genfy" ? (
                  <img src="/images/genfy_logo.png" alt="Genfy" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "drop-shadow(0 0 3px rgba(232, 85, 42, 0.6))" }} />
                ) : (
                  <tool.icon size={11} />
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 600, color: t.text }}>
            Browse tools <ArrowRight size={14} />
          </div>
        </Card>

        <div
          className="workflow-card-premium"
          onClick={() => nav("workflow")}
          style={{
            padding: 18,
            borderRadius: R.lg,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <Mono t={t} style={{ color: "rgba(255,255,255,.55)" }}>Mode 02 · orchestrated</Mono>
            <h3 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, margin: "10px 0 6px", letterSpacing: "-.02em", color: "#ffffff" }}>
              Start a workflow
            </h3>
            <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.8)", lineHeight: 1.5, maxWidth: "34ch" }}>
              Chain tools into a campaign. The output of each step becomes context for the next —
              automatically.
            </p>
          </div>
          <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 600, color: "#ffffff" }}>
            See a live workflow <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Active projects */}
      <SectionH t={t} title="Active projects" link="View all →" onLink={() => nav("projects")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {PROJECTS.map((p) => (
          <Card key={p.name} t={t} hoverable onClick={() => nav(p.view || "projects")} style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: t.text }}>{p.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: t.text3, marginTop: 1 }}>workflow</div>
              </div>
              <Chip t={t} dot hue={p.tagHue}>{p.tag.split(" — ")[0]}</Chip>
            </div>
            <Steps t={t} steps={p.steps} done={p.done} active={p.active} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
              <Mono t={t}>{p.meta.split(" · ").slice(-1)}</Mono>
              <span style={{ fontFamily: MONO, fontSize: 10, color: t.text2 }}>{p.done}/{p.steps.length} approved</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


