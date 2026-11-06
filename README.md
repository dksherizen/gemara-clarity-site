# Gemara Clarity

In loving memory of Tzvi Sherizen.

**https://gemaraclarity.org** · every sugya in Shas, step by step. Free, no ads, no account needed, works offline.

This file explains how the whole thing is made and how it runs, end to end. Part 1 is plain English. Part 2 is the technical detail for a developer or an AI picking the project up.

For the step-by-step jobs (fix a mistake, check, put live, undo) use **[docs/RUNBOOK.md](docs/RUNBOOK.md)**. This README describes; the runbook instructs. If the two ever disagree, the runbook wins and this file should be corrected.

Other docs: [docs/content-repairs.md](docs/content-repairs.md) (log of every content correction) · [docs/delicate-passages.md](docs/delicate-passages.md) (sentences waiting for a rav).

---

## Part 1: in plain English

### What it is, and who it's for

Gemara Clarity takes each amud of the Babylonian Talmud (all 37 masechtos, 5,349 amudim) and lays it out as a chain of numbered **steps**. Each step shows the Aramaic beside English, phrase by phrase, and is labelled and color-coded as one of eight kinds: a statement, a question, an answer, a challenge, a resolution, a proof, a rejection, or a conclusion. Around each step there is a short summary, a "what's happening" line, a deeper explanation, key words with vowels, and "don't get confused" notes.

It is for someone who wants to learn Gemara but finds it hard to follow the argument: a beginner, someone returning after years, or a Daf Yomi learner who wants to see the shape of the sugya before (or after) learning it with a teacher.

There are four ways in:

- **Sugya Flow** (guided): read the steps one by one with all the explanations.
- **Ameilus** (on your own): see the plain text, mark where you think each passage ends and guess what kind it is, then compare with the site's reading.
- **Classics**: 291 hand-picked famous passages from every masechta (stories, teachings and halachic sugyos), each opening at its exact first and last step. Two views (By Seder, Suggested order) and type buttons (Short stories, Longer stories, Big ideas, Halacha).
- **My words**: words you saved while learning, with flashcards.

The home page also shows today's Daf Yomi.

### Where the words come from

- **The Gemara text and its English translation** come from **Sefaria** (the William Davidson Edition, Koren Noé Talmud with Rabbi Adin Even-Israel Steinsaltz). Your browser fetches them from Sefaria directly each time. The licence (CC BY-NC 4.0) requires a credit, and every page shows it.
- **Everything else** (the step breakdown, the labels, the summaries, the explanations, the key terms) **was written by AI**, ahead of time, once for every amud. It is stored in the project as one file per amud. It has no haskama and has not been reviewed by a rav. Every amud, every search-engine page and the first visit say so. That notice must stay.
- **Corrections** are made by hand (with AI help), checked against the Gemara and Rashi, approved by David, and logged in `docs/content-repairs.md` so a rav can review them. Each week, the coming week's Daf Yomi amudim are checked before people learn them.

### The pieces, and where each one lives

| Piece | What it does | Where |
|---|---|---|
| **GitHub** (`dksherizen/gemara-clarity-site`) | Holds every file: the app, the AI content, the tools, these docs. | github.com |
| **Cloudflare** | Hosts the site. When something is pushed to GitHub, Cloudflare picks it up and it is live in about 2 minutes. Also counts visitors (Web Analytics, no cookies) and holds the domain names. Paid plan, $5 a month. | Cloudflare dashboard |
| **Sefaria** | Supplies the Gemara text, the translation and the Daf Yomi calendar. | sefaria.org (free public service) |
| **Firebase** project `gemara-clarity-accounts` | Optional "Sign in with Google", so bookmarks, history, settings and saved words follow you between devices. | Google Firebase console |
| **Google Search Console** | Tells Google the site exists and shows how it does in search. | search.google.com/search-console |
| **The course** at course.gemaraclarity.org | A separate Bava Metzia course. Gemara Clarity only passes visitors through to it. Out of scope for this repo. | Its own site |
| **The old original app** at gemara-clarity.netlify.app | The first version. Left up on purpose; the new site no longer reads anything from it. | Netlify + Firebase project `gemara-clarity` |

### How a visit works, in one paragraph

