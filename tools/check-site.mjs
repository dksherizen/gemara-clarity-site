// Gemara Clarity — checks the site before it goes live. Run by GitHub on every push (.github/workflows/check.yml); run it yourself with:
//   node tools/check-site.mjs
// It fails (exit code 1) if any script has a syntax error, any data file is broken, a Classic points at a step that doesn't exist,
// the offline list names a missing file, or the search pages are out of date with the data.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const problems = [];
const fail = m => { problems.push(m); if (problems.length <= 40) console.error("✗ " + m); };
const ok = m => console.log("✓ " + m);

// 1. every script parses (as an ES module where it is one)
const scripts = ["app.js", "acct.js", "mishnah.js", "mywords.js", "sw.js", ...fs.readdirSync(path.join(ROOT, "ameilus")).map(f => "ameilus/" + f), ...fs.readdirSync(path.join(ROOT, "_worker")).map(f => "_worker/" + f), ...fs.readdirSync(path.join(ROOT, "tools")).filter(f => /\.m?js$/.test(f)).map(f => "tools/" + f)].filter(f => /\.m?js$/.test(f));
for (const f of scripts) {
  const isModule = /^\s*(import|export)\s/m.test(rd(f)) || f.endsWith(".mjs");
  try { execFileSync(process.execPath, isModule ? ["--input-type=module", "--check"] : ["--check", path.join(ROOT, f)], { input: isModule ? rd(f) : undefined, stdio: ["pipe", "pipe", "pipe"] }); }
  catch (e) { fail(`${f} has a syntax error: ${String(e.stderr || e.message).split("\n").find(l => /Error/.test(l)) || ""}`); }
}
ok(`${scripts.length} scripts parse`);

// 2. the amud data
const KINDS = new Set(["מימרא", "קשיא", "תירוץ", "ראיה", "דחיה", "שאלה", "תשובה", "מסקנא"]);
let idx;
try { idx = JSON.parse(rd("data/b/index.json")); } catch (e) { fail("data/b/index.json is not valid JSON"); }
const steps = new Map();
if (idx) {
  if (idx.ids.length !== idx.count) fail(`data/b/index.json: count ${idx.count} but ${idx.ids.length} ids`);
  for (const id of idx.ids) {
    let j; try { j = JSON.parse(rd(`data/b/${id}.json`)); } catch { fail(`data/b/${id}.json is missing or not valid JSON`); continue; }
    if (!j.mainTopic || !j.overview || !Array.isArray(j.steps) || !j.steps.length) { fail(`${id}: missing topic, overview or steps`); continue; }
    steps.set(id, j.steps.length);
    j.steps.forEach((s, k) => {
      if (s.stepNumber !== k + 1) fail(`${id} step ${k + 1}: stepNumber is ${s.stepNumber}`);
      if (!KINDS.has(s.hebrewStepName)) fail(`${id} step ${k + 1}: unknown step type "${s.hebrewStepName}"`);
      for (const f of ["title", "stepSummary", "whatsHappening", "simpleTranslation"]) if (!s[f] || typeof s[f] !== "string") fail(`${id} step ${k + 1}: missing ${f}`);
      if (!Array.isArray(s.phrases) || !s.phrases.length || s.phrases.some(p => !p.aramaic || !p.english)) fail(`${id} step ${k + 1}: missing phrases`);
    });
  }
  ok(`${steps.size} amud files are complete`);
}

// 3. the Classics point at real steps
try {
  const c = JSON.parse(rd("data/classics.json"));
  for (const it of c.items) for (const end of ["start", "end"]) {
    const p = it[end], m = String(p.daf).match(/^(\d+)([ab])$/), id = m && `${p.m}_${m[1]}_${m[2]}`;
    if (!id || !steps.has(id)) fail(`classic ${it.id}: ${end} amud ${p.m} ${p.daf} doesn't exist`);
    else if (!(p.step >= 1 && p.step <= steps.get(id))) fail(`classic ${it.id}: ${end} step ${p.step} is outside ${id} (1-${steps.get(id)})`);
  }
  ok(`${c.items.length} Classics point at real steps`);
} catch (e) { fail("data/classics.json: " + e.message); }

// 4. other JSON files parse
for (const f of ["manifest.json", "data/glossary.json", "data/perakim.json", "data/perek-nikud.json", "data/prose-nikud.json", ...fs.readdirSync(path.join(ROOT, "data/mishnah")).map(f => "data/mishnah/" + f)]) {
  try { JSON.parse(rd(f)); } catch { fail(`${f} is not valid JSON`); }
}
ok("other data files parse");

// 5. everything the offline worker pre-saves exists
const shell = JSON.parse(rd("sw.js").match(/const SHELL = (\[[^\]]*\])/)[1]);
for (const f of shell) if (f !== "./" && !fs.existsSync(path.join(ROOT, f.split("?")[0]))) fail(`sw.js lists ${f}, which doesn't exist`);
ok(`${shell.length} offline files exist`);

// 6. the search pages match the data
try { execFileSync(process.execPath, [path.join(ROOT, "tools", "build-pages.mjs"), "--check"], { stdio: "pipe" }); ok("search pages are up to date"); }
catch (e) { fail("search pages are out of date: run  node tools/build-pages.mjs  and commit the result\n" + String(e.stdout || "").split("\n").slice(0, 5).join("\n")); }

if (problems.length) { console.error(`\n${problems.length} problem(s). Fix them before this goes live.`); process.exit(1); }
console.log("\nAll checks passed.");
