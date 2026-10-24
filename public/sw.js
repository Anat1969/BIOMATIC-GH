/* מטמון פשוט: הדף תמיד מהרשת כשאפשר, תמונות וקבצי בנייה מהמטמון */
const CACHE = "biomatic-v3";

self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        (await caches.open(CACHE)).put("/", res.clone());
        return res;
      } catch {
        return (await caches.match("/")) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/img/") || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
      return res;
    })());
  }
});
