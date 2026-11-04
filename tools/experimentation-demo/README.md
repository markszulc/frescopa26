# Frescopa experimentation runtime

The site now runs the AEM experimentation v2 engine before Commerce initialization
and page decoration. The engine can replace a section while keeping the site's
existing block decorators. This site uses EDS with DA/Experience Workspace.
It does not use AEM Author or Universal Editor. DA-native UI and host-adapter
compatibility are under investigation. Native authoring remains unqualified.

The runtime is pinned to the public
[v2.0.0 source](https://github.com/adobe/aem-experimentation/tree/1079f967fb2e5c54a7471de957ea6b880bb574d0).
Its source and Apache 2.0 license are copied unchanged under
`plugins/experimentation/`. See `plugins/experimentation/UPSTREAM.md`.

## Runtime wiring

`scripts/experiment-loader.js` follows the release's eager/lazy setup.
`scripts/scripts.js` awaits the eager hook before `initializeCommerce()` and
`decorateMain()`, while section metadata and block rows still exist.
The lazy hook runs after `loadSections()`. Existing Commerce error handling and
lazy loading remain in place. `scripts/aem.js` is unchanged.

Preview means localhost, loopback, `*.aem.page`, `*.hlx.page` or
`*.preview.da.live`. The last case covers DA's actual authoring iframe. Live AEM
and custom domains are production. An uninstrumented production page skips the
engine download. Preview pages run the real eager engine even without metadata,
so `hlx:experimentation-get-config` returns its actual empty configuration.
Loader failures are logged and do not install a substitute empty-config listener.

The loader currently uses `simulationUI: 'universal-editor'` as the SDK's
host-provided/no-Sidekick mode only. It suppresses the SDK's Sidekick simulation
panel and leaves UI delivery to a host. It does not provide a working DA UI or
establish that a Universal Editor extension can run in DA/Experience Workspace.
Enabling that extension alone does not qualify DA compatibility. Runtime routing
is unchanged while the DA-native UI and host-adapter options are investigated.
No Sidekick registration, DA admin configuration, RUM sampling, consent defaults,
global audiences or telemetry configuration are changed.

## Local reproduction

Use Node 22 or newer, Python 3.10 or newer, the existing Node dependencies, and
an installed Chrome:

```sh
npm ci --ignore-scripts
npm test
npm run lint
node tools/experimentation-demo/server.mjs
```

The server binds only to loopback. Open:

```text
http://127.0.0.1:3001/drafts/experimentation-runtime/control?rum=off&experiment=atelier-hero/control&experiment=house-pour-copy/challenger-1
```

Set both assignments explicitly, using `control` or `challenger-1` for each.
Stop the server with Ctrl-C when finished. `PORT` changes its port; `CHROME_BIN` selects an
existing Chrome executable for the tests. The default executable supports macOS
and Linux. No browser package is installed by these tests.

`drafts/experimentation-runtime/index.plain.html` is a public raw export from
<https://main--frescopa26--markszulc.aem.page/index.plain.html>, captured on
2026-11-04. It retains all nine sections, the two-row Hero, and the three static
product cards. `fixtures.mjs` runs the real
`tools/coworker-experimentation/scripts/experimentation.py` CLI to prepare
inactive metadata, validate complete exports and generate all four paired URLs.
The product challenger comes from that bundle's authored export. The Hero
challenger changes only its headline. Relative image URLs resolve against that
same public site in both baseline and challenger. The captured exports remain
unchanged.

The local model uses:

| Experiment | Target | Control | Challenger |
|---|---|---|---|
| `atelier-hero` | First Hero section | Every morning, perfected. | Your morning, made yours. |
| `house-pour-copy` | Product section | The house pour and its original body | Your next everyday favourite; A round, balanced blend for the cup you look forward to each morning. |

Each experiment has one challenger with `Experiment Split` set to `50`, leaving
50% for control. Both drafts explicitly set `Experiment Status: Inactive`.
Unforced visits stay on control without fetching a challenger or creating a
variant assignment. Forced previews work without changing that inactive status.
The product challenger retains the section heading and intro,
all three cards, categories, images, prices and CTA markup. Only the first card's
heading and body change. Product cards are authored content, not catalog results.
The existing decorator's `href="#"` purchase CTA behavior is preserved.

The pinned engine fetches a full HTML export and selects its first `main > div`
for a section replacement. Each local challenger response contains exactly one
section and the actual site's `head.html`. The helper validates the exact served
baseline and challenger bytes, including ordinary site head scripts/stylesheets.
It ignores that head during comparison; it never copies or executes it. Active
content inside the selected main still stops validation. These fixtures do not
use page or fragment scope as a workaround.

At this release pin, an `experiment` query override can also allow another
inactive experiment to run. A single override must not be presented as pinning
the other section to control. Use the paired URLs for this two-experiment model.
The four combinations are proved locally; they are not saved DA experiment
identities or an activation approval.

## What the proof covers

`npm test` uses Node's built-in runner and isolated, temporary Chrome profiles.
It checks real helper-generated metadata, baseline-aware validation output and
preview links, then all four forced Hero/card combinations through the real v2
engine and the site's real Hero/cards-product decorators. SHA-256 comparisons
bind helper validation to the actual HTTP baseline/challenger response bodies.
It compares all untouched cards
and sections with the original, including the product section's default content.
It also checks the empty-config readback on local and DA-preview hostnames,
production download gating, explicit import failure behavior, unforced inactive
traffic, and the eager/lazy source wiring. `npm test` also runs the Python helper
suite, including Hero-body rejection, real site head handling, and unsafe or
ambiguous section rejection.

The layout check uses an actual 1280x720 content viewport with the site's block
CSS. It checks that the Hero headline is visible before scrolling, and the lower
Coffee target is visible after scrolling. It does not require the entire Hero
to fit above the fold or change site CSS. Browser window chrome is measured
before calibrating the content viewport.

The tests start bounded loopback servers and remove their temporary profiles on
exit. Browser checks use `rum=off` and disable image downloads. The interactive
local preview uses the same block decorators and site styles. It omits the
header/footer, Commerce services, editor UI and consent integration. It is a
focused content/runtime proof, not a full storefront or live authoring test.
The real site's Commerce paths are left intact; their authenticated services are
not evaluated by this local proof.

The existing upstream regression suites run separately with
`node --test tests/**/*.test.mjs`. They refer to
`content/placeholders/languages.json` and `content/placeholders/search.json`,
which are not included in the current upstream checkout. Their fixed starter
dataset is not interchangeable with the published sheets. Authoritative local
fixtures are required before those suites can finish. `npm test` above covers
the experimentation integration and offline helpers, not those upstream suites.

## Authoring and publication limits

The DA content namespace remains `markszulc/frescopa26`, not the fork owner.
The editor is <https://da.live/canvas#/markszulc/frescopa26/index>.
No live DA content, activity, publication state or UI extension is changed by
these local fixtures. Their paths and tools are excluded from Edge Delivery
serving through `.hlxignore`.

A later authoring step needs section metadata and single-section challenger
pages in that namespace. Keep the existing default heading/intro in the product
challenger. The public homepage has no experiment metadata yet. DA-native UI and
host-adapter compatibility require separate evidence before any UI integration.
The SDK config readback exercised here does not qualify a DA authoring UI or a
native authoring roundtrip.

The official DA Source documentation shows a body with empty header/footer and
main containing section divs. The offline `da-source` mode accepts that explicit
shape. The protected site's actual authenticated source and permissions remain
unverified; the unauthenticated raw request returned `401`. Source tables remain
an unsupported stop. Delivered fixture checks do not qualify native DA authoring.

No branch preview is claimed by this local proof. Fork Code Sync and content
provisioning must be verified before an upstream PR can list an available branch
preview. Do not copy editor-only URL parameters into public visitor links.
