// Gemara Clarity — builds the pages made for search engines, from the data the app uses.
//
//   node tools/build-pages.mjs          rebuild every page and sitemap.xml
//   node tools/build-pages.mjs --check  rebuild into memory only and report any page that is out of date (exit code 1 if so)
//
// What it writes:
//   /<masechet>/<daf><a|b>/index.html   one page per amud, from data/b/<Masechet>_<daf>_<a|b>.json
//   /<masechet>/index.html and /learn/  restyled in place (their lists come from the original build and rarely change)
//   /sitemap.xml
//
// Run it after ANY change to data/b/ (a repair, a new amud), so the search pages never show wording that was already fixed.
// No packages to install: plain Node 18+.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://gemaraclarity.org";
const CHECK = process.argv.includes("--check");
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");

// ---- masechet names: taken from app.js so the app and these pages can never disagree ----
const appJs = rd("app.js");
const MAS = Function(`return ${appJs.match(/const MAS = (\[[\s\S]*?\]\]);/)[1]}`)();          // [dataName, hebrew, firstAmudIdx, endIdx]
const MAS_DISPLAY = Function(`return ${appJs.match(/const MAS_DISPLAY = (\{[\s\S]*?\});/)[1]}`)();
const disp = m => MAS_DISPLAY[m] || m.replace(/_/g, " ");
const plain = m => m.replace(/_/g, " ");
const slug = m => m.toLowerCase().replace(/_/g, "-");
const HE = Object.fromEntries(MAS.map(([m, he]) => [m, he]));
const ORDER = Object.fromEntries(MAS.map(([m], i) => [m, i]));

// ---- small helpers ----
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const clean = s => String(s ?? "").replace(/<\/?(big|strong|b|i|small|span|sup)[^>]*>/gi, "").replace(/\s+/g, " ").trim(); // Sefaria formatting tags never show as text
const cut = (s, n) => { s = clean(s); if (s.length <= n) return s; let c = s.slice(0, n); const i = c.lastIndexOf(" "); if (i > 0) c = c.slice(0, i); return c.replace(/[\s,;:.\-–—(]+$/, "") + "…"; };
const shortTopic = t => { t = clean(t); const first = t.split(/[:;]\s/)[0].trim(); return first !== t && first.length >= 12 && first.length <= 64 ? first : cut(t, 64); };
const gem = n => { const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"], tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"], hund = ["", "ק", "ר", "ש", "ת"];
  let s = hund[Math.floor(n / 100)] + tens[Math.floor((n % 100) / 10)] + ones[n % 10];
  s = s.replace("יה", "טו").replace("יו", "טז");
  return s.length === 1 ? s + "׳" : s.slice(0, -1) + "״" + s.slice(-1); };
const KIND = { "מימרא": ["mimra", "Statement"], "קשיא": ["kashya", "Challenge"], "תירוץ": ["terutz", "Resolution"], "ראיה": ["raaya", "Proof"], "דחיה": ["dechiya", "Rejection"], "שאלה": ["sheelah", "Question"], "תשובה": ["teshuvah", "Response"], "מסקנא": ["maskana", "Conclusion"] };

