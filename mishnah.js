// Mishnah detection, done at display time from Sefaria's own section markers.
// No AI, no regeneration: a step is "Mishnah" when the text it quotes sits in the
// Mishnah portion of the amud (from מתני׳ up to the next גמ׳; a Mishnah can carry
// over from the previous amud). Gemara quotes of the Mishnah (תנן, תנינא, …) sit in
// the Gemara portion, so they are not marked.
const NIKUD = /[\u0591-\u05C7]/g;
const stripTags = s => String(s || "").replace(/<[^>]+>/g, " ").replace(/&[#a-z0-9]+;/gi, " ");
/** Hebrew letters only: no vowels, punctuation, spaces or markup, so editions line up. */
export const letters = s => stripTags(s).replace(NIKUD, "").replace(/[^\u05D0-\u05EA]/g, "");

/** "mishnah" when a segment opens with מתני׳, "gemara" when it opens with גמ׳, else null. */
export function segmentMarker(seg){
  const h = stripTags(seg).replace(NIKUD, "").replace(/^[\s([\u200f\u200e]+/, "");
  if (/^מתני[׳'’]/.test(h)) return "mishnah";
  if (/^גמ[׳'’]/.test(h)) return "gemara";
  return null;
}
/** The state the amud's last marker leaves behind: true (Mishnah), false (Gemara), null (no marker). */
export function endState(segs){
  let st = null;
  for (const s of segs || []) { const k = segmentMarker(s); if (k) st = k === "mishnah"; }
  return st;
}
/** One flag per segment. startInMishnah: is the amud's opening text still Mishnah? */
export function segmentFlags(segs, startInMishnah){
  let on = !!startInMishnah;
  return (segs || []).map(s => { const k = segmentMarker(s); if (k) on = k === "mishnah"; return on; });
}
/** For each step, true when most of the text it quotes sits in a Mishnah segment. */
export function stepFlags(steps, segs, segFlags){
  const out = (steps || []).map(() => false);
  if (!segFlags || !segFlags.some(Boolean)) return out;           // no Mishnah on this amud
  let stream = ""; const marks = [];
  (segs || []).forEach((s, k) => { const L = letters(s); stream += L; for (let j = 0; j < L.length; j++) marks.push(segFlags[k] ? 1 : 0); });
  const found = (steps || []).map(() => null);
  let cursor = 0;
  (steps || []).forEach((st, k) => {
    const phrases = (st.phrases || []).map(p => letters(p && p.aramaic)).filter(Boolean);
    const all = phrases.join(""); if (all.length < 3) return;
    const key = all.slice(0, 24);
    let pos = stream.indexOf(key, cursor);
    if (pos < 0) pos = stream.indexOf(key);
    let len = all.length;
    if (pos < 0) { // the opening words differ (an abridged or restored quote): try each phrase in turn
      for (const p of phrases) { if (p.length < 6) continue; const q = stream.indexOf(p.slice(0, 24), cursor); if (q >= 0) { pos = q; len = p.length; break; } }
    }
    if (pos < 0) return;
    const end = Math.min(pos + len, stream.length);
    let m = 0; for (let j = pos; j < end; j++) m += marks[j];
    found[k] = end > pos && m / (end - pos) >= 0.5;
    cursor = pos + Math.max(1, Math.floor((end - pos) * 0.8));
  });
  const located = found.filter(v => v !== null).length;
  found.forEach((v, k) => {
    if (v !== null) { out[k] = v; return; }
    if (!located) { out[k] = steps[k].macroPhase === "mishnah"; return; } // nothing lined up: fall back on the breakdown's own phase
    let a = null, b = null;
    for (let j = k - 1; j >= 0; j--) if (found[j] !== null) { a = found[j]; break; }
    for (let j = k + 1; j < found.length; j++) if (found[j] !== null) { b = found[j]; break; }
    out[k] = a === true && b === true;                                // unplaced step between two Mishnah steps
  });
  return out;
}
