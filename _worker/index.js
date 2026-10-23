// Host redirects and the Google sign-in proxy for Gemara Clarity.
// gemaraclarity.com, www.gemaraclarity.com and www.gemaraclarity.org answer with a
// 301 to https://gemaraclarity.org, keeping the path and query string. The browser
// carries any #fragment (the app's #/ route) across the redirect by itself.
// /__/auth/* and /__/firebase/* are passed through to the Firebase project's own auth
// pages, so Google sign-in runs on gemaraclarity.org itself and Google's account chooser
// says "to continue to gemaraclarity.org" (acct.js sets authDomain to gemaraclarity.org).
// Every other request (gemaraclarity.org itself, *.workers.dev, preview URLs) is served
// the static assets unchanged.
const CANONICAL_HOST = "gemaraclarity.org";
const REDIRECT_HOSTS = new Set([
  "gemaraclarity.com",
  "www.gemaraclarity.com",
  "www.gemaraclarity.org",
]);
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
    return env.ASSETS.fetch(request);
  },
};
