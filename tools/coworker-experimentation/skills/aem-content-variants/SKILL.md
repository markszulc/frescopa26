---
name: aem-content-variants
description: Prepare a draft copy challenger for the first Frescopa Atelier hero or first Coffee product card, with complete selected-section preservation checks. Native DA authoring requires entitled operations, exact approval, freshness and independent readback. Does not configure or activate experiments.
---

# Prepare one Frescopa26 section challenger

Read [contract.md](../../contract.md). This portable bundle is not installed
or native-qualified. Content belongs to DA `markszulc/frescopa26`; the code
fork owner does not establish DA authentication.

## Supported scope

For `hero`, target the first two-row Atelier hero with headline
`Every morning, perfected.`. Edit only the headline. Keep the complete body, picture,
eyebrow, CTA markup and `/machines/atelier` destination. The cafe hero
lower on the page is a different target and is unsupported.

For `cards-product`, target `New favourites, found for you.` and its first
Coffee card, `The house pour`. Edit only that card's heading/body. Preserve
the full section eyebrow, h2 and intro, three product rows, categories,
images/attributes, price/CTA markup, Tea and Juice cards, and Hero/settings.
Do not change CTA labels. This is authored static content.

Keep the complete selected section in the challenger. Its delivered form
must have one and only one `main > div`, without experiment rows. Keep
unrelated section metadata. Do not strip the section's default content to
pass validation or export the whole homepage.

## Draft offline

Use [the proposed copy](../../presenter.md) or explicitly supplied copy.
Return `State: draft`, `backend_written: false`, exact proposed edits,
baseline identity/hash, preservation requirements, and unresolved native
prerequisites. Proposed paths and IDs must remain separate from actual ones.

From the bundle root:

```sh
python3 scripts/experimentation.py validate-challenger \
  fixtures/cards-challenger.html --block cards-product \
  --baseline fixtures/index.plain.html \
  --baseline-format plain-sections --input-format delivered-main
```

Both formats are required. `da-source` accepts explicitly supplied block-div
body content; it is not a fallback for arbitrary source markup. Tables,
decorated content, missing or ambiguous targets stop. Compare like source
representations. A source-fragment check still needs delivered readback.
Local hashes are not DA version tokens.

## Native authoring gate

Establish the entitled connector, actual DA org/repo/path, approved write
scope and supported create/update effects. Independently read the complete
baseline and its actual freshness evidence. Stop if unavailable.

Show exact destination, full document diff and preservation evidence for
approval. Recheck supported freshness immediately before the approved save.
Keep configuration on control and avoid inheriting experiment rows.
Preview-publication or publishing requires its own approved operation.

Capture the actual outcome, independently read saved source, then inspect
real delivered challenger extraction and the unchanged control/page scope.
Only then hand a native `verified` challenger to configuration.

Missing records, changed baselines, unsupported concurrency checks, failed
readback and uncertain outcomes stop apply mode. Never retry an uncertain
write blindly, fabricate receipts, create replacement records, or reconstruct
historical state.
