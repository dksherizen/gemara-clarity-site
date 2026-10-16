// Ameilus: the words it uses about itself, in ONE table (Oct 15 2026).
// The unit the learner marks is a "passage" (David chose the word Oct 14 2026 10:23 PM ET, via Instinct, room #550).
// Every learner-facing mention of the unit lives here: the home paths, the amud chooser, the walkthrough, the reading
// screen's prompts, counters, hint labels, screen-reader labels, the marker messages in core.js and Settings "How it works".
// Rename UNIT / UNITS (and A_UNIT for the article) here and every screen follows. A test fails if the old words reappear elsewhere.
// (Not to be confused with "Statement", the Shiur step-type name for מימרא; that stays in app.js/core.js KIND tables.)
export const UNIT = "passage", UNITS = "passages", A_UNIT = "a passage";
const NUM = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
/** "one passage", "three passages" (words up to twelve, digits after) */
export const nUnits = n => `${NUM[n] || n} ${n === 1 ? UNIT : UNITS}`;

export const AMW = {
  unit: UNIT, units: UNITS, aUnit: A_UNIT,
  goal: `Mark where each ${UNIT} ends`,                       // the walkthrough's goal line
  // the two paths (home and every amud)
  shiurTitle: "Learn with Shiur",
  shiurLine: "The app explains each step: the Aramaic beside the English, every question and answer laid out.",
  shiurGo: "Start Shiur",
  amTitle: "Try it yourself with Ameilus",
  amLine: `Work the amud yourself: read the raw text and mark where each ${UNIT} ends.`,
  amGo: "Start Ameilus",
  amDef: "Ameilus: the effort of working it out yourself",    // one phrase for newcomers, under the Ameilus path title
  // the reading screen
  idle: `Tap the last word of the next ${UNIT}.`,
  dafAria: `The amud. Tap the last word of ${A_UNIT} to mark where it ends; long-press a word for its meaning.`,
  cardAria: `This ${UNIT}`,                                   // screen-reader name of the explanation card (and the panel's heading, round 4)
  finishTitle: "Amud done",                                    // the panel's heading when the amud is finished
  expGrow: "Show more of the explanation",                     // round 4: the phone panel's taller / shorter toggle and its hide button
  expShrink: "Show less of the explanation",
  expEmpty: `Mark where ${A_UNIT} ends and its explanation opens here.`, // the wide-screen panel before any passage is done
  expHide: "Hide the explanation (tap a finished passage to see it again)",
  count: (done, total) => `${done} of ${total} ${total === 1 ? UNIT : UNITS}`,   // the heading counter: "0 of 19 passages"
  allDone: total => `All ${total} ${total === 1 ? UNIT : UNITS} done`,
  finish: (label, own, total) => `${label}: done on your own, ${own} of ${total} ${total === 1 ? UNIT : UNITS} without the reveal.`,
  heldTerm: `meaning shows once this ${UNIT} is done`,        // word help: a key term that would give the current passage away
  revealTitle: `Show where this ${UNIT} ends (it won't count as on your own)`,
  resetAria: `Reset: redo this ${UNIT} or start the amud over`,
  redo: `Redo this ${UNIT}`,
  redoDone: `This ${UNIT} is back to the start. Your finished ${UNITS} stay.`,
  mapSub: `Each ${UNIT} hangs under the one it answers or builds on. It fills in as you go.`,
  mapEmpty: `Finish the first ${UNIT} to start the map.`,
  // the walkthrough
  walkTap: `Tap the last word of each ${UNIT},`,
  walkRead: "Read the raw amud: no vowels, no punctuation.",   // the compact walkthrough's lines (round 2, Oct 15 2026)
  walkHints: "Stuck? Open Hints. They're optional.",
  walkNear: "a real break, but not the end yet",
  walkEndShort: `the end of the ${UNIT}`,
  walkEnd: `The end of the ${UNIT}: the answer finishes here.`,
  // the marker messages (core.js evaluateMark)
  nearMiss: `Good instinct — that is a real break. This ${UNIT} runs a little further; keep going and mark its end.`,
  beyond: (endWord, n) => `A real break. We split it sooner too, after ${endWord}, so that's ${nUnits(n)} in one.`,
  notYet: `We don't split it there: the ${UNIT} isn't finished yet. Read on a bit.`,
  // Settings > Ameilus > How it works (app.js prints "How it works: " + this)
  settingsHow: `tap the last word of each ${UNIT}. A real break counts even where we split it later. Hints are separate buttons, use any in any order: Vowels and Punctuation switch on and off for the whole amud; Signal word and Show where it ends are for the ${UNIT} you're on (only Show where it ends stops ${A_UNIT} counting as on your own). ↺ redoes the ${UNIT} or starts the amud over. The ? at the top of the amud opens the walkthrough again. Long-press (or right-click) a word for its meaning. Keys: ← → move the marker, Enter confirms, V vowels, P punctuation, S signal word.`
};
