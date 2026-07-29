import { ChevronsUpDown, Brain } from "lucide-react";
import { FONT, MONO, R } from "../../tokens.js";
import { BRAND, NAV } from "../../data.js";

export default function Sidebar({ t, view, nav, compact, onboard }) {
  return (
    <aside
      style={{
        width: compact ? 64 : 248,
        flexShrink: 0,
        background: t.bg,
        borderRight: `1px solid ${t.border}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: FONT,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: `1px solid ${t.border}`,
          boxSizing: "border-box",
          padding: "0 14px",
        }}
      >
        <img
          src="/images/Cog logo full (1).svg"
          alt="Cog Logo"
          style={{
            height: compact ? "28px" : "36px",
            width: "auto",
            objectFit: "contain",
            filter: t.bg === "#151311" ? "brightness(0) invert(1)" : "none",
          }}
        />
      </div>

      {/* Nav Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "14px 12px",
          gap: 4,
          flex: 1,
        }}
      >
        {/* Workspace switcher */}
        <button
          onClick={onboard}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            margin: "2px 4px 10px",
            padding: compact ? 9 : "9px 10px",
            borderRadius: R.md,
            background: t.bg === "#151311" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)",
            border: `1px solid ${t.border}`,
            cursor: "pointer",
            justifyContent: compact ? "center" : "flex-start",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: BRAND.avHue,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {BRAND.av}
          </div>
          {!compact && (
            <>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{BRAND.name}</div>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: t.text3 }}>
                  client workspace
                </div>
              </div>
              <ChevronsUpDown size={14} color={t.text3} />
            </>
          )}
        </button>

        {/* Section label */}
        {!compact && (
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".14em",
              color: t.text3,
              textTransform: "uppercase",
              padding: "10px 10px 5px",
            }}
          >
            Workspace
          </div>
        )}

        {/* Nav items */}
        {NAV.map((n) => {
          const active =
            view === n.id ||
            (n.id === "tools" && (view === "tool-detail" || view === "genfy-detail")) ||
            (n.id === "projects" && view === "workflow");
          const itemBg = active 
            ? (t.bg === "#151311" ? t.sideActive : "rgba(0,0,0,.06)") 
            : "transparent";
          return (
            <button
              key={n.id}
              onClick={() => nav(n.id)}
              title={n.label}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = t.bg === "#151311" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: compact ? 10 : "8px 10px",
                borderRadius: R.sm,
                border: "none",
                cursor: "pointer",
                background: itemBg,
                color: active ? t.text : t.text2,
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                fontFamily: FONT,
                position: "relative",
                justifyContent: compact ? "center" : "flex-start",
                transition: "background .12s",
              }}
            >
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: -12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 17,
                    borderRadius: "0 3px 3px 0",
                    background: n.brain ? t.brain2 : t.accent,
                  }}
                />
              )}
              <n.icon size={17} style={{ opacity: 0.9 }} />
              {!compact && <span>{n.label}</span>}
              {!compact && n.count != null && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: MONO,
                    fontSize: 10.5,
                    color: t.text2,
                    background: t.bg === "#151311" ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)",
                    padding: "1px 6px",
                    borderRadius: 20,
                  }}
                >
                  {n.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
