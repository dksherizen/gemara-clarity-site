// Gemara Clarity, rebuilt. Static, no keys, no trackers.
// Text: Sefaria public API. Breakdowns: read-only from the original app's public cloud library.
import { segmentMarker, segmentFlags, stepFlags, endState } from "./mishnah.js"; import * as acct from "./acct.js"; // v106-acct: optional sign-in (the corner profile button opens Account, Settings, Help); guests load no Firebase
import { AMW } from "./ameilus/words.js?v=3.6.0"; // Ameilus names itself from one table (the word for what the learner marks may change)
const MAS = [["Berakhot", "ברכות", 2, 126], ["Shabbat", "שבת", 2, 313], ["Eruvin", "עירובין", 2, 208], ["Pesachim", "פסחים", 2, 241], ["Yoma", "יומא", 2, 174], ["Sukkah", "סוכה", 2, 111], ["Beitzah", "ביצה", 2, 79], ["Rosh_Hashanah", "ראש השנה", 2, 68], ["Taanit", "תענית", 2, 60], ["Megillah", "מגילה", 2, 62], ["Moed_Katan", "מועד קטן", 2, 56], ["Chagigah", "חגיגה", 2, 52], ["Yevamot", "יבמות", 2, 243], ["Ketubot", "כתובות", 2, 223], ["Nedarim", "נדרים", 2, 181], ["Nazir", "נזיר", 2, 131], ["Sotah", "סוטה", 2, 97], ["Gittin", "גיטין", 2, 179], ["Kiddushin", "קידושין", 2, 163], ["Bava_Kamma", "בבא קמא", 2, 237], ["Bava_Metzia", "בבא מציעא", 2, 236], ["Bava_Batra", "בבא בתרא", 2, 351], ["Sanhedrin", "סנהדרין", 2, 225], ["Makkot", "מכות", 2, 47], ["Shevuot", "שבועות", 2, 97], ["Avodah_Zarah", "עבודה זרה", 2, 151], ["Horayot", "הוריות", 2, 26], ["Zevachim", "זבחים", 2, 239], ["Menachot", "מנחות", 2, 218], ["Chullin", "חולין", 2, 282], ["Bekhorot", "בכורות", 2, 120], ["Arakhin", "ערכין", 2, 66], ["Temurah", "תמורה", 2, 66], ["Keritot", "כריתות", 2, 55], ["Meilah", "מעילה", 2, 42], ["Tamid", "תמיד", 49, 65], ["Niddah", "נדה", 2, 144]]; // [key, hebrew, firstAmudIndex, lastAmudIndex]  index: 2 = 2a, 3 = 2b ...
const SEDARIM = [
  ["Zeraim","זרעים",["Berakhot"]],
  ["Moed","מועד",["Shabbat","Eruvin","Pesachim","Yoma","Sukkah","Beitzah","Rosh_Hashanah","Taanit","Megillah","Moed_Katan","Chagigah"]],
  ["Nashim","נשים",["Yevamot","Ketubot","Nedarim","Nazir","Sotah","Gittin","Kiddushin"]],
  ["Nezikin","נזיקין",["Bava_Kamma","Bava_Metzia","Bava_Batra","Sanhedrin","Makkot","Shevuot","Avodah_Zarah","Horayot"]],
  ["Kodashim","קדשים",["Zevachim","Menachot","Chullin","Bekhorot","Arakhin","Temurah","Keritot","Meilah","Tamid"]],
  ["Taharos","טהרות",["Niddah"]]
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
const MISHNAH = { en:"Mishnah", he:"משנה", d:"Not a type of step but where it stands: the step is the Mishnah itself, from <bdi>מתני׳</bdi> up to <bdi>גמ׳</bdi>. Its own type color stays beside the badge." };
const MBADGE = { toString: () => `<span class="mbadge">Mishnah<span class="mb-he"> · <span class="he">מִשְׁנָה</span></span></span>` }; // read where it is interpolated; always pointed, whatever the Vowels switch says
// markers (v99u): an optional step.marks array ("unresolved" for teiku, "end-marker" for hadran, "story" for a maaseh) adds small outlined tags to the
// step's own chip. Not a ninth kind and no new colour: Unresolved takes the chip's colour, Story and End marker the muted grey. Unknown values and repeats are
// dropped and the tags always come in one order (MARK_ORDER), whatever the array says. A step without marks, or with marks = [], renders exactly as before.
const STEP_TAGS = { unresolved: { en: "Unresolved", he: "תֵּיקוּ", d: "A tag on the chip, not a kind of step: the Gemara leaves the question standing (teiku). The step keeps its own color." },
  story: { en: "Story", he: "מַעֲשֶׂה", d: "A tag on the chip, not a kind of step: the step tells a story (a maaseh). In the steps list, a run of story steps sits in one gray band. The step keeps its own color." },
  "end-marker": { en: "End marker", he: "הַדְרָן", d: "A tag on the chip, not a kind of step: the hadran said where a perek ends. The step keeps its own color." } };
const MARK_ORDER = ["unresolved", "story", "end-marker"]; // what the step says first (left open), then what kind of passage it is, then where it stands
const marksOf = s => s && Array.isArray(s.marks) ? MARK_ORDER.filter(g => s.marks.includes(g)) : [];
const stagHtml = (s, quietStory) => { const gs = marksOf(s); return gs.length ? `<span class="vh">${stagAria(s)}</span>` + gs.filter(g => !(quietStory && g === "story")).map(g => `<span class="stag stag-${g}" aria-hidden="true">${STEP_TAGS[g].en}</span>`).join("") : ""; }; // one hidden phrase names every tag (", story, end marker"); the visible tags are aria-hidden. quietStory: inside its band (whose caption shows Story once) a story step shows no Story tag of its own
const stagAria = s => marksOf(s).map(g => `, ${STEP_TAGS[g].en.toLowerCase()}`).join("");
const tagKeyRowsHtml = a => { const used = MARK_ORDER.filter(g => a && Array.isArray(a.steps) && a.steps.some(s => marksOf(s).includes(g))); return used.length ? `<div class="lg-sub">Tags on a step (not kinds of step)</div>${used.map(g => `<div class="lg lg-tag"><span class="stag stag-${g}" aria-hidden="true">${STEP_TAGS[g].en}</span><div><b>${STEP_TAGS[g].en} · <span class="en-he">${STEP_TAGS[g].he}</span></b><div class="d">${STEP_TAGS[g].d}</div></div></div>`).join("")}` : ""; };
const isMish = k => !!(current && current.mish && current.mish[k]);
const PHASES = {mishnah:"On the Mishnah",opening_question:"Opening question",source_derivation:"Finding the source",objection_defense_cycle:"Challenge and defense",alternate_branch:"Another approach",clarification_of_terms:"Defining terms",narrative_aggadah:"Story / aggadah",conclusion:"Conclusion"};
const FS_BASE = "https://firestore.googleapis.com/v1/projects/gemara-clarity/databases/(default)/documents/artifacts/gemara-clarity-public/public/data/gemara_cache_v5";
const SEFARIA = "https://www.sefaria.org";
const LS = { settings:"gc2-settings", bookmarks:"gc2-bookmarks", history:"gc2-history", explained:"gc2-open", ui:"gc2-ui", overview:"gc2-overview", mode:"gc2-mode" }; // mode: the reader's last way of learning an amud ("shiur" | "ameilus"), per device
const DATA_CACHE = "gc2-data-v1";

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const NIKUD = /[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g;

// ---- Nikud borrowing (display only, Oct 15 2026): a bare Hebrew word in the English prose borrows the vowels this amud's own vocalized text gives it (phrases, key terms, trigger words); multi-word quotes first, then single words; a word the amud vocalizes two different ways, a 1-letter word, or a word with no exact match stays bare. Nothing in the data changes. ----
const VOC_PT = "\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7";
const VOC_ANY = new RegExp("[" + VOC_PT + "]", "g");                 // every point and accent (the lookup key drops them)
const VOC_VOW = /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/;                  // a real vowel / dagesh / shin dot: the word is vocalized
const VOC_ACC = /[\u0591-\u05AF\u05BD\u05BF]/g;                       // cantillation, meteg, rafe: not carried into the prose
const VOC_TOK = new RegExp("[\u05D0-\u05EA][\u05D0-\u05EA" + VOC_PT + "]*(?:[\"'\u05F3\u05F4][\u05D0-\u05EA][\u05D0-\u05EA" + VOC_PT + "]*)*", "g");
const VOC_MAXN = 5;
const vocKey = w => w.replace(VOC_ANY, "");
const vocClean = w => w.replace(VOC_ACC, "").normalize("NFC");
const VOC_LEAD = /^([בגדכפת][\u0591-\u05BB\u05BD-\u05C7]*)\u05BC/;          // a word-initial בגדכפת carrying a dagesh (points in any order)
const vocCmp = w => w.replace(VOC_LEAD, "$1");                        // word-initial dagesh lene comes and goes with context: same word
const vocLead = w => /^[בגדכפת]/.test(w) && !VOC_LEAD.test(w) ? (w[0] + "\u05BC" + w.slice(1)).normalize("NFC") : w; // standing alone in the prose, the word opens with its dagesh
function vocTokens(s) {                                               // [{w, i, j}] in logical order
  const out = []; let m; VOC_TOK.lastIndex = 0;
  while ((m = VOC_TOK.exec(s))) out.push({ w: m[0], i: m.index, j: m.index + m[0].length });
  return out;
}
function vocBuild(texts) {
  const one = new Map(), multi = new Map();
  const put = (map, k, forms) => {
    const cmp = forms.map(vocCmp).join(" "), e = map.get(k);
    if (!e) map.set(k, { forms, cmp, bad: false });
    else if (e.cmp !== cmp) e.bad = true;
    else forms.forEach((f, n) => { if (VOC_LEAD.test(f) && !VOC_LEAD.test(e.forms[n])) e.forms[n] = f; }); // standalone: keep the dagesh
  };
  for (const t of texts) {
    if (!t) continue;
    const s = String(t), toks = vocTokens(s); let run = [];
    const flush = () => {
      for (let a = 0; a < run.length; a++) for (let n = 1; n <= VOC_MAXN && a + n <= run.length; n++) {
        const seg = run.slice(a, a + n), keys = seg.map(x => vocKey(x.w));
        if (n === 1) { if (keys[0].length >= 2 && !/["'\u05F3\u05F4]/.test(keys[0])) put(one, keys[0], [vocClean(seg[0].w)]); }
        else put(multi, keys.join(" "), seg.map(x => vocClean(x.w)));
      }
      run = [];
    };
    toks.forEach((x, n) => {
      const gap = n ? s.slice(toks[n - 1].j, x.i) : "";
      if (n && !/^[\s\u05BE]+$/.test(gap)) flush();                 // punctuation ends a run: n-grams never cross it
      if (VOC_VOW.test(x.w)) run.push(x); else flush();             // a bare word in the source can teach nothing
    });
    flush();
  }
  return { one, multi };
}
function vocTextsOf(a) {
  const out = [];
  for (const s of (a && a.steps) || []) {
    for (const p of s.phrases || []) out.push(p.aramaic);
    for (const k of s.keyTerms || []) out.push(k.term);
    out.push(s.triggerLanguage);
  }
  return out;
}
function vocApply(text, V, gloss, ok) {                               // -> the same text with matched bare words vocalized; ok (optional): (word, source, form) -> false keeps that one word bare
  const s = String(text ?? ""); if (!/[\u05D0-\u05EA]/.test(s)) return s;
  V = V || { one: new Map(), multi: new Map() };
  const toks = vocTokens(s); if (!toks.length) return s;
  const rep = new Array(toks.length).fill(null);
  let k = 0;
  while (k < toks.length) {
    if (VOC_VOW.test(toks[k].w)) { k++; continue; }               // already vocalized in the prose: leave it
    let end = k + 1;                                                // the bare run that starts here (words joined by plain spaces)
    while (end < toks.length && end - k < VOC_MAXN && !VOC_VOW.test(toks[end].w) && /^ +$/.test(s.slice(toks[end - 1].j, toks[end].i))) end++;
    let done = false;
    for (let n = end - k; n >= 2 && !done; n--) {
      const e = V.multi.get(toks.slice(k, k + n).map(x => x.w).join(" "));
      if (e && !e.bad && !(ok && toks.slice(k, k + n).some((x, q) => vocBare(x.w) || vocYosi(e.forms[q])))) { for (let q = 0; q < n; q++) rep[k + q] = q ? e.forms[q] : vocLead(e.forms[q]); k += n; done = true; } // N1: with ok, a quote holding a VOC_BARE word is not matched as a whole
    }
    for (let n = end - k; n >= 2 && !done; n--) {
      const f = VOC_META[toks.slice(k, k + n).map(x => x.w).join(" ")];
      if (f) { f.split(" ").forEach((w, q) => { rep[k + q] = w; }); k += n; done = true; }
    }
    if (done) continue;
    const w = toks[k].w;
    if (w.length >= 2 && !/["'\u05F3\u05F4]/.test(w)) {
      const e = V.one.get(w);
      if (VOC_META[w]) { if (!ok || ok(w, "fixed", VOC_META[w])) rep[k] = VOC_META[w]; }
      else if (e && !e.bad) { if (!ok || ok(w, "amud", e.forms[0])) rep[k] = vocLead(e.forms[0]); }
      else if (!e && gloss && gloss[w] && gloss[w][0] && VOC_VOW.test(gloss[w][0]) && vocKey(gloss[w][0]) === w) { if (!ok || ok(w, "glossary", gloss[w][0])) rep[k] = vocLead(vocClean(gloss[w][0])); }
      else if (!e && VOC_NX[w] && !vocBare(w) && !vocYosi(VOC_NX[w])) rep[k] = vocLead(VOC_NX[w]); // N1: letters the whole data writes one way only, as a word of its own (data/prose-nikud.json)
    }
    k++;
  }
  let out = "", at = 0;
  toks.forEach((x, n) => { if (rep[n]) { out += s.slice(at, x.i) + rep[n]; at = x.j; } });
  return out + s.slice(at);
}

// The study words the explanations lean on (the amud's own text rarely carries them, or carries them two ways), and the eight step types: one fixed vocalization, used after the amud's own multi-word matches and before its single words.
const STEP_NIKUD = { "מימרא":"מֵימְרָא", "קשיא":"קֻשְׁיָא", "תירוץ":"תֵּירוּץ", "שאלה":"שְׁאֵלָה", "ראיה":"רְאָיָה", "תשובה":"תְּשׁוּבָה", "דחיה":"דְּחִיָּה", "מסקנא":"מַסְקָנָא" };
const VOC_META = Object.assign({ "תנא קמא":"תַּנָּא קַמָּא", "ותנא קמא":"וְתַנָּא קַמָּא", "דתנא קמא":"דְּתַנָּא קַמָּא", "לתנא קמא":"לְתַנָּא קַמָּא", "התנא קמא":"הַתַּנָּא קַמָּא", "משנה":"מִשְׁנָה", "גמרא":"גְּמָרָא", "ברייתא":"בָּרַיְיתָא", "ברייתות":"בָּרַיְיתוֹת", "פסוק":"פָּסוּק", "פסוקים":"פְּסוּקִים",
  "תנאים":"תַּנָּאִים", "אמוראים":"אֲמוֹרָאִים", "מחלוקת":"מַחֲלוֹקֶת", "מתניתין":"מַתְנִיתִין", "סוגיא":"סוּגְיָא", "סוגיה":"סוּגְיָה", "קושיא":"קוּשְׁיָא", "מסכת":"מַסֶּכֶת", "תורה":"תּוֹרָה", "תוספות":"תּוֹסָפוֹת", "קל וחומר":"קַל וָחוֹמֶר" }, STEP_NIKUD);
// ---- end nikud borrowing ----
// N1 (display only): VOC_NX = letters -> the one pointed form the whole data gives them, kept only when that form also occurs as a word of its own, the letters
// are not on the homograph list below and the form is not a construct that the absolute shares letters with; plus 92 words whose dominant form was hand-checked
// against every bare use (data/prose-nikud.json). Lines never vocalized before (word help, the signal
// hint) use vocNew: a homograph stays bare even where the fixed list or glossary would point it, and the amud's own form counts only when the amud writes the word
// one way (vocBuild marks it bad otherwise) and that form is not a construct.
let VOC_NX = {}, vocNxP = null;
const vocNxLoad = () => vocNxP || (vocNxP = fetch("data/prose-nikud.json").then(r => r.ok ? r.json() : {}).then(j => { VOC_NX = j || {}; }).catch(() => {}));
const VOC_HOMO = new Set("דברים מועד קל משנה שמע תחיית העיבור גווני הלכה טמא בית תנא שוה שווה הפנים כרת בן שני רצה התרה קנים הלל שכם הערה העדות תנאי בני ספר מולד דרשות עולה מקדש אמות שלמים ברכה דוד ברכות עבד מלך דבר פטר חמור עגלה שרת נח עדות עם נתן שמונה עשרה מר קרי אמה מוכה אל בר קומץ הקדש קרבן ארץ שלמה חלה מנה ביתר".split(" "));
const vocCst = f => { const m = f.match(/([\u05D0-\u05EA])([\u05B0-\u05C7]*)([\u05D0-\u05EA])([\u05B0-\u05C7]*)$/); return f.replace(/[^\u05D0-\u05EA]/g, "").length >= 3 && !!m && /\u05B7/.test(m[2]) && !/[\u05B0-\u05BB]/.test(m[4]) && !"אהחעת".includes(m[3]); }; // construct form (קׇרְבַּן): patah, then a bare last letter
// N1: VOC_BARE_LIST is the bare list and the one place to change it. Each word stays bare on every new route (word help, the signal hint, the table),
// also after one or two prefix letters (ודהבכלמש); a word written with a leading "=" stays bare as that exact word only. Today's prose step does not read it.
const VOC_BARE_LIST = "פדא ממון אדא כנען =לד =כו =וכו =הו ואידי אידי =מר =בר הלל חנה ספרא מחנה נחמני דרוסאי פפי =מרי מתנה אויא מל";
const VOC_BARE = new Set(VOC_BARE_LIST.split(" ").map(w => w.replace(/^=/, ""))), VOC_BARE_N = new Set(VOC_BARE_LIST.split(" ").filter(w => !w.startsWith("=")));
const vocBare = w => VOC_BARE.has(w) || (/^[ודהבכלמש]/.test(w) && (VOC_BARE_N.has(w.slice(1)) || (/^[ודהבכלמש]/.test(w.slice(1)) && VOC_BARE_N.has(w.slice(2)))));
const vocYosi = f => /^[ודהבכלמש]{0,2}יוסי$/.test(String(f || "").replace(/[^\u05D0-\u05EA]/g, "")) && /ס\u05B4י$/.test(String(f).replace(/[^\u05D0-\u05EA\u05B4]/g, "")); // N1: יוסי is pointed only as יוֹסֵי; a יוֹסִי form stays bare
const vocNew = (w, how, f) => !vocBare(w) && !VOC_HOMO.has(w) && !(how === "amud" && vocCst(f)) && !vocYosi(f);
const vocCache = new WeakMap(); let vocGloss = null;          // vocGloss: data/glossary.json entries once loaded (the Ameilus reading glossary)
const vocFor = a => { if (!a || typeof a !== "object") return null; let V = vocCache.get(a); if (!V) { V = vocBuild(vocTextsOf(a)); vocCache.set(a, V); } return V; };
const px = (v, a) => refHtml(vocApply(v, vocFor(a || (current && current.analysis)), vocGloss)); // round 4: Tanakh references become pasuk buttons // English prose with its Hebrew words vocalized where the amud says how
const stepHe = h => esc(STEP_NIKUD[h] || h);  // a step-type label (מימרא, קשיא…) with its vowels
const loadJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

try { localStorage.removeItem("gc2-openai-key"); } catch {} // the old bring-your-own-key mode is gone; forget any key a device saved
const settings = Object.assign({ scale:1, nikud:true, translation:true, colors:true, kindtext:false, notes:true, terms:true, logic:false, expandAll:false, theme:"light" }, loadJSON(LS.settings, {}));
delete settings.byPerek; // the old "By perek / All dapim" switch is gone: perek view is always on
let cloudIds = new Set();
let cloudLoaded = false;
let current = null; // {m, i, id, analysis, source:'cloud'|null, text, tab}
let observer = null;

/* ---------- refs ---------- */
const masInfo = key => MAS.find(x => x[0] === key);
// home3 (Oct 16 2026): masechta names on screen use the ArtScroll (Schottenstein) Ashkenazi spellings. DISPLAY ONLY: routes
// (#/Berakhot/41b), data file names, JSON keys and Sefaria refs keep the keys. This one map is the only place a name is spelled;
// everything on screen goes through masName (and dispNames for the few names inside Classics text).
const MAS_DISPLAY = { Berakhot: "Berachos", Shabbat: "Shabbos", Eruvin: "Eruvin", Pesachim: "Pesachim", Yoma: "Yoma", Sukkah: "Succah", Beitzah: "Beitzah",
  Rosh_Hashanah: "Rosh Hashanah", Taanit: "Taanis", Megillah: "Megillah", Moed_Katan: "Moed Katan", Chagigah: "Chagigah", Yevamot: "Yevamos", Ketubot: "Kesubos",
  Nedarim: "Nedarim", Nazir: "Nazir", Sotah: "Sotah", Gittin: "Gittin", Kiddushin: "Kiddushin", Bava_Kamma: "Bava Kamma", Bava_Metzia: "Bava Metzia",
  Bava_Batra: "Bava Basra", Sanhedrin: "Sanhedrin", Makkot: "Makkos", Shevuot: "Shevuos", Avodah_Zarah: "Avodah Zarah", Horayot: "Horayos", Zevachim: "Zevachim",
  Menachot: "Menachos", Chullin: "Chullin", Bekhorot: "Bechoros", Arakhin: "Arachin", Temurah: "Temurah", Keritot: "Kereisos", Meilah: "Me’ilah", Tamid: "Tamid", Niddah: "Niddah" };
const masName = key => MAS_DISPLAY[key] || key.replace(/_/g, " ");
const DISP_RE = new RegExp(`\\b(${Object.keys(MAS_DISPLAY).filter(k => masName(k) !== k.replace(/_/g, " ")).map(k => k.replace(/_/g, " ")).join("|")})\\b`, "g");
const dispNames = s => String(s || "").replace(DISP_RE, n => masName(n.replace(/ /g, "_")));
const dafOf = i => ({ daf: Math.floor(i/2) + 1, amud: i % 2 ? "b" : "a" });
const idxOf = (daf, amud) => (daf - 1) * 2 + (amud === "b" ? 1 : 0);
const label = (m, i) => { const {daf, amud} = dafOf(i); return `${masName(m)} ${daf}${amud}`; };
const refId = (m, i) => { const {daf, amud} = dafOf(i); return `${m}_${daf}_${amud}`; };
const parseId = id => { const p = id.split("_"); const amud = p.pop(); const daf = +p.pop(); return { m: p.join("_"), i: idxOf(daf, amud) }; };
// home3b: the Sugya Flow link is written #/<m>/<daf>/steps; links with the earlier route word still open (alias in route()).
// The mode key stays "shiur" inside the app (storage keys and data-path-pick unchanged).
const hashFor = (m, i, extra="") => `#/${m}/${dafOf(i).daf}${dafOf(i).amud}${extra === "/shiur" ? "/steps" : extra}`;
// Nov 5 2026: one contact address for mistakes, questions and privacy requests (also on /about/ and /privacy/, built by tools/build-pages.mjs)
const CONTACT = "dksherizen@gmail.com";
const reportHref = (m, i, step) => { const where = `${label(m, i)}${step ? `, step ${step}` : ""}`;
  return `mailto:${CONTACT}?subject=${encodeURIComponent(`Gemara Clarity: mistake in ${where}`)}&body=${encodeURIComponent(`Where: ${where}
Link: https://gemaraclarity.org/${hashFor(m, i, "/steps")}

What is wrong:


What it should say (and a source, if you know one):

`)}`; };
function gematria(n){
  const ones=["","א","ב","ג","ד","ה","ו","ז","ח","ט"], tens=["","י","כ","ל","מ","נ","ס","ע","פ","צ"], hund=["","ק","ר","ש","ת"];
  let s = hund[Math.floor(n/100)] || ""; n %= 100;
  if (n === 15) s += "טו"; else if (n === 16) s += "טז"; else s += tens[Math.floor(n/10)] + ones[n%10];
  return s.length > 1 ? s.slice(0,-1) + "״" + s.slice(-1) : s + "׳";
}
const heShort = i => { const {daf, amud} = dafOf(i); return `דף ${gematria(daf).replace(/[׳״'"]/g, "")}${amud === "a" ? "." : ":"}`; }; // v5: the printed form (ב. / ב:) for the running head
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
    const names = [norm(masName(key)), norm(key.replace(/_/g, " ")), ...(ALIASES[key]||[]).map(norm)];
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
  if (daf && !res.length) for (const key of keys) res.push({ m:key, i:null, out:true }); // U4: daf out of range: keep the masechta, the hint names its range
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
let staticIds = new Set(), fsIds = new Set(), staticVersion = "", preferStatic = new Set();
// index.json carries a data version; each amud is fetched as <id>.json?v=<version>, so a re-reviewed library reaches phones at once
const staticReady = cachedJSON("data/b/index.json", { ttl: 10*60e3, timeout: 8000 })
  .then(j => { staticIds = new Set(j.ids || []); preferStatic = new Set(j.prefer || []); staticVersion = String(j.version || j.generated || ""); }).catch(e => console.warn("static library index unavailable", e));
// v99l: the library is data/b/index.json alone (it lists every amud); the Firestore collection is no longer paged on load.
// fsIds stays empty, so an amud the static index lists loads data/b/<id>.json, and Firestore is asked for one document only
// when the static index does not list the id (loadCloudAnalysis).
async function loadCloudIndex(){
  await staticReady;
  cloudIds = new Set([...fsIds, ...staticIds]); cloudLoaded = true;
}
async function loadCloudAnalysis(id){
  await staticReady;
  if (!staticIds.size) { // v99n: data/b/index.json did not load, so its version is unknown: the amud's static file (plain URL) first, then the one Firestore document below
    try { const a = await cachedJSON(`data/b/${encodeURIComponent(id)}.json`, { ttl: 3*864e5, timeout: 8000 }); if (a && Array.isArray(a.steps) && a.steps.length) return a; } catch {}
  }
  if (staticIds.has(id) && (!fsIds.has(id) || preferStatic.has(id))) {
    const a = await cachedJSON(`data/b/${encodeURIComponent(id)}.json${staticVersion ? "?v=" + encodeURIComponent(staticVersion) : ""}`, { ttl: 3*864e5 });
    return a && Array.isArray(a.steps) && a.steps.length ? a : null;
  }
  // Nov 5 2026: no fallback to the original app's Firestore library any more. It held older, unrepaired breakdowns,
  // and anyone with that app's (public) admin switch could write to it. If our own file can't load, the page says so and offers a retry.
  if (staticIds.size) return null;
  throw new Error("breakdown unavailable");
}
async function loadText(m, i){
  const { daf, amud } = dafOf(i);
  const j = await cachedJSON(`${SEFARIA}/api/texts/${m}.${daf}${amud}?context=0&commentary=0&pad=0`, { ttl: 60*864e5 });
  const flat = v => !v ? [] : typeof v === "string" ? [v] : Array.isArray(v) ? v.flatMap(flat) : [];
  return { he: flat(j.he), en: flat(j.text), heRef: j.heRef, version: j.versionTitle, heVersion: j.heVersionTitle, license: j.license };
}
// Nov 5 2026: the Daf Yomi worked out here, from the cycle that began on Jan 5 2020 (2,711 days a cycle), used whenever Sefaria's
// calendar has no answer, e.g. on June 8 2027, the first day of the next cycle, when its calendar was still empty.
// Checked against Sefaria's calendar on 20 dates from 2020 to 2027, including the Kinnim/Tamid/Middos days.
const DY_TABLE = [["Berakhot",64],["Shabbat",157],["Eruvin",105],["Pesachim",121],["Shekalim",22],["Yoma",88],["Sukkah",56],["Beitzah",40],["Rosh_Hashanah",35],["Taanit",31],["Megillah",32],["Moed_Katan",29],["Chagigah",27],["Yevamot",122],["Ketubot",112],["Nedarim",91],["Nazir",66],["Sotah",49],["Gittin",90],["Kiddushin",82],["Bava_Kamma",119],["Bava_Metzia",119],["Bava_Batra",176],["Sanhedrin",113],["Makkot",24],["Shevuot",49],["Avodah_Zarah",76],["Horayot",14],["Zevachim",120],["Menachot",110],["Chullin",142],["Bekhorot",61],["Arakhin",34],["Temurah",34],["Keritot",28],["Meilah",22],["Kinnim",4],["Tamid",9],["Middot",5],["Niddah",73]];
const DY_START = { Kinnim: 22, Tamid: 25, Middot: 33 };
function dafYomiLocal(d){
  const total = DY_TABLE.reduce((n, [, c]) => n + c - 1, 0);
  let n = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2020, 0, 5)) / 864e5);
  n = ((n % total) + total) % total;
  for (const [m, c] of DY_TABLE) {
    if (n < c - 1) { const daf = (DY_START[m] ?? 1) + n + 1; return masInfo(m) ? { m, i: Math.max(idxOf(daf, "a"), masInfo(m)[2]) } : { m: null }; }
    n -= c - 1;
  }
  return null;
}
async function dafYomi(){
  const d = new Date(); const key = `daf-yomi-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  let j = null;
  try { j = await cachedJSON(`${SEFARIA}/api/calendars?year=${d.getFullYear()}&month=${d.getMonth()+1}&day=${d.getDate()}`, { ttl: 12*3600e3, key: "/" + key, timeout: 8000 }); } catch {}
  const item = ((j && j.calendar_items)||[]).find(c => c.title && c.title.en === "Daf Yomi");
  if (!item) return dafYomiLocal(d);
  // Daf Yomi fix (dafyomi-trace.txt): accept an amud letter ("Meilah 22a") and handle Mishnah-only days (Kinnim, Middot), which
  // are not masechtos in the app: the tile says so in plain text, with no link (English links stay off), instead of "Unavailable offline"
  const mm = typeof item.ref === "string" && item.ref.match(/^(.*) (\d+)([ab])?$/);
  const key2 = mm && mm[1].replace(/ /g,"_");
  if (!mm || !masInfo(key2)) return { m: null };
  return { m: key2, i: Math.max(idxOf(+mm[2], mm[3] || "a"), masInfo(key2)[2]) };
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
// kt3 (Oct 16 2026: tap a word to see its translation): each Hebrew/Aramaic word of a
// step's phrase line is its own <span class="fw"> so a tap can open its word help (wordHelpFlow). The visible text is exactly heTxt's; nothing else changes.
// e5: each word is reachable by keyboard; st (one per step) gives the step's first word the step's one Tab stop (roving tabindex). Nov 5 2026 (review #100): no role="button",
// so a screen reader reads the line as one run of text, not "button" after every word; Tab, the arrows and Enter (word help) work as before
const heWords = (t, st) => { let k = 0; return heTxt(t).split(/(\s+|\u05BE)/).map(x => /[\u05D0-\u05EA]/.test(x) ? `<span class="fw" data-k="${k++}" tabindex="${st && !st.n++ ? 0 : -1}">${x}</span>` : x).join(""); };

/* ---------- UI helpers ---------- */
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2400); }
function applySettings(){
  const b = document.body;
  b.classList.remove("theme-dark","theme-light","theme-sepia"); b.classList.add("theme-" + settings.theme);
  b.classList.toggle("hide-translation", !settings.translation);
  b.classList.toggle("no-colors", !settings.colors);
  b.classList.toggle("no-kindtext", !settings.kindtext);
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
  // Nov 5 2026: an open sheet gets its own history entry, so the phone's Back button closes the sheet instead of leaving the daf
  if (!(history.state && history.state.gcSheet)) { try { history.pushState({ gcSheet: 1 }, ""); openSheet.url = location.href; } catch {} }
  if (!openSheet.inert) { openSheet.inert = [...document.body.children].filter(el => !["sheet", "backdrop", "toast", "srStatus", "disc"].includes(el.id) && !el.hasAttribute("inert")); openSheet.inert.forEach(el => el.setAttribute("inert", "")); } // v99r: the page behind the open sheet takes no focus
  onMount && onMount($("#sheetBody"));
  setTimeout(() => { const f = $("#sheetBody [autofocus]") || $("#sheetClose"); f && f.focus(); }, 30);
}
addEventListener("popstate", () => { if (closeSheet.skip) { closeSheet.skip = false; return; } if (!$("#sheet").hidden) closeSheet(true); });
function closeSheet(viaBack){ if ($("#sheet").hidden) return;
  if (!viaBack && history.state && history.state.gcSheet) setTimeout(() => { if (history.state && history.state.gcSheet && location.href === openSheet.url) { closeSheet.skip = true; history.back(); } }, 0); // drop the sheet's history entry unless closing it navigated somewhere
  $("#sheet").hidden = true; $("#backdrop").hidden = true; document.body.style.overflow = ""; if (openSheet.inert) { openSheet.inert.forEach(el => el.removeAttribute("inert")); openSheet.inert = null; } try { openSheet.last && openSheet.last.focus && openSheet.last.focus({ preventScroll: true }); } catch {} }
function sheetTab(e){ // v99r: while the sheet is open, Tab on its last control goes to the first and Shift-Tab on its first goes to the last
  if (document.querySelector("#pasukPop, #disc")) return; // those keep their own focus rules
  const s = $("#sheet"), a = document.activeElement;
  const f = [...s.querySelectorAll("a[href], button, input, select, textarea, [tabindex]")].filter(el => el.tabIndex >= 0 && !el.disabled && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
  if (s.contains(a) && f.some(el => a.compareDocumentPosition(el) & (e.shiftKey ? Node.DOCUMENT_POSITION_PRECEDING : Node.DOCUMENT_POSITION_FOLLOWING))) return; // the browser moves on inside the sheet
  e.preventDefault(); const t = e.shiftKey ? f[f.length - 1] : f[0]; if (t) t.focus();
}
const bookmarks = () => loadJSON(LS.bookmarks, []);
const history_ = () => loadJSON(LS.history, []);
function pushHistory(id){ const h = history_().filter(x => x.id !== id); h.unshift({ id, t: Date.now() }); saveJSON(LS.history, h.slice(0, 30)); }
function go(m, i, extra=""){ if (!extra && current && current.am) extra = "/ameilus"; location.hash = hashFor(m, i, extra); } // in Ameilus, the picker and the keys stay in Ameilus
const chev = `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
const hasBreakdown = id => cloudIds.has(id);

/* ---------- perakim (static data/perakim.json, from Sefaria's chapter map) ---------- */
let perakim = null;
function loadPerakim(){
  // round 4 (Oct 15 2026): the perek names show with nikud, from a display-only map (data/perek-nikud.json); a name without an entry stays bare
  if (loadPerakim.p) return loadPerakim.p;
  const nik = fetch("data/perek-nikud.json").then(r => r.ok ? r.json() : null).catch(() => null);
  return (loadPerakim.p = fetch("data/perakim.json").then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(async d => { const ms = d && d.masechtot || null, v = await nik; if (ms) applyPerekNikud(ms, v); return (perakim = ms); }).catch(() => { loadPerakim.p = null; return null; }));
}
function applyPerekNikud(ms, v){
  const strip = s => String(s || "").replace(/[\u0591-\u05C7]/g, "");
  for (const [m, list] of Object.entries(ms)) for (const p of list || []) {
    const cand = v && ((v.byRef || {})[`${m}|${p.n}`] || (v.byName || {})[p.he]);
    p.heV = cand && strip(cand) === p.he ? cand : p.he; // only ever adds vowels to the same letters
  }
}
const perakimOf = m => (perakim && perakim[m]) || null;
const perakimAt = (m, i) => (perakimOf(m) || []).filter(p => i >= p.start && i <= p.end);
const amudLbl = i => { const {daf, amud} = dafOf(i); return `${daf}${amud}`; };
const perekHe = p => `פֶּרֶק ${p.heV || p.he}`;
function perekLineHtml(m, i){
  const ps = perakimAt(m, i); if (!ps.length) return "";
  const main = ps[0], next = ps[1];
  return `<button class="perekline" id="perekBtn" data-perek="${main.n}" aria-label="Perek ${main.n}, ${esc(perekHe(main))}${next ? `; perek ${next.n} begins on this amud` : ""}. Show the perakim">`
    + `<span class="he" lang="he">${esc(perekHe(main))}</span>`
    + (next ? `<span class="pk-next"><span class="he" lang="he">${esc(perekHe(next))}</span> begins here</span>` : "")
    + `</button>`;
}

/* perek grouping: always on wherever a masechet's dapim are listed (the picker grid and the home library) */
function perekGroups(k){ // null when the masechet has one perek or no perakim data: those list as a plain grid
  const ps = perakimOf(k); if (!ps || ps.length < 2) return null;
  return ps.map((p, n) => { const prev = ps[n-1], nxt = ps[n+1];
    return { p, midOf: i => (prev && i === prev.end && i === p.start) ? `Perek ${p.n} begins partway down this amud` : (nxt && i === nxt.start && i === p.end) ? `Perek ${nxt.n} begins partway down this amud` : "" }; });
}
const perekHeadHtml = p => `<h4 class="pk-h"><span>Perek ${p.n} · <span class="he">${esc(perekHe(p))}</span></span><span class="pk-r">${amudLbl(p.start)}–${amudLbl(p.end)}</span></h4>`;
const perekJumpHtml = (ps, attr = "data-jump") => `<nav class="pk-jump" aria-label="Jump to a perek">${ps.map(p => `<button class="chip" ${attr}="${p.jump || p.n}"><b>${p.n}</b><span class="he">${esc(p.heV || p.he)}</span></button>`).join("")}</nav>`;
const midLegendHtml = `<span><i class="mid"></i>new perek starts partway down</span>`;

/* ---------- Mishnah index (Oct 19 2026: reach each mishnah and open it at its own step) ----------
   The daf picker gets a "By daf | By Mishnah" switch. By Mishnah lists every Mishnah of the masechet under its perek, with its opening
   words and its amud, from a small static file per masechet (data/mishnah/<masechet>.json, loaded when the switch is first opened).
   Each row: l = the standard Mishnah number in the chapter ("1–2" when one Gemara block covers several; "10:1" when the standard chapter
   differs from the Gemara's perek; absent when no standard number was found, so none is shown), c = the block starts partway into that
   Mishnah, i = the amud, s = the step on that amud where the Mishnah starts (0 = not found: the amud opens at the top), h = opening words.
   A row opens the amud scrolled to that step, opened and outlined, under a band naming the Mishnah with previous / next buttons. */
let pickBy = "daf", miLand = null, miState = null, miTapped = false;
const miData = {};
function loadMishnah(m){
  if (!miData[m]) miData[m] = fetch(`data/mishnah/${m}.json`).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json().then(d => oflMiKeep(m, d)); }).catch(e => oflMiCopy(m, e)) // offline: a saved masechet's own copy
    .then(d => { if (!d || !Array.isArray(d.p)) throw new Error("bad data"); return d; }).catch(e => { delete miData[m]; throw e; });
  return miData[m];
}
const miFlat = d => d.p.flatMap(p => p.r.map(r => ({ ...r, n: p.n })));
const miName = r => (!r.l ? "Mishnah" : r.l.includes("–") ? `Mishnayot ${r.l}` : `Mishnah ${r.l}`) + (r.c ? ", continued" : "");
const miChev = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d < 0 ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}"/></svg>`;
const miTabsHtml = by => `<div class="tabs mi-tabs" role="tablist" aria-label="Browse the masechet">${[["daf", "By daf"], ["mishnah", "By Mishnah"]].map(([k, t]) => `<button role="tab" data-by="${k}" aria-selected="${by === k}" tabindex="${by === k ? 0 : -1}">${t}</button>`).join("")}</div>`;
function miPickChrome(body, on){ ["#gotoInput", "#gotoSugg", "#yomiSlot"].forEach(s => { const e = $(s, body); if (e) e.style.display = on ? "none" : ""; }); } // the search box steps aside while By Mishnah shows
function miWireTabs(body, k, show){
  const t = $(".mi-tabs", body); if (!t) return;
  t.addEventListener("click", e => { const b = e.target.closest("[data-by]"); if (!b || b.getAttribute("aria-selected") === "true") return; miTapped = true; show(k, null, b.dataset.by); miTapped = false; body.scrollTop = 0; const n = $(`.mi-tabs [data-by="${b.dataset.by}"]`, body); n && n.focus({ preventScroll: true }); });
  t.addEventListener("keydown", e => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; e.preventDefault(); const by = $('[aria-selected="false"]', t); by && by.click(); });
}
function miRowHtml(r, x){
  const badge = r.l ? esc(r.l) : `<i class="mi-dot" aria-hidden="true"></i>`;
  return `<li><button class="mi-row" data-mi="${x}" aria-label="${esc(miName(r))}, ${amudLbl(r.i)}"><span class="mi-n${r.l ? "" : " mi-nn"}"><span>${badge}</span>${r.c ? `<small>cont.</small>` : ""}</span><span class="mi-he" lang="he" dir="rtl">${esc(r.h || "")}</span><span class="mi-loc">${amudLbl(r.i)}${miChev(1)}</span></button></li>`;
}
function miShowIndex(body, k, he, focusPerek, fx){
  const pb = $("#pickBody", body), ps = perakimOf(k) || [], tapped = miTapped; // opened by a tap on the switch: the list starts at its top, under the switch
  
  const head = `<div class="seder"><button class="chip" data-back>‹ All masechtot</button></div>
    <h3 style="margin:8px 0 0;display:flex;justify-content:space-between">${masName(k)} <span class="he en-he" style="color:var(--muted);font-weight:500">${he}</span></h3>${oflSlotHtml(k)}${miTabsHtml("mishnah")}`;
  pb.innerHTML = head + `<div class="loading"><div class="spinner"></div></div>`; pb.dataset.mas = k;
  miWireTabs(body, k, fx.showDafGrid);
  const focusTab = () => setTimeout(() => { const a = document.activeElement; if (!a || a === document.body || a.id === "gotoInput") { const t = $('.mi-tabs [aria-selected="true"]', body); t && t.focus({ preventScroll: true }); } }, 40);
  loadMishnah(k).then(d => {
    if (!pb.isConnected || pb.dataset.mas !== k || !$('.mi-tabs [data-by="mishnah"][aria-selected="true"]', pb)) return;
    const list = miFlat(d); let x = 0;
    const secs = d.p.map(p => { const pk = ps.find(q => q.n === p.n) || { n: p.n, he: "", start: p.r[0].i, end: p.r[p.r.length - 1].i };
      return `<section class="pk mi-pk" id="pk-${p.n}">${perekHeadHtml(pk)}<ol class="mi-list">${p.r.map(r => miRowHtml(r, x++)).join("")}</ol></section>`; }).join("");
    $(".loading", pb).outerHTML = perekJumpHtml(d.p.map(p => ps.find(q => q.n === p.n) || { n: p.n, he: "" })) + secs;
    pb.onclick = e => { const b = e.target.closest("[data-mi]"); if (b && pb.dataset.mas === k) miGo(k, list, +b.dataset.mi); };
    const activeN = focusPerek || (current && current.m === k && (perakimAt(k, current.i)[0] || {}).n);
    if (activeN) fx.markJump(activeN);
    if (activeN && !tapped && (focusPerek || activeN > 1) && $(`#pk-${activeN}`, body)) fx.scrollToPerek(activeN); else body.scrollTop = 0;
    focusTab();
  }).catch(() => {
    if (!pb.isConnected || pb.dataset.mas !== k) return;
    const l = $(".loading", pb); if (!l) return;
    l.outerHTML = `<div class="notice mi-err"><b>The Mishnah list couldn’t be loaded just now.</b><p>Check your connection and try again.</p><button class="btn" id="miRetry">Try again</button></div>`;
    $("#miRetry", pb).onclick = () => { miTapped = true; miShowIndex(body, k, he, focusPerek, fx); miTapped = false; };
  });
  focusTab();
}
function miGo(m, list, x){
  const r = list[x]; if (!r) return;
  miLand = { id: refId(m, r.i), m, list, x, fresh: true };
  closeSheet();
  const h = hashFor(m, r.i, r.s ? "/s" + r.s : "/steps");
  if (decodeURI(location.hash) === h) route(false); else location.hash = h;
}
function miAfterRender(c, a){
  if (miLand && miLand.id !== c.id) miLand = null;
  if (miState && miState.id !== c.id) miState = null;
  if (miLand) { miState = miLand; miLand = null; }
  if (!miState || !a || c.tab !== "steps") return;
  const L = miState, fresh = L.fresh; L.fresh = false;
  setTimeout(() => { if (current === c && current.tab === "steps") miBand(L, fresh); }, 0);
}
function miBand(L, fresh){
  const r = L.list[L.x], prev = L.list[L.x - 1], next = L.list[L.x + 1];
  const old = $("#miBand"); old && old.remove(); $$(".step.mi-landed").forEach(e => e.classList.remove("mi-landed"));
  const el = r.s ? document.getElementById("s" + r.s) : null, p = (perakimOf(L.m) || []).find(q => q.n === r.n);
  const nb = (d, o) => `<button class="mi-nb" type="button" data-mnav="${d}"${o ? ` aria-label="${d < 0 ? "Previous" : "Next"} Mishnah: ${esc(miName(o))}, ${amudLbl(o.i)}"` : ` disabled aria-label="${d < 0 ? "No previous" : "No next"} Mishnah"`}>${miChev(d)}</button>`;
  const html = `<div class="mi-band" id="miBand" role="group" aria-label="${esc(miName(r))}, Perek ${r.n}"><div class="mi-bt"><b>${esc(miName(r))}</b><span>Perek ${r.n}${p ? ` · <span class="he">${esc(perekHe(p))}</span>` : ""}</span></div><nav class="mi-nav" aria-label="Other Mishnayot">${nb(-1, prev)}${nb(1, next)}</nav></div>`;
  if (el) { el.insertAdjacentHTML("beforebegin", html); el.classList.add("mi-landed"); if (!el.classList.contains("open")) toggleStep(el, true); }
  else { const db = $("#dafBody"); if (!db) return; db.insertAdjacentHTML("afterbegin", html); }
  const band = $("#miBand");
  band.addEventListener("click", e => { const b = e.target.closest("[data-mnav]"); if (b && !b.disabled) miGo(L.m, L.list, L.x + +b.dataset.mnav); });
  if (fresh) {
    jumpTo.lock = Date.now() + 900;
    if (el) { const top = ($("#topbar") || { getBoundingClientRect: () => ({ height: 56 }) }).getBoundingClientRect().height; window.scrollTo(0, Math.max(0, band.getBoundingClientRect().top + scrollY - top - 10)); markCurrent(r.s); }
    else window.scrollTo(0, 0);
  }
}

