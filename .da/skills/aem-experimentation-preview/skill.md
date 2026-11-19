---
name: aem-experimentation-preview
description: Preview saved AEM experiments, audience/campaign experiences and content variants read-only across page, section and fragment scopes. Discover actual variant keys and custom query options, verify real rendering and interactions, and distinguish forced simulation from allocation, eligibility and measured results.
---

# Preview experiences read-only

Use independently supplied or entitled read-only records. This workflow
does not require the authoring/configuration skills to run first. It has
no fixed site, block, variant count, split, scope or two-experiment limit.
These self-contained instructions grant no tools or permissions.
Registration approval does not expand source access or authorize writes.

Never save source/configuration, trigger preview-publication, publish,
activate, install connectors, change permissions, alter browser storage,
grant consent programmatically or patch the renderer. If a required tool
has write side effects, stop that operation.
Do not enter creation/copy wizards to inspect capabilities; they may write
before an explicit Save.

## Discover the experience

Resolve actual content identity, control/destination URLs, authoring host,
installed runtime version and project options. Source identity is separate
from GitHub ownership and rendered pathname.

Independently read saved configuration, relevant manifests, variant
references and expected changes/preservation requirements. Discover all
actual variant keys, including `challenger-N` where used, display labels,
allocations, status, schedules, audiences, consent, conversions and
resolution behavior. Do not hardcode `challenger-1` or infer IDs from labels.

Identify page, section and fragment/selector scope, or ordinary content
preview without an experiment. Missing or proposed-only records stop a
claim of a verified experiment preview. A content-only preview can still
be reported at that narrower scope without inventing configuration.

Inspect actual `experimentsQueryParameter`, `audiencesQueryParameter`,
`campaignsQueryParameter` and corresponding metadata prefixes. Check
registered audience predicates, campaign mappings and any project-specific
simulation controls. Do not assume default names or invent override forms.

## Build safe candidate URLs

For the public v2 reference, an experiment assignment uses
`experiment=<actual-id>/<actual-variant-key>`; repeated experiment
parameters can express multiple assignments. Use the installed namespace
and prove the exact runtime's repeated-parameter behavior. There is no
generic two-assignment cap.

Support audience and campaign simulation only through verified controls.
The default audience parameter is `audience`; campaigns recognize their
configured parameter and `utm_campaign`. These affect routing and are
not automatically unrelated tracking parameters.

Replace stale controls in the relevant namespace. Preserve reviewed safe
unrelated query parameters, their repetition/order where meaningful and
non-secret fragments. Inspect the project's actual routing before treating
a parameter as unrelated. Reject unknown or conflicting controls; do not
silently strip them and call the resulting URL safe.

Reject embedded credentials, tokens, editor capabilities, controller or
quick-edit flags, unsafe fragments and iframe consent overrides such as
`consent=disabled`. Never turn an editor/iframe URL into a visitor URL by
copying its capability query string.

Monitoring controls follow the approved QA policy. For the existing local
fixture convention, retain exactly one `rum=off` only on an independently
verified loopback fixture at `localhost`, `127.0.0.1` or `::1`. Reject
duplicate RUM controls, other values or lookalike hosts. Do not generalize
that fixture rule to another environment without its own verified policy.
URL construction alone does not prove telemetry or network isolation.

Use HTTPS, except approved HTTP loopback development. For redirects,
validate the actual approved destination and final URL before navigation.
Preserve the distinction between ordinary content preview, forced
assignment and production campaign links.

## Check eligibility and interacting configurations

Forced selection does not prove natural audience matching, configured
allocation, consent eligibility or date/status behavior. Inspect actual
runtime evidence for each requested condition rather than assuming forcing
bypasses it. Do not change consent/storage or fabricate a different clock.
If the test context is unavailable, report the blocked scenario.

At `adobe/aem-experimentation` v2.0.0 commit
`1079f967fb2e5c54a7471de957ea6b880bb574d0`, an experiment override
can also enable another inactive experiment. A single assignment does not
pin other experiments to control. Use explicit assignments for every
relevant experiment when claiming isolation, after proving compatibility.
A helper's compatibility flag is only a caller assertion.

Read the resolved page before reasoning about sections or fragments.
Page-level audience/experiment/campaign replacement may change downstream
configuration. Check actual precedence, selected audience/campaign and
served experience for this version rather than assuming independent layers.

Build a matrix covering each requested variant and the relevant
cross-experiment, audience/campaign, scheduling and consent interactions.
Explain coverage limits for large combinations; do not claim exhaustive
isolation from a few successful URLs.

## Observe real delivery

Open only authorized URLs with read-only browser tools. Read the actual
resulting URL, saved configuration, runtime assignments, served resource
and rendered output. Inspect redirect destinations or code-only effects
when those are the intended experience.

Verify the correct extraction for page, section or selector fragments.
For the v2 reference, page replacement copies `main` inner HTML, section
replacement copies the first `main > div` inner HTML, and fragment
replacement uses the matching selector before a first-section fallback.
Prove the intended match and redecoration, including lazy content. DA
source fragments and table-shaped source are not rendered readback.

Compare against each approved baseline/diff for the selected block type.
Check changed copy/assets/layout and preserve unrequested siblings,
attributes, destinations, prices, metadata and behavior. Scroll to lazy
targets, inspect images and CTA behavior, and use relevant viewport and
accessibility checks. Do not impose a particular hero/card template.

Runtime inspection objects/events may provide evidence; they are not
authoring APIs. Do not edit DOM/runtime/storage or mock responses to
manufacture a passing result. A simulation UI option does not prove native
compatibility with the current authoring host.

## Report evidence and limits

A generated candidate returns `status: draft`,
`backend_written: false`, `runtime_verified: false`, candidate URLs,
requested assignments and unresolved prerequisites.

Use `verified` only for the exact URL/runtime, requested scope,
assignments and actual rendered/preservation checks observed. Record
tested cases, final URLs, eligibility evidence and unsupported scenarios.
Failed reads/renders stop verification, never become a successful
URL-generation fallback.

Forced assignment is simulated. Configured percentages, natural allocation,
real rendering and measured performance are separate evidence. Do not infer
conversion rates, statistical significance, native authoring or UI
qualification from a forced preview.
