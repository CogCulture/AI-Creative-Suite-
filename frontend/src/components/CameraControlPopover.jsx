"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Camera, RotateCcw, Sparkles } from "lucide-react";
const translateCameraAngles = (rotate, vertical, zoom, calibration) => {
  const yawOffset = calibration?.initial_yaw_offset || 0;
  const effectiveRotate = ((rotate + yawOffset) % 360 + 360) % 360;
  const normRot = effectiveRotate > 180 ? effectiveRotate - 360 : effectiveRotate;
  let verticalAnchor = "camera positioned at eye level (0\xB0 pitch tilt)";
  let verticalPart = "eye-level shot";
  let verticalVisualEffect = "eye-level perspective with natural horizon height";
  if (vertical > 60) {
    verticalAnchor = `camera raised overhead to a steep ${vertical}\xB0 high angle, positioned well above head height`;
    verticalPart = "bird's-eye view shot";
    verticalVisualEffect = "steep downward perspective \u2014 ground surface dominates frame, subject seen from directly above";
  } else if (vertical > 25) {
    verticalAnchor = `camera raised above head height with a ${vertical}\xB0 downward pitch tilt`;
    verticalPart = "high-angle shot";
    verticalVisualEffect = "downward perspective tilt \u2014 camera looks down from above head level, background appears lower in frame";
  } else if (vertical < -60) {
    verticalAnchor = `camera lowered to near ground level with a ${vertical}\xB0 steep upward tilt`;
    verticalPart = "worm's-eye view shot";
    verticalVisualEffect = "extreme upward perspective tilt \u2014 camera sits near ground level looking steeply up, subject looms tall, background elements rise high in frame";
  } else if (vertical < -25) {
    verticalAnchor = `camera physically lowered to waist/hip height with a ${vertical}\xB0 upward pitch tilt`;
    verticalPart = "low-angle shot";
    verticalVisualEffect = "strong upward perspective tilt \u2014 camera sits below chest height looking up toward the face, jawline and chin are prominent from below, mountains/background rise higher in frame";
  } else if (vertical < -10) {
    verticalAnchor = `camera lowered slightly below chest height with a ${vertical}\xB0 upward tilt`;
    verticalPart = "slight low-angle shot";
    verticalVisualEffect = "subtle upward perspective \u2014 camera sits at chest height angled slightly up";
  } else if (vertical > 10) {
    verticalAnchor = `camera raised slightly above eye level with a +${vertical}\xB0 downward tilt`;
    verticalPart = "slight high-angle shot";
    verticalVisualEffect = "subtle downward perspective \u2014 camera sits slightly above eye level angled down";
  }
  let zoomPart = "medium shot";
  if (zoom >= 9) zoomPart = "extreme close-up";
  else if (zoom >= 7) zoomPart = "close-up";
  else if (zoom <= 2) zoomPart = "wide establishing shot";
  else if (zoom <= 4) zoomPart = "medium-wide shot";
  let spatial = "";
  const featureHint = calibration?.primary_feature ? `focusing directly on the ${calibration.primary_feature}` : "";
  const absNorm = Math.abs(normRot);
  if (vertical > 60) {
    if (absNorm > 165) spatial = "directly above and behind the subject, looking down from overhead onto the back";
    else if (normRot > 60) spatial = "steeply above and to the right of the subject, looking down \u2014 right side and partial back visible";
    else if (normRot > 15) spatial = "above and slightly to the front-right, looking down \u2014 front and right side visible from above";
    else if (normRot < -60) spatial = "steeply above and to the left of the subject, looking down \u2014 left side and partial back visible";
    else if (normRot < -15) spatial = "above and slightly to the front-left, looking down \u2014 front and left side visible from above";
    else spatial = `directly overhead looking straight down at the subject ${featureHint}, front facing up`.trim();
  } else if (vertical > 25) {
    if (absNorm > 165) spatial = "at a high angle behind the subject \u2014 back of subject facing camera";
    else if (normRot > 120) spatial = "at a high angle behind-right (rear three-quarter) \u2014 right side and back partially visible";
    else if (normRot > 60) spatial = "at a high angle to the right (side view) \u2014 right side profile visible from above";
    else if (normRot > 15) spatial = "at a high angle front-right (front three-quarter) \u2014 front and right side visible from above";
    else if (normRot < -120) spatial = "at a high angle behind-left (rear three-quarter) \u2014 left side and back partially visible";
    else if (normRot < -60) spatial = "at a high angle to the left (side view) \u2014 left side profile visible from above";
    else if (normRot < -15) spatial = "at a high angle front-left (front three-quarter) \u2014 front and left side visible from above";
    else spatial = `at a high angle directly facing the front of the subject ${featureHint}, looking down`.trim();
  } else if (vertical < -60) {
    if (absNorm > 165) spatial = "near ground level behind the subject, looking steeply up at the back";
    else if (normRot > 60) spatial = "near ground level to the right, looking steeply up \u2014 right side profile from below";
    else if (normRot > 15) spatial = "near ground level front-right, looking steeply up \u2014 front and right side from below";
    else if (normRot < -60) spatial = "near ground level to the left, looking steeply up \u2014 left side profile from below";
    else if (normRot < -15) spatial = "near ground level front-left, looking steeply up \u2014 front and left side from below";
    else spatial = `near ground level looking straight up at the front of the subject ${featureHint}`.trim();
  } else if (vertical < -25) {
    if (absNorm > 165) spatial = "at a low angle behind the subject, looking up at the back";
    else if (normRot > 120) spatial = "at a low angle behind-right (rear three-quarter), looking up \u2014 right side and back visible";
    else if (normRot > 60) spatial = "at a low angle to the right (side view), looking up \u2014 right side profile visible";
    else if (normRot > 15) spatial = "at a low angle front-right (front three-quarter), looking up \u2014 front and right side visible";
    else if (normRot < -120) spatial = "at a low angle behind-left (rear three-quarter), looking up \u2014 left side and back visible";
    else if (normRot < -60) spatial = "at a low angle to the left (side view), looking up \u2014 left side profile visible";
    else if (normRot < -15) spatial = "at a low angle front-left (front three-quarter), looking up \u2014 front and left side visible";
    else spatial = `at a low angle directly in front of the subject ${featureHint}, looking up at the front`.trim();
  } else {
    if (absNorm > 165) spatial = "directly behind the subject \u2014 back fully facing camera, front not visible";
    else if (normRot > 120) spatial = "behind and to the right (rear three-quarter view) \u2014 mostly the back and right side of the subject visible, front partially hidden";
    else if (normRot > 60) spatial = "to the right of the subject (side profile view) \u2014 right side fully visible, showing right profile";
    else if (normRot > 15) spatial = "front-right three-quarter view \u2014 front and right side of the subject both visible, subject angled toward camera";
    else if (normRot < -120) spatial = "behind and to the left (rear three-quarter view) \u2014 mostly the back and left side of the subject visible, front partially hidden";
    else if (normRot < -60) spatial = "to the left of the subject (side profile view) \u2014 left side fully visible, showing left profile";
    else if (normRot < -15) spatial = "front-left three-quarter view \u2014 front and left side of the subject both visible, subject angled toward camera";
    else spatial = `at eye-level straight in front of the subject ${featureHint}, head-on front view \u2014 face and front fully visible`.trim();
  }
  const rotDir = normRot === 0 ? "0\xB0 head-on" : normRot > 0 ? `${normRot}\xB0 to the right` : `${Math.abs(normRot)}\xB0 to the left`;
  const legacyInstruction = `Re-render scene with virtual camera rotated ${rotDir} horizontally and ${verticalAnchor}. The camera is physically positioned ${spatial}, captured in a ${verticalPart}, ${zoomPart}. Lens perspective effect: ${verticalVisualEffect}. Strictly preserve subject identity, key features, styling, materials, and product details.`;
  const instruction = `Create a new angle of the subject in this image: rotate the virtual camera ${normRot}\xB0 around the subject horizontally and ${vertical}\xB0 vertically, keeping the same framing, identity, clothing, and styling as the original.`;
  return { instruction, spatial: `the camera is now ${spatial}`, verticalPart, zoomPart, legacyInstruction };
};
const getBadge = (r, v, calibration) => {
  const yawOffset = calibration?.initial_yaw_offset || 0;
  const effectiveRotate = ((r + yawOffset) % 360 + 360) % 360;
  const normRot = effectiveRotate > 180 ? effectiveRotate - 360 : effectiveRotate;
  const absNorm = Math.abs(normRot);
  let hLabel = "FRONT";
  if (absNorm > 165) hLabel = "REAR";
  else if (normRot > 120) hLabel = "REAR RIGHT";
  else if (normRot > 60) hLabel = "RIGHT";
  else if (normRot > 15) hLabel = "FRONT RIGHT";
  else if (normRot < -120) hLabel = "REAR LEFT";
  else if (normRot < -60) hLabel = "LEFT";
  else if (normRot < -15) hLabel = "FRONT LEFT";
  if (v > 60) return "BIRD'S EYE";
  if (v < -60) return "WORM'S EYE";
  if (v > 25) return hLabel === "FRONT" ? "HIGH FRONT" : `HIGH ${hLabel}`;
  if (v < -25) return hLabel === "FRONT" ? "LOW FRONT" : `LOW ${hLabel}`;
  return hLabel;
};
function CameraScene({ rotate, vertical, zoom, imageUrl, onRotateChange, onVerticalChange }) {
  const W = 436, H = 220;
  const VPX = 218, VPY = 82;
  const CX = 218, GY = 175;
  const RX = 145, RY = 36;
  const rotRad = rotate * Math.PI / 180;
  const camX = CX + RX * Math.sin(rotRad);
  const camY = GY + RY * Math.cos(rotRad);
  const inFront = camY >= GY;
  const fixedX = CX - RX * 0.707;
  const fixedY = GY + RY * 0.707;
  const elevScale = 115;
  const vertRad = vertical * Math.PI / 180;
  const sinV = Math.sin(vertRad);
  const cosV = Math.cos(vertRad);
  const purX = CX + cosV * (fixedX - CX);
  const purY = GY + cosV * (fixedY - GY) - sinV * elevScale;
  const arcEndX = CX, arcEndY = GY - elevScale;
  const cp1X = fixedX, cp1Y = fixedY - elevScale * 0.55;
  const cp2X = CX, cp2Y = arcEndY;
  const arcD = `M ${fixedX} ${fixedY} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${arcEndX} ${arcEndY}`;
  const PW = 64 + (zoom - 1) / 9 * 44;
  const PH = PW * 0.72;
  const tPX = CX - PW / 2, tPY = GY - PH;
  const backArc = `M ${CX + RX},${GY} A ${RX},${RY} 0 0 0 ${CX - RX},${GY}`;
  const frontArc = `M ${CX - RX},${GY} A ${RX},${RY} 0 0 0 ${CX + RX},${GY}`;
  const N = 9;
  const dLines = Array.from({ length: N + 1 }, (_, i) => ({
    x1: W / N * i,
    y1: H + 4,
    x2: VPX,
    y2: VPY
  }));
  const hYs = [H + 4, 220, 202, 185, 169, 154, 140, 127, 115, 104, 94];
  const hLines = hYs.map((gy) => {
    const f = (H + 4 - gy) / (H + 4 - VPY);
    return { x1: CX - CX * f, y1: gy, x2: CX + (W - CX) * f, y2: gy };
  });
  const targetX = CX;
  const targetY = GY - PH * 0.5;
  const svgRef = useRef(null);
  const getSVGPoint = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width * W,
      y: (clientY - rect.top) / rect.height * H
    };
  };
  const handleBlueDrag = useCallback((clientX, clientY) => {
    if (!onRotateChange) return;
    const pt = getSVGPoint(clientX, clientY);
    const dx = (pt.x - CX) / RX;
    const dy = (pt.y - GY) / RY;
    let angleDeg = Math.atan2(dx, dy) * (180 / Math.PI);
    angleDeg = (angleDeg % 360 + 360) % 360;
    onRotateChange(Math.round(angleDeg));
  }, [onRotateChange]);
  const handlePurpleDrag = useCallback((clientX, clientY) => {
    if (!onVerticalChange) return;
    const pt = getSVGPoint(clientX, clientY);
    const fraction = (GY - pt.y) / elevScale;
    let angleDeg = Math.asin(Math.max(-0.5, Math.min(1, fraction))) * (180 / Math.PI);
    angleDeg = Math.max(-30, Math.min(90, Math.round(angleDeg)));
    onVerticalChange(angleDeg);
  }, [onVerticalChange]);
  const startDrag = (handler) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    handler(e.clientX, e.clientY);
    const onMove = (ev) => handler(ev.clientX, ev.clientY);
    const onUp = (ev) => {
      e.target.releasePointerCapture(ev.pointerId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  const normRot = (rotate % 360 + 360) % 360;
  const isBackView = normRot >= 115 && normRot <= 245;
  return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", width: "100%", height: "100%", userSelect: "none" } }, /* @__PURE__ */ React.createElement(
    "svg",
    {
      ref: svgRef,
      width: W,
      height: H,
      viewBox: `0 0 ${W} ${H}`,
      style: { width: "100%", height: "100%", display: "block" }
    },
    /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id: "sc-bg", x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#0a0818" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#04030a" })), /* @__PURE__ */ React.createElement("filter", { id: "sc-gbl", x: "-120%", y: "-120%", width: "340%", height: "340%" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "4", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" }))), /* @__PURE__ */ React.createElement("filter", { id: "sc-gpl", x: "-120%", y: "-120%", width: "340%", height: "340%" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "4", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" }))), /* @__PURE__ */ React.createElement("filter", { id: "sc-sph", x: "-150%", y: "-150%", width: "400%", height: "400%" }, /* @__PURE__ */ React.createElement("feGaussianBlur", { stdDeviation: "6", result: "b" }), /* @__PURE__ */ React.createElement("feMerge", null, /* @__PURE__ */ React.createElement("feMergeNode", { in: "b" }), /* @__PURE__ */ React.createElement("feMergeNode", { in: "SourceGraphic" }))), /* @__PURE__ */ React.createElement("radialGradient", { id: "sc-bgr", cx: "35%", cy: "25%", r: "68%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#c0dcff" }), /* @__PURE__ */ React.createElement("stop", { offset: "45%", stopColor: "#3b82f6" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#1d4ed8" })), /* @__PURE__ */ React.createElement("radialGradient", { id: "sc-pgr", cx: "35%", cy: "25%", r: "68%" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: "#f3e8ff" }), /* @__PURE__ */ React.createElement("stop", { offset: "45%", stopColor: "#a855f7" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: "#7e22ce" })), /* @__PURE__ */ React.createElement("clipPath", { id: "sc-pc" }, /* @__PURE__ */ React.createElement("rect", { x: tPX, y: tPY, width: PW, height: PH, rx: "6" }))),
    /* @__PURE__ */ React.createElement("rect", { width: W, height: H, fill: "url(#sc-bg)" }),
    dLines.map((l, i) => /* @__PURE__ */ React.createElement("line", { key: `d${i}`, x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, stroke: "#1b173c", strokeWidth: "0.8" })),
    hLines.map((l, i) => /* @__PURE__ */ React.createElement("line", { key: `h${i}`, x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, stroke: "#14112e", strokeWidth: "0.6" })),
    /* @__PURE__ */ React.createElement("path", { d: backArc, fill: "none", stroke: "#1e3a8a", strokeWidth: "10", opacity: "0.2" }),
    /* @__PURE__ */ React.createElement("path", { d: backArc, fill: "none", stroke: "#2563eb", strokeWidth: "3", opacity: "0.5" }),
    !inFront && /* @__PURE__ */ React.createElement("g", { style: { cursor: "grab" }, onPointerDown: startDrag(handleBlueDrag) }, /* @__PURE__ */ React.createElement("circle", { cx: camX, cy: camY, r: "22", fill: "#3b82f6", opacity: "0.16" }), /* @__PURE__ */ React.createElement("circle", { cx: camX, cy: camY, r: "13", fill: "url(#sc-bgr)", filter: "url(#sc-sph)" }), /* @__PURE__ */ React.createElement("ellipse", { cx: camX - 3.5, cy: camY - 4.5, rx: "5", ry: "2.8", fill: "rgba(255,255,255,0.7)" })),
    /* @__PURE__ */ React.createElement("ellipse", { cx: CX, cy: GY + 2, rx: PW * 0.48, ry: 4, fill: "rgba(0,0,0,0.45)" }),
    /* @__PURE__ */ React.createElement(
      "rect",
      {
        x: tPX,
        y: tPY,
        width: PW,
        height: PH,
        rx: "6",
        fill: "#0c0a1a",
        stroke: "#2d2654",
        strokeWidth: "1.5"
      }
    ),
    imageUrl ? /* @__PURE__ */ React.createElement(
      "image",
      {
        href: imageUrl,
        x: tPX,
        y: tPY,
        width: PW,
        height: PH,
        preserveAspectRatio: "xMidYMid meet",
        clipPath: "url(#sc-pc)",
        style: { opacity: 0.96 }
      }
    ) : /* @__PURE__ */ React.createElement("rect", { x: tPX + 1, y: tPY + 1, width: PW - 2, height: PH - 2, rx: "5", fill: "#181432" }),
    /* @__PURE__ */ React.createElement(
      "rect",
      {
        x: tPX,
        y: tPY,
        width: PW,
        height: PH,
        rx: "6",
        fill: "none",
        stroke: "rgba(192,160,255,0.22)",
        strokeWidth: "1.2"
      }
    ),
    /* @__PURE__ */ React.createElement("path", { d: frontArc, fill: "none", stroke: "#1d4ed8", strokeWidth: "14", opacity: "0.2" }),
    /* @__PURE__ */ React.createElement("path", { d: frontArc, fill: "none", stroke: "#3b82f6", strokeWidth: "4", filter: "url(#sc-gbl)" }),
    /* @__PURE__ */ React.createElement("path", { d: arcD, fill: "none", stroke: "#7e22ce", strokeWidth: "9", opacity: "0.22" }),
    /* @__PURE__ */ React.createElement("path", { d: arcD, fill: "none", stroke: "#c084fc", strokeWidth: "3", filter: "url(#sc-gpl)" }),
    /* @__PURE__ */ React.createElement("circle", { cx: fixedX, cy: fixedY, r: "4", fill: "#d8b4fe", opacity: "0.85" }),
    /* @__PURE__ */ React.createElement("circle", { cx: arcEndX, cy: arcEndY, r: "3", fill: "#a855f7", opacity: "0.75" }),
    /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: camX,
        y1: camY,
        x2: targetX,
        y2: targetY,
        stroke: "#60a5fa",
        strokeWidth: "1.2",
        strokeDasharray: "3 3",
        opacity: "0.85"
      }
    ),
    /* @__PURE__ */ React.createElement(
      "line",
      {
        x1: purX,
        y1: purY,
        x2: targetX,
        y2: targetY,
        stroke: "#c084fc",
        strokeWidth: "1.2",
        strokeDasharray: "3 3",
        opacity: "0.85"
      }
    ),
    /* @__PURE__ */ React.createElement("circle", { cx: targetX, cy: targetY, r: "2.5", fill: "#e9d5ff", opacity: "0.9" }),
    inFront && /* @__PURE__ */ React.createElement("g", { style: { cursor: "grab" }, onPointerDown: startDrag(handleBlueDrag) }, /* @__PURE__ */ React.createElement("circle", { cx: camX, cy: camY, r: "22", fill: "#3b82f6", opacity: "0.16" }), /* @__PURE__ */ React.createElement("circle", { cx: camX, cy: camY, r: "13", fill: "url(#sc-bgr)", filter: "url(#sc-sph)" }), /* @__PURE__ */ React.createElement("ellipse", { cx: camX - 3.5, cy: camY - 4.5, rx: "5", ry: "2.8", fill: "rgba(255,255,255,0.7)" })),
    /* @__PURE__ */ React.createElement("g", { style: { cursor: "ns-resize" }, onPointerDown: startDrag(handlePurpleDrag) }, /* @__PURE__ */ React.createElement("circle", { cx: purX, cy: purY, r: "18", fill: "#a855f7", opacity: "0.2" }), /* @__PURE__ */ React.createElement("circle", { cx: purX, cy: purY, r: "11", fill: "url(#sc-pgr)", filter: "url(#sc-sph)" }), /* @__PURE__ */ React.createElement("ellipse", { cx: purX - 3, cy: purY - 4, rx: "4", ry: "2.4", fill: "rgba(255,255,255,0.7)" })),
    /* @__PURE__ */ React.createElement("text", { x: "14", y: "20", fill: "#4c427c", fontSize: "9.5", fontFamily: "monospace", letterSpacing: "0.8", fontWeight: "bold" }, "CAMERA PREVIEW"),
    /* @__PURE__ */ React.createElement("text", { x: "14", y: H - 10, fill: "#5d5292", fontSize: "9.5", fontFamily: "monospace" }, zoom >= 9 ? "Extreme CU" : zoom >= 7 ? "Close-Up" : zoom <= 2 ? "Wide Shot" : zoom <= 4 ? "Med-Wide" : "Medium", " \xB7 ", zoom, "\xD7")
  ), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    top: 12,
    right: 14,
    width: 92,
    height: 70,
    perspective: 260,
    zIndex: 10
  } }, /* @__PURE__ */ React.createElement("div", { style: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    border: "1.5px solid #a855f7",
    boxShadow: "0 8px 24px -4px rgba(168,85,247,0.5)",
    transform: `rotateX(${-vertical * 0.85}deg) rotateY(${-rotate}deg)`,
    transformOrigin: "center center",
    transformStyle: "preserve-3d",
    background: isBackView ? "#100c24" : "#14102c",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  } }, !isBackView ? imageUrl ? /* @__PURE__ */ React.createElement("img", { src: imageUrl, alt: "3D Angle Preview", style: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    opacity: 0.95
  } }) : /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#c084fc",
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "monospace"
  } }, /* @__PURE__ */ React.createElement(Camera, { size: 20, style: { marginBottom: 2 } }), /* @__PURE__ */ React.createElement("span", null, "PREVIEW")) : /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%"
  } }, /* @__PURE__ */ React.createElement("span", { style: {
    fontSize: 32,
    fontWeight: 900,
    fontFamily: "Inter, system-ui, sans-serif",
    background: "linear-gradient(135deg, #f3e8ff 0%, #c084fc 50%, #9333ea 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.05em",
    filter: "drop-shadow(0 2px 10px rgba(168,85,247,0.5))"
  } }, "CC")), /* @__PURE__ */ React.createElement("div", { style: {
    position: "absolute",
    inset: 0,
    border: "1px solid rgba(192,132,252,0.3)",
    pointerEvents: "none"
  } }))));
}
function CameraControlPopover({
  onApply,
  onClose,
  imageUrl,
  initialRotate = 0,
  initialVertical = 0,
  initialZoom = 5
}) {
  const [mounted, setMounted] = useState(false);
  const [rotate, setRotate] = useState(initialRotate);
  const [vertical, setVertical] = useState(initialVertical);
  const [zoom, setZoom] = useState(initialZoom);
  const [calibration, setCalibration] = useState(void 0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!imageUrl) return;
    let isCancelled = false;
    const calibrateImage = async () => {
      setIsCalibrating(true);
      try {
        const res = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            prompt_context: "Detect subject initial 3D yaw angle offset (-180 to 180) and primary front-facing feature dynamically for any image subject."
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data) {
            setCalibration({
              initial_yaw_offset: data.initial_yaw_offset || 0,
              primary_feature: data.primary_feature || void 0
            });
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setCalibration({
            initial_yaw_offset: 0,
            primary_feature: void 0
          });
        }
      } finally {
        if (!isCancelled) setIsCalibrating(false);
      }
    };
    calibrateImage();
    return () => {
      isCancelled = true;
    };
  }, [imageUrl]);
  const bdg = getBadge(rotate, vertical, calibration);
  const { instruction, spatial, verticalPart, zoomPart } = translateCameraAngles(rotate, vertical, zoom, calibration);
  const pctR = (rotate / 360 * 100).toFixed(1);
  const pctV = ((vertical + 30) / 120 * 100).toFixed(1);
  const pctZ = ((zoom - 1) / 9 * 100).toFixed(1);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(
    /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { onClick: onClose, style: {
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      background: "rgba(0,0,0,0.65)",
      backdropFilter: "blur(8px)"
    } }), /* @__PURE__ */ React.createElement("style", null, `
        #ccpop,#ccpop *{box-sizing:border-box;margin:0;padding:0}
        #ccpop{
          position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
          z-index:9999;width:480px;max-width:calc(100vw - 32px);
          max-height:calc(100vh - 32px);overflow-y:auto;overscroll-behavior:contain;
          background:linear-gradient(158deg,#18152e 0%,#100d20 65%,#090714 100%);
          border-radius:24px;border:1px solid #2d2654;
          box-shadow:0 40px 100px -16px rgba(0,0,0,0.95),inset 0 1px 0 rgba(255,255,255,0.08);
          color:#f0eeff;font-family:Inter,system-ui,sans-serif;padding:22px;
        }
        #ccpop::-webkit-scrollbar{width:4px}
        #ccpop::-webkit-scrollbar-thumb{background:#3a3460;border-radius:2px}

        /* Header */
        #ccpop .hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        #ccpop .brand{display:flex;align-items:center;gap:11px}
        #ccpop .ic{
          width:38px;height:38px;border-radius:12px;flex-shrink:0;overflow:hidden;
          border:1.5px solid rgba(168,85,247,.5);
          box-shadow:0 4px 16px -4px rgba(168,85,247,.6);
          background:#1a1538;display:flex;align-items:center;justify-content:center;
        }
        #ccpop .ic img{width:100%;height:100%;object-fit:cover;display:block}
        #ccpop .ttl{font-weight:700;font-size:16px;color:#f0eeff;letter-spacing:-.01em}
        #ccpop .right{display:flex;align-items:center;gap:8px}
        #ccpop .bdg{
          font-size:10px;font-weight:700;font-family:monospace;padding:5px 11px;
          border-radius:12px;letter-spacing:.6px;white-space:nowrap;
          background:rgba(168,85,247,.18);border:1px solid rgba(168,85,247,.45);
          color:#e9d5ff;transition:all .2s;
        }
        #ccpop .xb{
          width:30px;height:30px;border-radius:9px;border:none;flex-shrink:0;
          background:rgba(255,255,255,.07);color:#94a3b8;
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          transition:background .15s,color .15s;
        }
        #ccpop .xb:hover{background:rgba(255,255,255,.14);color:#f0eeff}

        /* Stage */
        #ccpop .cc-stage{
          width:100%;height:220px;min-height:220px;max-height:220px;
          border-radius:16px;overflow:hidden;padding:0 !important;
          border:1px solid #221c48;margin-bottom:16px;background:#06050e;
          flex-shrink:0;position:relative;
        }

        /* Sliders */
        #ccpop .sliders{display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
        #ccpop .sr-card{
          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
          border-radius:14px;padding:10px 14px;display:flex;flex-direction:column;gap:6px;
        }
        #ccpop .sr{display:flex;justify-content:space-between;align-items:center}
        #ccpop .sl{font-size:12.5px;font-weight:600;color:#c4b5fd}
        #ccpop .sv{font-family:monospace;font-size:12px;color:#e9d5ff;font-weight:600}
        #ccpop input[type=range]{
          -webkit-appearance:none;width:100%;height:6px;border-radius:3px;
          background:linear-gradient(to right,#3b82f6 0%,#3b82f6 var(--pct),#221d38 var(--pct));
          outline:none;cursor:pointer;display:block;
        }
        #ccpop input[type=range]::-webkit-slider-thumb{
          -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
          background:linear-gradient(135deg,#e9d5ff,#a855f7);
          box-shadow:0 0 0 3px rgba(168,85,247,.32),0 2px 6px rgba(0,0,0,.65);
          cursor:pointer;transition:box-shadow .15s;
        }
        #ccpop input[type=range]::-webkit-slider-thumb:hover,
        #ccpop input[type=range]::-webkit-slider-thumb:active{
          box-shadow:0 0 0 6px rgba(168,85,247,.45),0 2px 6px rgba(0,0,0,.65);
        }
        #ccpop input[type=range]::-moz-range-thumb{
          width:18px;height:18px;border-radius:50%;border:none;
          background:linear-gradient(135deg,#e9d5ff,#a855f7);
        }

        /* Prompt */
        #ccpop .pr{
          background:#0a081a;border:1px solid #251e4c;border-left:3px solid #8b5cf6;
          border-radius:12px;padding:10px 14px;margin-bottom:16px;
          font-family:monospace;font-size:11px;line-height:1.6;
          color:#8b82be;max-height:64px;overflow-y:auto;word-break:break-word;
        }
        #ccpop .pr .hl{color:#d8b4fe;font-weight:600}
        #ccpop .pr .hg{color:#fbbf24;font-weight:600}

        /* Buttons */
        #ccpop .btns{display:flex;gap:10px}
        #ccpop .btn{
          border:none;border-radius:12px;padding:12px 0;font-size:13.5px;font-weight:700;
          cursor:pointer;font-family:inherit;transition:transform .12s,filter .12s;
          display:flex;align-items:center;justify-content:center;gap:6px;
        }
        #ccpop .btn:active{transform:scale(.97)}
        #ccpop .rst{flex:1;background:#1a1734;color:#a78bfa;border:1px solid #2d2654}
        #ccpop .rst:hover{color:#f0eeff;border-color:#3e3570}
        #ccpop .apl{
          flex:2;color:#180e00;
          background:linear-gradient(135deg,#fbbf24,#f59e0b 50%,#d97706);
          box-shadow:0 4px 22px -6px rgba(245,158,11,.65);
        }
        #ccpop .apl:hover{filter:brightness(1.08)}
      `), /* @__PURE__ */ React.createElement("div", { id: "ccpop" }, /* @__PURE__ */ React.createElement("div", { className: "hd" }, /* @__PURE__ */ React.createElement("div", { className: "brand" }, /* @__PURE__ */ React.createElement("div", { className: "ic" }, /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 15,
      fontWeight: 900,
      fontFamily: "Inter, system-ui, sans-serif",
      background: "linear-gradient(135deg, #e9d5ff, #a855f7)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "-0.04em"
    } }, "CC")), /* @__PURE__ */ React.createElement("div", { className: "ttl" }, "Camera Control")), /* @__PURE__ */ React.createElement("div", { className: "right" }, /* @__PURE__ */ React.createElement("div", { className: "bdg" }, bdg), /* @__PURE__ */ React.createElement("button", { className: "xb", onClick: onClose }, /* @__PURE__ */ React.createElement(X, { size: 14 })))), /* @__PURE__ */ React.createElement("div", { className: "cc-stage" }, /* @__PURE__ */ React.createElement(
      CameraScene,
      {
        rotate,
        vertical,
        zoom,
        imageUrl,
        onRotateChange: setRotate,
        onVerticalChange: setVertical
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "sliders" }, /* @__PURE__ */ React.createElement("div", { className: "sr-card" }, /* @__PURE__ */ React.createElement("div", { className: "sr" }, /* @__PURE__ */ React.createElement("span", { className: "sl" }, "Rotate"), /* @__PURE__ */ React.createElement("span", { className: "sv" }, rotate, "\xB0")), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: "0",
        max: "360",
        value: rotate,
        style: { "--pct": `${pctR}%` },
        onChange: (e) => setRotate(+e.target.value)
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "sr-card" }, /* @__PURE__ */ React.createElement("div", { className: "sr" }, /* @__PURE__ */ React.createElement("span", { className: "sl" }, "Vertical"), /* @__PURE__ */ React.createElement("span", { className: "sv" }, vertical, "\xB0")), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: "-30",
        max: "90",
        value: vertical,
        style: { "--pct": `${pctV}%` },
        onChange: (e) => setVertical(+e.target.value)
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "sr-card" }, /* @__PURE__ */ React.createElement("div", { className: "sr" }, /* @__PURE__ */ React.createElement("span", { className: "sl" }, "Zoom"), /* @__PURE__ */ React.createElement("span", { className: "sv" }, zoom >= 9 ? "Extreme CU" : zoom >= 7 ? "Close-Up" : zoom <= 2 ? "Wide Shot" : zoom <= 4 ? "Med-Wide" : "Medium", " \xB7 ", zoom, "\xD7")), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "range",
        min: "1",
        max: "10",
        step: "0.5",
        value: zoom,
        style: { "--pct": `${pctZ}%` },
        onChange: (e) => setZoom(+e.target.value)
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "pr" }, /* @__PURE__ */ React.createElement("span", { className: "hg" }, "Camera:"), " ", /* @__PURE__ */ React.createElement("span", { className: "hl" }, spatial), ", in a", " ", /* @__PURE__ */ React.createElement("span", { className: "hl" }, verticalPart), ",", " ", /* @__PURE__ */ React.createElement("span", { className: "hl" }, zoomPart), ".", " ", "Strictly preserve subject identity, facial features, pose, clothing, and product details."), /* @__PURE__ */ React.createElement("div", { className: "btns" }, /* @__PURE__ */ React.createElement("button", { className: "btn rst", onClick: () => {
      setRotate(0);
      setVertical(0);
      setZoom(5);
    } }, /* @__PURE__ */ React.createElement(RotateCcw, { size: 14 }), " Reset"), /* @__PURE__ */ React.createElement("button", { className: "btn apl", onClick: () => {
      onApply(instruction, { rotate, vertical, zoom });
      onClose();
    } }, /* @__PURE__ */ React.createElement(Sparkles, { size: 15 }), " Apply Camera Angle")))),
    document.body
  );
}
export {
  CameraControlPopover,
  getBadge,
  translateCameraAngles
};
