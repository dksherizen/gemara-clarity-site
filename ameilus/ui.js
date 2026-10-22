// Ameilus v3 UI. Self-contained: mountAmeilus(root, ctx) renders one amud into `root` and owns
// only elements inside it plus the word sheet it appends to document.body. The host passes data
// and callbacks, so the same module can drop into Gemara Clarity behind a Shiur/Ameilus switch.
import * as C from "./core.js?v=3.6.0";
import { AMW } from "./words.js?v=3.6.0";

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const he = s => `<span class="he" dir="rtl" lang="he">${esc(s)}</span>`;
const KIND_NIKUD = { "מימרא":"מֵימְרָא", "קשיא":"קֻשְׁיָא", "תירוץ":"תֵּירוּץ", "שאלה":"שְׁאֵלָה", "ראיה":"רְאָיָה", "תשובה":"תְּשׁוּבָה", "דחיה":"דְּחִיָּה", "מסקנא":"מַסְקָנָא" }; // step-type labels with their vowels (display only; same forms as app.js STEP_NIKUD)
// Guess the kind first (opt-in in Aa > Ameilus, off by default; two taps). After a passage is marked and
// before "Show our reading": tap 1 = what the passage does, tap 2 = which kind in that group. The answer is the step's own kind in the data
// (hebrewStepName), the same label the reading shows. A miss gets a pointer to where to look, in directional words only. Kind names are Ameilus's own (KIND_EN).
export const GUESS_FAM = [
  { k: "states", label: "States or supports", sub: "Puts a point forward or backs one up", kinds: ["מימרא", "ראיה", "מסקנא"] },
  { k: "asks", label: "Asks", sub: "Wants to know something", kinds: ["שאלה"] },
  { k: "pushes", label: "Pushes against something", sub: "Finds a problem, or sets a proof aside", kinds: ["קשיא", "דחיה"] },
  { k: "responds", label: "Responds", sub: "Answers what came just before", kinds: ["תירוץ", "תשובה"] }
];
export const GUESS_KIND = { "מימרא": "Puts a point or ruling forward", "ראיה": "Brings a source to back a point up", "מסקנא": "Wraps up what came before",
  "שאלה": "Asks for information", "קשיא": "Raises a problem with what was said", "דחיה": "Sets aside a proof that was just brought",
  "תירוץ": "Settles a problem that was raised", "תשובה": "Answers a question that was asked" };
const GUESS_LOOK = { "מימרא": "Look at whether it puts a point of its own on the table.", "ראיה": "Look at what it brings in to back a point up.",
  "מסקנא": "Look at whether it wraps up what came before.", "שאלה": "Look at whether it simply wants to know something.",
  "קשיא": "Look at whether it finds a problem with what was said.", "דחיה": "Look at what it does to the proof just brought.",
  "תירוץ": "Look at who it's answering: a problem was raised just before it.", "תשובה": "Look at who it's answering: a question was asked just before it." };
const GUESS_NOT = { states: "It isn't just putting a point forward.", asks: "It isn't asking for information.", pushes: "It's not attacking anything.", responds: "It isn't answering anything." };
const GUESS_CLOSE = { "קשיא>דחיה": "Close: it does push against something, but it doesn't raise a new problem.", "דחיה>קשיא": "Close: it does push against something, but there's no proof here for it to set aside.",
  "תירוץ>תשובה": "Close: it does respond, but nothing was challenged.", "תשובה>תירוץ": "Close: it does respond, but to a problem, not a plain question.",
  "מימרא>ראיה": "Close: right group, but it isn't a point of its own.", "מימרא>מסקנא": "Close: right group, but it isn't a fresh point.",
  "ראיה>מימרא": "Close: right group, but it doesn't bring in a source as support.", "ראיה>מסקנא": "Close: right group, but it isn't bringing support.",
  "מסקנא>מימרא": "Close: right group, but nothing is being wrapped up yet.", "מסקנא>ראיה": "Close: right group, but it doesn't wrap anything up." };