Someone opens gemaraclarity.org. Cloudflare sends them the app (a few files). The app works out which amud they asked for, fetches that amud's AI breakdown from this site and the Gemara text from Sefaria, and draws the page. A small "offline helper" in the browser keeps copies, so the app opens even without internet and amudim already seen still work. Nothing about the visitor is sent anywhere unless they choose to sign in.

### How changes go live, and how to undo them

Changing anything means changing a file in GitHub. A push to the `main` branch is live in about 2 minutes. Before a push, an automatic check looks for broken files and stops the push if it finds any; GitHub runs the same check again afterwards (a red X means look now). Undo is "revert the last change and push", again live in about 2 minutes. The exact commands are in the [runbook](docs/RUNBOOK.md).

### What it costs

Cloudflare Workers Paid: $5 a month (confirmed Nov 5 2026). The domain names renew through Cloudflare. Sefaria, Firebase (at this size), GitHub and Google Search Console cost nothing.

### Left out on purpose

- **No dedication on the site.** David removed it on Oct 12 2026. Don't add it back unless he asks.
- **No medical-advice note** on amudim that mention remedies. Not added; the general AI notice ("not for practical halacha, check with your teacher") stays.
- **The course site** (course.gemaraclarity.org) is a separate project. This repo only forwards visitors to it.
- **No ads, no tracking cookies, no account required.**

---

## Part 2: technical detail

### Stack in one line

A no-build, framework-free static web app (plain HTML, CSS and ES modules) plus a small Cloudflare Worker, deployed by Cloudflare's Git integration from `main`. Content is pre-generated JSON in the repo. The only runtime services are Sefaria's public API (text) and, for signed-in users only, Firebase Auth + Firestore. Node 18+ is needed only for the tools and tests; there is no `package.json` and nothing to install.

### Request flow

```
                         Browser (gemaraclarity.org, or the installed app)
                                         |
                    +--------------------+---------------------------+
                    |                                                |
          same-origin requests                             cross-origin requests
                    |                                                |
          [ sw.js service worker ]                     Sefaria API (www.sefaria.org)
          network first, cache fallback                  /api/texts/<Masechet>.<daf><a|b>   text + translation
                    |                                    /api/v3/texts/<ref>                verses (pasuk pop-up)
                    v                                    /api/calendars                     Daf Yomi
    Cloudflare  ->  _worker/index.js  (run_worker_first)   Firebase (only after "Sign in")
                    |                                      gstatic.com Firebase SDK 13.0.0
                    |-- host gemaraclarity.com / www.*  -> 301 to https://gemaraclarity.org (path + query kept)
                    |-- /__/auth/*, /__/firebase/*      -> proxied to gemara-clarity-accounts.firebaseapp.com
                    |-- host course.gemaraclarity.org   -> proxied to the course's own site (course-host.js)
                    |-- /course-site/*                  -> 404 on every other host
                    |-- /api/course-assertion,
                    |   /.well-known/course-assertion-jwks.json -> course sign-in (course-assertion.js)
                    |-- anything else                   -> static assets (env.ASSETS)
                    |       404 + a misspelled masechet path (/berachos/2a) -> 301 to /berakhot/2a/
                    |       any other missing path       -> /404.html
                    v
          static files from this repo (minus .assetsignore)
            /                     index.html -> app.js (hash router)
            /data/b/index.json    library list + data version
            /data/b/<id>.json?v=<version>   one amud breakdown
            /<masechet>/<daf>/    pre-built search-engine page (links into /#/...)
```

### Hosting and domains (Cloudflare)

