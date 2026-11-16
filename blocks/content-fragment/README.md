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
in panel memory and are supplied only to the fixed author endpoints and Adobe's
Content Advisor. DA's
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
**On This Page** appears first and lists unique Content Fragment paths currently
referenced by the page, including missing or failed fragments. Traffic lights
show actual publication state from the authenticated
`GET /adobe/sites/cf/fragments/{uuid}` management API, independently of FAQ loading.
This endpoint must also allow the panel's preview origin and `Authorization`
header through CORS. Green means **Published**, amber means **Published
(modified)** (author changes are not yet published), and red means **Not
published** (new, draft, or unpublished). Waiting/checking states are amber.
Metadata failures show **Publication unknown**, with a visible error; they never
imply that a fragment is unpublished or prevent FAQ rendering.
Each indicator has a descriptive tooltip and accessible status label.
Select anywhere on a fragment row (or focus it and use Enter/Space) to outline every block
referencing that path in the preview and scroll the first into view. Selecting
another fragment moves the highlight and restores the previous outlines.
The title is plain text; **Edit** remains a separate link and does not locate
the fragment. Highlights begin fading at 6.5 seconds and clear at 7.5 seconds,
including after preview block replacements. Reduced-motion users get no fade
animation. Reloading the preview or unloading the panel also clears highlighting.
Highlighting does not edit or save authored content.
Highlight errors are shown below the table; Layout or Split view is required.
**Author Connection** is collapsed by default. Expand it for the author hostname,
service, authentication method, current page, request details, and troubleshooting.
Each enabled **Edit** link opens the new Experience Cloud Content Fragment editor
in a new tab, using the fragment's GraphQL `_id` UUID, the author repository, and
the `mark-szulc` Experience Cloud organization route. Edit remains disabled until
a UUID is available. It does not save or publish content. Author-editor sign-in
and permissions still apply. After saving edits, reload the preview to fetch
the latest author content. Added or removed block references update the list.

## Browse and place fragment paths

**Browse with Content Advisor** loads Adobe's hosted Content Advisor, with its
built-in **Content Fragments** experience enabled and selected. It uses the DA
IMS token and the same author repository, initially browsing the FAQ folder.
The organization must have Content Advisor access/provisioning for the panel's
HTTPS preview origin. No custom fragment picker is used.

Select one or more main-variation fragments and confirm the selection. If a
one-column, path-based **Content Fragment** block is selected in DA, the panel
adds the paths to that block, preserving existing paths and removing duplicates.
It uses DA's live-document subscription and guarded `sendHTML` replacement:
changes to the document or block selection during the write cause an explicit
error instead of overwriting other content. Non-fragment blocks, question/answer
blocks, and read-only documents are not replaced.

With no block selected, the panel sends plain paths to the editor at the cursor
using DA's `sendText` action. Authors choose the insertion point; no new block
is automatically created. This legacy text action has no acknowledgement, so
the panel reports that paths were sent, not that a save completed. Placement is
an ordinary, undoable document edit; it does not explicitly save or publish.
FAQ-model fragments are required by this block's renderer. Media assets and
non-main variations are not inserted as fragment paths.

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