// ---- shared look: the app's light parchment theme ----
const CSS = `@font-face{font-family:'Frank Ruhl Libre';font-weight:300 900;font-display:swap;src:url(/fonts/frank-ruhl-hebrew.woff2) format('woff2');unicode-range:U+0590-05FF,U+FB1D-FB4F}
@font-face{font-family:'Spectral';font-weight:400;font-display:swap;src:url(/fonts/spectral-normal-400-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2010-205E}
@font-face{font-family:'Spectral';font-weight:600;font-display:swap;src:url(/fonts/spectral-normal-600-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+2010-205E}
*{box-sizing:border-box}body{margin:0;background:#fbf9f4;color:#2a241d;font:17px/1.6 'Spectral',Georgia,'Frank Ruhl Libre',serif}
main,footer,.bar-in{max-width:880px;margin:0 auto;padding:0 18px}
.bar{background:#2a1d15;color:#f3ece0}.bar-in{display:flex;align-items:center;gap:10px;min-height:48px}
.brand{display:inline-flex;align-items:center;gap:8px;color:#f3ece0;text-decoration:none;font-weight:600;letter-spacing:.02em}.brand img{width:26px;height:26px}.brand .he{color:#c9a24e;font-size:20px}
a{color:#0959c6}h1{font-size:30px;line-height:1.25;margin:18px 0 2px;color:#1a1612}h2{font-size:20px;margin:28px 0 8px;color:#1a1612}
.he,[lang=he],[lang=arc]{font-family:'Frank Ruhl Libre','SBL Hebrew','Times New Roman',serif}
.crumbs{margin-top:14px}.crumbs,.mu{color:#6b6358;font-size:15px}.crumbs a{color:#6b6358}.hl{font-size:22px;color:#6b6358;margin:0}
.ai{background:#f6efdc;color:#5c3a0a;border:1px solid #e6d6ad;border-radius:3px;padding:10px 14px;margin:14px 0;font-size:15px}
.btn{display:inline-flex;align-items:center;min-height:48px;padding:0 22px;border-radius:3px;background:#1a1612;color:#fbf9f4;font-weight:600;text-decoration:none;margin:8px 0}
.card{background:#fff;border:1px solid #e3ddd0;border-radius:3px;padding:12px 16px;margin:10px 0}.ar{font-size:23px;line-height:1.7;margin:0 0 4px;text-align:right;color:#1a1612}.card p{margin:0}
ol{padding-left:24px}li{margin:7px 0}
.k{display:inline-block;font:600 13px/1.6 Georgia,serif;color:#fff;border-radius:3px;padding:0 7px;margin-right:8px;vertical-align:1px}
.mimra{background:#0959c6}.kashya{background:#831228}.terutz{background:#147b41}.raaya{background:#3d058b}.dechiya{background:#bc450d}.sheelah{background:#856810}.teshuvah{background:#14707e}.maskana{background:#ba0ea5}
.pn{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:26px 0}.pn a,.chips a,.crumbs a{display:inline-flex;align-items:center;min-height:44px}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips a{justify-content:center;min-width:52px;padding:0 10px;border:1px solid #e3ddd0;border-radius:3px;background:#fff;text-decoration:none}
footer{color:#6b6358;font-size:14px;line-height:1.55;padding-top:6px;padding-bottom:40px;margin-top:34px;border-top:1px solid #e3ddd0}footer a{color:#6b6358}`;

const AI_NOTICE = `<p class="ai"><b>AI-generated study aid.</b> The topic, overview, translations and step titles on this page were written by AI. They have no haskama, have not been reviewed by a rav, and may contain mistakes. Not for practical halacha: check them against the Gemara and with your teacher.</p>`;
const CREDIT = `Hebrew and Aramaic text, and the translation the English lines are based on: <a href="https://www.sefaria.org/">Sefaria</a>, William Davidson Edition (Koren Noé Talmud, with commentary by Rabbi Adin Even-Israel Steinsaltz), licensed <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a>. Explanations and step breakdowns are AI-generated.`;
const CONTACT = "dksherizen@gmail.com"; // keep in step with CONTACT in app.js
const mailto = (subject, body = "") => `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;
const FOOTER = (report = mailto("Gemara Clarity: a mistake or a question")) => `<footer><p><a href="/">Gemara Clarity</a> · <a href="/learn/">All masechtot</a> · <a href="/about/">About</a> · <a href="/privacy/">Privacy</a> · <a href="${esc(report)}">Report a mistake</a></p><p>${CREDIT}</p></footer>`;
const HEADER = `<header class="bar"><div class="bar-in"><a class="brand" href="/"><img src="/logo-mark.svg" alt="" width="26" height="26"><span class="he" lang="he">גמרא</span><span>Gemara Clarity</span></a></div></header>`;
const head = ({ title, desc, url, type }) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="Gemara Clarity"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og.png"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#2a1d15"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/icon-192.png" type="image/png"><style>${CSS}</style></head>`;

// ---- the amud list, in Shas order ----
const index = JSON.parse(rd("data/b/index.json"));
const parse = id => { const m = id.match(/^(.*)_(\d+)_([ab])$/); return { id, m: m[1], daf: +m[2], amud: m[3] }; };
const ids = index.ids.map(parse).sort((a, b) => ORDER[a.m] - ORDER[b.m] || a.daf - b.daf || a.amud.localeCompare(b.amud));

