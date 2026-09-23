<!-- stardust:provenance
  writtenBy: stardust:extract
  writtenAt: 2026-09-23T14:40:00Z
  origin: https://of1--frescopa26--markszulc.aem.page
  readArtifacts:
    - stardust/current/pages/index.json
    - stardust/current/pages/machines.json
    - stardust/current/pages/beverages.json
    - stardust/current/_brand-extraction.json
  mode: descriptive (current state)
-->
# Product

<!-- impeccable:product-schema 1 -->

## Platform

web (AEM Edge Delivery Services; DA-authored content)

## Users

_provenance: inferred. Basis: the hero and product copy address home coffee drinkers ("your mornings", "a 9am seminar or a 2am essay crunch"), and the machines page speaks to both hands-off and hands-on brewers.

- Busy home drinkers who want café-quality coffee without effort (bean-to-cup, the Atelier).
- Ritual-minded enthusiasts who want to "be the barista" (espresso, filter).
- Tea and cold-pressed juice drinkers shopping the wider beverage range.
- Students and young professionals on a budget ("without the barista price tag").

## Product Purpose

Fréscopa sells coffee machines, and the beverages to put in them: coffee blends, tea and cold-pressed juice. It also runs cafés. The lead product is **the Atelier**, a bean-to-cup machine that "learns what you love, softens or sharpens to match your mood" by building a taste profile, reading your calendar, and reordering beans before you run out.

## Positioning

"Every morning, perfected." Barista craft kept warm by a little intelligence. Great coffee without the barista price tag, positioned between premium craft and everyday convenience. Machine prices range from $179 (the Carafe) to $2,199 (the Atelier).

## Capabilities and Constraints

- Machine families: bean-to-cup (Atelier $2,199, Atelier Mini $799), espresso (Barista $899, Everyday $499), filter (Slow Pour $279) and cold brew (Carafe $179).
- Beverages: coffee (from $10, 10 blends), tea (from $9, 10 blends) and cold-press juice (from $5.50, 25 pressings).
- Atelier features: taste-profile learning, mood/calendar-aware brewing and automatic bean reorders.
- Sustainability: compostable pods, plastic-free refills, self-reordering and grounds for the garden.
- Cafés double as showrooms ("Every Atelier begins at the Fréscopa Café").
- Newsletter sign-up in the footer; account, search and cart in the header.

## Brand Commitments

- **Register:** `brand` (marketing/commerce: photo heroes, narrative copy, product listings).
- **Personality:** _provenance: inferred. Warm, sensory, quietly confident, gently witty ("It reads the room. And the calendar.").
- **Anti-references:** _provenance: inferred. Cold tech/appliance aesthetics, loud discount retail, and sterile white product shots.

## Evidence on Hand

- `stardust/current/pages/{index,machines,beverages}.json` + `.html`: live-rendered records.
- `stardust/current/assets/screenshots/*.png`: full-page captures.
- `stardust/current/_brand-extraction.json`, `_computed-styles.json`: brand surface and style census.
- `stardust/current/assets/logo.svg`, `assets/favicon.ico`.
- `styles/brand.css`: the deployed OKLCH token layer.

## Product Principles

_provenance: inferred. Basis: recurring copy themes.

1. **Effortless over effortful.** The machine does the work ("without you lifting a finger").
2. **Personal, not generic.** It learns taste, mood and schedule.
3. **Craft is kept, not replaced.** "Barista craft, kept warm by a little intelligence."
4. **Nothing wasted.** Sustainability is part of the product, not a footnote.

## Accessibility & Inclusion

- Most content photos carry empty `alt` text (see brand-review tension `T-img-alt-empty`).
- Burgundy on paper and ink on paper both meet WCAG AA comfortably.
