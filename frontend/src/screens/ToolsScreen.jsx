import { Plus, ChevronRight } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { TOOLS, WORKFLOW_TEMPLATES, toolById } from "../data.js";
import { Card, Btn, Eyebrow, H1, Sub, SectionH } from "../components/primitives/index.jsx";

export default function ToolsScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 40px 80px", fontFamily: FONT }}>
      <H1 t={t}>Tools</H1>
      <Sub t={t}>
        Open any tool directly for a quick task — each reads OFFGRID's brand automatically. Or
        tap + to drop it into a workflow instead.
      </Sub>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(258px,1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        {TOOLS.map((tool) => (
          <Card key={tool.id} t={t} hoverable accentTop={tool.hue} style={{ padding: 20 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                marginBottom: 16,
                background: tool.id === "copy" ? "transparent" : tool.id === "genfy" ? "rgba(232, 85, 42, 0.12)" : `${tool.hue}1F`,
                color: tool.hue,
                overflow: "hidden",
                border: tool.id === "copy" ? "none" : tool.id === "genfy" ? "1px solid rgba(232, 85, 42, 0.35)" : `1px solid ${t.border}`,
                boxShadow: tool.id === "genfy" ? "0 0 12px rgba(232, 85, 42, 0.3)" : "none",
              }}
            >
              {tool.id === "copy" ? (
                <img src="/images/copy_agent_logo.png" alt="Copy Agent" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)" }} />
              ) : tool.id === "genfy" ? (
                <img src="/images/genfy_logo.png" alt="Genfy" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "drop-shadow(0 0 4px rgba(232, 85, 42, 0.6))" }} />
              ) : (
                <tool.icon size={22} />
              )}
            </div>
            <h3
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 16.5,
                letterSpacing: "-.01em",
                color: t.text,
                margin: "0 0 4px 0",
              }}
            >
              {tool.name}
            </h3>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 12.5,
                color: t.text2,
                marginTop: 6,
                lineHeight: 1.45,
                minHeight: 54,
              }}
            >
              {tool.desc}
            </p>
            <div style={{ display: "flex", gap: 5, margin: "14px 0" }}>
              {tool.tags.map((tg) => (
                <span
                  key={tg}
                  style={{
                    fontFamily: MONO,
                    fontSize: 9.5,
                    color: t.text3,
                    background: t.surface2,
                    padding: "2px 7px",
                    borderRadius: 5,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {tg}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                t={t}
                hue={tool.hue}
                onClick={() =>
                  tool.id === "copy"
                    ? nav("tool-detail")
                    : tool.id === "genfy"
                    ? nav("genfy-detail")
                    : showToast(`${tool.name} — coming soon`)
                }
                style={{ flex: 1 }}
              >
                Open
              </Btn>
              <Btn
                t={t}
                kind="secondary"
                onClick={() => showToast(`${tool.name} added to workflow`)}
                icon={Plus}
                style={{ width: 36, padding: 0 }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Workflow templates */}
      <SectionH t={t} title="Start from a workflow template" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
          gap: 16,
        }}
      >
        {WORKFLOW_TEMPLATES.map((w) => (
          <Card
            key={w.name}
            t={t}
            hoverable
            onClick={() => showToast(`Starting "${w.name}" workflow`)}
            style={{ padding: 18 }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 16,
                color: t.text,
                marginBottom: 10,
              }}
            >
              {w.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              {w.flow.map((id, i) => {
                const tl = toolById(id);
                return (
                  <div
                    key={id}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    {i > 0 && <ChevronRight size={12} style={{ color: t.text3 }} />}
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        background: `${tl.hue}1F`,
                        color: tl.hue,
                        display: "grid",
                        placeItems: "center",
                      }}
                      title={tl.name}
                    >
                      <tl.icon size={13} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
