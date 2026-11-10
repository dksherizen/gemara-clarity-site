// Ameilus v3 core: pure functions over Gemara Clarity step data (data/b/<id>.json).
// No DOM, no network. Shared by the UI (ui.js) and the unit tests (test/*.test.mjs).
import { AMW } from "./words.js?v=3.7.0";
// marking a real break before the passage's end (David's wording, Oct 14 2026; unit renamed "passage" Oct 15 2026); the walkthrough quotes it too
export const NEAR_MISS_TEXT = AMW.nearMiss;
export const NIK = /[\u0591-\u05C7]/g;
export const unvowel = t => String(t || "").replace(/\u05BE/g, " ").replace(NIK, "");
const HEB = /[\u05D0-\u05EA]/;
const LEAD = /^[״"“”'‘(\[]+/;
const TRAIL = /[,.:;?!״"“”'’)\]—–]+$/;

/** Every word of the amud in order: v = vowelled word, raw = unvowelled, lead/trail = punctuation
 *  around it in our (vocalized) edition, s = step index, ph = phrase index. */
export function tokenize(steps){
  const out = [];
  (steps || []).forEach((st, s) => (st.phrases || []).forEach((p, ph) => {
    String(p.aramaic || "").replace(/<[^>]+>/g, " ").replace(/\u05BE/g, " ").split(/\s+/).filter(Boolean).forEach(frag => {
      if (!HEB.test(frag)) { const last = out[out.length - 1]; if (last && last.s === s) last.trail += frag; return; }
      const lead = (frag.match(LEAD) || [""])[0];
      let rest = frag.slice(lead.length);
      const trail = (rest.match(TRAIL) || [""])[0];
      const v = rest.slice(0, rest.length - trail.length);
      out.push({ v, raw: unvowel(v), lead, trail, s, ph });
    });
  }));
  return out;
}

export function stepRanges(tokens, nSteps){
  const r = Array.from({ length: nSteps }, () => ({ start: -1, end: -1 }));
  tokens.forEach((t, i) => { const x = r[t.s]; if (x.start < 0) x.start = i; x.end = i; });
  return r; // end is the index of the step's LAST token (inclusive)
}

const bareRaw = w => String(w || "").replace(/[\u05F3\u05F4'"]/g, "");
const strip1 = w => (w.length > 2 && /^[ודה]/.test(w)) ? w.slice(1) : w;
// words that introduce speech or a quotation: a colon after them is not the end of anything
const SPEECH = new Set(["אמר","אמרו","אומר","אומרים","אמרי","קאמר","קאמרי","אמרה","אמרת","אמרינן","תנן","תנא","תניא","תנינא","כתיב","שנאמר","דכתיב","קתני","מתני׳","מתני","גמ׳","גמ","תנו","רבנן","לומר","קרא","משמע","איבעיא","להו","בעא","מיניה","בעי","מיתיבי","איתיביה","ליה","להו","לו","לה","שאלו","ושאלו","שאל","מאי","דתנן","דתניא","והתניא","והתנן","תאני","מתיב","מתקיף","לה","כדתניא","כדתנן","בלשון","בשם","אמרתי"]);
// a new voice: a speaker or a strong turn in the argument
const VOICE_START = /^(ו?(רב|רבי|רבן|רבה|רבא|אביי|שמואל|רבנן|חכמים|רבינא|בית|ר׳|ת״ק|תנא|מר|אמר|אמרי|אמרו|מיתיבי|איתיביה|אלא|והא|והתניא|והתנן|תא|מי|הכי|איבעיא|מתיב|מתקיף|דתניא|תניא|תנו|ואידך|ורמינהו|ורמי|לימא|נימא|למימרא|ומאי|מאי|אמאי|ממאי|במאי|הא|ההיא|התם|הכא|דילמא|ודילמא|דאמר|כדאמר|כדתניא|כדרב|וכדרב|גופא|מנא|מנהני|מנלן|תיובתא|קשיא|ש״מ))$/;

// names that follow רב/רבי/בר/בן in our data (built from all of Shas), used only to spot
// attribution chains like "אמר רבי לוי בר חמא, אמר רבי שמעון בן לקיש:" which are not breaks
const NAMEW = new Set(["אבא", "אבדימי", "אבהו", "אבודימי", "אבוה", "אבויה", "אבטולמוס", "אביי", "אבין", "אבינא", "אבישלום", "אביתר", "אדא", "אדרב", "אהבה", "אהילאי", "אהינא", "אווזא", "אויא", "אוריין", "אושעיא", "אחא", "אחאי", "אחדבוי", "אחייה", "אחיקם", "אחלי", "אחתיה", "איבו", "אידי", "אייבו", "אילא", "אילעא", "אילעאי", "אילעי", "איניא", "איסק", "איקא", "אליעזר", "אליקים", "אלישיב", "אלכסנדרי", "אלעא", "אלעאי", "אלעזר", "אלעי", "אלעשה", "אמון", "אמוץ", "אמי", "אמימר", "אמתך", "אנטיגנוס", "אסי", "אפטוריקי", "אפס", "אשי", "אשיאן", "בבא", "בג", "בוזי", "בוטא", "בזפק", "בטוענו", "בטנית", "ביבי", "ביזנא", "ביחוד", "ביסא", "ביסנא", "בנאה", "בנימין", "ברונא", "ברוקא", "ברוקה", "ברכאל", "ברכיה", "בתירא", "בתירה", "גביהא", "גביהה", "גדא", "גובריה", "גודגדא", "גוזלא", "גומל", "גוריא", "גוריון", "גידל", "גיורי", "גמדא", "גמלא", "גמליאל", "גרא", "דהבאי", "דהוות", "דוסא", "דוסתאי", "דורמסקית", "דימי", "דרוסאי", "הדיא", "הונא", "הורקנוס", "הושעיא", "הילל", "הכות", "הלל", "המדורי", "המנונא", "המשולם", "הקנה", "הקצב", "הרכינס", "וולס", "ומטו", "ושכשיכי", "זבדא", "זבדי", "זביד", "זבידא", "זוגו", "זוטרא", "זומא", "זונין", "זימרא", "זירא", "זירוד", "זכאי", "זכריה", "זעירא", "זריקא", "חבו", "חביבא", "חביבי", "חגא", "חגית", "חוני", "חורין", "חזקיה", "חידקא", "חייא", "חיננא", "חכינאי", "חכליה", "חלבו", "חלוצה", "חלפתא", "חלקיה", "חמא", "חנא", "חנה", "חנילאי", "חנין", "חנינא", "חנן", "חננאל", "חנניא", "חנניה", "חסדא", "חצרון", "חרסום", "טבאי", "טבחים", "טבי", "טביומי", "טבלא", "טברימון", "טובי", "טוביא", "טוביה", "טרפון", "יאיר", "יאשיה", "יברכיה", "יהודה", "יהוידע", "יהוצדק", "יהושע", "יוחאי", "יוחי", "יוחנן", "יומו", "יונתן", "יוסי", "יוסף", "יועזר", "יחזקאל", "יחיאל", "ייבא", "יימר", "ינאי", "יעקב", "יפנה", "יפת", "יצחק", "ירמיה", "ישבב", "ישי", "ישמעאל", "כהנא", "כרוספדאי", "כשהיינו", "לוי", "לחייא", "ליואי", "ליש", "לקוניא", "לקיש", "לקישא", "מאיר", "מארי", "מהבאי", "מהללאל", "מונא", "מחווניתא", "מחסיא", "מיאשא", "מיישא", "מלאי", "מלכיא", "מלכיו", "ממטללתא", "ממל", "מנוח", "מנחם", "מני", "מניומי", "מנימין", "מנסיא", "מנשיא", "מערבא", "מרדכי", "מרי", "מריון", "מרימר", "מרינוס", "מרתא", "משרשיא", "מתון", "מתיא", "מתנא", "נבט", "נהוראי", "נון", "נורי", "נחומי", "נחוניא", "נחמיה", "נחמן", "נחמני", "נכר", "נמשי", "ננס", "נקוסא", "נראין", "נתן", "סוסיא", "סורר", "סחורה", "סימאי", "סימון", "סיסין", "סירא", "סלא", "סמא", "ספרא", "עוזיאל", "עויא", "עוירא", "עולא", "עוקבא", "עזאי", "עזריה", "עילאי", "עיליש", "עמרי", "עמרם", "ענן", "עקביא", "עקיבא", "עשורי", "פדא", "פדת", "פועירה", "פזי", "פחתי", "פטיש", "פלוניתא", "פלניתא", "פנחס", "פסיסא", "פפא", "פפי", "פפייס", "פקועה", "פרחיה", "פרטא", "פרידא", "פריץ", "פרנך", "פרנסני", "צדוק", "צרויה", "קבוטל", "קטין", "קטינא", "קטלא", "קיסי", "קיסמא", "קיסנא", "קיש", "קמחית", "קמצר", "קנז", "קפוסאי", "קפרא", "קרחה", "רבא", "רבה", "רבינא", "רועץ", "רחומי", "רשיעא", "שבתאי", "שבתי", "שטח", "שיזבי", "שילא", "שילת", "שימי", "שישא", "שלמיא", "שלמיה", "שלמן", "שמאי", "שמואל", "שמוטת", "שמוע", "שמלאי", "שמעון", "שמעיה", "שפטיה", "שרביא", "ששון", "ששת", "תדאי", "תחליפא", "תנחום", "תרדיון", "תשע"]);
const ATTR_W = new Set(["אמר","ואמר","דאמר","אמרי","ואמרי","תני","ותני","תנא","רב","רבי","רבן","ורב","ורבי","ר׳","בר","בן","ברבי","ואיתימא","איתימא","מר","משום","מרבי","בשם","הזקן","הגדול","הכהן","הבבלי","וחבריו","דבי","תנא","בריה","דרב","דרבי","קמיה","מקמי"]);
function isAttribution(words){
  if (words.length < 2 || words.length > 12) return false;
  if (!/^(ו|ד)?(אמר|אמרי|תני|תנא)$/.test(words[0])) return false;
  return words.slice(1).every(w => ATTR_W.has(w) || NAMEW.has(w) || NAMEW.has(w.replace(/^[ודל]/, "")));
}

/** Where a learner may end a passage: 'step' = our split; 'sentence' = a sentence ends in our
 *  punctuation (. ? ! ; and : unless it introduces speech or a quote); 'voice' = a comma or dash
 *  right before a new speaker or a new move. Returns an array (same length as tokens) of kind|null. */
export function breakKinds(tokens){
  const k = new Array(tokens.length).fill(null);
  tokens.forEach((t, i) => {
    const next = tokens[i + 1];
    if (!next) { k[i] = "step"; return; }
    if (next.s !== t.s) { k[i] = "step"; return; }
    const tr = t.trail.replace(/[״"“”'’)\]]/g, "");
    const w = bareRaw(t.raw), w1 = strip1(w);
    const nraw = bareRaw(next.raw);
    if (/[.?!;]/.test(tr)) { k[i] = "sentence"; return; }
    // A colon in our edition introduces what follows (speech, a quote, an explanation, a list:
    // "תא שמע:", "אמר ליה רב לרבי חייא:", "לא קשיא:"), so the statement goes on past it. Measured
    // across all 5,349 amudim on Oct 14 2026: 18,028 colons, nearly all of them introductions.
    if (tr.includes(":")) return;
    if (/[,—–]/.test(tr) && VOICE_START.test(nraw)) {
      // a following name only counts as a new voice when a verb of saying follows within 3 words
      const name = /^ו?(רב|רבי|רבן|רבה|רבא|אביי|שמואל|רבנן|חכמים|רבינא|בית|ר׳|מר|ת״ק)$/.test(nraw);
      if (name) {
        const look = tokens.slice(i + 2, i + 5).filter(x => x.s === t.s).map(x => bareRaw(x.raw));
        if (!look.some(x => /^ו?(אמר|אומר|אומרים|אמרו|סבר|סברי|דאמר)$/.test(x))) return;
      }
      k[i] = "voice";
    }
  });
  // a break needs at least two words since the previous break (no "אלא," on its own), and an
  // attribution chain ("אמר רבי X בר Y:") is never a passage by itself
  let last = -1;
  for (let i = 0; i < k.length; i++) {
    if (!k[i]) continue;
    let stepStart = i; while (stepStart > 0 && tokens[stepStart - 1].s === tokens[i].s) stepStart--;
    const prevB = (last >= stepStart) ? last : stepStart - 1;
    if (k[i] !== "step") {
      const seg = tokens.slice(prevB + 1, i + 1).map(x => bareRaw(x.raw));
      if (seg.length < 2 || isAttribution(seg)) { k[i] = null; continue; }
    }
    last = i;
  }
  return k;
}

const NUM = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
export const nw = (n, w) => `${NUM[n] || n} ${w}${n === 1 ? "" : "s"}`;

/** Judge the learner's end marker. pos = first token not yet carved off; mark = index of the
 *  last word of the learner's passage. Never says "wrong": it says what kind of break this is. */
export function evaluateMark(tokens, kinds, ranges, pos, mark){
  if (mark == null || mark < pos || mark >= tokens.length) return { ok: false, kind: "invalid", text: "Tap a word in the part you haven't done yet." };
  const cur = tokens[pos].s, end = ranges[cur].end;
  const kind = kinds[mark];
  const w = i => tokens[i] ? tokens[i].v : "";
  if (kind) {
    const passed = [];
    for (let s = cur; s < ranges.length && ranges[s].end <= mark; s++) passed.push(s);
    if (mark === end) return { ok: true, kind, rel: "exact", carveTo: mark, completes: passed, text: "Same place we split it." };
    if (mark < end) return { ok: true, kind, rel: "inner", carveTo: mark, completes: passed,
      text: NEAR_MISS_TEXT }; // wording from David, Oct 14 2026 (same for a new voice or a sentence end)
    // v99z (reading A; scope ruling Oct 18 2026): the passages strictly between the current one and the tapped one are unmarked, skipped over.
    // One or more: the tap marks nothing (the current passage included) and counts nothing, and says so. None: the beyond path below, unchanged.
    const skipped = []; for (let s = cur + 1; s < tokens[mark].s; s++) skipped.push(s);
    if (skipped.length) return { ok: false, kind, rel: "skipped", n: skipped.length, skipped, text: AMW.skipped(skipped.length) };
    return { ok: true, kind, rel: "beyond", carveTo: mark, completes: passed, n: passed.length,
      text: AMW.beyond(w(end), passed.length + (ranges[tokens[mark].s].end === mark ? 0 : 1)) };
  }
  let nextBreak = pos; while (nextBreak < tokens.length && !kinds[nextBreak]) nextBreak++;
  if (mark < nextBreak) return { ok: false, kind: null, rel: "short", text: AMW.notYet };
  return { ok: false, kind: null, rel: "long", text: "That runs past a break. Look a little earlier." };
}

/** Hints (Oct 15 2026, David): every hint is its own option, usable in any order, never a ladder.
 *  Vowels and punctuation are PAGE-WIDE on/off toggles over the whole amud (a hint shown only on the
 *  current passage stops at its last word and gives the split away). Signal word and reveal are per passage. */
export const HINTS = { page: ["vowels", "punct"], piece: ["signal", "head", "reveal"] };
export const HINT_LABEL = { vowels: "Vowels", punct: "Punctuation", signal: "Signal word", head: "Head start", reveal: "Show where it ends" };

/** What one word of the daf shows. Done words always show our edition; for every other word the
 *  page-wide toggles decide, the same for every word, so nothing marks where a passage ends.
 *  o = { pos, vowels, punct, bare, vowelWord:Set } */
export function wordView(t, i, o){
  const done = i < o.pos;
  const showP = done || (!!o.punct && !o.bare);
  const showV = done || (!!o.vowels && !o.bare) || !!(o.vowelWord && o.vowelWord.has(i));
  return { showP, showV, text: (showP ? t.lead : "") + (showV ? t.v : t.raw) + (showP ? t.trail : "") };
}

/** "Redo this passage": back to the end of the last finished passage; inner cuts in the current passage go. */
export function resetPiece(st, ranges){
  let pos = 0;
  Object.keys(st.done).forEach(s => { if (ranges[s] && ranges[s].end >= 0) pos = Math.max(pos, ranges[s].end + 1); });
  return { ...st, pos, cuts: st.cuts.filter(c => c < pos), tries: 0 };
}

/** Passages done on your own = finished without "Show where it ends". Vowels, punctuation and the
 *  signal word don't count against you. */
export const ownCount = done => Object.values(done || {}).filter(d => d && d.own).length;

/** Glossary lookup with the common one-letter prefixes (ו ד ה ב ל כ מ ש) peeled off, longest form first. */
const PREFIX_EN = { "ו": "and", "ד": "that / of", "ה": "the", "ב": "in", "ל": "to", "כ": "like", "מ": "from", "ש": "that" };
const NO_PEEL = new Set(["שמאי","מתנא","לואי","מאמר","משכן","מלא","מתא","שתא","שבתא","שמתא","מדרש","שפחות","שלומי","מלתא","מלאי"]); // whole words that only look prefixed (שמאי is Shammai, not ש + מאי)
export function lookupGloss(gloss, raw){
  const w = String(raw || "").replace(/[\u05F3\u05F4]/g, m => m);
  if (!gloss) return null;
  if (gloss[w]) return { form: w, prefix: "", entry: gloss[w] };
  let rest = w, pre = "";
  for (let k = 0; k < 2 && rest.length > 2; k++) {
    if (NO_PEEL.has(rest)) break;
    const c = rest[0]; if (!PREFIX_EN[c]) break;
    pre += c; rest = rest.slice(1);
    if (gloss[rest]) return { form: rest, prefix: pre, prefixEn: [...pre].map(x => PREFIX_EN[x]).join(" + "), entry: gloss[rest] };
  }
  return null;
}

/** Longest glossary phrase (3, 2, then 1 words) starting at token i. */
export function phraseAt(gloss, tokens, i, maxLen = 3){
  for (let n = maxLen; n >= 1; n--) {
    if (i + n > tokens.length) continue;
    const seq = tokens.slice(i, i + n);
    if (seq.some(t => t.s !== tokens[i].s)) continue;
    const form = seq.map(t => t.raw).join(" ");
    if (gloss[form]) return { form, n, entry: gloss[form] };
    if (n === 1) { const g = lookupGloss(gloss, form); if (g) return { form: g.form, n: 1, entry: g.entry, prefix: g.prefix }; }
  }
  return null;
}

const SIGNAL_TYPES = new Set(["formula", "connective", "question"]);
/** The signal word that opens this passage (what kind of move it is), never what it says.
 *  Falls back to the signal that opens the NEXT passage. entry = [he, gloss, use, type]. */
export function signalFor(gloss, tokens, ranges, pos){
  const s = tokens[pos].s;
  const look = (from, to, where) => {
    for (let i = from; i <= Math.min(to, from + 2); i++) {
      const hit = phraseAt(gloss, tokens, i);
      if (hit && SIGNAL_TYPES.has(hit.entry[3]) && hit.entry[2]) return { where, at: i, ...hit };
    }
    return null;
  };
  return look(pos, ranges[s].end, "this");
}

/** The signal-word hint as words for the learner. It names the word, what it means and how it is
 *  used, and nothing about where the passage ends: a signal at the opening of this passage is highlighted
 *  (it says what kind of move this is); one further on is named but never pointed at, since pointing
 *  at it would mark the split. -> { text, at: token index to highlight or null, where } */
export function signalHint(gloss, tokens, ranges, pos){
  const sg = signalFor(gloss, tokens, ranges, pos);
  if (!sg) return { text: "Read it aloud: who is talking, and where do they stop?", at: null, where: null };
  const he = sg.entry[0] || sg.form;
  if (sg.where === "this") return { text: `${he}: “${sg.entry[1]}.” ${sg.entry[2]}`, at: sg.at, where: "this" };
  return { text: `A signal word to know here: ${he} (“${sg.entry[1]}”). ${sg.entry[2]}`, at: null, where: "next" };
}

/** v102 "Head start" v2 (hint item 4; full first phrase, ruled Oct 19 2026): the first phrase of the CURRENT passage, with its English
 *  when it fits, and never the passage's end. The current passage runs from the live pointer pos (the range Signal word and Show where
 *  it ends use, which can begin inside a step after an inner carve) to the last word of its step. The phrase is the step's phrase at
 *  the pointer (phrases[0] on a fresh passage; after a carve that lands on a phrase edge, the phrase that starts there), aligned to the
 *  amud's word stream by its stripped text (no vowels, no marks); the words shown are the stream's own words, with their vowels.
 *  With the Punctuation hint off (o.punct falsy, the default) no word carries a leading or trailing mark (HEAD_BARE); with it on,
 *  each word keeps its punctuation exactly as on the amud. The switch changes only the Hebrew text, never the English or which case.
 *    "en"    the pointer starts the phrase, the phrase ends before the passage's last word, its English is there, and
 *            phrase words * 2 <= words left in the passage: the whole phrase with its English (trailing ,.;: and dashes trimmed)
 *    "over"  the same, but the phrase is more than half of what is left: the whole phrase, Hebrew only
 *    "noen"  the phrase has no English: the whole phrase, Hebrew only (no English is ever borrowed or made up)
 *    "mid"   the pointer sits inside a phrase: from the pointer to that phrase's end, Hebrew only (its English covers words already passed)
 *    "end"   the phrase (from the pointer) reaches the passage's last word, or runs past it: END PROTECTION, Hebrew only, at most
 *            HEAD_END_MAX opening words and never the passage's last word
 *    "fail"  the phrase cannot be matched to the word stream: Hebrew only, the opening words under the same end protection, and a
 *            console warning for repair
 *  Fewer than HEAD_MIN words left (a one-word passage, or one word left after a carve): nothing is shown, headStart returns null and
 *  the button is off (headOff), since that word would be the passage's end itself.
 *  No word past the passage's end is ever shown. Free like the Signal word: it changes no saved state and never counts against
 *  "on your own". -> { he, en, how, mid: pos is inside a phrase, n: words shown, cross: the phrase runs past the passage's end } */
export const HEAD_END_MAX = 3;
export const HEAD_MIN = 2; // fewer words than this left in the current passage: no Head start (the button is off)
export const headOff = (tokens, ranges, pos) => !(pos >= 0 && pos < tokens.length) || ranges[tokens[pos].s].end - pos + 1 < HEAD_MIN;
// a word without its marks: quote marks, brackets, dashes and an ellipsis at its start; , . : ; ? ! quote marks, brackets, dashes and an ellipsis at its end;
// a geresh that opens a quoted word goes with its closing geresh, while an abbreviation's geresh (גמ׳ מתני׳ וכו׳ ר׳) is part of the word and stays
export const HEAD_BARE = w => { const q = /^[״"“”'‘(\[—–…]*׳/.test(w); return w.replace(q ? /^[״"“”'‘(\[—–…׳]+/ : /^[״"“”'‘(\[—–…]+/, "").replace(q ? /[,.:;?!״"“”'’)\]—–…׳]+$/ : /[,.:;?!״"“”'’)\]—–…]+$/, ""); };
// a phrase's words by stripped text, split exactly as tokenize splits the amud (only fragments with a Hebrew letter are words)
const phraseWords = p => String((p && p.aramaic) || "").replace(/<[^>]+>/g, " ").replace(/\u05BE/g, " ").split(/\s+/).filter(f => HEB.test(f)).map(f => { const lead = (f.match(LEAD) || [""])[0], rest = f.slice(lead.length), trail = (rest.match(TRAIL) || [""])[0]; return unvowel(rest.slice(0, rest.length - trail.length)); });
export function headStart(steps, tokens, ranges, pos, o){
  if (!(pos >= 0 && pos < tokens.length)) return null;
  const s = tokens[pos].s, k = tokens[pos].ph, end = ranges[s].end, left = end - pos + 1;
  if (left < HEAD_MIN) return null; // one word left: showing it would show the passage's end
  let ps = pos; while (ps > 0 && tokens[ps - 1].s === s && tokens[ps - 1].ph === k) ps--;
  const mid = ps < pos, ph = ((steps[s] && steps[s].phrases) || [])[k], words = phraseWords(ph);
  const fit = words.length > 0 && words.every((w, j) => tokens[ps + j] && tokens[ps + j].raw === w);
  const pe = ps + words.length - 1, cross = fit && pe > end;
  const word = t => o && o.punct ? t.lead + t.v + t.trail : HEAD_BARE(t.v);
  const out = (how, last, en) => ({ he: tokens.slice(pos, last + 1).map(word).join(" "), en, how, mid, n: last - pos + 1, cross });
  const guard = how => out(how, pos + Math.min(HEAD_END_MAX, left - 1) - 1, ""); // never the passage's last word
  if (!fit) { if (typeof console !== "undefined") console.warn("Head start: phrase not matched to the amud", s, k); return guard("fail"); }
  if (pe >= end) return guard("end");
  if (mid) return out("mid", pe, "");
  const en = String((ph && ph.english) || "").trim().replace(/[\s,.;:\u2014\u2013-]+$/, "");
  if (!en) return out("noen", pe, "");
  return (pe - pos + 1) * 2 <= left ? out("en", pe, en) : out("over", pe, "");
}
export const headLine = h => h ? `Head start: ${h.he}${h.en ? " - " + h.en : ""}` : "";

const KIND_Q = {
  "קשיא": "Who is this attacking?",
  "ראיה": "What is this brought to support?",
  "תירוץ": "Which challenge does this answer?",
  "דחיה": "Which challenge or proof is this pushing back on?",
  "תשובה": "Which question does this answer?"
};
const heWords = t => new Set(String(t || "").replace(NIK, "").split(/[^\u05D0-\u05EA׳״]+/).filter(w => w.length > 1));
function sameTarget(a, b){
  const A = heWords(a), B = heWords(b);
  if (!A.size || !B.size) return a.trim().toLowerCase() === b.trim().toLowerCase();
  let inter = 0; A.forEach(x => { if (B.has(x)) inter++; });
  return inter / Math.min(A.size, B.size) >= 0.75;
}
export const openingOf = (step, n = 5) => {
  const ws = unvowel((step.phrases || []).map(p => p.aramaic).join(" ")).replace(/[,.:;?!—–()\[\]״"“”]/g, " ").split(/\s+/).filter(Boolean);
  return ws.slice(0, n).join(" ") + (ws.length > n ? " …" : "");
};

/** "Who is this attacking?": a one-tap check built only from our data, or null when the data
 *  can't support a fair question. Options are deterministic (step order). */
export function attackCheck(steps, si){
  const st = steps[si]; if (!st) return null;
  const kind = st.hebrewStepName, q = KIND_Q[kind];
  if (!q) return null;
  // 1) a challenge whose target we recorded: "whose view is it going after?". Only when the
  //    targets name different sages, so two options can't both be right in other words.
  const nameKey = t => [...heWords(t)].filter(w => NAMEW.has(w) || NAMEW.has(w.replace(/^[ודל]/, "")) || /^(בית|שמאי|הלל|חכמים|רבנן)$/.test(w)).filter(w => !/^(רב|רבי|רבן|בר|בן)$/.test(w)).sort().join(" ");
  if (kind === "קשיא" && st.kashyaTarget && nameKey(st.kashyaTarget)) {
    const groups = [];
    steps.forEach((o, oi) => {
      // only targets already met (no spoilers from later on the amud), and no internal step references
      if (!o.kashyaTarget || oi > si || /\bsteps? \d+/i.test(o.kashyaTarget)) return;
      const key = nameKey(o.kashyaTarget); if (!key) return;
      const ks = key.split(" ");
      const g = groups.find(g => g.key === key);
      if (g) { g.members.push(oi); return; }
      const clash = groups.find(g => g.key.split(" ").some(w => ks.includes(w)));
      if (clash) { clash.ambiguous = true; return; } // overlapping names: not a fair either/or
      groups.push({ key, label: o.kashyaTarget, members: [oi], first: oi });
    });
    const mine = groups.find(g => g.members.includes(si));
    const fair = groups.filter(g => g !== mine && !g.ambiguous);
    if (mine && !mine.ambiguous && fair.length >= 1) {
      const others = fair.sort((a, b) => Math.abs(a.first - si) - Math.abs(b.first - si)).slice(0, 2);
      const opts = [mine, ...others].sort((a, b) => a.first - b.first).map(g => ({ label: g === mine ? st.kashyaTarget : g.label, ok: g === mine }));
      return { q, source: "kashyaTarget", options: opts, answer: st.kashyaTarget };
    }
  }
  // 2) which earlier step it hangs on (dependsOnStepNumbers)
  const n = st.stepNumber, deps = (st.dependsOnStepNumbers || []).filter(d => d < n);
  if (!deps.length) return null;
  const pool = { "תירוץ": ["קשיא", "שאלה"], "דחיה": ["קשיא", "ראיה"], "תשובה": ["שאלה"], "קשיא": ["מימרא", "תשובה", "תירוץ", "דחיה", "ראיה"] }[kind] || ["מימרא", "תשובה", "תירוץ", "קשיא", "שאלה", "ראיה", "דחיה"];
  const prior = steps.filter(o => o.stepNumber < n && pool.includes(o.hebrewStepName));
  const byN = new Map(steps.map(o => [o.stepNumber, o]));
  // walk up the dependencies level by level until we reach steps of the right kind
  // (a challenge that hangs on an earlier challenge is really attacking what that one attacked)
  let level = deps, primary = null, seen = new Set();
  for (let k = 0; k < 4 && level.length && !primary; k++) {
    primary = prior.filter(o => level.includes(o.stepNumber)).sort((a, b) => b.stepNumber - a.stepNumber)[0] || null;
    if (kind !== "קשיא") break;
    const nxt = [];
    level.forEach(d => { if (seen.has(d)) return; seen.add(d); const o = byN.get(d); if (o) (o.dependsOnStepNumbers || []).forEach(x => { if (x < d) nxt.push(x); }); });
    level = nxt;
  }
  if (!primary) return null;
  // labels are the opening words, lengthened until they differ from this step and from each other
  const labelFor = (o, others) => { for (let k = 5; k <= 10; k++) { const l = openingOf(o, k); if (!others.some(x => openingOf(x, k) === l)) return l; } return null; };
  if (!labelFor(primary, [st])) return null;
  // the obvious case (an answer to the line right before it) isn't worth a question
  if (kind !== "קשיא" && primary.stepNumber === n - 1 && steps[si - 1] && steps[si - 1].stepNumber === n - 1) return null;
  // a proof is brought to support a claim: when its target is itself a proof, push-back or challenge, no check
  if (kind === "ראיה" && !["מימרא", "שאלה", "תשובה", "תירוץ"].includes(primary.hebrewStepName)) return null;
  // distractors come from other branches: never something the right answer itself rests on
  const byNum = new Map(steps.map(o => [o.stepNumber, o]));
  const chain = new Set(deps); const walk = x => (x.dependsOnStepNumbers || []).forEach(d => { if (!chain.has(d) && byNum.has(d) && d < x.stepNumber) { chain.add(d); walk(byNum.get(d)); } });
  walk(primary); deps.forEach(d => byNum.has(d) && walk(byNum.get(d)));
  const distract = prior.filter(o => !chain.has(o.stepNumber) && labelFor(o, [st, primary]))
    .sort((a, b) => Math.abs(a.stepNumber - primary.stepNumber) - Math.abs(b.stepNumber - primary.stepNumber)).slice(0, 2);
  if (distract.length < 1 || (kind !== "תירוץ" && kind !== "דחיה" && kind !== "תשובה" && distract.length < 2)) return null;
  const chosen = [primary, ...distract].sort((a, b) => a.stepNumber - b.stepNumber);
  const opts = chosen.map(o => ({ label: labelFor(o, [st, ...chosen.filter(x => x !== o)]), step: o.stepNumber, ok: o === primary }));
  if (opts.some(o => !o.label)) return null;
  return { q, source: "dependsOn", options: opts, answer: opts.find(o => o.ok).label, answerStep: primary.stepNumber };
}

/** Sugya map as a tree. A response (challenge, push-back, answer, proof, reply) hangs one level
 *  under what it responds to; a statement or question that simply continues stays level. A
 *  challenge that rests on an earlier challenge hangs where that one did (they attack the same thing). */
const RESPONSE = new Set(["קשיא", "דחיה", "תירוץ", "תשובה", "ראיה"]);
export function mapTree(steps){
  const byNum = new Map(steps.map((s, i) => [s.stepNumber, i]));
  const depth = [];
  const anchor = s => {
    let deps = (s.dependsOnStepNumbers || []).filter(d => d < s.stepNumber && byNum.has(d));
    if (s.hebrewStepName === "קשיא") {
      for (let k = 0; k < 4 && deps.length; k++) {
        const ok = deps.filter(d => !["קשיא", "שאלה"].includes(steps[byNum.get(d)].hebrewStepName));
        if (ok.length) { deps = ok; break; }
        deps = [...new Set(deps.flatMap(d => (steps[byNum.get(d)].dependsOnStepNumbers || []).filter(x => x < d && byNum.has(x))))];
      }
    }
    return deps.length ? byNum.get(Math.max(...deps)) : null;
  };
  return steps.map((s, i) => {
    const parent = anchor(s);
    depth[i] = parent == null ? 0 : Math.min(6, depth[parent] + (RESPONSE.has(s.hebrewStepName) ? 1 : 0));
    return { i, n: s.stepNumber, parent, depth: depth[i], kind: s.hebrewStepName, phase: s.macroPhase || "", opens: s.branchRole === "opens_new_branch" };
  });
}

export const KIND_CLASS = { "מימרא": "mimra", "קשיא": "kashya", "תירוץ": "terutz", "ראיה": "raaya", "דחיה": "dechiya", "שאלה": "sheelah", "תשובה": "teshuvah", "מסקנא": "maskana" };
export const KIND_EN = { "מימרא": "Statement", "קשיא": "Challenge", "תירוץ": "Answer", "ראיה": "Proof", "דחיה": "Push-back", "שאלה": "Question", "תשובה": "Reply", "מסקנא": "Conclusion" };
export const PHASE_EN = { mishnah: "Mishnah", opening_question: "Opening question", source_derivation: "Finding the source", objection_defense_cycle: "Challenge and defense", alternate_branch: "Another approach", clarification_of_terms: "Defining terms", narrative_aggadah: "Story", conclusion: "Conclusion" };
