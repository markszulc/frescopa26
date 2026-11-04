---
name: aem-experimentation-configure
description: Create, inspect or update AEM experimentation configuration across page, section and fragment scopes. Support multiple variants, allocation, labels, lifecycle, targeting, consent, conversion and resolution options supported by the installed engine, including audience/campaign experiences. Require exact approval and independent readback for writes.
---

# Configure reusable experimentation and experiences

Use this skill for supported AEM experimentation-engine configuration,
including experiment and audience/campaign experiences. Do not restrict the
site, block type, number of challengers, allocation or scope to an example.
These self-contained instructions do not grant tools, deploy code, register
connectors or establish host UI compatibility.

## Discover the actual contract

Resolve the authoring host, content identity, control page, exact target,
create/update intent, installed engine/version, project initialization
options and available entitled operations. Read the actual saved source,
configuration and referenced resources. Do not derive author paths from
rendered URLs or use runtime inspection objects as write APIs.
Determine side effects before entering any creation or copy flow: some
interfaces may create resources before Save. Such entry requires upfront
scope approval and is not read-only discovery.

Use documentation and implementation for the installed version. Build a
capability map for each requested field: authoring representation, applicable
scope, parser/runtime behavior, required code integration, and readback
evidence. The catalogue below is a starting point, not an exhaustive
allowlist or permission to write an ignored property. Include verified
project extensions; flag unsupported or unverified combinations explicitly.

