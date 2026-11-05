---
name: da-contextual-experimentation
description: Set up, port, test, or troubleshoot the production Contextual Experimentation MFE in Document Authoring Experience Workspace on an AEM Edge Delivery Services site. Use for DA canvas registration, experimentation runtime wiring, remembered IMS organization IDs, same-origin preview transport, and safe experiment lifecycle validation.
---

# Contextual experimentation in DA

Use this workflow for a DA-backed AEM Edge Delivery Services site. This skill
contains instructions, not the integration code or the production MFE.

## Establish the contract

1. Read the target repository's `AGENTS.md` and deployment instructions.
2. Determine the actual GitHub owner, repository, and code branch:
   ```sh
   gh repo view --json nameWithOwner --jq .nameWithOwner
   git branch --show-current
   git status --short
   ```
3. Ask whether the site is a non-commerce demo or a commerce storefront, and
   which languages are genuinely supported. Do not invent commerce endpoints,
   credentials, translated content, or successful backend responses.
4. Confirm an entitled Adobe IMS organization and a signed-in DA session. Never
   hardcode an organization ID or token in source, examples, PRs, or this skill.
5. Ask for explicit authorization before creating content, publishing,
   activating, stopping, or deleting experiments. Use a dedicated test page,
   not the homepage. EDS branches isolate code, not authored content: publishing
   a test page can make that content available on other code branches.

## Integration files

In this repository, inspect:

- `scripts/experiment-loader.js`: runtime enablement and eager/lazy phases.
- `scripts/experimentation-preview.js`: configuration and highlight bridge.
- `scripts/experimentation-channel.js`: same-origin preview transport.
- `tools/plugins/contextual-experimentation/context.js`: context, navigation,
  organization persistence, MFE URL, and message validation.
- `tools/plugins/contextual-experimentation/contextual-experimentation.js`,
  `.html`, and `.css`: DA SDK bootstrap and panel.
- `plugins/experimentation/src/{index,ued,simulation}.js` and `LICENSE.md`:
  licensed upstream runtime.
- `scripts/scripts.js` and `head.html`: page loading integration.
- `tools/quick-edit/quick-edit.js`: import-map preservation and one-time bootstrap.
- `blocks/edit/da-palette/da-palette.css`: licensed DA stylesheet compatibility.
- `tests/scripts/experimentation.test.mjs` and the README's Experimentation section.

To port the integration, transfer these files and their directly dependent
loading changes into the target repository, reconcile its conventions, and
preserve licenses. Do not modify `scripts/aem.js`. Do not copy confidential MFE
source into a public site repository.

Use upstream `adobe/aem-experimentation` **main**, not the removed `v2` branch.
Check the current README and record the vendored revision. Keep the upstream
runtime files together and unchanged; do not silently upgrade a working pin.
Set the actual production hostname in the target site's runtime options.
The English sheet and disabled commerce setting are demo-specific, not
requirements for experimentation. Do not overwrite a target site's working
language data or commerce configuration when porting the integration.

Preserve conditional loading: ordinary pages without experimentation metadata
should not load the engine. DA canvas previews must expose genuine engine
configuration even when there are no experiments. Preserve consent requirements;
do not grant consent or change RUM sampling implicitly.

## Register and open the DA panel

Open `https://da.live/config#/{owner}/{repo}` and add this row to the `library`
sheet, preserving all existing rows and columns:

| title | path |
|-------|------|
| Contextual Experimentation | /tools/plugins/contextual-experimentation/contextual-experimentation.html |

Use the configuration UI's supported save action and verify the row persists
in a newly opened canvas. Do not assume clicking a save control opens a menu.

Deploy the code branch, then open:

`https://da.live/canvas?ref={branch}#/{owner}/{repo}/{page}`

Use Layout or Split view so a preview iframe exists, and explicitly select
**Contextual Experimentation** in the tool list. Do not send speculative
End/Enter key sequences that could instead focus or edit page content.

The plugin and preview must use the same branch's origin:

`https://{branch}--{repo}--{owner}.preview.da.live`

DA's Shadow DOM iframes are not reliably enumerated by `window.parent.frames`.
Use the shared, canonical-page-scoped preview channel, not sibling frame
enumeration. Do not send credentials over that channel. Local plugin
development with `ref=local` does not establish a deployed same-origin E2E
connection; prefer a deployed feature branch for integration testing.

## Authentication and remembered organization

Load the guest SDK from `https://da.live/nx/utils/sdk.js`. Use the actual
SDK-resolved page context and its in-memory token.

The production MFE is:

`https://experience.adobe.com/solutions/ExpSuccess-aem-experimentation-mfe/static-assets/resources/ue.html`

The adapter supplies its supported `ue-data` fragment with the host origin,
page URL, IMS organization, token, production environment, and UI preferences.
Keep tokens out of query strings, storage, logs, screenshots of developer
tools, and repository artifacts.

The connection form remembers only valid submitted organization IDs under
`da:contextual-experimentation:ims-org` in origin-scoped localStorage. Prefill
the form; do not automatically connect or activate anything. A new valid
submission replaces the value. Invalid input or blocked/full storage must not
prevent manual entry. Main and feature branches have separate storage origins,
so users enter the ID once on each origin/browser.

