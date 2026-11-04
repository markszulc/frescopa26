---
name: aem-experimentation-preview
description: Read actual saved Frescopa section experiments and prepare/check forced-variant preview links without writes. Standalone read-only preview requires exact-runtime evidence for paired overrides. Does not publish, activate, author content, or report measured results.
---

# Standalone read-only preview

Read [contract.md](../../contract.md). This skill can consume independently
verified records without running the author/configure skills. It never
creates missing records or modifies source, configuration, permissions,
browser storage, or the renderer.

Resolve the real delivery URL, DA source identity, saved distinct experiment
IDs, supported variant keys, challenger URLs/extraction, and expected copy
through an entitled read route. Missing, stale, proposed-only or inaccessible
records stop a usable preview.

## Candidate URL

From the bundle root:

```sh
python3 scripts/experimentation.py preview \
  --page-url https://demo.example/index \
  --assignment house-pour-copy/challenger-1
```

Illustrative inputs produce a draft, not a saved resource or verified URL.
The helper returns `backend_written: false` and `runtime_verified: false`.
Forced assignment is simulated; saved allocation, real rendering and
measured performance are separate evidence.

For a pair, repeat `--assignment` and pass `--paired-compatible` only after
proof on the exact integrated v2 runtime/page:

```text
?experiment=<actual-hero-id>/control&experiment=<actual-products-id>/challenger-1
```

That flag is a caller assertion, not a runtime test or native qualification.
The helper makes no paired-support or UE-handshake claim.

Stale experiment controls are replaced. Repeated supported language/UTM
labels and simple section fragments are retained. Credentials, unknown
controls, capability URLs, controller/quick-edit flags, iframe
`consent=disabled`, unsafe fragments and conflicting assignments are rejected.
Do not copy an editor/iframe URL into visitor QA.

Exactly one `rum=off` may be retained on `localhost`, `127.0.0.1`, or `::1`.
The operator must independently verify that the server is the intended
loopback fixture. Other RUM values/hosts and duplicate RUM controls stop
generation. The helper does not prove network isolation.

## Real rendered readback

Open only the authorized delivery URL. Do not edit DOM/runtime/storage or
mock responses. Read actual assignment evidence and rendered copy, then
scroll to inspect products. Check all images, categories, prices, CTA
behavior, Tea/Juice cards, full product heading/intro, and Hero/settings.

Before claiming paired isolation, inspect all four Hero/product combinations:
both control; only Hero challenger; only products challenger; both
challengers. Only the Hero headline and first product heading/body may change. A single
override does not prove the other experiment is on control.

Report `verified` only for the exact URL/runtime and rendered preservation
checks actually observed. A candidate remains `draft`; failed read/render
checks are stops. No publishing, activation, statistics, installation or
record recovery is part of preview.