Useful public reference:
[`adobe/aem-experimentation` v2.0.0](https://github.com/adobe/aem-experimentation/tree/1079f967fb2e5c54a7471de957ea6b880bb574d0),
especially its `documentation/experiments.md`, `audiences.md`,
`campaigns.md`, `README.md` and `src/index.js`. Do not force this version
onto a different deployment.

## Choose scope and delivery

| Scope | Authoring and runtime requirements |
|---|---|
| Page | Page metadata for the installed namespaces; one page-level experiment where supported; complete main replacement or supported redirect |
| Section | Metadata on the exact selected section; independent identities; complete selected-section delivery with the runtime's verified extraction |
| Fragment/block | Published manifest and exact page/selector matching; selector stability before/after decoration; correct extraction and project redecoration |
| Code-only | Numeric challenger count where supported; existing deployed behavior for generated variant classes/keys; no fake content URL |

For the v2 reference, page replacement copies `main` inner HTML; section
replacement copies the first `main > div` inner HTML. Fragment replacement
looks for the configured selector before falling back to the first section.
Do not rely on an accidental fallback. A whole-page export is not a valid
section challenger. Inspect the resolved page before its section rules:
page-level audience/experiment/campaign replacement can change which
sections and configuration exist.

## Configuration catalogue

Use actual project prefixes rather than assuming these default labels.

| Capability | Default representation and checks |
|---|---|
| Identity and display | `Experiment`; `Experiment Label` where consumed; normalize IDs with the installed engine and detect collisions without confusing display labels with IDs |
| Content or code variants | `Experiment Variants`: ordered challenger references, or numeric code-only challenger count; control is separate, not an extra URL |
| Variant labels | `Experiment Variant Names` or manifest `Name` where supported; preserve order and use actual runtime variant keys such as `challenger-2`, not display labels, for forcing |
| Allocation | `Experiment Split`: ordered challenger percentages; omitted values use that version's default; control receives the remainder; support unequal/decimal shares and explicit zero-control designs |
| Status | `Experiment Status`; verify supported active/inactive values and current state; new proposals default inactive where supported, while updates preserve state unless a change is requested |
| Schedule | `Experiment Start Date` and `Experiment End Date`; validate ordering, explicit timezone and boundary behavior |
| Targeting | `Experiment Audience`/`Experiment Audiences`; refer only to actual registered audience predicates; verify OR semantics and use a separately implemented predicate for AND logic |
| Consent | `Experiment Requires Consent`; preserve policy and inspect the existing consent integration; do not grant consent or create a CMP integration through metadata |
| Resolution | `Experiment Resolution`: supported replacement or redirect behavior; verify scope and approved destination |
| Optimization | `Experiment Optimizing Target` where consumed; distinguish a parsed value from an implemented optimization policy or measured goal |
| Conversions | `Conversion Name` and the installed conversion/RUM integration; do not invent conversion events, analytics endpoints or reporting capability |
| Selector manifests | `Experiment Manifest`; exact supported schema including `Page`, `Experiment`, `Variant`, `Selector`, `Url`, `Split`, `Name` and supported shared properties |
| Audience experiences | `Audience: <name>` mappings, `Audience Manifest`, and `Audience Resolution` where supported; actual predicate definitions are project code, not metadata-created audiences |
| Campaign experiences | `Campaign: <name>` mappings, `Campaign Manifest`, `Campaign Audience`/`Campaign Audiences`, and `Campaign Resolution` where supported; inspect both the configured campaign parameter and `utm_campaign` |

Validate one split per challenger, finite percentages in [0, 100], sum at
most 100 and an explicit derived control share. If no split is requested,
show the engine's proposed default and all resulting shares. Do not pad,
truncate or silently fix an inconsistent list merely because a parser does.
Do not force 50/50 or limit every experiment to one challenger.

Verify every referenced content resource, delivered extraction, accepted
URL/origin handling and intended locale. The v2 reference reduces many
references to same-origin pathnames; a cross-origin URL is not proof that
the other origin's content will be fetched.

For manifests, verify schema, page filtering, selector cardinality,
variant order, grouping, shared values and actual published JSON response.
Do not assume query-selected sheets survive a runtime that fetches only
the pathname. Preserve unrelated rows and avoid overlapping targets.

## Separate authoring settings from code prerequisites

Inspect project options including `audiences`, `audiencesMetaTagPrefix`,
`audiencesQueryParameter`, `campaignsMetaTagPrefix`,
`campaignsQueryParameter`, `experimentsMetaTagPrefix`,
`experimentsQueryParameter`, `prodHost`, `isProd`, the actual redecoration
callback and `simulationUI`. Include storage/persistence settings only if
the installed version consumes them.

These are not all author-editable metadata. Missing predicates, code-only
behavior, conversion integration, host adapters or callbacks require a
separate reviewed code change, not fabricated metadata. No option
automatically installs a UI in a different host.

Verify documentation/source disagreements. At the v2 reference, section
metadata keys are hyphenated while some experiment properties expect
camelCase; multiword dates, labels and consent settings therefore need
scope-specific proof. The code calls `decorateFunction` despite a README
example using `decorationFunction`. A documented option is not verified
when the actual parser ignores it. Report that feature/scope as blocked
without silently dropping it or narrowing all other supported features.

Runtime outputs such as `selectedVariant`, `run`, `resolvedAudiences` and
`servedExperience` are readback evidence, not authoring inputs.

## Propose, approve, save and verify

1. Clarify only missing behavioral decisions, one question at a time.
   Read the complete current source/configuration and actual freshness
   evidence. For updates, identify exactly what changes and preserve
   every unrequested field, other experiment and content resource.
2. Show the complete proposed metadata/manifest diff, capability map,
   scope, identities, variant references, all derived allocations,
   lifecycle/targeting/consent effects and code prerequisites. A draft
   must expose unverified references rather than invent saved resources.
3. For a native write, require actual verified content references where
   needed and exact operation/resource approval. Explain whether save
   also previews, publishes or affects live targeting. Updating active
   configuration is a live-impacting change even without a status edit.
4. Re-read immediately before writing and enforce supported version
   checks. Changed state stops the write. Do not invent ETag/atomicity
   guarantees or treat local hashes as native preconditions.
5. Perform only the approved operation. Independently read saved
   configuration, manifest delivery and real runtime resolution.
   Verify each requested field, all shares, references, applicability
   and unchanged scope. Echoed payloads are not readback.
6. Publishing, activation or reactivation require separate explicit
   approval. Audience/campaign mappings may have no inactive state;
   never invent one. Keep them draft-only until their actual delivery
   effects and approved staging mechanism are understood.

Return no-write proposals as `status: draft`, `backend_written: false`,
with actual baseline evidence, proposed configuration, supported/blocked
features and unresolved prerequisites. Confirmed writes must report their
real outcome and distinguish saved-only from rendered-verified state.
Only independent saved-state plus real runtime/readback evidence earns
`verified`.

Missing records, ambiguous scope, unsupported fields, changed state,
failed readback or an unknown outcome stop the affected write. Do not
retry blindly, fabricate receipts, reconstruct historical state or
present an uncertain operation as a no-write success.
