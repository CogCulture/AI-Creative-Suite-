/* ============================================================
   STUDIO OS — Primitive components (Aura component library)
   All building blocks used across screens.
   ============================================================ */
import { useState } from "react";
import { Loader2, Check, AlertTriangle, Circle } from "lucide-react";
import { FONT, MONO, R } from "../../tokens.js";

/* ── Mono label ──────────────────────────────────────────── */
export function Mono({ t, children, style }) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: t.text3,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ── Eyebrow ─────────────────────────────────────────────── */
export function Eyebrow({ t, children }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: t.text3,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

/* ── H1 ──────────────────────────────────────────────────── */
export function H1({ t, children, style }) {
  return (
    <h1
      style={{
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 32,
        letterSpacing: "-.025em",
        lineHeight: 1.06,
        color: t.text,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

/* ── Sub ─────────────────────────────────────────────────── */
export function Sub({ t, children }) {
  return (
    <p
      style={{
        fontFamily: FONT,
        fontSize: 15,
        color: t.text2,
        marginTop: 8,
        maxWidth: "62ch",
        lineHeight: 1.55,
      }}
    >
      {children}
    </p>
  );
}

/* ── Section header ──────────────────────────────────────── */
export function SectionH({ t, title, link, onLink }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        margin: "38px 0 16px",
      }}
    >
      <h2
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 19,
          letterSpacing: "-.02em",
          color: t.text,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {link && (
        <button
          onClick={onLink}
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: t.text3,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          {link}
        </button>
      )}
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────── */
export function Btn({
  t,
  kind = "primary",
  children,
  icon: Icon,
  onClick,
  disabled,
  loading,
  small,
  hue,
  style,
  type = "button",
}) {
  const [h, setH] = useState(false);
  const acc = hue || t.accent;

  const kinds = {
    primary: {
      background: disabled ? t.surface3 : h ? (hue ? hue : t.accentHover) : acc,
      color: disabled ? t.text3 : hue ? "#fff" : t.onAccent,
      filter: h && hue ? "brightness(.93)" : "none",
      boxShadow: h && !disabled ? `0 0 0 1px ${t.borderStrong}, 0 10px 18px rgba(0,0,0,.06)` : "none",
    },
    secondary: {
      background: h && !disabled ? t.surface3 : t.surface2,
      color: t.text,
      border: `1px solid ${h ? t.borderStrong : t.border}`,
      boxShadow: h && !disabled ? `0 0 0 1px ${t.borderStrong}` : "none",
    },
    ghost: {
      background: h && !disabled ? t.surface2 : "transparent",
      color: t.text2,
    },
    dark: {
      background: h && !disabled ? t.accent : t.text,
      color: t.bg,
      boxShadow: h && !disabled ? `0 0 0 1px ${t.borderStrong}, 0 10px 18px rgba(0,0,0,.08)` : "none",
    },
    success: {
      background: t.success,
      color: "#fff",
      filter: h ? "brightness(1.08)" : "none",
      boxShadow: h && !disabled ? `0 0 0 1px ${t.borderStrong}, 0 10px 18px rgba(0,0,0,.06)` : "none",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        fontFamily: FONT,
        fontWeight: 600,
        fontSize: small ? 12.5 : 13.5,
        borderRadius: R.md,
        padding: small ? "6px 12px" : "9px 15px",
        border: "1px solid transparent",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all .14s",
        ...kinds[kind],
        ...style,
      }}
    >
      {loading ? (
        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        Icon && <Icon size={small ? 14 : 15} />
      )}
      {children}
    </button>
  );
}

/* ── Chip ────────────────────────────────────────────────── */
export function Chip({ t, children, dot, hue, banned, removable, onRemove }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: MONO,
        fontSize: 11,
        fontWeight: 500,
        padding: removable ? "4px 6px 4px 10px" : "4px 10px",
        borderRadius: R.pill,
        background: banned ? t.dangerSoft : t.surface2,
        color: banned ? t.danger : t.text2,
        border: `1px solid ${t.border}`,
        textDecoration: banned ? "line-through" : "none",
      }}
    >
      {dot && (
        <span
          style={{ width: 6, height: 6, borderRadius: 3, background: hue }}
        />
      )}
      {children}
      {removable && (
        <button
          onClick={onRemove}
          aria-label="Remove"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            padding: 0,
            opacity: 0.6,
            lineHeight: 1,
            fontSize: 12,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

/* ── Card ────────────────────────────────────────────────── */
export function Card({ t, children, style, onClick, hoverable, accentTop }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative",
        overflow: accentTop ? "hidden" : "visible",
        background: t.surface,
        border: `1px solid ${h && hoverable ? t.borderStrong : t.border}`,
        borderRadius: R.lg,
        boxShadow: h && hoverable ? t.shadow : "none",
        transition: "all .16s",
        cursor: onClick ? "pointer" : "default",
        transform: h && hoverable ? "translateY(-2px)" : "none",
        ...style,
      }}
    >
      {accentTop && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: accentTop,
          }}
        />
      )}
      {children}
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────── */
export function Toast({ t, toast }) {
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        background: t.text,
        color: t.bg,
        fontFamily: FONT,
        fontSize: 13.5,
        fontWeight: 600,
        padding: "12px 20px",
        borderRadius: R.md,
        boxShadow: t.shadowLg,
        display: "flex",
        gap: 10,
        alignItems: "center",
        animation: "toastSlideUp .45s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        whiteSpace: "nowrap",
      }}
    >
      <Check size={16} style={{ color: t.accent }} />
      {toast}
    </div>
  );
}

/* ── Status pill ─────────────────────────────────────────── */
export function StatusPill({ t, status, hue }) {
  const map = {
    done: [Check, "Done", t.success, t.successSoft],
    active: [Loader2, "Running", hue, `${hue}22`],
    queued: [Circle, "Queued", t.text3, t.surface2],
  };
  const [Icon, label, color, bg] = map[status] || map.queued;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: R.pill,
        color,
        background: bg,
      }}
    >
      <Icon
        size={10}
        style={status === "active" ? { animation: "spin 1s linear infinite" } : {}}
      />
      {label}
    </span>
  );
}

/* ── Steps tracker ───────────────────────────────────────── */
export function Steps({ t, steps, done, active }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", margin: "14px 0 2px" }}>
      {steps.map((s, i) => {
        const isDone = i < done;
        const isActive = i === active;
        return (
          <div
            key={s}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              position: "relative",
            }}
          >
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: "calc(50% + 11px)",
                  right: "calc(-50% + 11px)",
                  height: 2,
                  background: isDone ? t.success : t.border,
                }}
              />
            )}
            <div
              style={{
                width: 17,
                height: 17,
                borderRadius: 9,
                zIndex: 1,
                display: "grid",
                placeItems: "center",
                background: isDone ? t.success : isActive ? t.surface : t.surface2,
                border: `2px solid ${isDone ? t.success : isActive ? t.accent : t.border}`,
                boxShadow: isActive ? `0 0 0 3px ${t.accentSoft}` : "none",
              }}
            >
              {isDone ? (
                <Check size={9} color="#fff" />
              ) : isActive ? (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    background: t.accent,
                  }}
                />
              ) : null}
            </div>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 9.5,
                color: isDone || isActive ? t.text2 : t.text3,
                textAlign: "center",
              }}
            >
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}
