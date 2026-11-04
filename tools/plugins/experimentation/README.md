# DA experimentation rail

The rail prepares a full-page challenger and an inactive page experiment from
a DA control page. Duplication and metadata saving happen in native DA. The
rail reports saved success only after independently reading back the source
and checking that unrelated content survived.

The overview and editor follow the publicly documented experimentation rail
layout. This implementation supports one challenger at 50/50, optional dates
and read-only forced-variant preview links. It does not activate, publish,
report results or provide a custom content editor.

## Overview and editor

The empty state offers **View Docs** and **Create New**. A saved experiment
shows its summary/status, **Edit**, Type/Optimizing for/date facts and
**Results / Content Variants (2)** tabs. Content Variants is selected by
default. Results plainly states that reporting is not connected.

Control and Challenger 1 appear as grouped rows with their actual traffic
split, selected state and **Open in DA / Preview** actions. The editor uses
the same rows with **Edit in DA**. It starts with Experiment Name and fixed
Conversion, followed by variants and optional dates. No consent switch is
added; unrelated source metadata is preserved.

**Add new** opens the challenger step. The demo supports one full-page
challenger; a second cannot be added. **Even Split** restores the supported
50/50 allocation. Other saved allocations can be read but new settings must
use the supported even split.

The footer keeps **Save as draft in DA** visible while configuration scrolls.
That action opens review and the native handoff. It does not save on its own.
Activation is explicitly unavailable. Existing active experiments are
read-only.

## Native copy and save

1. Open the rail from an approved DA control page and choose **Create New**
   or **Edit**. Saved source, not unsaved editor content, is the baseline.
2. Select **Add new**, review the full source and exact challenger destination,
   then prepare the native duplication instructions.
3. Use **Duplicate in DA** to open the existing control editor separately.
   Copy the complete page in native DA. Stop if the destination is occupied
   or the reviewed source changed. Follow the instructions to remove page
   Experiment rows from the challenger while preserving other content.
4. Return to **Refresh saved state** before editing challenger content. The
   adapter verifies the complete saved copy before exposing the verified
   challenger for editing.
5. Edit challenger content in native DA. Configure the experiment and select
   **Save as draft in DA**. Review the differences, then continue to the
   native metadata step.
6. **Copy configuration** copies reference TSV only. **Open DA metadata**
   opens the control editor. Apply each entry with native page metadata
   controls, preserve unrelated rows and save in DA. Blank dates mean
   clear/remove those fields. This is not a qualified paste/import API.
7. Select **Refresh saved state**. A matching inactive configuration,
   preserved unrelated control source and a challenger without inherited page
   Experiment rows are required before the rail reports verified saved state.

Keep the rail mounted while native work happens in its separate tab.
Back, Close and Escape preserve a pending handoff and focus **Resume native
verification**. New configuration is locked until that verification finishes.
Reloading loses the in-memory reviewed baseline and requires a fresh review;
unsaved/pending work has an explicit discard confirmation.

The adapter does not invoke DA's raw copy or source-write endpoints.
Documented native copy can overwrite a destination. An operator collision
check followed by readback is still **not atomic**. A null source revision
can support this manual review/readback flow; it never becomes a conditional
write guarantee or a local hash advertised as a server revision.

## Row Preview

Select **Preview** on Control or Challenger 1. Enter the actual control
visitor preview URL in the setup step, not a DA editor URL. The URL is kept
only in the mounted rail. Later row previews reuse it but independently
reread saved configuration every time.

The selected variant gets an **Open control preview** or **Open challenger 1
preview** link, labeled **Forced assignment. Delivery unverified.** Links use
the saved experiment ID and pinned engine keys `control` / `challenger-1`.
Unsaved form values never determine the assignment.

Existing input query and fragment state is discarded. Credential-bearing
and authoring/controller inputs are rejected, including trailing-DNS-dot
variants. Unsupported saved IDs fail rather than guessing normalization.
HTTPS visitor URLs and ordinary HTTP loopback URLs are supported.

