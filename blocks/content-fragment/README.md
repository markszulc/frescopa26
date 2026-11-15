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
including its preview subdomains), the block fetches directly from
`https://author-p137825-e1511252.adobeaemcloud.com/content/_cq_graphql/frescopa/endpoint.json`.
Embedded previews are detected using their ancestor origins or referrer from
DA or `experience.adobe.com`. The block POSTs a GraphQL path filter using the
existing AEM author session cookies. Authors must be signed in to AEM author;
the author endpoint must allow credentialed cross-origin requests from the
preview origin, and the browser must permit the author cookies.

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
