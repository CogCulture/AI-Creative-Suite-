import { Zap, RefreshCw, Lock, Brain, ArrowRight } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { PIPELINE, toolById } from "../data.js";
import { Card, Btn, Eyebrow, H1, Sub, StatusPill } from "../components/primitives/index.jsx";

function Connector({ t, label, live, hue }) {
  return (
    <div
      style={{
        flex: "0 0 66px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        alignSelf: "center",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color: t.text2,
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: 20,
          padding: "3px 8px",
          whiteSpace: "nowrap",
          textAlign: "center",
          lineHeight: 1.2,
          boxShadow: t.shadow,
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: "100%",
          height: 2,
          background: live ? `${hue}66` : t.border,
          borderRadius: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {live && (
          <div
            style={{
              position: "absolute",
              top: -1,
              width: 16,
              height: 4,
              borderRadius: 3,
              background: `linear-gradient(90deg, transparent, ${hue})`,
              animation: "travel 1.5s linear infinite",
            }}
          />
        )}
      </div>
      <ArrowRight size={13} style={{ color: t.text3 }} />
    </div>
  );
}

export default function WorkflowScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <H1 t={t}>Spring Drop Launch</H1>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13.5,
              color: t.text2,
              marginTop: 6,
              lineHeight: 1.4,
              maxWidth: "none",
              margin: "6px 0 0",
            }}
          >
            Workflow: <b style={{ color: t.text }}>Campaign Launch</b>. Each tool runs as a step — the output of one becomes context for the next. Reorder, add or remove steps anytime.
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center", flexShrink: 0 }}>
          <Btn t={t} kind="secondary" small onClick={() => showToast("Step editor opened")}>
            Edit steps
          </Btn>
          <Btn
            t={t}
            kind="dark"
            small
            icon={Zap}
            onClick={() => showToast("Running Genfy — step 3 of 5")}
          >
            Run next step
          </Btn>
        </div>
      </div>

      {/* Brand brain banner */}
      <div
        style={{
          marginTop: 24,
          borderRadius: R.lg,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: `linear-gradient(120deg, ${t.brain}1A, ${t.brain}08)`,
          border: `1px solid ${t.brain}4D`,
        }}
      >
        <div
          style={{
            width: 34, height: 34, borderRadius: 9,
            background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`,
            display: "grid", placeItems: "center", color: "#fff", flexShrink: 0,
            boxShadow: `0 6px 14px -6px ${t.brain}`,
          }}
        >
          <Brain size={18} />
        </div>
        <div>
          <b style={{ fontFamily: FONT, fontSize: 13, color: t.brainText }}>Brand Brain</b>
          <div style={{ fontFamily: MONO, fontSize: 11, color: t.text2 }}>
            voice · palette · rules · past approved work
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontFamily: MONO,
            fontSize: 10.5,
            color: t.brain,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          feeds every step ↓
        </div>
      </div>

      {/* Drop lines */}
      <div style={{ display: "flex", justifyContent: "space-around", padding: "0 60px", marginTop: -2 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            style={{
              width: 2, height: 22,
              background: `linear-gradient(${t.brain2}, transparent)`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* Pipeline */}
      <div
        className="studio-scroll-horizontal-slim"
        style={{
          display: "flex",
          alignItems: "stretch",
          marginTop: 6,
          overflowX: "auto",
          paddingBottom: 10,
        }}
      >
        {PIPELINE.map((node, i) => {
          const tool = toolById(node.tool);
          const isActive = node.status === "active";
          return (
            <div key={node.tool} style={{ display: "flex" }}>
              <Card
                t={t}
                hoverable
                onClick={() =>
                  node.tool === "copy"
                    ? nav("tool-detail")
                    : showToast(`Opening ${tool.name}`)
                }
                style={{
                  flex: "0 0 212px",
                  width: 212,
                  padding: 16,
                  border: isActive ? `1px solid ${tool.hue}` : undefined,
                  boxShadow: isActive ? `0 0 0 3px ${tool.hue}22` : undefined,
                  opacity: node.status === "queued" ? 0.62 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 9, marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: 6, display: "grid",
                      placeItems: "center",
                      background: tool.id === "copy" ? "transparent" : tool.id === "genfy" ? "rgba(232, 85, 42, 0.12)" : `${tool.hue}1F`,
                      color: tool.hue, overflow: "hidden",
                      border: tool.id === "copy" ? "none" : tool.id === "genfy" ? "1px solid rgba(232, 85, 42, 0.35)" : `1px solid ${t.border}`,
                      boxShadow: tool.id === "genfy" ? "0 0 6px rgba(232, 85, 42, 0.25)" : "none",
                    }}
                  >
                    {tool.id === "copy" ? (
                      <img src="/images/copy_agent_logo.png" alt="Copy Agent" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)" }} />
                    ) : tool.id === "genfy" ? (
                      <img src="/images/genfy_logo.png" alt="Genfy" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "drop-shadow(0 0 3px rgba(232, 85, 42, 0.6))" }} />
                    ) : (
                      <tool.icon size={14} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, letterSpacing: "-.01em", color: t.text }}>
                      {tool.name}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: t.text3 }}>
                      STEP 0{node.step}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <StatusPill t={t} status={node.status} hue={tool.hue} />
                </div>

                <div
                  style={{
                    fontFamily: FONT, fontSize: 11.5, color: t.text2, lineHeight: 1.45,
                    background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 9, padding: 10,
                  }}
                >
                  {node.out}
                </div>
              </Card>

              {i < PIPELINE.length - 1 && (
                <Connector
                  t={t}
                  label={node.pass || "context →"}
                  live={node.status === "done" || node.status === "active"}
                  hue={tool.hue}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Approval + loop cards */}
      <div
        style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        className="two-col"
      >
        <Card t={t} style={{ padding: 18, display: "flex", gap: 14 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
              flexShrink: 0, background: t.warnSoft, color: t.warn,
            }}
          >
            <Lock size={19} />
          </div>
          <div>
            <h4 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, margin: "0 0 4px", color: t.text }}>
              Approval gates
            </h4>
            <p style={{ fontFamily: FONT, fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
              Nothing advances to the next tool until a human approves it — that's what keeps every
              step brand-safe and stops mistakes compounding down the chain.
            </p>
          </div>
        </Card>

        <Card t={t} style={{ padding: 18, display: "flex", gap: 14 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
              flexShrink: 0, background: t.brainSoft, color: t.brain,
            }}
          >
            <RefreshCw size={19} />
          </div>
          <div>
            <h4 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, margin: "0 0 4px", color: t.text }}>
              The loop closes
            </h4>
            <p style={{ fontFamily: FONT, fontSize: 12, color: t.text2, lineHeight: 1.5 }}>
              Every approved output lands in <b style={{ color: t.text }}>Assets</b> and feeds back
              into the <b style={{ color: t.text }}>Brand Brain</b> — so the next campaign starts
              smarter than this one did.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
