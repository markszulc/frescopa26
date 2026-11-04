---
name: aem-content-variants
description: Prepare a Frescopa26 section challenger in DA/Experience Workspace. Change only the first Atelier Hero headline or first Coffee card heading/body, preserve the complete selected section, and require exact approval, fresh source and independent readback before native writes. Does not configure experiments or activate traffic.
---

# Prepare one Frescopa26 content challenger

Use this workflow for a content proposal or an explicitly approved native
authoring operation. These instructions are self-contained. They do not
grant tools, permissions, installation, or host UI compatibility.

## Confirm the resource and available operations

The content namespace is DA org `markszulc`, site `frescopa26`. The expected
homepage source is `/index.html`; independently confirm that identity
through an entitled source read. The editor reference is
`https://da.live/canvas#/markszulc/frescopa26/index`, and the public delivery
reference is `https://main--frescopa26--markszulc.aem.page/`.

The GitHub actor or fork owner is not a DA identity. Do not derive a source
locator from a rendered URL or invent a JCR path. A readable page does not
prove create, write, preview, or publish permission.

Inspect the tools actually available in this conversation. Establish
their supported read/create/save/readback operations and effects. Do not
invent tool names, extract credentials, or assume a shell is available.
If the entitled route is unavailable, prepare a draft only.

## Supported content changes

Choose exactly one target. Missing, changed, ambiguous or unsupported
baseline content stops the workflow:

| Target | Allowed change | Preserve |
|---|---|---|
| First Atelier Hero | Headline only, originally `Every morning, perfected.` | Complete body, image and attributes, eyebrow `Meet the Atelier`, CTA markup and `/machines/atelier`, section metadata, later cafe Hero |
| First Coffee product | Heading `The house pour` and its description only | Complete `This week, for you` eyebrow, `New favourites, found for you.` h2 and intro, all three `cards-product` rows, category, images and attributes, prices and CTA markup/behavior, Tea and Juice cards, Hero and its configuration |

The first Hero has two raw rows: image and rich-text content. Its text cell
contains eyebrow, h1, body and CTA. Do not target every `.hero` or change
the Hero body.

The product block is authored static content. Its decorator makes the
category a badge and accepts merged or separate price/CTA paragraphs.
Paragraph reserialization is allowed only if paragraph attributes, inline
markup, actual price, CTA label and behavior remain unchanged. Preserve
unrelated text, links and attributes; do not use formatting as permission
to change them.

## Prepare the challenger

1. Independently read the complete saved source baseline, including other
   sections and experiment settings. Record the actual org/site/path,
   supported version/freshness evidence, and exact selected section.
2. State the actual input representation: DA source body fragment/body,
   delivered plain sections, or delivered `main`-wrapped HTML. Do not
   interpret source fragments as if they already contained `main`.
   Unsupported source tables or decorated markup require a qualified
   transformation before continuing. Never silently validate the whole
   page or strip its default section content.
3. Prepare one complete content-only selected section. Keep unrelated
   section metadata, but do not inherit page or section experiment rows.
   Control configuration remains on control.
4. Compare the candidate against the entire selected baseline section.
   Only the allowed text fields may differ. The product h2 and intro,
   categories, three cards, prices, CTA and image attributes must survive.
   Preserve the rest of the original source document unchanged.
5. Keep destination names, paths and IDs visibly proposed until created
   and independently read back. Do not overwrite control or an existing
   challenger to bypass a missing-record stop.

The supported public engine reference is `adobe/aem-experimentation`
v2.0.0, commit `1079f967fb2e5c54a7471de957ea6b880bb574d0`.
Its section replacement reads the first delivered `main > div` inner HTML.
Require the challenger delivery to contain exactly one complete section
as that first and only direct `main > div`. A whole-page copy is unsuitable
for this section workflow. A source-only check does not prove delivery.

## Native save gate

Show the exact destination, full affected document diff, approved text,
preserved values, supported freshness precondition, and operation effects.
Obtain explicit approval for this specific authoring operation.
Registration approval, prior proposals, or another stage's approval do
not authorize a content write.

Immediately before saving, re-read source and enforce the connector's
supported version check. Changed source stops the write. A local hash or
snapshot is not proof of atomic conditional-write support. Do not invent
ETags or overwrite semantics; stop if the approved baseline cannot be
honored safely.

Perform only the approved operation. Record actual outcome/resource
identities, independently read saved source, and compare the complete
preservation scope. An echoed write payload is not readback. Inspect real
delivered challenger extraction and unchanged control content/settings
through available read-only tools. Any preview-publication or site
publishing operation needs a separate exact approval.

No experiment configuration, activation, permission change, connector
installation, audience personalization, Target operation, new renderer,
or assumption of Universal Editor support is part of this skill.

## Output and stop conditions

For a no-write proposal, return `status: draft`, `backend_written: false`,
exact proposed copy, actual baseline identity/evidence, proposed
destination, preserved values and unresolved prerequisites. These flags
describe the current operation, not a fictional saved resource.

Only a confirmed native save plus independent saved-state and real
rendered readback can yield a `verified` authoring handoff. Include the
actual resource, approved scope, operation outcome and both readbacks.
The next configuration skill must still obtain its own approval.

Missing records, stale state, unsupported shapes, failed readback or an
unknown write outcome stop further writes. Do not retry blindly, create
duplicates, fabricate receipts, reconstruct historical records, or label
an uncertain write as a no-write draft.
