/* ============================================================
   STUDIO OS — Design tokens (light + dark)
   Exported as plain JS objects so components can access them
   via the useTheme hook.
   ============================================================ */

export const TOKENS = {
  light: {
    bg: "#F7F6F4",
    surface: "#FFFFFF",
    surface2: "#F1EFEC",
    surface3: "#E9E6E1",
    border: "#E3E0DA",
    borderStrong: "#CFCAC2",
    text: "#211E1A",
    text2: "#5C574F",
    text3: "#8B857B",
    accent: "#E8850C",
    accentHover: "#D1770A",
    accentSoft: "#FBEDD9",
    accentText: "#8A4E03",
    onAccent: "#FFFFFF",
    brain: "#6D4AE8",
    brain2: "#8A6BF2",
    brainSoft: "#EDE8FC",
    brainText: "#4A2FA0",
    success: "#1E7F4F",
    successSoft: "#DDF2E6",
    warn: "#B57611",
    warnSoft: "#FBF0D6",
    danger: "#C23B2E",
    dangerSoft: "#FAE4E1",
    sideBg: "#1C1A16",
    sideText: "#B7B2A7",
    sideActive: "rgba(255,255,255,.09)",
    shadow: "0 1px 2px rgba(30,25,18,.05), 0 4px 16px rgba(30,25,18,.06)",
    shadowLg: "0 8px 32px rgba(30,25,18,.16)",
  },
  dark: {
    bg: "#151311",
    surface: "#1E1B18",
    surface2: "#26221E",
    surface3: "#2E2924",
    border: "#332E28",
    borderStrong: "#474037",
    text: "#F2EFEA",
    text2: "#B4ADA2",
    text3: "#847D71",
    accent: "#F59E2B",
    accentHover: "#FFAE45",
    accentSoft: "#3A2B14",
    accentText: "#F7B85C",
    onAccent: "#1A1206",
    brain: "#8A6BF2",
    brain2: "#A78BFF",
    brainSoft: "#241B3D",
    brainText: "#C4B4F7",
    success: "#4CC98A",
    successSoft: "#16301F",
    warn: "#E0A94A",
    warnSoft: "#332811",
    danger: "#F07A6E",
    dangerSoft: "#3A1F1B",
    sideBg: "#100E0C",
    sideText: "#9A948A",
    sideActive: "rgba(255,255,255,.08)",
    shadow: "0 1px 2px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.35)",
    shadowLg: "0 8px 32px rgba(0,0,0,.5)",
  },
};

export const FONT = `"Manrope", ui-sans-serif, system-ui, -apple-system, sans-serif`;
export const MONO = `"JetBrains Mono", ui-monospace, Menlo, monospace`;
export const R = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
