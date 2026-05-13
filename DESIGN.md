# Synk Design System
*Design language reference for the Synk app and all related surfaces.*

---

## Philosophy

Synk is built on **controlled tension** — the visual friction between stark black surfaces and charged violet energy. The language is sharp, editorial, and deliberate. No ornamentation. No mascots. No warmth for its own sake. Every decision either serves clarity or creates focus.

**Three pillars:**
1. **Precise but not cold** — monochrome foundations are balanced by purposeful violet moments and generous whitespace that gives content room to breathe.
2. **Minimal but never empty** — restraint is enforced structurally. Layouts are asymmetric. Negative space is active, not absent.
3. **Still with moments of electricity** — the UI is calm by default. Transitions are sharp and intentional. Nothing animates without a reason.

---

## Color System

### Design Tokens

```css
:root {
  /* Surfaces */
  --bg:       #ffffff;     /* Page / card base */
  --bg2:      #f5f5f7;     /* Input fields, secondary panel */
  --bg3:      #ebebf0;     /* Tags, pills, subtle fills */
  --bg-ink:   #0a0a0f;     /* Deep black — hero sections, dark panels */
  --bg-ink2:  #111118;     /* Slightly lifted dark surface */
  --bg-ink3:  #1a1a24;     /* Tertiary dark fills, dividers */

  /* Borders */
  --border:   #e0e0e8;     /* Default strokes (light mode) */
  --border2:  #c8c8d4;     /* Stronger dividers */
  --border-ink: #2a2a38;   /* Borders on dark surfaces */
  --border-ink2: #3a3a4e;  /* Stronger dark dividers */

  /* Text */
  --text:     #0a0a0f;     /* Headings, primary labels */
  --text2:    #52525e;     /* Body, hints */
  --text3:    #a0a0b0;     /* Placeholders, disabled */
  --text-inv: #f5f5f7;     /* Text on dark surfaces */
  --text-inv2: #9090a8;    /* Secondary text on dark */

  /* Accent — Violet (primary energy) */
  --violet:   #5E3AFF;     /* Primary accent */
  --violet2:  #4D2EE0;     /* Hover / deeper state */
  --violet3:  #7B5FFF;     /* Lighter tint, on dark surfaces */
  --violet-glow: rgba(94, 58, 255, 0.28); /* Focus / ambient shadow */
  --violet-subtle: rgba(94, 58, 255, 0.08); /* Background tints */

  /* Semantic */
  --success:  #16a34a;     /* Confirmation, done states */
  --error:    #dc2626;     /* Validation errors */
  --warning:  #d97706;     /* Warning states */

  /* Neutral scale (utility) */
  --neutral-100: #f5f5f7;
  --neutral-200: #e8e8f0;
  --neutral-400: #9090a8;
  --neutral-600: #52525e;
  --neutral-800: #1e1e28;
  --neutral-900: #0a0a0f;

  /* Atmosphere */
  --symbol-float: #e0e0ec;  /* Floating glyphs — light mode */
  --symbol-float-dark: #1e1e2e; /* Floating glyphs — dark mode */
  --shadow:    0 4px 24px rgba(0, 0, 0, 0.06);
  --shadow-ink: 0 4px 32px rgba(0, 0, 0, 0.48);
  --shadow-violet: 0 8px 32px rgba(94, 58, 255, 0.2);
}
```

### Dark Mode Overrides

```css
.dark {
  --bg:       #0a0a0f;
  --bg2:      #111118;
  --bg3:      #1a1a24;
  --border:   #2a2a38;
  --border2:  #3a3a4e;
  --text:     #f5f5f7;
  --text2:    #9090a8;
  --text3:    #52525e;
  --violet:   #7B5FFF;
  --violet2:  #5E3AFF;
  --violet3:  #9B80FF;
  --violet-glow: rgba(94, 58, 255, 0.32);
  --violet-subtle: rgba(94, 58, 255, 0.1);
  --success:  #22c55e;
  --error:    #f87171;
  --shadow:    0 4px 32px rgba(0, 0, 0, 0.48);
}
```

### Color Usage Rules

| Token | Use for |
|---|---|
| `--violet` | Primary CTA buttons, focus rings, active states, links |
| `--bg-ink` | Hero sections, full-bleed dark panels, inverted cards |
| `--text` | All headings and primary labels |
| `--text2` | Body copy, hint text, metadata |
| `--text3` | Placeholders, disabled elements |
| `--success` | Confirmation states, completed items |
| `--error` | Validation — never decorative |

**Palette discipline:**
- White, black, and violet are the only three story-telling colors. Everything else is utility.
- Violet appears at full saturation only on interactive elements (buttons, focus rings, links). On backgrounds, use `--violet-subtle` only.
- Never combine two violet-tinted surfaces adjacently — always break with a neutral.

---

## Typography

### Font Stack

```css
/* Display + headings */
font-family: 'Geist', 'DM Sans', sans-serif;

/* UI labels, inputs, body */
font-family: 'Geist', sans-serif;

/* Monospace — metadata, code, tags, step labels */
font-family: 'Geist Mono', monospace;
```

