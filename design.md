# Synk Design System

> A bounty/hiring marketplace connecting clients with skilled professionals — inspired by Wise's visual identity.

---

## 1. Design Philosophy

| Dial | Value | Meaning |
|---|---|---|
| DESIGN_VARIANCE | 6 | Offset, asymmetric. Left-aligned content over center. |
| MOTION_INTENSITY | 4 | CSS transitions, hover states only. No automatic animations. |
| VISUAL_DENSITY | 4 | Generous whitespace, airy spacing. Cards breathe at `p-6`/`p-8`. |

### Current Implementation

The design system is applied globally across all pages. The brand identity is a single lime-green accent (`#9fe870`) on a sage-tinted canvas (`#e8ebe6`), paired with a near-black ink (`#0e0f0c`) text. Heavy display typography at weight 900 for hero headlines, Inter at weight 600 for everything else.

---

## 2. Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Hero display | Inter (Geist substitute) | `900` | `text-5xl md:text-7xl leading-[0.85] tracking-tighter` |
| Sub-display / Section heads | Inter | `600` | `text-3xl md:text-4xl` |
| Body | Inter | `400` | inherited |
| UI Labels / Buttons | Inter | `600` | `text-sm` |
| Mono | `Geist Mono` / `JetBrains Mono` | `400` | inherited |
| Small / Captions | Inter | `400` | `text-xs` |

### Font Loading

- **Inter** — Loaded via `next/font/google` with CSS variables `--font-inter`. All Tailwind `font-sans` utilities map to this variable.
- **Geist Mono** — Loaded via `next/font/google` for monospace needs.

---

## 3. Color Palette

### Core Tokens (Hex)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `#ffffff` | `#0e0f0c` | Page / card background |
| `--foreground` | `#0e0f0c` | `#e8ebe6` | Body text |
| `--primary` | `#9fe870` | `#9fe870` | CTAs, primary actions, brand accent |
| `--primary-foreground` | `#0e0f0c` | `#0e0f0c` | Text on primary bg |
| `--secondary` | `#e8ebe6` | `#1a1b18` | Secondary surfaces |
| `--muted` | `#e8ebe6` | `#1a1b18` | Muted backgrounds |
| `--muted-foreground` | `#454745` | `#868685` | Secondary text |
| `--accent` | `#e8ebe6` | `#1a1b18` | Accent surfaces |
| `--accent-foreground` | `#0e0f0c` | `#e8ebe6` | Text on accent |
| `--border` | `#d4d7d2` | `#2a2b28` | Dividers, subtle borders |
| `--input` | `#ffffff` | `#1a1b18` | Input background |
| `--ring` | `#9fe870` | `#9fe870` | Focus rings |
| `--radius` | `1.5rem` | same | Base border radius |

### Brand Accent — Wise Green

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#9fe870` | Primary buttons, brand accent |
| `--primary-hover` | `#cdffad` | Button hover state |
| `--primary-pale` | `#e2f6d5` | Badge backgrounds, soft surfaces |

### Surface

| Token | Light | Dark | Usage |
|---|---|---|---|
| Canvas | `#ffffff` | `#0e0f0c` | Card interiors |
| Canvas Soft | `#e8ebe6` | `#1a1b18` | Page background (sage) |
| Ink | `#0e0f0c` | `#e8ebe6` | Primary text |

### Semantic

| Token | Value | Usage |
|---|---|---|
| `--positive` | `#2ead4b` | Success indicator |
| `--positive-deep` | `#054d28` | Pressed positive |
| `--warning` | `#ffd11a` | Caution |
| `--warning-deep` | `#b86700` | Pressed warning |
| `--negative` | `#d03238` | Destructive / error |
| `--negative-deep` | `#a72027` | Pressed destructive |

---

## 4. Layout & Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `8px` | Inline pills, small badges |
| `--radius-md` | `12px` | Form inputs |
| `--radius-lg` | `16px` | Mid-size cards |
| `--radius-xl` | `24px` | **Canonical** — buttons + cards |
| `--radius-pill` | `9999px` | Status pills |

