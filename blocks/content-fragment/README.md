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

The panel reads each unique path with the supported management API
`GET /adobe/sites/cf/fragments?path={encoded-path}&limit=1`, keeping only the
exact path's Question and Answer fields and UUID. Plain-text answers are
preserved; HTML answers are converted to plain text for the FAQ renderer.
Missing fragments remain listed as not found.
Read requests use bearer authentication but require neither GraphQL POST nor a
CSRF token. The endpoint must allow the actual preview origin and `Authorization`
header through CORS. Keep AEM's managed Referrer Filter configuration intact;
do not replace it with a DA-only allowlist. The signed-in DA user must have
access to the author environment and FAQ fragments. Mutation requests still
obtain a CSRF token as described below.

The existing same-origin preview channel scopes messages to the browser tab,
code branch, and canonical page path. Only fragment paths, rendered FAQ data,
and connection errors cross that channel; IMS/CSRF tokens never do. Tokens stay
in panel memory and are supplied only to the fixed author endpoints and Adobe's
Content Advisor. DA's
parent-origin/window-validated token updates are used for subsequent requests.
If access expires or is denied, reopen the panel/sign in and retry; requests
never silently fall back to published content.

## Enable author access in Workspace

After deploying the code, add these rows to the `library` sheet at
`https://da.live/config#/markszulc/frescopa26`, preserving existing entries:

| title | path | experience |
| --- | --- | --- |
| Content Fragment | /tools/plugins/content-fragment/content-fragment.html | inline |
| Content Advisor | /tools/plugins/content-fragment/content-fragment.html?advisor=1 | fullsize-dialog |

Use the **experience** column, not **format**, for `fullsize-dialog`. Reload
Workspace after changing the library registration.

Open the page in DA canvas using Layout or Split view and select **Content
Fragment** from the tool panel. Keep that panel open while fetching author FAQs.
The panel and preview must use the same code branch/origin. Requests wait up
to 15 seconds for the panel; if it is opened later, select **Retry author
connection** in the block. The panel shows connection/fetch errors explicitly.
Opening the panel does not modify the DA document or publish content. It records
observed page usage in fragment metadata as described below.

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
Hover over a traffic light to show its publication status and UUID in a small
popover, without opening the accordion or highlighting the preview. Keyboard
focus and tapping the traffic light also show this information. The popover
stays open while hovered or focused; close it with Escape or an outside click.
Each indicator has an accessible status label.
Select elsewhere on a fragment row (or focus its title control and use Enter/Space)
to expand its details, outline every block referencing that path in the preview,
and scroll the first into view. The single-open accordion shows the fragment's
fields from AEM author. Unavailable fields or publication metadata have explicit
error messages.
Selecting another fragment closes the previous details, moves the highlight,
and restores the previous outlines. Selecting the same row again collapses it.
Open details stay expanded when publication metadata updates.
Titles retain their plain styling; **Edit** remains a separate link and does not
expand or locate the fragment. Highlights begin fading at 2 seconds and clear at 3 seconds,
including after preview block replacements. Reduced-motion users get no fade
animation. Reloading the preview or unloading the panel also clears highlighting.
Highlighting does not edit or save authored content.
Highlight errors are shown below the table; Layout or Split view is required.
Successful highlights do not display a confirmation label.
**Author Connection** is docked at the bottom of the extension and collapsed by
default. The panel content scrolls above it; expanded connection details scroll
within the card when needed. Expand it for the author hostname,
service, authentication method, current page, request details, and troubleshooting.
Each enabled **Edit** link opens the new Experience Cloud Content Fragment editor
in a new tab, using the fragment's management API UUID, the author repository, and
the `mark-szulc` Experience Cloud organization route. Edit remains disabled until
a UUID is available. It does not save or publish content. Author-editor sign-in
and permissions still apply. After saving edits, reload the preview to fetch
the latest author content. Added or removed block references update the list.

## Edit fields and variations

Opening a fragment's accordion loads its fields from the authenticated Content
Fragment Management API. Click the inputs to edit and select the **Save** icon to
persist changes. All fields in the current FAQ model (question, answer, category,
and SKU) are editable. Locked fields, multi-value fields, and non-text types are
shown read-only; use the separate **Edit** link for the full AEM editor.
Rich-text fields retain their original MIME type and are edited as source,
not converted to plain text.

