# 🎨 Cog Culture — Design System & Style Guide

This document outlines the design tokens, typography scales, colors, spacing rules, and UI patterns used across the Cog Culture landing page and admin dashboards.

---

## 1. 📂 Typography & Font Hierarchy

The Cog Culture site uses a clean, modern dual-font layout. Body copy is designed for high readability, while display elements have a tight letter-spaced premium feel.

### Global Font Families
*   **Body & System Font (`font-sans`)**: `Inter`, system-ui, sans-serif
    *   *Usage*: Dashboard tables, settings panels, navigation lists, description paragraphs.
    *   *Properties*: `-webkit-font-smoothing: antialiased`
*   **Display & Heading Font (`font-display`)**: `Inter Tight`, `Inter`, system-ui, sans-serif
    *   *Usage*: Applied to all header elements (`h1`, `h2`, `h3`, `h4`).
    *   *Properties*: `letter-spacing: -0.02em` for an editorial, premium density.

### Typography Scale
| Element | Tailwind Classes | Desktop Size | Mobile Size | Line-Height & Weight | Context / Example |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Hero)** | `text-3xl md:text-5xl font-display` | `48px` | `30px` | `leading-[1.05]`, `font-medium` | "One AI suite. Infinite ways to create." |
| **H2 (Section)** | `text-3xl md:text-5xl font-display` | `48px` | `30px` | `leading-normal`, `font-medium` | "The AI Creative Suite..." |
| **H3 (Widgets)** | `text-lg font-display` | `18px` | `18px` | `leading-normal`, `font-semibold` / `font-medium` | "Welcome Back, Akhil !" / Widget Headers |
| **Body text** | `text-sm font-sans` | `14px` | `14px` | `leading-relaxed`, `font-normal` | Form inputs, description paragraphs. |
| **Sub-labels** | `text-xs font-sans` | `12px` | `12px` | `font-semibold` / `font-bold` | Category headers, sidebar sections, uppercase labels. |
| **Microcopy** | `text-[10px]` | `10px` | `10px` | `leading-none` | Copyright markers ®, avatar small initials, sub-emails. |

---

## 2. 🎨 Colors & Theming

The site implements a high-contrast layout on the marketing landing pages and supports a full Dark Mode overlay across the dashboard panels.

### Theme Swatches (Tailwind Custom Extensions)
*   **`brand`**: `#000000` (Pure Black) — Primary brand color for highlights and CTA backgrounds.
    *   *Note*: Switches to `#38bdf8` in dashboard dark mode.
*   **`brand-fg`**: `#ffffff` (Pure White) — Foreground text used on black buttons.
*   **`ink`**: `#16192b` (Deep Slate-Navy) — Main primary text color for optimal contrast.
*   **`surface`**: `#f7f8fa` (Cool White) — Background sections.
*   **`surface-alt`**: `#dddddd` (Mid-tone Gray) — Gray cards, hover states, inactive tabs.
*   **`border`**: `#e6e8ee` (Crisp Border Gray) — Outer margins and line separators.
*   **`muted`**: `#6b7080` (Muted Gray) — Subtitles and secondary descriptors.

### Dashboard Theme States
Dashboard styling changes dynamically when the `.theme-dark` class is toggled on the `html` node:

| UI Component | Light Mode / Default | Dark Mode (`html.theme-dark`) |
| :--- | :--- | :--- |
| **Outer Background** | `#eef0f3` (Light gray-blue) | `#0f172a` (Slate 900) |
| **Foreground Text** | `#16192b` (Ink) | `#cbd5e1` (Slate 300) |
| **Sidebar & Header** | `#ffffff` | `#1e293b` (Slate 800) |
| **Inner Panels** | `#ffffff` | `#1e293b` (Slate 800) |
| **Borders** | `#e2e8ee` / `#ccd4dc` | `#334155` (Slate 700) |
| **Active States** | `#000000` (Pure Black) | `#38bdf8` (Sky Blue) |
| **Form Fields** | `#ffffff` | `#0f172a` (Slate 900) |
| **Notification Dot** | `#e20074` (Magenta) | `#e20074` (Magenta) |

---

## 3. 📏 Spacing, Layout & Alignment

### Layout Boundaries
*   **Maximum Container Width**: `max-w-7xl` (1280px wide) center-aligned via `mx-auto`.
*   **Lateral Padding (Gutter)**:
    *   *Marketing Landing Pages*: Standardized to `px-[70px]` on desktop.
    *   *Dashboard Content Area*: Set to `px-8` (32px) or `px-6` (24px).

### Section & Grid Spacing
*   **Hero Sections**: `pt-16 pb-6` (64px top, 24px bottom).
*   **Standard Content Sections**: `pt-10 pb-16` (40px top, 64px bottom).
*   **Sidebar Width**:
    *   *Expanded*: `w-64` (256px) with `p-6` (24px) padding.
    *   *Collapsed*: `w-4.5rem` (72px) with `p-[1.5rem_0.75rem]` padding.
*   **Sub-Header Bar**: Fixed height `h-16` (64px) with `px-8` lateral padding.
*   **Interactive Grids**: Component column gaps are separated by `gap-4` or custom `gap-[7px]` to minimize whitespace gutters in grid cells.

---

## 4. ✨ Borders, Shadows & Motion

*   **Border Radius**: Elements use **`rounded-none`** (0px border-radius) universally across buttons, metric containers, input boxes, and sidebar blocks.
*   **Drop Shadows**: Drops shadows are restricted to navigation dropdowns (`shadow-xl`) and primary buttons (`shadow-sm` / hover: `shadow-md`).
*   **Custom Dot Cursor**:
    *   A cursor overlay (`#custom-cursor`) tracks mouse movement globally.
    *   *Default*: A circular solid dot (`width: 16px; height: 16px`) with `mix-blend-difference` blending.
    *   *Hover State*: Scales to `40px` wide, becomes transparent, and acquires a `1.5px` border (white in marketing, black/white in dashboards) when hovering over links/buttons.
*   **Transitions**:
    *   Sidebar width expansions: `transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1)`.
    *   Smooth page load overlay: `html.js-fade body.fade-in` transitions opacity from 0 to 1 over `0.1s`.
    *   Card Hover Overlay (`.card-hover`): Uses `::after` scales on `transform: scaleY(0)` to `scaleY(1)` with a `0.4s` transition. All inner text colors are updated to white using `!important` color overrides.
