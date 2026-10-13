import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const SITE = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "site");
const read = f => fs.readFileSync(path.join(SITE, f), "utf8");

test("index has title, viewport and local references only", () => {
  const html = read("index.html");
  assert.match(html, /<title>Gemara Clarity/);
  assert.match(html, /name="viewport" content="width=device-width/);
  for (const ref of [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m => m[1])) {
    if (/^https?:/.test(ref)) continue;
    assert.ok(fs.existsSync(path.join(SITE, ref)), "missing local asset " + ref);
  }
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>\s*\S/, "no inline scripts");
});

test("the eight step types and their colours, and Sefaria as source", () => {
  const js = read("app.js"), css = read("styles.css");
  for (const t of ["מימרא","קשיא","תירוץ","ראיה","דחיה","שאלה","תשובה","מסקנא"]) assert.ok(js.includes(`"${t}"`), t);
  for (const [k, c] of Object.entries({ mimra:"#38bdf8", kashya:"#fb7185", terutz:"#34d399", raaya:"#a78bfa", dechiya:"#fb923c", sheelah:"#fbbf24", teshuvah:"#22d3ee", maskana:"#e879f9" }))
    assert.ok(css.includes(`--${k}:${c}`), k);
  assert.match(js, /https:\/\/www\.sefaria\.org/);
});

test("no secrets and no writes to the original cloud project", () => {
  const all = fs.readdirSync(SITE).filter(f => /\.(js|html|json)$/.test(f)).map(read).join("\n");
  assert.doesNotMatch(all, /sk-[A-Za-z0-9]{20,}/, "no OpenAI key");
  assert.doesNotMatch(all, /AIza[0-9A-Za-z_\-]{20,}/, "no Firebase key");
  assert.doesNotMatch(all, /ADMIN_PASSWORD|gemaraclarity"/);
  assert.doesNotMatch(all, /method:\s*"(PATCH|PUT|DELETE)"/);
  const fsCalls = [...all.matchAll(/FS_BASE[^;\n]*/g)].map(m => m[0]).join("\n");
  assert.doesNotMatch(fsCalls, /method/);
});

test("no client-side AI: no key entry, no ai.js, missing amudim say coming soon", () => {
  const all = fs.readdirSync(SITE).filter(f => /\.(js|html|json)$/.test(f)).map(read).join("\n");
  assert.ok(!fs.existsSync(path.join(SITE, "ai.js")), "ai.js removed");
  assert.doesNotMatch(all, /ai\.js|api\.openai\.com|openrouter|apiKey|keyInput|makeBtn/i);
  assert.doesNotMatch(read("sw.js"), /"ai\.js"/, "service worker must not precache a removed file");
  assert.match(read("app.js"), /breakdown coming soon/);
});

test("PWA files exist and parse", () => {
  const m = JSON.parse(read("manifest.json"));
  assert.equal(m.name, "Gemara Clarity");
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(SITE, i.src)));
  assert.match(read("sw.js"), /addEventListener\("fetch"/);
});

test("no placeholder text left", () => {
  const all = ["index.html","app.js","styles.css"].map(read).join("\n");
  assert.doesNotMatch(all, /lorem ipsum|TODO|FIXME|__MAS__/i);
});

