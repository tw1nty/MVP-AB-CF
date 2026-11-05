# ClassFindr Pathway: A/B preference study

A deployable comparison of two Pathway layouts. Participants see both designs in a randomized order and choose **Layout A**, **Layout B**, or **No preference**, with an optional comment.

- **A:** original All / To review / Accepted / Dismissed tabs.
- **B:** accepted swaps first, then pending and dismissed suggestions on the same page.
- Starting order is independently randomized 50/50 per browser and retained in local storage.
- Both layouts start with the same sample plan, including two accepted swaps. Each layout keeps its own in-memory plan during comparison.
- Feedback becomes available once the course-swap heading has entered the viewport for both layouts. This records exposure, not proof that the participant read or understood each design.
- Prototype interactions are summarized per layout and saved with the submitted response. No background event stream, session recording, name, or email collection is implemented.

This is a **counterbalanced preference study**, not a between-subject conversion experiment. The primary result is the share of completed responses preferring A, B, or neither. The results page also breaks this down by starting order. It does not declare statistical significance or track nonresponders.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import `tw1nty/MVP-AB-CF`.
2. Keep the repository root as the root directory. `vercel.json` selects **Other**, runs `npm run build`, and serves `dist`. Node.js 24 is selected by `package.json`. The `api/` directory becomes Vercel Functions.
3. In the project’s **Storage** tab, create and connect a **private Vercel Blob store**. Connect it to Production and any Preview environments in which you want feedback collection. Vercel supplies `BLOB_READ_WRITE_TOKEN`. A public store will not work with the private-storage calls.
4. In **Settings → Environment Variables**, set `RESULTS_PASSWORD` to a unique random value of at least 24 characters. Keep it server-side; do not prefix it with `NEXT_PUBLIC_` or put it in frontend code. You can generate one locally with `openssl rand -hex 24`.
5. Deploy or redeploy after connecting storage and setting the password.
6. Open the deployed `/` and compare both layouts. Submit a test response, then open `/results.html` and enter your results password to verify it appears. A private-store integration cannot be verified until your Vercel project is connected.

Share the deployed **root URL**, without `preview` or `version` query parameters, with participants.

The application will display a retryable error rather than claim feedback was saved when storage is missing or unavailable. Static previews still work without storage. Environment variables should be configured before inviting participants.

Vercel references: [private Blob storage](https://vercel.com/docs/vercel-blob/private-storage), [Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js), [project configuration](https://vercel.com/docs/project-configuration/vercel-json).

## Useful URLs

| URL | Purpose |
| --- | --- |
| `/` | Participant study, randomized starting order |
| `/?preview=1&version=a#review` | Preview A without participating or collecting feedback |
| `/?preview=1&version=b#review` | Preview B without participating or collecting feedback |
| `/results.html` | Password-protected response data and CSV download |

Preview mode retains the original A/B and setup/review controls. The data API is protected even though the results-page shell itself is public. The password stays in page memory and is sent over HTTPS in an Authorization header. Use **Lock** or close the tab when done.

## Results

The private results page displays counts and percentages for each preference, starting-order breakdowns, and written comments. Results load 50 responses at a time. Use **Load next 50** until the page says all available responses are loaded before interpreting the full sample. CSV exports contain the currently loaded responses, including per-layout counts of accept, undo, dismiss, and accept-all actions.

Responses use an immutable object path based on the study ID and a random browser participant ID. A retry cannot add a second vote or overwrite the original preference. A participant can still respond again from another browser/device or after clearing site storage; this is not identity-verified voting. All assignment and interaction metadata are client-reported. Share this as a lightweight feedback study, not a fraud-resistant public poll.

The production store contains only completed responses under `studies/pathway-layout-preference-v1/`. Storage is private; there is no public bucket URL in the frontend. The backend validates and bounds requests, and the results page renders comments as text. CSV values are escaped to prevent formula execution. The app stores no IP addresses, although Vercel may retain standard infrastructure logs.

To start a new independent study, change the study ID in both `public/study-model.js` and `lib/validation.js`. Do not change it while collecting a single study. This separates browser assignments and response storage.

## Local development

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4174/`. Local feedback is written only to ignored `.local-data/`. The default **local-only** results password is `local-study-results-password`. The production handlers never use this default and never fall back to local files on Vercel.

Copy `.env.example` to `.env.local` if you want to override local settings. To exercise a real private Blob store locally, set `LOCAL_FEEDBACK=false` and a dedicated test-store token. Do not test against live study data. Neither `.env.local` nor local responses are committed.

```sh
npm run check       # meaningful API/model tests, then static build
npm audit --omit=dev
```

CI repeats these checks on Node.js 24. The Blob SDK uses a same-major Zod override to avoid a known vulnerable transitive pin; the lockfile records the audited installation.

## Implementation

- `public/app.js`, `styles.css`: the original Pathway prototype and both layout variants.
- `public/study.js`, `study-model.js`, `study.css`: random order, persistent participant state, comparison flow, and feedback submission.
- `api/feedback.js`: validates and saves one private response per participant ID.
- `api/results.js`: authenticates and paginates saved responses.
- `lib/store.js`: private Blob in production; isolated files in local development.
- `public/results.html`, `results.js`: private results UI and CSV export.
- `tests/study.test.js`: assignment, exposure requirements, validation, duplicate retries, persistence, authentication, pagination, and CSV safety.

All academic data, tuition amounts, school mappings, graduation projections, and account details are illustrative. This app is not connected to a student information system or a production optimization engine.
