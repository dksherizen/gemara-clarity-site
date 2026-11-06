// acct.js (v106-acct, Oct 20 2026): optional Google sign-in that syncs bookmarks, history, display settings (not text size) and Ameilus progress.
// Guests: nothing here touches the network. Firebase (official gstatic modules) is imported only when someone opens Sign in, or on a later visit by
// someone who signed in, and never before the first paint. localStorage stays the source of truth; the cloud is one Firestore doc, users/{uid}.
// If Firebase can't load (offline, blocked), the app works exactly as before; only the row says it isn't synced.
export const FB_VER = "13.0.0";
export const FB_CONFIG = { apiKey: "AIzaSyAFJ4rN7kfZ5cTZEsTxIatjnx5DDfIXg08", authDomain: "gemaraclarity.org", projectId: "gemara-clarity-accounts", storageBucket: "gemara-clarity-accounts.firebasestorage.app", messagingSenderId: "834361636262", appId: "1:834361636262:web:1f46aeefc1567cad2c4b67" }; // a web config, public by design
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
const HOSTS = /^(gemaraclarity\.org|www\.gemaraclarity\.org|gc-acct-test\.sites\.tab\.bot|localhost|127\.0\.0\.1)$/; // where sign-in is offered (authorized in Firebase, or a local test)
export const K = { acct: "gc-acct", meta: "gc-acct-meta", hint: "gc-acct-hint" }; // acct: {uid,name,email,photo} while signed in; meta: last synced values + times; hint: the old home line, dismissed

/* ---------- pure sync logic (no DOM, no network; unit-tested) ----------
   Every synced thing is one item: key -> { t, v } (v = a JSON string), or a tombstone { t, del: 1 }. Merge = union of keys, newest t wins per item. */
