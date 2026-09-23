<!-- stardust:provenance
  writtenBy: stardust:extract
  writtenAt: 2026-09-23T14:40:00Z
  origin: https://of1--frescopa26--markszulc.aem.page
  readArtifacts:
    - stardust/current/_brand-extraction.json
    - stardust/current/_computed-styles.json
    - stardust/current/pages/index.json
    - stardust/current/pages/machines.json
    - stardust/current/pages/beverages.json
    - styles/brand.css
  synthesizedInputs: []
  mode: descriptive (current state)
-->
---
name: Fréscopa
description: Warm mornings, made effortless — coffee, tea, cold-pressed juice and the machines that make them sing.
colors:
  burgundy: "oklch(34% 0.093 25deg)"
  burgundy-deep: "oklch(27.5% 0.082 26deg)"
  terracotta: "oklch(60.5% 0.116 44deg)"
  terracotta-deep: "oklch(51.5% 0.108 40deg)"
  amber: "oklch(79% 0.128 74deg)"
  amber-soft: "oklch(86.5% 0.083 80deg)"
  teal: "oklch(55% 0.05 205deg)"
  paper: "oklch(97% 0.010 82deg)"
  paper-2: "oklch(94.8% 0.015 78deg)"
  paper-3: "oklch(91.8% 0.020 74deg)"
  sand: "oklch(88.4% 0.025 71deg)"
  line: "oklch(85.5% 0.018 68deg)"
  ink: "oklch(26.2% 0.021 52deg)"
  ink-soft: "oklch(43% 0.022 52deg)"
  charcoal: "oklch(22.2% 0.016 52deg)"
  charcoal-2: "oklch(28.2% 0.020 50deg)"
  line-dark: "oklch(40% 0.020 55deg)"
  cream: "oklch(94.5% 0.016 80deg)"
  cream-soft: "oklch(79.5% 0.021 78deg)"
typography:
  display:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.9rem, 1.7rem + 4.6vw, 5.4rem)"
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 1.3rem + 2vw, 2.8rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h3:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 1.25rem + 1.4vw, 2.3rem)"
    fontWeight: 800
    lineHeight: 1.15
  h4:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.08rem + 0.7vw, 1.6rem)"
    fontWeight: 800
    lineHeight: 1.15
  body-lg:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 0.98rem + 0.5vw, 1.3125rem)"
    fontWeight: 400
    lineHeight: 1.62
  body:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
  eyebrow:
    fontFamily: "Hanken Grotesk, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.2em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "22px"
  xl: "32px"
  pill: "999px"
spacing:
  3xs: "0.25rem"
  2xs: "0.5rem"
  xs: "0.75rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2.5rem"
  xl: "4rem"
  2xl: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "{colors.terracotta-deep}"
  button-ghost:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-ghost-hover:
    textColor: "{colors.burgundy}"
  button-on-dark:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.burgundy}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "24px"
  chip:
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  chip-active:
    backgroundColor: "{colors.burgundy}"
    textColor: "{colors.cream}"
---

# Design System: Fréscopa (current state)

## Overview

**Creative North Star: "The Morning Kitchen Table"**

Fréscopa reads like a sunlit kitchen at 8am: warm paper grounds, heavy burgundy grotesk headlines, and photography of steam, wood and stone. The system is restrained. There is one action colour (terracotta), one display voice (Schibsted Grotesk 800 at tight tracking), and a small set of soft, rounded containers. Charcoal bands break the warmth at moments of emphasis, such as the café invitation and the closing call to action.

The site is photography-led and commerce-adjacent. Every section pairs an uppercase terracotta eyebrow with a burgundy headline and a short, sensory paragraph in warm ink-soft. Products appear as rounded cards with a price and a quiet text link rather than a loud button.

**Key Characteristics:**
- Warm paper grounds with burgundy display type
- Terracotta pill CTAs as the single action colour
- Heavy (800) grotesk headlines, tight tracking
- Soft 32px cards with low, warm shadows
- Photography-led: sunlit kitchens, steam, wood and stone
- Charcoal bands for moments of emphasis

## Colors

All colour tokens are authored in OKLCH in `styles/brand.css`; hex values in `DESIGN.json` are sRGB approximations.

