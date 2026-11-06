// Host redirects, the Google sign-in proxy and the course sign-in assertion for Gemara Clarity.
// gemaraclarity.com, www.gemaraclarity.com and www.gemaraclarity.org answer with a
// 301 to https://gemaraclarity.org, keeping the path and query string. The browser
// carries any #fragment (the app's #/ route) across the redirect by itself.
// /__/auth/* and /__/firebase/* are passed through to the Firebase project's own auth
// pages, so Google sign-in runs on gemaraclarity.org itself and Google's account chooser
// says "to continue to gemaraclarity.org" (acct.js sets authDomain to gemaraclarity.org).
// /api/course-assertion and /.well-known/course-assertion-jwks.json are the course sign-in
// (see course-assertion.js): a learner's GC ID token, POSTed same-origin by /course-link/, becomes a
// 5-minute ES256 assertion for the course; the ID token itself never leaves gemaraclarity.org.
// course.gemaraclarity.org is the Bava Metzia course, proxied to the course's own live site (see course-host.js);
// on every other host a /course-site/ path answers 404 like any missing file.
// Every other request (gemaraclarity.org itself, *.workers.dev, preview URLs) is served
// the static assets, with the standard browser safety headers added (withSecurityHeaders, below).
import { courseLink, ASSERTION_PATH, JWKS_PATH } from "./course-assertion.js";
import { COURSE_HOST, inCourseDir, hideCourseDir, serveCourse } from "./course-host.js";

const CANONICAL_HOST = "gemaraclarity.org";
const REDIRECT_HOSTS = new Set([
  "gemaraclarity.com",
  "www.gemaraclarity.com",
  "www.gemaraclarity.org",
]);
// Nov 5 2026: the spellings the site itself shows (and other common ones) redirect to the real page address,
// so /berachos/2a/, /Berakhot/2a and /bava_metzia/2a all reach /berakhot/2a/ instead of a "not found" page.
const ALIASES = { berachos: "berakhot", berachot: "berakhot", brachos: "berakhot", brachot: "berakhot", shabbos: "shabbat", shabbath: "shabbat",
  succah: "sukkah", sukka: "sukkah", taanis: "taanit", yevamos: "yevamot", kesubos: "ketubot", kesuvos: "ketubot", ketuvot: "ketubot",
  "bava-basra": "bava-batra", "baba-batra": "bava-batra", "baba-kamma": "bava-kamma", "baba-metzia": "bava-metzia", makkos: "makkot",
  shevuos: "shevuot", horayos: "horayot", menachos: "menachot", bechoros: "bekhorot", bechorot: "bekhorot", arachin: "arakhin",
  kereisos: "keritot", kerisos: "keritot", krisos: "keritot", meilah: "meilah", "me-ilah": "meilah", "avoda-zara": "avodah-zarah",
  "moed-katan": "moed-katan", "rosh-hashana": "rosh-hashanah", eiruvin: "eruvin", beitza: "beitzah", megila: "megillah", chagiga: "chagigah",
  sota: "sotah", gitin: "gittin", kidushin: "kiddushin", zevachim: "zevachim", chulin: "chullin", nida: "niddah", temura: "temurah" };
export function canonicalPath(pathname) {
  const m = pathname.match(/^\/([^/]+)(\/(\d+[abAB])?\/?)?$/);
  if (!m) return null;
  let mas = decodeURIComponent(m[1]).toLowerCase().replace(/['’]/g, "").replace(/[_\s]+/g, "-");
  mas = ALIASES[mas] || mas;
  const daf = m[3] ? m[3].toLowerCase() : "";
  const out = `/${mas}/${daf ? daf + "/" : ""}`;
  return out === pathname ? null : out;
}
const AUTH_ORIGIN = "https://gemara-clarity-accounts.firebaseapp.com";
const AUTH_PREFIXES = ["/__/auth/", "/__/firebase/"];

export async function proxyAuth(request, url) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.arrayBuffer();
  return fetch(AUTH_ORIGIN + url.pathname + url.search, init);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    if (host !== CANONICAL_HOST && REDIRECT_HOSTS.has(host)) {
      return Response.redirect("https://" + CANONICAL_HOST + url.pathname + url.search, 301);
    }
    if (AUTH_PREFIXES.some(p => url.pathname.startsWith(p))) return proxyAuth(request, url);
    if (host === COURSE_HOST) return serveCourse(request, url, env);
    if (inCourseDir(url.pathname)) return hideCourseDir(request, url, env);
    if (url.pathname === ASSERTION_PATH || url.pathname === JWKS_PATH) return courseLink(request, url, env);
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && (request.method === "GET" || request.method === "HEAD")) {
      const fixed = canonicalPath(url.pathname);
      if (fixed) { const probe = await env.ASSETS.fetch(new Request(new URL(fixed, url), { method: "HEAD" })); if (probe.ok) return withSecurityHeaders(Response.redirect(new URL(fixed + url.search, url).toString(), 301)); }
    }
    return withSecurityHeaders(res);
  },
};

// Nov 5 2026 (review #13, #71): the standard browser safety headers, on the site's own pages and files only (not the sign-in proxy or the course).
// No Content-Security-Policy: Google sign-in loads Firebase's pages and scripts, and a wrong policy would break it. SAMEORIGIN, not DENY,
// because sign-in opens a page from this site inside a frame. The response is copied with new Headers, keeping its status (redirects, 304s) and body.
export const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000", // no includeSubDomains: hard to undo, and it would bind every gemaraclarity.org subdomain
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
export function withSecurityHeaders(res) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
