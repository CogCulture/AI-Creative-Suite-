import { Brain, FileText, Target, Check, Upload, Sparkles } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { BRAND } from "../data.js";
import { Card, Btn, Chip } from "../components/primitives/index.jsx";

export default function BrainScreen({ t, nav, showToast }) {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      {/* Hero banner */}
      <div
        style={{
          borderRadius: R.lg,
          padding: 28,
          color: "#EDE9F8",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${t.brainText}, ${t.brain})`,
          boxShadow: t.shadowLg,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 88% 20%, ${t.brain2}55, transparent 40%),
                         radial-gradient(circle at 5% 95%, ${t.brain}66, transparent 42%)`,
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,.15)",
              display: "grid", placeItems: "center", marginBottom: 16,
            }}
          >
            <Brain size={24} />
          </div>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", margin: 0 }}>
            OFFGRID's Brand Brain
          </h1>
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#c9bef2", marginTop: 8, maxWidth: "56ch" }}>
            The shared memory every tool reads from and writes back to. Assembled from your
            uploaded materials and every approved asset since.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {["Every tool reads it", "Approved work feeds it", "Gets smarter each campaign"].map((f) => (
              <span
                key={f}
                style={{
                  display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11,
                  background: "rgba(255,255,255,.1)", padding: "7px 12px", borderRadius: 20,
                  border: "1px solid rgba(255,255,255,.14)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}
        className="two-col"
      >
        {/* Indexed sources */}
        <Card t={t} style={{ padding: 20 }}>
          <h3
            style={{
              fontFamily: FONT, fontWeight: 700, fontSize: 15, display: "flex",
              alignItems: "center", gap: 8, marginBottom: 16, color: t.text,
            }}
          >
            <FileText size={16} style={{ color: t.brain }} />
            Indexed sources
          </h3>
          {[
            ["brand-guidelines-2025.pdf", "PDF · 18 pages"],
            ["tone-of-voice.docx", "DOCX · voice + rules"],
            ["past-campaigns/", "12 approved assets"],
            ["offgrid.com", "URL · scraped"],
          ].map(([n, s]) => (
            <div
              key={n}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <div
                style={{
                  width: 34, height: 34, borderRadius: 8, background: t.surface2,
                  border: `1px solid ${t.border}`, display: "grid", placeItems: "center",
                  color: t.text3, flexShrink: 0,
                }}
              >
                <FileText size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: t.text }}>{n}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>{s}</div>
              </div>
              <span
                style={{
                  display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9.5,
                  padding: "3px 8px", borderRadius: 20, background: t.successSoft, color: t.success,
                }}
              >
                <Check size={10} />Indexed
              </span>
            </div>
          ))}
          <Btn
            t={t}
            kind="secondary"
            small
            icon={Upload}
            style={{ marginTop: 14 }}
            onClick={() => showToast("Upload dialog opened")}
          >
            Add source
          </Btn>
        </Card>

        {/* Extracted brand profile + growth card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card t={t} style={{ padding: 20 }}>
            <h3
              style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 15, display: "flex",
                alignItems: "center", gap: 8, marginBottom: 16, color: t.text,
              }}
            >
              <Target size={16} style={{ color: t.brain }} />
              Extracted brand profile
            </h3>
            {[
              ["Palette",  <div key="p" style={{ display: "flex", gap: 6 }}>{BRAND.palette.map((c) => <span key={c} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: `1px solid ${t.border}` }} />)}</div>],
              ["Voice",    <div key="v" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{BRAND.voice.map((x) => <Chip t={t} key={x}>{x}</Chip>)}</div>],
              ["Audience", <Chip t={t} key="a">17–35 urban commuters</Chip>],
              ["Never say",<div key="n" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{BRAND.never.map((x) => <Chip t={t} key={x} banned>{x}</Chip>)}</div>],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
                  borderBottom: `1px solid ${t.border}`,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO, fontSize: 11, color: t.text3, width: 74,
                    flexShrink: 0, textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{val}</div>
              </div>
            ))}
          </Card>

          <Card
            t={t}
            style={{
              padding: 18, display: "flex", alignItems: "center", gap: 14,
              background: `linear-gradient(120deg, ${t.brain}14, ${t.brain}05)`,
              border: `1px solid ${t.brain}40`,
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(150deg, ${t.brain}, ${t.brain2})`,
                display: "grid", placeItems: "center", color: "#fff", flexShrink: 0,
              }}
            >
              <Sparkles size={19} />
            </div>
            <div>
              <h4 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: t.brainText, margin: 0 }}>
                It grows on its own
              </h4>
              <p style={{ fontFamily: FONT, fontSize: 12, color: t.text2, marginTop: 2 }}>
                Every asset you approve is folded back in, so the brand voice sharpens with each
                campaign.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