### Primary
- **Burgundy** (`--burgundy`, #5f201e): every heading, the active chip, the text of on-dark buttons. **Burgundy Deep** (#481311) is defined but never measured in use.

### Secondary
- **Terracotta** (`--terracotta`, #ba6945): the action colour. It fills pill CTAs and is used for eyebrows, inline links and headline emphasis ("without the barista price tag"). Hover darkens to **Terracotta Deep** (#9a4f35).
- **Amber** (`--amber`, #ebad54): the highlight on dark ("haven't met yet", footer column heads).
- **Teal** (`--teal`, #4d7a7f): defined, not observed on the crawled pages.

### Neutral
- **Paper** (#f8f5ee) is the page background; **Paper 2** (#f3ede3) and **Paper 3** (#ece2d6) are alternating section bands; **Sand** (#e4d6c7) and **Line** (#d8cdc3) are dividers and chip borders.
- **Ink** (#2d221b) is primary text; **Ink Soft** (#5a4d45) is body copy, the most-measured text colour.
- **Charcoal** (#211914) is used for dark bands and the footer, with **Cream** (#f3ece1) and **Cream Soft** (#c4bbad) text.

### Named Rules
**The One Action Rule.** Terracotta is the only filled-button colour on light grounds; on dark bands the primary button inverts to cream with burgundy text.

## Typography

**Display:** Schibsted Grotesk 700/800, self-hosted.
**Body:** Hanken Grotesk 400–700, self-hosted.

### Hierarchy
- **H1** 800, fluid `clamp(2.9rem → 5.4rem)` (86px at 1440), line-height 1.03, tracking -0.02em. Hero only.
- **H2** 800 (700 on beverages), `clamp(1.8rem → 2.8rem)` (45px at 1440), line-height 1.15.
- **H3/H4** 800, 25.6px at 1440, used for card titles.
- **Body** 17px / 1.62; **body-lg** 21px for section ledes.
- **Eyebrow** 12px 600 uppercase, 0.2em tracking, terracotta.

The scale is fluid and **not modular**: 44.8 / 36.8 / 25.6 / 24 have inconsistent ratios.

## Layout

The content column is 1120px (1320 wide, 760 narrow), with a fluid `clamp(1.25rem → 3rem)` gutter and 72px vertical section rhythm. The dominant layout is two columns (text + image or text + card) that alternate across bands. Listings use two- or three-up card grids. The nav is 72px, transparent over paper, with centred links and icon actions on the right.

## Elevation & Depth

Surfaces are mostly flat, separated by alternating paper bands. Cards lift on a warm, low shadow.

### Shadow Vocabulary
- `shadow-sm`: small UI resting lift.
- `shadow-md`: cards and product tiles (9 measured uses).
- `shadow-lg`: feature panels.

## Shapes

The vocabulary is small: **999px pills** for buttons, chips and inputs (28 uses), **32px** for cards and feature images (9), **22px** for secondary cards, **14px/11px** for inner panels, and 50% for icon buttons.

## Components

### Buttons
- **Primary**: terracotta fill, cream text, pill, 12×22px padding, 600 weight, often with a trailing "→". Hover goes to terracotta-deep.
- **Ghost / chip**: transparent with a line border and ink-soft text. Hover moves text and border to burgundy.
- **On dark**: cream fill, burgundy text.

### Chips
Pill chips work as filters and tabs ("All machines / Bean-to-cup / Espresso…", "Weekday / Slow Sunday / After dinner"). The active chip is filled burgundy with cream text.

### Cards / Containers
- **Product card**: 32px radius, image top, eyebrow, H3, one-line description, bold price, and a terracotta text link ("Add to cart →", "Join the list→").
- **Feature card**: a large two-column card with image left and copy, bullets and a primary CTA on the right.

### Inputs / Fields
Footer email input: a pill on a charcoal ground with a line-dark border and a terracotta "Sign up" pill button.

### Navigation
The header has a logotype on the left, centred text links (The Atelier, Machines, Beverages, Café, Journal) and search/account/cart icons. The active link is underlined in terracotta.

### Taste profile (signature component)
A radar chart card ("The weekday cup") with chip tabs, and a mood calendar card. These are the Atelier's "it learns you" story made visual.

## Do's and Don'ts

### Do:
- Do pair every section headline with an uppercase terracotta eyebrow.
- Do keep headlines burgundy on light grounds and cream on charcoal.
- Do let photography carry warmth; keep UI chrome quiet.

### Don't:
- Don't introduce a second filled-button colour on light grounds.
- Don't use sharp corners; everything is pill or ≥14px.
- Don't use cool greys; neutrals are warm (hue 50–82).