/* ---------- picker ---------- */
// home3: the Sugya Flow and Ameilus cards on home open this same picker with a way already chosen; the chosen daf opens in that way
let pickMode = null;
function openPicker(focusMas, focusPerek, mode){
  pickMode = mode === "ameilus" || mode === "shiur" ? mode : null;
  const pm = pickMode;
  const html = `${pm ? `<div class="pick-mode pm-${pm}"><span class="pm-dot" aria-hidden="true"></span><span><b>${pm === "ameilus" ? "Ameilus" : "Sugya Flow"}</b> · ${pm === "ameilus" ? "pick a daf, then try it yourself" : "pick a daf to learn it step by step"}</span></div>` : ""}
    <input class="input" id="gotoInput" type="search" autocomplete="off" placeholder="Type a daf, e.g. Makkos 5b" aria-label="Go to a daf"${focusPerek ? "" : " autofocus"}>
    <div class="sugg" id="gotoSugg"></div>
    <div id="yomiSlot"></div>
    <div id="pickBody"></div>`;
  openSheet(pm ? "Choose a daf" : "Go to a daf", html, body => {
    const input = $("#gotoInput", body), sugg = $("#gotoSugg", body);
    const showMasList = () => {
      miPickChrome(body, false);
      $("#pickBody", body).innerHTML = SEDARIM.map(([en, he, list]) => `<div class="seder dp-seder">Seder ${en} <span class="en-he">${he}</span></div><div class="masgrid dp-list">${list.map(k => {
        const n = [...cloudIds].filter(id => parseId(id).m === k).length;
        return `<button class="masbtn" data-mas="${k}"><span class="mb-names"><span class="mb-en">${masName(k)}</span><span class="mb-he">${masInfo(k)[1]}</span></span>${n ? `<span class="dp-n" title="${n} amudim with a step-by-step breakdown">${n} amudim</span>` : ""}</button>`; }).join("")}</div>`).join("");
    };
    const cellHtml = (k, i, inRange, mid) => {
      const [, , first, last] = masInfo(k), {daf: d, amud: am} = dafOf(i);
      if (!inRange) return `<span class="am-x" aria-hidden="true"></span>`; /* Oct 30: was class "ph", which also picked up the phrase-row rules (.ph); its own class now */
      const ok = i >= first && i <= last, id = refId(k, i), cur = current && current.m === k && current.i === i;
      return `<button ${ok ? "" : "disabled"} data-go="${k}|${i}" class="${hasBreakdown(id) ? "has" : ""} ${cur ? "cur" : ""} ${mid ? "mid" : ""}"${mid ? ` title="${mid}"` : ""} aria-label="${masName(k)} ${d}${am}${hasBreakdown(id) ? ", has breakdown" : ""}${mid ? ", " + mid : ""}">${am}</button>`;
    };
    const rows = (k, from, to, midOf = () => "") => {
      let cells = "";
      for (let d = Math.floor(from/2)+1; d <= Math.floor(to/2)+1; d++) {
        const c = am => { const i = idxOf(d, am); return cellHtml(k, i, i >= from && i <= to, midOf(i)); };
        cells += `<div class="dafcell"><span class="dn"><b lang="he">${gematria(d)}</b><small>${d}</small></span>${c("a")}${c("b")}</div>`;
      }
      return `<div class="dafgrid">${cells}</div>`;
    };
    const scrollToPerek = (n, smooth) => { // below the sticky jump bar, however many rows it wraps to
      const s = $(`#pk-${n}`, body), bar = $(".pk-jump", body); if (!s) return;
      const y = body.scrollTop + s.getBoundingClientRect().top - body.getBoundingClientRect().top - (bar ? bar.offsetHeight : 0) - 4;
      body.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
    };
    const markJump = n => {
      const bar = $(".pk-jump", body); if (!bar) return;
      $$(".chip", bar).forEach(c => c.classList.toggle("on", c.dataset.jump === String(n)));
      const c = $(`.chip[data-jump="${n}"]`, bar); if (c && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = c.offsetLeft - (bar.clientWidth - c.offsetWidth) / 2;
    };
    const showDafGrid = (k, focusPerek, by) => {
      const [, he, first, last] = masInfo(k);
      const gs = perekGroups(k), byPerek = !!gs;
      const miOn = pm !== "ameilus" && byPerek; // Mishnah index: the switch shows wherever the daf grid is grouped by perek (not in the Ameilus picker)
      by = miOn ? (by || pickBy) : "daf"; if (miOn) pickBy = by;
      miPickChrome(body, by === "mishnah");
      if (by === "mishnah") return miShowIndex(body, k, he, focusPerek, { markJump, scrollToPerek, showDafGrid });
      let grid;
      if (byPerek) {
        grid = perekJumpHtml(gs.map(g => g.p))
          + gs.map(({ p, midOf }) => `<section class="pk" id="pk-${p.n}">${perekHeadHtml(p)}${rows(k, Math.max(p.start, first), Math.min(p.end, last), midOf)}</section>`).join("");
      } else grid = rows(k, first, last);
      $("#pickBody", body).innerHTML = `<div class="seder"><button class="chip" data-back>‹ All masechtot</button></div>
        <h3 style="margin:8px 0 0;display:flex;justify-content:space-between">${masName(k)} <span class="he en-he" style="color:var(--muted);font-weight:500">${he}</span></h3>
        ${oflSlotHtml(k)}${miOn ? miTabsHtml("daf") : ""}<div class="legend-mini"><span><i></i>full step-by-step breakdown</span><span>others: text and translation</span>${byPerek ? midLegendHtml : ""}</div>
        ${grid}`;
      $("#pickBody", body).dataset.mas = k;
      if (miOn) miWireTabs(body, k, showDafGrid);
      const activeN = focusPerek || (current && current.m === k && (perakimAt(k, current.i)[0] || {}).n);
      if (byPerek && activeN) markJump(activeN);
      if (byPerek && focusPerek && $(`#pk-${focusPerek}`, body)) scrollToPerek(focusPerek);
      else { const c = $("button.cur", body); c && c.scrollIntoView({ block: "center" }); }
    };
    body.addEventListener("click", e => {
      const t = e.target.closest("[data-mas],[data-go],[data-back],[data-jump]"); if (!t) return;
      if (t.dataset.jump) { markJump(t.dataset.jump); scrollToPerek(t.dataset.jump, true); }
      else if (t.dataset.mas) showDafGrid(t.dataset.mas);
      else if (t.dataset.back !== undefined) showMasList();
      else { const [k, i] = t.dataset.go.split("|"); closeSheet(); go(k, +i, pm ? "/" + pm : ""); }
    });
    input.addEventListener("input", () => {
      const r = parseGoto(input.value).slice(0, 6);
      sugg.innerHTML = r.map(x => x.i == null
        ? `<button class="chip" data-mas="${x.m}"><span>${masName(x.m)}</span><span class="he en-he x">${masInfo(x.m)[1]}</span></button>`
        : `<button class="chip" data-go="${x.m}|${x.i}"><span>${label(x.m, x.i)}${hasBreakdown(refId(x.m, x.i)) ? ` <span style="color:var(--accent)">● breakdown</span>` : ""}</span><span class="he x">${heLabel(x.m, x.i)}</span></button>`).join("")
        || (input.value.trim() ? `<div class="empty">No match yet. Try “Berachos 2a”.</div>` : "");
      const out = r.filter(x => x.out).map(x => { const [, , f, l] = masInfo(x.m), d = i => dafOf(i).daf + dafOf(i).amud; return `${masName(x.m)} runs ${d(f)}–${d(l)}.`; }); if (out.length) sugg.insertAdjacentHTML("beforeend", `<div class="empty">${out.join(" ")}</div>`); // U4
    });
    input.addEventListener("keydown", e => { if (e.key === "Enter") { const f = $("button", sugg); f && f.click(); } });
    const startGrid = () => { if (focusMas) showDafGrid(focusMas, focusPerek); else if (current) showDafGrid(current.m); else showMasList(); };
    if (perakim || !(focusMas || current)) startGrid();
    else { $("#pickBody", body).innerHTML = `<div class="loading"><div class="spinner"></div></div>`; loadPerakim().then(() => { if ($("#pickBody", body) && $("#pickBody", body).isConnected) startGrid(); }); }
    dafYomi().then(y => { if (y && y.m && $("#yomiSlot", body)) $("#yomiSlot", body).innerHTML = `<button class="chip" data-go="${y.m}|${y.i}" style="width:100%;justify-content:space-between;min-height:46px;border-radius:12px"><span>Today’s Daf Yomi: <b>${masName(y.m)} ${dafOf(y.i).daf}</b></span><span class="x">›</span></button>`; }).catch(()=>{}); // Daf Yomi fix: a Mishnah-only day shows no chip here
  });
}

/* ---------- settings ---------- */
function openSettings(){
  const sw = (key, title, sub) => `<label class="setrow"><span class="lbl"><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}</span><span class="switch"><input type="checkbox" data-set="${key}" ${settings[key] ? "checked" : ""}><span></span></span></label>`;
  const html = `
    <div class="setrow"><span class="lbl"><b>Text size</b><span>Hebrew/Aramaic and English together</span></span>
      <span class="sizer"><button data-size="-1" aria-label="Smaller text">A−</button><button data-size="1" aria-label="Larger text">A+</button></span></div>
    <div class="preview-he">${heTxt("אָמַר רַבִּי יוֹחָנָן מִשּׁוּם רַבִּי שִׁמְעוֹן בֶּן יוֹחַי")}</div>
    <div class="preview-en">Rabbi Yoḥanan said in the name of Rabbi Shimon ben Yoḥai…</div>
    <div class="setrow"><span class="lbl"><b>Theme</b></span><span class="seg3">${["dark","light","sepia"].map(t => `<button data-theme="${t}" aria-pressed="${settings.theme === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</span></div>
    ${sw("translation","English translation","Beside each phrase")}
    ${sw("nikud","Vowels (nikud)","Turn off to practice reading plain text")}
    ${sw("colors","Step colors")}
    ${sw("kindtext","Color the text","Tint the Hebrew and English with each step's color.")}
    ${sw("notes","Phrase notes")}
    ${sw("logic","Logic details","Trigger words, what attacks what, how it is resolved")}
    ${sw("expandAll","Open every explanation","Otherwise tap a step to open it")}
    <h3 style="margin:22px 0 4px;font-size:16px">Offline</h3>
    <p class="small" style="margin:0 0 8px">Every daf you open is saved on this device automatically. You can also save the whole breakdown library now (${cloudIds.size || "all"} amudim) for learning without signal.</p>
    <button class="btn ofl-all" id="saveAll">Save library for offline<span class="sz">${oflMB(OFL_ALL_KB)}</span></button> <span class="small" id="saveAllMsg"></span><div id="oflList" class="ofl-list">${oflListHtml()}</div>
    <h3 style="margin:22px 0 4px;font-size:16px">About</h3>
    <p class="small" style="margin:0">Text and translation: Sefaria, William Davidson Edition (CC BY-NC). Step-by-step breakdowns are AI-generated; check them against the text and your teacher. <a href="/about/">About Gemara Clarity</a> · <a href="/privacy/">Privacy</a> · <a href="mailto:${CONTACT}">${CONTACT}</a></p>
    <p class="small" style="margin:8px 0 0"><button class="linkbtn disc-link" id="discAgain" type="button">About this content (AI disclaimer)</button></p>
    <p class="small"><button class="btn" id="clearData" style="margin-top:10px">Clear my bookmarks, history and saved data</button></p>`;
  openSheet("Settings", html, body => {
    body.addEventListener("change", e => { const k = e.target.dataset.set; if (k) { settings[k] = e.target.checked; applySettings(); rerender(); } });
    body.addEventListener("click", async e => {
      const t = e.target.closest("button"); if (!t) return;
      if (t.dataset.size) { settings.scale = Math.min(1.7, Math.max(0.85, +(settings.scale + 0.1 * +t.dataset.size).toFixed(2))); applySettings(); }
      if (t.dataset.theme) { settings.theme = t.dataset.theme; applySettings(); $$("[data-theme]", body).forEach(b => b.setAttribute("aria-pressed", b.dataset.theme === settings.theme)); }
      if (t.id === "saveAll") saveLibrary($("#saveAllMsg", body), t);
      if (t.id === "discAgain") { closeSheet(); showDisclaimer(true); }
      if (t.id === "clearData") { if (confirm("Clear bookmarks, history, saved dapim and settings on this device?")) { acct.forgetDevice(); Object.values(LS).forEach(k => localStorage.removeItem(k)); try { await caches.delete(DATA_CACHE); } catch {} location.hash = "#/"; location.reload(); } }
    });
    if (!settings.nikud) $(".preview-he", body).textContent = "אמר רבי יוחנן משום רבי שמעון בן יוחי";
  });
}
async function saveLibrary(msg, btn){
  btn.disabled = true; const ids = [...cloudIds]; let done = 0, fail = 0; const bad = new Set();
  const run = async id => { try { await loadCloudAnalysis(id); const p = parseId(id); await loadText(p.m, p.i); } catch { fail++; bad.add(parseId(id).m); } done++; msg.textContent = ` ${done}/${ids.length}`; };
  for (let k = 0; k < ids.length; k += 4) await Promise.all(ids.slice(k, k + 4).map(run));
  msg.textContent = fail ? ` Saved ${done - fail}; ${fail} failed (try again with signal)` : ` Saved all ${done}.`;
  oflLibDone(ids, bad);
  btn.disabled = false;
}

/* ---------- home ---------- */
function libraryHtml(){
  if (!cloudLoaded) return `<div class="skel"></div><div class="skel" style="width:70%"></div>`;
  if (!cloudIds.size) return `<div class="empty">The library list didn’t load just now. Any daf still opens from “Go to any daf…” above.</div>`; // v99lb: index.json failed; each amud still loads (one Firestore document)
  const by = {};
  for (const id of cloudIds) { const p = parseId(id); (by[p.m] ||= []).push(p.i); }
  const lastM = (history_()[0] && parseId(history_()[0].id).m) || "";
  const chip = (k, i, mid = "") => `<a class="chip${mid ? " mid" : ""}" href="${hashFor(k, i)}"${mid ? ` title="${mid}" aria-label="${masName(k)} ${amudLbl(i)}, ${mid}"` : ""}>${amudLbl(i)}</a>`;
  const body = (k, list) => { // grouped by perek, the same way the picker lists them; one perek or no perakim data: plain chips
    const gs = perekGroups(k);
    if (!gs) return `<div class="chips">${list.map(i => chip(k, i)).join("")}</div>`;
    const secs = gs.map(g => ({ ...g, list: list.filter(i => i >= g.p.start && i <= g.p.end) })).filter(g => g.list.length);
    const hasMid = secs.some(g => g.list.some(i => g.midOf(i)));
    return (secs.length > 1 ? perekJumpHtml(secs.map(g => ({ ...g.p, jump: `${k}|${g.p.n}` })), "data-libjump") : "")
      + (hasMid ? `<div class="legend-mini">${midLegendHtml}</div>` : "")
      + secs.map(({ p, midOf, list }) => `<section class="pk" id="lib-${k}-pk-${p.n}">${perekHeadHtml(p)}<div class="chips">${list.map(i => chip(k, i, midOf(i))).join("")}</div></section>`).join("");
  };
  return `<div class="lib">${MAS.filter(x => by[x[0]]).map(([k, he]) => `<details class="card lib-row" data-mas="${k}"${k === lastM ? " open" : ""}><summary><span class="lr-en">${masName(k)}</span><span class="he lr-he">${he}</span><span class="lr-n">${by[k].length} amudim</span>${chev}</summary>
    <div class="lib-body">${body(k, by[k].sort((a,b) => a-b))}</div></details>`).join("")}</div>`;
}
function refreshLibrary(){ // re-list after the library index or the perakim arrive, keeping open rows open
  const s = $("#libSlot"); if (!s || current) return;
  const open = new Set($$("details.lib-row[open]", s).map(d => d.dataset.mas));
  s.innerHTML = libraryHtml();
  if (open.size) $$("details.lib-row", s).forEach(d => { d.open = open.has(d.dataset.mas); });
  const hdr = s.previousElementSibling; if (hdr && hdr.querySelector("small")) hdr.querySelector("small").textContent = cloudIds.size ? cloudIds.size + " amudim" : "";
}
function wireLibrary(){
  const s = $("#libSlot"); if (!s) return;
  s.addEventListener("click", e => {
    const t = e.target.closest("[data-libjump]"); if (!t) return;
    const [k, n] = t.dataset.libjump.split("|"), sec = document.getElementById(`lib-${k}-pk-${n}`); if (!sec) return;
    const bar = t.parentElement; $$(".chip", bar).forEach(c => c.classList.toggle("on", c === t));
    const top = ($("#topbar") || {}).offsetHeight || 0, sticky = bar.offsetHeight || 0;
    scrollTo({ top: scrollY + sec.getBoundingClientRect().top - top - sticky - 6, behavior: "smooth" });
  });
}
// ---- Two paths: Shiur and Ameilus (Oct 15 2026) ----
// Ameilus is its own way of learning, not a switch: home offers both paths up front, an amud opened with no
// remembered choice asks which way (equal weight, no default), and once a choice is remembered on this device
// the amud opens that way with a compact two-option bar to switch, which keeps the place.
const MODES = ["shiur", "ameilus"];
function modePref(){ const v = loadJSON(LS.mode, null); return MODES.includes(v) ? v : null; }
function setModePref(v){ if (MODES.includes(v) && modePref() !== v) saveJSON(LS.mode, v); }
const PATH_ICON = {
  shiur: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 8h8M8 12h6"/></svg>`,
  ameilus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`
};
function pathsHtml(hrefOf, opts = {}){ // two equal cards; hrefOf(mode) gives each card's link
  const one = mode => {
    const t = mode === "shiur" ? { h: AMW.shiurTitle, p: AMW.shiurLine, go: AMW.shiurGo } : { h: AMW.amTitle, p: AMW.amLine, go: AMW.amGo };
    return `<a class="path path-${mode}" href="${hrefOf(mode)}" data-path-pick="${mode}">
        <span class="path-ic">${PATH_ICON[mode]}</span>
        <span class="path-tx"><b class="path-h">${esc(t.h)}</b><span class="path-p">${esc(t.p)}</span>
        ${mode === "ameilus" ? `<span class="path-def">${esc(AMW.amDef)}</span>` : ""}
        ${opts.compact ? "" : `<span class="path-go">${esc(opts.goText ? opts.goText(mode) : t.go)} <span aria-hidden="true">›</span></span>`}</span>
        ${opts.compact ? `<span class="path-chev" aria-hidden="true">›</span>` : ""}
        ${opts.last === mode ? `<span class="path-last">Last used</span>` : ""}</a>`;
  };
  return `<div class="paths">${one("shiur")}${one("ameilus")}</div>`;
}
function modeBarHtml(m, i, mode){ // the compact chooser on every amud once a choice is remembered
  const o = (k, b, sub) => `<a class="mb-o${mode === k ? " on" : ""}" href="${hashFor(m, i, "/" + k)}" data-path-pick="${k}"${mode === k ? ' aria-current="page"' : ""}><b>${b}</b><span>${sub}</span></a>`;
  return `<nav class="modebar" aria-label="How to learn this amud">${o("shiur", "Sugya Flow", "explained step by step")}${o("ameilus", "Ameilus", "try it yourself")}</nav>`;
}
// ---- end two paths ----
// ---- Classics (classics1, Oct 16 2026; ported from the Classics v1 preview and widened) ----
// A Classic is a selected passage with a clear start and end step (data/classics.json). It opens in Sugya Flow at its exact start
// step (home3c: Classic-in-Ameilus was removed, Oct 16 2026). A range may run across several amudim; a two-part
// Classic keeps its second part as its own entry (partOf), shown inside the first part's card. The 'source' fields are not shown.
const CL_REV = "home3c-r4"; // raise this whenever data/classics.json changes, so every phone fetches the new list at once
const clJSON = {};
function clData(name){ return clJSON[name] || (clJSON[name] = cachedJSON(`data/${name}.json?v=${CL_REV}`, { ttl: 10*60e3, timeout: 8000 }).catch(() => { delete clJSON[name]; return null; })); }
const dafIdx = (m, daf) => { const d = /^(\d+)([ab])$/.exec(daf); return idxOf(+d[1], d[2]); };
const clAt = p => ({ m: p.m, i: dafIdx(p.m, p.daf) });
const clRange = it => it.start.daf === it.end.daf ? `${masName(it.start.m)} ${it.start.daf} · steps ${it.start.step}–${it.end.step}` : `${masName(it.start.m)} ${it.start.daf} step ${it.start.step} → ${it.end.daf} step ${it.end.step}`;
const clName = it => it.title || it.question;
const CL_VIEW = "gc-classics-view";
const CL_KIND = "gc-classics-kind"; // the type filter on the Classics screen; each Classic's "kind" is set in data/classics.json
const CL_KINDS = [["all", "All"], ["short", "Short stories"], ["story", "Longer stories"], ["idea", "Big ideas"], ["halacha", "Halacha"]];
function clGo(it){
  const s = clAt(it.start);
  return `<div class="cl-go"><a class="btn primary" href="${hashFor(s.m, s.i, "/s" + it.start.step)}">Learn with Sugya Flow</a></div>`;
}
function classicCard(it, C){
  const s = clAt(it.start);
  const ctxLine = it.context ? `<p class="cl-ctx">${esc(dispNames(it.context.why))} <a href="${hashFor(it.context.m, dafIdx(it.context.m, it.context.daf), "/s" + it.context.from)}">${masName(it.context.m)} ${it.context.daf}, steps ${it.context.from}–${it.context.to}</a></p>` : "";
  const nx = it.next && C ? (C.items || []).find(x => x.id === it.next.id) : null;
  const thenRow = nx ? `<div class="cl-then" id="cl-${esc(nx.id)}"><h4 class="cl-then-h">${esc(clName(nx))}</h4>
      <p class="cl-then-ref">${esc(clRange(nx))} · ${nx.reading.steps} steps${nx.time ? ` · ${esc(nx.time)}` : ""}</p>
      <p class="cl-sum">${px(dispNames(nx.summary))}</p>
      <dl class="cl-facts cl-then-f"><div><dt>Starts</dt><dd>${nx.start.daf} step ${nx.start.step} · <span class="he" lang="he">${heTxt(nx.start.words)}</span></dd></div><div><dt>Ends</dt><dd>${nx.end.daf} step ${nx.end.step} · <span class="he" lang="he">${heTxt(nx.end.words)}</span></dd></div></dl>
      ${clGo(nx)}</div>` : "";
  return `<article class="cl-card" id="cl-${esc(it.id)}">
    <div class="cl-ref">${esc(clRange(it))} <span class="he" lang="he">${heLabel(s.m, s.i)}</span></div>
    <h3 class="cl-q">${esc(clName(it))}</h3>
    <p class="cl-sum">${px(dispNames(it.summary))}</p>
    <dl class="cl-facts">
      <div><dt>Starts</dt><dd>${it.start.daf} step ${it.start.step} · <span class="he" lang="he">${heTxt(it.start.words)}</span></dd></div>
      <div><dt>Ends</dt><dd>${it.end.daf} step ${it.end.step} · <span class="he" lang="he">${heTxt(it.end.words)}</span></dd></div>
      ${it.background ? `<div><dt>Background</dt><dd>${px(dispNames(it.background))}</dd></div>` : ""}
      <div><dt>Reading</dt><dd>${it.reading.steps} steps${Number.isFinite(it.reading.words) && it.reading.words > 0 ? ` · about ${Math.round(it.reading.words / 10) * 10} words of Gemara text (not counting the explanations)` : ""}${it.time ? `; ${esc(it.time)}` : ""}</dd></div>
    </dl>
    ${it.excluded ? `<p class="cl-ex">${px(dispNames(it.excluded))}</p>` : ""}
    ${ctxLine}
    ${it.continues ? `<p class="cl-ctx"><a href="${hashFor(it.continues.m, dafIdx(it.continues.m, it.continues.daf), "/shiur")}">${esc(dispNames(it.continues.label))} ›</a></p>` : ""}
    ${clGo(it)}
    ${thenRow}
    <p class="cl-status">Selected passage; AI-generated explanations may contain mistakes. No haskama or rabbinic review.</p>
  </article>`;
}
// ---- home3 Classics library (Oct 16 2026: the classic sugyos, listed by Seder and masechta). By Seder (default): Seder → masechta → the sugyos, each a compact card that opens in Sugya Flow; a sticky
// Seder bar and a search box on top. Suggested order keeps the classics1 cards. The 51-item draft list (data/classics-draft.json, not
// verified, file unchanged) is merged in for this mock only: de-duplicated against the verified list by masechta + daf, marked "Draft",
// and given buttons only when it names a usable start and end step.
const CL_SEDARIM = [["Zeraim", "זרעים"], ["Moed", "מועד"], ["Nashim", "נשים"], ["Nezikin", "נזיקין"], ["Kodashim", "קדשים"], ["Taharos", "טהרות"]];
const CL_SEDER = { // the 37 masechtos of the Bavli, by Seder (keys as in the data and the routes)
  Berakhot: "Zeraim",
  Shabbat: "Moed", Eruvin: "Moed", Pesachim: "Moed", Yoma: "Moed", Sukkah: "Moed", Beitzah: "Moed", Rosh_Hashanah: "Moed", Taanit: "Moed", Megillah: "Moed", Moed_Katan: "Moed", Chagigah: "Moed",
  Yevamot: "Nashim", Ketubot: "Nashim", Nedarim: "Nashim", Nazir: "Nashim", Sotah: "Nashim", Gittin: "Nashim", Kiddushin: "Nashim",
  Bava_Kamma: "Nezikin", Bava_Metzia: "Nezikin", Bava_Batra: "Nezikin", Sanhedrin: "Nezikin", Makkot: "Nezikin", Shevuot: "Nezikin", Avodah_Zarah: "Nezikin", Horayot: "Nezikin",
  Zevachim: "Kodashim", Menachot: "Kodashim", Chullin: "Kodashim", Bekhorot: "Kodashim", Arakhin: "Kodashim", Temurah: "Kodashim", Keritot: "Kodashim", Meilah: "Kodashim", Tamid: "Kodashim",
  Niddah: "Taharos"
};
const CL_TIER = { "First win": "first", "Getting hooked": "hooked", "Harder": "harder", "Following a halachic argument": "halacha" };
// home3b (Oct 16 2026): the draft rows (data/classics-draft.json, not yet verified) are HIDDEN from users. The file ships
// unchanged and is not even fetched while this is false; set it to true to show them again, marked "Draft", as in the home3 mock.
const CL_SHOW_DRAFTS = false;
function clAll(){
  return clAll.p || (clAll.p = Promise.all([clData("classics"), CL_SHOW_DRAFTS ? clData("classics-draft") : null]).then(([C, Dr]) => {
    if (!C) { clAll.p = null; return null; }
    const seen = new Set(C.items.map(x => x.start.m + "|" + x.start.daf));
    const drafts = ((Dr && Dr.items) || []).filter(x => x && x.id && x.start && CL_SEDER[x.start.m] && !seen.has(x.start.m + "|" + x.start.daf) && !C.items.some(v => v.id === x.id))
      .map(x => ({ ...x, draft: true, group: CL_TIER[x.tier] || "hooked" }));
    return { groups: C.groups || [], items: [...C.items, ...drafts], verified: C.items.filter(x => !x.partOf).length, drafts: drafts.length };
  }));
}
// draft text is shown as written except a clause that points at another list's numbering ("X's #5 starts at…"; the draft file stays unchanged)
const clClean = s => { s = String(s || ""); const parts = s.replace(/([;.])\s+/g, "$1\u0001").split("\u0001").filter(x => !/\b\w+['’]s #\d+/.test(x)); const out = parts.join(" ").trim(); return out && out !== s.trim() ? out.replace(/;$/, ".") : out; };
const clStepOk = p => !!(p && masInfo(p.m) && /^\d+[ab]$/.test(p.daf || "") && Number.isInteger(p.step) && p.step > 0);
const clLaunchable = it => !it.draft || (clStepOk(it.start) && clStepOk(it.end) && it.start.m === it.end.m && dafIdx(it.start.m, it.start.daf) <= dafIdx(it.end.m, it.end.daf));
const clHook = it => { const s = dispNames(clClean(it.summary || it.why || "")); const m = /^(.+?[.!?])(\s|$)/.exec(s); return m ? m[1] : s; };
// a one-line hook is English with Hebrew names inside: each Hebrew run is isolated (<bdi>) so "רב חסדא's question" keeps its order
const bidiHe = t => esc(t).replace(/[\u0590-\u05FF\uFB1D-\uFB4F](?:[\u0590-\u05FF\uFB1D-\uFB4F"״׳]|\s(?=[\u0590-\u05FF]))*/g, r => `<bdi class="he-in" lang="he" dir="rtl">${r}</bdi>`);
const clDafRange = it => it.start.daf === it.end.daf ? `${it.start.daf} · steps ${it.start.step}–${it.end.step}` : `${it.start.daf} step ${it.start.step} → ${it.end.daf} step ${it.end.step}`;
const clQ = it => [clName(it), it.question, it.summary, masName(it.start.m), it.start.m.replace(/_/g, " "), ...(ALIASES[it.start.m] || []), masInfo(it.start.m)[1], it.start.daf, it.end.daf, CL_SEDER[it.start.m]].filter(Boolean).join(" ").toLowerCase();
const clGroupName = (C, it) => ((C.groups || []).find(g => g.id === it.group) || {}).name || it.tier || "";
function clRow(it, C){
  const nx = it.next ? C.items.find(x => x.id === it.next.id) : null;
  const go = x => clLaunchable(x) ? clGo(x) : `<p class="clx-wait">This one opens once its start and end steps are set.</p>`;
  const more = x => `<details class="clx-more"><summary>Where it starts and ends</summary><dl class="cl-facts">
      <div><dt>Starts</dt><dd>${x.start.daf} step ${x.start.step} · <span class="he" lang="he">${heTxt(x.start.words || "")}</span></dd></div>
      <div><dt>Ends</dt><dd>${x.end.daf} step ${x.end.step} · <span class="he" lang="he">${heTxt(x.end.words || "")}</span></dd></div>
      ${x.background && x.background !== "None." && clClean(x.background) ? `<div><dt>Background</dt><dd>${px(dispNames(clClean(x.background)))}</dd></div>` : ""}</dl>
      ${clClean(x.excluded) ? `<p class="cl-ex">${px(dispNames(clClean(x.excluded)))}</p>` : ""}</details>`;
  const meta = x => [x.reading && x.reading.steps ? `${x.reading.steps} steps` : "", x.time || ""].filter(Boolean).join(" · ");
  return `<article class="clx-row${it.draft ? " is-draft" : ""}" id="cl-${esc(it.id)}" data-k="${esc(it.kind || "")}" data-q="${esc(clQ(it) + (nx ? " " + clQ(nx) : ""))}">
    <div class="clx-top"><span class="clx-ref">${esc(clDafRange(it))}</span>${it.draft ? `<span class="clx-draft" title="From the draft list, still being checked">Draft</span>` : ""}</div>
    <h4 class="clx-t">${esc(clName(it))}</h4>
    <p class="clx-hook" dir="ltr">${bidiHe(clHook(it))}</p>
    ${meta(it) ? `<p class="clx-meta">${esc(meta(it))}</p>` : ""}
    ${go(it)}
    ${nx ? `<div class="clx-then" id="cl-${esc(nx.id)}"><div class="clx-top"><span class="clx-ref">${esc(clDafRange(nx))}</span></div><h5 class="clx-t">${esc(clName(nx))}</h5>${meta(nx) ? `<p class="clx-meta">${esc(meta(nx))}</p>` : ""}${go(nx)}</div>` : ""}
    ${more(it)}
  </article>`;
}
function clSederHtml(C){
  const items = C.items.filter(x => !x.partOf);
  return CL_SEDARIM.map(([sd, he]) => {
    const masList = SEDARIM.flatMap(x => x[2]).filter(m => CL_SEDER[m] === sd);
    const groups = masList.map(m => [m, items.filter(x => x.start.m === m).sort((a, b) => dafIdx(m, a.start.daf) - dafIdx(m, b.start.daf) || a.start.step - b.start.step)]).filter(g => g[1].length);
    const n = groups.reduce((t, g) => t + g[1].length, 0);
    const body = groups.length ? groups.map(([m, its]) => `<section class="clx-mas" id="clm-${m}"><h3 class="clx-mh"><span class="clx-mn">${esc(masName(m))}</span><span class="he clx-mhe" lang="he">${masInfo(m)[1]}</span><span class="clx-mc">${its.length}</span></h3>
        <div class="clx-rows">${its.map(it => clRow(it, C)).join("")}</div></section>`).join("") : `<p class="clx-none" role="status">No classics here yet. We are still choosing the sugyos for ${sd}.</p>`;
    return `<details class="clx-seder" id="sd-${sd}" data-seder="${sd}">
      <summary><span class="clx-sw"><span class="clx-sn"><b>${sd}</b> <span class="clx-dot">·</span> <span class="he clx-she" lang="he" dir="rtl">${he}</span></span>
        <span class="clx-ss">${n} ${n === 1 ? "sugya" : "sugyos"} · ${groups.map(g => esc(masName(g[0]))).join(", ") || "coming soon"}</span></span>${chev}</summary>
      <div class="clx-body">${body}</div></details>`;
  }).join("");
}
async function renderClassics(focusId){
  current = null; document.title = "Classics · Gemara Clarity"; setChrome(false);
  let view = "seder"; try { view = localStorage.getItem(CL_VIEW) === "level" ? "level" : "seder"; } catch {}
  let kind = "all"; try { const k = localStorage.getItem(CL_KIND); if (CL_KINDS.some(x => x[0] === k)) kind = k; } catch {}
  $("#view").innerHTML = `<div class="cl-wrap clx">
      <header class="clx-head"><p class="clx-eyebrow">Classics</p><h1 class="cl-h">Famous sugyos to start with</h1>
      <p class="cl-intro">Each one is a selected passage with a clear start and end. Pick one and learn it step by step with Sugya Flow.</p></header>
      <div class="clx-tools">
        <label class="clx-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" id="clSearch" autocomplete="off" placeholder="Search a sugya, masechta or daf" aria-label="Search the Classics"></label>
        <div class="cl-seg" role="group" aria-label="Order"><button type="button" data-clv="seder" aria-pressed="${view === "seder"}">By Seder</button><button type="button" data-clv="level" aria-pressed="${view === "level"}">Suggested order</button></div>
      </div>
      <div class="clx-kinds" role="group" aria-label="Show">${CL_KINDS.map(([k, name]) => `<button type="button" class="clx-chip clx-kind" data-kind="${k}" aria-pressed="${k === kind}">${name}<span class="clx-cn"></span></button>`).join("")}</div>
      <nav class="clx-jump" aria-label="Jump to a Seder"${view === "seder" ? "" : " hidden"}>${CL_SEDARIM.map(([sd]) => `<button type="button" class="clx-chip" data-jump-seder="${sd}">${sd}<span class="clx-cn"></span></button>`).join("")}</nav>
      <p class="cl-status clx-status">Selected passage; AI-generated explanations may contain mistakes. No haskama or rabbinic review.</p>
      <div id="clList" aria-busy="true"><div class="skel"></div><div class="skel"></div></div>
      <p class="clx-empty" id="clEmpty" hidden>No classic matches that yet.</p>
    </div>`;
  const C = await clAll(); const list = $("#clList"); if (!list || current) return;
  if (!C) { list.removeAttribute("aria-busy"); list.innerHTML = `<p class="notice">Couldn’t load the Classics just now.</p>`; return; }
  const draw = v => {
    $(".clx-jump").hidden = v !== "seder";
    if (v === "seder") list.innerHTML = clSederHtml(C);
    else {
      const items = C.items.filter(x => !x.partOf);
      list.innerHTML = (C.groups || []).map(g => {
        const its = items.filter(x => !x.draft && x.group === g.id).sort((a, b) => a.order - b.order), dr = items.filter(x => x.draft && x.group === g.id).sort((a, b) => a.order - b.order);
        return its.length || dr.length ? `<section class="cl-theme">${g.id === "more" ? `<hr class="section-sep" aria-hidden="true">` : `<h2 class="section-h">${esc(g.name)}</h2>`}${g.intro ? `<p class="cl-gi">${esc(g.intro)}</p>` : ""}${its.map(it => classicCard(it, C).replace('<article class="cl-card"', `<article data-q="${esc(clQ(it))}" data-k="${esc(it.kind || "")}" class="cl-card"`)).join("")}${dr.length ? `<div class="clx-rows clx-draftlist">${dr.map(it => clRow(it, C)).join("")}</div>` : ""}</section>` : "";
      }).join("");
    }
    $$(".clx-jump .clx-chip").forEach(b => { const s = $(`#sd-${b.dataset.jumpSeder}`); const n = s ? s.querySelectorAll(".clx-row").length : 0; $(".clx-cn", b).textContent = n; });
    list.removeAttribute("aria-busy"); filter();
  };
  const filter = () => {
    const q = ($("#clSearch").value || "").trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean);
    let shown = 0; const narrowed = words.length || kind !== "all"; const byKind = {};
    $$("[data-q]", list).forEach(el => { const okq = words.every(w => el.dataset.q.includes(w)); if (okq) { byKind.all = (byKind.all || 0) + 1; byKind[el.dataset.k] = (byKind[el.dataset.k] || 0) + 1; }
      const ok = okq && (kind === "all" || el.dataset.k === kind); el.hidden = !ok; if (ok) shown++; });
    $$(".clx-kind").forEach(b => { $(".clx-cn", b).textContent = byKind[b.dataset.kind] || 0; }); // the type chips count what the search leaves
    $$(".clx-mas", list).forEach(s => { s.hidden = !s.querySelector("[data-q]:not([hidden])"); });
    $$(".clx-seder", list).forEach(s => { const any = !!s.querySelector("[data-q]:not([hidden])"); s.hidden = narrowed ? !any : false; if (narrowed && any) s.open = true; }); // home3c: an empty Seder (Kodashim, Taharos) stays visible and says "No classics here yet"
    $$(".cl-theme", list).forEach(s => { s.hidden = !s.querySelector("[data-q]:not([hidden])"); });
    $$(".clx-jump .clx-chip").forEach(b => { const s = $(`#sd-${b.dataset.jumpSeder}`); $(".clx-cn", b).textContent = s ? s.querySelectorAll("[data-q]:not([hidden])").length : 0; }); // U5: chip counts follow the search
    $("#clEmpty").hidden = shown > 0;
  };
  const back = history.state && history.state.gcClassics; // D1: Back from a Classic's Learn, steps or continues link brings back the search, the open Seders and the scroll
  if (back) $("#clSearch").value = back.q || "";
  draw(view);
  if (back) $$(".clx-seder", list).forEach(s => { s.open = (back.open || []).includes(s.dataset.seder); });
  if (focusId) {
    const f = document.getElementById("cl-" + focusId);
    if (f) { const sd = f.closest(".clx-seder"); if (sd) sd.open = true; f.classList.add("arrive"); if (back) scrollTo(0, back.y); const r = f.getBoundingClientRect(); if (!back || r.bottom < 0 || r.top > innerHeight) f.scrollIntoView({ block: "start" }); }
  }
  list.addEventListener("click", e => { const a = e.target.closest(".cl-go a, .cl-ctx a"), row = a && a.closest('[id^="cl-"]'); if (row) history.replaceState({ gcClassics: { q: $("#clSearch").value, open: $$(".clx-seder[open]", list).map(s => s.dataset.seder), y: scrollY } }, "", "#/classics/" + row.id.slice(3)); });
  $("#clSearch").addEventListener("input", filter);
  $(".clx-kinds").addEventListener("click", e => { const b = e.target.closest("[data-kind]"); if (!b) return; kind = b.dataset.kind; try { localStorage.setItem(CL_KIND, kind); } catch {}
    $$(".clx-kind").forEach(x => x.setAttribute("aria-pressed", x === b));
    if (kind === "all" && !($("#clSearch").value || "").trim()) $$(".clx-seder", list).forEach(sd => { sd.open = false; }); // back to All: the Seders fold up again
    filter(); });
  $(".clx-jump").addEventListener("click", e => {
    const b = e.target.closest("[data-jump-seder]"); if (!b) return;
    const s = $(`#sd-${b.dataset.jumpSeder}`); if (!s) return;
    if (s.hidden) { $("#clSearch").value = ""; filter(); } // home3c: a chip always lands on its Seder, even mid-search
    s.open = true; $$(".clx-jump .clx-chip").forEach(c => c.classList.toggle("on", c === b));
    const top = ($("#topbar") || {}).offsetHeight || 0, bar = $(".clx-jump").offsetHeight || 0;
    scrollTo({ top: scrollY + s.getBoundingClientRect().top - top - bar - 8, behavior: "smooth" });
  });
  $(".cl-seg").addEventListener("click", e => { const b = e.target.closest("[data-clv]"); if (!b) return; const v = b.dataset.clv; try { localStorage.setItem(CL_VIEW, v); } catch {} $$(".cl-seg [data-clv]").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(v); });
}
// in Sugya Flow, a Classic's start and end steps are marked inside the amud (and the middle amudim of a longer one say so)
function markClassics(c, a){
  if (!a || c.tab !== "steps") return;
  clData("classics").then(C => {
    if (!C || current !== c) return;
    for (const it of C.items) {
      const s = clAt(it.start), e = clAt(it.end), back = it.partOf || it.id, name = `<a href="#/classics/${esc(back)}">${esc(clName(it))}</a>`;
      const mark = (n, where, html) => { const el = document.getElementById("s" + n); const sb = el && $(".sbody", el); if (sb && !el.querySelector(`.classic-mark[data-cl="${it.id}"][data-w="${where}"]`)) sb.insertAdjacentHTML(where === "end" ? "beforeend" : "afterbegin", `<div class="classic-mark ${where}" data-cl="${esc(it.id)}" data-w="${where}" role="note">${html}</div>`); }; // v4: the note sits inside its own step, so it shows with that step only
      if (s.m !== c.m) continue;
      if (s.i === c.i) mark(it.start.step, "start", `The classic sugya ${name} begins with this step. It runs to ${it.end.daf}, step ${it.end.step}.`);
      if (e.i === c.i) mark(it.end.step, "end", `The classic sugya ${name} ends with this step. <a href="#/classics">More classics</a>`);
      if (s.i < c.i && c.i < e.i && a.steps && a.steps.length) mark(1, "start", `This whole amud is part of the classic sugya ${name}, which runs to ${it.end.daf}, step ${it.end.step}.`);
      if (it.context && refId(it.context.m, dafIdx(it.context.m, it.context.daf)) === c.id) mark(it.context.from, "ctx", `Steps ${it.context.from}–${it.context.to} set the scene for the classic sugya ${name}.`);
    }
  });
}
// ---- end Classics ----

