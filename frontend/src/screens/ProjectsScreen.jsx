import { Plus } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { PROJECTS } from "../data.js";
import { Card, Btn, Chip, Steps, Eyebrow, H1, Sub } from "../components/primitives/index.jsx";

export default function ProjectsScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Eyebrow t={t}>Mode 02 · orchestrated</Eyebrow>
          <H1 t={t}>Projects</H1>
          <Sub t={t}>
            Each project threads tools into a workflow and carries context between every step.
          </Sub>
        </div>
        <Btn
          t={t}
          kind="dark"
          icon={Plus}
          onClick={() => showToast("New project — pick a template")}
        >
          New project
        </Btn>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        {PROJECTS.map((p) => (
          <Card
            key={p.name}
            t={t}
            hoverable
            onClick={() => nav(p.view || "workflow")}
            style={{
              padding: "18px 20px",
              display: "grid",
              gridTemplateColumns: "1.4fr 2fr auto",
              gap: 20,
              alignItems: "center",
            }}
            className="proj-row"
          >
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: t.text }}>
                {p.name}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: t.text3, marginTop: 3 }}>
                {p.meta}
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: MONO,
                  fontSize: 9.5,
                  padding: "3px 9px",
                  borderRadius: 20,
                  marginTop: 8,
                  background: `${p.tagHue}1F`,
                  color: p.tagHue,
                }}
              >
                ● {p.tag}
              </span>
            </div>
            <Steps t={t} steps={p.steps} done={p.done} active={p.active} />
            <Btn t={t} kind="secondary" small>
              Open →
            </Btn>
          </Card>
        ))}
      </div>
    </div>
  );
}
