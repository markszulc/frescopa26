---
name: aem-content-variants
description: Create or update reusable AEM/Edge Delivery content variants, page copies, sections, blocks and fragments. Discover the site's source model and approved editable fields, preserve everything outside the requested change, and verify saved source plus real delivery. Does not implicitly configure experiments, publish or activate.
---

# Create reusable content variants

Use this workflow for ordinary content alternatives, experiment challengers,
audience/campaign experiences, or reusable fragments. Work with the supplied
site, pages and block types. Do not assume a particular brand, hero, card
count, destination, variant count or text-only change.

These instructions are self-contained. They grant no tools, permissions,
installation or host UI compatibility.

## Resolve the request and source model

Use supplied information first. Establish the missing decisions with focused
questions, one at a time:

- Actual authoring host, content org/site/repository, source resource and
  approved destination. Code ownership and delivery URLs are not authoring
  identity or write permission.
- Purpose: ordinary page copy, full-page experience, section, selected block,
  fragment, or update to an existing variant. An existing resource update
  needs an explicit target and baseline; creation must not overwrite it.
- Number of variants, requested differences and constraints. Text, links,
  CTA labels/destinations, images, block options, layout or structure may
  change when explicitly requested and supported by the site's block model.
- Project policy: naming, destination folder, localization, accessibility,
  assets, required metadata and protected business content. Apply these as
  inputs, not restrictions hardcoded into this skill.

Inspect the available entitled read/create/save/readback operations and
their effects. Do not invent tool names, APIs, credentials or a shell.
If source or write access is unavailable, prepare an honest no-write draft.
Creation wizards, duplicate actions and autosave may write before an explicit
Save. Obtain exact scope approval before entering a potentially mutating
flow; do not use it as read-only capability discovery.

Independently read the complete saved source, relevant metadata, selected
block's authoring model and decorator behavior. Resolve repeated blocks
unambiguously from source evidence; a generic class or DOM position alone
is not an authoritative writable locator.

Distinguish native authoring source, including table-shaped or body-fragment
source, from delivered plain sections and decorated/rendered HTML. Use a
supported transformation only after verifying its input/output contract.
Do not treat rendered markup as canonical source, assume a missing `main`,
or discard default section content to fit a validator.

## Choose the correct variant shape

For regular content copies, retain the requested page/fragment structure.
For runtime-swapped content, inspect the installed engine's actual version,
options, extraction and decoration behavior before choosing the export:

| Intended use | Required check |
|---|---|
| Full-page replacement | Complete delivered `main` and approved page content; verify which head metadata the engine does or does not replace |
| Section replacement | Exact selected section, including default text and unrelated section metadata; confirm the runtime's section extraction |
| Block/selector fragment | Exact target selector, stable matching source, expected inner/outer replacement and project redecoration callback |
| Redirect experience | Complete destination page and approved final URL; it is not an inline section substitute |
| Code-only experiment | No dummy content copies; return that content authoring is unnecessary and hand off the code requirement |

As a reference, `adobe/aem-experimentation` v2.0.0 commit
`1079f967fb2e5c54a7471de957ea6b880bb574d0` copies `main` inner HTML
for pages, the first `main > div` inner HTML for sections, and matching
selector inner HTML for fragments, with a first-section fallback.
For that section mode, deliver one complete selected section as the first
and only `main > div`. For fragments, prove the intended match and do not
rely on a fallback that silently substitutes unrelated content.
Other versions or integrations must be checked rather than assumed.

## Prepare and compare variants

1. Capture actual source identity, complete baseline, source representation
   and supported freshness/version evidence. A copied filename is not a
   saved resource; a local hash is not a native version token.
2. Propose destinations and exact edits for each requested variant. Compare
   the complete affected source, including siblings, default text, assets,
   links, metadata and existing routing/experiment configuration.
3. Keep all unrequested text, attributes, links, images, prices, behavior
   and other sections unchanged. When the request intentionally changes
   one of these, show that change explicitly instead of treating it as
   always immutable or silently broadening scope.
4. Preserve block authoring contracts, semantic structure, accessibility
   and asset handling. If a native editor reserializes markup, compare
   both preserved attributes/content and decorator behavior. Unsupported
   transformations stop the write.
5. Inspect inherited experiment, audience and campaign settings. Propose
   what to retain or remove for the intended purpose. Content-only
   section/fragment challengers must not inherit recursive experiment
   configuration. Do not silently duplicate live targeting or strip
   unrelated configuration from an ordinary page copy.
6. Show a per-variant diff, preservation evidence and unresolved
   prerequisites. Keep proposed paths and IDs visibly proposed.

## Save only within exact approval

Show the destination, full affected document scope, edits, preservation
requirements, actual freshness precondition and operation effects. Obtain
approval for that exact content operation. Registration, configuration,
preview-publication, site publishing and activation are separate boundaries.

Immediately before saving, re-read source and enforce the connector's
supported version check. Changed source stops the write. Do not invent
ETag, atomicity or overwrite guarantees; stop if the approved baseline
cannot be honored safely.

Perform only the approved operation. Record actual outcome/resource
identities and independently read saved source. An echoed write payload is
not readback. Then inspect real delivery, correct runtime extraction where
applicable, and the complete approved preservation scope. If making
delivery available requires preview-publication, obtain separate approval.

## Handoff and stops

A no-write proposal returns `status: draft`, `backend_written: false`,
purpose/scope, source/baseline evidence, proposed destinations, per-variant
changes, preserved values and unresolved prerequisites.

Only a confirmed native save and independent saved-state plus real-rendered
readback can yield a `verified` content handoff. Include actual identities,
approved scope, observed output and evidence; distinguish saved-only state
from delivery-verified state.

Missing records, ambiguous targets, changed baselines, unsupported
transforms, failed readback or an unknown outcome stop further writes.
Do not retry blindly, create duplicates, fabricate receipts, reconstruct
historical state or label an uncertain write as a no-write draft.
Experiment configuration, code deployment and activation are not implicit
parts of content authoring.