function amudPage(a, prev, next) {
  const j = JSON.parse(rd(`data/b/${a.id}.json`));
  const ref = `${a.daf}${a.amud}`, name = disp(a.m), en = `${name} ${ref}`;
  const alt = plain(a.m) !== name ? ` (${plain(a.m)} ${ref})` : "";
  const url = `${SITE}/${slug(a.m)}/${ref}/`;
  const phrases = j.steps.flatMap(s => s.phrases || []).slice(0, 4);
  const link = (x, label) => x ? `<a href="/${slug(x.m)}/${x.daf}${x.amud}/">${label(`${disp(x.m)} ${x.daf}${x.amud}`)}</a>` : "<span></span>";
  return head({ title: `${en}: ${shortTopic(j.mainTopic)} | Gemara Clarity`, desc: `${en}${alt}: ${cut(j.overview, 150)}`, url, type: "article" })
    + `<body>${HEADER}<main>`
    + `<nav class="crumbs"><a href="/learn/">All masechtot</a> <span>›</span> <a href="/${slug(a.m)}/">${esc(name)}</a> <span>›</span> <span>${ref}</span></nav>`
    + `<h1>${esc(en)}</h1><p class="hl" lang="he" dir="rtl">${HE[a.m]} ${gem(a.daf)} ע״${a.amud === "a" ? "א" : "ב"}</p>`
    + (alt ? `<p class="mu">${esc(plain(a.m))} ${ref}</p>` : "")
    + AI_NOTICE
    + `<p>Learn ${esc(en)} step by step: Aramaic beside English, every question, answer and proof color-coded.</p>`
    + `<p><a class="btn" href="/#/${a.m}/${ref}/steps">Open ${esc(en)} in Gemara Clarity</a></p>`
    + `<h2>Topic</h2><p>${esc(clean(j.mainTopic))}</p><h2>Overview</h2><p>${esc(clean(j.overview))}</p>`
    + `<h2>Opening lines</h2>` + phrases.map(p => `<div class="card"><p class="ar" lang="arc" dir="rtl">${esc(clean(p.aramaic))}</p><p>${esc(clean(p.english))}</p></div>`).join("")
    + `<h2>The steps (${j.steps.length})</h2><ol>` + j.steps.map(s => { const [c, l] = KIND[s.hebrewStepName] || ["mimra", "Statement"]; return `<li><b class="k ${c}">${l}</b>${esc(clean(s.title))}</li>`; }).join("") + `</ol>`
    + `<nav class="pn">${link(prev, t => `‹ ${esc(t)}`)}<a href="/${slug(a.m)}/">${esc(name)} index</a>${link(next, t => `${esc(t)} ›`)}</nav>`
    + `</main>${FOOTER(mailto(`Gemara Clarity: mistake in ${en}`, `Where: ${en}
Link: ${url}

What is wrong:


What it should say (and a source, if you know one):

`))}</body></html>`;
}

// Masechet index pages and /learn/: keep their main content, give them the new head, header and footer.
function restyle(file) {
  const old = rd(file);
  const title = old.match(/<title>([\s\S]*?)<\/title>/)[1], desc = old.match(/name="description" content="([^"]*)"/)[1];
  const url = old.match(/rel="canonical" href="([^"]*)"/)[1], type = old.match(/property="og:type" content="([^"]*)"/)[1];
  const main = old.match(/<main>[\s\S]*<\/main>/)[0].replace(/<a class="btn" href="\/#\/">Open Gemara Clarity<\/a>/, `<a class="btn" href="/">Open Gemara Clarity</a>`);
  const un = s => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  return head({ title: un(title), desc: un(desc), url, type }) + `<body>${HEADER}${main}${FOOTER()}</body></html>`;
}

