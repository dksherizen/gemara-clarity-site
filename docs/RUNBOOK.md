# Gemara Clarity runbook

How the site works and how to change it safely. Written Nov 5 2026 for David and for anyone (person or AI) who helps him.

## What runs where

| Piece | Where | Notes |
|---|---|---|
| Code and content | GitHub: `dksherizen/gemara-clarity-site`, branch `main` | **A push to `main` goes live within about 2 minutes.** |
| Hosting | Cloudflare (Workers + static assets), account owned by David | `wrangler.jsonc` configures it. Domains: gemaraclarity.org (main), gemaraclarity.com and www (both redirect). Workers Paid plan ($5/month, confirmed Nov 5 2026), so there is no daily request cap to hit. |
| Visitor numbers | Cloudflare dashboard › Web Analytics | Cookie-free. |
| Google Search | Google Search Console, domain property `gemaraclarity.org` (verified Nov 5 2026) | Verified by a TXT record `google-site-verification=…` in Cloudflare DNS. **Don't delete that record.** Sitemap submitted. |
| Sign-in and synced data | Firebase project `gemara-clarity-accounts` | Google sign-in only; allowed sign-in addresses are gemaraclarity.org, course.gemaraclarity.org, localhost and Firebase's own (Tab's old test copy removed Nov 5 2026). Each user's data is one document, `users/{uid}`. Firestore rules (checked Nov 5 2026): a signed-in user can read, write and delete only their own document, and writes must have exactly `schema`, `updatedAt` and `items`. |
| The Gemara text | Sefaria's public API, fetched by the browser | Credited on every page (William Davidson Edition, CC BY-NC 4.0). |
| Old original app | gemara-clarity.netlify.app, Firebase project `gemara-clarity` | Left up on purpose. The new site no longer reads from it. |
| Course site | course.gemaraclarity.org | The Worker passes it through to the course's own site on Tab hosting (`_worker/course-host.js`). Course sign-in uses two Worker secrets: `COURSE_ASSERTION_PRIVATE_JWK` and `COURSE_ASSERTION_EXTRA_PUBLIC_JWKS`. |
| Contact | dksherizen@gmail.com | Used by "Report a mistake", /about/ and /privacy/. To change it, edit `CONTACT` in `app.js` and in `tools/build-pages.mjs`, then rebuild the pages. |

## The folders

- `index.html`, `app.js`, `gc.css`, `acct.js`, `ameilus/`, `mywords.js`, `mishnah.js`: the app.
- `sw.js`: the offline worker. **When you change any app file, raise the version string `V` at the top**, so phones pick up the change.
- `data/b/<Masechet>_<daf>_<a|b>.json`: one AI-written breakdown per amud. `data/b/index.json` lists them and holds the data version.
- `data/classics.json`: the 291 Classics (with their Suggested-order group and type). After editing it, raise `CL_REV` in `app.js` (and `V` in `sw.js`) so phones fetch the new list at once.
- `<masechet>/<daf>/index.html`, `/learn/`, `/about/`, `/privacy/`, `404.html`, `sitemap.xml`: the pages built for search engines. **Never edit these by hand.** They come from `tools/build-pages.mjs`.
- `_worker/`: the Cloudflare Worker (domain redirects, sign-in proxy, course, spelling redirects such as /berachos/2a/ to /berakhot/2a/).
- `tools/`: the tools below. `docs/`: this file and the content-repair log. Neither is served to visitors (`.assetsignore`).

## Everyday jobs

**See the site on your computer before it goes live**

```
python -m http.server 8765
```
Then open http://localhost:8765. (Sign-in won't work there.)

**Fix a mistake in the content**

1. Write the fix as a small JSON file in `tools/repairs/`. Copy the format of `tools/repairs/2026-11-05-review.json`. Each repair gives the amud, the step, the field, the exact text that is there now, the new text, what was wrong, and the source.
2. `node tools/apply-repairs.mjs tools/repairs/<file>.json --dry` checks that every repair still matches.
3. `node tools/apply-repairs.mjs tools/repairs/<file>.json` applies them. It also raises the data version (so phones fetch the fix), logs each change in `docs/content-repairs.md`, and rebuilds the search pages.
4. Fix **every** field that says the wrong thing: the summary people read first, the explanation, the overview. A fix to the hidden explanation alone leaves the old error on screen.
5. A step's label (Statement, Question, Challenge, Proof…) is the field `hebrewStepName`. Label it by the rules in `docs/step-labels.md` (set by David, Nov 6 2026), and fix any title or "relation" line that names the old kind.

**Check everything before it goes live**

```
node tools/check-site.mjs
node --test test/site.test.mjs
```
On this computer a push runs the check automatically and stops if something is broken (`.githooks/pre-push`, enabled with `git config core.hooksPath .githooks`). GitHub also runs it after every push: a red X on the commit means look now, because Cloudflare will already have deployed it.

**Put changes live:** commit and push to `main`.

**Undo the last change on the live site:** `git revert HEAD` and push. The previous version is live again within about 2 minutes.

## Rules that keep it safe

- Content changes go through `tools/apply-repairs.mjs`, never by hand-editing a JSON file. A hand edit skips the version raise and the search-page rebuild.
- Any change to an app file means raising `V` in `sw.js`.
- **Help changes with the app.** When you add, rename or remove anything people tap or switch, change its Help topic in the same commit. All Help topics are at the end of `app.js` (the Ameilus one is at the end of `ameilus/ui.js`), written in plain words. `node --test test/site.test.mjs` fails if Help names a button or setting that is no longer in the app, or if a Settings switch is not explained anywhere in Help.
- Keep the AI notice (first visit, every amud, every search page). Keep the Sefaria credit (its licence requires it).
- Don't add the dedication back unless David asks. He chose to remove it on Oct 12 2026.

## Open items (Nov 5 2026)

- Bing Webmaster Tools: skipped by choice (Nov 5 2026). It can import the Google Search Console setup later.
- Classics: all 291 summaries are still marked "not approved wording". The 178 added on Nov 6 2026 were read against the Gemara; 96 of them have a note for the rav (search `classics.json` for "For the rav").
- A rav should review the corrections in `docs/content-repairs.md` and the delicate passages.
- Weekly Daf Yomi checks: Daf Yomi stays in Kodashim and Taharos until June 2027, where the AI makes the most mistakes. Checked against the Gemara and Rashi so far (Nov 6 2026): Bekhorot 51a–61a and Arakhin 2a–20b. Next: Arakhin 21a onward (learners reach it about Dec 8).
- Berakhot 2a–64a was checked line by line, text and labels, on Nov 6 2026.
- Step labels across Shas: on Nov 6 2026 every step flagged by four automatic signals (Rejection after a Challenge or an answer, Conclusion in the middle, "ולא פליגי" as Resolution) and every Proof opening with an attack word was checked against `docs/step-labels.md`; about 2,000 labels were fixed. Not yet decided by David: how to label a יוכיח / מה ל… chain where the amud itself mixes styles (Menachot 5b–6a held back), and "ואידך" replies.
