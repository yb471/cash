// Cash YB — service worker: оболочка приложения из кэша (мгновенный запуск и работа без сети), запросы к базе — только по сети
const CACHE = "cash-v23";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
// оболочка берётся с сервера в обход HTTP-кэша (GitHub Pages отдаёт max-age 600, иначе в новый кэш могла лечь старая страница)
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(new Request(req, { cache: "no-cache" })).then((res) => { if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone())); return res; }).catch(() => hit);
    return hit || net;
  }));
});
