import { useState } from "react";
import { Check } from "lucide-react";
import { FONT, MONO, R } from "../tokens.js";
import { ASSETS } from "../data.js";
import { Card, Eyebrow, H1, Sub } from "../components/primitives/index.jsx";

export default function AssetsScreen({ t, nav, showToast }) {
  const [filter, setFilter] = useState("All");

  const list =
    filter === "All"
      ? ASSETS
      : filter === "Copy"
      ? ASSETS.filter((a) => ["COPY", "STRATEGY"].includes(a.type))
      : ASSETS.filter((a) => a.g);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 40px 80px", fontFamily: FONT }}>
      <Eyebrow t={t}>Approved & saved</Eyebrow>
      <H1 t={t}>Assets</H1>
      <Sub t={t}>
        Every approved output across tools and workflows. All of it feeds back into the Brand
        Brain.
      </Sub>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, marginBottom: 18 }}>
        {["All", "Copy", "Images"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: MONO,
              fontSize: 11.5,
              fontWeight: 500,
              padding: "6px 13px",
              borderRadius: R.pill,
              cursor: "pointer",
              background: filter === f ? t.accentSoft : t.surface,
              color: filter === f ? t.accentText : t.text2,
              border: `1px solid ${filter === f ? t.accent : t.border}`,
              transition: "all .12s",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Asset grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 14,
        }}
      >
        {list.map((a) => (
          <Card
            key={a.name}
            t={t}
            hoverable
            onClick={() => showToast(`Opened "${a.name}"`)}
            style={{ overflow: "hidden" }}
          >
            {a.g ? (
              <div
                style={{
                  aspectRatio: "4/3",
                  background: `linear-gradient(135deg, ${a.g})`,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute", top: 8, left: 8, fontFamily: MONO, fontSize: 9,
                    color: "#fff", background: "rgba(0,0,0,.4)", padding: "2px 7px", borderRadius: 5,
                  }}
                >
                  {a.type}
                </span>
                <span
                  style={{
                    position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: 8,
                    background: t.success, display: "grid", placeItems: "center",
                  }}
                >
                  <Check size={9} color="#fff" />
                </span>
              </div>
            ) : (
              <div
                style={{
                  aspectRatio: "4/3",
                  background: t.surface2,
                  padding: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO, fontSize: 9, color: t.accentText,
                    background: t.accentSoft, padding: "2px 7px", borderRadius: 5,
                  }}
                >
                  {a.type}
                </span>
                <div
                  style={{
                    fontFamily: FONT, fontSize: 11.5, color: t.text3, lineHeight: 1.5, marginTop: 10,
                  }}
                >
                  The forecast doesn't get a vote. Spring Drop lands Friday — technical shells that
                  pack down smaller than your excuses…
                </div>
              </div>
            )}

            <div style={{ padding: "11px 13px" }}>
              <div
                style={{
                  fontFamily: FONT, fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 6,
                }}
              >
                {a.name}
              </div>
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 6, fontFamily: MONO,
                    fontSize: 10.5, color: t.text3,
                  }}
                >
                  <span
                    style={{
                      width: 16, height: 16, borderRadius: 8, background: a.byHue, color: "#fff",
                      display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700,
                    }}
                  >
                    {a.by[0]}
                  </span>
                  {a.by}
                </div>
                <span style={{ fontFamily: MONO, fontSize: 10, color: t.text3 }}>{a.date}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