The **Variation** selector lists Main plus every existing variation, including
paginated results. Selection changes which fields are viewed/edited only; it
does not modify the page's Content Fragment block or its rendered variation.
Unsaved drafts are retained when switching variations or updating publication
status. The circular-arrow **Discard edits and reload** icon explicitly discards
the current draft and reloads it from AEM. Both icon buttons have accessible
labels and descriptive hover tooltips.

Saves use JSON Patch on the selected fragment/variation endpoint, changing only
modified field values, with the exact ETag from the loaded representation in
`If-Match` and an AEM CSRF token. Conflict/permission/validation failures are
visible and retain the draft; conflicts are never automatically overwritten.
Saving updates AEM author, not publish or the DA document. Reload the page
preview to fetch saved content. The panel refreshes publication status after
successful field or usage-metadata writes.

Publishing is not available in the extension. Use **Edit** to publish through
AEM's native Content Fragment editor.

### AEM CORS requirements

The author must allow the panel's HTTPS preview origin, `GET`, `PATCH`,
and preflight requests, and the `Authorization`, `Content-Type`, `If-Match`, and
`CSRF-Token` request headers. Its CORS response must **expose `ETag`** (for example
`Access-Control-Expose-Headers: ETag`). Without a readable ETag the extension
allows viewing but disables field editing and reports usage writes as blocked.
The read-only explanation appears above the fields, which remain focusable for
selecting and copying text. Focus outlines apply to individual controls, not
the entire fragment-list container.
It does not use wildcard ETags or unguarded writes as a fallback.

## Fragment page-usage metadata

When a referenced fragment's UUID is resolved, the ordinary panel automatically
adds the canonical `https://da.live/canvas#/owner/site/page` URL to the fragment's
multi-value string metadata property **`frescopa:usedOnPages`**, using
`GET/PATCH /adobe/sites/cf/fragments/{uuid}/metadata`. Existing page entries and
unrelated metadata are preserved; an already-recorded URL causes no write.
A concurrent metadata change is reread and merged once, guarded by its new ETag.

This is external DA usage metadata, **not** AEM's native **Referenced by** list,
which is computed from references inside AEM and cannot be populated with
external DA pages through the supported management API. The default metadata
schema accepts the custom property; other schemas must explicitly define it.
Successful usage recording shows no confirmation label. Failures are displayed
inside each accordion with **Retry page usage**.

Tracking records observed usage while the panel is open. It is append-only:
removing a block from a possibly-unsaved preview does not delete historical
entries or other pages' references. It is not a site-wide crawler, publishing
hook, or native referential-integrity service.

## Browse and place fragment paths

**Add a Content Fragment** uses DA's SDK `showPanel('content-advisor')` to
open a native Workspace full-size dialog above the editor, not inside the
sidebar iframe. The Content Advisor library registration above is required;
an iframe-local CSS dialog cannot escape the sidebar's bounds.
The button's tooltip explains where to select a block or place the cursor.
The dialog loads Adobe's hosted Content Advisor, with its built-in **Content
Fragments** experience enabled and selected. It uses the DA IMS token and the
same author repository, initially browsing the FAQ folder.
The organization must have Content Advisor access/provisioning for the panel's
HTTPS preview origin. No custom fragment picker is used.

The repository's owning IMS organization is resolved from Adobe's authenticated
`https://aem-discovery.adobe.io/repositories` API by matching the exact author
repository ID. It is passed as Content Advisor's `imsOrg` and the fragment
selector's `orgId`, addressing the "Couldn't determine your organization for
this repository" notice. Discovery errors are shown explicitly rather than
guessing an organization or suppressing the notice.

Select one or more main-variation fragments and use the persistent **Insert
selected fragments** button below the Adobe picker. This action is enabled by
the native `onSelectionChange` callback; it does not depend on the embedded
picker rendering its own submission controls. **Cancel** or Escape closes the
Workspace dialog without inserting. The picker scrolls within the available
dialog height while the insertion controls remain visible.
If a
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
