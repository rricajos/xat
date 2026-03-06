// Xat Push Notification Service Worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();

  const options = {
    body: payload.body || "",
    icon: payload.icon || "/favicon.png",
    badge: "/favicon.png",
    tag: payload.tag || "xat-notification",
    data: {
      url: payload.url || "/app",
    },
    actions: [{ action: "open", title: "Open" }],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title || "Xat", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/app") && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    }),
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
