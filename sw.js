const CACHE_NAME = 'departure-app-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// インストール時にキャッシュ
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){return k !== CACHE_NAME;})
            .map(function(k){return caches.delete(k);})
      );
    })
  );
  self.clients.claim();
});

// ネットワーク優先・失敗時にキャッシュ
self.addEventListener('fetch', function(e){
  // Supabase APIはキャッシュしない
  if(e.request.url.includes('supabase.co')){
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(res){
      // 成功したらキャッシュを更新
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){
        cache.put(e.request, resClone);
      });
      return res;
    }).catch(function(){
      // オフライン時はキャッシュから返す
      return caches.match(e.request);
    })
  );
});

// プッシュ通知受信
self.addEventListener('push', function(e){
  var data = {};
  try{ data = e.data.json(); }catch(err){ data = {title:'出発確認', body: e.data ? e.data.text() : '通知があります'}; }

  e.waitUntil(
    self.registration.showNotification(data.title || '🚨 出発確認', {
      body: data.body || '確認してください',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'departure-app',
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { url: data.url || './index.html' }
    })
  );
});

// 通知タップで画面を開く
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = e.notification.data && e.notification.data.url ? e.notification.data.url : './index.html';
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(function(cls){
      for(var i=0; i<cls.length; i++){
        if(cls[i].url.includes('index.html') && 'focus' in cls[i]){
          return cls[i].focus();
        }
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
