// The Bava Metzia course at https://course.gemaraclarity.org, served by this same Worker.
// Requests whose Host is COURSE_HOST are proxied to the course's own live site (COURSE_ORIGIN): same method,
// path and query, same body. The browser stays on course.gemaraclarity.org, so the course's files, its service
// worker and its local progress all live under that address. Two paths are answered here instead:
//   /api/config  -> {"signin": COURSE_SIGNIN}  (the course reads it to decide whether to show "Sign in")
//   /api/*       -> 404 (no other course API is exposed on this address)
// /__/auth/* and /__/firebase/* never reach this file (index.js passes them to Firebase first, on every host).
// On every other host a /course-site/ path answers exactly like any missing file (404, empty body).
//
// COURSE_SIGNIN is the one switch for "Sign in with Google" in the course. false = the button never shows
// (guests only, exactly like the course today).
export const COURSE_HOST = "course.gemaraclarity.org";
export const COURSE_ORIGIN = "https://morgan-look-b.sites.tab.bot";
export const COURSE_DIR = "/course-site";
export const COURSE_SIGNIN = false;

const HIDDEN = "/.course-site-hidden"; // no such asset: the asset server answers its plain 404
const DROP = ["host", "cookie", "cf-connecting-ip", "cf-ipcountry", "cf-ray", "cf-visitor", "cf-worker", "x-forwarded-for", "x-forwarded-proto", "x-real-ip"];

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export const inCourseDir = p => p === COURSE_DIR || p.startsWith(COURSE_DIR + "/");

// Other hosts: the folder is not part of gemaraclarity.org.
export function hideCourseDir(request, url, env) {
  return env.ASSETS.fetch(new Request(new URL(HIDDEN, url), request));
}

export async function serveCourse(request, url, env, signin = COURSE_SIGNIN) {
  const p = url.pathname;
  if (p === "/api/config") {
    if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "no such api" }, 404);
    return json({ signin: !!signin });
  }
  if (p === "/api" || p.startsWith("/api/")) return json({ error: "no such api" }, 404);
  const headers = new Headers(request.headers);
  for (const k of DROP) headers.delete(k);
  const init = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.arrayBuffer();
  const up = await fetch(COURSE_ORIGIN + p + url.search, init);
  const loc = up.headers.get("location");
  if (!loc) return up;
  // A redirect that names the course's own origin is given back as a path on this address.
  const l = new URL(loc, COURSE_ORIGIN + p);
  if (l.origin !== COURSE_ORIGIN) return up;
  const out = new Response(up.body, up);
  out.headers.set("location", l.pathname + l.search + l.hash);
  return out;
}
