# Content Fragment

Author a one-column table named **Content Fragment**. Place one FAQ content
fragment path per line in the cell (separate paragraphs or line breaks work):

| Content Fragment |
| --- |
| /content/dam/frescopa/en/faqs/do-i-have-to-buy-frescopa-pods |
| /content/dam/frescopa/en/faqs/how-long-until-it-learns-my-taste |
| /content/dam/frescopa/en/faqs/is-it-a-chore-to-clean |

Paths may be together in one cell or in separate rows. Duplicate
paths are requested only once. The block fetches
`https://www.frescopa.coffee/faq-data-by-path` using one `path` query parameter per
fragment. The endpoint must allow cross-origin requests from preview and local
development origins.

The returned `items` contain `question` and `answer.plaintext`. FAQs use the same
renderer and styles as **FAQ List By SKU**: the first answer is open initially,
with native single-open accordion behavior and chevrons. Pre-rendered two-column
question/answer rows are also supported, preserving answer formatting.

Empty or invalid authoring, no results, and request failures display a message
in the block.

## Testing

Serve the repository locally and open
`/tests/content-fragment/content-fragment.test.html` to run the browser checks.
