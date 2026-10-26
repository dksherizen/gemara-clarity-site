// Course sign-in for Gemara Clarity: turns a learner's GC Firebase ID token into a short-lived,
// nonce-bound assertion for ONE course, so the raw ID token never leaves gemaraclarity.org.
//
//   POST /api/course-assertion   body {idToken, nonce, aud:"morgan-course"}   (same-origin only, from /course-link/)
//        200 {assertion, exp}    assertion = ES256 JWT {iss:"https://gemaraclarity.org", aud, sub, email, name, iat, exp:iat+300, nonce, jti}
//        400 bad request (not JSON, missing/oversized fields, bad nonce shape, unknown aud)
//        401 ID token rejected (signature, aud, iss, exp, iat, auth_time, sub)
//        403 Origin is not exactly https://gemaraclarity.org (or Sec-Fetch-Site is not same-origin)
//        405 anything but POST            413 body over 8 KB            415 not application/json
//        503 the signing key secret is not set (the feature stays off)
//   GET  /.well-known/course-assertion-jwks.json   the PUBLIC keys that verify those assertions {keys:[{kty:"EC",crv:"P-256",x,y,kid,alg:"ES256",use:"sig"}]}
//        404 while no signing key is set (the course treats that as "sign-in not live")
//
// Secrets (Worker settings, never in the repo, never logged):
//   COURSE_ASSERTION_PRIVATE_JWK        the current signing key: a P-256 private JWK with a "kid"
//   COURSE_ASSERTION_EXTRA_PUBLIC_JWKS  optional: a JSON array of extra PUBLIC JWKs (the next or the previous key, for rotation)
// Nothing in this file logs, stores or echoes the ID token or the assertion.

const PROJECT = "gemara-clarity-accounts";
const FB_ISSUER = "https://securetoken.google.com/" + PROJECT;
const GOOGLE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
export const SITE_ORIGIN = "https://gemaraclarity.org";
export const ASSERTION_ISSUER = "https://gemaraclarity.org";
export const ASSERTION_PATH = "/api/course-assertion";
export const JWKS_PATH = "/.well-known/course-assertion-jwks.json";
const AUDIENCES = new Set(["morgan-course"]);
const LIFETIME = 300;      // seconds an assertion is good for
const SKEW = 300;          // seconds of clock skew tolerated on the Firebase ID token (same as the course reviewed)
const MAX_BODY = 8192;     // a Firebase ID token is ~1 KB

const enc = new TextEncoder();
const b64urlBytes = s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const b64urlJson = s => JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
const b64url = bytes => { let s = ""; const u = new Uint8Array(bytes); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const b64urlStr = str => b64url(enc.encode(str));
const randomId = () => { const u = new Uint8Array(18); crypto.getRandomValues(u); return b64url(u); };

// ---- Google's securetoken signing keys, cached by kid (same loader the course used before) ----
export function googleKeys(fetchImpl = (...a) => fetch(...a)) {
  const keys = new Map(); let until = 0, lastFresh = 0;
  async function load(fresh) {
    const r = await fetchImpl(GOOGLE_JWKS_URL, fresh ? { cache: "no-store" } : {});
    if (!r.ok) throw new Error("jwks " + r.status);
    const j = await r.json(), m = /max-age=(\d+)/.exec(r.headers.get("cache-control") || "");
    const t = Date.now(), exp = t + Math.min(Math.max(m ? +m[1] : 3600, 60), 86400) * 1000;
    for (const k of j.keys || []) if (k.kty === "RSA" && k.kid && (!k.alg || k.alg === "RS256")) {
      const have = keys.get(k.kid);
      keys.set(k.kid, { key: have ? have.key : await crypto.subtle.importKey("jwk", { kty: "RSA", n: k.n, e: k.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]), until: exp });
    }
    for (const [kid, v] of keys) if (v.until < t) keys.delete(kid);
    until = exp;
  }
  return async function getKey(kid) {
    if (!keys.size || Date.now() >= until) await load(false);
    const have = keys.get(kid); if (have && have.until > Date.now()) return have.key;
    if (Date.now() - lastFresh > 10000) { lastFresh = Date.now(); await load(true); }
    const k = keys.get(kid); return k ? k.key : null;
  };
}

// Verify a GC Firebase ID token (RS256). Returns the claims, or throws Error with a short reason.
export async function verifyIdToken(token, getKey, nowMs = Date.now()) {
  if (typeof token !== "string" || token.length > 4096) throw new Error("malformed");
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some(p => !/^[A-Za-z0-9_-]+$/.test(p))) throw new Error("malformed");
  let h, p; try { h = b64urlJson(parts[0]); p = b64urlJson(parts[1]); } catch { throw new Error("malformed"); }
  if (!h || h.alg !== "RS256" || typeof h.kid !== "string") throw new Error("bad header");
  const key = await getKey(h.kid);
  if (!key) throw new Error("unknown key");
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(parts[2]), enc.encode(parts[0] + "." + parts[1]));
  if (!ok) throw new Error("bad signature");
  const now = Math.floor(nowMs / 1000);
  if (p.aud !== PROJECT) throw new Error("wrong audience");
  if (p.iss !== FB_ISSUER) throw new Error("wrong issuer");
  if (typeof p.exp !== "number" || p.exp <= now - SKEW) throw new Error("expired");
  if (typeof p.iat !== "number" || p.iat > now + SKEW) throw new Error("issued in the future");
  if (typeof p.auth_time !== "number" || p.auth_time > now + SKEW) throw new Error("bad auth_time");
  if (typeof p.sub !== "string" || !p.sub || p.sub.length > 128) throw new Error("no subject");
  if (p.firebase && p.firebase.sign_in_provider === "anonymous") throw new Error("anonymous");
  return p;
}