export const guessFamOf = kind => (GUESS_FAM.find(f => f.kinds.includes(kind)) || {}).k || null;
// pick: a group key (tap 1) or a kind (tap 2); real: the step's kind. -> null on a hit, else the pointer line (directional words only)
export function guessHint(pick, real){
  const rf = guessFamOf(real), look = GUESS_LOOK[real] || "";
  if (!rf) return null;
  if (GUESS_KIND[pick]) return pick === real ? null : `${GUESS_CLOSE[pick + ">" + real] || (guessFamOf(pick) === rf ? "Close: right group." : GUESS_NOT[guessFamOf(pick)] || "")} ${look}`.trim();
  if (pick === rf) return null;
  if (pick === "asks" && rf === "pushes") return `It's worded like a question, but it isn't asking for information. ${look}`;
  return `${GUESS_NOT[pick] || ""} ${look}`.trim();
}
// English sentences with Hebrew words inside: wrap Hebrew runs so they render with the Hebrew font
const mixed = s => esc(s).replace(/([\u0590-\u05FF][\u0590-\u05FF\u05F3\u05F4"'׳״\- ]*[\u0590-\u05FF׳״]|[\u0590-\u05FF])/g, m => `<span class="he" lang="he">${m}</span>`);
const LONG_MS = 480, MOVE_PX = 10;
const MW_KEY = "gc-am3-mywords", WALK_KEY = "gc-am3-walk", SHOW_KEY = "gc-am3-show"; // WALK_KEY: the first-use walkthrough was seen on this device // SHOW_KEY: the page-wide vowels/punctuation toggles, per device
const bareRaw = w => String(w || "").replace(/[\u05F3\u05F4'"]/g, "");

export const myWords = {
  all(){ try { return JSON.parse(localStorage.getItem(MW_KEY) || "[]"); } catch { return []; } },
  has(w){ return this.all().some(x => x.raw === w); },
  add(x){ const a = this.all().filter(y => y.raw !== x.raw); a.unshift(x); localStorage.setItem(MW_KEY, JSON.stringify(a.slice(0, 500))); },
  remove(w){ localStorage.setItem(MW_KEY, JSON.stringify(this.all().filter(x => x.raw !== w))); }
};

export function mountAmeilus(root, ctx){
  const { id, data, gloss = {}, settings = {}, label = id, heLabel = "" } = ctx;
  const steps = data.steps || [];
  const tokens = C.tokenize(steps), kinds = C.breakKinds(tokens), ranges = C.stepRanges(tokens, steps.length);
  const tree = C.mapTree(steps);
  const KEY = "gc-am3:" + id;
  const blank = () => ({ pos: 0, cuts: [], done: {}, used: {}, tries: 0, open: null });
  let st; try { st = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "null") || {}); } catch { st = blank(); }
  if (!st.used || typeof st.used !== "object") st.used = {};
  let mark = null, msg = null, card = null, wordMode = false, vowelWord = new Set(), resetOpen = false, hintsOpen = false;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ pos: st.pos, cuts: st.cuts, done: st.done, used: st.used, tries: st.tries, open: card ? { at: card.at, steps: card.steps, shown: !!card.shown, fb: card.fb || null, fbKind: card.fb ? card.fbKind : null } : null })); } catch {} }; // open: the explanation in the panel, so a reload shows it again (v99p)
  { const o = st.open; if (o && Number.isInteger(o.at) && o.at >= 0 && o.at < st.pos && o.at < tokens.length && Array.isArray(o.steps) && o.steps.every(s => Number.isInteger(s) && steps[s] && st.done[s]) && (st.cuts.includes(o.at) || o.steps.some(s => ranges[s].end === o.at)) && (o.fb == null || (typeof o.fb === "string" && /^[a-z]+$/.test(String(o.fbKind))))) card = { at: o.at, steps: o.steps.slice(), shown: !!o.shown, fb: o.fb || null, fbKind: o.fb ? o.fbKind : undefined, check: null, checked: false }; } // a saved record without a valid open field opens nothing
  const curStep = () => st.pos < tokens.length ? tokens[st.pos].s : -1;
  const bare = !!settings.bare;
  const guessOn = !!settings.guess && !bare; // Guess the kind first: only when switched on in Aa, and not in Bare mode (no checks there)
  // explanation prose of a finished/revealed passage: its Hebrew words borrow the amud's vowels (the host's nikud-borrowing renderer, display only, Oct 15 2026). The unsolved Gemara text never goes through here.
  const voc = s => typeof ctx.vocalizeHelp === "function" ? ctx.vocalizeHelp(String(s == null ? "" : s)) : String(s == null ? "" : s); // N1: word-help lines and the signal hint get vowels
  const prose = s => { const v = typeof ctx.vocalize === "function" ? ctx.vocalize(String(s == null ? "" : s)) : String(s == null ? "" : s);
    return typeof ctx.refParts === "function" ? ctx.refParts(v).map(p => p.ref ? ctx.refButton(p) : mixed(p.text)).join("") : mixed(v); }; // round 4: a Tanakh reference opens the pasuk pop-up
  // page-wide hint toggles: they cover every word of the amud, so they never mark where a passage ends
  let show; try { show = Object.assign({ vowels: false, punct: false }, JSON.parse(localStorage.getItem(SHOW_KEY) || "{}") || {}); } catch { show = { vowels: false, punct: false }; }
  const saveShow = () => { try { localStorage.setItem(SHOW_KEY, JSON.stringify({ vowels: !!show.vowels, punct: !!show.punct })); } catch {} };

  // Round 4 (Oct 15 2026: the explanation scrolls and the rest of the screen stays put): an app shell.
  // The page itself never scrolls in Ameilus. The head and the Shiur/Ameilus bar stay put, the amud scrolls in its own box
  // (#amDafWrap), and the explanation (and the finish card) sit in their own scrolling panel (#amExp): beside the amud on wide
  // screens (left, where the Hebrew lines end; above the map at 1100px+), a bottom sheet above the controls on phones.
  root.innerHTML = `
    <div class="am" data-am>
      <div class="am-main">
        <div class="am-head">
          <div><h1 class="am-title"><span class="am-entitle">${esc(label)}</span> <span class="he am-hetitle" lang="he">${esc(heLabel)}</span></h1>
          <div class="am-sub" id="amSub"></div></div>
          <div class="am-headnav">${ctx.prevHref ? `<a class="iconbtn" href="${ctx.prevHref}" aria-label="Previous amud" title="Previous amud">‹</a>` : ""}${ctx.nextHref ? `<a class="iconbtn" href="${ctx.nextHref}" aria-label="Next amud" title="Next amud">›</a>` : ""}</div>
        </div>
        ${ctx.modeBar || ""}
        <div class="am-tip" id="amTip" hidden></div>
        <div class="am-dafwrap" id="amDafWrap">
          <div class="am-daf" id="amDaf" dir="rtl" lang="he" role="group" aria-label="${esc(AMW.dafAria)}"></div>
        </div>
        <div class="am-live sr" aria-live="polite" id="amLive"></div>
      </div>
      <div class="am-side" id="amSide">
        <section class="am-exp empty" id="amExp" aria-labelledby="amExpH">
          <div class="am-exp-head">
            <h2 class="am-exp-h" id="amExpH">${esc(AMW.cardAria)}</h2>
            <button class="iconbtn am-exp-grow" data-exp="grow" aria-expanded="false" aria-controls="amExpBody" aria-label="${esc(AMW.expGrow)}" title="${esc(AMW.expGrow)}"><span aria-hidden="true">▴</span></button>
            <button class="iconbtn am-exp-x" data-exp="close" aria-label="${esc(AMW.expHide)}" title="${esc(AMW.expHide)}"><span aria-hidden="true">✕</span></button>
          </div>
          <div class="am-exp-body" id="amExpBody" tabindex="0" role="region" aria-label="${esc(AMW.cardAria)}"></div>
        </section>
        <aside class="am-map" id="amMap" aria-label="Sugya map"></aside>
      </div>
    </div>
    <div class="am-bar" id="amBar" role="toolbar" aria-label="Ameilus controls"></div>`;
  const $ = s => root.querySelector(s);
  const daf = $("#amDaf"), bar = $("#amBar"), mapEl = $("#amMap"), live = $("#amLive");
  const amEl = $(".am"), dafBox = $("#amDafWrap"), exp = $("#amExp"), expBody = $("#amExpBody"), expH = $("#amExpH");
  let shownCard = null, expTall = false, finHidden = false; // shownCard: what the panel showed last (a new passage resets the panel to its top)
  const smooth = () => !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  // scroll one of the shell's own boxes (never the page) so `el` is in view: "nearest" (only if needed) or "center"
  function scrollInBox(box, el, how){
    if (!box || !el) return;
    const b = box.getBoundingClientRect(), r = el.getBoundingClientRect(), pad = 12; let d = 0;
    if (how === "center") d = (r.top + r.height / 2) - (b.top + b.height / 2);
    else if (r.top < b.top + pad) d = r.top - b.top - pad;
    else if (r.bottom > b.bottom - pad) d = Math.min(r.bottom - b.bottom + pad, r.top - b.top - pad);
    if (Math.abs(d) > 1) box.scrollBy({ top: d, behavior: smooth() ? "smooth" : "auto" });
  }
  // the fade at the panel's bottom edge says "more below"; it goes once the end is in view
  const expFade = () => { exp.classList.toggle("more", expBody.scrollHeight - expBody.scrollTop - expBody.clientHeight > 4); exp.classList.toggle("scrolled", expBody.scrollTop > 2); };
  expBody.addEventListener("scroll", expFade, { passive: true });

  // ---------- word sheet (non-modal, sits at the bottom, never over the marked text) ----------
  let sheet = document.getElementById("amWord");
  if (!sheet) { sheet = document.createElement("section"); sheet.id = "amWord"; sheet.className = "am-word"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-label", "Word help"); sheet.hidden = true; document.body.appendChild(sheet); }
  const closeWord = () => { sheet.hidden = true; document.body.classList.remove("am-word-open"); };

  function wordHelp(i){
    const t = tokens[i], s = steps[t.s], stepDone = !!st.done[t.s] || i < st.pos && st.done[t.s];
    const showV = i < st.pos || (show.vowels && !bare) || vowelWord.has(i);
    const w = bareRaw(t.raw);
    const parts = [];
    // a glossary phrase this word belongs to (starting up to 2 words earlier)
    let ph = null;
    for (let b = Math.max(0, i - 2); b <= i && !ph; b++) { const h = C.phraseAt(gloss, tokens, b); if (h && h.n > 1 && b + h.n > i) ph = h; }
    if (ph) parts.push(`<div class="am-ent"><div class="am-ent-he">${he(ph.entry[0] || ph.form)}</div><div class="am-ent-g">${mixed(voc(ph.entry[1]))}</div>${ph.entry[2] ? `<div class="am-ent-u">${mixed(voc(ph.entry[2]))}</div>` : ""}<div class="am-src">Reading glossary</div></div>`);
    const g = C.lookupGloss(gloss, w);
    if (g) parts.push(`<div class="am-ent"><div class="am-ent-he">${g.prefix ? `${he(g.prefix + "־")} ` : ""}${he(g.entry[0] || g.form)}</div>${g.prefix ? `<div class="am-ent-p">${he(g.prefix)} = ${esc(g.prefixEn)}</div>` : ""}<div class="am-ent-g">${mixed(voc(g.entry[1]))}</div>${g.entry[2] ? `<div class="am-ent-u">${mixed(voc(g.entry[2]))}</div>` : ""}${g.entry[4] ? `<div class="am-src">Jastrow: ${he(g.entry[4])}</div>` : `<div class="am-src">Reading glossary</div>`}</div>`);
    // key terms from this amud; one that is most of an unfinished passage would give it away
    const kts = []; let ktShown = null; // the first key-term meaning the sheet shows (My words keeps it when the dictionary has no entry, v99t)
    const shownForms = new Set([ph && ph.form, g && g.form].filter(Boolean));
    const consider = (k, si) => {
      const tw = C.unvowel(k.term).replace(/[,.:;?!״"“”׳']/g, " ").split(/\s+/).filter(Boolean).map(bareRaw);
      if (shownForms.has(tw.join(" "))) return; // same thing the glossary already says
      if (!(tw.includes(w) || (w.length > 2 && /^[ודהבלכמש]/.test(w) && tw.includes(w.slice(1))))) return;
      const pieceDone = !!st.done[si];
      const lw = Math.max(1, ranges[si].end - ranges[si].start + 1);
      if (!pieceDone && (tw.length >= 3 || tw.length / lw >= 0.5)) { kts.push(`<div class="am-ent held">${he(k.term)} <span class="am-src">${esc(AMW.heldTerm)}</span></div>`); return; }
      if (!ktShown && k.meaning) ktShown = k; kts.push(`<div class="am-ent"><div class="am-ent-he">${he(k.term)}</div><div class="am-ent-g">${mixed(voc(k.meaning))}</div><div class="am-src">Key term on this amud</div></div>`);
    };
    (s.keyTerms || []).forEach(k => consider(k, t.s));
    if (!kts.length) steps.forEach((o, si) => { if (si !== t.s && kts.length < 1) (o.keyTerms || []).forEach(k => { if (!kts.length) consider(k, si); }); });
    parts.push(...kts);
    if (st.done[t.s]) { const p = (s.phrases || [])[t.ph]; if (p) parts.push(`<div class="am-ent"><div class="am-ent-he">${he(p.aramaic)}</div><div class="am-ent-g">${prose(p.english)}</div><div class="am-src">This phrase, from our reading</div></div>`); }
    const saved = myWords.has(w);
    sheet.innerHTML = `
      <div class="am-word-head">
        <div class="am-word-w" dir="rtl" lang="he">${esc(showV ? t.v : t.raw)}</div>
        <button class="iconbtn" data-x="close" aria-label="Close word help">✕</button>
      </div>
      <div class="am-word-body">${parts.length ? parts.join("") : `<p class="am-none">No entry yet for this word. We'd rather leave it blank than guess.</p>`}</div>
      <div class="am-word-acts">
        ${showV ? "" : `<button class="chip" data-x="vowel">Vowels on this word</button>`}
        <button class="chip" data-x="save" aria-pressed="${saved}">${saved ? "In My words ✓" : "Add to My words"}</button>
      </div>`;
    sheet.hidden = false; document.body.classList.add("am-word-open");
    sheet.onclick = e => {
      const x = e.target.closest("[data-x]"); if (!x) return;
      if (x.dataset.x === "close") closeWord();
      if (x.dataset.x === "vowel") { vowelWord.add(i); render(); wordHelp(i); }
      if (x.dataset.x === "save") { if (myWords.has(w)) myWords.remove(w); else myWords.add(Object.assign({ raw: w, v: t.v, id, gloss: g ? g.entry[1] : "" }, g && g.entry[1] ? null : ph && ph.entry[1] ? { gloss: voc(ph.entry[1]), src: "glossary phrase" } : ktShown ? { gloss: voc(ktShown.meaning), src: "key term" } : null)); wordHelp(i); } // no dictionary entry: keep the text the sheet showed, and where it came from (v99t)
    };
    // keep the word visible above the sheet
    const el = daf.querySelector(`[data-i="${i}"]`);
    if (el) requestAnimationFrame(() => { fitBar(); requestAnimationFrame(() => scrollInBox(dafBox, el)); }); // round 4: the amud's box ends above the sheet; keep the word in it
  }

  // ---------- rendering ----------
  function tokenHTML(t, i, cs){
    const done = i < st.pos;
    const txt = C.wordView(t, i, { pos: st.pos, vowels: show.vowels, punct: show.punct, bare, vowelWord }).text;
    const sel = mark != null && i >= st.pos && i <= mark;
    const cls = ["w", done ? (guessHides(t.s) ? "done" : "done k-" + (C.KIND_CLASS[steps[t.s].hebrewStepName] || "mimra")) : "", sel ? "sel" : "", i === mark ? "mark" : "",
      (st.sig && st.sig.i === i) ? "sig" : "", i === st.pos && mark == null && i > 0 ? "next" : ""].filter(Boolean).join(" ");
    return `<span class="${cls}" data-i="${i}" tabindex="${i === (mark != null ? mark : st.pos) ? 0 : -1}">${esc(txt)}</span>`;
  }
  function cardHTML(){
    if (!card) return "";
    const lines = [];
    if (card.fb) lines.push(`<p class="am-fb am-fb-${card.fbKind}">${mixed(card.fb)}</p>`);
    // no check question on a card, even if the card data carries one; "Show our reading" comes right after the passage
    if (card.steps && card.steps.length) {
      if (!card.shown) { const g = guessOn ? guessHTML() : null; // Guess the kind first (opt-in): the guess comes first; the own-words line and "Show our reading" follow it unchanged
        if (g && g.open) lines.push(g.html);
        else lines.push((g ? g.html : "") + `<p class="am-own">Say it in your own words first. Then check it.</p><button class="btn primary" data-act="show">Show our reading</button>`); }
      else card.steps.forEach(si => {
        const s = steps[si], kc = C.KIND_CLASS[s.hebrewStepName] || "mimra";
        lines.push(`<div class="am-read k-${kc}"><div class="am-kind"><span class="kchip">${esc(C.KIND_EN[s.hebrewStepName] || s.hebrewStepName)}</span> ${he(KIND_NIKUD[s.hebrewStepName] || s.hebrewStepName)}</div>
          <p class="am-tr">${prose(s.simpleTranslation || "")}</p>
          <details><summary>Phrase by phrase</summary>${(s.phrases || []).map(p => `<div class="am-ph"><div class="he" dir="rtl" lang="he">${esc(p.aramaic)}</div><div>${prose(p.english)}</div>${p.notes ? `<div class="am-pnote">${prose(p.notes)}</div>` : ""}</div>`).join("")}</details>
          ${s.whatsHappening ? `<p class="am-wh">${prose(s.whatsHappening)}</p>` : ""}
          <a class="am-shiur" href="${ctx.shiurHref(s.stepNumber)}"${ctx.shiurNewTab ? ' target="_blank" rel="noopener"' : ""}>Full explanation in Sugya Flow${ctx.shiurNewTab ? " ↗" : " ›"}</a></div>`);
      });
    }
    return `<div class="am-card" id="amCard" dir="ltr" lang="en">${lines.join("")}</div>`;
  }
  // Guess the kind first: one question per step the passage covers, in order. Skip (one tap) ends the guessing for this passage.
  function guessHTML(){
    const gs = (card.steps || []).filter(si => steps[si] && guessFamOf(steps[si].hebrewStepName));
    if (!gs.length) return null;
    const g = card.g || (card.g = { i: 0, fam: null, tried: [], hint: null, hits: [] });
    const chip = si => { const k = steps[si].hebrewStepName; return `<span class="am-gdk k-${C.KIND_CLASS[k] || "mimra"}"><span class="kchip">${esc(C.KIND_EN[k] || k)}</span></span>`; };
    const hitLine = si => `<p class="am-gdone">That's it: ${chip(si)} ${esc(GUESS_KIND[steps[si].hebrewStepName])}.</p>`;
    if (g.i >= gs.length) return { open: false, html: g.hits.map(hitLine).join("") };
    const si = gs[g.i], multi = gs.length > 1, part = multi ? `Part ${g.i + 1} of ${gs.length}` : "";
    const before = g.hits.filter(h => gs.indexOf(h) < g.i).map(hitLine).join("");
    const tried = v => g.tried.includes(v);
    const hint = g.hint ? `<p class="am-ghint" role="status">${esc(g.hint)}</p>` : "";
    let body;
    if (!g.fam) {
      body = `<div class="am-gtop"><span>1 of 2</span>${part ? `<span>${part}</span>` : ""}</div>
        <p class="am-gq" id="amGq">${multi ? `What does part ${g.i + 1} of this passage do?` : "What does this passage do?"}</p>${hint}
        <div class="am-gopts">${GUESS_FAM.map(f => `<button class="am-gopt${tried(f.k) ? " tried" : ""}" data-gfam="${f.k}"${tried(f.k) ? ' aria-disabled="true"' : ""}><b>${esc(f.label)}</b><span>${esc(f.sub)}</span>${tried(f.k) ? '<span class="am-gtried">Tried</span>' : ""}</button>`).join("")}</div>
        <div class="am-gacts"><button class="btn am-gskip" data-act="gskip">Skip</button></div>`;
    } else {
      const fam = GUESS_FAM.find(f => f.k === g.fam);
      body = `<div class="am-gtop"><span>2 of 2</span>${part ? `<span>${part}</span>` : ""}</div>
        <p class="am-gq" id="amGq">${esc(fam.label)}: which kind?</p>${hint}
        <div class="am-gopts">${fam.kinds.map(k => `<button class="am-gopt am-gkind k-${C.KIND_CLASS[k] || "mimra"}${tried(k) ? " tried" : ""}" data-gkind="${esc(k)}"${tried(k) ? ' aria-disabled="true"' : ""}><b>${esc(C.KIND_EN[k] || k)}</b><span>${esc(GUESS_KIND[k])}</span>${tried(k) ? '<span class="am-gtried">Tried</span>' : ""}</button>`).join("")}</div>
        <div class="am-gacts"><button class="btn am-gback" data-act="gback">‹ Back</button><button class="btn am-gskip" data-act="gskip">Skip</button></div>`;
    }
    return { open: true, html: `${before}<div class="am-guess" role="group" aria-labelledby="amGq">${body}</div>` };
  }
  function guessHides(si){ // true while step si belongs to the open passage and its guess has not landed (or been skipped) yet
    if (guessOn && !st.done[si] && steps[si] && guessFamOf(steps[si].hebrewStepName)) return true; // a passage marked only part of the way (a real break inside it): no kind until it is finished and guessed
    if (!guessOn || !card || card.shown || !card.steps || !card.steps.includes(si)) return false;
    const gs = card.steps.filter(x => steps[x] && guessFamOf(steps[x].hebrewStepName)), k = gs.indexOf(si);
    return k >= 0 && k >= (card.g ? card.g.i : 0);
  }
  function guessPick(kind, v){ // kind: "fam" (tap 1) or "kind" (tap 2)
    const gs = (card.steps || []).filter(si => steps[si] && guessFamOf(steps[si].hebrewStepName));
    const g = card.g; if (!g || g.i >= gs.length || g.tried.includes(v)) return;
    const real = steps[gs[g.i]].hebrewStepName;
    const hit = () => { g.hits.push(gs[g.i]); g.i++; g.fam = null; g.tried = []; g.hint = null; render(); say(`That's it: ${C.KIND_EN[real] || real}.`); };
    if (kind === "fam") {
      const h = guessHint(v, real);
      if (h) { g.tried.push(v); g.hint = h; render(); say(h); return; }
      const fam = GUESS_FAM.find(f => f.k === v);
      if (fam.kinds.length === 1) return hit();
      g.fam = v; g.tried = []; g.hint = null; render(); return;
    }
    const h = guessHint(v, real);
    if (h) { g.tried.push(v); g.hint = h; render(); say(h); return; }
    hit();
  }
  function finishHTML(){
    const total = steps.length, own = C.ownCount(st.done);
    return `<div class="am-card am-finish" dir="ltr" lang="en"><p class="am-fin">${esc(AMW.finish(label, own, total))}</p>
      <div class="am-finacts">${ctx.nextHref ? `<a class="btn primary" href="${ctx.nextHref}">Next amud ›</a>` : ""}<button class="btn" data-act="restart">Start this amud over</button></div></div>`;
  }
  function render(){
    const cs = curStep();
    const cutSet = new Set(st.cuts);
    Object.keys(st.done).forEach(s => { if (ranges[s] && ranges[s].end < st.pos) cutSet.add(ranges[s].end); });
    let h = "";
    tokens.forEach((t, i) => {
      h += tokenHTML(t, i, cs) + " ";
      if (cutSet.has(i)) {
        const stepEnd = ranges[t.s].end === i;
        h += `<span class="cut ${stepEnd ? "cut-step" : "cut-inner"}" aria-hidden="true"></span>`;
        if (card && card.at === i) h += `<span class="cut-here" aria-hidden="true"></span>`; // where the passage in the panel ends
      }
    });
    daf.innerHTML = h;
    renderExp(); renderBar(); renderMap(); renderSub();
  }
  // the explanation panel: the card of the passage just finished (or reopened), or the finish card at the end of the amud
  function renderExp(){
    const fin = st.pos >= tokens.length && !finHidden;
    const key = card || (fin ? "finish" : null);
    const html = (card ? cardHTML() : "") + (fin ? finishHTML() : ""); // the last passage's explanation, then "Next amud"
    // empty: phones hide the panel; wide screens keep the column (so the amud never changes width) with a quiet line in it
    exp.classList.toggle("empty", !html); amEl.classList.toggle("has-exp", !!html); document.body.classList.toggle("am-exp-open", !!html);
    expH.textContent = card ? AMW.cardAria : fin ? AMW.finishTitle : AMW.cardAria; // an empty panel no longer says "Amud done" before anything is done
    expBody.setAttribute("aria-label", card || !fin ? AMW.cardAria : AMW.finishTitle);
    const top = expBody.scrollTop;
    expBody.innerHTML = html || `<p class="am-exp-empty">${esc(AMW.expEmpty)}</p>`;
    if (key !== shownCard) { expBody.scrollTop = 0; shownCard = key; } // a new passage starts at the top of the panel
    else expBody.scrollTop = top; // the same passage re-rendered (a check answered, "Show our reading"): stay put
    if (!html) { expTall = false; amEl.classList.remove("exp-tall"); }
    expFade();
  }
  function setTall(on){
    expTall = on; amEl.classList.toggle("exp-tall", on);
    const g = exp.querySelector("[data-exp=grow]"); g.setAttribute("aria-expanded", String(on));
    const t = on ? AMW.expShrink : AMW.expGrow; g.setAttribute("aria-label", t); g.title = t; g.firstElementChild.textContent = on ? "▾" : "▴";
    requestAnimationFrame(() => { expFade(); keepUnreadInView(true); });
  }
  exp.addEventListener("click", e => {
    const b = e.target.closest("[data-exp]"); if (!b) return;
    if (b.dataset.exp === "grow") setTall(!expTall);
    if (b.dataset.exp === "close") { const fin = st.pos >= tokens.length; if (card) { card = null; save(); } else if (fin) finHidden = true; render(); const f = daf.querySelector(`[data-i="${Math.min(st.pos, tokens.length - 1)}"]`); f && f.focus({ preventScroll: true }); }
  });
  function renderSub(){
    const done = Object.keys(st.done).length;
    $("#amSub").textContent = st.pos >= tokens.length ? AMW.allDone(steps.length) : AMW.count(done, steps.length);
    ctx.onProgress && ctx.onProgress(st.pos / Math.max(1, tokens.length), done, steps.length);
  }
  function renderBar(){
    if (st.pos >= tokens.length) {
      bar.innerHTML = resetOpen ? resetHTML(true) : `<div class="am-msg">Amud finished.</div><div class="am-hints"><button class="hb" data-act="reset" aria-expanded="false">↺ Start over</button></div>`;
      return;
    }
    const tog = (k, label) => `<button class="hb hb-t ${show[k] ? "on" : ""}" data-act="toggle" data-k="${k}" aria-pressed="${!!show[k]}" title="${label} on the whole amud (on/off)"><span class="hb-l">${label}</span></button>`;
    // Round 2 (Oct 15 2026): the idle bar is one row (Hints · Word help · ↺); the four hints open from "Hints" in a panel above it
    const nOn = bare ? 0 : (show.vowels ? 1 : 0) + (show.punct ? 1 : 0);
    const panel = hintsOpen && !resetOpen ? `<div class="am-hints am-hintpanel${bare ? " am-hints-bare" : ""}" id="amHintPanel" role="group" aria-label="Hints: use any, in any order">
        ${bare ? "" : tog("vowels", "Gemara vowels") + tog("punct", "Punctuation")}
        ${bare ? "" : `<button class="hb hb-t" data-act="signal" title="Point out a signal word and what it means"><span class="hb-l">Signal word</span></button>`}
        ${bare ? "" : `<button class="hb hb-t" data-act="head" title="The first phrase, with its English when it fits"${C.headOff(tokens, ranges, st.pos) ? ` disabled style="opacity:.35;cursor:default"` : ""}><span class="hb-l">Head start</span></button>`}
        <button class="hb hb-w" data-act="reveal" title="${esc(AMW.revealTitle)}"><span class="hb-l">Show where it ends</span></button>
      </div>` : "";
    const row = resetOpen ? resetHTML(false) : `<div class="am-hints am-row" role="group" aria-label="Help">
        <button class="hb hb-h${hintsOpen ? " open" : ""}" data-act="hints" aria-expanded="${hintsOpen}" aria-controls="amHintPanel" title="Vowels, Punctuation, Signal word, Show where it ends"><span class="hb-l">Hints</span>${nOn ? `<span class="hb-n">${nOn} on</span>` : ""}<span class="hb-car" aria-hidden="true">${hintsOpen ? "▾" : "▴"}</span></button>
        <button class="hb hb-m ${wordMode ? "on" : ""}" data-act="wordmode" aria-pressed="${wordMode}" title="Word help: tap any word for its meaning (or long-press a word)"><span class="hb-l">Word help</span></button>
        <button class="hb ic" data-act="reset" aria-expanded="false" aria-label="${esc(AMW.resetAria)}" title="${esc(AMW.resetAria)}">↺</button>
      </div>`;
    // the nudge arrows follow the Hebrew: the row runs right-to-left, so "one word back" sits on the right pointing right (›) and "one word on" sits on the left pointing left (‹), the way the marker moves
    bar.innerHTML = `
      ${msg ? `<div class="am-msg am-msg-${msg.k}" role="status">${msg.head ? `Head start: ${he(msg.head.he)}${msg.head.en ? ` - ${mixed(msg.head.en)}` : ""}` : mixed(msg.k === "hint" ? voc(msg.text) : msg.text)}</div>` : `<div class="am-msg am-msg-idle">${mark == null ? (wordMode ? "Word help is on: tap any word for its meaning." : esc(AMW.idle)) : "Marker set. Nudge it, or confirm."}</div>`}
      ${panel}
      ${row}
      ${mark != null ? `<div class="am-acts" dir="rtl"><button class="btn sm" data-act="nudge" data-d="-1" aria-label="Move marker one word back" title="One word back">›</button><button class="btn primary" data-act="commit">Ends here ✓</button><button class="btn sm" data-act="nudge" data-d="1" aria-label="Move marker one word on" title="One word on">‹</button></div>` : ""}`;
  }
  function resetHTML(finished){
    return `<div class="am-hints am-reset" role="group" aria-label="Reset">
        ${finished ? "" : `<button class="hb" data-act="resetpiece">${esc(AMW.redo)}</button>`}
        <button class="hb warn" data-act="resetamud">Start the amud over</button>
        <button class="hb" data-act="resetcancel">Cancel</button>
      </div>`;
  }
  const STAG_EN = { unresolved: "Unresolved", story: "Story", "end-marker": "End marker" }, STAG_ORDER = ["unresolved", "story", "end-marker"]; // markers (v99u): the optional step.marks array shows as the same small outlined tags the steps view uses, in the same order, at the start of the node's title line (so they wrap with it)
  function renderMap(){
    const cs = curStep();
    let lastPhase = null, rows = "";
    tree.forEach(nd => {
      const s = steps[nd.i], done = !!st.done[nd.i];
      if (!done && nd.i !== cs) return;
      if (done && nd.phase !== lastPhase) { rows += `<div class="am-phase">${esc(C.PHASE_EN[nd.phase] || "")}</div>`; lastPhase = nd.phase; }
      if (done && guessHides(nd.i)) { rows += `<div class="am-node am-gnode" style="--d:0"><span class="kdot"></span><span class="am-nt">Just marked</span></div>`; return; } // Guess the kind first: no kind, phase or title for it until the guess lands
      const kc = C.KIND_CLASS[s.hebrewStepName] || "mimra";
      rows += done
        ? `<button class="am-node k-${kc}" style="--d:${nd.depth}" data-node="${nd.i}"><span class="kdot"></span><span class="am-nk">${esc(C.KIND_EN[s.hebrewStepName] || "")}</span><span class="am-nt">${Array.isArray(s.marks) && STAG_ORDER.some(g => s.marks.includes(g)) ? `<span class="vh">${STAG_ORDER.filter(g => s.marks.includes(g)).map(g => ", " + STAG_EN[g].toLowerCase()).join("")}</span>` + STAG_ORDER.filter(g => s.marks.includes(g)).map(g => `<span class="stag stag-${g}" aria-hidden="true">${STAG_EN[g]}</span> `).join("") : ""}${prose(String(s.title || "").slice(0, 90))}</span></button>`
        : `<div class="am-node here" style="--d:0"><span class="kdot"></span><span class="am-nt">You are here</span></div>`;
    });
    mapEl.innerHTML = `<h2 class="am-maph">Sugya map</h2><p class="am-mapsub">${esc(AMW.mapSub)}</p>${rows || `<p class="am-mapsub">${esc(AMW.mapEmpty)}</p>`}`;
  }

  // ---------- actions ----------
  function say(t){ live.textContent = t; }
  function setMark(i, fromKey){
    if (i < st.pos) { // tapping a finished passage reopens its reading
      const s = tokens[i].s; if (st.done[s]) openReading(s); return;
    }
    if (card) { card = null; save(); }
    mark = i; msg = null; render(); say(`Marker after ${tokens[i].raw}`);
    if (fromKey) { const el = daf.querySelector(`[data-i="${i}"]`); el && el.focus({ preventScroll: true }); }
  }
  function openReading(s){
    const at = ranges[s].end;
    card = { at, steps: [s], shown: true, fb: null }; mark = null; save(); render();
    requestAnimationFrame(() => scrollInBox(dafBox, daf.querySelector(`[data-i="${at}"]`))); // the passage's end stays in view beside / above the panel
  }
  function commit(viaReveal){
    const cs = curStep(); if (cs < 0) return;
    const m = viaReveal ? ranges[cs].end : mark;
    const ev = C.evaluateMark(tokens, kinds, ranges, st.pos, m);
    if (!ev.ok) { st.tries++; msg = { k: "try", text: ev.text }; save(); render(); say(ev.text); return; }
    const own = !viaReveal; // on your own = no "Show where it ends"; vowels, punctuation and the signal word don't count against it
    st.cuts.push(ev.carveTo);
    ev.completes.forEach(s => { st.done[s] = { own: own && (st.done[s] ? st.done[s].own : true), sig: !!(st.used[s] && st.used[s].sig), rev: !!viaReveal }; });
    st.pos = ev.carveTo + 1; st.tries = 0; st.sig = null; mark = null; msg = null;
    const lastDone = ev.completes[ev.completes.length - 1];
    const check = null; // no check question after a passage
    card = { at: ev.carveTo, fb: viaReveal ? "Here's where we split it." : ev.text, fbKind: ev.rel, steps: ev.completes, check, checked: false, shown: false };
    if (ev.rel === "inner") card.steps = [];
    save(); render(); say(card.fb);
    requestAnimationFrame(() => keepUnreadInView(true)); // the panel opened: keep the cut and the next words in view in the amud's own box
  }
  function toggleShow(k){
    if (bare) return;
    show[k] = !show[k]; saveShow(); render();
    if (k === "punct" && msg && msg.head) { const h = C.headStart(steps, tokens, ranges, st.pos, { punct: show.punct }); msg = { k: "hint", head: h, text: C.headLine(h) }; renderBar(); } // a Head start line on screen follows the Punctuation switch
    say(`${k === "vowels" ? "Gemara vowels" : "Punctuation"} ${show[k] ? "on" : "off"} for the whole amud.`);
  }
  function signal(){
    const cs = curStep(); if (cs < 0 || bare) return;
    const h = C.signalHint(gloss, tokens, ranges, st.pos);
    st.used[cs] = Object.assign({}, st.used[cs], { sig: true });
    st.sig = h.at != null ? { i: h.at } : null;
    msg = { k: "hint", text: h.text };
    save(); render(); say(h.text);
  }
  function head(){ // v102 Head start v2 (the first phrase): free like the Signal word; it saves nothing and never counts against "on your own"
    const cs = curStep(); if (cs < 0 || bare || C.headOff(tokens, ranges, st.pos)) return; // one word left: the button is off and a tap does nothing
    const h = C.headStart(steps, tokens, ranges, st.pos, { punct: show.punct });
    msg = { k: "hint", head: h, text: C.headLine(h) };
    render(); say(msg.text);
  }
  function reveal(){ if (curStep() >= 0) { hintsOpen = false; commit(true); } }
  function restart(){ try { localStorage.removeItem(KEY); } catch {} st = blank(); card = null; finHidden = false; mark = null; msg = null; resetOpen = false; vowelWord = new Set(); save(); render(); dafBox.scrollTop = 0; say("Starting the amud over."); }
  function restartAsk(){
    const ok = (typeof window.confirm !== "function") || window.confirm(`Start ${label} over? This clears your marks for this amud on this device.`);
    if (ok) restart(); else { resetOpen = false; renderBar(); }
  }
  function redoPiece(){
    const cs = curStep(); if (cs < 0) return;
    st = C.resetPiece(st, ranges); st.sig = null; delete st.used[cs];
    card = null; mark = null; msg = { k: "hint", text: AMW.redoDone }; resetOpen = false;
    save(); render(); say(msg.text);
    requestAnimationFrame(() => scrollInBox(dafBox, daf.querySelector(`[data-i="${st.pos}"]`), "center"));
  }

  bar.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act;
    if (a === "commit") commit(false);
    if (a === "toggle") toggleShow(b.dataset.k);
    if (a === "signal") signal();
    if (a === "head") head();
    if (a === "reveal") reveal();
    if (a === "reset") { resetOpen = true; renderBar(); const f = bar.querySelector(".am-reset .hb"); f && f.focus(); }
    if (a === "resetcancel") { resetOpen = false; renderBar(); }
    if (a === "resetpiece") redoPiece();
    if (a === "resetamud") restartAsk();
    if (a === "nudge" && mark != null) { const d = +b.dataset.d; const n = Math.min(tokens.length - 1, Math.max(st.pos, mark + d)); setMark(n); }
    if (a === "wordmode") { wordMode = !wordMode; renderBar(); }
    if (a === "hints") { hintsOpen = !hintsOpen; renderBar(); const f = bar.querySelector(hintsOpen ? "#amHintPanel .hb" : "[data-act=hints]"); f && f.focus({ preventScroll: true }); if (hintsOpen) keepUnreadInView(); }
  });
  expBody.addEventListener("click", e => { // the card's own buttons live in the panel now
    const b = e.target.closest("[data-act],[data-opt],[data-gfam],[data-gkind]"); // data-gfam / data-gkind: Guess the kind first
    if (b && b.dataset.opt != null && card && card.check) { card.picked = +b.dataset.opt; card.checked = true; render(); return; }
    if (b && b.dataset.act === "skipcheck") { card.checked = true; card.skipped = true; card.picked = null; render(); return; }
    if (b && b.dataset.gfam && card && card.g) { guessPick("fam", b.dataset.gfam); return; } // Guess the kind first
    if (b && b.dataset.gkind && card && card.g) { guessPick("kind", b.dataset.gkind); return; }
    if (b && b.dataset.act === "gback" && card && card.g) { card.g.fam = null; card.g.tried = []; card.g.hint = null; render(); return; }
    if (b && b.dataset.act === "gskip" && card && card.g) { card.g.i = Infinity; card.g.fam = null; card.g.hint = null; render(); return; }
    if (b && b.dataset.act === "show") { card.shown = true; save(); render(); return; }
    if (b && b.dataset.act === "restart") { restartAsk(); return; }
  });
  mapEl.addEventListener("click", e => { const n = e.target.closest("[data-node]"); if (n) { openReading(+n.dataset.node); if (ctx.onMapPick) ctx.onMapPick(); } });

  // tap = mark; long-press (or right-click, or ? mode) = word help
  let press = null;
  daf.addEventListener("pointerdown", e => {
    const w = e.target.closest(".w"); if (!w || (e.pointerType === "mouse" && e.button !== 0)) return;
    const i = +w.dataset.i;
    press = { i, x: e.clientX, y: e.clientY, long: false, t: setTimeout(() => { if (press) { press.long = true; w.classList.add("pressed"); if (navigator.vibrate) try { navigator.vibrate(8); } catch {} wordHelp(i); } }, LONG_MS) };
  });
  daf.addEventListener("pointermove", e => { if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_PX) { clearTimeout(press.t); press = null; } });
  const endPress = cancel => e => {
    if (!press) return; clearTimeout(press.t);
    const p = press; press = null;
    daf.querySelectorAll(".pressed").forEach(x => x.classList.remove("pressed"));
    if (cancel || p.long) return;
    if (wordMode) wordHelp(p.i); else { closeWord(); setMark(p.i); }
  };
  daf.addEventListener("pointerup", endPress(false));
  daf.addEventListener("pointercancel", endPress(true));
  daf.addEventListener("contextmenu", e => { const w = e.target.closest(".w"); if (!w) return; e.preventDefault(); if (!press || !press.long) wordHelp(+w.dataset.i); });
  daf.addEventListener("selectstart", e => { if (e.target.closest && e.target.closest(".w")) e.preventDefault(); });
  daf.addEventListener("keydown", e => {
    const w = e.target.closest(".w"); if (!w) return;
    const i = +w.dataset.i;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); const d = e.key === "ArrowLeft" ? 1 : -1; setMark(Math.min(tokens.length - 1, Math.max(st.pos, (mark != null ? mark : i) + d)), true); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (mark === i) commit(false); else setMark(i, true); }
    if (e.key === "?" || e.key === "w") { e.preventDefault(); wordHelp(i); }
  });
  const onKey = e => {
    if (!root.isConnected) { document.removeEventListener("keydown", onKey); return; }
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    if (e.key === "Escape") { closeWord(); if (!tipEl.hidden) closeWalk(); }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "v") toggleShow("vowels");
    if (k === "p") toggleShow("punct");
    if (k === "s" || k === "h") signal();
  };
  document.addEventListener("keydown", onKey);

  // first use: a short walkthrough, once per device (WALK_KEY); Help (the ? beside Aa) › Replay the walkthrough opens it again (Oct 20 2026: the ? in the head is gone)
  const tipEl = $("#amTip");
  // Round 2 (Oct 15 2026): compact. A short sheet at the bottom of the screen (the amud's first lines stay in view above it),
  // the goal line, three short lines, a one-line example, and Start / Skip. The bottom controls hide while it is open.
  function walkHTML(){
    return `<div class="am-walk" role="dialog" aria-modal="false" aria-labelledby="amWalkH" dir="ltr" lang="en">
      <div class="am-walk-top"><span class="am-walk-k">How Ameilus works</span><button class="iconbtn" data-walk="skip" aria-label="Close the walkthrough">✕</button></div>
      <h2 class="am-walk-h" id="amWalkH" tabindex="-1">${esc(AMW.goal)}</h2>
      <ul class="am-walk-steps">
        <li>${esc(AMW.walkRead)}</li>
        <li>${esc(AMW.walkTap)} then “Ends here ✓”.</li>
        <li>${esc(AMW.walkHints)}</li>
      </ul>
      <div class="am-walk-ex" aria-label="Example">
        <p class="am-ex-he" dir="rtl" lang="he">מאימתי קורין את שמע <span class="ex-w ex-near">בערבין</span> משעה שהכהנים נכנסים לאכול <span class="ex-w ex-end">בתרומתן</span></p>
        <p class="am-ex-key"><span class="am-ex-k"><span class="exk exk-end" aria-hidden="true">✓</span>${mixed(AMW.walkEndShort)}</span> <span class="am-ex-k"><span class="exk exk-near" aria-hidden="true">|</span>${mixed(AMW.walkNear)}</span></p>
      </div>
      <div class="am-walk-acts"><button class="btn ghost" data-walk="skip">Skip</button><button class="btn primary" data-walk="start">Start</button></div>
    </div>`;
  }
  function openWalk(focus){
    tipEl.innerHTML = walkHTML(); tipEl.hidden = false; document.body.classList.add("am-walk-open");
    const h = tipEl.querySelector(focus ? "#amWalkH" : "[data-walk=start]"); h && h.focus({ preventScroll: true });
  }
  function closeWalk(){ tipEl.hidden = true; tipEl.innerHTML = ""; document.body.classList.remove("am-walk-open"); try { localStorage.setItem(WALK_KEY, "1"); } catch {} }
  root.addEventListener("click", e => {
    const w = e.target.closest("[data-walk]"); if (!w) return;
    if (w.dataset.walk === "open") { if (tipEl.hidden) openWalk(true); else closeWalk(); }
    else { closeWalk(); if (w.dataset.walk === "start") { dafBox.scrollTop = 0; const f = daf.querySelector(`[data-i="${st.pos}"]`); f && f.focus({ preventScroll: true }); } }
  });
  let seen = false; try { seen = !!localStorage.getItem(WALK_KEY); } catch {}
  if (!seen) { if (typeof ctx.whenReady === "function") ctx.whenReady(() => { if (root.isConnected && !localStorage.getItem(WALK_KEY)) openWalk(false); }); else openWalk(false); } // the site's first-visit notice comes first
  render();
  // the Shiur step nearest the passage the learner is on (for "switch to Shiur" keeping the place); null at the very start or when finished
  const placeStep = () => { const cs = curStep(); if (cs < 0 || (st.pos === 0 && !Object.keys(st.done).length)) return null; const s = steps[cs]; return s && s.stepNumber ? +s.stepNumber : cs + 1; };
  // round 3 (Oct 15 2026): when Hints opens the bar grows (about 177px on a phone); on a short screen that can cover the
  // text being read, so the first unread word (or the marker) is scrolled back into the clear band between the top bar and the bar.
  // Round 4: the amud scrolls in its own box, so "in view" means inside that box (it already ends above the bar and the panel).
  function keepUnreadInView(instant){
    fitBar();
    requestAnimationFrame(() => {
      const el = daf.querySelector(`[data-i="${mark != null ? mark : Math.min(st.pos, tokens.length - 1)}"]`); if (!el) return;
      const b = dafBox.getBoundingClientRect(), r = el.getBoundingClientRect(), pad = 10;
      if (r.top >= b.top + pad && r.bottom <= b.bottom - pad) return; // already in the clear
      const target = b.top + Math.max(pad, (b.height - r.height) * 0.35);
      dafBox.scrollBy({ top: r.top - target, behavior: smooth() && !instant ? "smooth" : "auto" });
    });
  }
  // the page keeps room for the fixed bar at its real height (idle it is one row; it grows only while hints or the marker are open)
  // round 4: the shell ends above the bar (and above the word sheet on phones) at their real heights
  const fitBar = () => { const bs = document.body.style; bs.setProperty("--am-bar-h", Math.ceil(bar.getBoundingClientRect().height) + "px"); bs.setProperty("--am-word-h", (sheet.hidden ? 0 : Math.ceil(sheet.getBoundingClientRect().height)) + "px"); };
  let barObs = null; try { barObs = new ResizeObserver(() => { fitBar(); expFade(); }); barObs.observe(bar); barObs.observe(sheet); barObs.observe(expBody); } catch { fitBar(); }
  return { destroy(){ closeWord(); document.removeEventListener("keydown", onKey); if (barObs) barObs.disconnect(); document.body.style.removeProperty("--am-bar-h"); document.body.style.removeProperty("--am-word-h"); document.body.classList.remove("am-walk-open", "am-exp-open"); root.innerHTML = ""; }, state: () => st, placeStep, openWalk: () => openWalk(true), tokens, kinds, ranges };
}
// ---- Help (Oct 20 2026): Ameilus registers its own Help topics here; the app's Help page (the ? beside Aa) lists them.
// The walkthrough is replayed from Help: "Mark where each passage ends" › Replay the walkthrough. Nothing else in Ameilus changes.
{
  const reg = e => globalThis.registerHelp ? globalThis.registerHelp(e) : (globalThis.__gcHelpQ ||= []).push(e);
  reg({ id:"am-mark", group:"Ameilus", order:1, icon:"check", where:["ameilus"], title:AMW.goal, sub:"Tap the last word, then “Ends here ✓”.",
    body:[AMW.walkRead, `${AMW.walkTap} then “Ends here ✓”.`, "The first time you open Ameilus, a short walkthrough shows how. You can replay it here."],
    action:{ label:"Replay the walkthrough", run: c => { if (c && c.am && c.am.openWalk) { c.close(); c.am.openWalk(); return; } try { localStorage.removeItem(WALK_KEY); } catch {} return "It will open the next time you start Ameilus on an amud."; } } });
  reg({ id:"am-hints", group:"Ameilus", order:2, icon:"bulb", where:["ameilus"], title:"Hints", sub:"Vowels, punctuation, signal word and more.",
    body:[AMW.walkHints, "Use any hint, in any order. If you use Show where it ends, that passage does not count as done on your own."] });
  reg({ id:"am-words", group:"Ameilus", order:3, icon:"word", where:["ameilus"], title:"Word help and My words", sub:"Long-press any word.",
    body:["Long-press a word to see what it means.", "Tap “Add to My words” to keep it. Your list is in Settings › Ameilus."] });
  reg({ id:"am-map", group:"Ameilus", order:4, icon:"steps", where:["ameilus"], title:"Sugya map", sub:"How the passages hang together.",
    body:["The map button at the top shows each passage under the one it answers or builds on.", "It fills in as you go."] });
  reg({ id:"am-reading", group:"Ameilus", order:5, icon:"eye", where:["ameilus"], title:"Show our reading", sub:"Check yourself after each passage.",
    body:["After you mark a passage, say it in your own words.", "Then tap Show our reading to see its kind, its translation and what is happening."] });
}