These are read-only QA links. They do not perform native preview/publication,
activate, verify delivery or bypass date, audience and consent gates. The
adapter's native preview capability remains unavailable. Failed source reads
clear old links; changed saved source invalidates further authoring review.

## Application boundary

Production boot imports the public DA SDK and calls
`createDaExperimentationAdapter({context, actions})`. Content identity comes
from SDK context, not the code fork. `mountExperimentation(root, adapter)` is
the UI entry point. The adapter only uses `actions.daFetch` for source GETs.
The functions below are application helpers, not added DA SDK methods.

Both native `canvas` and legacy `edit` SDK views are accepted with explicit
organization, site/repository and safe document path. Other views remain
invalid. Control and challenger editor links retain the accepted native view;
Canvas authoring does not switch back to the legacy editor.

| Helper | Input | Result |
|---|---|---|
| `readPage` | none | Saved snapshot |
| `prepareVariant` | `{destinationPath, expectedRevision}` | Native instructions and editor URL, no saved claim |
| `verifyVariant` | Same reviewed destination/revision | Verified saved challenger page and nullable revision |
| `prepareExperiment` | `{draft, expectedRevision}` | Reference metadata text, editor URL and normalized expected settings |
| `verifyExperiment` | none | Snapshot after saved configuration and preservation checks |
| `buildPreviewLinks` | `{previewUrl, experiment}` | Pure `{controlUrl, challengerUrl}` forced assignments |

A snapshot contains `{page, sourceHtml, revision, experiment, capabilities}`.
Page is `{org, repo, path, editorUrl}`. Revision is an authoritative strong
ETag string or null. Experiment is null or `{id, challengerPath,
challengerPercentage, status, startDate?, endDate?}`. Reads retain actual
active/inactive status. Prepared settings are inactive only.

The original automated `createVariant`, `saveExperiment` and `preview`
methods remain explicitly unavailable. Method presence is not a capability
claim, and the UI does not call them. Preparation/verification helpers retain
their reviewed baseline only in the adapter instance.

Typed failures include useful messages and operation codes. Inputs survive
failure. Readback mismatch stays pending and retryable; failed preparation
requires a fresh review. No automatic mutation retry or local persistence
fallback is included.

## Checks and limits

```sh
npm run test:experimentation-ui
npm test
npm run lint
```

Set `CHROME_BIN` if Chrome is not at the default macOS path. Browser tests
use isolated profiles and loopback servers, then clean up their own resources.
They run labeled fixtures with the real DOM, production adapter/model and
fake GET-only DA source responses. They cover pending/native steps, saved
readback, preservation failures, stale/null revisions, clipboard failures,
active read-only state, tab/row keyboard focus and saved-only row previews.

Widths are measured in actual 320px and 400px iframe viewports. Production
frame checks at 760px and 1000px heights exclude fixture chrome and assert
one configuration scroll region plus visible, fixed footer actions/reasons.
The fixture directory is excluded from delivery through `.hlxignore`.

The repository runtime suite uses the real pinned experimentation engine.
A separate local fixture proof also passed the source model, actual
`readPage()` output and QA helper URLs through pinned page-engine rendering.
That no-dates scenario used an explicit local source-to-delivery mapping.
It does not qualify DA conversion or delivered content, and it does not
silently remove dates from other configurations.

Native registration/permissions, approved source paths, actual DA copy/save
round trips, target normalization and preview delivery still need scoped
approval and qualification. No hosted preview, content resource or write
permission is established by these tests. Block/section experiments remain
a separate flow on another URL in the same content site.

## Public UX reference

[Contextual Experimentation](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/contextual-experimentation)
provides the observed overview, editor and grouped-variant layout. No Adobe
sample artwork or private UE code is included. Published captures support the
layout comparison; current live preview-dialog/menu transitions were not
observed, so this is not a claim of live visual or pixel parity.