// ---- home3: three ways in (Oct 16 2026: three ways in: Sugya Flow, Ameilus and the classics) ----
// Sugya Flow and Ameilus open the daf picker with that way chosen; Classics opens the library of famous sugyos.
const H3_ART = {
  shiur: `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="a-ln" d="M19 17v12.5a5 5 0 0 0 5 5h3.5M27 34.5V47"/><circle cx="19" cy="17" r="5.5" fill="var(--mimra)"/><circle cx="27" cy="34.5" r="5.5" fill="var(--kashya)"/><circle cx="27" cy="49" r="5.5" fill="var(--terutz)"/><rect class="a-tx" x="29" y="14.5" width="22" height="5" rx="2.5"/><rect class="a-tx" x="37" y="32" width="17" height="5" rx="2.5"/><rect class="a-tx" x="37" y="46.5" width="13" height="5" rx="2.5"/></svg>`,
  ameilus: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect class="a-tx" x="10" y="15" width="34" height="5" rx="2.5"/><rect class="a-tx" x="10" y="26" width="26" height="5" rx="2.5"/><rect class="a-hl" x="10" y="37" width="20" height="6" rx="3"/><path class="a-ul" d="M10 48.5c6-2.6 12 2.6 18 0"/><g transform="rotate(42 44 36)"><rect x="39" y="12" width="10" height="34" rx="3" fill="var(--terutz)"/><rect x="39" y="12" width="10" height="7" rx="3" class="a-cap"/><path d="M39 46l5 9 5-9z" class="a-tip"/></g></svg>`,
  classics: `<svg viewBox="0 0 64 64" aria-hidden="true"><path class="a-pg" d="M32 19c-6-4.2-13.5-5.2-21-4v32c7.5-1.2 15 0 21 4z"/><path class="a-pg" d="M32 19c6-4.2 13.5-5.2 21-4v32c-7.5-1.2-15 0-21 4z"/><path class="a-ln" d="M32 19v32"/><rect class="a-tx" x="15" y="23" width="12" height="3.2" rx="1.6"/><rect class="a-tx" x="15" y="30" width="10" height="3.2" rx="1.6"/><rect class="a-tx" x="37" y="23" width="12" height="3.2" rx="1.6"/><rect class="a-tx" x="39" y="30" width="10" height="3.2" rx="1.6"/><path d="M42 13h7v17l-3.5-3-3.5 3z" fill="var(--sheelah)"/></svg>`
};
function homeChoicesHtml(last){
  const card = (k, h, p, go, attrs) => `<${k === "classics" ? "a" : "button type=\"button\""} class="h3-card h3-${k}" ${attrs}>
      <span class="h3-art">${H3_ART[k]}</span>
      <span class="h3-tx"><b class="h3-h">${h}</b><span class="h3-p">${p}</span><span class="h3-gotx">${go}</span></span>
      <span class="h3-chev" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span>
      ${last === k ? `<span class="h3-last">Last used</span>` : ""}</${k === "classics" ? "a" : "button"}>`;
  return `<div class="h3-grid">${card("shiur", "Sugya Flow", "Learn any daf step by step", "Choose a daf", `data-home-pick="shiur" aria-haspopup="dialog"`)}${card("ameilus", "Ameilus", "Try each step yourself first", "Choose a daf", `data-home-pick="ameilus" aria-haspopup="dialog"`)}${card("classics", "Classics", "Famous sugyos to start with", "Browse by Seder", `href="#/classics"`)}</div>`;
}
// My words (Oct 25 2026): the saved-words list and flashcards are their own screen
// (#/words, #/words/cards; mywords.js). Ameilus still saves into the same list ("gc-am3-mywords"); Settings › Ameilus links here instead of listing them.
let mwModP = null;
const mwModule = () => mwModP || (mwModP = import("./mywords.js?v=1").catch(e => { mwModP = null; throw e; }));
function mwCount(){ try { const a = JSON.parse(localStorage.getItem("gc-am3-mywords") || "[]"); return Array.isArray(a) ? a.length : 0; } catch { return 0; } }
function renderWords(sub){
  current = null; document.title = (sub === "cards" ? "Flashcards · " : "") + "My words · Gemara Clarity"; setChrome(false);
  if (!$("#view").querySelector(".mw")) $("#view").innerHTML = `<div class="mw"><div class="hero hero-h3 mw-hero"><h1>My words</h1><p>…</p></div></div>`;
  scrollTo(0, 0);
  return mwModule().then(mod => { if (!/^#\/?words/i.test(location.hash)) return; mod.renderMyWords($("#view"), { esc, parseId, masInfo, hashFor, label }, sub); },
    () => { $("#view").innerHTML = `<div class="notice"><b>My words can’t open right now.</b><p>${navigator.onLine ? "Please try again." : "You’re offline. It opens once the app has been online once since this update."}</p><a class="btn" href="#/words">Try again</a></div>`; });
}

/* ---------- Ways to learn (option B, chosen by David Oct 30 2026) ----------
   The home section under today's amud. Built from today's real amud (waysFill runs once the amud has painted) and data/classics.json. */
const WY_OPT = "b";
const WY_CL = ["taa23a-honi", "bm59b-achnai", "shab31a-hillel", "ber61b-akiva", "git55b-kamtza"];
let wyDay = null; // { m, i, a } once today's amud is in
const wyPlain = t => String(t || "").replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, "").trim();
const wyShort = (t, n) => { const w = String(t || "").split(/\s+/); return w.length > n ? w.slice(0, n).join(" ") + "…" : w.join(" "); };
function wyPick(a, from){ // a step whose phrase is short enough to show whole, with its English
  let best = null;
  ((a && a.steps) || []).forEach((st, k) => { if (k < (from || 0) || k > 12) return; const ph = (st.phrases || []).find(p => p.aramaic && p.english); if (!ph) return;
    const n = ph.aramaic.split(/\s+/).length; if (n < 3 || n > 14) return; const sc = Math.abs(n - 6); if (!best || sc < best.sc) best = { st, ph, k, n, sc }; });
  return best;
}
const wyKind = st => TYPES[st.hebrewStepName] || TYPES["מימרא"];
const wyTicks = (steps, cur) => steps.map((s, k) => `<span class="tk t-${wyKind(s).k}${k + 1 === cur ? " cur" : ""}"></span>`).join("");
const wyLegend = () => `<div class="legend">${Object.entries(TYPES).map(([he, t]) => `<div class="lg t-${t.k}"><span class="swatch"></span><div><b><span class="en-he" lang="he">${stepHe(he)}</span> ${t.en}</b><div class="d">${t.d}</div></div></div>`).join("")}<div class="lg t-mishnah"><span class="swatch"></span><div><b><span class="en-he" lang="he">${px(MISHNAH.he)}</span> ${MISHNAH.en}</b><div class="d">${MISHNAH.d}</div></div></div></div>`;
const wySearchSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;
function wyClassics(){ // the featured classics, in WY_CL order, with their Sugya Flow links
  return clData("classics").then(C => { const items = (C && C.items) || []; const by = Object.fromEntries(items.map(x => [x.id, x]));
    return { all: items.filter(x => !x.partOf), pick: WY_CL.map(id => by[id]).filter(Boolean).map(it => { const s = clAt(it.start); return { it, href: hashFor(s.m, s.i, "/s" + it.start.step), he: heLabel(s.m, s.i), en: label(s.m, s.i) }; }) }; });
}
function wyOpened(all){ // how many classics start on an amud this device has opened
  const seen = new Set(history_().map(x => x.id));
  return all.filter(it => { const s = clAt(it.start); return s.i != null && seen.has(refId(s.m, s.i)); }).length;
}

const wyRaw = t => wyPlain(t).replace(/[.,:;?!–—"“”„‘’׳״()\[\]]/g, "").replace(/\s+/g, " ").trim();
function wyMarkHtml(a, cls){ // Ameilus in miniature: the raw text across a passage boundary; the learner taps where the passage ends
  const s = (a && a.steps) || [];
  for (let k = 0; k + 1 < Math.min(s.length, 14); k++) {
    const A = wyRaw(((s[k].phrases || []).slice(-1)[0] || {}).aramaic).split(" ").filter(Boolean), B = wyRaw(((s[k + 1].phrases || [])[0] || {}).aramaic).split(" ").filter(Boolean);
    if (A.length < 3 || B.length < 2) continue;
    const left = A.slice(-5), right = B.slice(0, 4), end = left.length - 1;
    return `<p class="${cls}-raw" lang="he" dir="rtl">${[...left, ...right].map((w, j) => `<button type="button" class="wy-w" data-ok="${j === end ? 1 : 0}">${esc(w)}</button>`).join(" ")}</p>`;
  }
  return "";
}
function wyMarkBind(root, msg){
  if (!root) return;
  root.addEventListener("click", e => { const b = e.target.closest(".wy-w"); if (!b) return;
    $$(".wy-w", root).forEach(x => x.classList.remove("ok", "no"));
    const ok = b.dataset.ok === "1"; b.classList.add(ok ? "ok" : "no");
    const m = $(msg, root); if (m) m.innerHTML = ok ? `<span class="wy-okm">✓</span> Right: the passage ends here.` : `Not there yet. Keep reading.`; });
}

const WB_MODES = [["shiur", "מהלך הסוגיא", "Sugya Flow"], ["ameilus", "עמלות", "Ameilus"], ["classics", "סוגיות יסוד", "Classics"]];
function waysHtml(){
  const sel = modePref() === "ameilus" ? "ameilus" : "shiur";
  const tab = ([k, he, en]) => `<button type="button" role="tab" class="wB-tab" id="wbt-${k}" data-wb="${k}" aria-controls="wbp-${k}" aria-selected="${k === sel}"><span lang="he">${he}</span><small>${en}</small></button>`;
  return `<section class="h5-sec wy wB" aria-labelledby="wyH">
    <h2 class="wy-h" id="wyH"><span lang="he">דרכי לימוד</span> <span class="en">Ways to learn</span></h2>
    <div class="wB-box">
      <div class="wB-tabs" role="tablist" aria-label="Ways to learn">${WB_MODES.map(tab).join("")}</div>
      <div class="wB-stage">
        <div class="wB-p" role="tabpanel" id="wbp-shiur" aria-labelledby="wbt-shiur"${sel === "shiur" ? "" : " hidden"}>
          <a class="wB-art wB-deck" id="wbDeck" href="#" aria-label="Today’s daf in Sugya Flow"><span class="wB-slip s3"></span><span class="wB-slip s2"></span><span class="wB-slip s1"><span class="wB-wait">Today’s daf is opening…</span></span></a>
          <p class="wB-line">The whole sugya laid out step by step: who asks, who answers, and why each step is there.</p>
          <p class="wB-act"><a class="wB-btn" id="wbFlowGo" href="#">Learn today’s daf</a><button type="button" class="wB-alt" data-home-pick="shiur" aria-haspopup="dialog">Choose a daf</button></p>
        </div>
        <div class="wB-p" role="tabpanel" id="wbp-ameilus" aria-labelledby="wbt-ameilus"${sel === "ameilus" ? "" : " hidden"}>
          <div class="wB-art wB-sheet" id="wbSheet"><span class="wB-wait">Today’s daf is opening…</span></div>
          <p class="wB-line">The raw amud, no vowels, no punctuation. You work out where each passage ends, and the hints are there when you want them.</p>
          <p class="wB-act"><a class="wB-btn" id="wbAmGo" href="#">Try today’s daf</a><button type="button" class="wB-alt" data-home-pick="ameilus" aria-haspopup="dialog">Choose a daf</button></p>
        </div>
        <div class="wB-p" role="tabpanel" id="wbp-classics" aria-labelledby="wbt-classics" hidden>
          <div class="wB-art wB-shelf" id="wbShelf"><span class="wB-wait">&nbsp;</span></div>
          <p class="wB-line" id="wbClLine">The famous sugyos, each with a clear start and end. Tap a volume to begin.</p>
          <p class="wB-act"><a class="wB-btn" href="#/classics">All classics</a></p>
        </div>
      </div>
    </div>
    <button class="wB-search" id="homeSearch" type="button">${wySearchSvg}<span class="t">Go to any daf</span><span class="eg">e.g. Bechoros 42a</span></button>
  </section>`;
}
function keyHtml(){
  return `<details class="legend-wrap wy-key wB-key"><summary><span class="wy-key-t"><span lang="he">סימני העיפרון</span> What the colours mean</span><span class="wB-case" aria-hidden="true">${Object.values(TYPES).map(t => `<i class="t-${t.k}"></i>`).join("")}</span></summary>${wyLegend()}</details>`;
}
function waysFill(m, i, a){
  wyDay = { m, i, a };
  const deck = $("#wbDeck"), sheet = $("#wbSheet"); if (!deck || !sheet) return;
  $("#wbFlowGo").href = hashFor(m, i, "/steps"); $("#wbFlowGo").textContent = `Learn ${label(m, i)}`;
  $("#wbAmGo").href = hashFor(m, i, "/ameilus"); $("#wbAmGo").textContent = `Try ${label(m, i)} yourself`;
  if (!a || !a.steps || !a.steps.length) return;
  deck.href = hashFor(m, i, "/s1");
  const slip = (st, n) => { const t = wyKind(st), ph = (st.phrases || [])[0] || {};
    return `<span class="wB-k t-${t.k}"><span lang="he">${stepHe(st.hebrewStepName)}</span> ${t.en}<span class="n">${n} of ${a.steps.length}</span></span>
      <span class="wB-ar t-${t.k}" lang="he" dir="rtl">${esc(wyShort(ph.aramaic, 9))}</span><span class="wB-tr">${px(wyShort(st.simpleTranslation || ph.english || st.title, 24), a)}</span>`; };
  const s = a.steps;
  deck.innerHTML = `<span class="wB-slip s3"></span><span class="wB-slip s2"></span>
    <span class="wB-slip s1">${slip(s[0], 1)}</span><span class="wB-ticks">${wyTicks(s, 1)}</span>`;
  // Ameilus: the raw text on a worksheet; the learner marks where the passage ends
  const mk = wyMarkHtml(a, "wB");
  if (!mk) return;
  sheet.innerHTML = `${mk}<p class="wB-yours"><span class="lbl" id="wbMsg">Where does the passage end? Tap the word.</span><span class="ln"></span><svg class="wB-pencil" viewBox="0 0 64 12" aria-hidden="true"><path d="M2 3h44l14 3-14 3H2z" fill="var(--gold)"/><path d="M46 3l14 3-14 3z" fill="#e3c69c"/><path d="M56 5.1L60 6l-4 .9z" fill="var(--ink)"/><path d="M2 3h6v6H2z" fill="var(--binding)"/></svg></p>`;
  wyMarkBind(sheet, "#wbMsg");
}
function waysBind(){
  $$(".wB-tab").forEach(b => b.onclick = () => { $$(".wB-tab").forEach(x => x.setAttribute("aria-selected", x === b)); $$(".wB-p").forEach(p => p.hidden = p.id !== "wbp-" + b.dataset.wb); });
  $(".wB-tabs") && $(".wB-tabs").addEventListener("keydown", e => { if (!/Arrow(Left|Right)/.test(e.key)) return; const t = $$(".wB-tab"), k = t.indexOf(document.activeElement); if (k < 0) return; const n = t[(k + (e.key === "ArrowRight" ? 1 : t.length - 1)) % t.length]; n.focus(); n.click(); });
  wyClassics().then(({ all, pick }) => { const sh = $("#wbShelf"); if (!sh || !pick.length) return;
    const hs = [148, 132, 156, 140, 126];
    sh.innerHTML = `<span class="wB-books">${pick.map((c, k) => `<a class="wB-book" href="${c.href}" style="--h:${hs[k % hs.length]}px" title="${esc(clName(c.it))}"><span class="sp" lang="he">${esc(masInfo(c.it.start.m)[1])}</span><span class="nm">${esc(clName(c.it))}</span></a>`).join("")}</span><span class="wB-plank"></span>`;
    const line = $("#wbClLine"); if (line) line.innerHTML = `${all.length} classic sugyos, each with a clear start and end. Start with ${pick.slice(0, 3).map(c => `<a href="${c.href}">${esc(clName(c.it))}</a>`).join(", ")}.`;
  }).catch(() => {});
}

function renderHome(){
  current = null; document.title = "Gemara Clarity: every sugya, step by step";
  setChrome(false);
  const h = history_(), bm = bookmarks(), mwN = mwCount();
  const last = h[0] && parseId(h[0].id);
  const hasLast = !!(last && masInfo(last.m));
  let pos = null; try { pos = JSON.parse(localStorage.getItem("gc5-pos") || "null"); } catch {}
  // v5 (Oct 29 2026, design bible): home opens on today's amud itself, the real text marked in the step colours, with one Start / Continue
  const row = (k, he, en, p, attrs) => `<li><${k === "classics" ? "a" : "button type=\"button\""} class="h4-way h3-${k}" ${attrs}><span class="rw-he" lang="he">${he}</span><b>${en}</b><span class="rw-d">${p}</span></${k === "classics" ? "a" : "button"}></li>`;
  const links = (he, en, items) => `<section class="h5-sec"><h2 class="section-h"><span lang="he">${he}</span> ${en}</h2><p class="h4-links">${items}</p></section>`;
  const amudLink = id => { const p = parseId(id); return masInfo(p.m) ? `<a href="${hashFor(p.m, p.i)}"><span class="he" lang="he">${heLabel(p.m, p.i)}</span> ${label(p.m, p.i)}</a>` : ""; };
  $("#view").innerHTML = `<div class="homewrap h5">
    ${hasLast ? "" : `<header class="h5-hero"><h1>Every sugya in Shas, step by step</h1><p>The Aramaic beside English, phrase by phrase, with each question, answer and proof marked, so you can follow the argument. Free, no ads, works offline.</p></header>`}
    <section class="amud" id="homeAmud" aria-busy="true">
      <p class="amud-k" id="yomiTile"><span lang="he">דף היומי</span> <span id="yomiV">Today’s daf</span><span id="yomiS" class="s"></span></p>
      <div class="amud-page" id="amudPage"><div class="amud-wait">&nbsp;</div></div>
    </section>
    ${hasLast ? (() => { const n = pos && pos.id === h[0].id && pos.n > 1 ? pos.n : 0; return `<p class="h5-cont" id="homeCont" data-id="${h[0].id}"><a class="h4-line" href="${hashFor(last.m, last.i, n ? "/s" + n : "")}"><span class="k">Continue</span> <span class="v"><span class="s he" lang="he">${heLabel(last.m, last.i)}</span> ${label(last.m, last.i)}${n ? `, step ${n}` : ""}</span></a></p>`; })() : ""}
    ${waysHtml()}
    ${mwN ? links("המילים שלי", "My words", `<a href="#/words">${mwN} saved words</a>, <a href="#/words/cards">flashcards</a>`) : ""}
    ${bm.length ? links("סימניות", "Bookmarks", bm.map(amudLink).filter(Boolean).join("")) : ""}
    ${h.length > 1 ? links("נלמד לאחרונה", "Recently learned", h.slice(0, 8).map(x => amudLink(x.id)).filter(Boolean).join("")) : ""}
    ${keyHtml()}</div>`;
  $("#homeSearch").onclick = () => openPicker();
  $$("[data-home-pick]").forEach(b => b.onclick = () => openPicker(undefined, undefined, b.dataset.homePick));
  try { waysBind(); } catch (e) { console.warn("ways", e); }
  // the amud on the first screen: today's Daf Yomi; if that can't be reached (offline, Mishnah-only day), the amud last learned, else Berakhot 2a
  const plain = t => String(t || "").replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, "").replace(/[?!,;:.]+(?=\s|$)/g, m0 => m0 === "." || m0 === ":" ? m0 : "").trim();
  const paint = async (m, i, kind) => {
    const page = $("#amudPage"), box = $("#homeAmud"); if (!page) return;
    const id = refId(m, i);
    const k = $("#yomiTile");
    if (k) k.innerHTML = kind === "yomi" ? `<span lang="he">דף היומי</span> Today’s daf` : kind === "last" ? `<span lang="he">המשך</span> Where you left off` : `<span lang="he">תחילת הש״ס</span> Where Shas begins`;
    let a = null; try { await staticReady; if (!staticIds.size || staticIds.has(id)) a = await loadCloudAnalysis(id); } catch {}
    if (!$("#amudPage")) return;
    box.removeAttribute("aria-busy");
    const hc = $("#homeCont"); if (hc && hc.dataset.id === id) hc.hidden = true; // the amud above is the one to continue: its own button says so
    const at = pos && pos.id === id && a && pos.n > 1 && pos.n <= a.steps.length ? pos.n : 0;
    const go = n => hashFor(m, i, n ? "/s" + n : "/steps");
    let words = 0, first = true, body = "";
    if (a) for (let s = 0; s < a.steps.length && words < 46; s++) {
      const st = a.steps[s], t = TYPES[st.hebrewStepName] || TYPES["מימרא"];
      let txt = plain((st.phrases || []).map(p => p.aramaic).join(" ")); if (!txt) continue;
      let ws = txt.split(/\s+/); const room = 46 - words; const cut = ws.length > room + 6; if (cut) ws = ws.slice(0, room);
      words += ws.length;
      let open = "";
      if (first) { open = `<span class="ow">${esc(ws.shift())}</span> `; first = false; }
      body += `${open}<a class="mk t-${t.k}" href="${go(s + 1)}" title="Step ${s + 1}: ${t.en}">${esc(ws.join(" "))}${cut ? "…" : ""}</a> `;
      if (cut) break;
    }
    page.innerHTML = `
      <div class="amud-rh" lang="he" dir="rtl"><span>${masInfo(m)[1]}</span><span>${heShort(i)}</span></div>
      ${a ? `<p class="amud-text" lang="he" dir="rtl">${body}</p>
      <nav class="ticks" aria-label="Steps of this sugya">${ticksHtml(a.steps, at || 0, go)}</nav>` : ""}
      <p class="amud-meta"><span class="he" lang="he">${heLabel(m, i)}</span> <span class="en">${label(m, i)}${a ? `, ${a.steps.length} steps` : ""}</span></p>
      ${a && a.mainTopic ? `<p class="amud-topic">${px(a.mainTopic, a)}</p>` : ""}
      <p class="amud-go"><a class="btn-primary" href="${a ? go(at) : hashFor(m, i)}">${at ? `Continue at step ${at}` : a ? "Start" : "Open the daf"}</a></p>`;
    try { waysFill(m, i, a, at); } catch (e) { console.warn("ways", e); }
  };
  const fallback = () => hasLast ? paint(last.m, last.i, "last") : paint("Berakhot", masInfo("Berakhot")[2], "start");
  dafYomi().then(y => { if (y && y.m) paint(y.m, y.i, "yomi"); else fallback(); }).catch(fallback);
}

/* ---------- daf view ---------- */
function setChrome(onDaf){
  $("#bottombar").hidden = !onDaf; document.body.classList.remove("choosing");
  $(".layout").classList.toggle("with-side", !!(onDaf && current && current.analysis && current.tab === "steps"));
  $("#refBtnText").textContent = current ? label(current.m, current.i) : "Choose a daf";
  if (!onDaf) { $("#sidebar").innerHTML = ""; $("#progressFill").style.width = "0"; }
  setModeSwitch(onDaf && current ? "shiur" : null);
  syncPaged();
}
/* v2 (Oct 29 2026, test): paged "book" reading at desktop width — one step open as a two-page spread, the others a numbered ribbon, a pill pager at the foot */
function paged(){ return document.body.classList.contains("onestep"); }
function syncPaged(){ // v4: one step at a time on every width (David, Oct 29: "one step at a time on the screen")
  const on = !!(current && current.analysis && current.tab === "steps" && !current.am && !current.choose && document.querySelector("#dafBody .steps .step"));
  document.body.classList.toggle("onestep", on);
  if (on && !$(".step.cur") && $("#s1")) markCurrent(1);
  else if (on) { const c = $(".step.cur"); c && updPager(+c.dataset.n, current.analysis.steps.length); }
}
/* v5: the sugya's shape as a row of pencil ticks, one per step in its kind colour; the current one is taller. Each tick goes to its step. */
function ticksHtml(steps, n, href){
  return steps.map((s, k) => { const t = TYPES[s.hebrewStepName] || TYPES["מימרא"];
    return href ? `<a class="tk t-${t.k}${k + 1 === n ? " cur" : ""}" href="${href(k + 1)}" aria-label="Step ${k + 1}: ${t.en}"></a>`
      : `<button class="tk t-${t.k}${k + 1 === n ? " cur" : ""}" data-jump="${k + 1}" aria-label="Step ${k + 1}: ${t.en}"${k + 1 === n ? ' aria-current="step"' : ""}></button>`; }).join("");
}
function ticksSync(n, total){
  const body = $("#dafBody"); if (!body || !current || !current.analysis) return;
  let row = $("#ticks");
  if (!row) { row = document.createElement("nav"); row.id = "ticks"; row.className = "ticks"; row.setAttribute("aria-label", "Steps of this sugya"); body.prepend(row); }
  if (row.children.length !== total) row.innerHTML = ticksHtml(current.analysis.steps, n);
  else [...row.children].forEach((b, k) => { b.classList.toggle("cur", k + 1 === n); b.setAttribute("aria-current", k + 1 === n ? "step" : "false"); });
}
function updPager(n, total){ // v4: the thin bottom bar: "5 of 24 · Kind" over a progress line; tapping it opens the step list
  const w = $("#stepCounter"); if (!w || !current || !current.analysis) return;
  const el = document.getElementById("s" + n), tn = el && $(".tname", el), k = (el && (el.className.match(/\bt-(\w+)/) || [])[1]) || "mimra";
  const kn = tn && $(".ten", tn), kind = kn ? kn.textContent.trim() : "";
  w.innerHTML = `<span class="sc-n">${n}</span> of ${total}${kind ? ` <span class="sc-k t-${k}">${kind}</span>` : ""}`;
  ticksSync(n, total);
  const bp = $("#bbPrev"), bn = $("#bbNext"); // v6: back and Next in the bottom bar move one step; Next names the kind of step it goes to
  if (bp) bp.disabled = n <= 1;
  if (bn) { const nx = document.getElementById("s" + (n + 1)), nk = nx && $(".tname .ten", nx); bn.hidden = n >= total; $("#bbNextT").textContent = nk ? `Next: ${nk.textContent.trim()}` : "Next"; bn.setAttribute("aria-label", `Go on to step ${n + 1}${nk ? `, ${nk.textContent.trim()}` : ""}`); }
  try { localStorage.setItem("gc5-pos", JSON.stringify({ id: current.id, n })); } catch {}
  const f = $("#stepFill"); if (f) f.style.width = (total ? n / total * 100 : 0) + "%";
  document.body.classList.toggle("at-last", n >= total);
}
function updateNav(){
  if (!current) return;
  const p = neighbor(current.m, current.i, -1), n = neighbor(current.m, current.i, 1);
  const short = x => x ? (x.m === current.m ? `${dafOf(x.i).daf}${dafOf(x.i).amud}` : masName(x.m)) : "";
  $("#prevBtn").disabled = !p; $("#nextBtn").disabled = !n;
  $("#prevLabel").textContent = short(p); $("#nextLabel").textContent = short(n);
  $("#prevBtn").onclick = () => p && go(p.m, p.i); $("#nextBtn").onclick = () => n && go(n.m, n.i);
  const hasSteps = !!current.analysis;
  $("#flowBtn").hidden = !hasSteps || current.tab !== "steps";
  $("#stepCounter").textContent = hasSteps ? `${current.analysis.steps.length} steps` : "";
}
function flowHtml(steps){
  let depth = 0, phase = null, out = "";
  steps.forEach((s, k) => {
    const t = TYPES[s.hebrewStepName] || TYPES["מימרא"];
    if (s.macroPhase && s.macroPhase !== phase) { phase = s.macroPhase; out += `<div class="phase">${esc(PHASES[phase] || phase)}</div>`; }
    if (k > 0 && (s.branchRole === "opens_new_branch" || s.branchRole === "alternative_approach")) depth = Math.min(depth + 1, 3);
    if (s.branchRole === "returns_to_previous_branch") depth = Math.max(depth - 1, 0);
    const story = marksOf(s).includes("story"); // markers (v99u): a run of consecutive story steps sits in one band, derived here (nothing stored)
    if (story && !marksOf(steps[k - 1]).includes("story")) out += `<div class="fband" role="group" aria-label="Story"><span class="stag stag-story fband-cap" aria-hidden="true">Story</span>`;
    out += `<a class="fnode t-${t.k}${isMish(k) ? " is-mishnah" : ""}" href="#s${k+1}" data-jump="${k+1}" style="--d:${depth}"><span class="dot">${k+1}</span><span class="ft"><span class="fty">${t.en} <span class="he" lang="he">${stepHe(s.hebrewStepName || "")}</span>${stagHtml(s, true)}${isMish(k) ? MBADGE : ""}</span>${px(s.title || s.stepSummary || "")}</span></a>`;
    if (story && !marksOf(steps[k + 1]).includes("story")) out += `</div>`;
    if (s.branchRole === "conclusion_of_branch") depth = Math.max(depth - 1, 0);
  });
  return `<nav class="flow" aria-label="Steps of the sugya"><h2>Steps</h2>${out}</nav>`;
}
// ---- Related earlier steps (display only; Oct 15 2026) ----
// Each step may carry dependsOnStepNumbers. An outside spot-check (Ber 2a, Pes 2a, BM 2a) found the links mostly sound but mixed
// (replies, evidence, context, parallels, branches), so the label is neutral. Fixes from that check apply at display time; data/b is untouched.
// A fix only applies when the step still has the type it had when checked (a different copy of the amud is left alone).
const STEP_LINK_FIXES = {
  Berakhot_2_a: { 9: { type: "שאלה", add: [1] }, 10: { type: "קשיא", add: [1], drop: [9] } },
  Pesachim_2_a: { 13: { type: "קשיא", set: [6, 7] } }
};
function relatedSteps(id, s, n, total){                                // -> sorted earlier step numbers to show for step n (1-based)
  let list = Array.isArray(s && s.dependsOnStepNumbers) ? s.dependsOnStepNumbers.slice() : [];
  const fx = STEP_LINK_FIXES[id] && STEP_LINK_FIXES[id][n];
  if (fx && (!fx.type || fx.type === s.hebrewStepName)) {
    if (fx.set) list = fx.set.slice();
    if (fx.drop) list = list.filter(x => !fx.drop.includes(+x));
    if (fx.add) list = list.concat(fx.add);
  }
  const out = [];
  for (const x of list) { const v = typeof x === "string" && /^\d+$/.test(x.trim()) ? +x : x; if (Number.isInteger(v) && v >= 1 && v < n && v <= total && !out.includes(v)) out.push(v); }
  return out.sort((p, q) => p - q);
}
function relatedLineHtml(nums, n){                                     // n = this step's number; a line that only points to step n-1 is hidden (Oct 14 2026)
  if (n && nums.length === 1 && nums[0] === n - 1) return "";
  return nums.length ? `<p class="srel">Related earlier steps: ${nums.map(v => `<a href="#s${v}" data-jump="${v}" data-rel="1" aria-label="Go to step ${v}">${v}</a>`).join('<span class="srel-sep">, </span>')}</p>` : "";
}
// ---- end related steps ----
function moreHtml(items, open){ // calm: one fold for the deeper layers; its label names what is inside
  if (!items.length) return "";
  return `<details class="more${items.length === 1 && items[0][0] === "Logic" ? " only-logic" : ""}"${open ? " open" : ""}><summary><span class="more-k">More detail</span><span class="more-l">${items.map((x, i) => `<span class="ml${x[0] === "Logic" ? " ml-logic" : ""}">${i ? " · " : ""}${x[0]}</span>`).join("")}</span></summary><div class="more-b">${items.map(x => x[1]).join("")}</div></details>`;
}
function stepHtml(s, k, open){
  const t = TYPES[s.hebrewStepName] || TYPES["מימרא"];
  const P = (h, v, cls="") => v ? `<section class="${cls}"><h4>${h}</h4><p>${px(v)}</p></section>` : "";
  const logicRows = [["Trigger words", s.triggerLanguage], ["Relation to before", s.relationToPreviousStep], 
    ["Challenge targets", s.kashyaTarget], ["How it attacks", s.kashyaAttackLogic], ["Kind of answer", s.terutzResolutionType], ["We might have thought", s.terutzHavaAmina], ["Now we know", s.terutzMaskana],
    ["Information sought", s.sheelahInformationSought], ["Answer given", s.teshuvahAnswerProvided], ["Proving", s.raayaObject], ["Source of proof", s.raayaSupportSource],
    ["What is rejected", s.dechiyaRejectionScope], ["The flaw", s.dechiyaFlawIdentified], ["Core ruling", s.mimraCoreRuling], [marksOf(s).includes("unresolved") ? "Where it is left" : "Final takeaway", s.maskanaFinalTakeaway],
    ["Classification", s.classificationConfidence ? `${s.classificationConfidence} confidence` : ""]].filter(r => r[1]);
  // calm (gc2-calm-1): the secondary layers sit behind one quiet "More detail" fold; nothing is dropped
  const more = [
    s.classificationConfidence && s.classificationConfidence !== "High" && s.alternativePossibleLabel ? ["Another reading", `<p class="maybe">Could also be read as: ${px(s.alternativePossibleLabel)}</p>`] : null,
    s.deeperAnalysis ? ["Going deeper", P("Going deeper", s.deeperAnalysis)] : null,
    // kt2 (Oct 16 2026: no Key Terms section): the Key terms section is not shown; keyTerms stay in the data for nikud borrowing (vocTextsOf)
    s.whyThisMatters ? ["Why it matters", P("Why it matters", s.whyThisMatters)] : null,
    logicRows.length ? ["Logic", `<section class="logic box"><h4>Logic</h4><dl>${logicRows.map(r => `<dt>${r[0]}</dt><dd>${px(r[1])}</dd>`).join("")}</dl></section>`] : null].filter(Boolean);
  const total = (current && current.analysis && current.analysis.steps || []).length, nextN = total && k + 2 <= total ? k + 2 : 0;
  const fwStop = { n: 0 }; // e5: the first word of this step is its one Tab stop
  return `<article class="step t-${t.k}${open ? " open" : ""}${isMish(k) ? " is-mishnah" : ""}" id="s${k+1}" data-n="${k+1}">
    <button class="sh" aria-expanded="${open}" aria-controls="x${k+1}"><span class="num">${k+1}</span><span class="tname"><span class="he" lang="he">${stepHe(s.hebrewStepName)}</span><span class="ten">${t.en}</span>${stagHtml(s)}${isMish(k) ? MBADGE : ""}</span></button>
    <div class="sbody">
      ${relatedLineHtml(relatedSteps(current && current.id, s, k + 1, (current && current.analysis && current.analysis.steps || []).length || k + 1), k + 1)}
      <h3 class="stitle">${px(s.title)}</h3>
      ${s.stepSummary ? `<p class="ssum">${px(s.stepSummary)}</p>` : ""}
      <div class="phrases">${(s.phrases||[]).map((p, pi) => `<div class="ph" data-ph="${pi}"><div class="pa he" lang="he">${heWords(p.aramaic, fwStop)}</div><div class="pe">${px(p.english)}${p.notes ? `<div class="pnote">${px(p.notes)}</div>` : ""}</div></div>`).join("")}</div>
      <div class="rt" data-rt="${k}"></div>
      <button class="explain-btn" aria-expanded="${open}" aria-controls="x${k+1}"><span class="xb-l">${open ? "Hide explanation" : "Explain"}</span>${chev}</button>
      <div class="explain" id="x${k+1}" ${open ? "" : "hidden"}>
        ${P("What’s happening", s.whatsHappening)}
        ${P("In plain words", s.simpleTranslation)}
        ${s.whatToRemember ? `<div class="box remember"><h4>Remember</h4><p>${px(s.whatToRemember)}</p></div>` : ""}
        ${s.confusionAlert ? `<div class="box alert"><h4>Careful</h4><p>${px(s.confusionAlert)}</p></div>` : ""}
        ${moreHtml(more, settings.expandAll)}
        ${current ? `<p class="report"><a href="${reportHref(current.m, current.i, k + 1)}">Report a mistake in this step</a></p>` : ""}
      </div>
      ${k > 0 || nextN ? `<div class="stepnav">${k > 0 ? `<button class="bwd" data-jump="${k}" aria-label="Back to step ${k}" title="Step ${k} (or swipe, or press ←)"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M19 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ""}${nextN ? `<button class="fwd next-cue" data-jump="${nextN}" aria-label="Go on to step ${nextN}" title="Step ${nextN} (or swipe, or press →)"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : ""}</div>` : ""}${!nextN && total && k + 1 === total ? dafEndHtml() : ""}
    </div></article>`;
}
// v4: the daf's own prev/next links appear once, at the end of the last step, as quiet text
function dafEndHtml(){
  if (!current) return "";
  const p = neighbor(current.m, current.i, -1), n = neighbor(current.m, current.i, 1);
  return `<nav class="dafend" aria-label="Other dapim"><span class="de-end">End of ${esc(label(current.m, current.i))}</span>${n ? `<a class="de-n" href="${hashFor(n.m, n.i)}">Continue to ${esc(label(n.m, n.i))} →</a>` : ""}${p ? `<a class="de-p" href="${hashFor(p.m, p.i)}">← ${esc(label(p.m, p.i))}</a>` : ""}</nav>`;
}
let dafOpening = null; // v99lb: the amud whose breakdown load has started (the boot re-open below skips it)
async function openDaf(m, i, tab, choose){
  const id = refId(m, i);
  const same = current && current.id === id && !current.am;
  current = { m, i, id, analysis: same ? current.analysis : null, source: same ? current.source : null, text: same ? current.text : null, tab: (tab && tab !== "text") ? tab : (same && current.tab !== "text" ? current.tab : null), choose: !!choose };
  document.title = `${label(m, i)} · Gemara Clarity`;
  pushHistory(id);
  setChrome(true); updateNav();
  if (!same) {
    $("#view").innerHTML = `<div class="loading"><div class="spinner"></div>Loading ${esc(label(m, i))}…</div>`;
    window.scrollTo(0, 0); dafOpening = id;
    let cloud = null, cloudErr = null;
    const gP = vocGloss ? null : Promise.all([amGloss(), vocNxLoad()]).then(([g]) => { vocGloss = g; }).catch(() => {}); // the reading glossary also vocalizes common words in the prose (precached; loads beside the breakdown)
    if ((hasBreakdown(id) || !cloudLoaded || !cloudIds.size)) { try { cloud = await loadCloudAnalysis(id); } catch (e) { cloudErr = e; } }
    if (gP) await Promise.race([gP, new Promise(r => setTimeout(r, 1500))]);
    if (!current || current.id !== id) return;
    current.analysis = cloud; current.source = cloud ? "cloud" : null; current.cloudErr = cloudErr;
    if (!current.tab || current.tab === "text") current.tab = "steps"; // v4c: the Full text tab is gone (David, Oct 29); an amud with no breakdown still shows its text below the notice
  }
  renderDaf();
  // warm the neighbours quietly
  const n = neighbor(m, i, 1); if (n) setTimeout(() => { loadText(n.m, n.i).catch(()=>{}); if (hasBreakdown(refId(n.m, n.i))) loadCloudAnalysis(refId(n.m, n.i)).catch(()=>{}); }, 1500);
}
const ovOpen = () => loadJSON(LS.overview, false) === true; // the amud overview starts folded so step 1 leads; the reader's choice is remembered
function renderChooser(){ // an amud opened with no remembered way of learning: two equal choices, nothing preselected
  const c = current, a = c.analysis;
  setChrome(true); updateNav(); document.body.classList.add("choosing"); // the amud chooser keeps prev/next only
  $(".layout").classList.remove("with-side"); $("#sidebar").innerHTML = ""; $("#progressFill").style.width = "0";
  $("#view").innerHTML = `
    <section class="card dafhead chooser" aria-labelledby="chooseH">
      <div class="runhead"><span class="rh-m he" lang="he">${masInfo(c.m)[1]}</span><div id="perekSlot">${perekLineHtml(c.m, c.i)}</div><span class="rh-d he" lang="he">${heShort(c.i)}</span></div>
      <div class="refline"><span class="he" lang="he">${heLabel(c.m, c.i)}</span><h1>${esc(label(c.m, c.i))}</h1></div>
      ${a && a.mainTopic ? `<p class="topic">${px(a.mainTopic, a)}</p>` : ""}
      <h2 class="choose-h" id="chooseH">How do you want to learn this amud?</h2>
      ${pathsHtml(mode => hashFor(c.m, c.i, "/" + mode))}
      <p class="choose-note">Your choice is remembered on this device. You can switch at any time from the top of the amud.</p>
    </section>`;
}
function renderDaf(){
  if (current && !current.am && current.tab === "text") current.tab = "steps"; // v4c: an old "Full text" choice falls back to the steps
  const c = current; if (!c) return;
  if (c.choose && c.analysis) return renderChooser();
  c.choose = false;
  const a = c.analysis, bm = bookmarks().includes(c.id);
  const counts = {}; if (a) a.steps.forEach(s => { counts[s.hebrewStepName] = (counts[s.hebrewStepName]||0) + 1; });
  setChrome(true); updateNav();
  $("#view").innerHTML = `
    <section class="card dafhead${a && ovOpen() ? " ov-open" : ""}">
      <div class="runhead"><span class="rh-m he" lang="he">${masInfo(c.m)[1]}</span><div id="perekSlot">${perekLineHtml(c.m, c.i)}</div><span class="rh-d he" lang="he">${heShort(c.i)}</span></div>
      <div class="refline"><span class="he" lang="he">${heLabel(c.m, c.i)}</span><h1>${esc(label(c.m, c.i))}</h1></div>
      ${a ? modeBarHtml(c.m, c.i, "shiur") : ""}
      ${a && a.mainTopic ? `<p class="topic">${px(a.mainTopic, a)}</p>` : ""}
      <div class="headbar">
        ${a ? `<button class="ovbtn" id="ovBtn" aria-expanded="${ovOpen()}" aria-controls="ovPanel"><span class="ovl">${ovOpen() ? "Hide overview" : "Show overview"}</span>${chev}</button>` : ""}
        <div class="headactions">
          <button class="btn ${bm ? "on" : ""}" id="bmBtn" aria-pressed="${bm}" aria-label="${bm ? "Bookmarked" : "Bookmark"}" title="${bm ? "Bookmarked" : "Bookmark"}"><svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z"/></svg><span class="hl">${bm ? "Bookmarked" : "Bookmark"}</span></button>
          <button class="btn" id="shareBtn" aria-label="Share" title="Share"><svg viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg><span class="hl">Share</span></button>
        </div>
      </div>
      ${a ? `<div class="ovpanel" id="ovPanel"${ovOpen() ? "" : " hidden"}>${a.overview ? `<p class="overview">${px(a.overview, a)}</p>` : ""}
        <div class="typecounts">${Object.entries(TYPES).filter(([he]) => counts[he]).map(([he, t]) => `<span class="typecount t-${t.k}">${counts[he]} ${t.en}${counts[he] > 1 ? "s" : ""}</span>`).join("")}${mishCountHtml()}</div></div>` : ""}
      ${a ? `<p class="note-ai">AI-generated, not reviewed by a rav, not for practical halacha: check it against the text and your teacher. <a href="${reportHref(c.m, c.i)}">Report a mistake</a></p>` : ""}
    </section>
    ${!a && !c.noText ? `<div class="notice">${c.cloudErr ? `<b>The breakdown couldn’t be loaded just now.</b>
        <p>Check your connection and try again. Meanwhile, here is the full text with translation, side by side.</p>` : `<b>Step-by-step breakdown coming soon.</b>
        <p>This amud is on its way. Meanwhile, here is the full text with translation, side by side.${cloudIds.size ? ` ${cloudIds.size} amudim are fully broken down so far.` : ""}</p>`}
        <button class="btn" id="libBtn">See broken-down dapim</button>
      </div>` : ""}
    <div id="dafBody">${c.tab === "steps" && a ? stepsBlock(a) : `<div class="loading"><div class="spinner"></div>Loading text from Sefaria…</div>`}</div>
    <div class="endnav" id="endnav"></div>`;
  // sidebar (desktop) mirrors the flow
  $("#sidebar").innerHTML = a && c.tab === "steps" ? flowHtml(a.steps) : "";
  wireDaf();
  if (c.tab === "text" || !a) renderText();
  const p = neighbor(c.m, c.i, -1), n = neighbor(c.m, c.i, 1);
  $("#endnav").innerHTML = `${p ? `<a class="de-p" href="${hashFor(p.m, p.i)}">← ${label(p.m, p.i)}</a>` : ""}${n ? `<a class="de-n" href="${hashFor(n.m, n.i)}">${label(n.m, n.i)} →</a>` : ""}`;
  markMishnah(); markClassics(c, a);
  if (pendingJump && a && pendingJump.id === c.id && c.tab === "steps") { const k = pendingJump.n; pendingJump = null; setTimeout(() => { const el = document.getElementById("s" + k); if (!el || current !== c) return; toggleStep(el, true); jumpTo(k); }, 0); }
  miAfterRender(c, a);
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
    $$(`.step[data-n="${k+1}"]:not(.is-mishnah)`).forEach(el => { el.classList.add("is-mishnah"); const tn = $(".tname", el); tn && tn.insertAdjacentHTML("beforeend", String(MBADGE)); });
    $$(`.fnode[data-jump="${k+1}"]:not(.is-mishnah)`).forEach(el => { el.classList.add("is-mishnah"); const ft = $(".fty", el); ft && ft.insertAdjacentHTML("beforeend", String(MBADGE)); });
    $$(`.strip button[data-jump="${k+1}"]`).forEach(el => el.classList.add("is-mishnah"));
  });
  const tc = $(".typecounts"); if (tc && !$(".t-mishnah", tc)) tc.insertAdjacentHTML("beforeend", mishCountHtml());
  $$(".segs .seg").forEach((el, k) => { const cl = segMishClass(k).trim(); if (cl) el.classList.add(...cl.split(" ")); });
}
const stripNowHtml = (a, n) => { const s = a.steps[n - 1]; if (!s) return ""; const t = TYPES[s.hebrewStepName] || TYPES["מימרא"]; return `Step ${n} of ${a.steps.length} · <b class="t-${t.k}">${t.en}</b>${stagHtml(s) ? ` <span class="t-${t.k}">${stagHtml(s)}</span>` : ""}`; };
const colourKeyHtml = (a) => `<details class="legend-wrap"><summary class="section-h">The eight kinds of step <small>color key</small></summary>
    <div class="legend">${Object.entries(TYPES).map(([he, t]) => `<div class="lg t-${t.k}"><span class="swatch"></span><div><b>${t.en} · <span class="en-he">${stepHe(he)}</span></b><div class="d">${t.d}</div></div></div>`).join("")}<div class="lg t-mishnah"><span class="swatch"></span><div><b>${MISHNAH.en} badge · <span class="en-he">${refHtml(vocApply(MISHNAH.he, null, vocGloss))}</span></b><div class="d">${MISHNAH.d}</div></div></div>${tagKeyRowsHtml(a)}</div></details>`; // v99o: the homepage colour key, same markup and words (the homepage builds it with current = null, so px() there is this call), for the steps view
function stepsBlock(a){ // v116 (nostrip): the numbered step strip and its "Step N of M" line are removed; steps are reached by scrolling, the bottom bar's Steps sheet and the sidebar
  return `${colourKeyHtml(a)}
    <div class="steps">${a.steps.map((s, k) => stepHtml(s, k, settings.expandAll)).join("")}</div>`;
}
async function renderText(){
  const c = current; const id = c.id;
  let html;
  try {
    const t = c.text || await loadText(c.m, c.i); if (!current || current.id !== id) return; c.text = t;
    const n = Math.max(t.he.length, t.en.length);
    if (!n) { html = `<p class="notice">Sefaria has no text for this amud.</p>`; c.noText = true; const lb = $("#libBtn"); if (lb) lb.closest(".notice").remove(); } else // D3: an empty answer from Sefaria (Nazir 33b) is not a failure: only this notice (no retry, no link) and the breakdown notice above is dropped
    html = `<div class="segs">${Array.from({ length: n }, (_, k) => `<div class="seg${segMishClass(k)}"><div class="he" lang="he">${sanitize(t.he[k]||"", true)}</div><div class="en">${sanitize(t.en[k]||"", false)}</div></div>`).join("")}</div>
      <p class="src">Text: ${esc(t.heVersion || "Sefaria")}. Translation: ${esc(t.version || "Sefaria")}. Bold words are the literal translation; the rest is explanation. From <a href="https://www.sefaria.org/${c.m}.${dafOf(c.i).daf}${dafOf(c.i).amud}" target="_blank" rel="noopener">Sefaria</a>.</p>`;
  } catch (e) {
    html = `<div class="notice"><b>Couldn’t load the text.</b><p>${navigator.onLine ? "Sefaria didn’t answer. Try again in a moment." : "You’re offline, and this amud isn’t saved on this device yet."}</p><button class="btn" id="retryText">Try again</button></div>`;
  }
  const body = $("#dafBody"); if (!body || !current || current.id !== id) return;
  if (current.tab === "text" || !current.analysis) { body.innerHTML = html; const r = $("#retryText"); if (r) r.onclick = () => { body.innerHTML = `<div class="loading"><div class="spinner"></div></div>`; renderText(); }; }
}
function wirePerek(){
  const c = current, b = $("#perekBtn"); if (!c || !b) return;
  b.onclick = () => openPicker(c.m, +b.dataset.perek);
}
function wireDaf(){
  const c = current;
  wirePerek();
  rtPaint(c); // Rashi and Tosfos buttons under each step (they appear once Sefaria answers)
  $("#bmBtn").onclick = () => { let b = bookmarks(); b = b.includes(c.id) ? b.filter(x => x !== c.id) : [c.id, ...b]; saveJSON(LS.bookmarks, b); toast(b.includes(c.id) ? "Bookmarked" : "Bookmark removed"); renderDaf(); };
  $("#shareBtn").onclick = async () => { const { daf, amud } = dafOf(c.i), sn = c.tab === "steps" && +(($(".step.cur") || {}).dataset?.n || 0), url = sn > 1 ? `https://gemaraclarity.org/${hashFor(c.m, c.i, "/s" + sn)}` : `https://gemaraclarity.org/${c.m.toLowerCase().replace(/_/g, "-")}/${daf}${amud}/`; /* Nov 5 2026: share the daf's own page, whose link preview shows the daf; past step 1, the app's own link to that step (review #65: Share keeps the step) */ try { if (navigator.share) await navigator.share({ title: `${label(c.m, c.i)} · Gemara Clarity`, url }); else { await navigator.clipboard.writeText(url); toast("Link copied"); } } catch {} };
  // v4 (Oct 29 2026): print-to-PDF removed at David's request
  $$("[data-tab]").forEach(b => b.onclick = () => { c.tab = b.dataset.tab; renderDaf(); });
  const ovb = $("#ovBtn"); if (ovb) ovb.onclick = () => {
    const open = ovb.getAttribute("aria-expanded") !== "true"; saveJSON(LS.overview, open);
    ovb.setAttribute("aria-expanded", open); $(".ovl", ovb).textContent = open ? "Hide overview" : "Show overview";
    $("#ovPanel").hidden = !open; $(".dafhead").classList.toggle("ov-open", open);
  };
  const lib = $("#libBtn"); if (lib) lib.onclick = () => openPicker(); // v4d: the home library is gone; the daf picker lists every masechta
  const view = $("#view");
  view.onclick = e => {
    const j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); jumpTo(+j.dataset.jump, j.hasAttribute("data-rel")); return; }
    // calm4: phrase notes are shown in full, so a tap on a note no longer opens or folds it (links and pasuk buttons inside work at once)
    if (e.target.closest("#stripFlow")) { $("#flowBtn").onclick(); return; }
    // kt3: a tap (or click) on a word of the Gemara text opens its word help; a drag-selection does not; a tap anywhere else closes it
    const fw = e.target.closest(".pa .fw"); if (fw) { const sel = window.getSelection && window.getSelection(); if (!sel || sel.isCollapsed) wordHelpFlow(fw); return; }
    if (wfOpen() && !e.target.closest("#wfWord")) closeWordFlow();
    const rb = e.target.closest(".rt-btn"); if (rb) { rtToggle(rb); return; }
    const t = e.target.closest(".sh, .explain-btn"); if (t) { toggleStep(t.closest(".step")); return; }
    // v4: on the phone a tap on the very edge of the step turns to the step before or after
    if (paged() && innerWidth < 1000 && e.target.closest("#dafBody .step") && !e.target.closest("a, button, .fw, input, label, summary")) { const x = e.clientX; if (x < 26) stepBy(-1); else if (x > innerWidth - 26) stepBy(1); }
  };
  view.onkeydown = e => { // e5: Enter or Space opens the word help; arrows (Left = next word) and Home/End move inside the step, so the amud does not change
    const fw = e.target.closest && e.target.closest(".pa .fw"); if (!fw || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); wordHelpFlow(fw, true); return; }
    const ws = $$(".pa .fw", fw.closest(".step")), i = ws.indexOf(fw);
    const j = e.key === "ArrowLeft" ? i + 1 : e.key === "ArrowRight" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? ws.length - 1 : null;
    if (j == null) return;
    e.preventDefault(); e.stopPropagation();
    const t = ws[Math.max(0, Math.min(ws.length - 1, j))]; ws.forEach(w => { w.tabIndex = w === t ? 0 : -1; }); t.focus();
  };
  $("#sidebar").onclick = e => { const j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); jumpTo(+j.dataset.jump); } };
  observeSteps();
}
function toggleStep(card, force){
  const ex = $(".explain", card); const open = force ?? ex.hidden;
  ex.hidden = !open; card.classList.toggle("open", open);
  $$("[aria-controls]", card).forEach(b => b.setAttribute("aria-expanded", open));
  $(".explain-btn .xb-l", card).textContent = open ? "Hide explanation" : "Explain"; // home3b (Oct 16 2026): Explain sits at the END of the step
  const x = $(".sh-x", card); if (x) x.firstChild.textContent = open ? "Hide" : "Explain";
}
function jumpTo(n, flash){
  if (current && current.tab !== "steps") { current.tab = "steps"; renderDaf(); }
  const el = document.getElementById("s" + n); if (!el) return;
  const ae = document.activeElement, keep = !!(ae && ae !== document.body && ae.closest && ae.closest("#view, #sidebar, #sheet, .edge, .bottombar")); // review #99: focus was in the steps (or on the control pressed)
  closeSheet(); jumpTo.lock = Date.now() + 700;
  if (paged()) { markCurrent(n); const top = $("#dafBody .steps"); const y = top ? top.getBoundingClientRect().top + scrollY - 70 : 0; if (scrollY > y + 4 || scrollY < y - 400) scrollTo({ top: Math.max(0, y), behavior: "auto" }); }
  else el.scrollIntoView({ behavior: "auto", block: "start" });
  markCurrent(n);
  if (flash) { el.classList.remove("arrive"); void el.offsetWidth; el.classList.add("arrive"); clearTimeout(jumpTo.t); jumpTo.t = setTimeout(() => el.classList.remove("arrive"), 1600); el.focus && el.setAttribute("tabindex", "-1"); try { el.focus({ preventScroll: true }); } catch {} }
  // review #99: focus goes on to the new step's title (its header button if the title is not shown), so a keyboard or screen-reader user carries on
  // from there; only when focus was already in the steps or on the control pressed, and a mouse click shows no focus ring (:focus-visible)
  if (keep) { const t = [$(".stitle", el), $(".sh", el)].find(x => x && x.getClientRects().length); if (t) { if (!t.hasAttribute("tabindex") && t.tagName !== "BUTTON") t.setAttribute("tabindex", "-1"); try { t.focus({ preventScroll: true }); } catch {} } }
  const total = current && current.analysis ? current.analysis.steps.length : 0, kn = $(".tname .ten", el);
  if (total) announce(`Step ${n} of ${total}${kn ? ", " + kn.textContent.trim() : ""}`);
}
function observeSteps(){
  if (observer) observer.disconnect();
  const steps = $$(".step"); if (!steps.length) return;
  observer = new IntersectionObserver(entries => {
    if (Date.now() < (jumpTo.lock || 0) || paged()) return; // v2: in the paged (book) view only explicit jumps change the step
    for (const en of entries) if (en.isIntersecting) markCurrent(+en.target.dataset.n);
  }, { rootMargin: "-20% 0px -70% 0px" });
  steps.forEach(s => observer.observe(s));
  syncPaged();
}
function markCurrent(n){
  if (!current || !current.analysis) return;
  const total = current.analysis.steps.length;
  $$(".step.cur").forEach(x => x.classList.remove("cur")); const el = document.getElementById("s" + n); el && el.classList.add("cur");
  $$(".fnode.cur, .strip button.cur").forEach(x => { x.classList.remove("cur"); x.removeAttribute("aria-current"); });
  $$(`.fnode[data-jump="${n}"], .strip button[data-jump="${n}"]`).forEach(x => { x.classList.add("cur"); if (x.matches(".fnode")) x.setAttribute("aria-current", "step"); }); // review #99: the current sidebar link says so to a screen reader
  const sb = $(`.strip button[data-jump="${n}"]`), strip = sb && sb.parentElement; // keep the current step's button in view inside the strip, without moving the page
  if (strip && strip.scrollWidth > strip.clientWidth) { const l = sb.offsetLeft - strip.offsetLeft, w = strip.clientWidth; if (l < strip.scrollLeft + 8 || l + sb.offsetWidth > strip.scrollLeft + w - 8) strip.scrollLeft = Math.max(0, l - w / 2 + sb.offsetWidth / 2); }
  const now = $("#stripNow"); if (now) now.innerHTML = stripNowHtml(current.analysis, n);
  const side = $(`#sidebar .fnode[data-jump="${n}"]`); if (side && $(".layout").classList.contains("with-side")) side.scrollIntoView({ block: "nearest" });
  updPager(n, total);
  stepAddr(n);
}
// Nov 5 2026 (review #65): the address keeps the step (#/<Masechet>/<daf><a|b>/s<n>, which route() already opens), replaced in place: no new history
// entry, and replaceState fires no hashchange, so nothing re-renders. Refresh, Back to this amud and a copied address then keep the step.
function stepAddr(n){
  if (!current || current.am || current.tab !== "steps") return;
  if (history.state && history.state.gcSheet) { stepAddr.p = n; return; } // a sheet's own history entry is on top (closeSheet is about to go back): write the step once it is gone
  stepAddr.p = 0;
  const base = encodeURI(hashFor(current.m, current.i)), h = location.hash, to = base + "/s" + n;
  if (h === to || (h !== base && !h.startsWith(base + "/"))) return; // already there, or the address has moved on to somewhere else
  try { history.replaceState(history.state, "", to); } catch {}
}
addEventListener("popstate", () => { if (stepAddr.p && !(history.state && history.state.gcSheet)) stepAddr(stepAddr.p); });
// review #99: a visually hidden live region (index.html) says where a step change landed; the visible toast stays for messages meant to be seen
function announce(msg){ const r = $("#srStatus"); if (!r) return; r.textContent = ""; clearTimeout(announce.t); announce.t = setTimeout(() => { r.textContent = msg; }, 60); }
window.addEventListener("scroll", () => {
  if (current && current.am) return; // Ameilus fills the bar with the passages done
  const h = document.documentElement; const max = h.scrollHeight - h.clientHeight;
  $("#progressFill").style.width = current && max > 0 ? Math.min(100, h.scrollTop / max * 100) + "%" : "0";
}, { passive: true });

