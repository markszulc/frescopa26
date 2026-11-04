---
name: aem-experimentation-configure
description: Propose one inactive Frescopa DA section experiment with one challenger at 50/50. Native configuration requires a verified single-section challenger, exact approval, fresh source and independent saved-state/readback evidence. Does not author copy or activate traffic.
---

# Configure one independent section

Read [contract.md](../../contract.md). The offline helper does not write
source or establish native DA/UE access.

An executable handoff requires actual DA org/repo/path, an unambiguous
section target, a verified saved challenger and real delivered URL, first
`main > div` extraction evidence, current baseline/version evidence, and
exact approval. Do not derive author identity from a delivery URL.

Use separate experiment identities for the first Atelier hero and products.
For products, preserve the complete hero content/configuration, full product
section heading/intro, all images, categories, price/CTA, and Tea/Juice cards.

## Offline metadata proposal

The pinned v2 control section uses:

| Key | Proposed value |
|---|---|
| `Experiment` | New approved identity |
| `Experiment Variants` | One actual single-section challenger delivery reference |
| `Experiment Split` | `50`, the challenger share; control receives 50 |
| `Experiment Status` | `Inactive`, pending a separate activation approval |

Never put control in the variant list or serialize `50,50` for one challenger.
Do not put experiment rows on the challenger or use page metadata.

From the bundle root:

```sh
python3 scripts/experimentation.py metadata \
  --page-url https://demo.example/index \
  --experiment-id house-pour-copy \
  --challenger-url https://demo.example/proposed-products-challenger \
  --sections fixtures/section-metadata.json --target products
```

These are illustrative URLs and snapshot keys, not actual DA resources.
The helper requires one delivery origin, distinct paths, and no
query/fragment-dependent challenger. It copies the local snapshot, changes
only the selected metadata entry, rejects pre-existing experiment rows on
that target, and rejects duplicate experiment IDs across sections.
Every output stays `draft` with `backend_written: false`.

## Native save gate

Confirm the supported DA connector operation and whether it saves source,
previews, publishes, or activates. Runtime APIs such as `loadEager` and
`window.hlx.experiments` are not experiment authoring endpoints.

Independently read saved source. Show the exact target and full affected
document diff, challenger evidence, preserved values and freshness evidence
for approval. Re-read and enforce the supported version check before saving.
Stop if state changes or the operation's effects are unknown.

After a confirmed save, independently read configuration and real rendered
delivery. Verify the actual identities, challenger, inactive state, 50/50
allocation, and unchanged hero/page scope. Only then hand verified records
to standalone preview. Publishing and activation remain separate boundaries.

A timeout, missing record or failed readback stops further writes. Do not
retry blindly or label an uncertain write as a no-write draft.