### Type Scale

| Name | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `display` | 36–48px | 700 | Geist | Hero titles, marketing headlines |
| `heading-lg` | 20–24px | 700 | Geist | Section titles, question headings |
| `heading-sm` | 16–18px | 600 | Geist | Card headings, panel titles |
| `body-lg` | 15–16px | 400 | Geist | Primary body copy |
| `body` | 14px | 400 | Geist | Hint text, paragraph text |
| `label` | 12–13px | 500–600 | Geist | Button text, chip labels, nav items |
| `mono-label` | 10–11px | 700 | Geist Mono | Step numbers, code tags, metadata |
| `mono-hint` | 11px | 400 | Geist Mono | Keyboard shortcuts, inline annotations |

### Rules

- Headings: `font-weight: 700`, `letter-spacing: -0.02em`, `line-height: 1.2`
- Body: `line-height: 1.6`, `color: var(--text2)` by default
- Step labels: ALL CAPS, `letter-spacing: 0.1em`, `color: var(--violet)`, Geist Mono
- Pill tags: `font-size: 11px`, `font-weight: 600`, monospaced, uppercase
- Display text on dark: `color: var(--text-inv)`, never stark white at full opacity — use `rgba(245, 245, 247, 0.94)`

---

## Spacing

Uses an **8px base grid**.

```
4px   — icon gap, tight icon-label pairs
8px   — between chips, small internal spacing
12px  — input vertical padding
16px  — input horizontal padding, chip horizontal padding
20px  — between form field groups
24px  — card internal padding (compact)
32px  — card internal padding (standard)
40px  — between major page sections
64px  — section-level breathing room
```

---

## Component Patterns

### Card / Surface

Light mode:
```css
border-radius: 12–16px;
border: 1px solid var(--border);
box-shadow: var(--shadow);
background: var(--bg);
```

Dark / ink card:
```css
background: var(--bg-ink2);
border: 1px solid var(--border-ink);
box-shadow: var(--shadow-ink);
border-radius: 12–16px;
```

No heavy box-shadows competing. One shadow system per theme — don't mix.

### Input Fields

```css
background: var(--bg2);
border: 1.5px solid var(--border);
border-radius: 8px;
padding: 12px 16px;
font-size: 14px;
color: var(--text);
transition: border-color 0.15s, box-shadow 0.15s;
```

Focus state:
```css
border-color: var(--violet);
box-shadow: 0 0 0 3px var(--violet-glow);
outline: none;
```

Error state:
```css
border-color: var(--error);
box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18);
```

On dark surfaces, inputs use `--bg-ink3` background with `--border-ink2` border.

### Pill Chips (single / multi select)

```css
padding: 7px 14px;
border-radius: 50px;
border: 1.5px solid var(--border2);
background: var(--bg3);
font-family: 'Geist', sans-serif;
font-size: 13px;
font-weight: 500;
color: var(--text2);
transition: all 0.18s ease;
cursor: pointer;
```

Selected state:
```css
border-color: var(--violet);
background: var(--violet-subtle);
color: var(--violet);
font-weight: 600;
```

On dark:
```css
/* Default */
background: var(--bg-ink3);
border-color: var(--border-ink);
color: var(--text-inv2);

/* Selected */
background: var(--violet-subtle);
border-color: var(--violet3);
color: var(--violet3);
```

### Primary Button (CTA)

Always violet. Never use white or black as a primary interactive color.

```css
background: var(--violet);
color: #ffffff;
padding: 11px 24px;
border-radius: 8px;
font-size: 13px;
font-weight: 600;
letter-spacing: 0.01em;
box-shadow: 0 4px 16px var(--violet-glow);
transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
border: none;
```

Hover:
```css
background: var(--violet2);
transform: translateY(-1px);
box-shadow: 0 6px 20px var(--violet-glow);
```

Active:
```css
transform: translateY(0);
box-shadow: 0 2px 8px var(--violet-glow);
```

### Secondary Button (Outline)

```css
background: transparent;
color: var(--text);
border: 1.5px solid var(--border2);
padding: 10px 22px;
border-radius: 8px;
font-size: 13px;
font-weight: 600;
transition: border-color 0.15s, color 0.15s;
```

Hover:
```css
border-color: var(--violet);
color: var(--violet);
```

### Progress Indicators

**Dot style:**
```css
/* Default */
width: 7px; height: 7px; border-radius: 50%;
background: var(--neutral-200);

/* Active */
background: var(--violet);
transform: scale(1.5);
transition: all 0.2s cubic-bezier(.22,1,.36,1);

/* Done */
background: var(--success);
```

**Bar style:**
```css
height: 2px;
background: var(--neutral-200);
border-radius: 2px;

/* Fill */
background: var(--violet);
transition: width 0.35s cubic-bezier(.22,1,.36,1);
```

---

## Animation Principles

### Timing Vocabulary