// ---- the signing key, read from the Worker secret (imported once per isolate per secret value) ----
const isPublicP256 = k => k && typeof k === "object" && k.kty === "EC" && k.crv === "P-256" && typeof k.x === "string" && typeof k.y === "string" && typeof k.kid === "string" && k.kid.length > 0 && k.kid.length <= 64 && (!k.alg || k.alg === "ES256");
const publicPart = k => ({ kty: "EC", crv: "P-256", x: k.x, y: k.y, kid: k.kid, alg: "ES256", use: "sig" });
let keyCache = { raw: null, val: null };
async function signingKey(env) {
  const raw = env && env.COURSE_ASSERTION_PRIVATE_JWK;
  if (typeof raw !== "string" || !raw) return null;
  if (keyCache.raw === raw) return keyCache.val;
  let val = null;
  try {
    const j = JSON.parse(raw);
    if (isPublicP256(j) && typeof j.d === "string") {
      const key = await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: j.x, y: j.y, d: j.d, ext: false }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
      val = { key, kid: j.kid, pub: publicPart(j) };
    }
  } catch { val = null; }
  keyCache = { raw, val };
  return val;
}
function extraPublicKeys(env) {
  const raw = env && env.COURSE_ASSERTION_EXTRA_PUBLIC_JWKS;
  if (typeof raw !== "string" || !raw.trim()) return [];
  try { const j = JSON.parse(raw); const arr = Array.isArray(j) ? j : (j && Array.isArray(j.keys) ? j.keys : []); return arr.filter(k => isPublicP256(k) && !("d" in k)).map(publicPart); } // a private key pasted here by mistake is never published
  catch { return []; }
}

const json = (obj, status = 200, extra) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", ...(extra || {}) } });
const fail = (status, error, extra) => json({ error }, status, extra);

export function createCourseLink(deps = {}) {
  const getGoogleKey = deps.getGoogleKey || googleKeys(deps.fetch);
  const now = deps.now || (() => Date.now());

  async function jwks(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") return fail(405, "method not allowed", { allow: "GET, HEAD" });
    const k = await signingKey(env);
    if (!k) return fail(404, "not configured");
    const keys = [k.pub]; for (const x of extraPublicKeys(env)) if (!keys.some(y => y.kid === x.kid)) keys.push(x);
    return new Response(JSON.stringify({ keys }), { status: 200, headers: { "content-type": "application/jwk-set+json", "cache-control": "public, max-age=300", "access-control-allow-origin": "*", "x-content-type-options": "nosniff" } });
  }

  async function assertion(request, env) {
    if (request.method !== "POST") return fail(405, "method not allowed", { allow: "POST" });
    // same-origin only: the hop page at https://gemaraclarity.org/course-link/ is the only caller
    if (request.headers.get("origin") !== SITE_ORIGIN) return fail(403, "origin");
    const sfs = request.headers.get("sec-fetch-site"); if (sfs && sfs !== "same-origin") return fail(403, "origin");
    if (!/^application\/json\b/i.test(request.headers.get("content-type") || "")) return fail(415, "content-type must be application/json");
    if (+(request.headers.get("content-length") || 0) > MAX_BODY) return fail(413, "too large");
    const buf = await request.arrayBuffer();
    if (buf.byteLength > MAX_BODY) return fail(413, "too large");
    let body; try { body = JSON.parse(new TextDecoder().decode(buf)); } catch { return fail(400, "bad json"); }
    if (!body || typeof body !== "object") return fail(400, "bad json");
    const { idToken, nonce, aud } = body;
    if (typeof idToken !== "string" || !idToken) return fail(400, "idToken missing");
    if (typeof nonce !== "string" || !/^[A-Za-z0-9_-]{22,128}$/.test(nonce)) return fail(400, "bad nonce");
    if (typeof aud !== "string" || !AUDIENCES.has(aud)) return fail(400, "unknown aud");
    const k = await signingKey(env);
    if (!k) return fail(503, "not configured");
    let c;
    try { c = await verifyIdToken(idToken, getGoogleKey, now()); }
    catch (e) { return fail(401, "token rejected: " + (e && /^jwks /.test(e.message) ? "Google keys unavailable" : (e && e.message) || "invalid")); }
    const iat = Math.floor(now() / 1000), exp = iat + LIFETIME;
    const claims = { iss: ASSERTION_ISSUER, aud, sub: c.sub, email: typeof c.email === "string" && c.email_verified !== false ? c.email.slice(0, 200) : "", name: typeof c.name === "string" ? c.name.slice(0, 200) : "", iat, exp, nonce, jti: randomId() };
    const head = b64urlStr(JSON.stringify({ alg: "ES256", typ: "JWT", kid: k.kid })), pay = b64urlStr(JSON.stringify(claims));
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k.key, enc.encode(head + "." + pay)); // WebCrypto gives r||s (64 bytes), the JWS form
    return json({ assertion: head + "." + pay + "." + b64url(sig), exp });
  }

  return async function courseLink(request, url, env) {
    if (url.pathname === JWKS_PATH) return jwks(request, env);
    if (url.pathname === ASSERTION_PATH) return assertion(request, env);
    return null;
  };
}

export const courseLink = createCourseLink();
