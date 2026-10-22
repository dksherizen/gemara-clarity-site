const V = "gc2-shell-v109-us";
const SHELL = ["./", "index.html", "styles.css", "app.js", "mishnah.js", "manifest.json", "icon-192.png", "icon-512.png", "fonts/frank-ruhl-hebrew.woff2", "data/perakim.json", "data/perek-nikud.json", "ameilus/ui.js", "ameilus/core.js", "ameilus/words.js", "data/glossary.json", "data/prose-nikud.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k.startsWith("gc2-") && !k.startsWith("gc2-data")).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // data requests are cached by the page itself
  const root = new URL("./", location).pathname; if (e.request.mode === "navigate" && u.pathname !== root && u.pathname !== root + "index.html") return; // a static daf page (/shabbat/21b/) loads from the network as itself, never as the app shell
  // network first (so updates arrive at once), but never wait more than 2.5 s: then the saved copy answers
  e.respondWith(caches.open(V).then(async c => {
    const net = fetch(e.request).then(r => { if (r.ok && !/\/data\/b\/[^/]+_\d+_[ab]\.json$/.test(u.pathname)) c.put(e.request, r.clone()); return r; }); // v105: an amud breakdown is kept once, by the page (gc2-data-v1), not a second time here
    const timer = new Promise(res => setTimeout(res, 2500));
    try {
      const r = await Promise.race([net, timer.then(() => null)]);
      if (r) return r;
    } catch {}
    const hit = await c.match(e.request, { ignoreSearch: true }) || await caches.match(e.request, { ignoreSearch: true }) || (e.request.mode === "navigate" && await c.match("index.html")); // v105: a saved amud (gc2-data-v1) answers too, under any library version
    if (hit) return hit;
    return net.catch(() => Response.error());
  }));
});
