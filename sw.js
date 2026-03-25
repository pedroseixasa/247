const CACHE_NAME = "247-admin-v1";
const STATIC_ASSETS = [
  "/admin/",
  "/admin/index.html",
  "/manifest.json",
  "/css/mobile-responsive.css",
  "/images/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cacheando assets estáticos");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Alguns assets não foram cacheados:", err);
      });
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Service Worker: Limpando cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ✅ CORREÇÃO 1: Ignorar chrome-extension:// e outros schemes não-http
  if (!url.protocol.startsWith("http")) return;

  // API calls: Network-First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status >= 200 && response.status < 300) {
            // ✅ CORREÇÃO 2: clone() síncrono, antes de qualquer await/then
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(
            (cachedResponse) =>
              cachedResponse ||
              new Response(
                JSON.stringify({ error: "Offline - dados não disponíveis" }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                },
              ),
          );
        }),
    );
    return;
  }

  // Assets estáticos: Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((response) => {
          if (response.status >= 200 && response.status < 300) {
            // ✅ CORREÇÃO 2: clone() síncrono aqui também
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(
          () =>
            new Response("Recurso não disponível no modo offline", {
              status: 503,
            }),
        );
    }),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = { title: "24.7 Barbearia", body: event.data.text() };
  }

  const options = {
    body: notificationData.body || "Nova notificação",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    tag: "247-notification",
    requireInteraction: true,
    data: { url: notificationData.url || "/admin/", ...notificationData },
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Fechar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || "24.7 Barbearia",
      options,
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const urlToOpen = event.notification.data?.url || "/admin/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    }),
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notificação fechada:", event.notification.tag);
});
