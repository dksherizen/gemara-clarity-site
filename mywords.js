/* My words (Oct 25 2026): the learner's saved words as their own screen, #/words (the list) and #/words/cards (flashcards).
   The list is the same localStorage key Ameilus saves into ("gc-am3-mywords", synced by acct.js when signed in), so every word saved before carries over.
   Flashcard marks live in "gc-mw-cards" on this device only: { raw: { b: box 0-5, n: times seen, k: knew, l: still learning, t: last seen ms, a: first seen ms } }.
   Review order: "still learning" words first, then new words, then known words from the lowest box and the longest unseen; a word marked "still learning"
   comes back three cards later in the same round, and "knew it" moves it up a box so it shows up later next time. */
const KEY = "gc-am3-mywords", CK = "gc-mw-cards";
const js = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch { return d; } };
export const store = {
  all(){ const a = js(KEY, []); return Array.isArray(a) ? a.filter(x => x && typeof x.raw === "string") : []; },
  remove(raw){ try { localStorage.setItem(KEY, JSON.stringify(this.all().filter(x => x.raw !== raw))); const c = cards(); delete c[raw]; putCards(c); } catch {} },
  count(){ return this.all().length; }
};
const cards = () => { const c = js(CK, {}); return c && typeof c === "object" && !Array.isArray(c) ? c : {}; };
const putCards = c => { try { localStorage.setItem(CK, JSON.stringify(c)); } catch {} };
export function status(c){ if (!c || !c.n) return "new"; return c.b >= 2 ? "known" : "learning"; }
const STAT = { new: "New", learning: "Still learning", known: "Knew it" };
function order(words, c){
  const pr = w => { const x = c[w.raw], s = status(x); return s === "learning" ? 0 : s === "new" ? 1 : 2; };
  return words.map((w, i) => ({ w, i })).sort((A, B) => {
    const a = c[A.w.raw] || {}, b = c[B.w.raw] || {};
    return pr(A.w) - pr(B.w) || (a.b || 0) - (b.b || 0) || (a.t || 0) - (b.t || 0) || A.i - B.i;
  }).map(x => x.w);
}
let S = null; // the flashcard round in progress (kept while the app is open)
export function renderMyWords(view, D, sub){
  const { esc, parseId, masInfo, hashFor, label } = D;
  const cardsMode = sub === "cards";
  const all = store.all(), c = cards();
  // prune marks of words no longer on the list; note when a word was first seen here
  let ch = false; const live = new Set(all.map(w => w.raw));
  for (const k of Object.keys(c)) if (!live.has(k)) { delete c[k]; ch = true; }
  if (ch) putCards(c);
  const src = w => { const p = w.id ? parseId(String(w.id)) : null; return p && masInfo(p.m) ? { href: hashFor(p.m, p.i, "/ameilus"), t: label(p.m, p.i) } : null; };
  const tabs = `<nav class="mw-tabs" aria-label="My words"><a href="#/words" class="mw-tab"${cardsMode ? "" : ' aria-current="page"'}>List</a><a href="#/words/cards" class="mw-tab"${cardsMode ? ' aria-current="page"' : ""}>Flashcards</a></nav>`;
  const empty = `<div class="mw-empty"><p><b>No words yet.</b></p><p>In Ameilus, long-press any word, then tap “Add to My words”. It shows up here, ready for flashcards.</p></div>`;
  const sumOf = () => { const a = store.all(), cc = cards(), l = a.filter(w => status(cc[w.raw]) === "learning").length, k = a.filter(w => status(cc[w.raw]) === "known").length, n = a.length - l - k;
    return a.length ? `${a.length} ${a.length === 1 ? "word" : "words"} · ${l} still learning · ${k} known${n ? ` · ${n} new` : ""}` : "Words you save while you learn."; };
  const sumLine = sumOf();
  view.innerHTML = `<div class="mw">
    <div class="hero hero-h3 mw-hero"><h1>My words</h1><p id="mwSum">${esc(sumLine)}</p></div>
    ${tabs}
    <div id="mwBody"></div></div>`;
  const body = view.querySelector("#mwBody");
  if (!all.length) { body.innerHTML = empty; return; }
  if (!cardsMode) return listView();
  return cardsView();

  function listView(){
    body.innerHTML = `<div class="mw-tools"><label class="mw-search"><span class="vh">Search my words</span><input type="search" id="mwQ" placeholder="Search my words" autocomplete="off" enterkeyhint="search"></label>
      <a class="btn primary mw-go" href="#/words/cards">Flashcards</a></div>
      <ul class="mw-list" id="mwList"></ul>`;
    const strip = s => String(s || "").replace(/[\u0591-\u05C7]/g, "").toLowerCase();
    const paint = () => {
      const q = strip(body.querySelector("#mwQ").value.trim()), cc = cards();
      const L = q ? store.all().filter(w => strip(w.raw).includes(q) || strip(w.v).includes(q) || strip(w.gloss).includes(q)) : store.all();
      body.querySelector("#mwList").innerHTML = L.map(w => { const s = src(w), st = status(cc[w.raw]);
        return `<li class="mw-it"><div class="mw-tx"><span class="he mw-he" lang="he">${esc(w.v || w.raw)}</span><span class="mw-en">${w.gloss ? esc(w.gloss) : '<span class="mw-none">No meaning saved</span>'}</span>
          <span class="mw-meta">${s ? `<a href="${s.href}">${esc(s.t)}</a>` : ""}<span class="mw-st st-${st}">${STAT[st]}</span></span></div>
          <button type="button" class="mw-del" data-raw="${esc(w.raw)}" aria-label="Delete ${esc(w.gloss || w.raw)} from My words"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`; }).join("")
        + (q && !L.length ? `<li class="mw-nomatch">Nothing matches “${esc(q)}”.</li>` : "");
    };
    body.querySelector("#mwQ").addEventListener("input", paint);
    body.querySelector("#mwList").addEventListener("click", e => {
      const b = e.target.closest(".mw-del"); if (!b) return;
      const raw = b.dataset.raw, w = store.all().find(x => x.raw === raw); if (!w) return;
      if (!confirm(`Delete “${w.v || w.raw}” from My words?`)) return;
      store.remove(raw); D.onChange && D.onChange();
      if (!store.count()) return renderMyWords(view, D, sub);
      paint(); view.querySelector("#mwSum").textContent = sumOf();
    });
    paint();
  }

  function cardsView(){
    const words = store.all(), byRaw = new Map(words.map(w => [w.raw, w]));
    if (!S || !S.q.every(r => byRaw.has(r)) || (!S.q.length && !S.over)) newRound(false);
    function newRound(shuffle){
      const cc = cards(); let q = order(store.all(), cc).map(w => w.raw);
      if (shuffle) for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
      S = { q, done: 0, knew: 0, again: 0, miss: {}, total: q.length, flipped: false, over: false, shuffled: !!shuffle };
    }
    const paint = () => {
      const sm = view.querySelector("#mwSum"); if (sm) sm.textContent = sumOf();
      if (!S.q.length || S.over) { S.over = true;
        body.innerHTML = `<div class="mw-done" role="status"><h2>Round done</h2><p>${S.knew} knew it · ${Object.keys(S.miss).length} still learning</p>
          <div class="mw-row"><button type="button" class="btn primary" id="mwAgain">Go again</button><a class="btn" href="#/words">Back to the list</a></div>
          <p class="small">Words you’re still learning come first next round.</p></div>`;
        body.querySelector("#mwAgain").onclick = () => { newRound(false); paint(); };
        return; }
      const w = byRaw.get(S.q[0]) || {}, s = src(w), st = status(cards()[w.raw]);
      body.innerHTML = `<div class="mw-cards">
        <div class="mw-bar"><span class="mw-n" id="mwN">${S.q.length} left in this round</span>
          <button type="button" class="btn" id="mwShuf" aria-pressed="${S.shuffled}">Shuffle</button></div>
        <button type="button" class="mw-card${S.flipped ? " flipped" : ""}" id="mwCard" aria-label="${S.flipped ? "Hide the meaning" : "Show the meaning"}">
          <span class="mw-tag st-${st}">${STAT[st]}</span>
          <span class="he mw-big" lang="he">${esc(w.v || w.raw)}</span>
          ${S.flipped ? `<span class="mw-mean">${w.gloss ? esc(w.gloss) : "No meaning was saved for this word."}</span>${s ? `<span class="mw-from">from ${esc(s.t)}</span>` : ""}` : `<span class="mw-tip">Tap to show the meaning</span>`}
        </button>
        <div class="mw-row mw-marks"${S.flipped ? "" : " hidden"}><button type="button" class="btn mw-again" id="mwL">Still learning</button><button type="button" class="btn primary mw-knew" id="mwK">Knew it</button></div>
        ${s && S.flipped ? `<p class="small mw-open"><a href="${s.href}">Open ${esc(s.t)} in Ameilus</a></p>` : ""}
      </div>`;
      body.querySelector("#mwCard").onclick = () => { S.flipped = !S.flipped; paint(); const k = body.querySelector(S.flipped ? "#mwK" : "#mwCard"); k && k.focus({ preventScroll: true }); };
      body.querySelector("#mwShuf").onclick = () => { newRound(true); paint(); };
      const mark = knew => {
        const cc = cards(), x = cc[w.raw] || { b: 0, n: 0, k: 0, l: 0, a: Date.now() };
        x.n++; x.t = Date.now();
        if (knew) { x.k++; x.b = Math.min(5, Math.max(2, (x.b || 0) + 1)); } else { x.l++; x.b = 1; }
        cc[w.raw] = x; putCards(cc);
        S.q.shift(); S.flipped = false;
        if (knew) { S.knew++; S.done++; }
        else { S.again++; S.miss[w.raw] = (S.miss[w.raw] || 0) + 1;
          if (S.miss[w.raw] === 1 && S.q.length) S.q.splice(Math.min(3, S.q.length), 0, w.raw); // comes back once more this round, three cards later
          else S.done++; }
        paint();
        const cd = body.querySelector("#mwCard"); cd && cd.focus({ preventScroll: true });
      };
      if (S.flipped) { body.querySelector("#mwK").onclick = () => mark(true); body.querySelector("#mwL").onclick = () => mark(false); }
    };
    paint();
    view._mwKeys && document.removeEventListener("keydown", view._mwKeys);
    view._mwKeys = e => {
      if (!location.hash.startsWith("#/words/cards") || e.metaKey || e.ctrlKey || e.altKey || (e.target && e.target.matches && e.target.matches("input, textarea"))) return;
      if (S && !S.over && S.q.length) {
        if (e.key === " " && e.target === document.body) { e.preventDefault(); body.querySelector("#mwCard") && body.querySelector("#mwCard").click(); }
        else if (S.flipped && (e.key === "1")) { e.preventDefault(); body.querySelector("#mwL").click(); }
        else if (S.flipped && (e.key === "2")) { e.preventDefault(); body.querySelector("#mwK").click(); }
      }
    };
    document.addEventListener("keydown", view._mwKeys);
  }
}