const SET_SKIP = new Set(["scale"]); // text size stays per device
export function collect(st){
  const get = k => { try { return st.getItem(k); } catch { return null; } };
  const js = (k, d) => { try { const v = JSON.parse(get(k)); return v ?? d; } catch { return d; } };
  const out = {};
  for (const id of js("gc2-bookmarks", [])) if (typeof id === "string") out["b:" + id] = "1";
  for (const h of js("gc2-history", [])) if (h && typeof h.id === "string") out["h:" + h.id] = String(+h.t || 0);
  const s = js("gc2-settings", {}); for (const [f, v] of Object.entries(s || {})) if (!SET_SKIP.has(f)) out["s:" + f] = JSON.stringify(v);
  const am = js("gc-am3-settings", {}); if (am && "bare" in am) out["o:bare"] = JSON.stringify(!!am.bare);
  const sh = js("gc-am3-show", {}); for (const f of ["vowels", "punct"]) if (sh && f in sh) out["o:" + f] = JSON.stringify(!!sh[f]);
  for (const w of js("gc-am3-mywords", [])) if (w && typeof w.raw === "string") out["w:" + w.raw] = JSON.stringify(w);
  if (get("gc-am3-walk")) out["f:walk"] = "1";
  if (get("gc-disclaimer")) out["f:disc"] = "1";
  for (let i = 0; i < st.length; i++) { const k = st.key(i); if (k && k.startsWith("gc-am3:")) { const v = get(k); if (v != null) out["a:" + k.slice(7)] = v; } }
  return out;
}
const NO_TOMB = /^(h|f|s|o):/; // history only grows (capped at 30); flags only turn on; settings are values, never removed
// stamp: compare this device's values with what it last synced (meta) and give every new or changed item the time now.
// First time on this device (no meta): nothing is a deletion, and times come from what the device knows (history times; bookmark order).
export function stamp(meta, cur, now){
  const items = {}, first = !meta;
  const base = (meta && meta.base) || {}, ts = (meta && meta.t) || {};
  const hist = {}; for (const k in cur) if (k.startsWith("h:")) hist[k.slice(2)] = +cur[k] || 0;
  const bms = Object.keys(cur).filter(k => k.startsWith("b:"));
  for (const k in cur) {
    if (!first && base[k] === cur[k] && ts[k]) { items[k] = { t: ts[k], v: cur[k] }; continue; }
    let t = now;
    if (first) {
      if (k.startsWith("h:")) t = +cur[k] || 1;
      else if (k.startsWith("a:")) t = hist[k.slice(2)] || 1;
      else if (k.startsWith("b:")) t = 1 + bms.length - bms.indexOf(k); // keeps this device's order; any dated cloud item is newer
      else t = 1;
    } else if (k.startsWith("h:")) t = Math.max(+cur[k] || 0, ts[k] || 0);
    items[k] = { t, v: cur[k] };
  }
  if (!first) for (const k in base) if (!(k in cur) && !NO_TOMB.test(k)) items[k] = { t: now, del: 1 };
  if (!first && meta.dead) for (const k in meta.dead) if (!(k in cur) && !(k in items)) items[k] = { t: meta.dead[k], del: 1 };
  return items;
}
const amPos = e => { try { return +(JSON.parse(e.v) || {}).pos || 0; } catch { return 0; } };
// merge: union of both sides; per item the newer t wins. first = this device's first sync with the account: a live local item is never replaced by a
// cloud deletion, and for an Ameilus amud the copy with more progress wins when the times can't tell (both copies are kept as data either way).
export function merge(local, cloud, first){
  const out = {};
  for (const k of new Set([...Object.keys(local || {}), ...Object.keys(cloud || {})])) {
    const a = local && local[k], b = cloud && cloud[k];
    if (!a || !b) { out[k] = a || b; continue; }
    if (k.startsWith("f:")) { out[k] = a.del ? b : b.del ? a : (b.t > a.t ? b : a); continue; } // a flag that was ever on stays on
    if (first) {
      if (!a.del && b.del) { out[k] = a; continue; }
      if (k.startsWith("a:") && !a.del && !b.del && a.t <= 1) { out[k] = amPos(a) > amPos(b) ? a : b; continue; }
    }
    if (a.t !== b.t) { out[k] = a.t > b.t ? a : b; continue; }
    out[k] = (a.del && !b.del) ? b : (b.del && !a.del) ? a : b; // a tie: a live copy beats a deletion; else the cloud's
  }
  const hs = Object.keys(out).filter(k => k.startsWith("h:")).sort((x, y) => (+out[y].v || 0) - (+out[x].v || 0)); // history: the newest 30
  for (const k of hs.slice(30)) delete out[k];
  return out;
}
export const same = (x, y) => JSON.stringify(sortObj(x || {})) === JSON.stringify(sortObj(y || {}));
export const digest = x => { const s = JSON.stringify(sortObj(x || {})); let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36) + "." + s.length; };
const sortObj = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
// apply: write the merged items back into this device's own keys, in the app's own shapes. Returns true if anything changed.
export function apply(st, items){
  const get = k => { try { return st.getItem(k); } catch { return null; } };
  const js = (k, d) => { try { const v = JSON.parse(get(k)); return v ?? d; } catch { return d; } };
  let changed = false;
  const put = (k, v) => { if (get(k) !== v) { try { st.setItem(k, v); changed = true; } catch {} } };
  const del = k => { if (get(k) != null) { try { st.removeItem(k); changed = true; } catch {} } };
  const live = p => Object.entries(items).filter(([k, e]) => k.startsWith(p) && e && !e.del).sort((x, y) => y[1].t - x[1].t);
  const curB = js("gc2-bookmarks", []), b = live("b:").map(([k]) => k.slice(2));
  if (b.length || curB.length) put("gc2-bookmarks", JSON.stringify(b));
  const curH = js("gc2-history", []), h = live("h:").map(([k, e]) => ({ id: k.slice(2), t: +e.v || 0 })).sort((x, y) => y.t - x.t).slice(0, 30);
  if (h.length || curH.length) put("gc2-history", JSON.stringify(h));
  const sv = live("s:"); if (sv.length) { const s = js("gc2-settings", {}) || {}; for (const [k, e] of sv) { try { s[k.slice(2)] = JSON.parse(e.v); } catch {} } put("gc2-settings", JSON.stringify(s)); }
  if (items["o:bare"] && !items["o:bare"].del) { const s = js("gc-am3-settings", {}) || {}; s.bare = JSON.parse(items["o:bare"].v); put("gc-am3-settings", JSON.stringify(s)); }
  const shw = ["vowels", "punct"].filter(f => items["o:" + f] && !items["o:" + f].del);
  if (shw.length) { const s = js("gc-am3-show", {}) || {}; for (const f of shw) s[f] = JSON.parse(items["o:" + f].v); put("gc-am3-show", JSON.stringify(s)); }
  const w = live("w:").map(([, e]) => { try { return JSON.parse(e.v); } catch { return null; } }).filter(Boolean).slice(0, 500);
  if (w.length || js("gc-am3-mywords", []).length) put("gc-am3-mywords", JSON.stringify(w));
  if (items["f:walk"] && !items["f:walk"].del) put("gc-am3-walk", get("gc-am3-walk") || "1");
  if (items["f:disc"] && !items["f:disc"].del) put("gc-disclaimer", get("gc-disclaimer") || "1");
  for (const [k, e] of Object.entries(items)) if (k.startsWith("a:")) { if (e.del) del("gc-am3:" + k.slice(2)); else put("gc-am3:" + k.slice(2), e.v); }
  return changed;
}
// newMeta: what this device now holds, so the next stamp() can tell what changed. Deletions are remembered (dead) so they keep their time.
export function newMeta(items, cur){
  const m = { base: {}, t: {}, dead: {} };
  for (const [k, e] of Object.entries(items)) { if (e.del) m.dead[k] = e.t; else if (k in cur) { m.base[k] = cur[k]; m.t[k] = e.t; } }
  return m;
}
// the keys "Clear this device" removes on sign-out: bookmarks, history and Ameilus progress (display settings and saved dapim stay)
export function clearDevice(st){
  const ks = ["gc2-bookmarks", "gc2-history", "gc-am3-mywords"];
  for (let i = 0; i < st.length; i++) { const k = st.key(i); if (k && k.startsWith("gc-am3:")) ks.push(k); }
  for (const k of ks) { try { st.removeItem(k); } catch {} }
}

