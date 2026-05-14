# Synk Design System

> A bounty/hiring marketplace connecting clients with skilled professionals.

---

## 1. Design Philosophy

| Dial | Value | Meaning |
|---|---|---|
| DESIGN_VARIANCE | 8 | Asymmetric, offset layouts. Split-screen, left-aligned content. |
| MOTION_INTENSITY | 6 | CSS keyframe animations, fade-in-up entrances, floating decorative elements. |
| VISUAL_DENSITY | 4 | Airy spacing (`p-8`/`p-12`). Cards breathe. Generous whitespace. |

### Current Implementation

The design system is currently implemented on the auth screens (`/sign-in`, `/sign-up`). Other pages use the original template styling and have not been migrated yet.

---

## 2. Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Headlines | `Geist` (sans) | Semibold (`600`) | `text-5xl md:text-6xl leading-[1.05] tracking-tighter` |
| Taglines / Logo text | `Google Sans Flex` | Semibold (`600`) | `text-2xl` (logo), `text-base md:text-lg` (tagline) |
| Body | `Geist` (sans) | Normal (`400`) | inherited |
| UI Labels / Buttons | `Geist` (sans) | Medium (`500`) | `text-sm` |
| Mono | `Geist Mono` | Normal (`400`) | inherited |
| Small / Captions | `Geist` (sans) | Normal (`400`) | inherited |

### Font Loading

- **Geist** — Loaded via `next/font/google` with CSS variables `--font-geist-sans` and `--font-geist-mono`. All Tailwind `font-sans` / `font-mono` utilities map to these variables.
- **Google Sans Flex** — Loaded via CDN `<link>` in `<head>` from Google Fonts. Custom CSS class `.font-google-sans-flex` applies the font with `font-variation-settings` (slnt, wdth, GRAD, ROND). No Tailwind utility class — use the explicit class name.

---

## 3. Color Palette

### Core Tokens (OKLCH)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Body text |
| `--primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Primary buttons, links |
| `--secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Secondary surfaces |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Card/input borders |
| `--accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Accent surfaces |
| `--radius` | `0.625rem` | same | Base border radius |

### Brand Accent — Deep Indigo

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--accent-brand` | `oklch(0.45 0.18 270)` | `oklch(0.65 0.18 270)` | Buttons, active states, brand panel background |
| `--accent-brand-foreground` | `oklch(0.99 0 0)` | `oklch(0.99 0 0)` | Text on brand bg |
| `--accent-subtle` | `oklch(0.95 0.04 270)` | `oklch(0.25 0.04 270)` | Hover states, pill badges |

### Brand Panel Gradient

The auth screen brand panel uses a custom gradient (ad-hoc, not a token):
```css
linear-gradient(180deg, #000000 0%, #5E3AFF 56%, #11073D 96%)
```

---

## 4. Auth Screen — Reference Implementation

The auth screens (`/sign-in`, `/sign-up`) are the only pages using the new design system. They demonstrate the full visual language:

### Layout
- **Split-screen:** Left brand panel (45%) + right form panel (55%) on `md:` and above
- **Mobile:** Brand panel hidden, compact logo bar shown above the form

### Left Panel (Brand)
- Background: `linear-gradient(180deg, #000000 0%, #5E3AFF 56%, #11073D 96%)`
- Radial light source overlay: `ellipse_at_top_left`, `rgba(255,255,255,0.2)` → transparent
- Dot grid pattern overlay: 32px spaced dots at `rgba(255,255,255,0.06)`
- Logo: SVG icon (`/logo.svg`, `size-9`) + "Synk" text in Google Sans Flex, white
- Headline: Geist, `text-5xl md:text-6xl`, `font-semibold`, `leading-[1.05]`, `tracking-tighter`
- Tagline: Google Sans Flex, `text-base md:text-lg`, `text-white/70`

### Right Panel (Form)
- Background: `bg-background`
- Clerk `<SignIn>` / `<SignUp>` component with custom `appearance` prop
  - Variables mapped to CSS custom properties (`var(--accent-brand)`, etc.)
  - Card: `border border-border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`
  - Primary button: `bg-accent-brand`, `active:scale-[0.98]`
  - Inputs: focus ring `2px solid var(--accent-brand)`
  - All interactive elements use `transition-colors duration-200`
