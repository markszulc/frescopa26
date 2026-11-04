---
name: aem-experimentation-preview
description: Inspect actual saved Frescopa26 section experiments and prepare forced-variant preview links read-only. Require saved records and real rendered readback; paired isolation needs proof on the exact runtime. Does not create content/configuration, publish, activate or report measured results.
---

# Read-only Frescopa26 experiment preview

This skill is independent of authoring and configuration skills. It can
consume independently verified saved records. These self-contained
instructions grant no tools, permissions or host UI compatibility.

## Resolve actual saved state

Content belongs to DA org `markszulc`, site `frescopa26`. Independently
confirm the source identity (expected homepage `/index.html`), actual
delivery URL, target sections, distinct saved experiment IDs, supported
variant keys, verified challenger URLs and expected copy differences.
Do not derive source identity from the rendered pathname or GitHub owner.

Read through an entitled route actually available in this conversation.
Missing, stale, proposed-only or inaccessible records stop a usable
preview. Do not invent IDs, recover historical records, create
configuration, extract credentials or assume a local shell.

This skill is read-only. Never save source/configuration, trigger
preview-publication, publish site content, activate traffic, alter
permissions, install connectors, change browser storage or patch the
renderer. A tool whose side effects include a write is outside scope.

## Prepare safe visitor URLs

Support only `control` and `challenger-1`, with one explicit assignment
per distinct experiment. For a verified compatible runtime the repeated
parameter form is:

```text
?experiment=<actual-hero-id>/control&experiment=<actual-products-id>/challenger-1
```

Replace stale `experiment` and `experiment-variant` controls. Preserve
only reviewed `lang`, `locale`, `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term`, and a simple non-secret section fragment.
Repeated supported unrelated labels may remain. Reject credentials,
unknown controls, unsafe fragments and capability-bearing values
disguised as language/UTM labels.

Do not copy an editor/iframe URL into visitor QA. Reject consent
overrides such as `consent=disabled`, quick-edit or controller flags,
tokens and other capability query controls.

Allow exactly one existing `rum=off` only on a server independently
verified to be the intended loopback fixture at `localhost`,
`127.0.0.1`, or `::1`. Reject duplicate RUM controls, any other RUM
value, lookalike hosts and non-loopback RUM controls. URL construction
does not prove network isolation.

Require HTTPS except HTTP on those verified loopback fixtures.
Do not silently remove an unknown control and present the result as
safe; stop and explain the unsupported input.

## Prove assignment and preservation

The relevant public engine reference is `adobe/aem-experimentation`
v2.0.0, commit `1079f967fb2e5c54a7471de957ea6b880bb574d0`.
Section replacement takes the first delivered `main > div` inner HTML.
Verify that each challenger delivers exactly one complete section,
without inherited page/section experiment rows. DA source fragments
are not delivered `main`-wrapped HTML; source checks alone do not prove
runtime extraction.

Paired overrides need actual evidence on the exact integrated runtime,
page and identities. A helper's `--paired-compatible` flag is only a
caller assertion. One override does not imply the other experiment
stays control: this engine pin can enable another inactive experiment
when forcing a selection. Use both explicit assignments when claiming
the other section is on control, after compatibility is established.

Open only the authorized delivery URL using available read-only browser
tools. Observe the actual URL, runtime assignment evidence where
available, saved configuration and real rendered content. Do not edit
DOM/runtime/storage or mock responses to manufacture success.

For this site, preserve:

- The first Atelier Hero's complete body, image/attributes, eyebrow
  and `/machines/atelier` CTA. Only its headline may differ.
- The product section's complete eyebrow, h2 `New favourites, found
  for you.` and intro; all three rows, categories, images/attributes,
  prices and CTA markup/behavior. Only the first Coffee heading/body
  may differ. Tea and Juice remain unchanged.
- The later cafe Hero, other sections and configuration.

Scroll to inspect products. Before claiming paired isolation, inspect
both control; only Hero challenger; only products challenger; both
challengers. Confirm each exact assignment and preservation scope.
A successful single-target observation proves only that narrower case.

The host is DA/Experience Workspace. The runtime setting
`simulationUI: 'universal-editor'` selects a host-provided/no-Sidekick
mode; it does not demonstrate a working DA UI or native authoring.

## Output

A generated candidate returns `status: draft`,
`backend_written: false`, `runtime_verified: false`, the candidate URL
and unresolved saved-state/compatibility/readback requirements.
It is not a saved resource or verified preview.

Use `verified` only for the exact URL/runtime, assignments and real
rendered preservation checks actually observed. Include the evidence
and limitations. Failed reads or rendering are stops, never a successful
URL-generation fallback.

Forced assignment is simulated. Configured 50/50 allocation, actual
rendering and measured performance are separate evidence. Do not claim
random allocation, live authoring, native UI compatibility, traffic,
conversion results or statistical significance from forced previews.