### Spacing

- Base unit: 4px
- Section padding: `py-12` (48px) on desktop
- Card interior: `p-6` (24px)

### Responsive

| Breakpoint | Width | Behavior |
|---|---|---|
| Default | < 768px | Single column, stacked |
| `md` | 768px | Split-screen, grids appear |
| `lg` | 1024px | Wider layouts |
| `xl` | 1280px | Max content width constrained |

---

## 5. Components

### Button (`components/ui/button.tsx`)

- **Primary**: Background `--primary` (green), text `--primary-foreground` (ink), pill shape `--radius-xl` (24px)
- **Secondary**: Background `--canvas-soft` (sage), text `--ink`, pill shape
- **Tertiary (ghost)**: Background transparent, text `--ink`, pill shape, 1px solid `--ink` border
- All buttons: `font-semibold`, `text-sm`, `px-5 py-2.5`, `active:scale-[0.97]` tactile feedback

### Navbar (`components/Navbar.tsx`)

- Background `--canvas` (white), ink text
- Sticky top, no border-bottom (elevation via content contrast)
- Logo: `Logo` component (SVG + "Synk" text)
- Nav links: `text-sm font-semibold` (Inter weight 600), hover underline

### BountyCard (`components/BountyCard.tsx`)

- White card on sage canvas (`bg-card` on `bg-secondary` page)
- Radius `--radius-xl` (24px)
- No border (elevation from surface contrast)
- Padding `p-6`
- Status badges: pill shape (`--radius-pill`), semantic colors

### BountyForm (`components/BountyForm.tsx`)

- White card on sage canvas
- Inputs: background `--input`, 1px solid `--ink` border, radius `--radius-md` (12px)
- Focus ring: `--ring` (green)

### VoiceInput (`components/voice/VoiceInput.tsx`)

- Mic button: green (`--primary`) for idle, red for recording, orange for error
- Pill language selector chips
- White card on sage canvas

---

## 6. Elevation

The brand uses surface contrast (`--secondary` sage background vs `--background` white cards) as the primary elevation cue. No shadows on cards. Shadows reserved for modals/dropdowns only.

| Level | Treatment |
|---|---|
| Default | White card on sage canvas — contrast IS the elevation |
| Elevated | Same, z-index layering |

---

## 7. Dark Mode

- Canvas: `#0e0f0c` (ink)
- Canvas Soft: `#1a1b18` (dark sage)
- Text: `#e8ebe6` (light sage-white)
- Green accent: unchanged (`#9fe870`)
- Cards: `#0e0f0c` on `#1a1b18`

---

## 8. File Reference

| File | Role |
|---|---|
| `app/globals.css` | Design tokens, Tailwind theme, animations |
| `app/layout.tsx` | Root layout, font loading (Inter + Geist Mono) |
| `components/Logo.tsx` | Reusable logo (SVG + text) |
| `components/Navbar.tsx` | Top navigation bar |
| `components/BountyCard.tsx` | Bounty listing card |
| `components/BountyForm.tsx` | Bounty create/edit form |
| `components/ui/button.tsx` | Primary/secondary/tertiary button |
| `components/voice/VoiceInput.tsx` | Voice recording component |

---

## 9. Design Review Checklist

- [ ] Sage canvas (`bg-secondary`) as page background, white cards (`bg-card`) on top
- [ ] Single green CTA accent — no second brand color
- [ ] Buttons use `rounded-[24px]` (pill) shape
- [ ] Cards use `rounded-[24px]` shape
- [ ] Inputs use `rounded-[12px]` with ink border
- [ ] Hero headlines use weight 900 (Inter weight 900)
- [ ] No card shadows — elevation via surface contrast
- [ ] No hardcoded colors — use CSS variable tokens
- [ ] Interactive elements have `active:scale-[0.97]` tactile feedback
- [ ] Dark mode properly inverted
