// Ameilus v3 UI. Self-contained: mountAmeilus(root, ctx) renders one amud into `root` and owns
// only elements inside it plus the word sheet it appends to document.body. The host passes data
// and callbacks, so the same module can drop into Gemara Clarity behind a Shiur/Ameilus switch.
import * as C from "./core.js?v=3.1.0";

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const he = s => `<span class="he" dir="rtl" lang="he">${esc(s)}</span>`;
// English sentences with Hebrew words inside: wrap Hebrew runs so they render with the Hebrew font
const mixed = s => esc(s).replace(/([\u0590-\u05FF][\u0590-\u05FF\u05F3\u05F4"'׳״\- ]*[\u0590-\u05FF׳״]|[\u0590-\u05FF])/g, m => `<span class="he" lang="he">${m}</span>`);
const LONG_MS = 480, MOVE_PX = 10;
const MW_KEY = "gc-am3-mywords", TIP_KEY = "gc-am3-tip";
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
  const blank = () => ({ pos: 0, cuts: [], done: {}, rung: {}, tries: 0, open: null });
  let st; try { st = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "null") || {}); } catch { st = blank(); }
  let mark = null, msg = null, card = null, wordMode = false, vowelWord = new Set();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ pos: st.pos, cuts: st.cuts, done: st.done, rung: st.rung, tries: st.tries })); } catch {} };
  const curStep = () => st.pos < tokens.length ? tokens[st.pos].s : -1;
  const rungOf = s => st.rung[s] || 0;
  const bare = !!settings.bare;

  root.innerHTML = `
    <div class="am" data-am>
      <div class="am-main">
        <div class="am-head">
          <div><h1 class="am-title">${esc(label)} <span class="he am-hetitle" lang="he">${esc(heLabel)}</span></h1>
          <div class="am-sub" id="amSub"></div></div>
          <div class="am-headnav">${ctx.prevHref ? `<a class="iconbtn" href="${ctx.prevHref}" aria-label="Previous amud" title="Previous amud">‹</a>` : ""}${ctx.nextHref ? `<a class="iconbtn" href="${ctx.nextHref}" aria-label="Next amud" title="Next amud">›</a>` : ""}</div>
        </div>
        <div class="am-tip" id="amTip" hidden></div>
        <div class="am-daf" id="amDaf" dir="rtl" lang="he" role="group" aria-label="The amud. Tap the last word of a statement to mark where it ends; long-press a word for its meaning."></div>
        <div class="am-live sr" aria-live="polite" id="amLive"></div>
      </div>
      <aside class="am-map" id="amMap" aria-label="Sugya map"></aside>
    </div>
    <div class="am-bar" id="amBar" role="toolbar" aria-label="Ameilus controls"></div>`;
  const $ = s => root.querySelector(s);
  const daf = $("#amDaf"), bar = $("#amBar"), mapEl = $("#amMap"), live = $("#amLive");

  // ---------- word sheet (non-modal, sits at the bottom, never over the marked text) ----------
  let sheet = document.getElementById("amWord");
  if (!sheet) { sheet = document.createElement("section"); sheet.id = "amWord"; sheet.className = "am-word"; sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-label", "Word help"); sheet.hidden = true; document.body.appendChild(sheet); }
  const closeWord = () => { sheet.hidden = true; document.body.classList.remove("am-word-open"); };

  function wordHelp(i){
    const t = tokens[i], s = steps[t.s], stepDone = !!st.done[t.s] || i < st.pos && st.done[t.s];
    const showV = i < st.pos || rungOf(t.s) >= 2 || vowelWord.has(i);
    const w = bareRaw(t.raw);
    const parts = [];
    // a glossary phrase this word belongs to (starting up to 2 words earlier)
    let ph = null;
    for (let b = Math.max(0, i - 2); b <= i && !ph; b++) { const h = C.phraseAt(gloss, tokens, b); if (h && h.n > 1 && b + h.n > i) ph = h; }
    if (ph) parts.push(`<div class="am-ent"><div class="am-ent-he">${he(ph.entry[0] || ph.form)}</div><div class="am-ent-g">${mixed(ph.entry[1])}</div>${ph.entry[2] ? `<div class="am-ent-u">${mixed(ph.entry[2])}</div>` : ""}<div class="am-src">Reading glossary</div></div>`);
    const g = C.lookupGloss(gloss, w);
    if (g) parts.push(`<div class="am-ent"><div class="am-ent-he">${g.prefix ? `${he(g.prefix + "־")} ` : ""}${he(g.entry[0] || g.form)}</div>${g.prefix ? `<div class="am-ent-p">${he(g.prefix)} = ${esc(g.prefixEn)}</div>` : ""}<div class="am-ent-g">${mixed(g.entry[1])}</div>${g.entry[2] ? `<div class="am-ent-u">${mixed(g.entry[2])}</div>` : ""}${g.entry[4] ? `<div class="am-src">Jastrow: ${he(g.entry[4])}</div>` : `<div class="am-src">Reading glossary</div>`}</div>`);
    // key terms from this amud; one that is most of an unfinished piece would give it away
    const kts = [];
    const shownForms = new Set([ph && ph.form, g && g.form].filter(Boolean));
    const consider = (k, si) => {
      const tw = C.unvowel(k.term).replace(/[,.:;?!״"“”׳']/g, " ").split(/\s+/).filter(Boolean).map(bareRaw);
      if (shownForms.has(tw.join(" "))) return; // same thing the glossary already says
      if (!(tw.includes(w) || (w.length > 2 && /^[ודהבלכמש]/.test(w) && tw.includes(w.slice(1))))) return;
      const pieceDone = !!st.done[si];
      const lw = Math.max(1, ranges[si].end - ranges[si].start + 1);
      if (!pieceDone && (tw.length >= 3 || tw.length / lw >= 0.5)) { kts.push(`<div class="am-ent held">${he(k.term)} <span class="am-src">meaning shows once this piece is done</span></div>`); return; }
      kts.push(`<div class="am-ent"><div class="am-ent-he">${he(k.term)}</div><div class="am-ent-g">${mixed(k.meaning)}</div><div class="am-src">Key term on this amud</div></div>`);
    };
    (s.keyTerms || []).forEach(k => consider(k, t.s));
    if (!kts.length) steps.forEach((o, si) => { if (si !== t.s && kts.length < 1) (o.keyTerms || []).forEach(k => { if (!kts.length) consider(k, si); }); });
    parts.push(...kts);
    if (st.done[t.s]) { const p = (s.phrases || [])[t.ph]; if (p) parts.push(`<div class="am-ent"><div class="am-ent-he">${he(p.aramaic)}</div><div class="am-ent-g">${mixed(p.english)}</div><div class="am-src">This phrase, from our reading</div></div>`); }
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
      if (x.dataset.x === "save") { if (myWords.has(w)) myWords.remove(w); else myWords.add({ raw: w, v: t.v, id, gloss: g ? g.entry[1] : "" }); wordHelp(i); }
    };
    // keep the word visible above the sheet
    const el = daf.querySelector(`[data-i="${i}"]`);
    if (el) requestAnimationFrame(() => { const r = el.getBoundingClientRect(), top = sheet.getBoundingClientRect().top; if (r.bottom > top - 12) window.scrollBy({ top: r.bottom - top + 60, behavior: "smooth" }); });
  }

  // ---------- rendering ----------
  function tokenHTML(t, i, cs){
    const done = i < st.pos, cur = !done && t.s === cs;
    const r = cur ? rungOf(t.s) : 0;
    const showP = done || (cur && r >= 1 && !bare);
    const showV = done || (cur && r >= 2 && !bare) || vowelWord.has(i);
    const txt = (showP ? t.lead : "") + (showV ? t.v : t.raw) + (showP ? t.trail : "");
    const sel = mark != null && i >= st.pos && i <= mark;
    const cls = ["w", done ? "done k-" + (C.KIND_CLASS[steps[t.s].hebrewStepName] || "mimra") : "", sel ? "sel" : "", i === mark ? "mark" : "",
      (st.sig && st.sig.i === i) ? "sig" : ""].filter(Boolean).join(" ");
    return `<span class="${cls}" data-i="${i}" tabindex="${i === (mark != null ? mark : st.pos) ? 0 : -1}">${esc(txt)}</span>`;
  }
  function cardHTML(){
    if (!card) return "";
    const lines = [];
    if (card.fb) lines.push(`<p class="am-fb am-fb-${card.fbKind}">${mixed(card.fb)}</p>`);
    if (card.check && !card.checked) {
      const ch = card.check;
      lines.push(`<div class="am-check"><p class="am-q">${esc(ch.q)} <span class="am-opt">optional</span></p><div class="am-opts">${ch.options.map((o, k) => `<button class="am-optbtn" data-opt="${k}" dir="${ch.source === "dependsOn" ? "rtl" : "ltr"}">${mixed(o.label)}</button>`).join("")}</div><button class="linkbtn" data-act="skipcheck">Skip</button></div>`);
    } else if (card.check && card.checked) {
      const ch = card.check, picked = ch.options[card.picked];
      lines.push(`<div class="am-check done"><p class="am-q">${esc(ch.q)}</p><div class="am-opts">${ch.options.map((o, k) => `<span class="am-optbtn ${o.ok ? "ok" : ""} ${k === card.picked && !o.ok ? "miss" : ""}" dir="${ch.source === "dependsOn" ? "rtl" : "ltr"}">${mixed(o.label)}</span>`).join("")}</div><p class="am-fb">${picked ? (picked.ok ? "Yes, that's how we read it." : "We read it as going after the one marked.") : "Skipped. The one marked is how we read it."}</p></div>`);
    }
    if (card.steps && card.steps.length && (!card.check || card.checked || card.skipped)) {
      if (!card.shown) lines.push(`<p class="am-own">Say it in your own words first. Then check it.</p><button class="btn primary" data-act="show">Show our reading</button>`);
      else card.steps.forEach(si => {
        const s = steps[si], kc = C.KIND_CLASS[s.hebrewStepName] || "mimra";
        lines.push(`<div class="am-read k-${kc}"><div class="am-kind"><span class="kchip">${esc(C.KIND_EN[s.hebrewStepName] || s.hebrewStepName)}</span> ${he(s.hebrewStepName)}</div>
          <p class="am-tr">${mixed(s.simpleTranslation || "")}</p>
          <details><summary>Phrase by phrase</summary>${(s.phrases || []).map(p => `<div class="am-ph"><div class="he" dir="rtl" lang="he">${esc(p.aramaic)}</div><div>${mixed(p.english)}</div></div>`).join("")}</details>
          ${s.whatsHappening ? `<p class="am-wh">${mixed(s.whatsHappening)}</p>` : ""}
          <a class="am-shiur" href="${ctx.shiurHref(s.stepNumber)}"${ctx.shiurNewTab ? ' target="_blank" rel="noopener"' : ""}>Full explanation in Shiur${ctx.shiurNewTab ? " ↗" : " ›"}</a></div>`);
      });
    }
    return `<div class="am-card" id="amCard" dir="ltr" lang="en" role="region" aria-label="This piece">${lines.join("")}</div>`;
  }
  function finishHTML(){
    const total = steps.length, own = Object.values(st.done).filter(d => d.own).length;
    return `<div class="am-card am-finish" dir="ltr" lang="en"><p class="am-fin">${esc(label)}: done on your own, ${own} of ${total} pieces without the reveal.</p>
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
        if (card && card.at === i) h += cardHTML();
      }
    });
    if (st.pos >= tokens.length) h += finishHTML();
    daf.innerHTML = h;
    renderBar(); renderMap(); renderSub();
  }
  function renderSub(){
    const done = Object.keys(st.done).length;
    $("#amSub").textContent = st.pos >= tokens.length ? `All ${steps.length} pieces done` : `${done} of ${steps.length} pieces`;
    ctx.onProgress && ctx.onProgress(st.pos / Math.max(1, tokens.length), done, steps.length);
  }
  function renderBar(){
    if (st.pos >= tokens.length) { bar.innerHTML = `<div class="am-msg">Amud finished.</div>`; return; }
    const cs = curStep(), r = rungOf(cs);
    const nextR = bare ? "reveal" : C.RUNGS[Math.min(r, 3)];
    const helpLabel = nextR === "reveal" ? "Show where it ends" : `Hint: ${({ punct: "punctuation", vowels: "vowels", signal: "signal word" })[nextR]}`;
    bar.innerHTML = `
      ${msg ? `<div class="am-msg am-msg-${msg.k}" role="status">${mixed(msg.text)}</div>` : `<div class="am-msg am-msg-idle">${mark == null ? (wordMode ? "Word help is on: tap any word for its meaning." : "Tap the last word of the next statement.") : "Marker set. Nudge it, or confirm."}</div>`}
      <div class="am-acts">
        <button class="btn sm ${wordMode ? "on" : ""}" data-act="wordmode" aria-pressed="${wordMode}" title="Word help mode (or long-press a word)">?</button>
        ${mark != null ? `<button class="btn sm" data-act="nudge" data-d="-1" aria-label="Move marker one word back" title="One word back">›</button><button class="btn primary" data-act="commit">Ends here ✓</button><button class="btn sm" data-act="nudge" data-d="1" aria-label="Move marker one word on" title="One word on">‹</button>` : ""}
        <button class="btn ${nextR === "reveal" ? "ghost" : ""}" data-act="help">${helpLabel}<span class="rung">${bare ? "" : ` ${Math.min(r + 1, 4)}/4`}</span></button>
      </div>`;
  }
  function renderMap(){
    const cs = curStep();
    let lastPhase = null, rows = "";
    tree.forEach(nd => {
      const s = steps[nd.i], done = !!st.done[nd.i];
      if (!done && nd.i !== cs) return;
      if (done && nd.phase !== lastPhase) { rows += `<div class="am-phase">${esc(C.PHASE_EN[nd.phase] || "")}</div>`; lastPhase = nd.phase; }
      const kc = C.KIND_CLASS[s.hebrewStepName] || "mimra";
      rows += done
        ? `<button class="am-node k-${kc}" style="--d:${nd.depth}" data-node="${nd.i}"><span class="kdot"></span><span class="am-nk">${esc(C.KIND_EN[s.hebrewStepName] || "")}</span><span class="am-nt">${mixed(String(s.title || "").slice(0, 90))}</span></button>`
        : `<div class="am-node here" style="--d:0"><span class="kdot"></span><span class="am-nt">You are here</span></div>`;
    });
    mapEl.innerHTML = `<h2 class="am-maph">Sugya map</h2><p class="am-mapsub">Each piece hangs under the one it answers or builds on. It fills in as you go.</p>${rows || `<p class="am-mapsub">Finish the first piece to start the map.</p>`}`;
  }

  // ---------- actions ----------
  function say(t){ live.textContent = t; }
  function setMark(i, fromKey){
    if (i < st.pos) { // tapping a finished piece reopens its reading
      const s = tokens[i].s; if (st.done[s]) openReading(s); return;
    }
    if (card) card = null;
    mark = i; msg = null; render(); say(`Marker after ${tokens[i].raw}`);
    if (fromKey) { const el = daf.querySelector(`[data-i="${i}"]`); el && el.focus({ preventScroll: true }); }
  }
  function openReading(s){
    const at = ranges[s].end;
    card = { at, steps: [s], shown: true, fb: null }; mark = null; render();
    const c = document.getElementById("amCard"); c && c.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function commit(viaReveal){
    const cs = curStep(); if (cs < 0) return;
    const m = viaReveal ? ranges[cs].end : mark;
    const ev = C.evaluateMark(tokens, kinds, ranges, st.pos, m);
    if (!ev.ok) { st.tries++; msg = { k: "try", text: ev.text }; save(); render(); say(ev.text); return; }
    const own = !viaReveal && rungOf(cs) < 3;
    st.cuts.push(ev.carveTo);
    ev.completes.forEach(s => { st.done[s] = { own: own && (st.done[s] ? st.done[s].own : true), rung: rungOf(s) }; });
    st.pos = ev.carveTo + 1; st.tries = 0; st.sig = null; mark = null; msg = null;
    const lastDone = ev.completes[ev.completes.length - 1];
    const check = (!bare && lastDone != null) ? C.attackCheck(steps, lastDone) : null;
    card = { at: ev.carveTo, fb: viaReveal ? "Here's where we split it." : ev.text, fbKind: ev.rel, steps: ev.completes, check, checked: false, shown: false };
    if (ev.rel === "inner") card.steps = [];
    save(); render(); say(card.fb);
    const c = document.getElementById("amCard"); c && c.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function help(){
    const cs = curStep(); if (cs < 0) return;
    const r = rungOf(cs);
    if (bare || r >= 3) { commit(true); return; }
    st.rung[cs] = r + 1;
    const rung = C.RUNGS[r];
    if (rung === "punct") msg = { k: "hint", text: "Punctuation is back on this piece. A full stop or question mark is often, not always, where it ends." };
    if (rung === "vowels") msg = { k: "hint", text: "Vowels are back on this piece." };
    if (rung === "signal") {
      const sg = C.signalFor(gloss, tokens, ranges, st.pos);
      if (sg && sg.where === "this") { st.sig = { i: sg.at }; msg = { k: "hint", text: `${sg.entry[0] || sg.form}: “${sg.entry[1]}.” ${sg.entry[2]}` }; }
      else if (sg && sg.at === ranges[cs + 1].start) msg = { k: "hint", text: `The next piece opens with ${sg.entry[0] || sg.form} (“${sg.entry[1]}”). Find it and this piece ends just before.` };
      else if (sg) msg = { k: "hint", text: `Watch for ${sg.entry[0] || sg.form} (“${sg.entry[1]}”): it comes right at the start of the next piece.` };
      else msg = { k: "hint", text: "No signal word here. Read it aloud: who is talking, and where do they stop?" };
    }
    save(); render(); say(msg.text);
  }
  function restart(){ st = blank(); card = null; mark = null; msg = null; save(); render(); window.scrollTo({ top: 0 }); }

  bar.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act;
    if (a === "commit") commit(false);
    if (a === "help") help();
    if (a === "nudge" && mark != null) { const d = +b.dataset.d; const n = Math.min(tokens.length - 1, Math.max(st.pos, mark + d)); setMark(n); }
    if (a === "wordmode") { wordMode = !wordMode; renderBar(); }
  });
  daf.addEventListener("click", e => {
    const b = e.target.closest("[data-act],[data-opt]");
    if (b && b.dataset.opt != null && card && card.check) { card.picked = +b.dataset.opt; card.checked = true; render(); return; }
    if (b && b.dataset.act === "skipcheck") { card.checked = true; card.skipped = true; card.picked = null; render(); return; }
    if (b && b.dataset.act === "show") { card.shown = true; render(); return; }
    if (b && b.dataset.act === "restart") { restart(); return; }
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
    if (e.key === "Escape") closeWord();
    if ((e.key === "h" || e.key === "H") && !e.metaKey && !e.ctrlKey && !e.altKey) help();
  };
  document.addEventListener("keydown", onKey);

  // first-time tip, once per device
  if (!localStorage.getItem(TIP_KEY)) {
    const tip = $("#amTip"); tip.hidden = false;
    tip.innerHTML = `<span>Tap the last word of each statement. Long-press any word for its meaning.</span><button class="iconbtn" aria-label="Dismiss tip">✕</button>`;
    tip.querySelector("button").onclick = () => { tip.hidden = true; localStorage.setItem(TIP_KEY, "1"); };
  }
  render();
  return { destroy(){ closeWord(); document.removeEventListener("keydown", onKey); root.innerHTML = ""; }, state: () => st, tokens, kinds, ranges };
}
