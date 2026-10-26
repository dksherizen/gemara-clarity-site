/* Offline: "Download for offline" (all lesson text), saved class recordings, and the service worker.
   Progress and My Words stay in localStorage exactly as before; this file only adds its own "gcOffline.*" keys. */
(function () {
"use strict";
if (!("serviceWorker" in navigator) || !window.caches) { document.documentElement.classList.add("no-offline"); return; }
var TEXT = "gc-course-text", AUDIO = "gc-course-audio", AUDIO_META = "gc-course-audio-meta";
var CH = 2 * 1024 * 1024, LK = "gcOffline.v1", QK = "gcOffline.queue";
var B = document.body, MODE = B.getAttribute("data-mode");
function idle() { try { return !(window.__wl && window.__wl.state().paused === false); } catch (e) { return true; } }
navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(function (reg) {
  // a new version takes over on a page load, or as soon as it's ready if nothing is playing
  function go(w) { if (w && idle()) w.postMessage({ type: "skip-waiting" }); }
  if (reg.waiting) go(reg.waiting);
  reg.addEventListener("updatefound", function () { var w = reg.installing; if (w) w.addEventListener("statechange", function () { if (w.state === "installed" && navigator.serviceWorker.controller) go(w); }); });
}).catch(function (e) { console.warn("sw", e); });

function $(s, r) { return (r || document).querySelector(s); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function mb(n) { if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + " GB"; if (n >= 1e6) return Math.round(n / 1e6) + " MB"; return Math.max(1, Math.round(n / 1e3)) + " KB"; }
function key(u) { var url = new URL(u, location.href), p = url.pathname; if (/\/index\.html$/.test(p)) p = p.slice(0, -10); else if (/\.html$/.test(p)) p = p.slice(0, -5); return url.origin + p; }
function pieceKey(id, i) { return location.origin + "/__gcaudio/" + encodeURIComponent(id) + "/" + i; }
function metaKey(id) { return location.origin + "/__gcaudio/" + encodeURIComponent(id) + "/meta"; }
function st() { try { return JSON.parse(localStorage.getItem(LK)) || {}; } catch (e) { return {}; } }
function setSt(o) { try { localStorage.setItem(LK, JSON.stringify(o)); } catch (e) {} }
function swNote() { try { var c = navigator.serviceWorker.controller; if (c) c.postMessage({ type: "audio-changed" }); navigator.serviceWorker.ready.then(function (r) { if (r.active && r.active !== c) r.active.postMessage({ type: "audio-changed" }); }); } catch (e) {} }
function persist() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {} }
var lock = null;
function wake(on) { try { if (on && !lock && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (l) { lock = l; l.addEventListener("release", function () { lock = null; }); }).catch(function () {}); if (!on && lock) { lock.release(); lock = null; } } catch (e) {} }
async function space() { try { if (navigator.storage && navigator.storage.estimate) { var e = await navigator.storage.estimate(); return { used: e.usage || 0, quota: e.quota || 0 }; } } catch (e) {} return null; }

/* ---------- the list of files (built with the site) ---------- */
var MAN = null;
function manifest() {
  if (!MAN) MAN = fetch("/course/offline.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  return MAN;
}

/* ---------- text: everything a lesson needs ---------- */
var textBusy = null;
async function textState() {
  var j = await manifest(), c = await caches.open(TEXT), ks = await c.keys(), have = {};
  ks.forEach(function (r) { have[r.url] = 1; });
  var s = st(), h = s.h || {}, missing = [], stale = [], total = 0;
  j.text.forEach(function (t) { total += t.b; var k = key(t.u); if (!have[k]) missing.push(t); else if (h[k] && h[k] !== t.h) stale.push(t); });
  return { total: total, missing: missing, stale: stale, all: j.text, at: s.at || 0, ready: !missing.length };
}
function downloadText(onp) {
  if (textBusy) return textBusy;
  persist(); wake(true);
  textBusy = (async function () {
    var ts = await textState(), todo = ts.missing.concat(ts.stale);
    if (!todo.length && ts.ready) todo = [];
    var need = todo.reduce(function (a, t) { return a + t.b; }, 0), done = 0, c = await caches.open(TEXT), s = st(); s.h = s.h || {};
    var i = 0, fails = 0;
    onp && onp(0, need);
    async function one() {
      while (i < todo.length) {
        var t = todo[i++], ok = false;
        for (var tries = 0; tries < 3 && !ok; tries++) {
          try { var r = await fetch(t.u, { cache: "no-cache" }); if (r.ok) { if (r.redirected) r = new Response(await r.blob(), { status: 200, headers: r.headers }); await c.put(key(t.u), r); s.h[key(t.u)] = t.h; ok = true; } } catch (e) { if (!navigator.onLine) break; }
        }
        if (!ok) fails++;
        done += t.b; onp && onp(done, need);
      }
    }
    await Promise.all([one(), one(), one(), one(), one(), one()]);
    if (fails) { setSt(s); throw new Error(fails + " files didn't download"); }
    s.at = Date.now(); setSt(s);
    return true;
  })();
  textBusy.then(function () { textBusy = null; wake(false); }, function () { textBusy = null; wake(false); });
  return textBusy;
}

/* ---------- audio: one class recording, saved in 2 MB pieces ---------- */
async function meta(id) { var r = await (await caches.open(AUDIO_META)).match(metaKey(id)); if (!r) return null; try { return await r.json(); } catch (e) { return null; } }
async function setMeta(m) { await (await caches.open(AUDIO_META)).put(metaKey(m.id), new Response(JSON.stringify(m), { headers: { "content-type": "application/json" } })); }
async function savedList() {
  var c = await caches.open(AUDIO_META), ks = await c.keys(), out = [];
  for (var i = 0; i < ks.length; i++) { var r = await c.match(ks[i]); try { out.push(await r.json()); } catch (e) {} }
  return out;
}
var SAVED = {}, PART = {};
async function refreshSaved() { var l = await savedList(); SAVED = {}; PART = {}; l.forEach(function (m) { if (m.done) SAVED[m.id] = m; else PART[m.id] = m; }); return l; }
var Q = [], cur = null, curAbort = null, listeners = [];
try { Q = JSON.parse(localStorage.getItem(QK)) || []; } catch (e) { Q = []; }
function saveQ() { try { localStorage.setItem(QK, JSON.stringify(Q)); } catch (e) {} }
function emit() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }
var prog = {}; // id -> bytes
var lastErr = "";
function enqueue(ids) { persist(); ids.forEach(function (id) { if (Q.indexOf(id) < 0 && !SAVED[id] && cur !== id) Q.push(id); }); saveQ(); emit(); pump(); }
async function pump() {
  if (cur || !Q.length) { if (!cur) wake(false); return; }
  if (!navigator.onLine) { lastErr = "offline"; emit(); return; }
  var j = await manifest(); cur = Q[0]; wake(true); emit();
  var id = cur;
  try { await saveAudio(j, id); Q = Q.filter(function (x) { return x !== id; }); saveQ(); lastErr = ""; }
  catch (e) { if (e && e.name === "AbortError") { Q = Q.filter(function (x) { return x !== cur; }); saveQ(); } else { lastErr = (e && e.message) || "failed"; cur = null; emit(); setTimeout(pump, navigator.onLine ? 15000 : 0); return; } }
  cur = null; curAbort = null; delete prog[id]; await refreshSaved(); swNote(); emit(); pump();
}
async function saveAudio(j, id) {
  var a = j.audio[id]; if (!a) throw new Error("unknown class");
  var u = a[0], size = a[1], m = (await meta(id)) || { id: id, u: u, size: size, chunk: CH, have: 0, done: false, type: "audio/mpeg" };
  if (m.done) return;
  if (m.chunk !== CH || m.size !== size) m = { id: id, u: u, size: size, chunk: CH, have: 0, done: false, type: "audio/mpeg" };
  var sp = await space(); if (sp && sp.quota && sp.used + (size - m.have * CH) > sp.quota * 0.95) throw new Error("Not enough space on this device");
  var ac = await caches.open(AUDIO), off = m.have * CH, ctl = new AbortController(); curAbort = ctl;
  var init = { mode: "cors", cache: "no-store", credentials: "omit", signal: ctl.signal };
  if (off > 0) init.headers = { Range: "bytes=" + off + "-" };
  var r = await fetch(u, init);
  if (off > 0 && r.status === 200) { off = 0; m.have = 0; }
  else if (!r.ok) throw new Error("download failed (" + r.status + ")");
  var rd = r.body.getReader(), buf = new Uint8Array(CH), fill = 0, idx = m.have; prog[id] = off;
  for (;;) {
    var x = await rd.read(); if (x.done) break;
    var v = x.value, p = 0;
    while (p < v.length) {
      var n = Math.min(CH - fill, v.length - p); buf.set(v.subarray(p, p + n), fill); fill += n; p += n;
      if (fill === CH) { await ac.put(pieceKey(id, idx), new Response(buf.slice(0))); idx++; fill = 0; m.have = idx; await setMeta(m); prog[id] = idx * CH; emit(); }
    }
    prog[id] = idx * CH + fill;
    if (Math.random() < 0.05) emit();
  }
  if (fill) { await ac.put(pieceKey(id, idx), new Response(buf.slice(0, fill))); idx++; }
  var got = (idx - 1) * CH + (fill || CH);
  if (got !== size) { m.have = 0; await setMeta(m); throw new Error("recording was incomplete"); }
  m.have = idx; m.done = true; m.at = Date.now(); await setMeta(m);
}
async function removeAudio(id) {
  if (cur === id && curAbort) { try { curAbort.abort(); } catch (e) {} }
  Q = Q.filter(function (x) { return x !== id; }); saveQ();
  var m = await meta(id), ac = await caches.open(AUDIO);
  var n = m ? Math.ceil(m.size / (m.chunk || CH)) : 0;
  for (var i = 0; i < n; i++) await ac.delete(pieceKey(id, i));
  await (await caches.open(AUDIO_META)).delete(metaKey(id));
  await refreshSaved(); swNote(); emit();
}
function cancelAll() { Q = cur ? [cur] : []; saveQ(); if (curAbort) try { curAbort.abort(); } catch (e) {} emit(); }
window.addEventListener("online", function () { pump(); emit(); });
window.addEventListener("offline", emit);

window.GCOffline = { manifest: manifest, textState: textState, downloadText: downloadText, enqueue: enqueue, removeAudio: removeAudio, refreshSaved: refreshSaved,
  state: function () { return { saved: SAVED, part: PART, queue: Q.slice(), cur: cur, prog: prog, err: lastErr }; }, on: function (f) { listeners.push(f); } };

/* ---------- UI ---------- */
function bar(p) { return '<span class="off-bar"><i style="width:' + Math.max(0, Math.min(100, p)).toFixed(1) + '%"></i></span>'; }
var W = null;
function wdata() { if (!W) W = fetch("/course/wdata.json?v=" + (window.WLV || "1")).then(function (r) { return r.json(); }); return W; }

/* course home */
async function home() {
  var intro = $(".dash .intro"); if (!intro) return;
  var box = document.createElement("section"); box.className = "card offl"; box.id = "offline"; box.setAttribute("aria-label", "Use the course offline");
  intro.parentNode.insertBefore(box, intro.nextSibling);
  box.innerHTML = '<p class="kick">Offline</p><h2 class="off-h">Learn with no internet</h2><div class="off-text"><p class="off-note">Checking…</p></div>' +
    '<details class="off-au"><summary><span>Class recordings</span><span class="off-sum"></span></summary><div class="off-au-body"></div></details>';
  var tb = $(".off-text", box), ab = $(".off-au-body", box), sum = $(".off-sum", box);
  var j, cs, ts;
  try { j = await manifest(); } catch (e) { tb.innerHTML = '<p class="off-note">Offline download isn’t available right now. Try again with a connection.</p>'; return; }
  var dl = null, dlP = 0;
  async function paintText() {
    if (dl && ts) { tb.innerHTML = '<button class="off-btn" type="button" disabled>Downloading…</button>' + bar(dlP * 100) + '<p class="off-note">' + Math.round(dlP * 100) + '% done. Keep this page open.</p>'; return; }
    try { ts = await textState(); } catch (e) { return; }
    if (dl) { tb.innerHTML = '<button class="off-btn" type="button" disabled>Downloading…</button>' + bar(dlP * 100) + '<p class="off-note">' + Math.round(dlP * 100) + '% of ' + mb(ts.total) + '. Keep this page open.</p>'; return; }
    if (ts.ready) {
      var upd = ts.stale.length;
      tb.innerHTML = '<p class="off-ready">Ready offline <span aria-hidden="true">✓</span></p><p class="off-note">Every class’s text, word sheet, explanation, quiz, transcript and key moments are saved on this device (' + mb(ts.total) + '), and My Words works too. Recordings are separate, below.</p>' +
        (upd ? '<button class="off-btn" type="button" data-act="text">Get ' + upd + ' update' + (upd > 1 ? 's' : '') + '</button>' : '');
    } else {
      var part = ts.missing.length < ts.all.length;
      tb.innerHTML = '<button class="off-btn pri" type="button" data-act="text">' + (part ? 'Finish download for offline' : 'Download for offline') + ' · ' + mb(ts.missing.reduce(function (a, t) { return a + t.b; }, 0)) + '</button>' +
        '<p class="off-note">Saves every class’s text, sheets, quiz, transcript and key moments on this device, so the course opens and works with no internet. Recordings are separate, below.</p>';
    }
  }
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]"); if (!b) return;
    var act = b.getAttribute("data-act"), id = b.getAttribute("data-id");
    if (act === "text") {
      dl = downloadText(function (d, n) { dlP = n ? d / n : 1; paintText(); });
      paintText();
      dl.then(function () { dl = null; paintText(); }, function (er) { dl = null; paintText().then(function () { tb.insertAdjacentHTML("beforeend", '<p class="off-err">' + (navigator.onLine ? 'Some files didn’t download. Tap to try again.' : 'No connection. Connect and tap again to finish.') + '</p>'); }); });
    }
    if (act === "save") { var ids = (b.getAttribute("data-ids") || "").split(",").filter(Boolean); confirmSave(ids, b); }
    if (act === "rm") { b.disabled = true; removeAudio(id); }
    if (act === "rmall") { if (confirm("Remove every saved recording from this device?")) Object.keys(SAVED).concat(Object.keys(PART)).forEach(function (x) { removeAudio(x); }); }
    if (act === "stop") cancelAll();
  });
  async function confirmSave(ids, b) {
    var need = ids.filter(function (x) { return !SAVED[x]; }).reduce(function (a, x) { return a + (j.audio[x] ? j.audio[x][1] : 0); }, 0);
    var sp = await space(), free = sp && sp.quota ? sp.quota - sp.used : 0;
    if (sp && sp.quota && need > free * 0.95) { alert("Not enough space: these recordings need " + mb(need) + " and this device has about " + mb(free) + " free for this site."); return; }
    if (ids.length > 1 && need > 300e6 && !confirm("Save " + ids.length + " recordings (" + mb(need) + ") on this device?" + (free ? " About " + mb(free) + " is free for this site." : "") + " Use Wi-Fi, and keep this page open while they save.")) return;
    enqueue(ids);
  }
  function clsName(c) { return c.n + ". " + c.t; }
  async function paintAudio() {
    if (!cs) return;
    var s = GCOffline.state(), sp = await space(), nSaved = Object.keys(s.saved).length;
    var savedBytes = Object.keys(s.saved).reduce(function (a, x) { return a + s.saved[x].size; }, 0);
    sum.textContent = nSaved ? nSaved + " saved · " + mb(savedBytes) : "none saved";
    var all = cs.map(function (c) { return c.id; }), tot = all.reduce(function (a, x) { return a + (j.audio[x] ? j.audio[x][1] : 0); }, 0);
    var A = {}; try { A = JSON.parse(localStorage.getItem("morganAcademy.v1")) || {}; } catch (e) {}
    var done = A.done || {}, last = A.last && A.last.id, start = 0;
    if (last) { for (var i = 0; i < cs.length; i++) if (cs[i].id === last) { start = i; break; } }
    var next = [];
    for (var k = start; k < cs.length && next.length < 5; k++) if (!done[cs[k].id]) next.push(cs[k].id);
    var nextNeed = next.filter(function (x) { return !s.saved[x]; });
    var h = '<p class="off-note">Recordings are large: ' + mb(j.audioMin) + ' to ' + mb(j.audioMax) + ' each, ' + mb(tot) + ' for all ' + cs.length + '. Save the ones you’ll listen to. Use Wi-Fi, and keep this page open while they save.</p>';
    if (s.cur || s.queue.length) {
      var c0 = s.cur && byId[s.cur], got = s.cur ? (s.prog[s.cur] || 0) : 0, sz = s.cur && j.audio[s.cur] ? j.audio[s.cur][1] : 1;
      h += '<div class="off-q"><p class="off-note"><b>Saving' + (c0 ? ' ' + esc(clsName(c0)) : '') + '</b>' + (s.queue.length > 1 ? ' · ' + (s.queue.length - 1) + ' more waiting' : '') + '</p>' + bar(100 * got / sz) + '<p class="off-note">' + mb(got) + ' of ' + mb(sz) + (s.err ? ' · ' + esc(s.err === "offline" ? "waiting for a connection" : s.err) : '') + '</p><button class="off-btn" type="button" data-act="stop">Stop saving</button></div>';
    }
    if (nextNeed.length) h += '<button class="off-btn pri" type="button" data-act="save" data-ids="' + next.join(",") + '">Save your next ' + next.length + ' classes · ' + mb(nextNeed.reduce(function (a, x) { return a + j.audio[x][1]; }, 0)) + '</button>';
    h += '<div class="off-dafs">';
    var secs = []; cs.forEach(function (c) { if (secs.indexOf(c.a) < 0) secs.push(c.a); });
    secs.forEach(function (d) {
      var ids = cs.filter(function (c) { return c.a === d; }).map(function (c) { return c.id; }), sv = ids.filter(function (x) { return s.saved[x]; }).length;
      var need = ids.filter(function (x) { return !s.saved[x]; }).reduce(function (a, x) { return a + j.audio[x][1]; }, 0);
      h += '<div class="off-row"><span><b>Daf ' + d + '</b><small>' + ids.length + ' classes · ' + (sv ? sv + ' saved · ' : '') + (need ? mb(need) + ' to save' : 'all saved') + '</small></span>' + (need ? '<button class="off-sm" type="button" data-act="save" data-ids="' + ids.join(",") + '">Save</button>' : '<span class="off-ok">✓</span>') + '</div>';
    });
    h += '</div>';
    var restNeed = all.filter(function (x) { return !s.saved[x]; });
    if (restNeed.length) h += '<button class="off-btn" type="button" data-act="save" data-ids="' + all.join(",") + '">Save all recordings · ' + mb(restNeed.reduce(function (a, x) { return a + j.audio[x][1]; }, 0)) + '</button>';
    if (nSaved) {
      h += '<h3 class="off-h3">Saved on this device</h3><ul class="off-list">';
      cs.filter(function (c) { return s.saved[c.id]; }).forEach(function (c) { h += '<li><a href="learn.html?n=' + c.n + '">' + esc(clsName(c)) + '<small>Daf ' + c.a + ' · ' + mb(s.saved[c.id].size) + '</small></a><button class="off-sm" type="button" data-act="rm" data-id="' + esc(c.id) + '">Remove</button></li>'; });
      h += '</ul><button class="off-btn" type="button" data-act="rmall">Remove all saved recordings</button>';
    }
    if (sp && sp.quota) h += '<p class="off-note off-sp">This site is using ' + mb(sp.used) + ' of about ' + mb(sp.quota) + ' available on this device.</p>';
    ab.innerHTML = h;
  }
  var byId = {};
  wdata().then(function (d) { cs = d.classes; cs.forEach(function (c) { byId[c.id] = c; }); return refreshSaved(); }).then(paintAudio);
  var t0 = 0; GCOffline.on(function () { var n = Date.now(); if (n - t0 > 400) { t0 = n; paintAudio(); } else setTimeout(paintAudio, 450); });
  paintText();
  pump();
}

