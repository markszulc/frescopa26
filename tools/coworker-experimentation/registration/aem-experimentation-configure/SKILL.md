---
name: aem-experimentation-configure
description: Prepare one inactive Frescopa26 DA section experiment with one control and one challenger at 50/50. Require verified challenger delivery, exact approval, fresh source and independent readback before native configuration. Does not author copy, publish site content or activate traffic.
---

# Propose one independent section experiment

These instructions are self-contained. Registration does not supply a
connector, install the engine or qualify DA UI compatibility.

## Resolve inputs

Content belongs to DA org `markszulc`, site `frescopa26`. Independently
confirm the expected homepage source `/index.html`, real delivery URL,
unambiguous target and available entitled operations. Do not use the code
fork owner as a DA identity or derive source paths from delivery URLs.

Require an actual saved challenger, its approved copy and source identity,
independent saved-state readback, and real delivered extraction evidence.
Proposed paths, public page access and an echoed payload are insufficient.
A single-section challenger must deliver exactly one direct `main > div`:
the pinned v2 section renderer copies that first section's inner HTML.
Do not use a whole-page clone.

Use the first Atelier Hero section or the product section
`New favourites, found for you.`. Use distinct experiment IDs. Hero changes
are headline-only; retain its complete body. Product changes are limited
to the first Coffee card heading/body. Preserve the complete section h2,
intro and eyebrow, all three cards, categories, images/attributes,
prices/CTA and the Hero/configuration. Do not change content in this skill.

The host is DA/Experience Workspace, without AEM Author or Universal
Editor. No SDK simulation setting proves a working host UI. Inspect
available tools; do not invent authoring endpoints from runtime methods
such as `loadEager` or `window.hlx.experiments`.

## Prepare inactive metadata

The public contract is
[`adobe/aem-experimentation` v2.0.0](https://github.com/adobe/aem-experimentation/blob/1079f967fb2e5c54a7471de957ea6b880bb574d0/documentation/experiments.md#section-level-experiments).
Prepare these rows in the selected control's `Section Metadata`:

| Key | Value |
|---|---|
| Experiment | Exact approved experiment identity |
| Experiment Variants | One verified challenger delivery URL |
| Experiment Split | `50` |
| Experiment Status | `Inactive` |

The split lists challenger percentages. One challenger at 50 leaves
50 for control. Do not write `50,50` or put a control URL in the variant
list. Inactive is explicit because the runtime otherwise defaults to
active. Activation is a separate operation outside this skill.

Require a distinct control/challenger path on the same approved delivery
origin, without query-dependent or fragment-dependent challenger
references. Confirm the connector's accepted metadata representation.
Keep experiment rows on control, never on the challenger or in page
metadata.

Reject existing experiment rows on the selected target, duplicate IDs
elsewhere in the document, missing records or ambiguous scope. Do not
replace an existing experiment as part of creating a new one.

## Native configuration gate

1. Independently read the complete current source and its actual
   freshness/version evidence. Distinguish DA raw source from delivered
   sections or `main`-wrapped HTML. Unsupported source formats require
   a qualified transformation; do not silently substitute whole-page
   behavior or infer a writable locator from a DOM selector.
2. Establish the supported save operation and whether it also previews,
   publishes or activates. Show the exact org/site/path, selected section,
   full affected document diff, challenger/readback evidence, inactive
   50/50 allocation and preservation scope.
3. Obtain exact approval for this configuration write. Authoring,
   registration and previous approvals do not transfer. Stop if the
   operation's effects are unknown or require unapproved coupled actions.
4. Immediately re-read and apply the connector's supported version check.
   Changed source stops the write. A local hash/snapshot is not an
   atomic precondition. Do not invent ETag or overwrite guarantees;
   stop if the approved baseline cannot be honored safely.
5. Perform only the approved operation. Capture actual returned identities
   and outcome, independently read the saved configuration, and verify
   every metadata value plus unchanged page/other-experiment scope.
6. Inspect real rendered configuration and challenger extraction.
   Preview-publication or site publishing requires its own separate
   approval. Hand actual verified records to read-only preview only
   after saved-state and rendered checks succeed.

## Output and stops

A no-write proposal returns `status: draft`, `backend_written: false`,
actual baseline identity, proposed metadata/destination, explicit 50/50
allocation, preservation evidence and unresolved prerequisites.
Proposed identities remain visibly proposed.

Only confirmed native configuration plus independent saved-state and
real rendered readback yields `verified`. Include actual IDs, locators,
approved scope, supported precondition, operation outcome and readbacks.

A timeout, missing record, failed readback or unknown outcome stops
further writes. Do not retry blindly, create replacement records,
fabricate receipts, reconstruct historical state, or call an uncertain
write a no-write draft.

No content editing, site publishing, activation, permissions,
installation, audience/Target personalization, new renderer or UI
implementation is part of this skill.