/* ---------- Ameilus mode: #/<Masechet>/<daf><a|b>/ameilus ----------
   The learner reads the raw daf and marks where each passage ends (ameilus/ui.js + ameilus/core.js, with the
   reading glossary in data/glossary.json). It reads the same breakdown the Shiur view loads (loadCloudAnalysis),
   mounts into #view, hides the bottom bar and the flow sidebar (it has its own bar and sugya map), and is torn
   down by the router on any other route. Nothing here changes how Shiur loads or looks. */
const AM_VER = "3.6.0", AM_SKEY = "gc-am3-settings";
let amMounted = null, amModP = null, amGlossP = null, pendingJump = null;
const amPrefs = () => { try { return Object.assign({ bare: false }, JSON.parse(localStorage.getItem(AM_SKEY) || "{}")); } catch { return { bare: false }; } };
function amModule(){ return amModP || (amModP = import(`./ameilus/ui.js?v=${AM_VER}-help`).catch(e => { amModP = null; throw e; })); }
function amGloss(){
  return amGlossP || (amGlossP = fetch(`data/glossary.json?v=${AM_VER}`).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(g => (g && g.entries) || {}).catch(e => { console.warn("glossary unavailable", e); amGlossP = null; return {}; }));
}
/* ---------- kt3: tap a word in Sugya Flow (Oct 16 2026) ----------
   The same word help Ameilus gives, from the same sources, with no second dictionary: the reading glossary (data/glossary.json via amGloss,
   looked up with ameilus/core.js lookupGloss and phraseAt on core.js's own tokenize of this amud) and, when the glossary has nothing, this
   amud's key terms (the keyTerms data, matched by the same rule as ameilus/ui.js: the word is one of the term's words, or is one after a
   one-letter prefix; other steps' terms only if this step has none). Shown in the Ameilus word sheet (.am-word): non-modal, fixed at the
   bottom on phones and at the bottom right on wide screens, so nothing in the page moves. A word with no entry says so, as in Ameilus. */
