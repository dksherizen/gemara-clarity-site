// Host redirects for Gemara Clarity.
// gemaraclarity.com, www.gemaraclarity.com and www.gemaraclarity.org answer with a
// 301 to https://gemaraclarity.org, keeping the path and query string. The browser
// carries any #fragment (the app's #/ route) across the redirect by itself.
// Every other host (gemaraclarity.org itself, *.workers.dev, preview URLs) is served
// the static assets unchanged.
const CANONICAL_HOST = "gemaraclarity.org";
const REDIRECT_HOSTS = new Set([
  "gemaraclarity.com",
  "www.gemaraclarity.com",
  "www.gemaraclarity.org",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();
    if (host !== CANONICAL_HOST && REDIRECT_HOSTS.has(host)) {
      return Response.redirect("https://" + CANONICAL_HOST + url.pathname + url.search, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
