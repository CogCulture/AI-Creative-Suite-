/* ============================================================
   STUDIO OS — Static data / constants
   Mirrors the reference JSX data definitions exactly.
   ============================================================ */
import {
  Home, Boxes, LayoutGrid, Library, Brain,
  Target, PenLine, Image as ImageIcon, Wand2, Presentation, Users, UserCog,
} from "lucide-react";

/* ── Seven tools ─────────────────────────────────────────── */
const ALL_TOOLS = [
  {
    id: "strategy",
    name: "Strategy",
    icon: Target,
    hue: "#2FA36B",
    tags: ["POSITIONING", "BRIEF"],
    desc: "Positioning, audience and campaign angles — the brief that seeds everything downstream.",
  },
  {
    id: "copy",
    name: "Copy Agent",
    icon: PenLine,
    hue: "#2E6BE6",
    tags: ["SOCIAL", "EMAIL", "ADS"],
    desc: "Captions, emails, ads and scripts from a library of high-performing templates.",
  },
  {
    id: "genfy",
    name: "Genfy · Image",
    icon: ImageIcon,
    hue: "#E8552A",
    tags: ["T2I", "CONTROLS"],
    desc: "On-brand visuals with style, lighting and camera controls. Text-to-image + references.",
  },
  {
    id: "edit",
    name: "Image Editor",
    icon: Wand2,
    hue: "#B84FD8",
    tags: ["INPAINT", "UPSCALE"],
    desc: "Retouch, inpaint, upscale and swap backgrounds. Polish any generation before it ships.",
  },
  {
    id: "deck",
    name: "Deck Builder",
    icon: Presentation,
    hue: "#DE9B18",
    tags: ["PPTX", "TEMPLATES"],
    desc: "Turn strategy, copy and visuals into a branded deck — pitch-ready in minutes.",
  },
  {
    id: "leads",
    name: "Lead Agent",
    icon: Users,
    hue: "#E0447A",
    tags: ["SEQUENCES", "SCORING"],
    desc: "Build, score and sequence outreach lists. Wire approved copy into campaigns.",
  },
  {
    id: "hr",
    name: "HR Studio",
    icon: UserCog,
    hue: "#12A0A0",
    tags: ["JD", "COMMS"],
    desc: "Job posts, JDs and internal comms — in the company's own voice.",
  },
];

export const TOOLS = ALL_TOOLS.filter((t) => t.id !== "deck" && t.id !== "leads");
export const toolById = (id) => ALL_TOOLS.find((t) => t.id === id);

/* ── Brand context ───────────────────────────────────────── */
export const BRAND = {
  name: "OFFGRID",
  av: "OG",
  avHue: "#E8552A",
  voice: ["Direct", "Gritty", "Confident"],
  audience: ["17–35 urban", "Commuters"],
  never: ["luxurious", "game-changer", "synergy"],
  palette: ["#1A1712", "#EDE9DF", "#E8552A"],
  sources: 4,
  assets: 42,
  match: 96,
};

/* ── Workflow pipeline ───────────────────────────────────── */
export const PIPELINE = [
  { tool: "strategy", step: 1, status: "done", out: "Positioning: \"technical, not precious.\" 3 campaign angles + audience segments locked.", by: "Kanishk" },
  { tool: "copy",     step: 2, status: "done", out: "3 Instagram captions, 96% on-brand. Winner locked.", by: "Aria" },
  { tool: "genfy",    step: 3, status: "active", out: "Generating 4 key visuals from the locked copy + brand palette.", pass: "copy + palette →" },
  { tool: "edit",     step: 4, status: "queued", out: "Retouch + 9:16 story crops for the chosen visual.", pass: "final assets →" },
  { tool: "deck",     step: 5, status: "queued", out: "Assembles the launch deck: strategy, copy + visuals, OFFGRID template." },
];

/* ── Workflow templates ──────────────────────────────────── */
export const WORKFLOW_TEMPLATES = [
  { name: "Campaign Launch",       flow: ["strategy", "copy", "genfy", "edit", "deck"] },
  { name: "Social Content Sprint", flow: ["copy", "genfy", "edit"] },
  { name: "Lead Gen Sequence",     flow: ["strategy", "copy", "leads"] },
];

/* ── Projects ────────────────────────────────────────────── */
export const PROJECTS = [
  {
    name: "Spring Drop Launch",
    meta: "Campaign Launch · 5 steps · 3d ago",
    tag: "In progress — Genfy",
    tagHue: "#E8552A",
    steps: ["Strategy", "Copy", "Images", "Edit", "Deck"],
    done: 2,
    active: 2,
    view: "workflow",
  },
  {
    name: "Q3 Retention Emails",
    meta: "Lifecycle · 4 steps · 1w ago",
    tag: "Awaiting review — Leads",
    tagHue: "#B57611",
    steps: ["Strategy", "Copy", "Leads", "Send"],
    done: 2,
    active: 2,
  },
  {
    name: "Founder LinkedIn Series",
    meta: "Thought Leadership · 4 steps · done",
    tag: "Complete — 12 assets",
    tagHue: "#1E7F4F",
    steps: ["Strategy", "Copy", "Images", "Publish"],
    done: 4,
    active: -1,
  },
];

/* ── Navigation ──────────────────────────────────────────── */
export const NAV = [
  { id: "home",     label: "Home",        icon: Home },
  { id: "projects", label: "Projects",    icon: Boxes,     count: 3 },
  { id: "tools",    label: "Tools",       icon: LayoutGrid, count: 7 },
  { id: "workspace", label: "Workspace",  icon: Users },
  { id: "brain",    label: "Brand Brain", icon: Brain,     brain: true },
  { id: "assets",   label: "Assets",      icon: Library,   count: 42 },
];

/* ── Assets ──────────────────────────────────────────────── */
export const ASSETS = [
  { name: "Spring launch — caption set", by: "Aria",    byHue: "#2E6BE6", type: "COPY",     date: "2h ago",  g: null },
  { name: "Campaign key visual",         by: "Aria",    byHue: "#2E6BE6", type: "GENFY",    date: "3h ago",  g: "#E8552A,#c93d18" },
  { name: "Story crop — 9:16",           by: "Mara",   byHue: "#B84FD8", type: "EDITED",   date: "1d ago",  g: "#B84FD8,#8a2fa8" },
  { name: "Positioning brief",           by: "Kanishk", byHue: "#E8552A", type: "STRATEGY", date: "3d ago",  g: null },
  { name: "Hero — commuter shot",        by: "Aria",    byHue: "#2E6BE6", type: "GENFY",    date: "3d ago",  g: "#2FA36B,#1e7a4f" },
  { name: "Launch deck v2",              by: "Kanishk", byHue: "#E8552A", type: "DECK",     date: "1w ago",  g: "#DE9B18,#b47a0f" },
];

/* ── Copy Agent templates ────────────────────────────────── */
export const COPY_TEMPLATES = [
  "Instagram Captions",
  "LinkedIn Post",
  "Ad Copy",
  "Email Subject Line",
  "Blog Outline",
  "Product Description",
];
