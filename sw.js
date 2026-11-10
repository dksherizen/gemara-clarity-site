const V = "gc2-shell-v142-ameilus-start";
const SHELL = ["./", "index.html", "gc.css", "fonts/spectral-normal-400-latin.woff2", "fonts/spectral-normal-600-latin.woff2", "fonts/spectral-italic-400-latin.woff2", "fonts/noto-rashi-hebrew-normal-400-hebrew.woff2", "app.js", "mishnah.js", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "favicon.svg", "favicon-32.png", "logo-mark.svg", "fonts/frank-ruhl-hebrew.woff2", "data/perakim.json", "data/perek-nikud.json", "ameilus/ui.js", "ameilus/core.js", "ameilus/words.js", "acct.js", "mywords.js", "data/glossary.json", "data/prose-nikud.json"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k.startsWith("gc2-") && !k.startsWith("gc2-data")).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // data requests are cached by the page itself
  if (u.pathname.startsWith("/__/")) return; // v111: Google sign-in pages (/__/auth/*, proxied to Firebase by the Worker) always go straight to the network, never cached
  const root = new URL("./", location).pathname; if (e.request.mode === "navigate" && u.pathname !== root && u.pathname !== root + "index.html") return; // a static daf page (/shabbat/21b/) loads from the network as itself, never as the app shell
  // Nov 5 2026: network first, so updates arrive at once, but on a weak signal a saved copy answers after 0.8 s instead of 2.5 s.
  // An amud breakdown (data/b/..json?v=<library version>) is answered early only by a copy of that same version, so a correction
  // is never hidden by an older saved copy; an older copy is used only when the network actually fails (offline).
  e.respondWith(caches.open(V).then(async c => {
    const isAmud = /\/data\/b\/[^/]+_\d+_[ab]\.json$/.test(u.pathname);
    const net = fetch(e.request).then(r => { if (r.ok && !isAmud) c.put(e.request, r.clone()); return r; }); // v105: an amud breakdown is kept once, by the page (gc2-data-v1), not a second time here
    const exact = isAmud ? await caches.match(e.request) : (await c.match(e.request, { ignoreSearch: true }) || await caches.match(e.request, { ignoreSearch: true }) || (e.request.mode === "navigate" && await c.match("index.html")));
    if (exact) {
      try { const r = await Promise.race([net, new Promise(res => setTimeout(res, 800)).then(() => null)]); if (r && r.ok) return r; } catch {}
      return exact;
    }
    try { const r = await net; if (r.ok || !isAmud) return r; } catch {}
    const old = await caches.match(e.request, { ignoreSearch: true }); // offline: any saved version of this amud is better than nothing
    return old || net.catch(() => Response.error());
  }));
});
