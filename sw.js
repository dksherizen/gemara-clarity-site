const V = "gc2-shell-v21";
const SHELL = ["./", "index.html", "styles.css", "app.js", "mishnah.js", "manifest.json", "icon-192.png", "icon-512.png", "fonts/frank-ruhl-hebrew.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("gc2-shell") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // data requests are cached by the page itself
  // network first (so updates arrive at once), but never wait more than 2.5 s: then the saved copy answers
  e.respondWith(caches.open(V).then(async c => {
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; });
    const timer = new Promise(res => setTimeout(res, 2500));
    try {
      const r = await Promise.race([net, timer.then(() => null)]);
      if (r) return r;
    } catch {}
    const hit = await c.match(e.request, { ignoreSearch: true }) || (e.request.mode === "navigate" && await c.match("index.html"));
    if (hit) return hit;
    return net.catch(() => Response.error());
  }));
});
