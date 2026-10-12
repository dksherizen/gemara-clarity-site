// Gemara Clarity, rebuilt. Static, no keys, no trackers.
// Text: Sefaria public API. Breakdowns: read-only from the original app's public cloud library.
import { segmentMarker, segmentFlags, stepFlags, endState } from "./mishnah.js";
const MAS = [["Berakhot", "ברכות", 2, 126], ["Shabbat", "שבת", 2, 313], ["Eruvin", "עירובין", 2, 208], ["Pesachim", "פסחים", 2, 241], ["Yoma", "יומא", 2, 174], ["Sukkah", "סוכה", 2, 111], ["Beitzah", "ביצה", 2, 79], ["Rosh_Hashanah", "ראש השנה", 2, 68], ["Taanit", "תענית", 2, 60], ["Megillah", "מגילה", 2, 62], ["Moed_Katan", "מועד קטן", 2, 56], ["Chagigah", "חגיגה", 2, 52], ["Yevamot", "יבמות", 2, 243], ["Ketubot", "כתובות", 2, 223], ["Nedarim", "נדרים", 2, 181], ["Nazir", "נזיר", 2, 131], ["Sotah", "סוטה", 2, 97], ["Gittin", "גיטין", 2, 179], ["Kiddushin", "קידושין", 2, 163], ["Bava_Kamma", "בבא קמא", 2, 237], ["Bava_Metzia", "בבא מציעא", 2, 236], ["Bava_Batra", "בבא בתרא", 2, 351], ["Sanhedrin", "סנהדרין", 2, 225], ["Makkot", "מכות", 2, 47], ["Shevuot", "שבועות", 2, 97], ["Avodah_Zarah", "עבודה זרה", 2, 151], ["Horayot", "הוריות", 2, 26], ["Zevachim", "זבחים", 2, 239], ["Menachot", "מנחות", 2, 218], ["Chullin", "חולין", 2, 282], ["Bekhorot", "בכורות", 2, 120], ["Arakhin", "ערכין", 2, 66], ["Temurah", "תמורה", 2, 66], ["Keritot", "כריתות", 2, 55], ["Meilah", "מעילה", 2, 42], ["Tamid", "תמיד", 49, 65], ["Niddah", "נדה", 2, 144]]; // [key, hebrew, firstAmudIndex, lastAmudIndex]  index: 2 = 2a, 3 = 2b ...
const SEDARIM = [
  ["Zeraim","זרעים",["Berakhot"]],
  ["Moed","מועד",["Shabbat","Eruvin","Pesachim","Yoma","Sukkah","Beitzah","Rosh_Hashanah","Taanit","Megillah","Moed_Katan","Chagigah"]],
  ["Nashim","נשים",["Yevamot","Ketubot","Nedarim","Nazir","Sotah","Gittin","Kiddushin"]],
  ["Nezikin","נזיקין",["Bava_Kamma","Bava_Metzia","Bava_Batra","Sanhedrin","Makkot","Shevuot","Avodah_Zarah","Horayot"]],
  ["Kodashim","קדשים",["Zevachim","Menachot","Chullin","Bekhorot","Arakhin","Temurah","Keritot","Meilah","Tamid"]],
  ["Taharot","טהרות",["Niddah"]]
];
const ALIASES = {
  Berakhot:["berachot","brachot","brachos","berachos","berakhos","berakot"], Shabbat:["shabbos","shabat","shabbath"], Eruvin:["eiruvin","erubin"],
  Pesachim:["psachim","pesahim"], Yoma:["yuma"], Sukkah:["succah","sukka","suka","sukah"], Beitzah:["beitza","betzah","beitsa","beytzah","betza"],
  Rosh_Hashanah:["rosh hashana","rh","roshhashana"], Taanit:["taanis","taanith","tanit"], Megillah:["megila","megilla"], Moed_Katan:["moed katan","mk","moedkatan"],
  Chagigah:["chagiga","hagigah"], Yevamot:["yevamos","yebamot"], Ketubot:["kesubos","ketubos","ketuvot","kesuvos"], Nedarim:[], Nazir:[], Sotah:["sota"],
  Gittin:["gitin"], Kiddushin:["kidushin","qiddushin"], Bava_Kamma:["bava kama","baba kama","baba kamma","bk"], Bava_Metzia:["bava metziah","baba metzia","bm"],
  Bava_Batra:["bava basra","baba batra","baba basra","bb"], Sanhedrin:[], Makkot:["makkos","makos","makot"], Shevuot:["shevuos","shvuot","shavuot"],
  Avodah_Zarah:["avoda zara","avodah zara","az","avoda zarah"], Horayot:["horayos","horiyot"], Zevachim:["zvachim"], Menachot:["menachos","menahot"],
  Chullin:["chulin","hullin"], Bekhorot:["bechoros","bechorot","bekhoros"], Arakhin:["erchin","arachin","arakin"], Temurah:["temura"], Keritot:["kerisos","kritot","keritos"],
  Meilah:["meila"], Tamid:[], Niddah:["nida","nidah","nidda"]
};
const HE_ALIASES = { "ב״ק":"Bava_Kamma","בק":"Bava_Kamma","ב״מ":"Bava_Metzia","במ":"Bava_Metzia","ב״ב":"Bava_Batra","בב":"Bava_Batra","ע״ז":"Avodah_Zarah","עז":"Avodah_Zarah","ר״ה":"Rosh_Hashanah","רה":"Rosh_Hashanah","מו״ק":"Moed_Katan" };
const TYPES = {
  "מימרא":{k:"mimra",en:"Statement",tr:"Mimra",d:"A teaching, ruling or opinion is stated."},
  "שאלה":{k:"sheelah",en:"Question",tr:"She'elah",d:"Someone asks for information or a source."},
  "תשובה":{k:"teshuvah",en:"Response",tr:"Teshuvah",d:"The answer to a question."},
  "קשיא":{k:"kashya",en:"Challenge",tr:"Kashya",d:"An objection: this seems to contradict something."},
  "תירוץ":{k:"terutz",en:"Resolution",tr:"Terutz",d:"The challenge is answered."},
  "ראיה":{k:"raaya",en:"Proof",tr:"Ra'aya",d:"A source is brought to support a position."},
  "דחיה":{k:"dechiya",en:"Rejection",tr:"Dechiya",d:"A proof is pushed aside: it doesn't have to mean that."},
  "מסקנא":{k:"maskana",en:"Conclusion",tr:"Maskana",d:"Where the discussion lands."}
};
const CONFUSABLE = {mimra:["maskana","teshuvah"],maskana:["mimra","terutz"],kashya:["sheelah","dechiya"],sheelah:["kashya","raaya"],terutz:["teshuvah","dechiya"],teshuvah:["terutz","maskana"],raaya:["dechiya","mimra"],dechiya:["raaya","kashya"]};
const MISHNAH = { en:"Mishnah", he:"משנה", d:"Not a type of step but where it stands: the step is the Mishnah itself, from <bdi>מתני׳</bdi> up to <bdi>גמ׳</bdi>. Its own type colour stays beside the badge." };
const MBADGE = `<span class="mbadge">Mishnah · <span class="he">משנה</span></span>`;
const isMish = k => !!(current && current.mish && current.mish[k]);
const PHASES = {mishnah:"On the Mishnah",opening_question:"Opening question",source_derivation:"Finding the source",objection_defense_cycle:"Challenge and defence",alternate_branch:"Another approach",clarification_of_terms:"Defining terms",narrative_aggadah:"Story / aggadah",conclusion:"Conclusion"};
const FS_BASE = "https://firestore.googleapis.com/v1/projects/gemara-clarity/databases/(default)/documents/artifacts/gemara-clarity-public/public/data/gemara_cache_v5";
const SEFARIA = "https://www.sefaria.org";
const LS = { settings:"gc2-settings", bookmarks:"gc2-bookmarks", history:"gc2-history", key:"gc2-openai-key", explained:"gc2-open" };
const DATA_CACHE = "gc2-data-v1";

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const NIKUD = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g;
const loadJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const settings = Object.assign({ scale:1, nikud:true, translation:true, colors:true, notes:true, terms:true, logic:false, expandAll:false, theme:"dark" }, loadJSON(LS.settings, {}));
let cloudIds = new Set();
let cloudLoaded = false;
let current = null; // {m, i, id, analysis, source:'cloud'|'local'|null, text, tab}
let observer = null;