Accept MFE messages only from both its exact production origin and actual
iframe window. Support genuine configuration requests, validated same-site
navigation, and highlight/clear requests. Do not claim selector-based editing,
temporary content previews, or unsupported DA save actions are implemented.
Save authored changes before navigating to a different variant.

## Validate safely

Run the target repository's documented commands. In this repository:

```sh
node --test tests/scripts/experimentation.test.mjs tests/scripts/quick-edit.test.mjs
npm run lint
npx eslint tests/scripts/experimentation.test.mjs tests/scripts/quick-edit.test.mjs
npx stylelint "tools/plugins/contextual-experimentation/*.css"
git diff --check
```

Validate in real DA, not only in a mock with ordinary DOM iframes:

1. Confirm the expected code branch, genuine runtime version/configuration, and
   successful preview-channel reply.
2. Submit an authorized organization, confirm the MFE renders, then reload or
   reopen the panel and verify prefill without re-entry. Never print the token.
3. Check actual backend HTTP statuses, not fabricated empty results.

After the MFE loads, unrestricted accessibility snapshots can expose its
token-bearing iframe URL. Use screenshots and safe evaluations through known
element handles returning only status/visibility booleans. Do not return iframe
`src`, location fragments, raw authentication context, request headers, or
credential-bearing snapshots, even to temporary files.

If browser automation is unavailable or hangs, report that blocker and request
the smallest necessary manual step. Do not claim an automated browser check
passed because deployed source files match or unit tests pass.

For an authorized lifecycle test, use identifiable control/challenger content
and a bounded date range. Verify inactive draft behavior, activation, configured
allocation, real variant replacement and HTTP success, a working CTA, and
published deactivation. Check stopped behavior on a fresh **unforced** URL:
simulation query parameters can deliberately force an inactive experiment.

An API-driven DA/AEM runtime cycle is not proof that the full MFE
Save/Activate/Stop UI works. CTA navigation is not proof of analytics ingestion.
Record these as separate results. Leave the test stopped and report any
published pages that remain. Refresh browser-cached variant responses when
checking newly published fixture changes.

## Troubleshoot by owner and resource

- `/config.json` missing: an inherited commerce bootstrap requires genuine
  storefront configuration. For an explicitly approved non-commerce demo,
  disable commerce startup and account/cart tools instead of inventing config.
- `/placeholders/languages.json` missing: the site's header/footer require its
  language data. This demo has an explicit English-only static sheet with
  `Locale`, `Path`, `Code`, `Label`, and `Tagline`. To use authored DA language
  data, publish the sheet and remove the static file that would shadow it.
- `/fragments/nav.plain.html` or `/fragments/footer.plain.html` missing: language
  configuration does not create navigation or footer content. Author and preview
  those fragments in DA, or use the page's `nav`/`footer` metadata to point to
  genuine existing fragments. Do not silently fabricate site navigation.
- `/blocks/edit/da-palette/da-palette.css` missing: DA's palette fetches a
  site-relative stylesheet. The compatibility asset in this repository is
  adapted from Apache-2.0-licensed `adobe/da-nx` and scoped to its Shadow DOM.
  Keep the license/attribution when porting it; do not monkeypatch global fetch.
- Import-map conflicts: preserve already declared mappings and initialize
  quick edit once per preview document, including during body reloads.
- ProseMirror `TextSelection` warnings: trace the DA editor/selection stack
  separately. Do not patch minified vendor code or `scripts/aem.js` to hide it.
- MFE version lookup requesting removed `v2/package.json`: report it as a
  production-MFE dependency issue; the site's runtime should still use main.
- Core scripts/styles missing after merge: verify Code Sync and compare
  decompressed deployed assets with the merged source before altering code.
  A site administrator can request a Code Bus resync through the authenticated
  Admin API when necessary; inspect the job's failed count and completion.
- Header/footer tests failing with missing `content/placeholders/languages.json`:
  this repository's inherited localization suites require a separate fixture.
  Do not replace that multilingual fixture with the one-row demo sheet or
  report those suites as passed.

Current DA sessions can use the host's `daFetch` helper from
`https://da.live/nx2/utils/api.js` for authorized admin operations. Let it handle
authentication; return only HTTP status and safe job progress. Do not extract
tokens to a shell or include authorization headers in diagnostics.

## Deployment and handoff

Use a feature branch. Inspect and preserve the target PR template. Include a
real `.aem.page` URL illustrating the change and the DA feature-canvas URL.
Report exact validation commands with results, and distinguish runtime,
browser UI, backend access, and analytics validation.

Use `gh pr checks` to inspect actual Code Sync/performance results. After a
human merges, verify main serves the tested assets and point users to the
normal main canvas URL without the feature `ref`. Remind them that organization
prefill on main requires its own first submission.

Do not auto-merge, publish real content, or activate a production experiment
without authorization. Finish with verified outcomes and explicit remaining
limitations.
