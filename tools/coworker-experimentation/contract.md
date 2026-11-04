# Frescopa26 DA handoff

Status: **draft**. This contract covers offline preparation. It grants no
source-write, preview-publication, activation, or installation permission.

## Resource identity and content model

| Resource | Confirmed reference |
|---|---|
| DA namespace | `markszulc/frescopa26` |
| DA folder | `https://da.live/#/markszulc/frescopa26` |
| DA index editor | `https://da.live/canvas#/markszulc/frescopa26/index` |
| Source identity to confirm through an entitled read | org `markszulc`, repo `frescopa26`, path `/index.html` |
| Public delivery | `https://main--frescopa26--markszulc.aem.page/` |
| Delivered raw sections | `https://main--frescopa26--markszulc.aem.page/index.plain.html` |

A readable editor or public page proves reads only. The code actor `ramboz`
is not a DA identity. Do not derive the source path from a rendered pathname,
map it to a JCR locator, or infer write permission.

| Section | Supported copy change | Required preservation |
|---|---|---|
| First Atelier hero | Headline only in the two-row `hero`, identified by `Every morning, perfected.` | Complete body, picture and attributes, eyebrow, `/machines/atelier` CTA markup, section metadata, and the later cafe hero |
| Products | First Coffee card heading `The house pour` and description | Full `This week, for you` eyebrow, `New favourites, found for you.` h2 and intro; three `cards-product` rows; category, images/attributes, price/CTA markup; Tea and Juice cards; Hero/settings |

The first hero is the first section, not any `.hero`. The product target
requires the exact section h2 and a first Coffee card. These checks disambiguate
the offline model; a heading or section index alone is not write authority.
The source identity, complete baseline, and actual readback evidence establish
the native resource.

`blocks/cards-product/cards-product.js` converts category to a badge and
interprets either a merged price/CTA paragraph or separate paragraphs.
The helper accepts that specific paragraph reserialization while retaining
attributes, inline markup, and interpreted price/CTA. It does not permit a
new link, changed label, changed price, or unrelated text to pass as formatting.

## Pinned v2 section contract

Use the public
[`adobe/aem-experimentation` v2.0.0 contract](https://github.com/adobe/aem-experimentation/blob/1079f967fb2e5c54a7471de957ea6b880bb574d0/documentation/experiments.md#section-level-experiments).
Each independent section gets one control and one challenger at 50/50.
The control's `Section Metadata` contains `Experiment`, one
`Experiment Variants` reference, and `Experiment Split: 50`. The split lists
challenger percentages; control receives the remainder. Do not write `50,50`.
Offline proposals also set `Experiment Status: Inactive`.

At that pin, `replaceInner()` in
[`src/index.js`](https://github.com/adobe/aem-experimentation/blob/1079f967fb2e5c54a7471de957ea6b880bb574d0/src/index.js)
copies the first `main > div` inner HTML for a section replacement. The
challenger must deliver exactly one complete selected section. A whole-page
clone would select the wrong section.

Keep all experiment rows on control. A challenger can retain unrelated
section metadata but must not inherit page or section experiment rows.
Retain the product section's complete default content, not just its block.
Fragment manifests, audiences, personalization, Target, and a new renderer
are outside this bundle.

## Native binding remains gated

The actual source is DA. Its entitled connector and approved write scope
must be established before apply mode. The pending Contextual Experimentation
UE extension is a separate prerequisite; a code import does not enable it.

The official [Source API](https://docs.da.live/developers/api/source) documents
raw `GET /source/{org}/{repo}/{path}`. It documents `POST` file creation at
the path including its extension, with multipart form field `data`, returning
`201`. That response includes source and AEM URLs; it is not proof that those
URLs have been previewed or published.

For existing content, confirm the connector's update/overwrite semantics.
The Source page labels POST as creation, while the
[Version API](https://docs.da.live/developers/api/version) also describes
automatic snapshots on PUT updates. This helper implements neither method.
Version snapshots do not establish atomic ETag or conditional-write support.

Before each native write stage:

1. Resolve exact org/repo/path, actual target, supported operation and its
   effects. Independently read the complete saved baseline, including other
   sections and configuration. Missing or ambiguous records stop apply mode.
2. Show the exact destination, full affected document scope, proposed diff,
   expected preservation, and actual freshness/version evidence. Obtain
   explicit approval for that stage. Author approval does not authorize
   configuration, preview-publication, publishing, or activation.
3. Immediately re-read and apply the connector's supported version check.
   A changed baseline stops the write. A local file hash is not an atomic
   precondition. Do not invent concurrency support; stop if the route cannot
   safely honor the approved baseline.
4. Perform only the approved operation. Record actual returned identities
   and outcome. Independently read saved source, then verify actual rendered
   delivery and the complete preservation scope. Echoed payloads are not
   readback. Saving source and publishing delivery are distinct boundaries.

An uncertain outcome, timeout, missing record, or failed readback stops
further writes and reset. Do not retry blindly, fabricate receipts, reconstruct
historical records, or treat uncertainty as a no-write success.

## Stage handoff and preview

Every handoff identifies its state, source identity, baseline/readback
evidence, exact target, approved scope, preserved content, and unresolved
prerequisites. Drafts separate proposed names/paths from actual resources.
Only a supported write followed by independent saved-state and real-rendered
readback can produce a native `verified` handoff.

Authoring hands a verified challenger to configuration. Configuration hands
actual saved identities and allocation to standalone read-only preview.
Preview can also consume independently verified records; it never creates
missing configuration.

Forced assignment is simulated. Real rendering, configured allocation and
measured performance are separate evidence. Paired overrides require proof
on the exact integrated runtime. `--paired-compatible` records only the
caller's assertion and does not qualify native DA or UE behavior.

The [integrated local proof](../experimentation-demo/README.md) covers the exact
local paths and both proposed IDs with inactive metadata. The pinned engine's
query override can enable another inactive experiment, so use both assignments
when the other section must stay on control. Local checks do not establish that
those resources exist in DA.