| Name | Duration | Easing | Used for |
|---|---|---|---|
| `snap` | 100–150ms | ease | Hover color changes, icon swaps |
| `quick` | 200–250ms | ease-out | Chip select, toggle, badge changes |
| `smooth` | 350–400ms | cubic-bezier(.22,1,.36,1) | Step transitions, modal enter |
| `drift` | 500–600ms | cubic-bezier(.22,1,.36,1) | Page-level entrances |
| `spring` | 600ms | cubic-bezier(0.34,1.4,0.64,1) | Notification popups, confirm states |

### Step Transition

```css
@keyframes stepIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.step-in {
  animation: stepIn 0.32s cubic-bezier(.22, 1, .36, 1) both;
}
```

### Staggered List Entrance

```css
.list-item {
  opacity: 0;
  animation: stepIn 0.3s cubic-bezier(.22,1,.36,1) both;
  animation-delay: calc(var(--index) * 60ms);
}
```

### Pulsing Status Indicator

```css
@keyframes statusPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(94, 58, 255, 0.4); }
  50%       { box-shadow: 0 0 0 5px rgba(94, 58, 255, 0); }
}
.status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--violet);
  animation: statusPulse 2s ease infinite;
}
```

### Skeleton Shimmer

```css
@keyframes shimmer {
  from { background-position: -400px 0; }
  to   { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg3) 25%,
    var(--bg2) 50%,
    var(--bg3) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}
```

### Spotlight Border (hover effect on cards)

```css
.card {
  position: relative;
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(
    400px circle at var(--mouse-x) var(--mouse-y),
    rgba(94, 58, 255, 0.08),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.3s;
}
.card:hover::before { opacity: 1; }
```
(Track `--mouse-x` and `--mouse-y` via JS `mousemove` on the card element.)

---

## Atmosphere Details

### Floating Symbols

Positioned absolutely in background surfaces. Use `pointer-events: none`, minimal contrast (`--symbol-float`). Symbols: `∑ π ∞ ∂ √ ∫ λ ε ∇`

```css
font-family: 'Geist Mono', monospace;
font-size: 12px;
color: var(--symbol-float);
position: absolute;
pointer-events: none;
user-select: none;
```

Distribute irregularly — clustered top-right, sparse bottom-left. Never evenly spaced. Never centered.

### Theme Toggle

Small circular button, top-right of card or header bar.

```css
.toggle-btn {
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border2);
  background: var(--bg2);
  transition: background 0.15s, transform 0.2s;
}
.toggle-btn:hover {
  transform: rotate(15deg);
  background: var(--bg3);
}
```

Icons: use a clean sun SVG for light mode, crescent for dark mode. No emoji.

### Violet Glow Divider

A subtle accent line used to break sections without heavy borders:

```css
.glow-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--violet-glow),
    transparent
  );
  margin: 40px 0;
}
```

---

## Layout Grid

Standard form / content card — **two-zone layout**:

```
┌──────────────────────────────────────────────────┐
│  Header bar — logo left, theme toggle right       │
├──────────────────────────────────────────────────┤
│  Content zone                                     │
│  max-width: 680px                                 │
│  padding: 40px 48px                               │
│  border-radius: 16px                              │
└──────────────────────────────────────────────────┘
```

For split layouts (sidebar + main):

```
┌──────────┬───────────────────────────────────────┐
│  200px   │             flex: 1                   │
│  Sidebar │         Main content                  │
│  --bg2   │  padding: 40px                        │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

- Max content width: `680–720px` for forms, `1280px` for dashboards
- Card `border-radius`: `12px` (compact), `16px` (standard)
- Always left-align body copy. Center only display-level hero text.

---

## Do / Don't

| Do | Don't |
|---|---|
| Use `--violet` for all primary CTAs and interactive states | Use violet on backgrounds — use `--violet-subtle` only |
| Keep buttons `border-radius: 8px` — sharp, not pill | Use `border-radius: 50px` on buttons (reserve for chips only) |
| Use `Geist` for all UI text | Mix in a third typeface |
| Use negative space intentionally | Fill empty space with decorative elements |
| Apply `--violet-glow` as box-shadow on focus only | Use glow effects on static non-interactive elements |
| Keep transitions under 400ms for UI feedback | Slow-ease input validation or hover states |
| Float symbols at very low contrast | Make them legible, colored, or interactive |
| Use skeleton shimmer for loading states | Use generic spinners |
| Animate via `transform` and `opacity` only | Animate `width`, `height`, `top`, or `left` |

---

## Asset References

| Asset | Type | Notes |
|---|---|---|
| `Geist` | Font | weights: 400, 500, 600, 700 — via `next/font` or Vercel CDN |
| `Geist Mono` | Font | weights: 400, 700 — for metadata, tags, step labels |
| Skeleton shimmer | CSS-only | `800px` gradient band, 1.4s loop |
| Spotlight border | CSS + JS | `radial-gradient` tracking `mousemove` on card |
| Violet glow divider | CSS | Decorative horizontal separator |
| Status pulse dot | CSS | 2s infinite pulse via `box-shadow` |
| Floating symbols | Unicode | `∑ π ∞ ∂ √ ∫ λ ε ∇` |

---

*Synk Design System — v1*
