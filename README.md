# Frescopa 2026
for AEM

> **Test Repository**: This is a test repository for demonstration purposes.

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Navigation search

The navigation modal uses the same vector-search, generative-answer, and result
metadata helpers as the Content AI search block. A compact AI summary appears
above the ranked results, with source links and the authored `Disclaimer Text`
when provided. The modal styling, default suggestions, and trending products
remain unchanged.

On the first query, it reads the authored Content AI search block from
`/search.plain.html`. Keep `Base Url`, `Content Source`, and `Content Source Type`
configured on that page. `Base Url` must point to the public search proxy, not
an upstream endpoint requiring a credential in the browser. Missing configuration
or request failures show an explicit error with a retry button, never mock results.
Both `/search` and `/gensearch` on the proxy must allow the site's origins through CORS, including
`http://localhost:3000` for development. Its `OPTIONS` responses must allow `POST`
and the `Content-Type` header; both preflight and actual responses need
`Access-Control-Allow-Origin`. This is a server-side requirement and cannot be
fixed in the browser code.

Typing is debounced by 250 ms. Results and the summary load independently after
configuration is loaded. Requests are cancelled on query changes or close, with
a 15-second results timeout and a 30-second summary timeout. Summary failures
leave results intact and offer a summary-only retry; empty answers are shown
explicitly. Up to eight unique page results are displayed in server
rank order, using at most three pages to compensate for duplicate indexed chunks.
Result links retain their indexed canonical origin; the index controls which
pages appear, including any indexed templates or demos.

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

## DA contextual experimentation UI

The optional panel at
`/tools/plugins/contextual-experimentation/contextual-experimentation.html`
embeds Adobe's production Contextual Experimentation MFE in DA Experience
Workspace. It uses this repository's **existing experimentation runtime**;
the runtime, commerce configuration, language content, palette, and quick-edit
implementation are not replaced.

After deploying the integration, add this row to the site's DA `library` sheet
at `https://da.live/config#/{owner}/{repo}`, preserving existing entries:

| title | path |
|-------|------|
| Contextual Experimentation | /tools/plugins/contextual-experimentation/contextual-experimentation.html |

Open `https://da.live/canvas?ref={branch}#/{owner}/{repo}/{page}` in Layout or Split
view and select **Contextual Experimentation**. The plugin and preview must run
on the same deployed code branch. Enter an entitled Adobe IMS organization ID;
the DA session supplies the in-memory token. No organization or credential is
hardcoded. Only valid submitted organization IDs are remembered in origin-scoped
localStorage; tokens stay in memory and travel in the production MFE's URL
fragment, not query strings or storage.

The preview bridge reads genuine runtime configuration and supports highlighting
and validated same-site navigation. Its page/session-scoped BroadcastChannel
works with DA's Shadow DOM iframes without enumerating `parent.frames`. The
bridge reports `main--frescopa26--markszulc.aem.live` as the production hostname;
adapt that value in `scripts/scripts.js` when porting to another site/domain.
Existing engine loading and experiment allocation behavior are unchanged.

Selector editing, temporary DOM previews, and unsupported DA save actions are
not implemented. Save changes before navigating between variants. Installation
does not create, publish, activate, or stop any experiment. A complete MFE
Save/Activate/Stop UI run and analytics ingestion require separate validation.

The [reusable skill](.github/skills/da-contextual-experimentation/SKILL.md)
documents safe setup, portability, and testing.

```sh
npm test
npm run lint
npx stylelint "tools/plugins/contextual-experimentation/*.css"
git diff --check
```
