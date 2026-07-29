import { Brain, Check, AlertTriangle } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { BRAND } from "../data.js";
import { Card } from "./primitives/index.jsx";

function loadBrandContext() {
  try {
    return JSON.parse(localStorage.getItem("studio-brand-context") || "null");
  } catch {
    return null;
  }
}

export default function BrandContextRail({ t, showToast }) {
  const brandContext = loadBrandContext();
  const brand = brandContext ? {
    voice: [brandContext.primaryTone, brandContext.archetype].filter(Boolean),
    audience: [brandContext.audience || brandContext.industry].filter(Boolean),
    never: (brandContext.wordsToAvoid || "").split(",").map((v) => v.trim()).filter(Boolean),
    palette: BRAND.palette,
    match: brandContext.skipDocs ? 82 : 96,
  } : BRAND;

  const Block = ({ label, children }) => (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9.5,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: t.brain2,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );

  const Tag = ({ children, ban }) => (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10.5,
        padding: "3px 8px",
        borderRadius: 6,
        background: ban ? "rgba(224,68,122,.16)" : "rgba(255,255,255,.11)",
        border: `1px solid ${ban ? "rgba(224,68,122,.3)" : "rgba(255,255,255,.13)"}`,
        color: ban ? "#f7b7ce" : "#EDE9F8",
        textDecoration: ban ? "line-through" : "none",
      }}
    >
      {children}
    </span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Brain card */}
      <div
        style={{
          borderRadius: R.lg,
          padding: 18,
          color: "#EDE9F8",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(160deg, ${t.brain}, ${t.brainText})`,
          boxShadow: t.shadow,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-20%",
            width: "60%",
            height: "80%",
            background: `radial-gradient(circle, ${t.brain2}66, transparent 70%)`,
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Brain size={15} />
            <b style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14 }}>Brand context in</b>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#c9bef2" }}>
            pulled from Brand Brain · always on
          </div>

          <Block label="Voice">
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {brand.voice.map((v) => <Tag key={v}>{v}</Tag>)}
            </div>
          </Block>
          <Block label="Audience">
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {brand.audience.map((v) => <Tag key={v}>{v}</Tag>)}
            </div>
          </Block>
          <Block label="Never say">
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {brand.never.map((v) => <Tag key={v} ban>{v}</Tag>)}
            </div>
          </Block>
          <Block label="Palette">
            <div style={{ display: "flex", gap: 5 }}>
              {brand.palette.map((c) => (
                <span
                  key={c}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: c,
                    border: "1px solid rgba(255,255,255,.2)",
                  }}
                />
              ))}
            </div>
          </Block>
        </div>
      </div>

      {/* Compliance card */}
      <Card t={t} style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <b style={{ fontFamily: FONT, fontSize: 12.5, color: t.text }}>Brand compliance</b>
          <span
            style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: t.success }}
          >
            {brand.match}%
          </span>
        </div>

        <div
          style={{ height: 7, borderRadius: 20, background: t.surface2, overflow: "hidden" }}
        >
          <div
            style={{
              width: `${brand.match}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${t.success}, #5cc78e)`,
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {[
            [true,  "Voice matches (direct, no fluff)"],
            [true,  "No banned phrases"],
            [false, "Caption 2 is 4 chars over limit"],
          ].map(([ok, txt], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: FONT,
                fontSize: 11.5,
                color: t.text2,
              }}
            >
              <span
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: ok ? t.success : t.warn,
                }}
              >
                {ok ? <Check size={8} color="#fff" /> : <AlertTriangle size={8} color="#fff" />}
              </span>
              {txt}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
