import { Brain } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { Btn } from "../components/primitives/index.jsx";

export default function BrainScreen({ t, onAddBrandDNA }) {
  return (
    <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 420, height: 420, top: -90, right: -80, opacity: 0.12 }} />
      <div className="spectrum-glow spectrum-glow-rainbow" style={{ width: 260, height: 260, bottom: -60, left: -90, opacity: 0.08 }} />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          borderRadius: R.lg,
          padding: 28,
          color: "#EDE9F8",
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
          <div style={{ position: "absolute", top: 0, right: 0 }}>
            <Btn t={t} kind="dark" onClick={onAddBrandDNA}>
              Add Brand DNA
            </Btn>
          </div>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: "rgba(255,255,255,.15)",
              display: "grid",
              placeItems: "center",
              marginBottom: 16,
            }}
          >
            <Brain size={24} />
          </div>
          <h1 className="font-display" style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, letterSpacing: "-.02em", margin: 0 }}>
            OFFGRID's Brand Brain
          </h1>
          <p className="font-sans" style={{ fontSize: 14, color: "#c9bef2", marginTop: 8, maxWidth: "56ch" }}>
            The shared memory every tool reads from and writes back to. Assembled from your
            uploaded materials and every approved asset since.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {["Every tool reads it", "Approved work feeds it", "Gets smarter each campaign"].map((f) => (
              <span
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: MONO,
                  fontSize: 11,
                  background: "rgba(255,255,255,.1)",
                  padding: "7px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,.14)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
