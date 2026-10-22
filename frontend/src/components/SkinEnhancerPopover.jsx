"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
function translateSkinEnhancerPrompt(s) {
  const parts = [];
  const versionMap = {
    Faithful: "subtly refine skin while faithfully preserving natural features, pores, and individuality",
    Creative: "creatively enhance skin with elevated luminosity and a polished editorial finish",
    Flexible: "improve skin in a balanced way  \u2014  cleaner than natural, less polished than commercial"
  };
  parts.push(versionMap[s.version]);
  const optimizeMap = {
    "Enhance skin": "focus on skin texture refinement: reduce blemishes, even out tone, improve pore quality and surface smoothness while retaining realistic texture",
    "Enhance everything": "improve all facial features: skin clarity, eye definition, lip detail, hair strand separation, and overall face sharpness",
    "Improve light": "improve skin luminosity  \u2014  add healthy subsurface glow, correct dull or flat areas, and enhance how light falls across the skin",
    "Transform to real": "make skin look authentically real: remove any plastic or AI-generated smoothness, restore natural pore texture, micro-imperfections, and genuine human skin variation",
    "No makeup": "produce a clean natural no-makeup look: even skin tone without cosmetic sheen, reduce redness and blotchiness, retain all natural skin texture and individual character"
  };
  parts.push(optimizeMap[s.optimizeFor]);
  if (s.sharpen > 0) {
    const sharpLabel = s.sharpen < 30 ? "subtle" : s.sharpen < 70 ? "moderate" : "strong";
    parts.push(`apply ${sharpLabel} detail sharpening to fine features (pores, lashes, iris texture)  \u2014  do not over-sharpen edges or skin surface`);
  }
  if (s.smartGrain > 0) {
    const grainLabel = s.smartGrain < 20 ? "minimal" : s.smartGrain < 50 ? "light" : s.smartGrain < 75 ? "moderate" : "visible";
    parts.push(`add ${grainLabel} natural film grain across the skin to break up any remaining digital smoothness and improve photographic realism`);
  } else {
    parts.push("keep skin grain-free and clean");
  }
  parts.push("preserve subject identity, pose, clothing, background, and overall composition exactly  \u2014  only improve skin and facial quality as described above");
  return `Enhance the skin and facial quality in this image: ${parts.join(". ")}.`;
}
const VERSIONS = ["Faithful", "Creative", "Flexible"];
const OPTIMIZES = ["Enhance skin", "Enhance everything", "Improve light", "Transform to real", "No makeup"];
function SkinEnhancerPopover({ onApply, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState("Flexible");
  const [optimizeFor, setOptimizeFor] = useState("Enhance skin");
  const [sharpen, setSharpen] = useState(0);
  const [smartGrain, setSmartGrain] = useState(13);
  const [versionOpen, setVersionOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const handleApply = () => {
    const prompt = translateSkinEnhancerPrompt({ version, optimizeFor, sharpen, smartGrain });
    onApply(prompt);
    onClose();
  };
  const sliderBg = (val) => `linear-gradient(to right, #f5a623 0%, #f5a623 ${val}%, #2a2a3a ${val}%, #2a2a3a 100%)`;
  const dropdownItemStyle = (active) => ({
    padding: "10px 14px",
    fontSize: 13,
    cursor: "pointer",
    background: active ? "rgba(245,166,35,0.12)" : "transparent",
    color: active ? "#f5a623" : "#d4d4e8",
    fontWeight: active ? 600 : 400,
    transition: "background 0.15s"
  });
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    /* @__PURE__ */ React.createElement(
      "div",
      {
        style: { position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
        onClick: (e) => {
          if (e.target === e.currentTarget) onClose();
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }, onClick: onClose }),
      /* @__PURE__ */ React.createElement("div", { style: {
        position: "relative",
        zIndex: 1,
        background: "#13131f",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        padding: "24px 22px 20px",
        width: 340,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        fontFamily: "inherit",
        color: "#e4e4f0"
      } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "#f5a623" }, /* @__PURE__ */ React.createElement("path", { d: "M2 19l2-9 5 4 3-7 3 7 5-4 2 9H2zm0 0h20v2H2v-2z" })), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 15 } }, "Skin Enhancer")), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 2 } }, "\u2715")), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase" } }, "Version"), /* @__PURE__ */ React.createElement(
        "span",
        {
          title: "Faithful preserves natural look. Creative adds editorial polish. Flexible is balanced.",
          style: { width: 15, height: 15, borderRadius: "50%", border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#888", cursor: "default" }
        },
        "?"
      )), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setVersionOpen((v) => !v);
            setOptimizeOpen(false);
          },
          style: {
            width: "100%",
            padding: "9px 12px",
            background: "#1e1e30",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "#e4e4f0",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React.createElement("span", null, version),
        /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
      ), versionOpen && /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        right: 0,
        background: "#1e1e30",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        zIndex: 10,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
      } }, VERSIONS.map((v) => /* @__PURE__ */ React.createElement("div", { key: v, onClick: () => {
        setVersion(v);
        setVersionOpen(false);
      }, style: dropdownItemStyle(version === v) }, v))))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase" } }, "Optimized for")), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setOptimizeOpen((v) => !v);
            setVersionOpen(false);
          },
          style: {
            width: "100%",
            padding: "9px 12px",
            background: "#1e1e30",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "#e4e4f0",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer"
          }
        },
        /* @__PURE__ */ React.createElement("span", null, optimizeFor),
        /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }))
      ), optimizeOpen && /* @__PURE__ */ React.createElement("div", { style: {
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        right: 0,
        background: "#1e1e30",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 8,
        zIndex: 10,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
      } }, OPTIMIZES.map((o) => /* @__PURE__ */ React.createElement("div", { key: o, onClick: () => {
        setOptimizeFor(o);
        setOptimizeOpen(false);
      }, style: dropdownItemStyle(optimizeFor === o) }, o))))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase" } }, "Sharpen"), /* @__PURE__ */ React.createElement(
        "span",
        {
          title: "Sharpens fine facial details. Keep low for natural results.",
          style: { width: 15, height: 15, borderRadius: "50%", border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#888", cursor: "default" }
        },
        "?"
      )), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "#aaa" } }, sharpen, "%")), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "range",
          min: 0,
          max: 100,
          value: sharpen,
          onChange: (e) => setSharpen(Number(e.target.value)),
          className: "skin-enhancer-slider",
          style: { width: "100%", height: 4, borderRadius: 2, outline: "none", cursor: "pointer", appearance: "none", background: sliderBg(sharpen) }
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 22 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#888", textTransform: "uppercase" } }, "Smart Grain"), /* @__PURE__ */ React.createElement(
        "span",
        {
          title: "Adds natural film grain. 10-25% looks most photographic.",
          style: { width: 15, height: 15, borderRadius: "50%", border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#888", cursor: "default" }
        },
        "?"
      )), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, fontWeight: 600, color: "#aaa" } }, smartGrain, "%")), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "range",
          min: 0,
          max: 100,
          value: smartGrain,
          onChange: (e) => setSmartGrain(Number(e.target.value)),
          className: "skin-enhancer-slider",
          style: { width: "100%", height: 4, borderRadius: 2, outline: "none", cursor: "pointer", appearance: "none", background: sliderBg(smartGrain) }
        }
      )), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: handleApply,
          style: {
            width: "100%",
            padding: "13px 0",
            background: "linear-gradient(135deg, #f5a623 0%, #f7c35a 100%)",
            border: "none",
            borderRadius: 10,
            color: "#1a1006",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 4px 20px rgba(245,166,35,0.35)"
          }
        },
        /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "#1a1006" }, /* @__PURE__ */ React.createElement("path", { d: "M2 19l2-9 5 4 3-7 3 7 5-4 2 9H2zm0 0h20v2H2v-2z" })),
        "Enhance Skin",
        /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "#1a1006", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("path", { d: "M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" }))
      ), /* @__PURE__ */ React.createElement("style", null, `
          .skin-enhancer-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #f5a623; border: 2px solid #fff; box-shadow: 0 1px 6px rgba(0,0,0,0.4); cursor: pointer; }
          .skin-enhancer-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #f5a623; border: 2px solid #fff; box-shadow: 0 1px 6px rgba(0,0,0,0.4); cursor: pointer; border: none; }
        `))
    ),
    document.body
  );
}
export {
  SkinEnhancerPopover,
  translateSkinEnhancerPrompt
};
