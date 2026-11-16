# Content Fragment

Author a one-column table named **Content Fragment**. Place one FAQ content
fragment path per line in the cell (separate paragraphs or line breaks work):

| Content Fragment |
| --- |
| /content/dam/frescopa/en/faqs/do-i-have-to-buy-frescopa-pods |
| /content/dam/frescopa/en/faqs/how-long-until-it-learns-my-taste |
| /content/dam/frescopa/en/faqs/is-it-a-chore-to-clean |

Paths may be together in one cell or in separate rows. Duplicate
paths are requested only once. In Experience Workspace or DA (`da.live`,
including its preview subdomains), the block uses the **Content Fragment** DA
panel to fetch directly from AEM author in the browser. The panel obtains DA's
in-memory IMS token through the DA SDK and sends `Authorization: Bearer ...`
to `https://author-p137825-e1511252.adobeaemcloud.com`. It omits session cookies,
so no SameSite cookie change is needed.

The panel first requests `/libs/granite/csrf/token.json` using the bearer token,
then POSTs the GraphQL path filter to
`/content/_cq_graphql/frescopa/endpoint.json` with the bearer and `CSRF-Token`
headers. Both endpoints must allow the actual preview origin and the
`Authorization`, `Content-Type`, and `CSRF-Token` headers through CORS. AEM
permissions and the Sling Referrer Filter still apply. The signed-in DA user
must have access to the author environment, FAQ fragments, and models.

The existing same-origin preview channel scopes messages to the browser tab,
code branch, and canonical page path. Only fragment paths, rendered FAQ data,
and connection errors cross that channel; IMS/CSRF tokens never do. Tokens stay
in panel memory and are sent only to the fixed author endpoints. DA's
parent-origin/window-validated token updates are used for subsequent requests.
If access expires or is denied, reopen the panel/sign in and retry; requests
never silently fall back to published content.

## Enable author access in Workspace

After deploying the code, add this row to the `library` sheet at
`https://da.live/config#/markszulc/frescopa26`, preserving existing entries:

| title | path |
| --- | --- |
| Content Fragment | /tools/plugins/content-fragment/content-fragment.html |

Open the page in DA canvas using Layout or Split view and select **Content
Fragment** from the tool panel. Keep that panel open while fetching author FAQs.
The panel and preview must use the same code branch/origin. Requests wait up
to 15 seconds for the panel; if it is opened later, select **Retry author
connection** in the block. The panel shows connection/fetch errors explicitly.
Opening the panel does not modify or publish authored content.

The panel uses DA's Adobe-hosted Spectrum 2 tokens and Adobe Clean typography.
Its connection card identifies the author hostname, service, authentication
method, current page, and actual request state (waiting/loading/connected/error).
The fragment table lists unique paths currently referenced by the page, including
missing or failed fragments. Each **Edit** link opens the AEM content fragment
editor in a new tab; it does not save or publish content. Author-editor sign-in
and permissions still apply. After saving edits, reload the preview to fetch
the latest author content. Added or removed block references update the list.

Embedded authoring is detected through DA/Experience Workspace ancestors or
referrers. Without a registered DA panel (for example a standalone preview or
another Experience Cloud host), author access reports connection guidance
rather than attempting anonymous or cookie-based requests.

In all other contexts, the block calls
`https://www.frescopa.coffee/faq-data-by-path` using one `path` query parameter per
fragment. This Edge Function endpoint must allow cross-origin requests from
preview and local development origins. Author results are limited to requested
paths and displayed in authored order; author request failures show an error
instead of falling back to published content.

The returned `items` contain `question` and `answer.plaintext`. FAQs use the same
renderer and styles as **FAQ List By SKU**: the first answer is open initially,
with native single-open accordion behavior and chevrons. Pre-rendered two-column
question/answer rows are also supported, preserving answer formatting.

Empty or invalid authoring, no results, and request failures display a message
in the block.

## Testing

Serve the repository locally and open
`/tests/content-fragment/content-fragment.test.html` to run the browser checks.