/* ---------- refs ---------- */
const masInfo = key => MAS.find(x => x[0] === key);
const masName = key => key.replace(/_/g, " ");
const dafOf = i => ({ daf: Math.floor(i/2) + 1, amud: i % 2 ? "b" : "a" });
const idxOf = (daf, amud) => (daf - 1) * 2 + (amud === "b" ? 1 : 0);
const label = (m, i) => { const {daf, amud} = dafOf(i); return `${masName(m)} ${daf}${amud}`; };
const refId = (m, i) => { const {daf, amud} = dafOf(i); return `${m}_${daf}_${amud}`; };
const parseId = id => { const p = id.split("_"); const amud = p.pop(); const daf = +p.pop(); return { m: p.join("_"), i: idxOf(daf, amud) }; };
const hashFor = (m, i, extra="") => `#/${m}/${dafOf(i).daf}${dafOf(i).amud}${extra}`;
function gematria(n){
  const ones=["","א","ב","ג","ד","ה","ו","ז","ח","ט"], tens=["","י","כ","ל","מ","נ","ס","ע","פ","צ"], hund=["","ק","ר","ש","ת"];
  let s = hund[Math.floor(n/100)] || ""; n %= 100;
  if (n === 15) s += "טו"; else if (n === 16) s += "טז"; else s += tens[Math.floor(n/10)] + ones[n%10];
  return s.length > 1 ? s.slice(0,-1) + "״" + s.slice(-1) : s + "׳";
}
const heLabel = (m, i) => { const {daf, amud} = dafOf(i); return `${masInfo(m)[1]} ${gematria(daf)} ${amud === "a" ? "ע״א" : "ע״ב"}`; };
function neighbor(m, i, dir){
  const mi = MAS.findIndex(x => x[0] === m); const [, , first, last] = MAS[mi];
  const j = i + dir;
  if (j >= first && j <= last) return { m, i: j };
  const nm = MAS[mi + dir]; if (!nm) return null;
  return { m: nm[0], i: dir > 0 ? nm[2] : nm[3] };
}
function heNum(str){ const v={"א":1,"ב":2,"ג":3,"ד":4,"ה":5,"ו":6,"ז":7,"ח":8,"ט":9,"י":10,"כ":20,"ך":20,"ל":30,"מ":40,"ם":40,"נ":50,"ן":50,"ס":60,"ע":70,"פ":80,"ף":80,"צ":90,"ץ":90,"ק":100,"ר":200,"ש":300,"ת":400}; let n=0; for (const c of str) n += v[c]||0; return n; }
const norm = s => s.toLowerCase().replace(/[_'’".\-]/g," ").replace(/\s+/g," ").trim();
function matchMasechet(q){
  q = norm(q); if (!q) return [];
  const out = [];
  for (const [key, he] of MAS) {
    const names = [norm(masName(key)), ...(ALIASES[key]||[]).map(norm)];
    const compact = names.map(n => n.replace(/ /g,""));
    const qc = q.replace(/ /g,"");
    let score = 0;
    if (names.includes(q) || compact.includes(qc)) score = 3;
    else if (names.some(n => n.startsWith(q)) || compact.some(n => n.startsWith(qc))) score = 2;
    else if (qc.length >= 3 && compact.some(n => n.includes(qc))) score = 1;
    if (he.replace(/ /g,"") === q.replace(/ /g,"")) score = 3; else if (q.length >= 2 && he.startsWith(q)) score = Math.max(score, 2);
    if (HE_ALIASES[q] === key || HE_ALIASES[q.replace(/["״]/g,"")] === key) score = 3;
    if (score) out.push([score, key]);
  }
  return out.sort((a,b) => b[0]-a[0]).map(x => x[1]);
}
function parseGoto(q){
  q = q.trim(); if (!q) return [];
  // Latin: "makkot 5b", "bm 21:", "berachos 2."
  let m = q.match(/^(.*?)[\s.]*(\d{1,3})\s*([ab:.]|amud\s*[ab]|\s*ע["״]?[אב])?\s*$/i);
  let name, daf, amud = null;
  if (m) { name = m[1]; daf = +m[2]; const a = (m[3]||"").toLowerCase(); amud = /b|:|ב/.test(a) ? "b" : /a|\.|א/.test(a) ? "a" : null; }
  else {
    // Hebrew: "ברכות ב", "ב״מ כא ע״ב"
    const hm = q.match(/^(.+?)\s+([א-ת"״׳']{1,5})(?:\s+(ע["״]?[אב]|[.:]))?\s*$/);
    if (hm) { name = hm[1]; daf = heNum(hm[2].replace(/["״׳']/g,"")); const a = hm[3]||""; amud = /ב|:/.test(a) ? "b" : a ? "a" : null; }
    else { name = q; daf = null; }
  }
  const keys = matchMasechet(name).slice(0, 6);
  const res = [];
  for (const key of keys) {
    const [, , first, last] = masInfo(key);
    if (daf) {
      for (const am of amud ? [amud] : ["a","b"]) { const i = idxOf(daf, am); if (i >= first && i <= last) res.push({ m:key, i }); }
    } else res.push({ m:key, i:null });
  }
  return res;
}

/* ---------- data ---------- */
async function cachedJSON(url, { ttl = 7*864e5, timeout = 15000, key = url } = {}) {
  let cache = null; try { cache = await caches.open(DATA_CACHE); } catch {}
  let stale = null;
  if (cache) {
    const hit = await cache.match(key);
    if (hit) {
      const saved = +hit.headers.get("x-saved") || 0;
      stale = await hit.json();
      if (Date.now() - saved < ttl) return stale;
    }
  }
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeout);
    const r = await fetch(url, { signal: ctl.signal }); clearTimeout(t);
    if (r.status === 404) { const e = new Error("not found"); e.notFound = true; throw e; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    if (cache) cache.put(key, new Response(JSON.stringify(data), { headers: { "content-type":"application/json", "x-saved": String(Date.now()) } })).catch(()=>{});
    return data;
  } catch (e) { if (stale && !e.notFound) return stale; throw e; }
}
function fsDecode(v){
  if (!v || typeof v !== "object") return v;
  const k = Object.keys(v)[0], x = v[k];
  if (k === "mapValue") { const o = {}; for (const [a,b] of Object.entries(x.fields||{})) o[a] = fsDecode(b); return o; }
  if (k === "arrayValue") return (x.values||[]).map(fsDecode);
  if (k === "integerValue") return +x;
  if (k === "doubleValue") return +x;
  if (k === "nullValue") return null;
  return x;
}
// Breakdowns generated with the original app's exact prompt, stored as static JSON beside the site (data/b/<id>.json).
let staticIds = new Set(), fsIds = new Set(), staticVersion = "";
// index.json carries a data version; each amud is fetched as <id>.json?v=<version>, so a re-reviewed library reaches phones at once
const staticReady = cachedJSON("data/b/index.json", { ttl: 10*60e3, timeout: 8000 })
  .then(j => { staticIds = new Set(j.ids || []); staticVersion = String(j.version || j.generated || ""); }).catch(e => console.warn("static library index unavailable", e));
async function loadCloudIndex(){
  const fsPart = (async () => {
    try {
      const ids = []; let tok = "";
      for (let page = 0; page < 20; page++) {
        const url = `${FS_BASE}?pageSize=300&mask.fieldPaths=timestamp${tok ? "&pageToken="+encodeURIComponent(tok) : ""}`;
        const j = await cachedJSON(url, { ttl: 30*60e3 });
        for (const d of j.documents || []) ids.push(d.name.split("/").pop());
        tok = j.nextPageToken; if (!tok) break;
      }
      fsIds = new Set(ids);
    } catch (e) { console.warn("library index unavailable", e); }
  })();
  await Promise.all([fsPart, staticReady]);
  cloudIds = new Set([...fsIds, ...staticIds]); cloudLoaded = true;
}
async function loadCloudAnalysis(id){
  await staticReady;
  if (staticIds.has(id) && !fsIds.has(id)) {
    const a = await cachedJSON(`data/b/${encodeURIComponent(id)}.json${staticVersion ? "?v=" + encodeURIComponent(staticVersion) : ""}`, { ttl: 3*864e5 });
    return a && Array.isArray(a.steps) && a.steps.length ? a : null;
  }
  try {
    const j = await cachedJSON(`${FS_BASE}/${encodeURIComponent(id)}?mask.fieldPaths=analysis`, { ttl: 3*864e5 });
    const a = fsDecode({ mapValue: { fields: j.fields || {} } }).analysis;
    return a && Array.isArray(a.steps) && a.steps.length ? a : null;
  } catch (e) { if (e.notFound) return null; throw e; }
}
async function localAnalysis(id){
  try { const c = await caches.open(DATA_CACHE); const r = await c.match("/local-analysis/" + id); return r ? r.json() : null; } catch { return null; }
}
async function saveLocalAnalysis(id, data){
  const c = await caches.open(DATA_CACHE); await c.put("/local-analysis/" + id, new Response(JSON.stringify(data), { headers: { "content-type":"application/json" } }));
}
async function loadText(m, i){
  const { daf, amud } = dafOf(i);
  const j = await cachedJSON(`${SEFARIA}/api/texts/${m}.${daf}${amud}?context=0&commentary=0&pad=0`, { ttl: 60*864e5 });
  const flat = v => !v ? [] : typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(flat) : [];
  return { he: flat(j.he), en: flat(j.text), heRef: j.heRef, version: j.versionTitle, heVersion: j.heVersionTitle, license: j.license };
}
async function dafYomi(){
  const d = new Date(); const key = `daf-yomi-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  const j = await cachedJSON(`${SEFARIA}/api/calendars?year=${d.getFullYear()}&month=${d.getMonth()+1}&day=${d.getDate()}`, { ttl: 12*3600e3, key: "/" + key, timeout: 8000 });
  const item = (j.calendar_items||[]).find(c => c.title && c.title.en === "Daf Yomi");
  if (!item) return null;
  const mm = item.ref.match(/^(.*) (\d+)$/); if (!mm) return null;
  const key2 = mm[1].replace(/ /g,"_"); if (!masInfo(key2)) return null;
  return { m: key2, i: Math.max(idxOf(+mm[2], "a"), masInfo(key2)[2]) };
}

/* ---------- sanitising Sefaria markup ---------- */
function sanitize(html, he){
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  doc.querySelectorAll("sup, .footnote, i.footnote, .footnote-marker, script, style").forEach(n => n.remove());
  const walk = node => [...node.childNodes].map(c => {
    if (c.nodeType === 3) { let t = c.nodeValue; if (he && !settings.nikud) t = t.replace(NIKUD, ""); return esc(t); }
    if (c.nodeType !== 1) return "";
    const tag = c.tagName.toLowerCase(), inner = walk(c);
    if (tag === "b" || tag === "strong" || tag === "big") return `<b>${inner}</b>`;
    if (tag === "i" || tag === "em") return `<i>${inner}</i>`;
    if (tag === "br") return " ";
    return inner;
  }).join("");
  return walk(doc.body.firstChild).replace(/\s+/g, " ").trim();
}
const heTxt = t => { t = String(t||"").replace(/<[^>]+>/g, ""); return esc(settings.nikud ? t : t.replace(NIKUD, "")); };

/* ---------- UI helpers ---------- */
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2400); }
function applySettings(){
  const b = document.body;
  b.classList.remove("theme-dark","theme-light","theme-sepia"); b.classList.add("theme-" + settings.theme);
  b.classList.toggle("hide-translation", !settings.translation);
  b.classList.toggle("no-colors", !settings.colors);
  b.classList.toggle("hide-notes", !settings.notes);
  b.classList.toggle("hide-terms", !settings.terms);
  b.classList.toggle("hide-logic", !settings.logic);
  document.documentElement.style.setProperty("--scale", settings.scale);
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(b).getPropertyValue("--bg").trim() || "#07101d";
  saveJSON(LS.settings, settings);
}
function openSheet(title, html, onMount){
  const old = $("#sheetBody"), fresh = old.cloneNode(false); old.replaceWith(fresh); // drop listeners from the previous sheet
  $("#sheetTitle").textContent = title; fresh.innerHTML = html;
  $("#sheet").hidden = false; $("#backdrop").hidden = false; document.body.style.overflow = "hidden";
  openSheet.last = document.activeElement;
  onMount && onMount($("#sheetBody"));
  setTimeout(() => { const f = $("#sheetBody [autofocus]") || $("#sheetClose"); f && f.focus(); }, 30);
}
function closeSheet(){ if ($("#sheet").hidden) return; $("#sheet").hidden = true; $("#backdrop").hidden = true; document.body.style.overflow = ""; try { openSheet.last && openSheet.last.focus && openSheet.last.focus({ preventScroll: true }); } catch {} }
const bookmarks = () => loadJSON(LS.bookmarks, []);
const history_ = () => loadJSON(LS.history, []);
function pushHistory(id){ const h = history_().filter(x => x.id !== id); h.unshift({ id, t: Date.now() }); saveJSON(LS.history, h.slice(0, 30)); }
function go(m, i, extra=""){ location.hash = hashFor(m, i, extra); }
const chev = `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
const hasBreakdown = id => cloudIds.has(id);

/* ---------- picker ---------- */
function openPicker(focusMas){
  const html = `
    <input class="input" id="gotoInput" type="search" autocomplete="off" placeholder="Type a daf, e.g. Makkot 5b" aria-label="Go to a daf" autofocus>
    <div class="sugg" id="gotoSugg"></div>
    <div id="yomiSlot"></div>
    <div id="pickBody"></div>`;
  openSheet("Go to a daf", html, body => {
    const input = $("#gotoInput", body), sugg = $("#gotoSugg", body);
    const showMasList = () => {
      $("#pickBody", body).innerHTML = SEDARIM.map(([en, he, list]) => `<div class="seder">Seder ${en} · <span class="en-he">${he}</span></div><div class="masgrid">${list.map(k => {
        const n = [...cloudIds].filter(id => parseId(id).m === k).length;
        return `<button class="masbtn" data-mas="${k}"><span>${masName(k)}${n ? `<span class="badge" title="${n} amudim with breakdown">● ${n}</span>` : ""}</span><span class="he">${masInfo(k)[1]}</span></button>`; }).join("")}</div>`).join("");
    };
    const showDafGrid = k => {
      const [, he, first, last] = masInfo(k);
      let cells = "";
      for (let d = Math.floor(first/2)+1; d <= Math.floor(last/2)+1; d++) {
        const cell = am => { const i = idxOf(d, am); const ok = i >= first && i <= last; const id = refId(k, i);
          const cur = current && current.m === k && current.i === i;
          return `<button ${ok ? "" : "disabled"} data-go="${k}|${i}" class="${hasBreakdown(id) ? "has" : ""} ${cur ? "cur" : ""}" aria-label="${masName(k)} ${d}${am}${hasBreakdown(id) ? ", has breakdown" : ""}">${am}</button>`; };
        cells += `<div class="dafcell"><span class="dn">${d}</span>${cell("a")}${cell("b")}</div>`;
      }
      $("#pickBody", body).innerHTML = `<div class="seder"><button class="chip" data-back>‹ All masechtot</button></div>
        <h3 style="margin:8px 0 0;display:flex;justify-content:space-between">${masName(k)} <span class="he en-he" style="color:var(--muted);font-weight:500">${he}</span></h3>
        <div class="legend-mini"><span><i></i>full step-by-step breakdown</span><span>others: text and translation</span></div>
        <div class="dafgrid">${cells}</div>`;
      const c = $("button.cur", body); c && c.scrollIntoView({ block: "center" });
    };
    body.addEventListener("click", e => {
      const t = e.target.closest("[data-mas],[data-go],[data-back]"); if (!t) return;
      if (t.dataset.mas) showDafGrid(t.dataset.mas);
      else if (t.dataset.back !== undefined) showMasList();
      else { const [k, i] = t.dataset.go.split("|"); closeSheet(); go(k, +i); }
    });
    input.addEventListener("input", () => {
      const r = parseGoto(input.value).slice(0, 6);
      sugg.innerHTML = r.map(x => x.i == null
        ? `<button class="chip" data-mas="${x.m}"><span>${masName(x.m)}</span><span class="he en-he x">${masInfo(x.m)[1]}</span></button>`
        : `<button class="chip" data-go="${x.m}|${x.i}"><span>${label(x.m, x.i)}${hasBreakdown(refId(x.m, x.i)) ? ` <span style="color:var(--accent)">● breakdown</span>` : ""}</span><span class="he x">${heLabel(x.m, x.i)}</span></button>`).join("")
        || (input.value.trim() ? `<div class="empty">No match yet. Try “Berakhot 2a”.</div>` : "");
    });
    input.addEventListener("keydown", e => { if (e.key === "Enter") { const f = $("button", sugg); f && f.click(); } });
    if (focusMas) showDafGrid(focusMas); else if (current) showDafGrid(current.m); else showMasList();
    dafYomi().then(y => { if (y && $("#yomiSlot", body)) $("#yomiSlot", body).innerHTML = `<button class="chip" data-go="${y.m}|${y.i}" style="width:100%;justify-content:space-between;min-height:46px;border-radius:12px"><span>Today’s Daf Yomi: <b>${masName(y.m)} ${dafOf(y.i).daf}</b></span><span class="x">›</span></button>`; }).catch(()=>{});
  });
}

/* ---------- settings ---------- */
function openSettings(){
  const sw = (key, title, sub) => `<label class="setrow"><span class="lbl"><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}</span><span class="switch"><input type="checkbox" data-set="${key}" ${settings[key] ? "checked" : ""}><span></span></span></label>`;
  const key = localStorage.getItem(LS.key) || "";
  const html = `
    <div class="setrow"><span class="lbl"><b>Text size</b><span>Hebrew/Aramaic and English together</span></span>
      <span class="sizer"><button data-size="-1" aria-label="Smaller text">A−</button><button data-size="1" aria-label="Larger text">A+</button></span></div>
    <div class="preview-he">${heTxt("אָמַר רַבִּי יוֹחָנָן מִשּׁוּם רַבִּי שִׁמְעוֹן בֶּן יוֹחַי")}</div>
    <div class="preview-en">Rabbi Yoḥanan said in the name of Rabbi Shimon ben Yoḥai…</div>
    <div class="setrow"><span class="lbl"><b>Theme</b></span><span class="seg3">${["dark","light","sepia"].map(t => `<button data-theme="${t}" aria-pressed="${settings.theme === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</span></div>
    ${sw("translation","English translation","Beside each phrase")}
    ${sw("nikud","Vowels (nikud)","Turn off to practise reading plain text")}
    ${sw("colors","Step colours")}
    ${sw("notes","Phrase notes")}
    ${sw("terms","Key terms")}
    ${sw("logic","Logic details","Trigger words, what attacks what, how it is resolved")}
    ${sw("expandAll","Open every explanation","Otherwise tap a step to open it")}
    <h3 style="margin:22px 0 4px;font-size:16px">Offline</h3>
    <p class="small" style="margin:0 0 8px">Every daf you open is saved on this device automatically. You can also save the whole breakdown library now (${cloudIds.size || "all"} amudim) for learning without signal.</p>
    <button class="btn" id="saveAll">Save library for offline</button> <span class="small" id="saveAllMsg"></span>
    <h3 style="margin:22px 0 4px;font-size:16px">Make new breakdowns (optional)</h3>
    <p class="small" style="margin:0 0 8px">For an amud with no breakdown yet, you can create one with your own OpenAI API key. The key is stored only in this browser, and the breakdown is saved only on this device.</p>
    <input class="input" id="keyInput" type="password" autocomplete="off" placeholder="sk-…" value="${esc(key)}" aria-label="Your OpenAI API key">
    <div style="display:flex;gap:8px;margin-top:8px"><button class="btn" id="saveKey">Save key</button><button class="btn" id="clearKey">Remove key</button></div>
    <h3 style="margin:22px 0 4px;font-size:16px">About</h3>
    <p class="small" style="margin:0">Text and translation: Sefaria, William Davidson Edition (CC BY-NC). Step-by-step breakdowns are AI-generated with the original <a href="https://gemara-clarity.netlify.app/" target="_blank" rel="noopener">Gemara Clarity</a> prompt (his library, plus amudim generated the same way); check them against the text and your teacher.</p>
    <p class="small"><button class="btn" id="clearData" style="margin-top:10px">Clear my bookmarks, history and saved data</button></p>`;
  openSheet("Text and display", html, body => {
    body.addEventListener("change", e => { const k = e.target.dataset.set; if (k) { settings[k] = e.target.checked; applySettings(); rerender(); } });
    body.addEventListener("click", async e => {
      const t = e.target.closest("button"); if (!t) return;
      if (t.dataset.size) { settings.scale = Math.min(1.7, Math.max(0.85, +(settings.scale + 0.1 * +t.dataset.size).toFixed(2))); applySettings(); }
      if (t.dataset.theme) { settings.theme = t.dataset.theme; applySettings(); $$("[data-theme]", body).forEach(b => b.setAttribute("aria-pressed", b.dataset.theme === settings.theme)); }
      if (t.id === "saveKey") { const v = $("#keyInput", body).value.trim(); if (v) { localStorage.setItem(LS.key, v); toast("Key saved on this device only"); rerender(); } }
      if (t.id === "clearKey") { localStorage.removeItem(LS.key); $("#keyInput", body).value = ""; toast("Key removed"); rerender(); }
      if (t.id === "saveAll") saveLibrary($("#saveAllMsg", body), t);
      if (t.id === "clearData") { if (confirm("Clear bookmarks, history, saved dapim and settings on this device?")) { Object.values(LS).forEach(k => localStorage.removeItem(k)); try { await caches.delete(DATA_CACHE); } catch {} location.hash = "#/"; location.reload(); } }
    });
    if (!settings.nikud) $(".preview-he", body).textContent = "אמר רבי יוחנן משום רבי שמעון בן יוחי";
  });
}
async function saveLibrary(msg, btn){
  btn.disabled = true; const ids = [...cloudIds]; let done = 0, fail = 0;
  const run = async id => { try { await loadCloudAnalysis(id); const p = parseId(id); await loadText(p.m, p.i); } catch { fail++; } done++; msg.textContent = ` ${done}/${ids.length}`; };
  for (let k = 0; k < ids.length; k += 4) await Promise.all(ids.slice(k, k + 4).map(run));
  msg.textContent = fail ? ` Saved ${done - fail}; ${fail} failed (try again with signal)` : ` Saved all ${done}.`;
  btn.disabled = false;
}

/* ---------- home ---------- */
function libraryHtml(){
  if (!cloudLoaded) return `<div class="skel"></div><div class="skel" style="width:70%"></div>`;
  if (!cloudIds.size) return `<div class="empty">The breakdown library couldn’t be reached right now. Every daf still opens with text and translation.</div>`;
  const by = {};
  for (const id of cloudIds) { const p = parseId(id); (by[p.m] ||= []).push(p.i); }
  return `<div class="lib">${MAS.filter(x => by[x[0]]).map(([k, he]) => `<div class="card lib-row"><h3><span>${masName(k)}</span><span class="he">${he}</span></h3>
    <div class="chips">${by[k].sort((a,b) => a-b).map(i => `<a class="chip" href="${hashFor(k, i)}">${dafOf(i).daf}${dafOf(i).amud}</a>`).join("")}</div></div>`).join("")}</div>`;
}
function renderHome(){
  current = null; document.title = "Gemara Clarity: every sugya, step by step";
  setChrome(false);
  const h = history_(), bm = bookmarks();
  const last = h[0] && parseId(h[0].id);
  $("#view").innerHTML = `
    <div class="dedication"><div class="en">In loving memory of Tzvi Sherizen</div><span class="he">אליעזר אברהם צבי בן פתחיה לייב</span></div>
    <div class="hero"><h1>Gemara Clarity</h1><p>Every sugya, step by step: the Aramaic beside the English, phrase by phrase, with every question, challenge, answer and conclusion in its own colour.</p>
      <button class="searchbox" id="homeSearch"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>Go to any daf…</button></div>
    <div class="home-grid two">
      ${last && masInfo(last.m) ? `<a class="tile accent" href="${hashFor(last.m, last.i)}"><div class="k">Continue</div><div class="v">${label(last.m, last.i)}</div><div class="s he" style="text-align:left">${heLabel(last.m, last.i)}</div></a>` : `<a class="tile accent" href="#/Berakhot/2a"><div class="k">Start here</div><div class="v">Berakhot 2a</div><div class="s">The first daf of Shas, fully broken down</div></a>`}
      <a class="tile" id="yomiTile" href="#" aria-busy="true"><div class="k">Today’s Daf Yomi</div><div class="v" id="yomiV">…</div><div class="s" id="yomiS">&nbsp;</div></a>
    </div>
    ${bm.length ? `<div class="section-h">Bookmarks</div><div class="chips">${bm.map(id => { const p = parseId(id); return masInfo(p.m) ? `<a class="chip" href="${hashFor(p.m, p.i)}">★ ${label(p.m, p.i)}</a>` : ""; }).join("")}</div>` : ""}
    ${h.length > 1 ? `<div class="section-h">Recently learned</div><div class="chips">${h.slice(0, 10).map(x => { const p = parseId(x.id); return masInfo(p.m) ? `<a class="chip" href="${hashFor(p.m, p.i)}">${label(p.m, p.i)}${hasBreakdown(x.id) ? "" : ` <span class="x">text</span>`}</a>` : ""; }).join("")}</div>` : ""}
    <div class="section-h">Fully broken down <small>${cloudIds.size ? cloudIds.size + " amudim" : ""}</small></div>
    <div id="libSlot">${libraryHtml()}</div>
    <p class="small" style="margin:10px 4px 0">Every other daf in Shas opens too, with the full text and translation side by side.</p>
    <div class="section-h">The eight kinds of step</div>
    <div class="legend">${Object.entries(TYPES).map(([he, t]) => `<div class="lg t-${t.k}"><span class="swatch"></span><div><b><span class="en-he">${he}</span> · ${t.en}</b><div class="d">${t.d}</div></div></div>`).join("")}<div class="lg t-mishnah"><span class="swatch"></span><div><b><span class="en-he">${MISHNAH.he}</span> · ${MISHNAH.en} badge</b><div class="d">${MISHNAH.d}</div></div></div></div>
    <div class="footer-ded">Gemara Clarity<span class="he">לעילוי נשמת אליעזר אברהם צבי בן פתחיה לייב</span></div>`;
  $("#homeSearch").onclick = () => openPicker();
  dafYomi().then(y => {
    const tile = $("#yomiTile"); if (!tile) return;
    if (!y) { $("#yomiV").textContent = "Unavailable offline"; return; }
    tile.href = hashFor(y.m, y.i); tile.removeAttribute("aria-busy");
    $("#yomiV").textContent = `${masName(y.m)} ${dafOf(y.i).daf}`;
    $("#yomiS").textContent = hasBreakdown(refId(y.m, y.i)) ? "Full breakdown available" : "Text and translation, side by side";
  }).catch(() => { const v = $("#yomiV"); if (v) v.textContent = "Unavailable offline"; });
}

/* ---------- daf view ---------- */
function setChrome(onDaf){
  $("#bottombar").hidden = !onDaf;
  $(".layout").classList.toggle("with-side", !!(onDaf && current && current.analysis && current.tab === "steps"));
  $("#refBtnText").textContent = current ? label(current.m, current.i) : "Choose a daf";
  if (!onDaf) { $("#sidebar").innerHTML = ""; $("#progressFill").style.width = "0"; }
}
function updateNav(){
  if (!current) return;
  const p = neighbor(current.m, current.i, -1), n = neighbor(current.m, current.i, 1);
  const short = x => x ? (x.m === current.m ? `${dafOf(x.i).daf}${dafOf(x.i).amud}` : masName(x.m)) : "";
  $("#prevBtn").disabled = !p; $("#nextBtn").disabled = !n;
  $("#prevLabel").textContent = short(p); $("#nextLabel").textContent = short(n);
  $("#prevBtn").onclick = () => p && go(p.m, p.i); $("#nextBtn").onclick = () => n && go(n.m, n.i);
  const hasSteps = !!current.analysis;
  $("#flowBtn").hidden = !hasSteps || current.tab !== "steps"; $("#reviewBtn").hidden = !hasSteps;
  $("#stepCounter").textContent = hasSteps ? `${current.analysis.steps.length} steps` : "";
}
function flowHtml(steps){
  let depth = 0, phase = null, out = "";
  steps.forEach((s, k) => {
    const t = TYPES[s.hebrewStepName] || TYPES["מימרא"];
    if (s.macroPhase && s.macroPhase !== phase) { phase = s.macroPhase; out += `<div class="phase">${esc(PHASES[phase] || phase)}</div>`; }
    if (k > 0 && (s.branchRole === "opens_new_branch" || s.branchRole === "alternative_approach")) depth = Math.min(depth + 1, 3);
    if (s.branchRole === "returns_to_previous_branch") depth = Math.max(depth - 1, 0);
    out += `<a class="fnode t-${t.k}${isMish(k) ? " is-mishnah" : ""}" href="#s${k+1}" data-jump="${k+1}" style="--d:${depth}"><span class="dot">${k+1}</span><span class="ft"><span class="fty"><span class="he">${esc(s.hebrewStepName || "")}</span> ${t.en}${isMish(k) ? MBADGE : ""}</span>${esc(s.title || s.stepSummary || "")}</span></a>`;
    if (s.branchRole === "conclusion_of_branch") depth = Math.max(depth - 1, 0);
  });
  return `<nav class="flow" aria-label="Flow of the sugya"><h2>The flow</h2>${out}</nav>`;
}
function stepHtml(s, k, open){
  const t = TYPES[s.hebrewStepName] || TYPES["מימרא"];
  const P = (h, v, cls="") => v ? `<section class="${cls}"><h4>${h}</h4><p>${esc(v)}</p></section>` : "";
  const logicRows = [["Trigger words", s.triggerLanguage], ["Relation to before", s.relationToPreviousStep], ["Builds on step", (s.dependsOnStepNumbers||[]).join(", ")],
    ["Challenge targets", s.kashyaTarget], ["How it attacks", s.kashyaAttackLogic], ["Kind of answer", s.terutzResolutionType], ["We might have thought", s.terutzHavaAmina], ["Now we know", s.terutzMaskana],
    ["Information sought", s.sheelahInformationSought], ["Answer given", s.teshuvahAnswerProvided], ["Proving", s.raayaObject], ["Source of proof", s.raayaSupportSource],
    ["What is rejected", s.dechiyaRejectionScope], ["The flaw", s.dechiyaFlawIdentified], ["Core ruling", s.mimraCoreRuling], ["Final takeaway", s.maskanaFinalTakeaway],
    ["Classification", s.classificationConfidence ? `${s.classificationConfidence} confidence` : ""]].filter(r => r[1]);
  const terms = (s.keyTerms||[]).filter(x => x && x.term);
  return `<article class="step t-${t.k}${open ? " open" : ""}${isMish(k) ? " is-mishnah" : ""}" id="s${k+1}" data-n="${k+1}">
    <button class="sh" aria-expanded="${open}" aria-controls="x${k+1}"><span class="num">${k+1}</span><span class="tname"><span class="he">${esc(s.hebrewStepName)}</span>${t.en}${isMish(k) ? MBADGE : ""}</span>${chev}</button>
    <div class="sbody">
      <h3 class="stitle">${esc(s.title)}</h3>
      ${s.stepSummary ? `<p class="ssum">${esc(s.stepSummary)}</p>` : ""}
      ${s.classificationConfidence && s.classificationConfidence !== "High" && s.alternativePossibleLabel ? `<p class="maybe">Could also be read as: ${esc(s.alternativePossibleLabel)}</p>` : ""}
      <div class="phrases">${(s.phrases||[]).map(p => `<div class="ph"><div class="pa he" lang="he">${heTxt(p.aramaic)}</div><div class="pe">${esc(p.english)}${p.notes ? `<div class="pnote">${esc(p.notes)}</div>` : ""}</div></div>`).join("")}</div>
      <button class="explain-btn" aria-expanded="${open}" aria-controls="x${k+1}">${open ? "Hide explanation" : "Explain this step"}</button>
      <div class="explain" id="x${k+1}" ${open ? "" : "hidden"}>
        ${P("What’s happening", s.whatsHappening)}
        ${P("In plain words", s.simpleTranslation)}
        ${P("Going deeper", s.deeperAnalysis)}
        ${terms.length ? `<section class="terms"><h4>Key terms</h4><div class="chips">${terms.map(x => `<span class="chip"><span class="he">${heTxt(x.term)}</span><span class="m">${esc(x.meaning)}</span></span>`).join("")}</div></section>` : ""}
        ${s.whatToRemember ? `<div class="box remember"><h4>Remember</h4><p>${esc(s.whatToRemember)}</p></div>` : ""}
        ${s.confusionAlert ? `<div class="box alert"><h4>Careful</h4><p>${esc(s.confusionAlert)}</p></div>` : ""}
        ${P("Why it matters", s.whyThisMatters)}
        ${logicRows.length ? `<section class="logic box"><h4>Logic</h4><dl>${logicRows.map(r => `<dt>${r[0]}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl></section>` : ""}
      </div>
    </div></article>`;
}
async function openDaf(m, i, tab){
  const id = refId(m, i);
  const same = current && current.id === id;
  current = { m, i, id, analysis: same ? current.analysis : null, source: same ? current.source : null, text: same ? current.text : null, tab: tab || (same ? current.tab : null) };
  document.title = `${label(m, i)} · Gemara Clarity`;
  pushHistory(id);
  setChrome(true); updateNav();
  if (!same) {
    $("#view").innerHTML = `<div class="loading"><div class="spinner"></div>Loading ${esc(label(m, i))}…</div>`;
    window.scrollTo(0, 0);
    const local = await localAnalysis(id);
    let cloud = null, cloudErr = null;
    if (!local && (hasBreakdown(id) || !cloudLoaded || !cloudIds.size)) { try { cloud = await loadCloudAnalysis(id); } catch (e) { cloudErr = e; } }
    if (!current || current.id !== id) return;
    current.analysis = local || cloud; current.source = local ? "local" : cloud ? "cloud" : null; current.cloudErr = cloudErr;
    if (!current.tab) current.tab = current.analysis ? "steps" : "text";
  }
  renderDaf();
  // warm the neighbours quietly
  const n = neighbor(m, i, 1); if (n) setTimeout(() => { loadText(n.m, n.i).catch(()=>{}); if (hasBreakdown(refId(n.m, n.i))) loadCloudAnalysis(refId(n.m, n.i)).catch(()=>{}); }, 1500);
}
function renderDaf(){
  const c = current; if (!c) return;
  const a = c.analysis, bm = bookmarks().includes(c.id);
  const counts = {}; if (a) a.steps.forEach(s => { counts[s.hebrewStepName] = (counts[s.hebrewStepName]||0) + 1; });
  const keySaved = !!localStorage.getItem(LS.key);
  setChrome(true); updateNav();
  $("#view").innerHTML = `
    <section class="card dafhead">
      <div class="refline"><h1>${esc(label(c.m, c.i))}</h1><span class="he">${heLabel(c.m, c.i)}</span></div>
      ${a ? `<div class="topic">${esc(a.mainTopic || "")}</div>${a.overview ? `<p class="overview">${esc(a.overview)}</p>` : ""}
        <div class="typecounts">${Object.entries(TYPES).filter(([he]) => counts[he]).map(([he, t]) => `<span class="typecount t-${t.k}">${counts[he]} ${t.en}${counts[he] > 1 ? "s" : ""}</span>`).join("")}${mishCountHtml()}</div>` : ""}
      <div class="headactions">
        <button class="btn ${bm ? "on" : ""}" id="bmBtn" aria-pressed="${bm}"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg>${bm ? "Bookmarked" : "Bookmark"}</button>
        ${a ? `<a class="btn" href="${hashFor(c.m, c.i, "/review")}"><svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>Review</a>` : ""}
        <button class="btn" id="shareBtn"><svg viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>Share</button>
        <button class="btn" id="pdfBtn"><svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>PDF</button>
      </div>
      ${a ? `<div class="tabs" role="tablist"><button role="tab" data-tab="steps" aria-selected="${c.tab === "steps"}">Step by step</button><button role="tab" data-tab="text" aria-selected="${c.tab === "text"}">Full text</button></div>
        <p class="note-ai">${c.source === "local" ? "Breakdown made on this device with your key. " : ""}AI-generated breakdown: check it against the text and your teacher.</p>` : ""}
    </section>
    ${!a ? `<div class="notice"><b>No step-by-step breakdown for this amud yet.</b>
        <p>${c.cloudErr ? "The breakdown library couldn’t be reached just now. " : ""}Here is the full text with translation, side by side. ${cloudIds.size ? `${cloudIds.size} amudim are fully broken down.` : ""}</p>
        ${keySaved ? `<button class="btn primary" id="makeBtn">Create a breakdown with my key</button><div class="small" id="makeMsg"></div>` : `<button class="btn" id="libBtn">See broken-down dapim</button>`}
      </div>` : ""}
    <div id="dafBody">${c.tab === "steps" && a ? stepsBlock(a) : `<div class="loading"><div class="spinner"></div>Loading text from Sefaria…</div>`}</div>
    <div class="endnav" id="endnav"></div>
    <div class="footer-ded">In loving memory of Tzvi Sherizen<span class="he">אליעזר אברהם צבי בן פתחיה לייב</span></div>`;
  // sidebar (desktop) mirrors the flow
  $("#sidebar").innerHTML = a && c.tab === "steps" ? flowHtml(a.steps) : "";
  wireDaf();
  if (c.tab === "text" || !a) renderText();
  const p = neighbor(c.m, c.i, -1), n = neighbor(c.m, c.i, 1);
  $("#endnav").innerHTML = `${p ? `<a class="btn" href="${hashFor(p.m, p.i)}">‹ ${label(p.m, p.i)}</a>` : ""}${n ? `<a class="btn primary" href="${hashFor(n.m, n.i)}">${label(n.m, n.i)} ›</a>` : ""}`;
  markMishnah();
}
/* ---------- Mishnah badge: worked out here from Sefaria's מתני׳ / גמ׳ markers, nothing regenerated ---------- */
function mishCountHtml(){
  const n = current && current.mish ? current.mish.filter(Boolean).length : 0;
  return n ? `<span class="typecount t-mishnah">${n} from the Mishnah</span>` : "";
}
function segMishClass(k){
  const f = current && current.mishSegs; if (!f || !f[k]) return "";
  return " seg-mishnah" + (k === 0 || !f[k-1] ? " mstart" : "");
}
async function mishnahStart(m, i, segs){
  if (segmentMarker(segs[0])) return false;              // the amud opens with its own marker
  const first = masInfo(m)[2];
  if (i <= first) return true;                           // a masechet opens with a Mishnah
  for (let j = i - 1, n = 0; j >= first && n < 3; j--, n++) {
    const e = endState((await loadText(m, j)).he);
    if (e !== null) return e;
    if (j === first) return true;
  }
  return false;
}
async function markMishnah(){
  const c = current; if (!c || c.mishBusy || (c.mishDone && c.mishFor === (c.analysis ? c.analysis.steps : null))) return;
  const steps = c.analysis ? c.analysis.steps : null;
  c.mishBusy = true;
  try {
    const t = c.text || await loadText(c.m, c.i);
    const segFlags = segmentFlags(t.he, await mishnahStart(c.m, c.i, t.he));
    if (current !== c) return;
    c.mishSegs = segFlags; c.mishDone = true; c.mishFor = steps;
    c.mish = steps ? stepFlags(steps, t.he, segFlags) : null;
    applyMishnah();
  } catch (e) { console.warn("mishnah markers unavailable", e); }
  finally { c.mishBusy = false; }
}
function applyMishnah(){
  const c = current; if (!c) return;
  (c.mish || []).forEach((on, k) => {
    if (!on) return;
    $$(`.step[data-n="${k+1}"]:not(.is-mishnah)`).forEach(el => { el.classList.add("is-mishnah"); const tn = $(".tname", el); tn && tn.insertAdjacentHTML("beforeend", MBADGE); });
    $$(`.fnode[data-jump="${k+1}"]:not(.is-mishnah)`).forEach(el => { el.classList.add("is-mishnah"); const ft = $(".fty", el); ft && ft.insertAdjacentHTML("beforeend", MBADGE); });
    $$(`.strip span[data-jump="${k+1}"]`).forEach(el => el.classList.add("is-mishnah"));
  });
  const tc = $(".typecounts"); if (tc && !$(".t-mishnah", tc)) tc.insertAdjacentHTML("beforeend", mishCountHtml());
  $$(".segs .seg").forEach((el, k) => { const cl = segMishClass(k).trim(); if (cl) el.classList.add(...cl.split(" ")); });
}
function stepsBlock(a){
  return `<div class="strip" role="navigation" aria-label="Jump to a step">${a.steps.map((s, k) => `<span class="t-${(TYPES[s.hebrewStepName]||TYPES["מימרא"]).k}${isMish(k) ? " is-mishnah" : ""}" data-jump="${k+1}" title="${k+1}. ${esc(s.title||"")}"></span>`).join("")}</div>
    <div class="strip-cap"><span>Start</span><span>Tap a colour to jump</span><span>End</span></div>
    <div class="steps">${a.steps.map((s, k) => stepHtml(s, k, settings.expandAll)).join("")}</div>`;
}
async function renderText(){
  const c = current; const id = c.id;
  let html;
  try {
    const t = c.text || await loadText(c.m, c.i); if (!current || current.id !== id) return; c.text = t;
    const n = Math.max(t.he.length, t.en.length);
    if (!n) throw new Error("empty");
    html = `<div class="segs">${Array.from({ length: n }, (_, k) => `<div class="seg${segMishClass(k)}"><div class="he" lang="he">${sanitize(t.he[k]||"", true)}</div><div class="en">${sanitize(t.en[k]||"", false)}</div></div>`).join("")}</div>
      <p class="src">Text: ${esc(t.heVersion || "Sefaria")}. Translation: ${esc(t.version || "Sefaria")}. Bold words are the literal translation; the rest is explanation. From <a href="https://www.sefaria.org/${c.m}.${dafOf(c.i).daf}${dafOf(c.i).amud}" target="_blank" rel="noopener">Sefaria</a>.</p>`;
  } catch (e) {
    html = `<div class="notice"><b>Couldn’t load the text.</b><p>${navigator.onLine ? "Sefaria didn’t answer. Try again in a moment." : "You’re offline, and this amud isn’t saved on this device yet."}</p><button class="btn" id="retryText">Try again</button></div>`;
  }
  const body = $("#dafBody"); if (!body || !current || current.id !== id) return;
  if (current.tab === "text" || !current.analysis) { body.innerHTML = html; const r = $("#retryText"); if (r) r.onclick = () => { body.innerHTML = `<div class="loading"><div class="spinner"></div></div>`; renderText(); }; }
}
function wireDaf(){
  const c = current;
  $("#bmBtn").onclick = () => { let b = bookmarks(); b = b.includes(c.id) ? b.filter(x => x !== c.id) : [c.id, ...b]; saveJSON(LS.bookmarks, b); toast(b.includes(c.id) ? "Bookmarked" : "Bookmark removed"); renderDaf(); };
  $("#shareBtn").onclick = async () => { const url = location.href; try { if (navigator.share) await navigator.share({ title: `${label(c.m, c.i)} · Gemara Clarity`, url }); else { await navigator.clipboard.writeText(url); toast("Link copied"); } } catch {} };
  $("#pdfBtn").onclick = () => { const was = settings.expandAll; const old = document.title; document.title = `${label(c.m, c.i)} - Gemara Clarity`; $$(".explain").forEach(x => x.hidden = false); setTimeout(() => { window.print(); document.title = old; if (!was) renderDaf(); }, 120); };
  $$("[data-tab]").forEach(b => b.onclick = () => { c.tab = b.dataset.tab; renderDaf(); });
  const ov = $(".dafhead .overview"); if (ov) ov.onclick = () => ov.classList.toggle("full");
  const lib = $("#libBtn"); if (lib) lib.onclick = () => { location.hash = "#/"; setTimeout(() => { const s = $("#libSlot"); s && s.scrollIntoView({ behavior: "smooth" }); }, 60); };
  const mk = $("#makeBtn"); if (mk) mk.onclick = () => makeBreakdown(mk);
  const view = $("#view");
  view.onclick = e => {
    const j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); jumpTo(+j.dataset.jump); return; }
    const t = e.target.closest(".sh, .explain-btn"); if (t) toggleStep(t.closest(".step"));
  };
  $("#sidebar").onclick = e => { const j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); jumpTo(+j.dataset.jump); } };
  observeSteps();
}
function toggleStep(card, force){
  const ex = $(".explain", card); const open = force ?? ex.hidden;
  ex.hidden = !open; card.classList.toggle("open", open);
  $$("[aria-controls]", card).forEach(b => b.setAttribute("aria-expanded", open));
  $(".explain-btn", card).textContent = open ? "Hide explanation" : "Explain this step";
}
function jumpTo(n){
  if (current && current.tab !== "steps") { current.tab = "steps"; renderDaf(); }
  const el = document.getElementById("s" + n); if (!el) return;
  closeSheet(); jumpTo.lock = Date.now() + 700;
  el.scrollIntoView({ behavior: "auto", block: "start" });
  markCurrent(n);
}
function observeSteps(){
  if (observer) observer.disconnect();
  const steps = $$(".step"); if (!steps.length) return;
  observer = new IntersectionObserver(entries => {
    if (Date.now() < (jumpTo.lock || 0)) return;
    for (const en of entries) if (en.isIntersecting) markCurrent(+en.target.dataset.n);
  }, { rootMargin: "-20% 0px -70% 0px" });
  steps.forEach(s => observer.observe(s));
}
function markCurrent(n){
  if (!current || !current.analysis) return;
  const total = current.analysis.steps.length;
  $$(".step.cur").forEach(x => x.classList.remove("cur")); const el = document.getElementById("s" + n); el && el.classList.add("cur");
  $$(".fnode.cur, .strip span.cur").forEach(x => x.classList.remove("cur"));
  $$(`.fnode[data-jump="${n}"], .strip span[data-jump="${n}"]`).forEach(x => x.classList.add("cur"));
  const side = $(`#sidebar .fnode[data-jump="${n}"]`); if (side && $(".layout").classList.contains("with-side")) side.scrollIntoView({ block: "nearest" });
  $("#stepCounter").textContent = `step ${n}/${total}`;
}
window.addEventListener("scroll", () => {
  const h = document.documentElement; const max = h.scrollHeight - h.clientHeight;
  $("#progressFill").style.width = current && max > 0 ? Math.min(100, h.scrollTop / max * 100) + "%" : "0";
}, { passive: true });

async function makeBreakdown(btn){
  const msg = $("#makeMsg"); btn.disabled = true;
  const c = current; const id = c.id;
  try {
    const t = c.text || await loadText(c.m, c.i); c.text = t;
    const ai = await import("./ai.js");
    const data = await ai.generate({ refLabel: label(c.m, c.i), he: t.he, en: t.en, apiKey: localStorage.getItem(LS.key), onStatus: s => { if (msg) msg.textContent = s; } });
    await saveLocalAnalysis(id, data);
    if (current && current.id === id) { current.analysis = data; current.source = "local"; current.tab = "steps"; renderDaf(); toast("Breakdown saved on this device"); }
  } catch (e) { if (msg) msg.textContent = (e && e.message) || "Couldn’t create the breakdown."; btn.disabled = false; }
}

/* ---------- review ---------- */
function shuffle(a){ a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; }
function buildQuiz(steps){
  const qs = [];
  steps.forEach((s, k) => {
    const t = TYPES[s.hebrewStepName]; if (!t) return;
    const pool = Object.entries(TYPES).filter(([he]) => he !== s.hebrewStepName);
    const near = (CONFUSABLE[t.k] || []).map(kk => pool.find(([, v]) => v.k === kk)).filter(Boolean);
    const rest = shuffle(pool.filter(p => !near.includes(p)));
    const opts = shuffle([[s.hebrewStepName, t], ...near.slice(0, 2), ...rest].slice(0, 4));
    qs.push({ kind: "type", k, prompt: "What is this step doing?", he: (s.phrases||[]).map(p => p.aramaic).join(" "), en: s.simpleTranslation || (s.phrases||[]).map(p => p.english).join(" "),
      opts: opts.map(([he, v]) => ({ html: `<span class="swatch t-${v.k}"></span><span><span class="en-he">${he}</span> · ${v.en}</span>`, right: he === s.hebrewStepName })),
      explain: `${esc(s.title || "")}${s.whatsHappening ? " · " + esc(s.whatsHappening) : ""}` });
    if (k < steps.length - 1 && steps.length >= 4) {
      const nx = steps[k + 1]; const others = shuffle(steps.filter((_, j) => j !== k + 1 && j !== k)).slice(0, 2);
      const lbl = st => { const tt = TYPES[st.hebrewStepName] || TYPES["מימרא"]; return `<span class="swatch t-${tt.k}"></span><span>${esc(st.title || st.stepSummary)}</span>`; };
      qs.push({ kind: "next", k, prompt: "What comes next?", he: "", en: `Step ${k+1}: ${s.title || ""}. ${s.stepSummary || ""}`,
        opts: shuffle([{ html: lbl(nx), right: true }, ...others.map(o => ({ html: lbl(o), right: false }))]),
        explain: `Step ${k+2} is a ${esc((TYPES[nx.hebrewStepName]||{}).en || "step")}: ${esc(nx.stepSummary || nx.title || "")}` });
    }
  });
  const types = shuffle(qs.filter(q => q.kind === "type")).slice(0, 8), nexts = shuffle(qs.filter(q => q.kind === "next")).slice(0, 4);
  return [...types, ...nexts].sort((a, b) => a.k - b.k || (a.kind === "type" ? -1 : 1));
}
function renderReview(m, i){
  const id = refId(m, i);
  const start = a => {
    current = current && current.id === id ? current : { m, i, id, analysis: a, tab: "steps" };
    current.analysis = a; setChrome(true); updateNav(); $(".layout").classList.remove("with-side"); $("#sidebar").innerHTML = ""; $("#flowBtn").hidden = true;
    document.title = `Review ${label(m, i)} · Gemara Clarity`;
    const terms = []; const seen = new Set();
    a.steps.forEach(s => (s.keyTerms||[]).forEach(t => { const key = (t.term||"").replace(NIKUD, ""); if (t.term && !seen.has(key)) { seen.add(key); terms.push(t); } }));
    $("#view").innerHTML = `<section class="card dafhead"><div class="refline"><h1>Review ${esc(label(m, i))}</h1><span class="he">${heLabel(m, i)}</span></div>
      <p class="overview" style="margin-top:8px">${esc(a.mainTopic || "")}</p>
      <div class="tabs" role="tablist"><button role="tab" data-r="flow" aria-selected="true">Flow quiz</button><button role="tab" data-r="terms" aria-selected="false">Key terms (${terms.length})</button></div></section>
      <section class="card quiz" id="quiz" style="margin-top:14px"></section>
      <div class="endnav"><a class="btn" href="${hashFor(m, i)}">‹ Back to the daf</a></div>`;
    $$("[data-r]").forEach(b => b.onclick = () => { $$("[data-r]").forEach(x => x.setAttribute("aria-selected", x === b)); b.dataset.r === "flow" ? runQuiz(a) : runCards(terms); });
    runQuiz(a);
  };
  if (current && current.id === id && current.analysis) return start(current.analysis);
  $("#view").innerHTML = `<div class="loading"><div class="spinner"></div>Preparing review…</div>`;
  (async () => { const a = (await localAnalysis(id)) || await loadCloudAnalysis(id).catch(() => null); if (a) start(a); else { location.hash = hashFor(m, i); } })();
}
function runQuiz(a){
  const qs = buildQuiz(a.steps); let n = 0, score = 0; const box = $("#quiz");
  const show = () => {
    if (n >= qs.length) {
      box.innerHTML = `<div class="score">${score} / ${qs.length}</div><p style="text-align:center;color:var(--muted)">${score === qs.length ? "Every step in place. Yasher koach!" : score >= qs.length * .7 ? "Strong. Look again at the ones you missed." : "Worth another pass through the steps."}</p>
        <div class="endnav"><button class="btn" id="again">Try again</button><a class="btn primary" href="${hashFor(current.m, current.i)}">Back to the daf</a></div>`;
      $("#again").onclick = () => runQuiz(a); return;
    }
    const q = qs[n];
    box.innerHTML = `<div class="qmeta"><span>Question ${n+1} of ${qs.length}</span><span>${score} right</span></div><div class="qbar"><div style="width:${n / qs.length * 100}%"></div></div>
      <p class="qprompt">${q.prompt}</p>
      <div class="qtext">${q.he ? `<div class="he" lang="he">${heTxt(q.he)}</div>` : ""}${q.en ? `<div class="en">${esc(q.en)}</div>` : ""}</div>
      <div class="opts">${q.opts.map((o, j) => `<button class="opt" data-o="${j}">${o.html}</button>`).join("")}</div><div id="fb"></div>`;
    $$(".opt", box).forEach(b => b.onclick = () => {
      if (box.dataset.answered === "1") return; box.dataset.answered = "1";
      const o = q.opts[+b.dataset.o]; if (o.right) score++;
      $$(".opt", box).forEach((x, j) => { if (q.opts[j].right) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); x.disabled = true; });
      $("#fb", box).innerHTML = `<div class="feedback"><b class="${o.right ? "ok" : "no"}">${o.right ? "Right." : "Not quite."}</b> ${q.explain}<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="nextQ">${n + 1 < qs.length ? "Next" : "See score"}</button><a class="btn" href="${hashFor(current.m, current.i)}" data-step="${q.k+1}">See step ${q.k+1}</a></div></div>`;
      $("#nextQ").onclick = () => { n++; box.dataset.answered = "0"; show(); }; $("#nextQ").focus();
      $("[data-step]", box).onclick = e => { e.preventDefault(); const k = q.k + 1; location.hash = hashFor(current.m, current.i); setTimeout(() => jumpTo(k), 400); };
    });
  };
  box.dataset.answered = "0"; show();
}
function runCards(terms){
  const box = $("#quiz"); if (!terms.length) { box.innerHTML = `<p class="empty">No key terms on this amud.</p>`; return; }
  let order = shuffle(terms), n = 0, flipped = false;
  const show = () => {
    const t = order[n];
    box.innerHTML = `<div class="qmeta"><span>Card ${n+1} of ${order.length}</span><span>Tap the card to flip</span></div><div class="qbar"><div style="width:${(n+1) / order.length * 100}%"></div></div>
      <button class="flash" id="card" aria-live="polite">${flipped ? `<span><span class="he" style="display:block;font-size:calc(22px * var(--scale));opacity:.7">${heTxt(t.term)}</span><span class="m">${esc(t.meaning)}</span></span>` : `<span class="he" lang="he">${heTxt(t.term)}</span>`}</button>
      <div class="endnav"><button class="btn" id="prevC" ${n ? "" : "disabled"}>‹ Back</button><button class="btn" id="shuf">Shuffle</button><button class="btn primary" id="nextC">${n + 1 < order.length ? "Next ›" : "Start over"}</button></div>`;
    $("#card").onclick = () => { flipped = !flipped; show(); };
    $("#prevC").onclick = () => { n = Math.max(0, n - 1); flipped = false; show(); };
    $("#nextC").onclick = () => { n = (n + 1) % order.length; flipped = false; show(); };
    $("#shuf").onclick = () => { order = shuffle(order); n = 0; flipped = false; show(); };
  };
  show();
}

/* ---------- router ---------- */
function rerender(){ route(true); }
function route(keepScroll){
  if (!keepScroll) closeSheet();
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const parts = h.split("/").filter(Boolean);
  if (!parts.length) return renderHome();
  const [m, df, extra] = parts; const info = masInfo(m);
  const dm = (df || "").match(/^(\d{1,3})([ab])?$/);
  if (!info || !dm) { if (info) { openPicker(m); return; } return renderHome(); }
  let i = idxOf(+dm[1], dm[2] || "a"); i = Math.min(Math.max(i, info[2]), info[3]);
  if (extra === "review") return renderReview(m, i);
  if (keepScroll && current && current.id === refId(m, i)) { const y = scrollY; renderDaf(); scrollTo(0, y); return; }
  openDaf(m, i);
}
window.addEventListener("hashchange", () => route(false));
$("#homeBtn").onclick = () => { location.hash = "#/"; };
$("#refBtn").onclick = () => openPicker();
$("#settingsBtn").onclick = openSettings;
$("#sheetClose").onclick = closeSheet; $("#backdrop").onclick = closeSheet;
$("#flowBtn").onclick = () => { if (current && current.analysis) openSheet(`The flow of ${label(current.m, current.i)}`, flowHtml(current.analysis.steps), b => { const cur = $$(".step.cur")[0]; if (cur) { const f = $(`.fnode[data-jump="${cur.dataset.n}"]`, b); f && f.classList.add("cur"); f && f.scrollIntoView({ block: "center" }); } b.onclick = e => { const j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); jumpTo(+j.dataset.jump); } }; }); };
$("#reviewBtn").onclick = () => current && (location.hash = hashFor(current.m, current.i, "/review"));
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#sheet").hidden) return closeSheet();
  if (e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey || !$("#sheet").hidden) return;
  if (!current) { if (e.key === "/") { e.preventDefault(); openPicker(); } return; }
  if (e.key === "ArrowRight" || e.key === "]") { const n = neighbor(current.m, current.i, 1); n && go(n.m, n.i); }
  else if (e.key === "ArrowLeft" || e.key === "[") { const p = neighbor(current.m, current.i, -1); p && go(p.m, p.i); }
  else if (e.key === "/") { e.preventDefault(); openPicker(); }
  else if ((e.key === "j" || e.key === "k") && current.analysis) {
    const cur = +(($(".step.cur") || {}).dataset?.n || 0); const nx = Math.min(current.analysis.steps.length, Math.max(1, cur + (e.key === "j" ? 1 : -1))); jumpTo(nx);
  }
});

applySettings();
route(false);
loadCloudIndex().then(() => {
  if (!current) { const s = $("#libSlot"); if (s) { s.innerHTML = libraryHtml(); const hdr = s.previousElementSibling; if (hdr) hdr.querySelector("small").textContent = cloudIds.size ? cloudIds.size + " amudim" : ""; } }
  else if (!current.analysis && cloudIds.has(current.id)) { const c = current; current = null; openDaf(c.m, c.i); }
  else renderDafNoticeCount();
});
function renderDafNoticeCount(){ /* counts appear on next render; nothing urgent */ }
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
