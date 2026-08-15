# NirmAI Mobile — Material 3 Re-skin Design Spec

Date: 2026-08-14 · Target: `NirmAI-Mobile-v3.html` (253 screen tiles, 21,219 lines, 7,859 inline styles)
Backup: `scratchpad/NirmAI-Mobile-v3.pre-m3.html` · Verification: `.claude/harness/e2e-personas.js` must stay 51/51.
Research inputs: `m3-system-research.md` + `m3-ux-research.md` (scratchpad; palettes computed with Google's `@material/material-color-utilities`).

## 1. Goal & decisions (user-approved)

Convert the entire 253-screen gallery to a faithful Material 3 visual system while keeping NirmAI's brand character and every behavior intact.

- **Color seed:** NirmAI sage `#7E9270`. **Primary palette at seed chroma 21.4** (M3 fidelity-style, muted) — NOT the default chroma-48 boost, which turns sage into a loud Android green. Tone math (and thus WCAG contrast guarantees) is unchanged by chroma.
- **Typography:** Instrument Sans on the M3 type scale; Geist Mono retained for amounts/IDs (tabular numerals — Indian money UX).
- **Scope:** Light **and** dark schemes, with a gallery-level toggle + `prefers-color-scheme` default.
- **Non-goals:** No JS/flow changes, no screens added/removed, canon invariants untouched (₹8,61,000 · 3 milestones · passwordless · no codenames). Gallery chrome (page header/grid) gets tokens too but keeps its layout.

## 2. Token architecture

All tokens defined once on `:root` (light values); dark values override under `body.m3-dark` and under `@media (prefers-color-scheme: dark)` guarded by `body:not(.m3-light)`. A toggle icon-button in the gallery header switches `m3-dark`/`m3-light` classes and persists to `localStorage`. Inline styles reference tokens via `var()` (valid in `style=""` attributes), which is what makes dark mode a token flip instead of 7,859 edits.

Prefix: `--m3-*` (short form of `--md-sys-color-*`).

### 2.1 Color roles — sage light / dark

| Role | Light | Dark |
|---|---|---|
| primary | `#516445` | `#b8cda8` |
| on-primary | `#ffffff` | `#24351a` |
| primary-container | `#d4e9c2` | `#3a4c2f` |
| on-primary-container | `#0f1f07` | `#d4e9c2` |
| inverse-primary | `#b8cda8` | `#516445` |
| secondary | `#55624c` | `#bdcbb0` |
| on-secondary | `#ffffff` | `#283420` |
| secondary-container | `#d9e7cb` | `#3e4a35` |
| on-secondary-container | `#131f0d` | `#d9e7cb` |
| tertiary (teal accent) | `#386666` | `#a0cfcf` |
| on-tertiary | `#ffffff` | `#003738` |
| tertiary-container | `#bbebec` | `#1e4e4e` |
| on-tertiary-container | `#002020` | `#bbebec` |
| error | `#ba1a1a` | `#ffb4ab` |
| on-error | `#ffffff` | `#690005` |
| error-container | `#ffdad6` | `#93000a` |
| on-error-container | `#410002` | `#ffdad6` |
| surface | `#fafaf3` | `#121410` |
| surface-dim | `#dadad4` | `#121410` |
| surface-container-lowest | `#ffffff` | `#0d0f0b` |
| surface-container-low | `#f4f4ed` | `#1a1c18` |
| surface-container | `#eeeee7` | `#1e201c` |
| surface-container-high | `#e8e9e2` | `#292b26` |
| surface-container-highest | `#e3e3dc` | `#343531` |
| on-surface | `#1a1c18` | `#e3e3dc` |
| on-surface-variant | `#43483e` | `#c3c8bb` |
| outline | `#74796d` | `#8d9286` |
| outline-variant | `#c3c8bb` | `#43483e` |
| inverse-surface | `#2f312d` | `#e3e3dc` |
| inverse-on-surface | `#f1f1ea` | `#2f312d` |
| scrim | `#000000` @32% | same (up to 50%) |
| shadow | `#000000` | `#000000` |

Custom semantic roles (M3 "extended colors" — M3 has no warning/success; NirmAI needs both):

| Role | Light | Dark |
|---|---|---|
| success | `#38693c` | `#9ed49c` |
| on-success | `#ffffff` | `#023910` |
| success-container | `#b9f0b7` | `#205026` |
| on-success-container | `#002106` | `#b9f0b7` |
| warning | `#785a0b` | `#eabf6e` |
| on-warning | `#ffffff` | `#402d00` |
| warning-container | `#ffdf9e` | `#5c4300` |
| on-warning-container | `#261a00` | `#ffdf9e` |

### 2.2 Shape / elevation / state / motion tokens

- Shape: `xs 4px · sm 8px · md 12px · lg 16px · xl 28px · full 9999px`.
- Elevation shadows (levels 1–3 as CSS strings from research §4); depth primarily via the surface-container ladder, shadows only on genuinely floating things (FAB, menus, dialogs, sheets).
- State layers: hover 8% / focus 10% / pressed 10% of the on-color via `color-mix`; disabled = container 12%, content 38%.
- Motion: emphasized-decelerate `cubic-bezier(.05,.7,.1,1)` (enter), emphasized-accelerate `(.3,0,.8,.15)` (exit), standard `(.2,0,0,1)`; durations 50–600ms; exits faster than entries; `prefers-reduced-motion` already respected — keep those blocks.

## 3. Property-aware color remap (the core migration)

A single hex often plays two roles (e.g. `#F4F3EC` = card background AND text on green buttons), so the mechanical remap keys on **CSS property + hex**, not hex alone. Executed by a Node script over the whole file (inline styles + `<style>` block), reporting any unmapped property/hex pair for manual triage. `bg` = background/background-color/gradient stops/fill; `fg` = color; `bd` = border/outline/box-shadow-ring colors.

| Legacy hex (count) | as bg → | as fg → | as bd → |
|---|---|---|---|
| `#E9E7DE` (217) page cream | surface | surface-container-high (rare) | outline-variant |
| `#F4F3EC` (951) | surface-container-low | on-primary | outline-variant |
| `#FFFFFF/#FFF` (1482) | surface-container-lowest | on-primary | surface-container-lowest |
| `#F7F8F2 #F0EEE3 #EFEDE3 #ECEBE2 #EDECE1 #FAF9F1` | surface-container | — | outline-variant |
| `#20241C` (839) ink | inverse-surface | on-surface | on-surface |
| `#1D201A #181C14 #090814` | inverse-surface | on-surface | — |
| `#39442F` (1100) forest | primary | primary | primary |
| `#2E3826 #2E3726` (hover forest) | primary | primary | primary |
| `#7E9270` (1127) sage | primary | primary | primary |
| `#AFC2A0` (119) light sage | secondary-container | inverse-primary | primary |
| `#BECFB0 #C9CDBB` | secondary-container | — | outline-variant |
| `#EDF1E7 #EDF0E7 #E2E9D8` soft sage tint | secondary-container | — | outline-variant |
| `#5A6D4B #57694A` deep sage | primary | primary | primary |
| `#5A6052 #5A5F52 #6B7263 #6B7064 #6B7263 #454B3C` muted text | surface-container-highest | on-surface-variant | outline |
| `#8A8E80` | — | outline | outline |
| `#DDDBCE #E4E2D6 #D8D5C8 #E0DED1 #CFCDBE #E6E6E6 #F2F2F2 #CCC` hairlines/tracks | surface-container-highest | outline | outline-variant |
| `#B0402E #B5543B` error red | error | error | error |
| `#ED9DA0` pale red | error-container | error (dark-context) | error-container |
| `#B07A24 #C9A14A` gold | warning | warning | warning |
| `#3E7A52` success green | success | success | success |
| `rgba(41,45,35,α)` shadows | → elevation tokens (see §4 cards) | | |
| `rgba(32,36,28,.18)` | scrim/border → `color-mix(outline 40%)` | | |
| `rgba(126,146,112,α)` focus rings | → `color-mix(in srgb, var(--m3-primary) N%, transparent)` | | |

Long tail (~200 rare hexes): classified by the script into the nearest role by HCT hue/tone bucket; photos/illustration fills and true blacks in camera overlays are left as-is (scrim contexts). Every substitution and every skip is logged.

## 4. Component conversions

Applied via an appended cascade-winning CSS layer (the file already uses this pattern) + targeted class edits. Radius normalization map (blanket, with exclusions): `6,7→8` · `9,10,11→12` · `14,16,17,18→16` · `20,22→16` (cards) · sheet tops `22px 22px 0 0→28px 28px 0 0` · keep `99/999px, 50%, 54px` (54 = phone bezel).

- **Buttons** (`pk-btn`, `.cm-` CTA rows, etc.): full-pill radius, filled = primary/on-primary, height ≥48 (glove-friendly per UX research; M3 min 40), label 14px/600, state layers on hover/press, no giant drop shadows (elevation 0, hover 1). Emphasis ladder: one filled per screen context; `pk-btn2`-style secondaries → **tonal** (secondary-container); tertiary actions → **outlined** (1px outline) or text.
- **Cards**: white cards → surface-container-lowest with `1px outline-variant` border **or** elevation-1 shadow (elevated cards on surface-container-low) — current `0 12px 30px` M2-style shadows replaced by M3 elevation-1 everywhere non-floating.
- **Text fields / OTP boxes**: filled variant — surface-container-highest fill, 4px top corners, 1px bottom line on-surface-variant → 2px primary on focus; OTP boxes stay per-digit but adopt the same fill + primary focus ring; caret primary.
- **Bottom navigation**: 80px bar on surface-container; active destination gets the 64×32 secondary-container pill, on-secondary-container icon, label 12px/500; inactive on-surface-variant.
- **Top app bars**: title 22px (title-large), surface at rest.
- **Chips** (status pills, filters): height 32, **radius 8** (signature M3 — not pill), selected = secondary-container; status meaning via container roles: on-track secondary-container · attention warning-container · blocked error-container · funded/released success-container (+ icon + label, never color alone).
- **Dialogs**: radius 28, surface-container-high, elevation 3, 24px padding, text-button actions right-aligned (confirm rightmost). Money/sign-off confirms keep full ₹ figures (Indian grouping, canon).
- **Bottom sheets**: 28px top corners, surface-container-low, drag handle 32×4 on-surface-variant @40%.
- **Snackbars/toasts**: inverse-surface bg, inverse-on-surface text, inverse-primary action, radius 4, elevation 3.
- **FABs**: 56px, radius 16, primary-container/on-primary-container, elevation 3 — the only always-shadowed element.
- **Progress**: linear 4px primary on surface-container-highest track, rounded caps; milestone timeline nodes: completed = primary filled + check, current = primary ring, upcoming = outline-variant, rejected = error.
- **Switches/checkboxes/radios**: M3 geometry (switch 52×32, thumb 16→24; checkbox 18 r2; radio 20) where present.
- **Type scale nudge**: fractional sizes normalized (12.5→12, 11.5→11, 13.5→14, 10.5→11, 9.5→10, 14.5→14); headings pick up M3 title/headline weights & tracking via the CSS layer. Micro-copy sizes (8–11px) are conserved — these are dense 402px design-scale mocks; inflating them would break 253 fixed layouts.

## 5. Dark scheme specifics

- Never pure black: surface N6 `#121410`; depth = lighter containers (N4→N22), not shadows.
- Accents flip T40→T80 automatically via tokens; text = N90, not white; outlines get dimmer, not brighter.
- Photos/renders: `filter:brightness(.92)` in dark via one rule on media containers. Camera overlays already dark — scrim blacks left untouched.
- Toggle: M3 standard icon-button in gallery header (sun/moon), `localStorage.nirmaiM3Theme`, default follows OS.

## 6. UX alignment (applied during conversion)

From the UX research, enforced wherever the pattern exists: one filled-primary action per screen (ladder below it) · Approve/Reject spatially separated, reject-with-reason · confirm dialogs only for irreversible money/sign-off (snackbar+Undo elsewhere) · 48px touch targets, ≥8px gaps · ₹ Indian grouping everywhere (canon) with tabular digits · unread/notification badges = error dot/pill · empty states keep constructive CTA · reduced-motion blocks preserved.

## 7. Execution order & verification

1. **Token layer**: inject `:root` light tokens + `body.m3-dark` overrides + shape/elevation/motion tokens + toggle button & script into gallery header.
2. **Remap script** (Node, scratchpad): property-aware hex→`var()` across the file; log + triage unmapped pairs.
3. **Component CSS layer**: appended M3 overrides (buttons, cards, fields, nav, chips, dialogs, sheets, snackbar, progress) + radius normalization + shadow→elevation swap.
4. **Targeted fixes**: whatever the visual pass flags (gradients, SVG fills, per-screen oddities).
5. **Verify**: `e2e-personas.js` 51/51 · zero console errors · Playwright screenshots of ~12 representative tiles in light AND dark (sign-in, OTP, consumer home, milestone/escrow, QC inbox, DPR, capturer, comments, dialogs/sheets tiles) · canon greps (₹8,61,000, no password inputs, no codenames).

Rollback: restore `scratchpad/NirmAI-Mobile-v3.pre-m3.html`.