// ---- About and Privacy (plain pages; edit the text here, then run the tool) ----
const textPage = (file, title, desc, body) => [file, head({ title, desc, url: `${SITE}/${file.replace(/index\.html$/, "")}`, type: "website" }) + `<body>${HEADER}<main>${body}</main>${FOOTER()}</body></html>`];
const ABOUT = textPage("about/index.html", "About Gemara Clarity", "What Gemara Clarity is, how its explanations are made and checked, and how to report a mistake.", `
<h1>About Gemara Clarity</h1>
<p>Gemara Clarity lays out every sugya in Shas step by step: the Aramaic beside English, phrase by phrase, with each statement, challenge, answer, proof and conclusion marked and colour-coded. You can follow a guided explanation (Sugya Flow) or work through the text yourself (Ameilus). It is free, has no ads, and works offline.</p>
<p>Gemara Clarity is a free, non-commercial project made by David Sherizen.</p>
<h2>Where the content comes from</h2>
<p>The Hebrew and Aramaic text, and the translation the English lines are based on, come from <a href="https://www.sefaria.org/">Sefaria</a>: the William Davidson Edition (Koren Noé Talmud, with commentary by Rabbi Adin Even-Israel Steinsaltz), licensed <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a>.</p>
<p>The explanations, the step-by-step breakdowns, the step titles and the summaries were <b>written by AI</b>. They have no haskama and have not been reviewed by a rav. They can contain mistakes, and they are not for practical halacha. Please check them against the Gemara and with your teacher.</p>
<h2>How mistakes get fixed</h2>
<p>Ahead of each week of Daf Yomi, the coming amudim are checked against the Gemara and Rashi, and mistakes are corrected. Corrections reach the app and these pages together. Review by a rav is planned.</p>
<p>If you spot a mistake, use <b>Report a mistake</b> on the amud or on any step in the app, or write to <a href="${mailto("Gemara Clarity: a mistake or a question")}">${CONTACT}</a>. Please say which amud and step, what is wrong, and a source if you know one.</p>
<h2>Contact</h2>
<p>Questions, suggestions and corrections: <a href="mailto:${CONTACT}">${CONTACT}</a>. See also the <a href="/privacy/">privacy notice</a>.</p>`);
const PRIVACY = textPage("privacy/index.html", "Privacy | Gemara Clarity", "What Gemara Clarity stores, where, and how to delete it.", `
<h1>Privacy</h1>
<p class="mu">Last updated November 2026</p>
<p>Gemara Clarity has no ads, does not sell or share your information, and does not use tracking cookies. You can use all of it without an account.</p>
<h2>Without an account</h2>
<p>Your bookmarks, recent amudim, settings, saved words and Ameilus progress are kept only in your browser on this device. Amudim you open are also saved there so they work offline. To erase all of it, open <b>Menu › Settings</b> and choose <b>Clear my bookmarks, history and saved data</b>.</p>
<h2>If you sign in (optional)</h2>
<p>Signing in with Google keeps your learning in step across your devices. It uses Google Firebase. Your name, email address and profile photo from Google are shown in the app, and the following are stored in Firebase under your account: bookmarks, the last 30 amudim you opened and when, your settings, your saved words and your Ameilus progress. They are used only to sync your learning.</p>
<p>To delete them, open <b>Menu › Account › Delete account</b>. This removes your saved data and your sign-in from Gemara Clarity. You can also write to us and we will delete it for you.</p>
<p>If you use the separate Gemara Clarity course site and sign in there with your Gemara Clarity account, your account ID, name and email address are shared with that site so it can sign you in.</p>
<h2>Services the site uses</h2>
<ul>
<li><b>Cloudflare</b> hosts the site. It counts visits and measures page speed with Cloudflare Web Analytics, which uses no cookies and does not track you across sites.</li>
<li><b>Sefaria</b> supplies the Gemara text and the Daf Yomi calendar. Your browser fetches these from Sefaria directly, so Sefaria sees an ordinary web request, as with any website.</li>
<li><b>Google Firebase</b> handles sign-in and synced data, only if you sign in.</li>
</ul>
<h2>Contact</h2>
<p>Questions or requests about your data: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>`);

// Served by Cloudflare for any address that doesn't exist (wrangler.jsonc: not_found_handling "404-page"). Links are absolute, since it can appear at any depth.
const NOT_FOUND = ["404.html", head({ title: "Page not found | Gemara Clarity", desc: "This page doesn't exist.", url: `${SITE}/`, type: "website" }).replace("<head>", '<head><meta name="robots" content="noindex">') + `<body>${HEADER}<main>
<h1>Page not found</h1>
<p>There's no page at this address. It may have been mistyped.</p>
<p><a class="btn" href="/">Open Gemara Clarity</a></p>
<p>To find an amud, open Gemara Clarity and tap <b>Choose a daf</b>, or browse <a href="/learn/">all masechtos</a>. Page addresses look like <a href="/berakhot/2a/">gemaraclarity.org/berakhot/2a</a>.</p>
</main>${FOOTER()}</body></html>`];

// ---- build ----
const out = new Map();
ids.forEach((a, i) => out.set(`${slug(a.m)}/${a.daf}${a.amud}/index.html`, amudPage(a, ids[i - 1], ids[i + 1])));
for (const [m] of MAS) { const f = `${slug(m)}/index.html`; if (fs.existsSync(path.join(ROOT, f))) out.set(f, restyle(f)); }
out.set("learn/index.html", restyle("learn/index.html"));
for (const [f, html] of [ABOUT, PRIVACY, NOT_FOUND]) out.set(f, html);
const urls = [`${SITE}/`, `${SITE}/learn/`, `${SITE}/about/`, ...MAS.filter(([m]) => fs.existsSync(path.join(ROOT, slug(m), "index.html"))).map(([m]) => `${SITE}/${slug(m)}/`), ...ids.map(a => `${SITE}/${slug(a.m)}/${a.daf}${a.amud}/`)];
out.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);

let changed = 0;
for (const [f, html] of out) {
  const p = path.join(ROOT, f), cur = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
  if (cur !== null && cur.replace(/\r\n/g, "\n") === html) continue; // Windows checkouts may hold CRLF line endings
  changed++;
  if (CHECK) { if (changed <= 20) console.log("out of date:", f); continue; }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
}
console.log(`${out.size} files, ${changed} ${CHECK ? "out of date" : "written"}.`);
if (CHECK && changed) process.exit(1);
