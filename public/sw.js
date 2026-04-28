// ── Fantapodio 2026 — Service Worker ─────────────────────────
// Gestisce push notifications e notificationclick

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── Push received ─────────────────────────────────────────────
self.addEventListener('push', function (event) {
  let data = { title: 'Fantapodio 2026', body: 'Notifica in arrivo!', url: '/' };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; }
    catch { data.body = event.data.text(); }
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/favicon-32x32.png',
    image: '/icon-512x512.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: false,
    tag: 'fp2026-reminder',          // sovrascrive la precedente dello stesso tipo
    renotify: true,
    actions: [
      { action: 'open', title: '🏎️ Apri app' },
      { action: 'dismiss', title: 'Ignora' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Se l'app è già aperta, porta quella in primo piano
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Altrimenti apri una nuova finestra
      return self.clients.openWindow(targetUrl);
    })
  );
});