test("Mishnah badge: steps in the Mishnah portion are marked, Gemara quotes of it are not", async () => {
  const { segmentFlags, stepFlags, endState, segmentMarker } = await import(path.join(SITE, "mishnah.js"));
  const segs = [
    "וְאָמַר רַבִּי יוֹחָנָן: הֲלָכָה כְּרַבִּי יְהוֹשֻׁעַ.",                       // Gemara carried over from the previous amud
    "<big><strong>מַתְנִי׳</strong></big> מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּשַׁחֲרִית?",  // Mishnah opens
    "וְגוֹמְרָהּ עַד הָנֵץ הַחַמָּה.",                                         // Mishnah continues
    "<big><strong>גְּמָ׳</strong></big> תְּנַן: מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּשַׁחֲרִית?", // Gemara quoting the Mishnah
  ];
  assert.equal(segmentMarker(segs[1]), "mishnah");
  assert.equal(segmentMarker(segs[3]), "gemara");
  assert.equal(segmentMarker("וּבְמַתְנִיתִין קָתָנֵי"), null);
  const flags = segmentFlags(segs, false);
  assert.deepEqual(flags, [false, true, true, false]);
  assert.equal(endState(segs), false);
  assert.deepEqual(segmentFlags(["וְחַכָמִים אוֹמְרִים עַד חֲצוֹת.", "גמ׳ מַאי"], true), [true, false], "a Mishnah carries over from the previous amud");
  const step = (...aramaic) => ({ hebrewStepName: "מימרא", phrases: aramaic.map(a => ({ aramaic: a })) });
  const steps = [
    step("וְאָמַר רַבִּי יוֹחָנָן:", "הֲלָכָה כְּרַבִּי יְהוֹשֻׁעַ."),
    step("מַתְנִי׳ מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּשַׁחֲרִית?", "וְגוֹמְרָהּ עַד הָנֵץ הַחַמָּה."),
    step("גְּמָ׳ תְּנַן:", "מֵאֵימָתַי קוֹרִין אֶת שְׁמַע בְּשַׁחֲרִית?"),
  ];
  assert.deepEqual(stepFlags(steps, segs, flags), [false, true, false]);
  assert.deepEqual(stepFlags(steps, segs, [false, false, false, false]), [false, false, false], "no Mishnah, no badge");
  const js = read("app.js"), css = read("styles.css");
  assert.match(js, /from "\.\/mishnah\.js"/);
  assert.match(js, /lg t-mishnah/, "the Mishnah badge is in the key");
  assert.match(css, /--mishnah:#/);
  assert.match(read("sw.js"), /"mishnah\.js"/);
});

test("static breakdowns are fetched with the library's data version, so updates reach phones", () => {
  const js = read("app.js");
  assert.match(js, /staticVersion = String\(j\.version/);
  assert.match(js, /\.json\$\{staticVersion \? "\?v="/);
  const idx = JSON.parse(read("data/b/index.json"));
  assert.ok(idx.version && idx.ids.length === idx.count);
  for (const id of idx.ids) assert.ok(fs.existsSync(path.join(SITE, "data/b", id + ".json")), id);
});

test("perakim.json: every masechet in the list has its perakim, in order, covering every amud", () => {
  const js = read("app.js");
  const MAS = JSON.parse(js.match(/const MAS = (\[.*?\]\]);/)[1]);
  const P = JSON.parse(read("data/perakim.json")).masechtot;
  for (const [key, , first, last] of MAS) {
    const ps = P[key];
    assert.ok(Array.isArray(ps) && ps.length >= 1, key);
    ps.forEach((p, n) => {
      assert.equal(p.n, n + 1, key + " numbering");
      assert.ok(p.he && /[\u05D0-\u05EA]/.test(p.he), key + " hebrew name " + p.n);
      assert.ok(p.start <= p.end, key + " range " + p.n);
      if (n) assert.ok(p.start === ps[n-1].end || p.start === ps[n-1].end + 1, key + " gap before perek " + p.n);
    });
    assert.equal(ps[0].start, first, key + " starts where the masechet starts");
    assert.equal(ps.at(-1).end, last, key + " ends where the masechet ends");
    // the picker's grouping rule: an amud is listed under every perek whose range holds it
    for (let i = first; i <= last; i++) {
      const groups = ps.filter(p => i >= p.start && i <= p.end);
      assert.ok(groups.length >= 1, `${key} amud ${i} has a perek`);
      if (groups.length > 1) assert.ok(groups.slice(1).every(p => p.start === i && p.startSeg > 1), `${key} amud ${i} is shared only where a perek begins partway down`);
    }
  }
  // known boundaries
  assert.equal(P.Berakhot[1].he, "היה קורא"); assert.equal(P.Berakhot[1].start, 24); // 13a
  assert.equal(P.Bekhorot.length, 9); assert.equal(P.Bekhorot[8].start, 104);        // מעשר בהמה, 53a
  assert.equal(P.Beitzah[1].start, 29);                                               // יום טוב, 15b
});

test("picker groups by perek with a jump bar, the daf header names the perek, and it works offline", () => {
  const js = read("app.js"), css = read("styles.css");
  assert.match(js, /fetch\("data\/perakim\.json"\)/);
  assert.match(js, /class="pk-jump"/); assert.match(js, /data-jump/); assert.match(js, /id="pk-\$\{p\.n\}"/);
  assert.match(js, /id="perekSlot"/); assert.match(js, /perekLineHtml\(c\.m, c\.i\)/);
  for (const sel of [".pk-jump", ".pk-h", ".perekline", ".dafcell .ph"]) assert.ok(css.includes(sel), sel);
  assert.match(read("sw.js"), /"data\/perakim\.json"/);
});

test("perek view is always on: no By perek / All dapim switch, and the home library groups by perek too", () => {
  const js = read("app.js"), css = read("styles.css");
  assert.doesNotMatch(js, />By perek</); assert.doesNotMatch(js, />All dapim</);
  assert.doesNotMatch(js, /pk-mode/); assert.doesNotMatch(js, /data-mode/); assert.doesNotMatch(css, /\.pk-mode/);
  assert.doesNotMatch(js, /settings\.byPerek\s*(!==|===|=[^=])/, "the old switch setting is never read or written");
  assert.match(js, /function perekGroups\(k\)/);
  assert.match(js, /ps\.length < 2\) return null/, "one perek or no perakim data: plain grid");
  // both places use the shared grouping, headers and jump bar
  const picker = js.slice(js.indexOf("const showDafGrid"), js.indexOf('body.addEventListener("click"'));
  const lib = js.slice(js.indexOf("function libraryHtml"), js.indexOf("function refreshLibrary"));
  for (const [name, src] of [["picker", picker], ["library", lib]]) {
    assert.match(src, /perekGroups\(k\)/, name); assert.match(src, /perekHeadHtml\(p\)/, name); assert.match(src, /perekJumpHtml\(/, name); assert.match(src, /midLegendHtml/, name);
  }
  assert.match(lib, /id="lib-\$\{k\}-pk-\$\{p\.n\}"/);
  assert.match(js, /data-libjump/); assert.match(js, /if \(!current\) refreshLibrary\(\)/, "library re-lists when perakim arrive");
  for (const sel of [".lib-row .pk-jump", ".lib-row .chip.mid", ".lib-body"]) assert.ok(css.includes(sel), sel);
});

test("perekGroups: the shared grouping rule (run in isolation)", () => {
  const js = read("app.js");
  const src = js.slice(js.indexOf("function perekGroups"), js.indexOf("const perekHeadHtml"));
  const P = JSON.parse(read("data/perakim.json")).masechtot;
  const perekGroups = new Function("perakimOf", src + "; return perekGroups;")(m => P[m] || null);
  assert.equal(perekGroups("NoSuchMasechet"), null);
  const one = Object.keys(P).find(k => P[k].length === 1); if (one) assert.equal(perekGroups(one), null);
  const g = perekGroups("Berakhot");
  assert.equal(g.length, P.Berakhot.length);
  const shared = Object.keys(P).flatMap(k => P[k].slice(1).filter((p, n) => p.start === P[k][n].end).map(p => [k, p]));
  if (shared.length) { const [k, p] = shared[0]; const gs = perekGroups(k); assert.match(gs[p.n - 1].midOf(p.start), /begins partway down/); assert.match(gs[p.n - 2].midOf(p.start), /begins partway down/); }
});
