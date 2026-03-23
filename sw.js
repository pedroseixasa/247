// Service Worker para 24.7 Barbearia Admin Panel PWA

const CACHE_NAME = "247-admin-v1";
const STATIC_ASSETS = [
  "/admin/",
  "/admin/index.html",
  "/manifest.json",
  "/css/mobile-responsive.css",
  "/images/logo.png",
];

// Instalar Service Worker e cachear assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cacheando assets estáticos");
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Alguns assets não foram cacheados:", err);
        // Não falha a instalação se alguns assets não estiverem disponíveis
      });
    }),
  );
  self.skipWaiting();
});

// Ativar Service Worker e limpar caches antigos
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

// Estratégia Network-First para API calls, Cache-First para assets estáticos
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: tentar rede primeiro
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache sucesso (status 200-299)
          if (response.status >= 200 && response.status < 300) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Se rede falhar, tentar cache
          return caches.match(request).then(
            (cachedResponse) =>
              cachedResponse ||
              new Response(
                JSON.stringify({
                  error: "Offline - dados não disponíveis",
                }),
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

  // Assets estáticos: cache primeiro
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Cachear respostas bem-sucedidas
          if (response.status >= 200 && response.status < 300) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback para offline
          return new Response("Recurso não disponível no modo offline", {
            status: 503,
          });
        });
    }),
  );
});

// Lidar com Push Notifications
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  if (!event.data) {
    console.log("Push event sem dados");
    return;
  }

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: "24.7 Barbearia",
      body: event.data.text(),
    };
  }

  const options = {
    body: notificationData.body || "Nova notificação",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    tag: "247-notification",
    requireInteraction: true,
    data: {
      url: notificationData.url || "/admin/",
      ...notificationData,
    },
    actions: [
      {
        action: "open",
        title: "Abrir",
      },
      {
        action: "close",
        title: "Fechar",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || "24.7 Barbearia",
      options,
    ),
  );
});

// Lidar com cliques em notificações
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/admin/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Procurar se já existe uma janela aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // Se não existe, abrir uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});

// Lidar com fechamento de notificações
self.addEventListener("notificationclose", (event) => {
  console.log("Notificação fechada:", event.notification.tag);
});