let wfCoreP = null; const wfTok = new WeakMap();
const wfCore = () => wfCoreP || (wfCoreP = import(`./ameilus/core.js?v=${AM_VER}`).catch(e => { wfCoreP = null; throw e; }));
const wfBare = w => String(w || "").replace(/[\u05F3\u05F4'"]/g, "");
const wfLetters = w => String(w || "").replace(/[^\u05D0-\u05EA]/g, "");
const wfV = (t, g) => vocApply(t, vocFor(current && current.analysis), vocGloss || g, vocNew); // N1: word-help English lines get vowels (homographs stay bare)
const wfMixed = s => esc(s).replace(/([\u0590-\u05FF][\u0590-\u05FF\u05F3\u05F4"'׳״\- ]*[\u0590-\u05FF׳״]|[\u0590-\u05FF])/g, m => `<span class="he" lang="he">${m}</span>`);
const wfHe = s => `<span class="he" dir="rtl" lang="he">${esc(s)}</span>`;
function wfSheet(){
  let el = document.getElementById("wfWord");
  if (!el) {
    el = document.createElement("section"); el.id = "wfWord"; el.className = "am-word wf-word"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Word help"); el.setAttribute("aria-describedby", "wfBody"); el.hidden = true;
    el.addEventListener("click", e => { if (e.target.closest("[data-x=close]")) return closeWordFlow(); if (e.target.closest("[data-x=save]")) wfSave(el); });
    document.body.appendChild(el);
  }
  return el;
}
let wfKbd = null; // e5: the word whose help was opened from the keyboard; closing puts focus back on it
function closeWordFlow(){ const el = document.getElementById("wfWord"), back = wfKbd, inSheet = !!(el && el.contains(document.activeElement)); wfKbd = null; if (el) el.hidden = true; document.querySelectorAll(".pa .fw.on").forEach(x => x.classList.remove("on")); if (back && back.isConnected && inSheet) back.focus({ preventScroll: true }); }
function wfOpen(){ const el = document.getElementById("wfWord"); return !!(el && !el.hidden); }
/* words (Oct 29 2026): Sugya Flow saves to My words too. Same list and record shape as Ameilus (ameilus/ui.js myWords: {raw, v, id, gloss[, src]},
   newest first, one per raw, at most 500), so it shows in #/words and the flashcards and acct.js syncs it like any other saved word.
   A second tap keeps it saved (removing is done in My words). */
const WF_MW = "gc-am3-mywords";
const wfMwAll = () => { try { const a = JSON.parse(localStorage.getItem(WF_MW) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
const wfMwHas = raw => wfMwAll().some(x => x && x.raw === raw);
const wfSaveHtml = saved => saved
  ? `<button class="chip" data-x="save" aria-pressed="true">Saved ✓</button><a class="wf-mw-open" href="#/words">See My words</a>`
  : `<button class="chip" data-x="save" aria-pressed="false">+ <span class="he" lang="he">המילים שלי</span> · My words</button>`;
function wfSave(sheet){
  const rec = sheet._mw; if (!rec) return;
  if (!wfMwHas(rec.raw)) { try { const a = wfMwAll().filter(y => y && y.raw !== rec.raw); a.unshift(rec); localStorage.setItem(WF_MW, JSON.stringify(a.slice(0, 500))); } catch (e) { console.warn("My words: could not save", e); return; } }
  const acts = sheet.querySelector(".am-word-acts"); if (acts) acts.innerHTML = wfSaveHtml(true);
  const b = sheet.querySelector("[data-x=save]"); if (b) b.focus({ preventScroll: true });
}
async function wordHelpFlow(el, kbd){
  const c = current, a = c && c.analysis, stepEl = el.closest(".step"), phEl = el.closest(".ph");
  if (!a || !stepEl || !phEl) return;
  const s = +stepEl.dataset.n - 1, ph = +phEl.dataset.ph, k = +el.dataset.k, shown = el.textContent;
  document.querySelectorAll(".pa .fw.on").forEach(x => x.classList.remove("on")); el.classList.add("on");
  let C = null, gloss = {};
  try { [C, gloss] = await Promise.all([wfCore(), amGloss(), vocNxLoad()]); } catch (e) { console.warn("word help unavailable", e); }
  if (current !== c || !el.isConnected || !el.classList.contains("on")) return;
  const parts = []; let mw = null;
  if (C) {
    let T = wfTok.get(a); if (!T) { T = C.tokenize(a.steps || []); wfTok.set(a, T); }
    const mine = []; T.forEach((t, j) => { if (t.s === s && t.ph === ph) mine.push(j); });
    let i = mine[k]; const want = wfLetters(shown);
    if (i == null || wfLetters(T[i].raw) !== want) i = mine.find(j => wfLetters(T[j].raw) === want);
    const w = wfBare(i != null ? T[i].raw : C.unvowel(shown));
    let phr = null; // a glossary phrase this word belongs to (starting up to 2 words earlier), as in Ameilus
    if (i != null) for (let b = Math.max(0, i - 2); b <= i && !phr; b++) { const h = C.phraseAt(gloss, T, b); if (h && h.n > 1 && b + h.n > i) phr = h; }
    if (phr) parts.push(`<div class="am-ent"><div class="am-ent-he">${wfHe(phr.entry[0] || phr.form)}</div><div class="am-ent-g">${wfMixed(wfV(phr.entry[1], gloss))}</div>${phr.entry[2] ? `<div class="am-ent-u">${wfMixed(wfV(phr.entry[2], gloss))}</div>` : ""}<div class="am-src">Reading glossary</div></div>`);
    const g = C.lookupGloss(gloss, w);
    if (g) parts.push(`<div class="am-ent"><div class="am-ent-he">${g.prefix ? `${wfHe(g.prefix + "־")} ` : ""}${wfHe(g.entry[0] || g.form)}</div>${g.prefix ? `<div class="am-ent-p">${wfHe(g.prefix)} = ${esc(g.prefixEn)}</div>` : ""}<div class="am-ent-g">${wfMixed(wfV(g.entry[1], gloss))}</div>${g.entry[2] ? `<div class="am-ent-u">${wfMixed(wfV(g.entry[2], gloss))}</div>` : ""}${g.entry[4] ? `<div class="am-src">Jastrow: ${wfHe(g.entry[4])}</div>` : `<div class="am-src">Reading glossary</div>`}</div>`);
    let ktShown = null; const kts = [], seen = new Set([phr && phr.form, g && g.form].filter(Boolean));
    const consider = kt => {
      const tw = C.unvowel(kt.term).replace(/[,.:;?!״"“”׳']/g, " ").split(/\s+/).filter(Boolean).map(wfBare);
      if (seen.has(tw.join(" "))) return; // same thing the glossary already says
      if (!(tw.includes(w) || (w.length > 2 && /^[ודהבלכמש]/.test(w) && tw.includes(w.slice(1))))) return;
      if (!ktShown && kt.meaning) ktShown = kt;
      kts.push(`<div class="am-ent"><div class="am-ent-he">${wfHe(kt.term)}</div><div class="am-ent-g">${wfMixed(wfV(kt.meaning, gloss))}</div><div class="am-src">Key term on this amud</div></div>`);
    };
    ((a.steps[s] || {}).keyTerms || []).forEach(consider);
    if (!kts.length) (a.steps || []).forEach((o, si) => { if (si !== s && kts.length < 1) (o.keyTerms || []).forEach(x => { if (!kts.length) consider(x); }); });
    parts.push(...kts);
    if (w) mw = Object.assign({ raw: w, v: i != null ? T[i].v : C.unvowel(shown), id: c.id, gloss: g ? g.entry[1] : "" }, g && g.entry[1] ? null : phr && phr.entry[1] ? { gloss: wfV(phr.entry[1], gloss), src: "glossary phrase" } : ktShown ? { gloss: wfV(ktShown.meaning, gloss), src: "key term" } : null); // the same fallbacks as Ameilus's save (v99t)
  }
  const sheet = wfSheet(); sheet._mw = mw;
  sheet.innerHTML = `<div class="am-word-head"><div class="am-word-w" dir="rtl" lang="he">${esc(shown)}</div><button class="iconbtn" data-x="close" aria-label="Close word help">✕</button></div>
    <div class="am-word-body" id="wfBody">${parts.length ? parts.join("") : `<p class="am-none">${C ? "No entry yet for this word. We'd rather leave it blank than guess." : "Word help couldn’t load just now. Check your connection and tap the word again."}</p>`}</div>${mw ? `
    <div class="am-word-acts">${wfSaveHtml(wfMwHas(mw.raw))}</div>` : ""}`;
  sheet.hidden = false;
  wfKbd = kbd ? el : null; if (kbd) { const x = sheet.querySelector("[data-x=close]"); if (x) x.focus({ preventScroll: true }); }
  // keep the tapped word in view above the sheet: the page scrolls, nothing in it moves
  requestAnimationFrame(() => { if (!el.isConnected || sheet.hidden) return; const r = el.getBoundingClientRect(), top = sheet.getBoundingClientRect().top; if (r.bottom > top - 12 && r.left < sheet.getBoundingClientRect().right && r.right > sheet.getBoundingClientRect().left) window.scrollBy({ top: r.bottom - top + 40, behavior: "smooth" }); });
}
function setModeSwitch(mode){ // the old top-bar Shiur/Ameilus switch: retired Oct 15 2026 (Ameilus is a path of its own; the in-page bar, modeBarHtml, switches), kept hidden
  const sw = $("#modeSw"); if (!sw) return;
  const on = false;
  sw.hidden = !on; document.body.classList.toggle("has-modesw", on);
  if (!on) return;
  const s = $("#modeShiur"), a = $("#modeAm");
  s.href = hashFor(current.m, current.i); a.href = hashFor(current.m, current.i, "/ameilus");
  s.classList.toggle("on", mode === "shiur"); a.classList.toggle("on", mode === "ameilus");
  if (mode === "shiur") { s.setAttribute("aria-current", "page"); a.removeAttribute("aria-current"); } else { a.setAttribute("aria-current", "page"); s.removeAttribute("aria-current"); }
}
function amTeardown(){
  if (amMounted) { try { amMounted.destroy(); } catch (e) { console.warn(e); } amMounted = null; }
  document.body.classList.remove("am-mode", "map-open", "am-word-open", "am-exp-open");
  document.documentElement.classList.remove("am-shell"); // round 4: the page scrolls again outside Ameilus
  const mb = $("#amMapBtn"); if (mb) mb.setAttribute("aria-pressed", "false");
  if (current && current.am) current = null;
}
async function renderAmeilus(m, i){
  const id = refId(m, i);
  const reuse = current && !current.am && current.id === id && current.analysis ? current.analysis : null; // coming from Shiur on the same amud
  amTeardown();
  if (observer) observer.disconnect();
  const me = current = { m, i, id, analysis: reuse, source: reuse ? "cloud" : null, text: null, tab: "ameilus", am: true };
  document.title = `${label(m, i)} · Ameilus · Gemara Clarity`;
  pushHistory(id); setModePref("ameilus");
  document.body.classList.add("am-mode");
  document.documentElement.classList.add("am-shell"); // round 4 (Oct 15 2026): an app shell; the page never scrolls, the amud and the explanation scroll in their own boxes
  setChrome(false); setModeSwitch("ameilus");
  { const { daf, amud } = dafOf(i); $("#refBtnText").innerHTML = `<span class="ref-m">${esc(masName(m))} </span>${daf}${amud}`; } // phones show just the daf here; the page head names the masechet
  const view = $("#view"); view.onclick = null;
  view.innerHTML = `<div class="loading"><div class="spinner"></div>Loading ${esc(label(m, i))}…</div>`;
  window.scrollTo(0, 0);
  let a = reuse, err = null, mod = null, gloss = {};
  if (!a) { try { a = await loadCloudAnalysis(id); } catch (e) { err = e; } }
  try { [mod, gloss] = await Promise.all([amModule(), amGloss(), vocNxLoad()]); } catch (e) { err = err || e; }
  if (current !== me) return; // moved on meanwhile
  me.analysis = a; me.source = a ? "cloud" : null;
  const shiur = hashFor(m, i);
  const notice = (head, body) => { view.innerHTML = `<div class="notice am-notice"><b>${head}</b><p>${body}</p><a class="btn" href="${shiur}">Open ${esc(label(m, i))} in Sugya Flow</a></div>`; };
  if (!a) return notice(err && !mod ? "Ameilus couldn’t load just now." : "Ameilus needs this amud’s breakdown, and it isn’t ready yet.", err ? "Check your connection and try again." : "Sugya Flow shows the text and translation meanwhile.");
  if (!mod) return notice("Ameilus couldn’t load just now.", "Check your connection and try again.");
  const p = neighbor(m, i, -1), n = neighbor(m, i, 1);
  try {
    amMounted = mod.mountAmeilus(view, {
      id, data: a, gloss, settings: { bare: !!amPrefs().bare, guess: !!amPrefs().guess }, label: label(m, i), heLabel: heLabel(m, i), modeBar: modeBarHtml(m, i, "ameilus"),
      prevHref: p ? hashFor(p.m, p.i, "/ameilus") : null, nextHref: n ? hashFor(n.m, n.i, "/ameilus") : null,
      shiurHref: k => hashFor(m, i, k ? "/s" + k : ""),
      vocalize: t => vocApply(t, vocFor(a), vocGloss || gloss), // explanations of finished passages get the same borrowed vowels as Shiur (always on: they are answers already shown)
      vocalizeHelp: t => vocApply(t, vocFor(a), vocGloss || gloss, vocNew), // N1: word-help lines and the signal hint (homographs stay bare)
      onProgress: f => { if (current === me) $("#progressFill").style.width = (f * 100).toFixed(1) + "%"; },
      whenReady: whenDisclaimerDone,
      refParts, refButton, // quoted-pasuk references in the explanation open the same pop-up as in Shiur // the first-use walkthrough waits for the site's first-visit notice
      onMapPick: () => { document.body.classList.remove("map-open"); const mb = $("#amMapBtn"); mb && mb.setAttribute("aria-pressed", "false"); }
    });
  } catch (e) {
    console.warn("ameilus could not open", id, e); amMounted = null;
    notice("Ameilus can’t open this amud yet.", "Its breakdown has a shape Ameilus doesn’t read. The full step-by-step is in Sugya Flow.");
  }
}
function amSettingsSection(body){
  if (!body) return;
  const bare = !!amPrefs().bare, guess = !!amPrefs().guess;
  body.insertAdjacentHTML("afterbegin", `<section class="am-set">
    <h3 style="margin:4px 0 4px;font-size:16px">Ameilus</h3>
    <label class="setrow"><span class="lbl"><b>Bare mode</b><span>Just the daf and the marker: no hints, no checks</span></span><span class="switch"><input type="checkbox" id="amBare" ${bare ? "checked" : ""}><span></span></span></label>
    <label class="setrow"><span class="lbl"><b>Guess the kind first</b><span>Before our reading, guess what kind of move each passage makes, in two taps. Skip any time. Not shown in Bare mode.</span></span><span class="switch"><input type="checkbox" id="amGuess" ${guess ? "checked" : ""}><span></span></span></label>
    <a class="setrow mw-setlink" href="#/words" id="amWordsLink"><span class="lbl"><b>My words${mwCount() ? ` (${mwCount()})` : ""}</b><span>Your saved words and flashcards have their own page now.</span></span><span class="mw-chev" aria-hidden="true">›</span></a>
    <p class="small" style="margin:10px 0 18px">How it works: ${esc(AMW.settingsHow)}</p>
    <h3 style="margin:0 0 4px;font-size:16px">Display</h3></section>`);
  $("#amWordsLink", body).addEventListener("click", () => closeSheet());
  $("#amBare", body).addEventListener("change", e => {
    e.stopPropagation();
    let s = {}; try { s = JSON.parse(localStorage.getItem(AM_SKEY) || "{}") || {}; } catch {}
    s.bare = e.target.checked; localStorage.setItem(AM_SKEY, JSON.stringify(s));
    if (current && current.am) renderAmeilus(current.m, current.i);
  });
  $("#amGuess", body).addEventListener("change", e => { // Guess the kind first (opt-in, off by default): saved beside Bare mode
    e.stopPropagation();
    let s = {}; try { s = JSON.parse(localStorage.getItem(AM_SKEY) || "{}") || {}; } catch {}
    s.guess = e.target.checked; localStorage.setItem(AM_SKEY, JSON.stringify(s));
    if (current && current.am) renderAmeilus(current.m, current.i);
  });
}
// switching ways keeps the place: from Ameilus, Shiur opens at the step of the passage the learner is on
document.addEventListener("click", e => {
  const o = e.target.closest && e.target.closest("[data-path-pick]"); if (!o || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey) return;
  if (o.dataset.pathPick === "shiur" && current && current.am && amMounted && amMounted.placeStep) {
    const k = amMounted.placeStep();
    if (k) { e.preventDefault(); location.hash = hashFor(current.m, current.i, "/s" + k); }
  }
});
$("#amMapBtn").onclick = () => { const on = document.body.classList.toggle("map-open"); $("#amMapBtn").setAttribute("aria-pressed", String(on)); };

/* ---------- router ---------- */
// v99q: an odd but unambiguous form of a route (letter case, no amud letter (a, as route() already defaults; b when b is the only amud of that daf), leading zeros,
// a trailing or a missing leading slash, an encoded space) is rewritten in place to the form the app's own links use (hashFor), with no new history entry; a route
// naming no masechta, or a daf the masechta does not have, gets the "Daf not found" notice and nothing is fetched for it. Home, Classics and the skip link (#view, index.html) stay as they were.
function routeCanon(){
  const raw = location.hash; if (raw === "#view") return null;
  let h; try { h = decodeURIComponent(raw); } catch { return { nf: raw.replace(/^#\/?/, "") }; }
  const p = h.replace(/^#\/?/, "").split("/").filter(Boolean), nf = { nf: h.replace(/^#\/?/, "") }; if (!p.length) return null;
  let to;
  if (p[0].toLowerCase() === "classics") to = ["classics", ...p.slice(1)];
  else if (p[0].toLowerCase() === "words") to = ["words", ...(p[1] && p[1].toLowerCase() === "cards" ? ["cards"] : [])]; // My words (Oct 25 2026): #/words, #/words/cards
  else {
    const info = MAS.find(x => x[0].toLowerCase() === p[0].replace(/ /g, "_").toLowerCase()); if (!info) return nf;
    const dm = p.length > 1 ? /^0*(\d{1,3})([ab])?$/i.exec(p[1]) : null; if (p.length > 1 && !dm) return nf;
    const inR = a => idxOf(+dm[1], a) >= info[2] && idxOf(+dm[1], a) <= info[3], am = dm && (dm[2] ? dm[2].toLowerCase() : (inR("a") || !inR("b")) ? "a" : "b"); if (dm && !inR(am)) return nf;
    to = [info[0], ...(dm ? [+dm[1] + am] : []), ...p.slice(2)];
  }
  const url = encodeURI("#/" + to.join("/")); if (url !== raw) history.replaceState(history.state, "", url);
  return null;
}
function renderNotFound(asked){ // v99q: the one notice for a route that is not a daf, in the existing notice style
  if (amMounted || (current && current.am) || document.body.classList.contains("am-mode")) amTeardown();
  current = null; document.title = "Daf not found · Gemara Clarity"; setChrome(false);
  const c = [...asked], a = c.length > 80 ? c.slice(0, 80).join("") + "…" : asked;
  $("#view").innerHTML = `<div class="notice" id="notFound"><b>Daf not found</b><p style="overflow-wrap:anywhere">There is no daf at “<bdi>${esc(a)}</bdi>”. Check the masechta and the daf, or start again from the home page.</p><a class="btn" href="#/">Back to the home page</a></div>`;
  scrollTo(0, 0);
}
function rerender(){ route(true); }
function route(keepScroll){
  if (!keepScroll) closeSheet();
  closeWordFlow(); // kt3
  const rc = routeCanon(); if (rc) return renderNotFound(rc.nf); // v99q: odd forms were rewritten in place; a route that is not a daf gets the notice
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const parts = h.split("/").filter(Boolean);
  if (parts[2] !== "ameilus" && (amMounted || (current && current.am) || document.body.classList.contains("am-mode"))) amTeardown();
  if (!parts.length) return renderHome();
  if (parts[0] === "classics") return renderClassics(parts[1]);
  if (parts[0] === "words") return renderWords(parts[1]);
  const [m, df, extra] = parts; const info = masInfo(m);
  const dm = (df || "").match(/^(\d{1,3})([ab])?$/);
  if (!info || !dm) { if (info) { openPicker(m); return; } return renderHome(); }
  let i = idxOf(+dm[1], dm[2] || "a"); i = Math.min(Math.max(i, info[2]), info[3]);
  // rv1: the Review feature is gone; an old #/<m>/<daf>/review link opens the same daf (the reader's last way of learning it, else Sugya Flow)
  if (extra === "review") { location.replace(hashFor(m, i, modePref() ? "" : "/shiur")); return; }
  if (extra === "ameilus") { if (keepScroll && amMounted && current && current.am && current.id === refId(m, i)) return; return renderAmeilus(m, i); }
  const sj = /^s(\d+)$/.exec(extra || ""); if (sj && !keepScroll) pendingJump = { id: refId(m, i), n: +sj[1] };
  if (keepScroll && current && current.id === refId(m, i)) { const y = scrollY; renderDaf(); scrollTo(0, y); return; }
  // which way to open: an explicit Shiur link (/shiur, /s<n>) is a choice; a plain link follows the remembered
  // choice; with none remembered, an amud that Ameilus can open asks first (amud chooser)
  const explicit = extra === "steps" || extra === "shiur" || !!sj, id = refId(m, i); // home3b: /steps, with the old /shiur kept as an alias
  const canAm = !cloudLoaded || !cloudIds.size || hasBreakdown(id);
  if (explicit) setModePref("shiur");
  else if (canAm && modePref() === "ameilus") { location.replace(hashFor(m, i, "/ameilus")); return; }
  else if (canAm && !modePref()) return openDaf(m, i, null, true);
  openDaf(m, i);
}
// after a route change to Home or Classics, the new view's main heading takes a programmatic focus (only when focus was lost; never
// with a sheet, a notice or the pasuk pop-up open). Ameilus places its own focus; the amud (Sugya Flow) view is unchanged.
function focusAfterRoute(){
  const a = document.activeElement; if (a && a !== document.body) return;
  let p; try { p = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("/").filter(Boolean); } catch { return; } // v99q: a malformed %-escape shows the notice; nothing to focus
  if (p.length && p[0] !== "classics" && p[0] !== "words") return;
  if (!$("#sheet").hidden || $("#pasukPop") || document.querySelector('[role="dialog"]:not([hidden]), [role="alertdialog"]:not([hidden])')) return;
  const card = p[0] === "classics" && p[1] ? document.getElementById("cl-" + p[1]) : null; // back from a Classic: its own card (already scrolled into view)
  const h = card ? (card.querySelector("h2, h3, h4") || card) : document.querySelector("#view h1, #view h2"); if (!h) return;
  if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
}
// Nov 5 2026 (review #96): "Skip to content" (index.html) moves focus to the content and leaves the page, the address and the step alone; a
// hashchange to #view (the link followed without this handler) puts the previous address back in place, with no re-render
function skipToView(){ try { $("#view").focus(); } catch {} }
$(".skip").onclick = e => { e.preventDefault(); skipToView(); };
window.addEventListener("hashchange", e => { if (location.hash === "#view") { let o = ""; try { o = new URL(e.oldURL).hash; } catch {} history.replaceState(history.state, "", location.pathname + location.search + (o === "#view" ? "" : o)); skipToView(); return; } if (swReload()) return; Promise.resolve(route(false)).then(() => requestAnimationFrame(focusAfterRoute), () => {}); });
$("#homeBtn").onclick = () => { location.hash = "#/"; };
$("#refBtn").onclick = () => openPicker();
function openSettingsAll(){ openSettings(); if (current && current.am) amSettingsSection($("#sheetBody")); } $("#settingsBtn").onclick = e => acct.toggleMenu(e); // v106-acct: the corner button opens the profile menu; its Settings row opens openSettingsAll
$("#sheetClose").onclick = () => closeSheet(); $("#backdrop").onclick = () => closeSheet();
$("#flowBtn").onclick = () => { if (current && current.analysis) openSheet(`The steps of ${label(current.m, current.i)}`, flowHtml(current.analysis.steps), b => { const cur = $$(".step.cur")[0]; if (cur) { const f = $(`.fnode[data-jump="${cur.dataset.n}"]`, b); f && f.classList.add("cur"); f && f.scrollIntoView({ block: "center" }); } b.onclick = e => { const j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); jumpTo(+j.dataset.jump); } }; }); };
// v4: moving between steps — swipe, a tap on the left/right edge, the arrow keys (or j/k), or the one arrow at the foot of the step
function stepBy(d){ if (!paged() || !current || !current.analysis) return false; const c = +(($(".step.cur") || {}).dataset?.n || 1), t = current.analysis.steps.length, n = c + d; if (n < 1 || n > t) return false; jumpTo(n); return true; }
$$(".edge, .bb-step").forEach(b => b.onclick = () => stepBy(+b.dataset.d));
(() => { let sx = 0, sy = 0, st = 0, ok = false;
  document.addEventListener("touchstart", e => { const t = e.touches[0]; ok = e.touches.length === 1 && paged() && !!e.target.closest("#dafBody .step") && !e.target.closest("input, textarea, .wf, #sheet"); sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
  document.addEventListener("touchend", e => { if (!ok) return; ok = false; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    const sel = window.getSelection && window.getSelection(); if (sel && !sel.isCollapsed) return;
    if (Math.abs(dx) > 60 && Math.abs(dy) < Math.abs(dx) * 0.6 && Date.now() - st < 800) stepBy(dx < 0 ? 1 : -1); }, { passive: true });
})();
document.addEventListener("click", e => { if (!paged()) return; const sh = e.target.closest(".step:not(.cur) > .sh"); if (!sh) return; e.preventDefault(); e.stopImmediatePropagation(); jumpTo(+sh.parentElement.dataset.n); }, true);
addEventListener("resize", () => { clearTimeout(syncPaged.t); syncPaged.t = setTimeout(syncPaged, 150); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && wfOpen()) return closeWordFlow(); // kt3: word help first
  if (e.key === "Escape" && !$("#sheet").hidden) return closeSheet();
  if (e.key === "Tab" && !$("#sheet").hidden && !e.defaultPrevented) return sheetTab(e); // v99r
  if (e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey || !$("#sheet").hidden) return;
  if (!current) { if (e.key === "/") { e.preventDefault(); openPicker(); } return; }
  if (current.am && (e.defaultPrevented || e.key === "j" || e.key === "k")) return; // Ameilus: the marker keys win
  if (paged() && current.analysis && (e.key === "ArrowRight" || e.key === "ArrowLeft") && !e.target.closest(".ph, [role=tab], .side-resize")) { e.preventDefault(); stepBy(e.key === "ArrowRight" ? 1 : -1); return; }
  if (e.key === "ArrowRight" || e.key === "]") { const n = neighbor(current.m, current.i, 1); n && go(n.m, n.i); }
  else if (e.key === "ArrowLeft" || e.key === "[") { const p = neighbor(current.m, current.i, -1); p && go(p.m, p.i); }
  else if (e.key === "/") { e.preventDefault(); openPicker(); }
  else if ((e.key === "j" || e.key === "k") && current.analysis) {
    const cur = +(($(".step.cur") || {}).dataset?.n || 0); const nx = Math.min(current.analysis.steps.length, Math.max(1, cur + (e.key === "j" ? 1 : -1))); jumpTo(nx);
  }
});

// layout controls (remembered on this device): the desktop flow sidebar can be dragged wider or narrower and hidden;
// the bottom bar can be tucked away to a small handle so the text gets the full height
const SIDE_MIN = 200, SIDE_MAX = 520, SIDE_DEFAULT = 300;
function clampSide(w, vw){ const max = Math.max(SIDE_MIN, Math.min(SIDE_MAX, Math.round((vw || 1e4) * 0.45))); const n = Math.round(+w); return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(SIDE_MIN, n)) : Math.min(max, SIDE_DEFAULT); }
function readUi(raw){ const o = raw && typeof raw === "object" ? raw : {}; return { sideW: clampSide(o.sideW), sideHidden: o.sideHidden === true, barHidden: o.barHidden === true }; }
const ui = readUi(loadJSON(LS.ui, {}));
const saveUi = () => saveJSON(LS.ui, ui);
function applyUi(){
  const w = clampSide(ui.sideW, innerWidth);
  $(".layout").style.setProperty("--side-w", w + "px");
  $("#sideResize").setAttribute("aria-valuenow", w);
  document.body.classList.toggle("side-collapsed", ui.sideHidden);
  document.body.classList.toggle("bb-collapsed", false); // v4: the bar is one thin line now and is never tucked away
  const t = $("#bbToggle");
  t.setAttribute("aria-expanded", String(!ui.barHidden));
  t.setAttribute("aria-label", ui.barHidden ? "Show the bottom bar" : "Hide the bottom bar");
  t.title = ui.barHidden ? "Show bar" : "Hide bar";
}
function setSideHidden(h){
  ui.sideHidden = h; saveUi(); applyUi();
  const f = h ? $("#sideShow") : $("#sideHide"); f && f.focus({ preventScroll: true });
  if (!h) { const cur = $("#sidebar .fnode.cur"); cur && cur.scrollIntoView({ block: "nearest" }); }
}
$("#sideHide").onclick = () => setSideHidden(true);
$("#sideShow").onclick = () => setSideHidden(false);
$("#bbToggle").onclick = () => { ui.barHidden = !ui.barHidden; saveUi(); applyUi(); };
(() => {
  const h = $("#sideResize");
  let drag = null;
  const setW = (w, save) => { ui.sideW = clampSide(w, innerWidth); applyUi(); if (save) saveUi(); };
  h.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault(); h.setPointerCapture(e.pointerId);
    drag = { left: $("#sideWrap").getBoundingClientRect().left };
    document.body.classList.add("side-resizing");
  });
  h.addEventListener("pointermove", e => { if (drag) setW(e.clientX - drag.left, false); });
  const end = () => { if (!drag) return; drag = null; document.body.classList.remove("side-resizing"); saveUi(); };
  h.addEventListener("pointerup", end); h.addEventListener("pointercancel", end); h.addEventListener("lostpointercapture", end);
  h.addEventListener("dblclick", () => setW(SIDE_DEFAULT, true));
  h.addEventListener("keydown", e => { // arrows here resize the sidebar instead of turning the page
    const step = e.shiftKey ? 48 : 16;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); setW(clampSide(ui.sideW, innerWidth) + (e.key === "ArrowRight" ? step : -step), true); }
    else if (e.key === "Home" || e.key === "End") { e.preventDefault(); e.stopPropagation(); setW(e.key === "Home" ? SIDE_MIN : SIDE_MAX, true); }
  });
  addEventListener("resize", () => applyUi());
})();
applyUi();

/* ---------- quoted pasuk references (Oct 15 2026): "ישעיהו 60:21" in a note is a button; it opens the pasuk in a small
   pop-up over the page (Hebrew with nikud, English, "Open on Sefaria"), fetched from Sefaria's public API and cached for the session ---------- */
const TANAKH = { "בראשית":"Genesis", "שמות":"Exodus", "ויקרא":"Leviticus", "במדבר":"Numbers", "דברים":"Deuteronomy", "יהושע":"Joshua", "שופטים":"Judges",
  "שמואל א":"I Samuel", "שמואל ב":"II Samuel", "מלכים א":"I Kings", "מלכים ב":"II Kings", "ישעיהו":"Isaiah", "ישעיה":"Isaiah", "ירמיהו":"Jeremiah", "ירמיה":"Jeremiah",
  "יחזקאל":"Ezekiel", "הושע":"Hosea", "יואל":"Joel", "עמוס":"Amos", "עובדיה":"Obadiah", "יונה":"Jonah", "מיכה":"Micah", "נחום":"Nahum", "חבקוק":"Habakkuk",
  "צפניה":"Zephaniah", "חגי":"Haggai", "זכריה":"Zechariah", "מלאכי":"Malachi", "תהלים":"Psalms", "תהילים":"Psalms", "משלי":"Proverbs", "איוב":"Job",
  "שיר השירים":"Song of Songs", "רות":"Ruth", "איכה":"Lamentations", "קהלת":"Ecclesiastes", "אסתר":"Esther", "דניאל":"Daniel", "עזרא":"Ezra", "נחמיה":"Nehemiah",
  "דברי הימים א":"I Chronicles", "דברי הימים ב":"II Chronicles" };
const bookKey = s => String(s).replace(/[\u0591-\u05C7]/g, "").replace(/[\u05F3\u05F4'"]/g, "").replace(/\s+/g, " ").trim();
const REF_RX = /((?:[\u05D0-\u05EA][\u05D0-\u05EA\u0591-\u05C7\u05F3\u05F4'"]*\s+){0,2}[\u05D0-\u05EA][\u05D0-\u05EA\u0591-\u05C7\u05F3\u05F4'"]*)\s+(\d{1,3}):(\d{1,3})(?:\s?[-–]\s?(\d{1,3}))?(?![\d:])(?!\s?[-–]\s?\d)/g; // a range across chapters ("ישעיהו 60:21-61:1") stays whole as plain text, never cut to its first verse
/** split text into plain parts and Tanakh references: [{ text }, { ref: "Isaiah.60.21", label: "ישעיהו 60:21", book, he }] */
function refParts(raw){
  const s = String(raw == null ? "" : raw), out = []; let last = 0, m;
  REF_RX.lastIndex = 0;
  while ((m = REF_RX.exec(s))) {
    const words = m[1].split(/\s+/); let book = null, k = 0;
    for (k = Math.max(0, words.length - 3); k < words.length; k++) { const key = bookKey(words.slice(k).join(" ")); if (TANAKH[key]) { book = TANAKH[key]; break; } }
    if (!book) continue;
    const pre = words.slice(0, k).join(" "), name = words.slice(k).join(" ");
    const start = m.index + (pre ? m[1].indexOf(name, pre.length) : 0);
    if (start > last) out.push({ text: s.slice(last, start) });
    const ref = `${book.replace(/ /g, "_")}.${m[2]}.${m[3]}${m[4] ? "-" + m[4] : ""}`;
    out.push({ ref, he: name, label: `${name} ${m[2]}:${m[3]}${m[4] ? "–" + m[4] : ""}`, cv: `${m[2]}:${m[3]}${m[4] ? "–" + m[4] : ""}` });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}
function refButton(p){ return `<button type="button" class="pasuk-ref" data-pasuk="${esc(p.ref)}" data-label="${esc(p.label)}" aria-haspopup="dialog" title="Show this pasuk"><span class="he" lang="he">${esc(p.he)}</span> <span class="pasuk-cv">${esc(p.cv)}</span></button>`; }
const heLang = t => bidiHe(t).replace(/<bdi class="he-in" /g, "<bdi "); // the Classics helper's marking without its font change, so the prose looks exactly as before
const refHtml = raw => refParts(raw).map(p => p.ref ? refButton(p) : heLang(p.text)).join(""); // Nov 5 2026 (review #98): each Hebrew run in the English prose is marked as Hebrew (<bdi lang="he">) so a screen reader picks a Hebrew voice
const pasukCache = new Map();
const cleanHe = t => String(t).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\{[ספ]\}/g, "").replace(/\(([^)]*)\)\s*\[([^\]]*)\]/g, "$2").replace(/[\u0591-\u05AF\u05BD]/g, "").replace(/\s+/g, " ").trim();
const cleanEn = t => String(t).replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<i class="footnote">.*?<\/i>/g, "").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
async function fetchPasuk(ref){
  if (pasukCache.has(ref)) return pasukCache.get(ref);
  try { const s = sessionStorage.getItem("gc-pasuk:" + ref); if (s) { const v = JSON.parse(s); pasukCache.set(ref, v); return v; } } catch {}
  const ac = typeof AbortController === "function" ? new AbortController() : null, t = setTimeout(() => ac && ac.abort(), 9000);
  try {
    const r = await fetch(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(ref)}?version=hebrew&version=english&return_format=text_only`, ac ? { signal: ac.signal } : {});
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json(), vs = d.versions || [];
    const pick = lang => { const v = vs.find(x => x.language === lang); return v ? [].concat(v.text || []).flat(Infinity) : []; };
    const he = pick("he").map(cleanHe).filter(Boolean), en = pick("en").map(cleanEn).filter(Boolean);
    if (!he.length && !en.length) throw new Error("empty");
    const v = { he, en, heRef: d.heRef || "", enRef: d.ref || ref.replace(/_/g, " ") };
    pasukCache.set(ref, v); try { sessionStorage.setItem("gc-pasuk:" + ref, JSON.stringify(v)); } catch {}
    return v;
  } finally { clearTimeout(t); }
}
/* ---------- Rashi and Tosfos (Nov 6 2026, David asked for them): under each step, a "Rashi" and a "Tosfos" button open the
   commentaries on that step's words, the Hebrew (Vilna edition, public domain) with the English wherever Sefaria has one.
   Each comment is placed on a step by its opening words (the dibur hamaschil), matched loosely (no inner ו/י, plain final letters);
   when they can't be found, by the Gemara line Sefaria hangs it on. Tested on 12 amudim across Shas: 86% by words, the rest by line. */
const RT = { rashi: { en: "Rashi", he: "רש״י", book: "Rashi_on_" }, tosafot: { en: "Tosfos", he: "תוספות", book: "Tosafot_on_" } };
const rtData = new Map(); // amud id -> Promise of { rashi: [per step: comments], tosafot: [...] }
const RT_FIN = { "ך":"כ", "ם":"מ", "ן":"נ", "ף":"פ", "ץ":"צ" };
const rtNorm = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/[֑-ׇ]/g, "").replace(/[׳״'"`.,:;?!()\[\]{}<>–—\-־]/g, " ").replace(/\s+/g, " ").trim();
const rtKey = w => { const p = w.replace(/[ךםןףץ]/g, c => RT_FIN[c]); return p.length <= 2 ? p : p[0] + p.slice(1).replace(/[וי]/g, ""); };
const rtKeys = s => rtNorm(s).split(" ").filter(Boolean).map(rtKey);
const RT_SKIP = new Set(["גמ", "מתני", "הג", "בגמ", "גמרא"].map(rtKey));
const rtSplit = c => { const t = String(c || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); const m = t.match(/^(.{2,140}?)(\s[–-]\s|\.\s)([\s\S]*)$/); return m ? [m[1], m[3]] : ["", t]; };
function rtPlace(steps, segs, gemSegs){ // which step each comment belongs to; segs: comments per Gemara line; gemSegs: the Gemara's Hebrew per line
  const words = [], stepOf = [];
  steps.forEach((s, k) => (s.phrases || []).forEach(p => rtKeys(p.aramaic).forEach(w => { words.push(w); stepOf.push(k); })));
  const find = (q, from, to) => { for (let i = Math.max(0, from); i <= Math.min(words.length - q.length, to); i++) { let ok = true; for (let j = 0; j < q.length; j++) if (words[i + j] !== q[j]) { ok = false; break; } if (ok) return i; } return -1; };
  let gc = 0; const segAt = gemSegs.map(g => { const q = rtKeys(g).filter(w => !RT_SKIP.has(w)).slice(0, 3); const a = q.length ? find(q, gc, words.length) : -1; if (a >= 0) gc = a; return a; });
  let cur = 0, prev = 0; const out = [];
  segs.forEach((list, si) => [].concat(list || []).forEach(c => {
    const dh = rtKeys(rtSplit(c)[0] || String(c).split(" ").slice(0, 4).join(" ")); while (dh.length && RT_SKIP.has(dh[0])) dh.shift();
    const lo = segAt[si] >= 0 ? segAt[si] : cur, hi = (segAt.slice(si + 1).find(x => x >= 0) ?? words.length) + 40;
    let at = -1;
    for (const n of [4, 3, 2, 1]) { const q = dh.slice(0, Math.min(n, dh.length)); if (!q.length || (n === 1 && q[0].length < 3)) continue;
      at = find(q, Math.max(0, lo - 30), hi); if (at < 0 && n >= 2) at = find(q, cur, words.length); if (at >= 0) break; }
    if (at < 0 && segAt[si] >= 0) at = segAt[si];
    const step = at >= 0 ? stepOf[at] : prev; if (at >= cur) cur = at; prev = step; out.push(step);
  }));
  return out;
}
async function rtBook(kind, m, i){ // one commentary on one amud: [{ he, en, src }] in order, with Sefaria's line structure kept for placing
  const { daf, amud } = dafOf(i), base = `${SEFARIA}/api/v3/texts/${RT[kind].book}${m}.${daf}${amud}`, ttl = 60*864e5;
  const h = await cachedJSON(`${base}?version=hebrew&return_format=text_only`, { ttl });
  const he = ((h.versions || [])[0] || {}).text || [];
  const ens = (h.available_versions || []).filter(v => v.language === "en" && !/\[fr\]|french/i.test(v.versionTitle || ""))
    .sort((a, b) => /automat/i.test(a.versionTitle) - /automat/i.test(b.versionTitle)); // a machine translation only fills what people haven't
  const vs = (await Promise.all(ens.map(v => cachedJSON(`${base}?version=${encodeURIComponent("english|" + v.versionTitle)}&return_format=text_only`, { ttl })
    .then(j => ({ title: v.versionTitle, text: ((j.versions || [])[0] || {}).text || [] })).catch(() => null)))).filter(Boolean);
  const segs = [].concat(he).map((list, si) => [].concat(list || []).map((c, ci) => {
    for (const v of vs) { const e = [].concat(v.text[si] || [])[ci]; const t = e ? cleanEn(e) : ""; if (t) return { he: c, en: t, src: v.title }; }
    return { he: c, en: "", src: "" };
  }));
  return segs;
}
function rtLoad(c){
  if (!rtData.has(c.id)) rtData.set(c.id, (async () => {
    const [t, r, tf] = await Promise.all([loadText(c.m, c.i), rtBook("rashi", c.m, c.i).catch(() => []), rtBook("tosafot", c.m, c.i).catch(() => [])]);
    const steps = (c.analysis && c.analysis.steps) || [], out = {};
    for (const [kind, segs] of [["rashi", r], ["tosafot", tf]]) {
      const at = rtPlace(steps, segs.map(l => l.map(x => x.he)), t.he || []), flat = segs.flat(); out[kind] = steps.map(() => []);
      flat.forEach((x, n) => out[kind][at[n]] && out[kind][at[n]].push(x));
    }
    return out;
  })().catch(e => { rtData.delete(c.id); throw e; }));
  return rtData.get(c.id);
}
function rtPanelHtml(kind, list){
  const { daf, amud } = dafOf(current.i), ref = `${RT[kind].book}${current.m}.${daf}${amud}`, srcs = [...new Set(list.map(x => x.src).filter(Boolean))];
  return list.map(x => { const [dh, rest] = rtSplit(x.he); return `<div class="rt-c"><p class="rt-he" lang="he" dir="rtl">${dh ? `<b>${esc(dh)}</b> – ` : ""}${esc(rest)}</p>${x.en ? `<p class="rt-en">${esc(x.en)}</p>` : `<p class="rt-en rt-none">No English for this one on Sefaria yet.</p>`}</div>`; }).join("")
    + `<p class="rt-src">Hebrew: Vilna edition. ${srcs.length ? `English: ${esc(srcs.join("; "))}. ` : ""}From <a href="https://www.sefaria.org/${ref}?lang=bi" target="_blank" rel="noopener">Sefaria</a>.</p>`;
}
function rtPaint(c){
  if (!c || c.am || !c.analysis) return;
  rtLoad(c).then(d => {
    if (current !== c) return;
    $$("#dafBody .rt[data-rt]").forEach(slot => {
      const k = +slot.dataset.rt; if (slot.dataset.done) return; slot.dataset.done = "1";
      slot.innerHTML = Object.keys(RT).map(kind => { const list = (d[kind] || [])[k] || []; if (!list.length) return "";
        const id = `rt-${kind}-${k + 1}`;
        return `<button type="button" class="rt-btn" data-rt-kind="${kind}" aria-expanded="false" aria-controls="${id}">${RT[kind].en} <span class="rt-heb" lang="he">${RT[kind].he}</span><span class="rt-n">${list.length}</span></button>`; }).join("")
        + Object.keys(RT).map(kind => { const list = (d[kind] || [])[k] || []; return list.length ? `<div class="rt-panel" id="rt-${kind}-${k + 1}" data-kind="${kind}" hidden>${rtPanelHtml(kind, list)}</div>` : ""; }).join("");
    });
  }).catch(e => console.warn("Rashi/Tosfos", e)); // no signal and nothing saved: the step simply shows no buttons
}
function rtToggle(btn){
  const slot = btn.closest(".rt"), kind = btn.dataset.rtKind, open = btn.getAttribute("aria-expanded") !== "true";
  $$(".rt-btn", slot).forEach(b => b.setAttribute("aria-expanded", String(open && b === btn)));
  $$(".rt-panel", slot).forEach(p => { p.hidden = !(open && p.dataset.kind === kind); });
}
let pasukPrev = null;
function closePasuk(){ const w = $("#pasukPop"); if (!w) return; w.remove(); document.removeEventListener("keydown", pasukKey, true); try { pasukPrev && pasukPrev.isConnected && pasukPrev.focus({ preventScroll: true }); } catch {} pasukPrev = null; }
function pasukKey(e){ if (e.key === "Escape" && $("#pasukPop")) { e.preventDefault(); e.stopImmediatePropagation(); closePasuk(); } else if (e.key === "Tab" && $("#pasukPop")) { const f = [...$("#pasukPop").querySelectorAll("button,a[href]")]; if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } } }
function openPasuk(ref, label, from){
  closePasuk(); pasukPrev = from || document.activeElement;
  const url = `https://www.sefaria.org/${ref.split(".").map(encodeURIComponent).join(".")}?lang=bi`;
  const w = document.createElement("div"); w.id = "pasukPop"; w.className = "pz-back";
  w.innerHTML = `<section class="pz" role="dialog" aria-modal="true" aria-labelledby="pzH">
      <div class="pz-head"><h2 class="pz-h" id="pzH"><span class="he" lang="he">${esc(label)}</span></h2><button type="button" class="iconbtn pz-x" data-pz="close" aria-label="Close">✕</button></div>
      <div class="pz-body" aria-live="polite"><div class="pz-load"><span class="spinner" aria-hidden="true"></span> Loading the pasuk…</div></div>
      <a class="pz-sef" href="${esc(url)}" target="_blank" rel="noopener">Open on Sefaria ↗</a>
    </section>`;
  w.addEventListener("click", e => { if (e.target === w || e.target.closest("[data-pz=close]")) closePasuk(); });
  document.body.appendChild(w); document.addEventListener("keydown", pasukKey, true);
  w.querySelector(".pz-x").focus({ preventScroll: true });
  fetchPasuk(ref).then(v => {
    const body = w.querySelector(".pz-body"); if (!body || !w.isConnected) return;
    if (v.heRef) w.querySelector(".pz-h").innerHTML = `<span class="he" lang="he">${esc(v.heRef)}</span> <span class="pz-en">${esc(v.enRef)}</span>`;
    body.innerHTML = `${v.he.length ? `<p class="pz-he he" dir="rtl" lang="he">${v.he.map(esc).join(" ")}</p>` : ""}${v.en.length ? `<p class="pz-tr" lang="en">${v.en.map(esc).join(" ")}</p>` : ""}`;
  }).catch(() => {
    const body = w.querySelector(".pz-body"); if (!body || !w.isConnected) return;
    body.innerHTML = `<p class="pz-fail">Couldn’t load the text just now. It’s on Sefaria:</p>`;
  });
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-pasuk]"); if (!b) return;
  e.preventDefault(); e.stopPropagation(); openPasuk(b.dataset.pasuk, b.dataset.label || b.textContent, b);
}, true);

/* ---------- first-visit notice (Oct 15 2026): the whole site, once per device, acknowledged with the button only ---------- */
const DISC_KEY = "gc-disclaimer";
const DISC = {
  title: "Before you start",
  body: "Everything in Gemara Clarity — translations, explanations and step breakdowns — is generated by AI. It has no haskama and has not been reviewed by a rav. It can contain mistakes, and it is not for practical halacha. If you spot a mistake, tap “Report a mistake” on the amud or on any step.",
  ok: "I understand"
};
let discOpen = false, discWaiters = [];
function disclaimerSeen(){ try { return !!localStorage.getItem(DISC_KEY); } catch { return false; } }
// run fn now if the notice is not up, else right after "I understand" (the Ameilus walkthrough waits for it)
function whenDisclaimerDone(fn){ if (discOpen) discWaiters.push(fn); else fn(); }
function showDisclaimer(again){
  if (discOpen) return;
  discOpen = true;
  const prevFocus = document.activeElement;
  const wrap = document.createElement("div");
  wrap.className = "disc-back"; wrap.id = "disc";
  wrap.innerHTML = `<section class="disc" role="alertdialog" aria-modal="true" aria-labelledby="discH" aria-describedby="discB">
      <div class="disc-ic" aria-hidden="true">!</div>
      <h2 class="disc-h" id="discH">${esc(DISC.title)}</h2>
      <p class="disc-b" id="discB">${esc(DISC.body)}</p>
      <button class="btn primary disc-ok" id="discOk" type="button">${esc(DISC.ok)}</button>
    </section>`;
  // everything else on the page is inert (not clickable, not focusable, hidden from screen readers) until the button is pressed
  const others = [...document.body.children].filter(el => el !== wrap && !el.hasAttribute("inert"));
  others.forEach(el => el.setAttribute("inert", ""));
  document.body.appendChild(wrap); document.body.classList.add("disc-open");
  const ok = wrap.querySelector("#discOk");
  const onKey = e => {
    if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); return; } // only the button closes it
    if (e.key === "Tab") { e.preventDefault(); ok.focus(); } // focus stays on the one control
  };
  document.addEventListener("keydown", onKey, true);
  ok.addEventListener("click", () => {
    try { localStorage.setItem(DISC_KEY, "1"); } catch {}
    document.removeEventListener("keydown", onKey, true);
    others.forEach(el => el.removeAttribute("inert"));
    wrap.remove(); document.body.classList.remove("disc-open"); discOpen = false;
    const w = discWaiters; discWaiters = []; w.forEach(f => { try { f(); } catch (e) { console.warn(e); } });
    try { if (again && prevFocus && prevFocus.isConnected) prevFocus.focus({ preventScroll: true }); else $("#view").focus({ preventScroll: true }); } catch {}
  });
  setTimeout(() => ok.focus({ preventScroll: true }), 0);
}
/* ---------- offline: save one masechta (v105, Oct 19 2026) ----------
   A masechta is saved with the same loaders and into the same cache as any daf that is opened (loadCloudAnalysis + loadText into gc2-data-v1),
   plus its Mishnah list (data/mishnah/<masechet>.json), so a saved amud and a visited amud are the same entries. OFL_KB = [amudim, KB on the
   device] per masechet, measured Oct 19 2026 over every amud (the JSON the cache stores: breakdown + Sefaria text + Mishnah list; next-qa/offline1-build).
   The record per masechet is in localStorage (gc2-offline): { st: "saved" | "partial", n, of, err }. Saving runs while the app is open: closing the
   app leaves the record partial ("Saving paused"), and Resume skips every amud already on the device. Nothing here deletes bookmarks or settings. */
const OFL_KEY = "gc2-offline"; // localStorage: { masechet: { st: "saved" | "partial", n, of, err, at } }
const OFL_KB = { Berakhot: [125, 14635], Shabbat: [312, 26321], Eruvin: [207, 17402], Pesachim: [240, 20098], Yoma: [173, 13846], Sukkah: [110, 8394], Beitzah: [78, 6169], Rosh_Hashanah: [67, 5613], Taanit: [59, 5408], Megillah: [61, 6799], Moed_Katan: [55, 5118], Chagigah: [51, 4239], Yevamot: [242, 20896], Ketubot: [222, 17505], Nedarim: [180, 8982], Nazir: [129, 7293], Sotah: [96, 8666], Gittin: [178, 14906], Kiddushin: [162, 14053], Bava_Kamma: [236, 20612], Bava_Metzia: [235, 19663], Bava_Batra: [350, 21846], Sanhedrin: [224, 22613], Makkot: [46, 4062], Shevuot: [96, 7943], Avodah_Zarah: [150, 11985], Horayot: [25, 2738], Zevachim: [238, 18561], Menachot: [217, 18261], Chullin: [281, 22362], Bekhorot: [119, 10321], Arakhin: [65, 6086], Temurah: [65, 5811], Keritot: [54, 6029], Meilah: [41, 2448], Tamid: [17, 1136], Niddah: [143, 12711] };
const OFL_ALL_KB = Object.values(OFL_KB).reduce((s, x) => s + x[1], 0);
const OFL_DL = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>`;
const oflJobs = {}, oflSeen = new Set();
const oflMB = kb => { const mb = kb / 1000; return (mb < 10 ? String(Math.max(0.1, +mb.toFixed(1))) : String(Math.round(mb))) + " MB"; };
const oflAll = () => { const o = loadJSON(OFL_KEY, {}); return o && typeof o === "object" ? o : {}; };
const oflGet = k => oflAll()[k] || null;
function oflPut(k, r){ const o = oflAll(); if (r) o[k] = r; else delete o[k]; try { localStorage.setItem(OFL_KEY, JSON.stringify(o)); } catch {} }
const oflIds = k => [...cloudIds].filter(id => parseId(id).m === k).sort((a, b) => parseId(a).i - parseId(b).i);
const oflBk = id => `data/b/${encodeURIComponent(id)}.json${staticVersion ? "?v=" + encodeURIComponent(staticVersion) : ""}`; // the key loadCloudAnalysis stores
const oflTx = (m, i) => { const { daf, amud } = dafOf(i); return `${SEFARIA}/api/texts/${m}.${daf}${amud}?context=0&commentary=0&pad=0`; }; // the key loadText stores
async function oflHas(c, id, any){ const p = parseId(id); return !!(await c.match(any ? `data/b/${encodeURIComponent(id)}.json` : oflBk(id), { ignoreSearch: !!any })) && !!(await c.match(oflTx(p.m, p.i))); }
async function oflCount(c, ids, any){ let n = 0; for (const id of ids) if (await oflHas(c, id, any)) n++; return n; }
const oflJson = d => new Response(typeof d === "string" ? d : JSON.stringify(d), { headers: { "content-type": "application/json", "x-saved": String(Date.now()) } });
function oflMiKeep(m, d){ if (oflGet(m)) caches.open(DATA_CACHE).then(c => c.put(`data/mishnah/${m}.json`, oflJson(d))).catch(() => {}); return d; } // a saved masechet keeps its newest Mishnah list
async function oflMiCopy(m, e){ try { const h = await (await caches.open(DATA_CACHE)).match(`data/mishnah/${m}.json`); if (h) return await h.json(); } catch {} throw e; }
async function oflMishnah(k, c){ try { const r = await fetch(`data/mishnah/${k}.json`); if (r.ok && c) await c.put(`data/mishnah/${k}.json`, oflJson(await r.text())); } catch {} }
function oflBox(t, d, of, btns, sub, st){
  const pct = of ? Math.min(100, d / of * 100) : 0;
  return `<div class="ofl" data-st="${st}"><div class="ofl-row"><span class="ofl-t">${t}</span><span class="ofl-n">${d} of ${of}</span></div><div class="ofl-bar" role="progressbar" aria-label="Amudim saved" aria-valuemin="0" aria-valuemax="${of}" aria-valuenow="${d}"><i style="width:${pct.toFixed(1)}%"></i></div><div class="ofl-btns">${btns}</div><div class="ofl-sub">${sub}</div></div>`;
}
function oflInner(k){
  const [n, kb] = OFL_KB[k], nm = esc(masName(k)), j = oflJobs[k], r = oflGet(k) || {};
  if (j && !j.stop) return oflBox(`Saving ${nm} for offline…`, j.done, j.of, `<button class="btn" type="button" data-ofl="pause">Pause</button><button class="btn" type="button" data-ofl="cancel">Cancel</button>`, "Keep the app open. Pages you've saved stay saved if you stop.", "run");
  if (r.st === "saved" && !j) return `<div class="ofl" data-st="saved"><div class="ofl-row"><span><span class="ofl-t ofl-ok">Saved for offline ✓</span><span class="ofl-sub">All ${r.of || n} amudim · ${oflMB(kb)} · works without signal</span></span><button class="ofl-rm" type="button" data-ofl="remove" aria-label="Remove ${nm} from this device">Remove</button></div></div>`;
  if (r.st || j) return oflBox(r.err && !j ? "Saving stopped" : "Saving paused", j ? j.done : r.n || 0, j ? j.of : r.of || n, `<button class="btn" type="button" data-ofl="resume">Resume</button><button class="btn" type="button" data-ofl="cancel">Cancel</button>`, r.err && !j ? `${esc(r.err)} Pages you've saved stay saved.` : "Pages you've saved stay saved. Resume picks up where it stopped.", "paused");
  return `<button class="btn ofl-save" type="button" data-ofl="save"><span class="ic">${OFL_DL}</span>Save ${nm} for offline<span class="sz">${oflMB(kb)}</span></button>`;
}
function oflSlotHtml(k){ if (!OFL_KB[k]) return ""; setTimeout(() => oflVerify(k), 0); return `<div class="ofl-slot" data-ofl-m="${k}">${oflInner(k)}</div>`; }
function oflPaint(k, tick){
  const j = oflJobs[k];
  $$(".ofl-slot").filter(s => s.dataset.oflM === k).forEach(s => {
    const box = $(".ofl", s);
    if (tick && j && !j.stop && box && box.dataset.st === "run") { // progress only: the buttons stay where the finger is
      $(".ofl-n", box).textContent = `${j.done} of ${j.of}`; const b = $(".ofl-bar", box); b.setAttribute("aria-valuenow", j.done); $("i", b).style.width = Math.min(100, j.done / j.of * 100).toFixed(1) + "%"; return;
    }
    const had = s.contains(document.activeElement); s.innerHTML = oflInner(k); if (had) { const f = $("button", s); f && f.focus({ preventScroll: true }); }
  });
  if (tick && j) { $$("[data-ofl-n]").filter(e => e.dataset.oflN === k).forEach(e => { e.textContent = `${j.done} of ${j.of}`; }); return; }
  const list = $("#oflList"); if (list) list.innerHTML = oflListHtml();
}
async function oflSave(k){
  const j0 = oflJobs[k]; if (j0) { if (j0.stop === "pause") { j0.again = true; } return; }
  if (!OFL_KB[k]) return;
  await loadCloudIndex(); const ids = oflIds(k);
  if (!ids.length) { toast("The library list didn’t load. Try again with signal."); return; }
  const j = oflJobs[k] = { done: 0, of: ids.length, fail: 0, stop: null, again: false };
  const r0 = oflGet(k) || {}; oflPut(k, { st: "partial", n: r0.n || 0, of: ids.length });
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch {}
  oflPaint(k);
  let c = null; try { c = await caches.open(DATA_CACHE); } catch {}
  await oflMishnah(k, c);
  let x = 0, last = 0;
  const work = async () => { while (!j.stop && x < ids.length) { const id = ids[x++], p = parseId(id);
    try { if (!c || !(await oflHas(c, id))) { await loadCloudAnalysis(id); await loadText(p.m, p.i); } } catch { j.fail++; if (!navigator.onLine) j.stop = "offline"; }
    j.done++; if (Date.now() - last > 500) { last = Date.now(); oflPut(k, { st: "partial", n: j.done - j.fail, of: j.of }); } oflPaint(k, true); } };
  await Promise.all([work(), work(), work(), work()]);
  if (j.stop === "cancel") { delete oflJobs[k]; oflPut(k, null); oflPaint(k); return; }
  let have = c ? await oflCount(c, ids) : 0;
  if (c && have && have < ids.length) { await new Promise(res => setTimeout(res, 400)); have = await oflCount(c, ids); } // a page's own cache write can lag its answer by a moment
  delete oflJobs[k];
  const all = have >= ids.length;
  if (all) { oflPut(k, { st: "saved", n: ids.length, of: ids.length, at: Date.now() }); toast(`${masName(k)} is saved for offline`); }
  else oflPut(k, { st: "partial", n: have, of: ids.length, err: j.stop === "pause" ? "" : navigator.onLine ? "Some amudim didn’t load. Try again." : "No signal. Try again with signal." });
  oflPaint(k);
  if (j.again && !all) oflSave(k);
}
async function oflVerify(k){ // once per session: a saved masechet whose pages the browser cleared says so, and Resume fetches what is missing
  const r = oflGet(k); if (oflSeen.has(k) || oflJobs[k] || !r || r.st !== "saved") return; oflSeen.add(k);
  try { await loadCloudIndex(); const ids = oflIds(k); if (!ids.length) return; const c = await caches.open(DATA_CACHE);
    for (const id of [ids[0], ids[ids.length >> 1], ids[ids.length - 1]]) if (!(await oflHas(c, id, true))) { oflPut(k, { st: "partial", n: await oflCount(c, ids, true), of: ids.length, err: "Some pages were cleared from this device." }); oflPaint(k); return; }
  } catch {}
}
async function oflDrop(test, dataOnly){ // delete matching entries: gc2-data-v1 always; older copies in a gc2- shell cache too, unless dataOnly
  try { for (const name of await caches.keys()) { if (!/^gc2-/.test(name) || (dataOnly && name !== DATA_CACHE)) continue; const c = await caches.open(name);
    for (const q of await c.keys()) { const u = new URL(q.url); if (test(u, name === DATA_CACHE)) await c.delete(q); } } } catch {}
}
async function oflRemove(k){
  if (oflJobs[k]) oflJobs[k].stop = "cancel";
  const bk = new RegExp(`/data/b/${k}_\\d+_[ab]\\.json$`), tx = new RegExp(`/api/texts/${k}\\.\\d+[ab]$`);
  await oflDrop((u, data) => bk.test(u.pathname) || (data && (tx.test(u.pathname) || u.pathname.endsWith(`/data/mishnah/${k}.json`))));
  oflPut(k, null); oflSeen.delete(k); oflPaint(k); toast(`${masName(k)} removed from this device`);
}
async function oflRemoveAll(){
  Object.values(oflJobs).forEach(j => { j.stop = "cancel"; });
  await oflDrop((u, data) => /\/data\/b\/[^/]+_\d+_[ab]\.json$/.test(u.pathname) || (data && (/\/api\/texts\//.test(u.pathname) || /\/data\/mishnah\//.test(u.pathname))));
  const ks = Object.keys(oflAll()); try { localStorage.removeItem(OFL_KEY); } catch {}
  ks.forEach(k => oflPaint(k)); oflPaint(""); toast("Offline data removed");
}
function oflLibDone(ids, bad){ // the whole library was saved: every masechet that came through whole is marked saved
  const by = {}; ids.forEach(id => { const m = parseId(id).m; by[m] = (by[m] || 0) + 1; });
  caches.open(DATA_CACHE).then(async c => { for (const k of Object.keys(by)) if (OFL_KB[k] && !bad.has(k)) { await oflMishnah(k, c); oflPut(k, { st: "saved", n: by[k], of: by[k], at: Date.now() }); oflPaint(k); } }).catch(() => {});
}
function oflListHtml(){
  const o = oflAll(), ks = MAS.map(x => x[0]).filter(k => OFL_KB[k] && (o[k] || oflJobs[k]));
  const kbOf = k => { const r = o[k] || {}, kb = OFL_KB[k][1]; return r.st === "saved" ? kb : Math.round(kb * (r.n || 0) / (r.of || OFL_KB[k][0])); };
  const rows = ks.map(k => { const r = o[k] || {}, j = oflJobs[k], nm = esc(masName(k));
    const sub = j && !j.stop ? `Saving · <span data-ofl-n="${k}">${j.done} of ${j.of}</span>` : r.st === "saved" ? `${r.of || OFL_KB[k][0]} amudim` : `Paused · ${r.n || 0} of ${r.of || OFL_KB[k][0]} amudim`;
    return `<div class="sv-row"><span class="lbl"><b>${nm}</b><span>${sub}</span></span><span class="rt"><span class="mb">${oflMB(r.st === "saved" ? OFL_KB[k][1] : kbOf(k))}</span><button class="btn" type="button" data-ofl="remove" data-ofl-k="${k}" aria-label="Remove ${nm} from this device">Remove</button></span></div>`; }).join("");
  const tot = ks.reduce((s, k) => s + kbOf(k), 0);
  return `<h4 class="sv-h">Saved masechtot</h4>${rows || `<p class="small sv-none">None yet.</p>`}${ks.length ? `<div class="sv-tot"><b>Total on this device</b><b>${oflMB(tot)}</b></div>` : ""}<p class="small sv-hint">To save another masechta, open it from “Choose a daf”.</p><button class="btn ofl-rmall" type="button" data-ofl="removeall">Remove all offline data</button>`;
}
document.addEventListener("click", e => { // capture: the picker's own click handler (data-mas on #pickBody) never sees these buttons
  const b = e.target.closest && e.target.closest("[data-ofl]"); if (!b) return;
  e.stopPropagation(); e.preventDefault();
  const a = b.dataset.ofl, slot = b.closest(".ofl-slot"), k = b.dataset.oflK || (slot ? slot.dataset.oflM : "");
  if (a === "save" || a === "resume") oflSave(k);
  else if (a === "pause") { if (oflJobs[k]) { oflJobs[k].stop = "pause"; oflPaint(k); } }
  else if (a === "cancel") { if (oflJobs[k]) { oflJobs[k].stop = "cancel"; oflJobs[k].again = false; } else oflPut(k, null); oflPaint(k); }
  else if (a === "remove") { if (confirm(`Remove ${masName(k)} from this device? You can save it again any time.`)) oflRemove(k); }
  else if (a === "removeall") { if (confirm("Remove all offline data? Saved masechtot and every daf saved on this device will need signal again. Bookmarks and settings stay.")) oflRemoveAll(); }
}, true);
acct.init({ openSheet, closeSheet, toast, openSettings: openSettingsAll, openHelp, onPulled: () => { Object.assign(settings, loadJSON(LS.settings, {})); applySettings(); if (!current) renderHome(); } }); // v106-acct
if (!disclaimerSeen()) showDisclaimer(false);

applySettings();
route(false);
loadPerakim().then(() => { const s = $("#perekSlot"); if (s && current && !s.firstChild) { s.innerHTML = perekLineHtml(current.m, current.i); wirePerek(); } if (!current) refreshLibrary(); });
loadCloudIndex().then(() => {
  $$("#pickBody [data-go]").forEach(b => { const [k, i] = b.dataset.go.split("|"); b.classList.toggle("has", hasBreakdown(refId(k, +i))); }); // a picker opened before the library list arrived
  if (!current) refreshLibrary();
  else if (!current.analysis && current.am && cloudIds.has(current.id)) renderAmeilus(current.m, current.i);
  else if (!current.analysis && cloudIds.has(current.id) && dafOpening !== current.id) { const c = current; current = null; openDaf(c.m, c.i); } // v99lb: not while the first open of this amud is loading or done (it would drop the /s<n> step and the chooser)
  else renderDafNoticeCount();
});
function renderDafNoticeCount(){ /* counts appear on next render; nothing urgent */ }
// v100: a newly published version takes over by itself, at a quiet moment. After the worker is registered the browser is asked for a new sw.js on load and
// each time the page is shown again, at most once per 10 minutes (an offline check fails quietly). When a new worker takes control of a page that already had
// one (a first install never counts), its cache name (the one gc2-shell-* cache its activate step leaves) is noted; the page reloads the next time it is
// hidden and shown again, or at the next route change, never in the middle of what the learner is doing, and at most once per version (a sessionStorage
// guard keyed by that cache name). Nothing is shown. Marks, position, settings and hints are already saved, so the reload keeps them.
let swNext = null; const SW_EVERY = 600000;
function swReload(){ if (!swNext) return false; const g = "gc-sw-reload:" + swNext; try { if (sessionStorage.getItem(g)) return false; sessionStorage.setItem(g, "1"); } catch { return false; } location.reload(); return true; }
if ("serviceWorker" in navigator) {
  const sw = navigator.serviceWorker; let reg = null, last = -Infinity, had = !!sw.controller;
  const check = () => { if (!reg || Date.now() - last < SW_EVERY) return; last = Date.now(); reg.update().catch(() => {}); };
  // the new worker controls the page as soon as it activates (skipWaiting), before its activate step has removed the old cache, so its name is read once it is activated
  const note = () => caches.keys().then(ks => { const v = ks.filter(k => k.startsWith("gc2-shell-")).sort().join(","); if (v) swNext = v; }).catch(() => {});
  sw.addEventListener("controllerchange", () => { const was = had, c = sw.controller; had = !!c; if (!was || !c) return; if (c.state === "activated") return note(); c.addEventListener("statechange", function on(){ if (c.state !== "activated") return; c.removeEventListener("statechange", on); note(); }); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "visible") return; if (swReload()) return; check(); });
  addEventListener("load", () => sw.register("sw.js").then(r => { reg = r; check(); }).catch(() => {}));
}
// ---- Help (redone Nov 5 2026): the "?" in the top bar opens Help: the topics for this screen first, then the rest by group.
// All of the app's Help topics are written here, in one place, in plain words; ameilus/ui.js adds the Ameilus topic (it is loaded when Help opens).
// registerHelp({ id, group, order, icon, title, sub, steps, body, kinds, open, where, labels, added, action }):
//   steps: numbered steps shown first; body: short paragraphs (**word** is shown bold, for a button or setting named on screen);
//   where: the screens a topic is "on" (home, classics, flow, ameilus); open: shown open when it is the first topic on that screen;
//   labels: the on-screen words the topic names. test/site.test.mjs fails when one of them is no longer in the app, and when a Settings
//   switch is not named anywhere in Help, so Help has to change with the feature. added: the day a topic shipped (in "What's new" for 14 days).
// KEEP HELP IN STEP: when a feature is added, renamed or removed, change its topic here in the same commit.
function registerHelp(e){ if (!e || !e.id) return; (registerHelp.m ||= new Map()).set(e.id, Object.assign({ group:"More", order:99, icon:"info", where:[], steps:[], body:[], labels:[] }, e)); }
globalThis.registerHelp = registerHelp; (globalThis.__gcHelpQ || []).forEach(registerHelp); globalThis.__gcHelpQ = [];
const helpGo = {
  pick: { label:"Choose a daf", run: c => { c.close(); openPicker(); } },
  settings: { label:"Open Settings", run: c => { c.close(); openSettingsAll(); } }
};
registerHelp({ id:"first-daf", group:"Start here", order:1, icon:"paths", where:["home","classics"], open:true,
  title:"Your first daf, in 4 steps", sub:"New here? Start with this.",
  steps:["Tap **Choose a daf** at the top and pick one. Or tap **Start** on today’s Daf Yomi on the home screen.",
    "Read the first step: each phrase of the Aramaic with its English beside it.",
    "Tap **Explain** under the step to see what is going on, in plain words.",
    "Tap the arrow → to go on to the next step. Each step’s colour tells you its job (see “What the colours mean”)."],
  body:["You don’t have to finish in one go. The app remembers where you stopped: **Continue** on the home screen takes you back."],
  labels:["Choose a daf", "Start", "Explain", "Continue"], action: helpGo.pick });
registerHelp({ id:"ways", group:"Start here", order:2, icon:"steps", where:["home","classics"],
  title:"Sugya Flow or Ameilus?", sub:"Explained for you, or work it out yourself.",
  body:["**Sugya Flow** explains the daf for you, step by step. If you are new, use this.",
    "**Ameilus** gives you the plain text, with no vowels or punctuation. You work out where each passage ends, then check yourself against our reading.",
    "On any daf, switch between them with **Sugya Flow** and **Ameilus** under the daf’s name."],
  labels:["Sugya Flow", "Ameilus"] });
registerHelp({ id:"find", group:"Start here", order:3, icon:"search", where:["home","classics","flow","ameilus"],
  title:"Finding a daf", sub:"Any daf, a Mishnah, today’s daf, or a famous sugya.",
  body:["Tap **Choose a daf** at the top. (On a daf, that button shows the daf’s name.) Type a name like “Berakhot 5b”, or pick a masechta and then a daf.",
    "Looking for a Mishnah? Pick the masechta, then switch to **By Mishnah**.",
    "Today’s Daf Yomi is at the top of the home screen.",
    "**Classics**, on the home screen, are famous sugyos. They are a good place to start."],
  labels:["Choose a daf", "By Mishnah", "Classics", "Today’s daf"], action: helpGo.pick });
registerHelp({ id:"colours", group:"On the daf", order:1, icon:"kinds", where:["flow","ameilus"], kinds:true, open:true,
  title:"What the colours mean", sub:"Each step is coloured by its job in the argument.",
  body:["The **Mishnah** label marks the Mishnah itself. It is not a ninth colour.",
    "The coloured bar at the top of the daf shows every step in order. Tap a colour to jump to that step.",
    "In Menu › Settings you can turn off **Step colors**, or use **Color the text** to colour the words too."],
  labels:["Mishnah", "Step colors", "Color the text"], action: helpGo.settings });
registerHelp({ id:"reading", group:"On the daf", order:2, icon:"lines", where:["flow"],
  title:"Reading a step", sub:"Next, Explain, Rashi and Tosfos, verses, all the steps.",
  body:["**Explain**, under each step, says what is happening and why. Inside it, **More detail** goes deeper.",
    "**Rashi** and **Tosfos**, under the Aramaic, open their comments on that step: the Hebrew, with the English wherever Sefaria has a translation. The number shows how many there are.",
    "When a step quotes a pasuk, tap the reference to read the whole verse.",
    "At the bottom of the screen, **Next** takes you on to the following step and says what kind of step it is; the round arrow beside it goes back one. Tap “1 of 14” between them to list all the steps, so you can see how the sugya fits together and jump to any step.",
    "Want to test yourself? In Menu › Settings, turn off the **English translation** or the **Vowels (nikud)**. You can also turn **Phrase notes** off, turn **Logic details** on, or **Open every explanation** so you never need to tap Explain."],
  labels:["Explain", "More detail", "Show overview", "Rashi", "Tosfos", "Next"], action: helpGo.settings });
registerHelp({ id:"saved", group:"Your things", order:1, icon:"bookmark", where:["home","flow"],
  title:"Bookmarks, history and My words", sub:"Find your way back.",
  body:["Tap **Bookmark** at the bottom of any daf to keep it.",
    "The home screen lists your bookmarks, the dapim you **Recently learned**, and **My words**.",
    "My words is also in the Menu. It holds the words you saved in Ameilus, with flashcards to practise them.",
    "Sign in from the Menu to have all this on your other devices too."],
  labels:["Bookmark", "Recently learned", "My words", "flashcards"] });
registerHelp({ id:"offline", group:"Your things", order:2, icon:"offline", where:["home"],
  title:"Learning without signal", sub:"Save dapim to this device.",
  body:["Every daf you open is kept on this device, so it opens again without signal.",
    "Going somewhere without signal? Save more first. Tap **Choose a daf**, pick a masechta and tap **Save … for offline**. Or save everything in Menu › Settings › **Save library for offline**. It is large, so use Wi-Fi.",
    "On a phone, add Gemara Clarity to your home screen (your browser’s Share or ⋮ menu › Add to Home Screen) and it opens like an app.",
    "If the app ever looks out of date, close it and open it again."],
  labels:["for offline", "Save library for offline"],
  action:{ label:"Open offline settings", run: c => { c.close(); openSettingsAll(); const s = $("#saveAll"); s && s.scrollIntoView({ block:"center" }); } } });
registerHelp({ id:"settings", group:"Your things", order:3, icon:"aa", where:["ameilus","classics"],
  title:"Settings and signing in", sub:"Text size, theme, sign-in, starting fresh.",
  body:["Tap **Menu** at the top right, then **Settings**.",
    "**Text size**: A− and A+ make the Hebrew, Aramaic and English smaller or larger together.",
    "**Theme**: Light, Dark or Sepia.",
    "Signing in is optional. Tap **Menu**, then **Continue with Google**. It keeps your bookmarks and progress on all your devices. Without it, everything stays on this device only.",
    "To start fresh on this device, use **Clear my bookmarks, history and saved data** at the bottom of Settings. It can’t be undone."],
  labels:["Menu", "Settings", "Text size", "Theme", "Continue with Google", "Clear my bookmarks, history and saved data"], action: helpGo.settings });
registerHelp({ id:"mistake", group:"Your things", order:4, icon:"info", where:["flow","ameilus"],
  title:"Found a mistake?", sub:"The explanations are written by AI. Tell us.",
  body:["The Aramaic and its English translation come from Sefaria. The steps and explanations were written by AI. No rav has checked them, they can be wrong, and they are not for practical halacha.",
    "If something looks wrong, tap **Report a mistake** at the bottom of the daf, or **Report a mistake in this step** inside Explain. An email opens with the daf and step filled in. Just say what is wrong.",
    "Check anything important against the text, and with your teacher."],
  labels:["Report a mistake", "Report a mistake in this step", "About this content (AI disclaimer)"],
  action:{ label:"Read the AI notice again", run: c => { c.close(); showDisclaimer(true); } } });
const HELP_GROUPS = ["Start here", "On the daf", "Your things"];
// the colour key: in pairs (a question and its answer, a challenge and its resolution, a proof and its rejection); the names are Sugya Flow's own (TYPES)
const HELP_KINDS = [["mimra", "someone teaches or gives a ruling."], ["sheelah", "someone asks something they don’t know."], ["teshuvah", "the answer to that question."],
  ["kashya", "an objection: “but that contradicts…”"], ["terutz", "the objection is answered."], ["raaya", "a source is brought to back something up."],
  ["dechiya", "the proof is pushed aside: “it doesn’t have to mean that.”"], ["maskana", "where the discussion ends up."]];
const HELP_ICON = { paths:'<path d="M4 6h7v12H4zM13 6h7v12h-7z"/>', search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  kinds:'<path d="M4 7h16M4 12h11M4 17h14"/>', lines:'<path d="M5 7h14M5 12h14M5 17h9"/>', steps:'<path d="M6 4v16M6 8h6v4h6M12 12v6h6"/>', check:'<path d="M5 12l4 4 10-10"/>',
  bookmark:'<path d="M6 4h12v17l-6-4-6 4z"/>', offline:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', aa:'<path d="M3 18l5-12 5 12M5 14h6M15 18v-5a2.5 2.5 0 0 1 5 0v5M15 15h5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>' };
const helpList = () => [...(registerHelp.m || new Map()).values()].sort((a, b) => (HELP_GROUPS.indexOf(a.group) + 1 || 99) - (HELP_GROUPS.indexOf(b.group) + 1 || 99) || a.order - b.order);
const helpNew = e => !!e.added && (Date.now() - Date.parse(e.added + "T00:00:00")) / 864e5 < 14;
const helpFmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
function helpScreen(){
  if (current && document.body.classList.contains("am-mode")) return ["ameilus", "Ameilus"];
  if (current) return ["flow", "Sugya Flow"];
  if (/^#\/classics/.test(location.hash)) return ["classics", "Classics"];
  return ["home", "Home"];
}
function helpRowHtml(e, open){
  const svg = `<svg viewBox="0 0 24 24" aria-hidden="true">${HELP_ICON[e.icon] || HELP_ICON.info}</svg>`, bid = "hp-b-" + esc(e.id);
  const kinds = e.kinds ? `<ul class="hp-kinds">${HELP_KINDS.map(([k, d]) => { const t = Object.values(TYPES).find(x => x.k === k); return t ? `<li class="hp-k" data-k="${k}"><i aria-hidden="true"></i><span><b>${esc(t.en)}</b>: ${esc(d)}</span></li>` : ""; }).join("")}</ul>` : "";
  const steps = e.steps.length ? `<ol class="hp-steps">${e.steps.map(s => `<li>${helpFmt(s)}</li>`).join("")}</ol>` : "";
  return `<div class="hp-item${open ? " open" : ""}" data-help="${esc(e.id)}"><button class="hp-row" type="button" aria-expanded="${!!open}" aria-controls="${bid}"><span class="hp-ic">${svg}</span><span class="hp-tx"><span class="hp-t">${esc(e.title)}${helpNew(e) ? `<span class="hp-new">New</span>` : ""}</span><span class="hp-s">${esc(e.sub || "")}</span></span><svg class="hp-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
    <div class="hp-body" id="${bid}"${open ? "" : " hidden"}>${steps}${kinds}${e.body.map(p => `<p>${helpFmt(p)}</p>`).join("")}${e.action ? `<button class="hp-act" type="button" data-help-act="${esc(e.id)}">${esc(e.action.label)}</button><span class="hp-msg" role="status"></span>` : ""}</div></div>`;
}
function helpHtml(){
  const [scr, scrName] = helpScreen(), all = helpList();
  const daf = scr === "flow" || scr === "ameilus", here = all.filter(e => e.where.includes(scr)).sort((a, c) => daf ? (c.group === "On the daf") - (a.group === "On the daf") : 0);
  const fresh = all.filter(e => helpNew(e) && !here.includes(e)), rest = all.filter(e => !here.includes(e) && !fresh.includes(e));
  const card = (list, first) => `<div class="hp-card">${list.map((e, i) => helpRowHtml(e, first && !i && e.open)).join("")}</div>`;
  const groups = [...new Set(rest.map(e => e.group))];
  return `<div class="hp" data-screen="${scr}">
    <h3 class="hp-gh">On this screen <small>${esc(scrName)}</small></h3>${card(here, true)}
    ${fresh.length ? `<h3 class="hp-gh">What’s new</h3>${card(fresh)}` : ""}
    ${groups.map(g => `<h3 class="hp-gh">${esc(g)}</h3>${card(rest.filter(e => e.group === g))}`).join("")}
    <p class="hp-foot">Still stuck? Email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p></div>`;
}
async function openHelp(){
  try { await Promise.race([amModule(), new Promise(r => setTimeout(r, 1500))]); } catch {} // the Ameilus topics live in ameilus/ui.js (saved with the app for offline use)
  openSheet("Help", helpHtml(), body => {
    body.addEventListener("click", e => {
      const act = e.target.closest("[data-help-act]");
      if (act) { const t = (registerHelp.m || new Map()).get(act.dataset.helpAct); if (!t || !t.action) return; const msg = t.action.run({ am: amMounted, close: closeSheet }); if (typeof msg === "string") { const m = act.nextElementSibling; if (m) m.textContent = msg; } return; }
      const row = e.target.closest(".hp-row"); if (!row) return;
      const box = row.nextElementSibling, open = row.getAttribute("aria-expanded") !== "true";
      row.setAttribute("aria-expanded", String(open)); row.parentElement.classList.toggle("open", open); box.hidden = !open;
    });
  });
  $("#sheet").classList.add("hp-sheet"); document.body.classList.add("help-open"); $("#helpBtn").setAttribute("aria-expanded", "true");
}
{
  const b = document.createElement("button");
  b.className = "iconbtn hp-q"; b.id = "helpBtn"; b.type = "button"; b.textContent = "?";
  b.setAttribute("aria-label", "Help"); b.title = "Help"; b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false");
  $("#settingsBtn").before(b);
  b.onclick = () => { if (!$("#sheet").hidden && $("#sheet").classList.contains("hp-sheet")) closeSheet(); else openHelp(); };
  // the panel look and the open state end when the sheet closes, or when another sheet takes its place
  new MutationObserver(() => { if ($("#sheet").hidden || $("#sheetTitle").textContent !== "Help") { $("#sheet").classList.remove("hp-sheet"); document.body.classList.remove("help-open"); b.setAttribute("aria-expanded", "false"); } }).observe($("#sheet"), { attributes: true, attributeFilter: ["hidden"], subtree: true, childList: true, characterData: true });
  globalThis.gcHelp = { list: helpList, open: openHelp, screen: helpScreen };
}
{
  // phone top bar: on a daf page (Sugya Flow, the amud chooser, Ameilus) the brand words give way to make room for ?; the daf name sets it
  const dafMark = () => document.body.classList.toggle("on-daf", !!current);
  new MutationObserver(dafMark).observe($("#refBtnText"), { childList: true, characterData: true, subtree: true }); dafMark();
}