/* ---------- the page ---------- */
const CSS = `
#settingsBtn.pf{min-width:44px;height:44px;padding:0 12px 0 5px;gap:8px;border:1px solid transparent;background:transparent;color:var(--text);font:inherit;font-size:15px;font-weight:650;white-space:nowrap;cursor:pointer}
#settingsBtn.pf:hover,#settingsBtn.pf.open{background:color-mix(in srgb,var(--text) 7%,transparent);border-color:var(--border)}
#settingsBtn.pf.out{padding:0 16px 0 12px;border-color:var(--border)}
#settingsBtn.pf.bare{width:44px;padding:0}
#settingsBtn.pf svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none}
#settingsBtn.pf .pf-chev{width:16px;height:16px;color:var(--muted)}
.pf-av{width:34px;height:34px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:16px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex:none;overflow:hidden}
.pf-av img{width:100%;height:100%;object-fit:cover;display:block}
.pf-av.lg{width:44px;height:44px;font-size:19px}
@media (max-width:600px){#settingsBtn.pf.in .pf-nm,#settingsBtn.pf .pf-chev{display:none}#settingsBtn.pf.in{width:44px;padding:0}#settingsBtn.pf.out,#settingsBtn.pf.bare{width:auto;padding:0 10px;gap:6px}#settingsBtn.pf.out svg,#settingsBtn.pf.bare svg{display:none}}
#settingsBtn.pf.bare{width:auto;padding:0 16px 0 12px;border-color:var(--border)}
@media (max-width:480px){.topbar .brand-name{display:none}}
.pm{position:fixed;z-index:60;width:300px;max-width:calc(100vw - 16px);box-sizing:border-box;padding:6px;border-radius:14px;border:1px solid var(--border);background:var(--panel);color:var(--text);box-shadow:0 18px 50px rgba(0,0,0,.45)}
.pm-hd{display:flex;gap:12px;align-items:center;padding:12px 10px}
.pm-hd>div,.acs .pm-hd>div{min-width:0}
.pm-nm{font-size:16px;font-weight:700;line-height:1.25}
.pm-em{font-size:13px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-st{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);margin-top:4px}
.pm-st i{width:8px;height:8px;border-radius:50%;background:var(--good);flex:none}
.pm-st.off i{background:var(--muted)}
.pm-hr{height:1px;background:var(--border);margin:4px 6px}
.pm-it{width:100%;min-height:46px;display:flex;align-items:center;gap:12px;padding:0 12px;border:0;border-radius:9px;background:transparent;color:var(--text);font:inherit;font-size:15px;font-weight:550;text-align:left;cursor:pointer;box-sizing:border-box}
.pm-it:hover,.pm-it:focus-visible{background:color-mix(in srgb,var(--text) 7%,transparent)}
.pm-it svg{width:20px;height:20px;flex:none;fill:none;stroke:var(--muted);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pm-so{padding:14px 10px 10px}
.pm-so h3{margin:0;font-size:16px;font-weight:700}
.pm-so p{margin:4px 0 12px;font-size:13px;color:var(--muted);line-height:1.4}
.gbtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:48px;border-radius:10px;border:1px solid #dadce0;background:#fff;color:#1f1f1f;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
.gbtn[disabled]{opacity:.6;cursor:default}
.gbtn svg{width:18px;height:18px}
.si-err{text-align:center;margin:8px 0 0;font-size:13.5px;color:var(--bad)}
.acs .pm-hd{padding:4px 0 16px}
.ac-prog{border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:12px}
.ac-pl{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.ac-pn{display:flex;gap:10px}
.ac-pn>div{flex:1;display:flex;flex-direction:column;gap:2px}
.ac-pn b{font-size:22px;font-weight:800;color:var(--text)}
.ac-pn span{font-size:13px;color:var(--muted)}
.ac-del{width:100%;min-height:44px;margin-top:14px;border:0;background:transparent;color:var(--bad);font:inherit;font-size:14px;font-weight:600;cursor:pointer}
.theme-light .ac-del,.theme-sepia .ac-del,.theme-light .ac-conf .danger,.theme-sepia .ac-conf .danger{color:#b3261e}
.ac-conf{border:1px solid var(--border);border-radius:12px;padding:14px;margin-top:14px}
.ac-conf p{font-size:14.5px;line-height:1.45;margin:0 0 12px}
.ac-conf .so-two .danger{color:var(--bad)}
.hp p{font-size:15px;line-height:1.5;margin:2px 0 8px}
.so-q{font-size:15.5px;line-height:1.45;margin:2px 0 16px}
.so-two{display:flex;gap:10px}
.so-two .btn{flex:1;min-height:48px;margin:0}
@media (min-width:760px){.sheet.narrow{width:min(440px,94vw)}}
`;
const G = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.7l-7.8 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;
const I = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const PERSON = I('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/>');
const GEAR = I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>');
const WORDS = I('<rect x="3.5" y="7" width="13" height="13" rx="2"/><path d="M7.5 3.5h11a2 2 0 0 1 2 2v11"/>'); // My words (Oct 25 2026)
const HELP = I('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 17h.01"/>');
const OUT = I('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>');
const MENU = I('<path d="M4 7h16M4 12h16M4 17h16"/>');
const CHEV = `<svg class="pf-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const LS = typeof localStorage !== "undefined" ? localStorage : null;
const lget = (k, d) => { try { const v = JSON.parse(LS.getItem(k)); return v ?? d; } catch { return d; } };
const lset = (k, v) => { try { if (v == null) LS.removeItem(k); else LS.setItem(k, JSON.stringify(v)); } catch {} };
let deps = null, fb = null, menu = null, fbLoading = null, user = null, status = "idle", lastSync = 0, timer = null, busy = false, again = false, leaving = false;
export const allowed = () => typeof location !== "undefined" && HOSTS.test(location.hostname);
const me = () => lget(K.acct, null);

export function init(d){
  deps = d;
  if (!document.getElementById("acctCss")) { const s = document.createElement("style"); s.id = "acctCss"; s.textContent = CSS; document.head.append(s); }
  paintButton();
  if (!allowed()) return;
  let redirect = false; try { redirect = !!sessionStorage.getItem("gc-acct-redirect"); } catch {}
  if (me() || redirect) { // signed in before (or coming back from Google): connect after the page has painted
    const go = () => setTimeout(() => connect().catch(() => {}), 0);
    if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
  }
  addEventListener("online", () => { if (me()) connect().then(() => sync()).catch(() => {}); });
  document.addEventListener("visibilitychange", () => { if (!me() || !user) return; if (document.hidden) sync(); else if (Date.now() - lastSync > 60000) sync(); });
}
function loadFb(){
  if (fb) return Promise.resolve(fb);
  if (!fbLoading) fbLoading = Promise.all([import(FB_BASE + "firebase-app.js"), import(FB_BASE + "firebase-auth.js"), import(FB_BASE + "firebase-firestore-lite.js")]).then(([a, au, fs]) => {
    const app = a.getApps().length ? a.getApp() : a.initializeApp(FB_CONFIG);
    fb = { au, fs, auth: au.getAuth(app), db: fs.getFirestore(app) }; return fb;
  }).catch(e => { fbLoading = null; throw e; });
  return fbLoading;
}
let connected = null;
function connect(){
  if (connected) return connected;
  connected = loadFb().then(async f => {
    let redirect = false; try { redirect = !!sessionStorage.getItem("gc-acct-redirect"); sessionStorage.removeItem("gc-acct-redirect"); } catch {}
    if (redirect) { try { const r = await f.au.getRedirectResult(f.auth); if (r && r.user) await signedIn(r.user); } catch (e) { deps && deps.toast(errText(e)); } }
    f.au.onAuthStateChanged(f.auth, u => {
      if (u) { if (!user || user.uid !== u.uid) signedIn(u); }
      else if (me() && !leaving) { lset(K.acct, null); user = null; status = "idle"; refresh(); } // signed out elsewhere (e.g. account deleted): this device keeps its data
    });
  }).catch(e => { connected = null; status = "offline"; refresh(); throw e; });
  return connected;
}
async function signedIn(u){
  user = u; const prev = me();
  lset(K.acct, { uid: u.uid, name: u.displayName || "", email: u.email || "", photo: /^https:\/\//.test(u.photoURL || "") ? u.photoURL : "" });
  if (prev && prev.uid !== u.uid) lset(K.meta, null); // a different account on this device: merge like a first sign-in
  refresh(); await sync(true);
  if (!timer) timer = setInterval(() => { if (!document.hidden) sync(); }, 15000);
}
export async function sync(announce){
  if (!user || !fb || leaving) return;
  if (busy) { again = true; return; }
  busy = true; status = "syncing"; refresh();
  try {
    const f = fb, ref = f.fs.doc(f.db, "users", user.uid);
    const meta = lget(K.meta, null), first = !meta, cur = collect(LS), local = stamp(meta, cur, Date.now());
    if (meta && !announce && Date.now() - lastSync < 60000 && digest(local) === meta.sent) { status = "synced"; return; } // nothing new here; pull at most once a minute
    let merged = null, hadCloud = false;
    await f.fs.runTransaction(f.db, async tx => {
      const snap = await tx.get(ref), cloud = snap.exists() ? (snap.data().items || {}) : {};
      hadCloud = Object.keys(cloud).length > 0;
      merged = merge(local, cloud, first);
      if (!same(merged, cloud)) tx.set(ref, { schema: 1, updatedAt: Date.now(), items: merged });
    });
    const changed = apply(LS, merged), now = collect(LS), m = newMeta(merged, now); m.sent = digest(stamp(m, now, Date.now()));
    lset(K.meta, m); lastSync = Date.now(); status = "synced";
    if (changed && deps) deps.onPulled();
    if (first && hadCloud && Object.keys(local).length && announce && deps) deps.toast("Merged this device with your account");
  } catch (e) { status = navigator.onLine === false ? "offline" : "error"; }
  finally { busy = false; refresh(); if (again) { again = false; setTimeout(sync, 500); } }
}
const errText = e => {
  const c = (e && e.code) || "";
  if (c === "auth/unauthorized-domain") return "Sign-in isn’t set up for this address yet.";
  if (c === "auth/network-request-failed" || (typeof navigator !== "undefined" && navigator.onLine === false)) return "No connection. Try again when you’re online.";
  if (c === "auth/requires-recent-login") return "Please sign in again first.";
  return "Couldn’t sign in. Please try again.";
};

/* ---------- UI ---------- */
// The far top-right button (#settingsBtn, which used to read "Aa") is the profile button: a menu with Account, Settings, Help and Sign out, or Sign in.
const syncWord = () => status === "offline" ? "Offline" : status === "error" ? "Not synced" : status === "syncing" ? "Syncing…" : "Synced";
const ago = () => { const s = (Date.now() - lastSync) / 1000; return !lastSync ? "" : s < 90 ? " just now" : s < 3600 ? ` ${Math.round(s / 60)} min ago` : ` ${Math.round(s / 3600)} h ago`; };
const offline = () => status === "offline" || status === "error";
const initial = a => esc(((a.name || a.email || "?").trim()[0] || "?").toUpperCase());
const firstName = a => (a.name || "").trim().split(/\s+/)[0] || (a.email || "").split("@")[0] || "Account";
const avatar = (a, lg) => `<span class="pf-av${lg ? " lg" : ""}" aria-hidden="true">${a.photo ? `<img src="${esc(a.photo)}" alt="" referrerpolicy="no-referrer">` : initial(a)}</span>`;
const fixPhotos = (box, a) => box.querySelectorAll(".pf-av img").forEach(img => img.addEventListener("error", () => { img.parentElement.textContent = ((a.name || a.email || "?").trim()[0] || "?").toUpperCase(); }, { once: true }));
const head = (a, long) => `<div class="pm-hd">${avatar(a, true)}<div><div class="pm-nm">${esc(a.name || "Signed in")}</div><div class="pm-em">${esc(a.email || "")}</div><div class="pm-st${offline() ? " off" : ""}" data-sync><i></i><span>${syncWord()}${long && status !== "syncing" && !offline() ? ago() : ""}</span></div></div></div>`;
const HR = `<div class="pm-hr" role="separator"></div>`;
const item = (k, ic, t) => `<button class="pm-it" type="button" role="menuitem" data-pm="${k}">${ic}<span>${t}</span></button>`;
const btn = () => document.getElementById("settingsBtn");
export function paintButton(){
  const b = btn(); if (!b) return;
  const a = allowed() ? me() : null;
  b.classList.add("pf"); b.classList.toggle("in", !!a); b.classList.toggle("out", !a && allowed()); b.classList.toggle("bare", !a && !allowed());
  b.removeAttribute("title"); b.setAttribute("aria-haspopup", "menu"); b.setAttribute("aria-expanded", menu ? "true" : "false");
  if (a) { b.innerHTML = `${avatar(a)}<span class="pf-nm">${esc(firstName(a))}</span>${CHEV}`; b.setAttribute("aria-label", `Account menu: ${a.name || a.email || "signed in"}`); fixPhotos(b, a); }
  else { b.innerHTML = `${MENU}<span class="pf-nm">Menu</span>`; b.setAttribute("aria-label", allowed() ? "Menu: settings, help and sign in" : "Menu: settings and help"); } // Nov 5: a plain "Menu" button; signing in is one option inside it
}
function place(){
  const b = btn(); if (!menu || !b) return;
  const r = b.getBoundingClientRect();
  menu.style.top = Math.round(r.bottom + 8) + "px"; menu.style.right = Math.round(Math.max(8, innerWidth - r.right)) + "px";
}
const items = () => menu ? [...menu.querySelectorAll(".pm-it, .gbtn")] : [];
function onKey(e){
  if (!menu) return;
  if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(true); return; }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") { const l = items(); if (!l.length) return; e.preventDefault(); const i = l.indexOf(document.activeElement); l[(i + (e.key === "ArrowDown" ? 1 : l.length - 1 + (i < 0 ? 1 : 0))) % l.length].focus(); }
  if (e.key === "Tab" && !menu.contains(document.activeElement)) closeMenu(false);
}
function onDown(e){ if (menu && !menu.contains(e.target) && !(btn() && btn().contains(e.target))) closeMenu(false); }
function onMove(){ closeMenu(false); }
export function closeMenu(focusBack){
  if (!menu) return;
  menu.remove(); menu = null;
  document.removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", onDown, true);
  removeEventListener("resize", place); removeEventListener("hashchange", onMove);
  const b = btn(); if (b) { b.setAttribute("aria-expanded", "false"); b.classList.remove("open"); if (focusBack) b.focus(); }
}
export function toggleMenu(e){
  if (menu) return closeMenu(false);
  const b = btn(); if (!b) return;
  const a = allowed() ? me() : null;
  if (a && !fb) connect().catch(() => {});
  menu = document.createElement("div"); menu.className = "pm"; menu.id = "pfMenu"; menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", a ? "Account" : "Menu");
  menu.innerHTML = a ? head(a) + HR + item("account", PERSON, "Account") + item("words", WORDS, "My words") + item("settings", GEAR, "Settings") + item("help", HELP, "Help") + HR + item("signout", OUT, "Sign out")
    : item("settings", GEAR, "Settings") + item("words", WORDS, "My words") + item("help", HELP, "Help")
      + (allowed() ? HR + `<div class="pm-so"><h3>Sign in (optional)</h3><p>Keeps your bookmarks and progress on all your devices.</p><button class="gbtn" type="button" data-pm="google">${G}<span>Continue with Google</span></button><p class="si-err" role="alert" hidden></p></div>` : "");
  if (a) fixPhotos(menu, a);
  document.body.append(menu); place();
  b.setAttribute("aria-expanded", "true"); b.classList.add("open");
  menu.addEventListener("click", ev => { const t = ev.target.closest("[data-pm]"); if (!t) return; ev.stopPropagation(); pick(t.dataset.pm, t); });
  document.addEventListener("keydown", onKey, true); document.addEventListener("pointerdown", onDown, true);
  addEventListener("resize", place); addEventListener("hashchange", onMove);
  if (e && e.detail === 0) { const f = items()[0]; if (f) f.focus(); } // opened from the keyboard: focus the first row
}
function pick(k, el){
  if (k === "google") { const err = menu.querySelector(".si-err"); return googleSignIn(el, t => { err.textContent = t; err.hidden = !t; }); }
  closeMenu(true); // focus back on the corner button, so closing the sheet returns there
  if (k === "words") location.hash = "#/words";
  else if (k === "settings") deps.openSettings();
  else if (k === "help") openHelp();
  else if (k === "account") openAccount();
  else if (k === "signout") openSignOut();
}
function googleSignIn(el, say){
  say(""); el.disabled = true;
  loadFb().then(f => {
    const p = new f.au.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
    return f.au.signInWithPopup(f.auth, p).then(async r => { closeMenu(false); await signedIn(r.user); connect().catch(() => {}); }).catch(e => {
      const c = (e && e.code) || "";
      if (c === "auth/popup-blocked") { try { sessionStorage.setItem("gc-acct-redirect", "1"); } catch {} return f.au.signInWithRedirect(f.auth, p).catch(e2 => { el.disabled = false; say(errText(e2)); }); }
      el.disabled = false;
      if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") return;
      say(errText(e));
    });
  }, () => { el.disabled = false; say(errText({ code: "auth/network-request-failed" })); });
}
function refresh(){
  paintButton();
  const a = me();
  if (menu && a) menu.querySelectorAll("[data-sync]").forEach(n => { n.className = "pm-st" + (offline() ? " off" : ""); n.lastChild.textContent = syncWord(); });
  else if (menu && !a && menu.querySelector("[data-pm=account]")) closeMenu(false);
  const sh = document.querySelector("#sheetBody .acs [data-sync]");
  if (sh) { if (!a) deps.closeSheet(); else { sh.className = "pm-st" + (offline() ? " off" : ""); sh.lastChild.textContent = syncWord() + (status !== "syncing" && !offline() ? ago() : ""); } }
}
function small(title, html, mount){
  deps.openSheet(title, html, mount);
  const sh = document.getElementById("sheet"); sh.classList.add("narrow");
  const mo = new MutationObserver(() => { if (sh.hidden || document.getElementById("sheetTitle").textContent !== title) { sh.classList.remove("narrow"); mo.disconnect(); } });
  mo.observe(sh, { attributes: true, attributeFilter: ["hidden"], subtree: true, childList: true, characterData: true });
}
// My progress, from this device's own data only: bookmarks, and amudim worked on in Ameilus (a saved position or a finished passage).
// Finished dafim and a day streak can't be read reliably here (history keeps only the newest 30 amudim, one time each), so they aren't shown.
export function progress(st){
  const js = k => { try { return JSON.parse(st.getItem(k)); } catch { return null; } };
  const bm = js("gc2-bookmarks"), out = { bookmarks: Array.isArray(bm) ? bm.filter(x => typeof x === "string").length : 0, ameilus: 0 };
  for (let i = 0; i < st.length; i++) { const k = st.key(i); if (!k || !k.startsWith("gc-am3:")) continue; const v = js(k); if (v && (+v.pos > 0 || (v.done && Object.keys(v.done).length))) out.ameilus++; }
  return out;
}
const accountHtml = () => { const a = me() || {}, p = progress(LS);
  return `<div class="acs">${head(a, true)}<div class="ac-prog"><div class="ac-pl">My progress</div><div class="ac-pn"><div><b>${p.bookmarks}</b><span>${p.bookmarks === 1 ? "bookmark" : "bookmarks"}</span></div><div><b>${p.ameilus}</b><span>${p.ameilus === 1 ? "amud" : "amudim"} worked on in Ameilus</span></div></div></div>`
    + `<button class="ac-del" type="button" data-ac="delete">Delete account</button><div class="ac-conf" id="acConf" hidden><p>Delete your account? Your synced copy is erased. This device keeps its bookmarks and progress.</p><div class="so-two"><button class="btn" type="button" data-ac="cancel">Cancel</button><button class="btn danger" type="button" data-ac="confirm">Delete account</button></div></div></div>`; };
function openAccount(){
  if (me() && !fb) connect().catch(() => {});
  deps.openSheet("Account", accountHtml(), body => {
    fixPhotos(body, me() || {});
    body.addEventListener("click", e => { const b = e.target.closest("[data-ac]"); if (!b) return; const conf = body.querySelector("#acConf"), del = body.querySelector(".ac-del");
      if (b.dataset.ac === "delete") { conf.hidden = false; del.hidden = true; conf.querySelector("[data-ac=cancel]").focus(); }
      else if (b.dataset.ac === "cancel") { conf.hidden = true; del.hidden = false; del.focus(); }
      else if (b.dataset.ac === "confirm") { b.disabled = true; deleteAccount().finally(() => { b.disabled = false; }); }
    });
  });
}
function openHelp(){
  deps.openHelp(); // the app's Help panel ("On this screen", What's new, all topics; Ameilus › Replay the walkthrough)
}
export function openSignOut(){
  small("Sign out", `<div class="so"><p class="so-q">Keep your bookmarks and progress on this device?</p><div class="so-two"><button class="btn primary" type="button" data-so="keep" autofocus>Keep on this device</button><button class="btn" type="button" data-so="clear">Clear this device</button></div></div>`, body => {
    body.addEventListener("click", async e => { const b = e.target.closest("[data-so]"); if (!b) return; await signOut(b.dataset.so === "clear"); });
  });
}
export async function signOut(clear){
  try { if (user && fb) await sync(); } catch {}
  leaving = true;
  try { if (fb) await fb.au.signOut(fb.auth); } catch {}
  if (timer) { clearInterval(timer); timer = null; }
  user = null; status = "idle"; lset(K.acct, null); lset(K.meta, null); leaving = false;
  if (clear) { clearDevice(LS); deps.closeSheet(); location.hash = "#/"; location.reload(); return; }
  deps.closeSheet(); paintButton(); deps.toast("Signed out. This device keeps your bookmarks and progress."); deps.onPulled();
}
async function deleteAccount(){
  leaving = true;
  try {
    const f = await loadFb(); const u = f.auth.currentUser; if (!u) throw { code: "auth/requires-recent-login" };
    const t = Date.parse((u.metadata && u.metadata.lastSignInTime) || "") || 0;
    if (Date.now() - t > 4 * 60 * 1000) await f.au.reauthenticateWithPopup(u, new f.au.GoogleAuthProvider()); // Firebase only deletes a recently signed-in user
    await f.fs.deleteDoc(f.fs.doc(f.db, "users", u.uid));
    await f.au.deleteUser(u);
    if (timer) { clearInterval(timer); timer = null; }
    user = null; status = "idle"; lset(K.acct, null); lset(K.meta, null);
    deps.closeSheet(); deps.toast("Account deleted. This device keeps its bookmarks and progress.");
  } catch (e) { deps.toast(e && e.code === "auth/popup-closed-by-user" ? "Account not deleted." : "Couldn’t delete the account. " + errText(e)); }
  finally { leaving = false; refresh(); }
}
// Clear my data (Settings) on a signed-in device: this device forgets the account too, so the clearing is not synced as deletions.
export function forgetDevice(){
  try { localStorage.removeItem(K.acct); localStorage.removeItem(K.meta); } catch {}
  try { if (fb) fb.au.signOut(fb.auth); else indexedDB.deleteDatabase("firebaseLocalStorageDb"); } catch {}
}