- Form wrapper: `animate-fade-in-up` entrance animation

### Clerk Configuration
- Env vars: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- Sign-up redirects to local `/sign-up` instead of Clerk's hosted portal

---

## 5. Custom Keyframe Animations

Defined in `app/globals.css`:

| Keyframe | Utility | Timing | Purpose |
|---|---|---|---|
| `float` | `animate-float` | `6s ease-in-out infinite` | Gentle vertical float |
| `float-slow` | `animate-float-slow` | `8s ease-in-out infinite` | Slower float variation |
| `fade-in-up` | `animate-fade-in-up` | `0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards` | Content entrance |
| `fade-in-up` delayed | `animate-fade-in-up-delayed` | same, `0.15s` delay | Staggered entrances |
| `shimmer` | `animate-shimmer` | `2s linear infinite` | Skeleton loading |

---

## 6. Logo

- **SVG file:** `public/logo.svg` — geometric "S" shape, white fill
- **Component:** `components/Logo.tsx` — wraps `next/image` with optional `showText` prop
  - Icon: `36x36` (`size-9`)
  - Text (when shown): `text-2xl font-semibold tracking-tight` in inherited color
- The logo SVG is white-filled so it works on dark brand backgrounds

---

## 7. Components

### Logo (`components/Logo.tsx`)
- Reusable `<Logo showText={false} />` for icon-only, `<Logo />` for icon + "Synk" text
- Uses `next/image` with `priority` for LCP optimization

### Navbar (`components/Navbar.tsx`)
- **Not yet migrated.** Still uses hardcoded `from-blue-600 to-blue-700` logo gradient, `bg-white/95`, and `border-gray-200`.

### BountyCard (`components/BountyCard.tsx`)
- **Not yet migrated.** Still uses hardcoded `hover:border-blue-400`, `bg-white`, `shadow-lg`.

### BountyForm (`components/BountyForm.tsx`)
- **Not yet migrated.** Still uses raw `<input>`/`<select>` with duplicated classes and `focus:ring-blue-500`.

### VoiceInput (`components/voice/VoiceInput.tsx`)
- **Not yet migrated.** Still uses hardcoded `bg-green-600`/`bg-red-500`/`bg-orange-500`.

### shadcn Button (`components/ui/button.tsx`)
- **Not yet migrated.** Missing spring easing on transitions.

---

## 8. Responsive Strategy

| Breakpoint | Width | Behavior |
|---|---|---|
| Default | < `768px` | Single column, stacked layout |
| `md` | `768px` | Split-screen panels, grids appear |
| `lg` | `1024px` | Wider layouts, larger typography |
| `xl` | `1280px` | Max content width constrained |

Auth screens use `min-h-[100dvh]` instead of `min-h-screen` for mobile viewport stability.

---

## 9. Pages Implemented

| Page | Status | Notes |
|---|---|---|
| `/sign-in` | Done | Full design system applied |
| `/sign-up` | Done | Same as sign-in |
| `/` (home) | Done | Brand gradient cards, hero icons, theme-aware tokens. Stats use `AnimateCount` + `ShimmerSkeleton`; greeting uses `GlowingBadge`. |
| `/bounty/browse` | Done | Theme tokens, brand accent, dark mode |
| `/bounty/create` | Done | Theme tokens, brand accent inputs |
| `/bounty/[id]` | Done | Theme tokens, brand gradient price card |
| `/bounty/[id]/payment` | Done | Theme tokens, brand accent buttons |
| `/bounty/[id]/complete` | Done | Theme tokens, dark-mode-compatible alerts |
| `/bounty/[id]/applications` | Done | Theme tokens, brand accent avatars |
| `/applications` | Done | Theme tokens, dark-mode badge colors |
| `/profile` | Not migrated | Template styling |
| `/onboarding` | Done | Brand colors, Google Sans Flex logo pattern. Form uses `BlobCard` wrapper with Synk brand colors + shadcn `Input`/`Label`. |

