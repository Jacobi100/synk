# Synk Design System

> A bounty/hiring marketplace connecting clients with skilled professionals. Single-purple accent (#5E3AFF) on sage-tinted canvas (#e8ebe6), paired with near-black ink (#0e0f0c) text.

---

## 1. Design Philosophy

| Dial | Value | Meaning |
|---|---|---|
| DESIGN_VARIANCE | 6 | Offset, asymmetric. Left-aligned content over center. |
| MOTION_INTENSITY | 4 | CSS transitions, hover states, spring micro-interactions. No automatic page animations. |
| VISUAL_DENSITY | 4 | Generous whitespace, airy spacing. Cards breathe at `p-6`/`p-8`. |

### Current Implementation

The design system is applied globally across all pages. The brand identity is a single purple accent (`#5E3AFF`) on a sage-tinted secondary canvas (`#e8ebe6` light / `#1a1b18` dark), paired with near-black text (`#0e0f0c` light / `#e8ebe6` dark). Heavy display typography at weight 900 for hero headlines, Inter at weight 600 for UI text. Cards use surface contrast for elevation (no shadows).

---

## 2. Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Hero display | Inter | `900` | `text-5xl md:text-7xl leading-[0.85] tracking-tighter` |
| Sub-display / Section heads | Inter | `600` | `text-xl sm:text-2xl` |
| Body | Inter | `400` | inherited |
| UI Labels / Buttons | Inter | `600` | `text-sm` |
| Logo wordmark | Google Sans Flex | `600` | `text-xl` |
| Mono | `Geist Mono` / `JetBrains Mono` | `400` | inherited |
| Small / Captions | Inter | `400` | `text-xs` |

### Font Loading

- **Inter** - Loaded via `next/font/google` as CSS variable `--font-inter`. All Tailwind `font-sans` utilities map to this variable.
- **Geist Mono** - Loaded via `next/font/google` for monospace needs.
- **Google Sans Flex** - Used exclusively for the "Synk" logo wordmark via `--font-google-sans-flex`. Not a system font.

---

## 3. Color Palette

### Core Tokens (Hex)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `#ffffff` | `#0e0f0c` | Page / card background |
| `--foreground` | `#0e0f0c` | `#e8ebe6` | Body text |
| `--primary` | `#5E3AFF` | `#5E3AFF` | CTAs, primary actions, brand accent (unchanged in dark) |
| `--primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on primary bg |
| `--secondary` | `#e8ebe6` | `#1a1b18` | Page canvas, secondary surfaces |
| `--secondary-foreground` | `#0e0f0c` | `#e8ebe6` | Text on secondary |
| `--muted` | `#e8ebe6` | `#1a1b18` | Muted backgrounds |
| `--muted-foreground` | `#454745` | `#868685` | Secondary text |
| `--accent` | `#e8ebe6` | `#1a1b18` | Accent surfaces |
| `--accent-foreground` | `#0e0f0c` | `#e8ebe6` | Text on accent |
| `--border` | `#d4d7d2` | `#2a2b28` | Dividers, subtle borders |
| `--input` | `#ffffff` | `#1a1b18` | Input background |
| `--ring` | `#5E3AFF` | `#5E3AFF` | Focus rings |
| `--radius` | `1.5rem` | same | Base border radius |
| `--card` | `#ffffff` | `#0e0f0c` | Card surface |
| `--card-foreground` | `#0e0f0c` | `#e8ebe6` | Text on card |

### Brand Accent - Synk Purple

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#5E3AFF` | Primary buttons, brand accent, focus rings, map markers |
| `--primary-hover` | `#7B61FF` | Button hover state |
| `--primary-pale` | `#EDE9FF` / `#2D1B8A` | Badge backgrounds, soft surfaces (dark mode alternative) |

### Surface

| Token | Light | Dark | Usage |
|---|---|---|---|
| Canvas | `#ffffff` | `#0e0f0c` | Card interiors |
| Canvas Soft | `#e8ebe6` | `#1a1b18` | Page background (sage) |
| Ink | `#0e0f0c` | `#e8ebe6` | Primary text |

### Semantic

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--positive` | `#2ead4b` | `#22c55e` | Success indicator |
| `--positive-deep` | `#054d28` | `#166534` | Pressed positive |
| `--warning` | `#ffd11a` | `#fbbf24` | Caution |
| `--warning-deep` | `#b86700` | `#b45309` | Pressed warning |
| `--negative` | `#d03238` | `#f87171` | Destructive / error |
| `--negative-deep` | `#a72027` | `#b91c1c` | Pressed destructive |
| `--mute` | `#868685` | `#868685` | Muted icon/text |

---

## 4. Layout & Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | `8px` | Inline pills, small badges |
| `--radius-md` | `12px` | Form inputs, map controls |
| `--radius-lg` | `16px` | Mid-size cards |
| `--radius-xl` | `24px` | **Canonical** - buttons, cards, badges, nav pills |
| `--radius-pill` | `9999px` | Status pills, avatars |

All buttons, nav pills, and badges use `rounded-[24px]` as the canonical shape. Cards also use `rounded-[24px]` universally. The consistent 24px radius across surfaces is the defining shape language. Inputs are the only component using `rounded-md` (12px) to differentiate interactivity.

### Spacing

- Base unit: 4px
- Section padding: `py-12` (48px) on desktop, `py-8` (32px) on mobile
- Card interior: `p-6` (24px) or `p-8` (32px)
- Page padding: `px-4 sm:px-6 lg:px-8`

### Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Default | < 768px | Single column, stacked. Map hidden in hero. |
| `sm` | 640px | 2-column grids activate |
| `md` | 768px | Split-screen, 4-column grids, desktop nav visible |
| `lg` | 1024px | Hero text + map side-by-side, wider layouts |
| `xl` | 1280px | Max content width constrained (`max-w-7xl`) |

---

## 5. Components

### Button (`components/ui/button.tsx`)

- **Default (primary)**: Background `--primary` (purple), text `--primary-foreground` (white), `hover:bg-[--primary-hover]`, pill shape `rounded-[24px]`
- **Secondary**: Background `--secondary` (sage), text `--secondary-foreground` (ink), `hover:bg-[--border]`
- **Outline**: Background transparent, ink text, 1px solid `--foreground` border, `hover:bg-secondary`
- **Ghost**: Background transparent, ink text, `hover:bg-secondary`
- **Destructive**: Background `--negative` (red), white text
- **Link**: Underline on hover, ink text
- All buttons: `font-semibold`, `text-sm`, `active:scale-[0.97]` tactile feedback, `transition-all`
- Sizes: `default` (h-11, px-6), `sm` (h-9, px-4), `lg` (h-12, px-8), `icon` (size-11, rounded-full), `icon-sm` (size-9, rounded-full)
- Supports `asChild` via Radix Slot for wrapping links

### Input (`components/ui/input.tsx`)

- Background `--input`, 1px solid `--border`, radius `rounded-md` (12px)
- Focus ring: 2px `--ring` (purple) with offset
- Height `h-10`, padding `px-3 py-2`, `text-sm`

### Label (`components/ui/label.tsx`)

- `text-sm font-medium`, peer-disabled styling

### Navbar (`components/Navbar.tsx`)

- Background `--background` (white), ink text
- Sticky top (`sticky top-0 z-50`), no border-bottom
- Contains: Logo (left), nav links (center, desktop), NotificationBell + UserButton + theme switch + hamburger (right)
- Nav links: `text-sm font-semibold`, active = `text-foreground bg-secondary`, inactive = `text-muted-foreground`, hover shows same active treatment
- All nav link pills use `rounded-[24px]`
- Mobile: hamburger toggles a dropdown panel with same link styling
- Signed-out: Sign in (ghost) + Sign up (default) buttons
- Signed-in: NotificationBell + UserButton (Clerk) + hamburger

### Logo (`components/Logo.tsx`)

- SVG path logo or `<Image src="/logo.svg" />`
- Optional gradient variant using purple‑to‑black linear gradient
- "Synk" wordmark in `--font-google-sans-flex`, `text-xl font-semibold tracking-tight`

### GlowingBadge (`components/unlumen-ui/glowing-badge.tsx`)

- `inline-flex items-center gap-2 rounded-[24px] px-4 py-1.5 text-sm font-medium`
- Variants: `default`, `neutral`, `success`, `warning`, `error`, `info`
- "info" variant uses `bg-[#5E3AFF] text-white` (purple badge)
- Optional `dot` prop adds a colored indicator circle

### ShimmerSkeleton (`components/unlumen-ui/shimmer-skeleton.tsx`)

- Background `bg-muted` with a `shimmer` animation sweep
- Configurable `rounded` (none/sm/md/lg/full) and `animate` toggle
- Used for loading states in stats, cards

### AnimateCount (`components/unlumen-ui/animate-count.tsx`)

- Number animation using `framer-motion` (`motion/react`)
- Old value blurs up and exits; new value blurs in from below
- Duration: 450ms, easing: `[0.23, 0.88, 0.26, 0.92]`
- Uses `tabular-nums tracking-tight` for stable layout

### ThemeSwitch (`components/unlumen-ui/theme-switch.tsx`)

- Toggles between light/dark using `next-themes`
- `motion.button` with spring hover (`scale: 1.08`) and tap (`scale: 0.88`)
- Sun/Moon SVG icons with spring rotate animation on switch
- Uses `document.startViewTransition` for a circular reveal transition (desktop only)
- Renders a placeholder `size-9 rounded-full bg-accent border border-border` before hydration

### NotificationBell (`components/NotificationBell.tsx`)

- Bell icon with unread count badge
- Positioned in the navbar

### NearbyJobsMap (`components/map/NearbyJobsMap.tsx`)

- Google Maps JavaScript API loaded dynamically via script injection (`v=weekly`, `libraries=marker`)
- Map ID: `DEMO_MAP_ID` (testing). For production, replace with a real Google Cloud map ID.
- Uses `AdvancedMarkerElement` and `PinElement` (not legacy `google.maps.Marker`)
- Custom job markers: purple pill label showing job title + price, with downward CSS arrow
- Hover (desktop): shows rich InfoWindow tooltip with job details + "View Details" link
- Click: navigates to `/bounties/[id]` via Next.js router
- Current location marker: black circle (18px, white border, subtle shadow)
- Map styles: all POIs, transit, addresses, land parcels, and neighborhoods hidden - only roads, terrain, water, and administrative boundaries (states/regions) visible
- Map controls: `zoomControl` (RIGHT_CENTER), `fullscreenControl` (RIGHT_TOP), `streetViewControl` and `mapTypeControl` disabled
- Google Maps control buttons: overridden with CSS to match design system (`border-radius: 12px`, theme-aware background/border, no shadow, `active:scale(0.97)`)
- Two variants: `compact` (used in hero, 420px height, optional flush mode) and full (standalone page with heading)

### NavigationMap (`components/map/NavigationMap.tsx`)

- Used on bounty detail pages for turn-by-turn directions
- Uses Google Maps Directions API

### FluidBlobs (`components/ui/FluidBlobs.tsx`)

- Decorative animated SVG blob shapes for backgrounds

### GlowEffect (`components/ui/glow-effect.tsx`)

- Radial gradient glow overlay for decorative emphasis

---

## 6. Elevation

The brand uses surface contrast (`--secondary` sage/gray background vs `--background` white cards) as the primary elevation cue. No shadows on cards. Shadows reserved for modals/dropdowns only.

| Level | Treatment |
|---|---|
| Default | White card on sage canvas - contrast IS the elevation |
| Elevated | Same, z-index layering |
| Google Maps controls | No shadow (`box-shadow: none !important`) |

---

## 7. Dark Mode

- Canvas: `#0e0f0c` (ink)
- Canvas Soft: `#1a1b18` (dark sage)
- Text: `#e8ebe6` (light sage-white)
- Purple accent: unchanged (`#5E3AFF`)
- Primary-pale: darkened to `#2D1B8A`
- Cards: `#0e0f0c` on `#1a1b18`
- Semantic colors: lightened for visibility (`--negative`: `#f87171` vs `#d03238`)
- Enabled via `.dark` class on `<html>`, toggled by ThemeSwitch component
- Uses `next-themes` for persistence

---

## 8. Page Structure

### Homepage (`app/page.tsx`)

| Section | Desktop (lg+) | Mobile (< lg) |
|---|---|---|
| **Hero** | Text (left) + Map (right) side-by-side | Text only (full-width), map not rendered |
| **Stats** | 4-column grid (sm:grid-cols-4) | 2-column grid (grid-cols-2) |
| **Action Cards** | 2-column grid (sm:grid-cols-2) | Single column |
| **Navbar** | Full nav links visible | Hamburger menu |

Hero headline uses `text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter`. Welcome badge uses GlowingBadge (info variant) with a purple decorative arrow below it.

---

## 9. Google Maps Integration

| Aspect | Detail |
|---|---|
| **API loading** | Dynamic script injection with `callback=__gmapsReady` |
| **Channel** | `v=weekly` (latest weekly channel) |
| **Marker library** | `libraries=marker` - `AdvancedMarkerElement` + `PinElement` |
| **Map ID** | `DEMO_MAP_ID` (testing); real map ID required for production |
| **Marker style (jobs)** | Custom HTML: purple pill (#5E3AFF, white text, `rounded-[8px]`, max-width 160px, text-ellipsis) with a downward CSS arrow |
| **Marker style (current location)** | Black circle (18px, `border-radius: 50%`, `background: #000`, `border: 3px solid #fff`, `box-shadow`) |
| **Tooltip** | Shared InfoWindow, opened on `mouseenter` (desktop) or click (mobile), closed on `mouseleave` with 200ms delay |
| **Navigation** | Marker click uses `router.push()` to `/bounties/[id]` |
| **Hidden features** | `poi`, `transit`, `address`, `administrative.land_parcel`, `administrative.neighborhood` |
| **Control styling** | Google Maps controls restyled via `.gm-style` CSS overrides to use design tokens |

---

## 10. Animations

| Name | Timing | Easing | Used On |
|---|---|---|---|
| `stepIn` | 0.32s | `cubic-bezier(0.22, 1, 0.36, 1)` | Content entrance |
| `fadeIn` | 0.3s | `ease` | Overlays, modals |
| `shimmer` | 1.4s / 1.6s | `ease-in-out` | Skeleton loading |
| Active press | instant | `scale(0.97)` | All interactive elements |
| Spring hover | 0.2s | `spring, bounce: 0` | ThemeSwitch |

---

## 11. File Reference

| File | Role |
|---|---|
| `app/globals.css` | Design tokens, Tailwind theme, keyframes, Google Maps overrides |
| `app/layout.tsx` | Root layout, font loading (Inter + Geist Mono) |
| `app/page.tsx` | Homepage: hero, stats, action cards |
| `components/Logo.tsx` | Reusable logo (SVG + "Synk" wordmark) |
| `components/Navbar.tsx` | Top navigation bar |
| `components/NotificationBell.tsx` | Notification bell with unread count |
| `components/BountyCard.tsx` | Bounty listing card |
| `components/BountyForm.tsx` | Bounty create/edit form |
| `components/ui/button.tsx` | Primary/secondary/outline/ghost/destructive button |
| `components/ui/input.tsx` | Text input |
| `components/ui/label.tsx` | Form label |
| `components/ui/FluidBlobs.tsx` | Decorative blobs |
| `components/ui/glow-effect.tsx` | Radial glow overlay |
| `components/unlumen-ui/glowing-badge.tsx` | Status badge with dot indicator |
| `components/unlumen-ui/shimmer-skeleton.tsx` | Loading skeleton |
| `components/unlumen-ui/animate-count.tsx` | Animated number counter |
| `components/unlumen-ui/theme-switch.tsx` | Dark/light mode toggle |
| `components/map/NearbyJobsMap.tsx` | Google Maps with job markers |
| `components/map/NavigationMap.tsx` | Directions/navigation map |

---

## 12. Design Review Checklist

- [x] Sage canvas (`bg-secondary`) as page background, white cards (`bg-card`) on top
- [x] Single purple CTA accent (`#5E3AFF`) - no second brand color
- [x] Buttons use `rounded-[24px]` (pill) shape
- [x] Cards use `rounded-[24px]` shape
- [x] Inputs use `rounded-[12px]` with border
- [x] Hero headlines use weight 900 (Inter weight 900)
- [x] No card shadows - elevation via surface contrast
- [x] No hardcoded colors - use CSS variable tokens
- [x] Interactive elements have `active:scale-[0.97]` tactile feedback
- [x] Dark mode properly inverted
- [x] Map markers match brand purple
- [x] Map controls themed with design system tokens
- [x] Google Maps POIs hidden - only roads + states visible
- [x] Map hidden on mobile hero view
- [x] Consistent 24px radius across all surfaces
