# Frescopa26 offline DA helpers

This bundle prepares copy checks, section metadata proposals, and read-only
preview links for Frescopa26. It has no network or write command. Native DA
authoring and the Contextual Experimentation UE extension remain unqualified.

Content belongs to **`markszulc/frescopa26`**. The GitHub fork
`ramboz/frescopa26` does not change the DA namespace or establish DA permissions.

| File | Purpose |
|---|---|
| [contract.md](contract.md) | Content model, source identity, format boundaries, and approval/readback gates |
| [Variant skill](skills/aem-content-variants/SKILL.md) | Draft the selected section's copy without changing unrelated content |
| [Configuration skill](skills/aem-experimentation-configure/SKILL.md) | Propose one independent section experiment at 50/50 |
| [Preview skill](skills/aem-experimentation-preview/SKILL.md) | Standalone, read-only forced-variant preview |
| [presenter.md](presenter.md) | Proposed copy and gated rehearsal instructions |
| `scripts/experimentation.py` | Python standard-library helper |
| `tests/` | Focused offline model, preservation, URL, and CLI checks |

## Run from the repository root

Python 3.10+ and the standard library are sufficient:

```sh
cd tools/coworker-experimentation
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -p 'test_*.py'

python3 scripts/experimentation.py validate-challenger \
  fixtures/cards-challenger.html --block cards-product \
  --baseline fixtures/index.plain.html \
  --baseline-format plain-sections --input-format delivered-main

python3 scripts/experimentation.py metadata \
  --page-url https://demo.example/index \
  --experiment-id house-pour-copy \
  --challenger-url https://demo.example/proposed-products-challenger \
  --sections fixtures/section-metadata.json --target products

python3 scripts/experimentation.py preview \
  --page-url https://demo.example/index \
  --assignment house-pour-copy/challenger-1
```

The `demo.example` references and snapshot keys are illustrative. They are
not saved DA resources, export paths, or authoritative section locators.
The metadata proposal explicitly includes `Experiment Status: Inactive`,
because v2 otherwise defaults to active. Activation needs a separate approval.

All successful outputs say `draft` and `backend_written: false`. Local
SHA-256 hashes identify supplied files; they are not DA versions, write
preconditions, or operation receipts.

## Fixture evidence and limits

`fixtures/index.plain.html` was downloaded read-only on 2026-11-04 from
`https://main--frescopa26--markszulc.aem.page/index.plain.html`. It preserves
the nine-section public baseline, including both heroes and all three
products. It is delivered raw markup, not an authenticated DA source read.
The unauthenticated raw DA content request returned `401`.

`fixtures/cards-challenger.html` is an offline single-section copy draft.
Only the Coffee card's heading and body differ. Its image references are
copied from the baseline; the fixture does not include those assets or prove
they load at a new delivery path.

The helper compares the complete selected section, retaining the product
section's eyebrow, h2 and intro, all image attributes, category, price/CTA
markup, and the other two cards. Equivalent merged/separate footer paragraphs
are accepted only when their attributes, inline markup, and price/CTA
interpretation remain unchanged. Other extra content is rejected.

Input formats must be explicit:

| Format | Accepted envelope |
|---|---|
| `plain-sections` | Raw direct section divs, as in `index.plain.html` |
| `delivered-main` | Exactly one raw `main` containing direct section divs; site head scripts/stylesheets are ignored, never copied or executed |
| `da-source` | Explicitly supplied block-div source body fragment, body, or body with main |

Active content inside the selected main, source tables, decorated HTML, missing
targets, and ambiguous targets stop validation. Hero validation permits only
the headline to change and protects its complete body. The `da-source` mode is
offline format support, not evidence that
the protected index source has that shape. Compare like representations:
source against a source baseline, delivered markup against a delivered
baseline. The helper does not normalize asset rewrites between those formats.

One challenger section is required. The v2 runtime consumes the first
`main > div` from delivered HTML. A passing source-fragment check still needs
an independent delivered readback; it does not prove that extraction works.

Paired preview requires `--paired-compatible`. This records a caller
assertion after runtime-specific evidence. The helper performs no browser,
native authoring, UE handshake, random-allocation, or runtime compatibility
test. Keep this bundle together; no skills have been installed.

The [integrated local proof](../experimentation-demo/README.md) runs this CLI
against the site's actual captured content, inactive metadata and exact served
exports. It exercises paired links through the pinned v2 engine and real block
decorators. Run `npm test` from the repository root for the combined checks.
This local evidence does not establish DA permissions, authenticated source
shape, extension enablement or a remote branch preview.