- `wrangler.jsonc`: Worker `gemara-clarity-site`, entry `_worker/index.js`, static assets from the repo root bound as `ASSETS`, `run_worker_first: true` (the Worker sees every request before asset matching), `not_found_handling: "404-page"` (missing paths get `/404.html`).
- `.assetsignore` keeps `wrangler.jsonc`, `.git`, `.github`, `README.md`, `test`, `_worker`, `tools`, `docs`, `.githooks` from being served.
- Deploy: Cloudflare's GitHub integration builds and deploys on every push to `main` (the build settings live in the Cloudflare dashboard, not in the repo). There is no staging environment; a push to `main` is production.
- Domains: `gemaraclarity.org` is canonical. `gemaraclarity.com`, `www.gemaraclarity.com` and `www.gemaraclarity.org` 301 to it in the Worker. `course.gemaraclarity.org` is handled by the same Worker. DNS is in Cloudflare; it holds the Google Search Console TXT verification record (don't delete it).
- Plan: Workers Paid ($5/month), so every request running through the Worker has no daily cap.
- Worker secrets (set in the Cloudflare dashboard, never in the repo): `COURSE_ASSERTION_PRIVATE_JWK`, `COURSE_ASSERTION_EXTRA_PUBLIC_JWKS`. Without them the course sign-in endpoints answer 503/404 and the feature stays off.
- Analytics: Cloudflare Web Analytics (cookie-free), switched on in the Cloudflare dashboard. No analytics script is committed in this repo.

### `_worker/` files

| File | Role |
|---|---|
| `index.js` | Entry. Host redirects, Firebase auth proxy (so Google's chooser says "continue to gemaraclarity.org"), dispatch to course host / course assertion, static assets (with standard browser security headers added by `withSecurityHeaders`: HSTS, nosniff, Referrer-Policy, X-Frame-Options SAMEORIGIN, Permissions-Policy; deliberately no Content-Security-Policy because it could break Google sign-in), and `canonicalPath()`: on a 404 it maps alias spellings (`berachos`, `shabbos`, `bava_metzia`, upper case) to the real slug and 301s if that page exists. |
| `course-host.js` | `course.gemaraclarity.org` reverse-proxies to the course's origin (constant `COURSE_ORIGIN`), strips cookies and client-IP headers, rewrites same-origin redirects, answers `/api/config` with `{signin: COURSE_SIGNIN}` (currently `false`), 404s other `/api/*`. |
| `course-assertion.js` | `POST /api/course-assertion` (same-origin only, from `/course-link/`): verifies a Gemara Clarity Firebase ID token against Google's keys and returns a 5-minute ES256 assertion for the course (audience `morgan-course`); the ID token never leaves gemaraclarity.org. `GET /.well-known/course-assertion-jwks.json` publishes the public keys. |

`/course-link/index.html` is the noindex hop page a learner passes through when signing in to the course.

### The app (browser side)

| File | Role |
|---|---|
| `index.html` | Shell: top bar, steps sidebar, `<main id="view">`, bottom step bar, sheet dialog, toast. Loads `gc.css` and `app.js` as a module. No inline scripts (a test enforces this). |
| `app.js` (~2,300 lines) | Everything else: masechet table `MAS`, hash router, home page, daf picker (by perek / by Mishnah), Sugya Flow renderer, Classics, Daf Yomi, settings sheet, offline library, Report a mistake, AI notice, service-worker registration. Constants worth knowing: `MAS`, `TYPES` (the eight step kinds), `PHASES`, `CONTACT`, `CL_REV`, `DATA_CACHE = "gc2-data-v1"`. |
| `gc.css` | All styles, light and dark themes; one color variable per step kind per theme (tested). |
| `mishnah.js` | Marks a step "Mishnah" at display time from Sefaria's `מתני׳` / `גמ׳` markers. No AI involved. |
| `ameilus/core.js`, `ameilus/ui.js`, `ameilus/words.js` | Ameilus mode (v3.6.0): pure logic (tokenizing the amud, scoring the learner's passage marks), UI (`mountAmeilus(root, ctx)`), and one table of the words Ameilus uses about itself. |
| `mywords.js` | `#/words` list and `#/words/cards` flashcards (Leitner-style boxes). Words live in localStorage `gc-am3-mywords`; card state in `gc-mw-cards` (device only). |
| `acct.js` | Optional Google sign-in and sync. See "Accounts and sync" below. |
| `sw.js` | Service worker. See "Offline". |
| `manifest.json`, icons, `favicon*`, `og.png`, `logo-mark.svg`, `fonts/` | Installable PWA ("Gemara", standalone), self-hosted fonts (Spectral, Frank Ruhl, Noto Rashi Hebrew). |
| `data/perakim.json`, `data/perek-nikud.json` | Perek map (from Sefaria's chapter map) and vowelled perek names, for the picker and headers. |
| `data/mishnah/<Masechet>.json` | Each masechet's Mishnayos and where they sit, for the picker's "By Mishnah" tab. |
| `data/glossary.json` | Reading glossary used by Ameilus and word help. |
| `data/prose-nikud.json` | Display-only map that lets bare Hebrew words in the English prose borrow vowels. |

#### Routes (hash-based, handled by `route()` in `app.js`)

| Hash | Shows |
|---|---|
| `#/` | Home: Daf Yomi, ways to learn, recent, Classics teaser |
| `#/<Masechet>/<daf><a|b>` | The amud, in the reader's remembered mode (asks the first time) |
| `…/steps` (old alias `…/shiur`) | Sugya Flow |
| `…/s<n>` | Sugya Flow, jumped to step n |
| `…/ameilus` | Ameilus |
| `#/classics`, `#/classics/<id>` | Classics list / one Classic |
| `#/words`, `#/words/cards` | My words / flashcards |

Odd spellings and case are normalized in place (`routeCanon()`); anything that isn't a daf shows a "Daf not found" notice.

#### How an amud loads

1. `app.js` fetches `data/b/index.json` (cached 10 minutes) to learn the list of amudim and the **data version**.
2. It fetches `data/b/<Masechet>_<daf>_<a|b>.json?v=<version>` (`loadCloudAnalysis`). Because the version is in the URL, a correction reaches phones as soon as the version changes. If our file can't load, the page says so and offers a retry. (Since Nov 5 2026 there is **no fallback** to the old app's Firestore library; `FS_BASE` in `app.js` is a leftover constant.)
3. In parallel it fetches the Sefaria text for the amud (`/api/texts/<Masechet>.<daf><a|b>?context=0&commentary=0&pad=0`, cached 60 days), used for the Mishnah badge, Ameilus's raw text and the credit line.
4. It renders Sugya Flow (or mounts Ameilus) from the breakdown's `steps`. Classics point into the same steps (`data/classics.json`). Words saved from either mode go to My words.

`cachedJSON()` keeps responses in the Cache Storage bucket `gc2-data-v1` with a TTL, and serves the saved copy when offline.

Daf Yomi comes from Sefaria's calendar API; if that has no answer, `dafYomiLocal()` computes it from the cycle that began Jan 5 2020.

### Offline (`sw.js`)

- `V` at the top (for example `gc2-shell-vNNN-<tag>`) names the shell cache. On install the worker pre-saves `SHELL` (index, CSS, JS modules, fonts, icons, small data files). On activate it deletes older `gc2-*` shell caches but never `gc2-data*`.
- Fetch strategy for same-origin GETs: network first; if a saved copy exists and the network hasn't answered within 0.8 s, the saved copy is used. Amud files are answered early only by a copy of the **same data version**; an older version is used only when the network actually fails. `/__/` (sign-in) is never cached. Navigations to static daf pages (`/shabbat/21b/`) are not intercepted.
- Cross-origin requests (Sefaria) are not handled by the worker; `app.js` caches them itself.
- **Two version strings:** raise `V` in `sw.js` whenever an app file changes (so installed copies update). The **data version** in `data/b/index.json` is raised automatically by `tools/apply-repairs.mjs` whenever content changes. Raise `CL_REV` in `app.js` (and `V`) whenever `data/classics.json` changes.
- Settings › Offline can save whole masechtos or the whole library ahead of time.

### Accounts and sync (`acct.js`, Firebase `gemara-clarity-accounts`)

- Guests load nothing from Firebase. The Firebase SDK (13.0.0, from gstatic) is imported only when someone opens Sign in, or on later visits by someone who signed in.
- Google sign-in only. `authDomain` is `gemaraclarity.org`; the Worker proxies `/__/auth/*` and `/__/firebase/*` to Firebase so sign-in runs on our own domain.
- localStorage is the source of truth. The cloud copy is one Firestore document per user, `users/{uid}`, holding `schema`, `updatedAt` and `items`. Items are bookmarks, history (last 30), display settings (not text size), Ameilus progress and settings, saved words and a couple of flags, merged item by item, newest timestamp wins, with tombstones for deletions.
- Firestore rules (checked Nov 5 2026, kept in the Firebase console, not in this repo): a signed-in user can read, write and delete only their own document, and writes must have exactly those three fields.
- The Firebase web config in `acct.js` is public by design (it identifies the project; the rules protect the data).
- Users can delete their account and data from Menu › Account.

### The content: one AI-written file per amud

`data/b/` holds 5,349 amud files (about 300 MB) plus `index.json`.

**`data/b/index.json`**

```json
{ "generated": "...", "version": "202611060236-rev93-<batch-name>", "count": 5349,
  "ids": ["Berakhot_10_a", "Berakhot_10_b", "..."], "prefer": ["..."] }
```

`version` is the data version (timestamp, a running `revNN`, and the repair batch name). `count` must equal `ids.length` (checked). `prefer` is a legacy list from when some amudim also existed in the old Firestore library.

**`data/b/<Masechet>_<daf>_<a|b>.json`** (for example `Berakhot_2_a.json`)

Top level: `mainTopic` (one-line topic), `overview` (a paragraph), `steps` (1 to 62 steps; 127,389 steps across Shas).

Every step has:

| Field | Meaning |
|---|---|
| `stepNumber` | 1-based, must equal its position |
| `hebrewStepName` | The kind. One of eight: `מימרא` statement, `שאלה` question, `תשובה` answer, `קשיא` challenge, `תירוץ` resolution, `ראיה` proof, `דחיה` rejection, `מסקנא` conclusion. Drives the color. |
| `title` | Short step title |
| `stepSummary` | The line people read first. **Fix this too when correcting an error.** |
| `simpleTranslation` | Plain-English rendering of the step |
| `whatsHappening` | What the step does in the argument |
| `deeperAnalysis` | Longer explanation |
| `keyTerms` | `[{term, meaning}]`, terms with full nikud |
| `phrases` | `[{phraseNumber, aramaic, english, notes?}]`: the source text split phrase by phrase, in order, with English. Together the phrases cover the whole amud. |
| `classificationConfidence` | `High` / `Medium` / `Low` |
| `macroPhase` | Where the step sits in the sugya: `mishnah`, `opening_question`, `source_derivation`, `objection_defense_cycle`, `alternate_branch`, `clarification_of_terms`, `narrative_aggadah`, `conclusion` (shown via `PHASES` in `app.js`) |
| `branchRole` | `opens_new_branch`, `continues_current_line`, `alternative_approach`, `returns_to_previous_branch`, `conclusion_of_branch` |
| `scopeOfStep` | `legal_rule`, `source_reading`, `case_definition`, `general_logic`, `proof_mechanism`, `inference`, `wording`, `exception_case` |
| `dependsOnStepNumbers` | Earlier steps this one builds on |
| `triggerLanguage` | The Aramaic words that signal the kind (e.g. `מאי טעמא`, `איתיביה`) |
| `relationToPreviousStep` | One sentence |

Present on some steps, mostly by kind: `confusionAlert` ("Don't get confused"), `whatToRemember`, `whyThisMatters`, `alternativePossibleLabel`, `mimraCoreRuling` (statement), `sheelahInformationSought` / `teshuvahAnswerProvided` (question / answer), `kashyaTarget` / `kashyaAttackLogic` (challenge), `terutzResolutionType` / `terutzHavaAmina` / `terutzMaskana` (resolution; the type is free text such as "Narrowing the case (אוקימתא)"), `raayaObject` / `raayaSupportSource` (proof), `dechiyaRejectionScope` / `dechiyaFlawIdentified` (rejection), `maskanaFinalTakeaway` (conclusion). The app also supports an optional `marks` array (`unresolved`, `story`, `end-marker`) that adds tags to a step; no current file uses it.

`tools/check-site.mjs` requires `mainTopic`, `overview`, non-empty `steps`, a valid `hebrewStepName`, `title`, `stepSummary`, `whatsHappening`, `simpleTranslation`, and phrases with `aramaic` and `english` on every step.

**`data/classics.json`**: `{ note, build, groups, items }`. `groups` are the seven sections of the Suggested order, each with an `intro` saying what it trains (First win, Short stories, Getting hooked, Big ideas, Harder, First halachic sugyos, Following a halachic argument). Each of the 291 `items` has `id`, `title`, `summary`, `seder`, `masechta`, `start` and `end` (`{m, daf, step, words}`, pointing at real steps, checked), `steps`, `group`, `order` (one running number through the whole path; a "Then:" card comes right after its parent), `kind` (`short`, `story`, `idea` or `halacha`, for the type buttons; a "Then:" card takes its parent's), `reading`, and working notes (`status`, `note`, `source`, `summaryNote`). The 178 added on Nov 6 2026 have `source: "added-2026-11"`, and a `note` that ends "For the rav: …" where a start, end or reading is a judgment call. Titles and summaries are still marked as not yet approved wording. `data/classics-draft.json` is a working draft, not loaded by the app.

### How the content was generated

What the repo shows:

- The breakdowns were produced by **the original Gemara Clarity app** (gemara-clarity.netlify.app), which stored them in its Firestore project `gemara-clarity` (collection `gemara_cache_v5`). They were copied into `data/b/` as static JSON when this site was built (the "Data: …" commits of Oct 12–17 2026). `app.js` describes them as "generated with the original app's exact prompt".
- **The generator is not in the current tree.** A copy of the original pipeline was committed as `ai.js` in the first site commit (`16275196`, Oct 12 2026) and removed the same day (`99bf15f2`). It can be read with `git show 16275196:ai.js`. That copy: sends the amud's Sefaria Aramaic/Hebrew and English to the OpenAI Chat Completions API (model `gpt-5.4`, temperature 0.1, a JSON schema response) in chunks of 4 Sefaria segments, passing a summary of the previous steps; a long system prompt ("You are Gemara Clarity, a patient, clear chavrusa…") requires full, in-order phrase coverage, the eight step kinds by argumentative function, nikud on key terms, and separate steps for a hadran; a validator checks every source word is covered, rejects "fake restarts" across chunk boundaries, and retries once.
- **Not recorded in the repo:** whether every stored amud was made with exactly that model and prompt version, when the library was generated, and the Firestore rules or tooling of the old project. Treat the `ai.js` in history as the best available description, not a guarantee.
- The live site generates nothing. There is no AI call and no API key in the app (a test enforces this). Any new amud or regeneration would have to be done offline and committed as JSON.

### How corrections are made

1. Find the error (weekly Daf Yomi check, a "Report a mistake" email, a review).
2. Write a batch file in `tools/repairs/` (format in `tools/repairs/2026-11-05-review.json`): `{name, approved, repairs: [{id, step, field, find, replace, why, source}]}`. `step` is null for `overview` / `mainTopic`; `field` can be `phrases.<n>.english` (1-based).
3. `node tools/apply-repairs.mjs <batch> --dry` checks every `find` text appears **exactly once**. Without `--dry` it writes the files, raises the data version in `index.json`, prepends an entry to `docs/content-repairs.md` (what was wrong, the source, who approved it), and rebuilds the search pages. If any repair fails to match, nothing is written.
4. Fix every field that repeats the error (summary, explanation, overview), not just one.
5. Rav review: the logged corrections and `docs/content-repairs.md` / `docs/delicate-passages.md` are waiting for a rav. Nothing in the repo records a rav's sign-off yet.

Never hand-edit a `data/b` file: that skips the version raise, the log and the page rebuild. Full procedure: [RUNBOOK](docs/RUNBOOK.md).

### Search-engine pages (`tools/build-pages.mjs`)

The app is a single page behind `#/` routes, which search engines can't read. So a plain HTML page is generated for every amud from the same data:

- `/<masechet-slug>/<daf><a|b>/index.html` (5,349 pages): title, topic, overview, the first four phrases, the list of step titles color-coded by kind, prev/next links, the AI notice, the Sefaria credit, a "Report a mistake" link, and a button into the app (`/#/<Masechet>/<ref>/steps`).
- `/<masechet>/index.html` and `/learn/` are restyled in place (their lists came from an earlier build).
- `/about/`, `/privacy/`, `/404.html` (noindex) and `/sitemap.xml` (home, /learn/, /about/, 37 masechet pages, every amud) are written from templates in the script.
- Masechet names are read out of `MAS` / `MAS_DISPLAY` in `app.js`, so the pages and the app can't disagree. `CONTACT` is duplicated in both files.
- `node tools/build-pages.mjs --check` rebuilds in memory and fails if any page is stale. **These files are generated: never edit them by hand.**
- `robots.txt` allows everything and points at the sitemap. The site is verified in Google Search Console (domain property, DNS TXT record) with the sitemap submitted. Bing was skipped by choice.

### Safety checks

| Check | What it does | When it runs |
|---|---|---|
| `node tools/check-site.mjs` | Every script parses; every amud file is valid and complete; `index.json` count matches; every Classic points at a real step; other JSON parses; every file in `sw.js`'s `SHELL` exists; search pages are up to date. Plain-English output, exit 1 on any problem. | By hand, the pre-push hook, GitHub |
| `node --test test/site.test.mjs` | Unit and content tests, including: index.html local refs and no inline scripts; eight kinds with a color in both themes; Sefaria as source; no secrets and no writes to the old project; no client-side AI; PWA files; no placeholder text; Mishnah badge logic; data-version fetch; perakim coverage; picker/perek behavior. | By hand, GitHub |
| `.githooks/pre-push` | Runs `check-site.mjs`; blocks the push if it fails. Turn on per clone: `git config core.hooksPath .githooks`. | On `git push` from that clone |
| `.github/workflows/check.yml` | "Check the site": Node 22, runs both of the above on every push and pull request. | GitHub Actions |

Cloudflare deploys on push regardless of the GitHub check, so a red X on `main` means something broken may already be live: fix or revert at once.

### Local preview

`python -m http.server 8765`, then http://localhost:8765 (also in `.claude/launch.json`). This serves the static files only: the Worker (redirects, sign-in proxy, course) does not run, and sign-in won't work.

### Deploy and undo

Commit and push to `main`; live in about 2 minutes. Undo with `git revert HEAD` and push. Commit history is the audit trail: content commits name the amud, step and field, the data version, and who approved them.

### Folder map

```
index.html  app.js  gc.css  acct.js  mishnah.js  mywords.js   the app
ameilus/                      Ameilus mode (core, ui, words)
sw.js  manifest.json          offline worker, PWA manifest
fonts/  *.png  *.svg          fonts, icons, logo, share image
data/b/                       5,349 AI breakdowns + index.json (data version)
data/classics.json            the 291 Classics
data/mishnah/  data/perakim.json  data/perek-nikud.json  data/glossary.json  data/prose-nikud.json
<masechet>/<daf>/index.html   GENERATED search pages (37 masechet folders)
learn/  about/  privacy/  404.html  sitemap.xml   GENERATED
course-link/                  hop page for course sign-in (noindex)
robots.txt
_worker/                      Cloudflare Worker (not served)
wrangler.jsonc  .assetsignore Cloudflare config / what not to serve
tools/                        build-pages, apply-repairs, check-site; repairs/ batch files (not served)
test/                         site.test.mjs (not served)
docs/                         RUNBOOK, content-repairs log, delicate passages (not served)
.githooks/  .github/          pre-push hook, GitHub Action (not served)
```

### Things outside the repo

Kept in dashboards, not in Git: Cloudflare build settings, DNS, Worker secrets and Web Analytics; Firebase Auth settings (authorized domains: gemaraclarity.org, course.gemaraclarity.org, localhost, Firebase's own) and Firestore rules; Google Search Console; the old Netlify app and its Firebase project `gemara-clarity`; the course site's own hosting. Contact address for reports: see `CONTACT` in `app.js` and the runbook.

### History in brief

- Oct 12 2026: site shell and the full AI library imported from the original app; the dedication removed; the in-browser generator (`ai.js`) removed.
- Oct 15 2026: moved to Cloudflare Workers with static assets.
- Oct 20–23 2026: optional Google sign-in and sync; sign-in on gemaraclarity.org itself.
- Oct 21 2026: search-engine pages for every daf.
- Oct 25 2026: My words page. Late Oct: course.gemaraclarity.org proxied; redesign; new logo; Classics.
- Ongoing: weekly Daf Yomi content checks and numbered repair batches.
- Nov 5 2026: a 13-reviewer review led to three batches of fixes, the About/Privacy pages, Report a mistake, the safety checks, `apply-repairs`, the runbook, and the end of the fallback to the old library.
- Nov 6 2026: 178 new Classics (291 in all, every masechta), a seven-group Suggested order, and type buttons on the Classics screen.

`git log --oneline` has the full story (over 750 commits).
