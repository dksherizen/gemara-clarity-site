// Gemara Clarity — apply a batch of content repairs in one step.
//
//   node tools/apply-repairs.mjs tools/repairs/<batch>.json          apply, bump the data version, rebuild the search pages
//   node tools/apply-repairs.mjs tools/repairs/<batch>.json --dry    only check that every repair still matches the current text
//
// A batch file is JSON:
//   { "name": "short-batch-name", "approved": "who approved it and when",
//     "repairs": [ { "id": "Niddah_40_a", "step": 21, "field": "stepSummary",
//                    "find": "exact text that is there now", "replace": "the corrected text",
//                    "why": "what was wrong", "source": "Gemara / Rashi / Tosafos reference" } ] }
// "step" is omitted (or null) for amud-level fields such as "overview" or "mainTopic".
// "field" may also be "phrases.<n>.english" (or .aramaic / .notes) for a phrase row, 1-based.
//
// Why this exists: earlier repairs sometimes fixed the hidden explanation but not the summary people read first,
// forgot the data-version bump (so phones kept the old copy), or never reached the search pages.
// This tool refuses a repair whose "find" text is not there, bumps data/b/index.json's version once,
// logs every change to docs/content-repairs.md, and rebuilds the search pages.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [batchFile] = process.argv.slice(2).filter(a => !a.startsWith("--"));
const DRY = process.argv.includes("--dry");
if (!batchFile) { console.error("usage: node tools/apply-repairs.mjs <batch.json> [--dry]"); process.exit(2); }
const batch = JSON.parse(fs.readFileSync(path.resolve(batchFile), "utf8"));
const dataPath = id => path.join(ROOT, "data", "b", `${id}.json`);

const files = new Map(); // id -> parsed amud
const load = id => { if (!files.has(id)) files.set(id, JSON.parse(fs.readFileSync(dataPath(id), "utf8"))); return files.get(id); };
function target(r) {
  const j = load(r.id);
  let obj = j;
  if (r.step != null) { obj = j.steps.find(s => s.stepNumber === r.step); if (!obj) throw new Error(`${r.id}: no step ${r.step}`); }
  const parts = r.field.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (p === "phrases") { obj = obj.phrases[+parts[++i] - 1]; if (!obj) throw new Error(`${r.id} s${r.step}: no phrase ${parts[i]}`); }
    else obj = obj[p];
  }
  return { obj, key: parts[parts.length - 1] };
}

let problems = 0;
for (const r of batch.repairs) {
  try {
    const { obj, key } = target(r);
    const cur = obj[key];
    if (typeof cur !== "string") throw new Error(`${r.id} s${r.step ?? "-"} ${r.field}: field is missing`);
    const n = cur.split(r.find).length - 1;
    if (n !== 1) throw new Error(`${r.id} s${r.step ?? "-"} ${r.field}: the text to replace appears ${n} times (must be exactly once)`);
    obj[key] = cur.replace(r.find, r.replace);
  } catch (e) { problems++; console.error("✗", e.message); }
}
if (problems) { console.error(`${problems} repair(s) did not match. Nothing was written.`); process.exit(1); }
console.log(`✓ all ${batch.repairs.length} repairs match.`);
if (DRY) process.exit(0);

for (const [id, j] of files) fs.writeFileSync(dataPath(id), JSON.stringify(j));
const idxPath = path.join(ROOT, "data", "b", "index.json");
const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const rev = (+(idx.version.match(/-rev(\d+)/) || [, 0])[1]) + 1;
const d = new Date(), pad = x => String(x).padStart(2, "0");
idx.version = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}-rev${rev}-${batch.name}`;
fs.writeFileSync(idxPath, JSON.stringify(idx));

const logPath = path.join(ROOT, "docs", "content-repairs.md");
fs.mkdirSync(path.dirname(logPath), { recursive: true });
if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "# Content repairs\n\nEvery change to the AI-written content, newest first. Each entry says what was wrong, the source used, and who approved it.\n");
const entry = `\n## ${idx.version}\n\nApproved: ${batch.approved || "(not recorded)"}\n\n` + batch.repairs.map(r =>
  `- **${r.id.replace(/_(\d+)_([ab])$/, " $1$2").replace(/_/g, " ")}${r.step != null ? `, step ${r.step}` : ""}** (${r.field}): ${r.why || ""}${r.source ? ` Source: ${r.source}.` : ""}\n  - was: ${r.find}\n  - now: ${r.replace}`).join("\n") + "\n";
const log = fs.readFileSync(logPath, "utf8");
const at = log.indexOf("\n## ");
fs.writeFileSync(logPath, at < 0 ? log + entry : log.slice(0, at) + entry + log.slice(at));

console.log(`data version is now ${idx.version}; ${files.size} amud file(s) updated; logged in docs/content-repairs.md`);
execFileSync(process.execPath, [path.join(ROOT, "tools", "build-pages.mjs")], { stdio: "inherit" });