/* class page: save this recording */
async function learnPage() {
  var pl = $(".player"); if (!pl) return;
  var row = document.createElement("div"); row.className = "off-cls"; row.setAttribute("aria-live", "polite");
  pl.parentNode.insertBefore(row, pl.nextSibling);
  var j; try { j = await manifest(); } catch (e) { row.remove(); return; }
  await refreshSaved();
  var last = "";
  function curId() { try { return window.__wl && window.__wl.state().cur; } catch (e) { return null; } }
  function paint(force) {
    var id = curId(); if (!id || !j.audio[id]) { row.hidden = true; return; } row.hidden = false;
    var s = GCOffline.state(), sz = j.audio[id][1], h;
    if (s.saved[id]) h = '<span class="off-ok">✓ Recording saved offline</span><button class="off-sm" type="button" data-act="rm">Remove</button>';
    else if (s.cur === id) h = '<span class="off-st">Saving recording… ' + Math.round(100 * (s.prog[id] || 0) / sz) + '% of ' + mb(sz) + (s.err ? ' · ' + esc(s.err === "offline" ? "waiting for a connection" : s.err) : '') + '</span><button class="off-sm" type="button" data-act="rm">Cancel</button>';
    else if (s.queue.indexOf(id) >= 0) h = '<span class="off-st">Waiting to save (' + mb(sz) + ')…</span><button class="off-sm" type="button" data-act="rm">Cancel</button>';
    else if (!navigator.onLine) h = '<span class="off-st">No connection. This recording isn’t saved on this device, but the text, sheets and quiz below work.</span>';
    else h = '<button class="off-save" type="button" data-act="save"><span aria-hidden="true">⤓</span> Save recording offline · ' + mb(sz) + '</button>';
    if (force || h !== last) { row.innerHTML = h; last = h; }
    markList();
  }
  row.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]"); if (!b) return; var id = curId(); if (!id) return;
    if (b.getAttribute("data-act") === "save") enqueue([id]); else removeAudio(id);
    paint(true);
  });
  function markList() {
    var s = GCOffline.state();
    Array.prototype.forEach.call(document.querySelectorAll("#list a.li[data-id]"), function (a) { a.classList.toggle("au-saved", !!s.saved[a.getAttribute("data-id")]); });
  }
  GCOffline.on(function () { paint(); });
  setInterval(paint, 700);
  var L = $("#list"); if (L && window.MutationObserver) new MutationObserver(markList).observe(L, { childList: true });
  window.addEventListener("online", function () { paint(true); }); window.addEventListener("offline", function () { paint(true); });
  paint(true); pump();
}

function offlineBadge() {
  var b = document.createElement("p"), t = 0; b.className = "off-badge"; b.setAttribute("role", "status"); b.textContent = "Offline: using what’s saved on this device"; b.hidden = true;
  document.body.appendChild(b);
  function show() { b.hidden = false; clearTimeout(t); t = setTimeout(function () { b.hidden = true; }, 5000); }
  if (!navigator.onLine) show();
  window.addEventListener("online", function () { b.hidden = true; }); window.addEventListener("offline", show);
}

function boot() {
  offlineBadge();
  if (MODE === "home" && B.getAttribute("data-open") === "learn.html") home();
  else if (MODE === "whole") learnPage();
  else pump();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