---

## 10. Dark Mode

### Setup
- **Library:** `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- **Provider:** Wraps `ClerkProvider` in `app/layout.tsx`
- **CSS:** Dark mode variables defined in `.dark` block in `app/globals.css`

### Theme Switch
- **Component:** `ThemeSwitch` from Unlumen UI (`@/components/unlumen-ui/theme-switch`)
- **Integration:** Placed in `Navbar` next to `UserButton` (desktop) and in mobile menu
- **Animation:** View transition CSS (`startViewTransition`) with circle clip-path reveal, disabled on screens > 1800px wide

### Token Usage Pattern
| Token | Light | Dark | Example |
|---|---|---|---|
| `bg-background` | White | Near-black | Page background |
| `text-foreground` | Near-black | White | Headings, body text |
| `text-muted-foreground` | Gray-500 | Gray-400 | Secondary text |
| `bg-card` | White | Dark gray | Card surfaces |
| `border-border` | Light gray | White/10% | Dividers, borders |
| `bg-muted` | Gray-100 | Dark gray-2 | Muted backgrounds |
| `bg-[#5E3AFF]` | Brand purple | Brand purple | Brand accent (no change) |

### Semantic Colors (status/urgency badges)
Badge colors use light/dark variants: `bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`

---

## 11. Unlumen UI Components

Installed via Unlumen shadcn registry. All components in `components/unlumen-ui/`:

| Component | Usage |
|---|---|---|
| `ThemeSwitch` | Dark mode toggle in Navbar |
| `ShimmerSkeleton` | Loading skeleton states (homepage stats) |
| `GlowingBadge` | Status indicator badges, "Welcome back" greeting on homepage |
| `TiltCard` / `Tilt` | 3D hover card effect |
| `AnimateCount` | Animated number counters (homepage stats) |
| `FloatingTooltip` | Tooltip overlays |
| `HoverFeatureCards` | Feature card grid with hover effects |
| `AnimatedList` | Staggered list animations |
| `AppleSwitch` | Toggle switches |
| `MotionNavigationMenu` | Animated navigation dropdowns |
| `ClippedCircle` | Decorative clipped circle shapes |
| `BlobCard` | Animated card with fluid blob header + rotating glow border (onboarding form) |

---

## 12. File Reference

| File | Role |
|---|---|
| `app/globals.css` | Design tokens, custom keyframes, `.font-google-sans-flex` class, Tailwind theme |
| `app/layout.tsx` | Root layout, font loading (Geist via next/font, Google Sans Flex via CDN), Clerk provider, React Grab |
| `app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Auth sign-in with full design system |
| `app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Auth sign-up with full design system |
| `components/Logo.tsx` | Reusable logo component (SVG + optional text) |
| `components/ui/FluidBlobs.tsx` | Animated SVG blob primitive (used by BlobCard) |
| `components/ui/glow-effect.tsx` | Rotating conic-gradient glow border primitive (used by BlobCard) |
| `components/unlumen-ui/blob-card.tsx` | Animated blob card with glow border (onboarding form wrapper) |
| `public/logo.svg` | SVG logo asset |
| `.env` | Clerk routing env vars, API keys |

---

## 13. Design Review Checklist

For pages using the design system, verify:

- [ ] Brand panel uses `linear-gradient(180deg, #000000 0%, #5E3AFF 56%, #11073D 96%)`
- [ ] Radial light source + dot grid overlays on brand backgrounds
- [ ] Text on brand panel uses correct font (Geist for headlines, Google Sans Flex for supporting text)
- [ ] Form panels use `bg-background` with diffusion shadow on cards
- [ ] Clerk `appearance` maps config to CSS variables (not hardcoded values)
- [ ] Animations use `pointer-events-none` and `aria-hidden="true"`
- [ ] Layout uses `min-h-[100dvh]` (not `min-h-screen`)
- [ ] No hardcoded `blue-600`/`gray-50`/`bg-white` — use CSS variable tokens
- [ ] Interactive elements have `active:scale-[0.98]` tactile feedback
- [ ] Google Sans Flex text uses `.font-google-sans-flex` class
