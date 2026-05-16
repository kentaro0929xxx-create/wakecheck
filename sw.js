// WakeCheck Service Worker - Web Push通知対応
const CACHE = 'wakecheck-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

// Push通知を受信したとき
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(err) {}

  var title = data.title || '🚨 WakeCheck';
  var options = {
    body: data.body || '未返信アラームがあります',
    icon: data.icon || '/wakecheck/icon-192.png',
    badge: data.badge || '/wakecheck/icon-192.png',
    tag: data.tag || 'wakecheck-alarm',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/wakecheck/' }
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// 通知をタップしたとき → アプリを開く
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/wakecheck/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('wakecheck') >= 0) {
          return list[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
