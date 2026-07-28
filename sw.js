+  1 // Service Worker for PWA
+  2 const CACHE_NAME = 'memory-house-v1';
+  3 const urlsToCache = [
+  4   '/',
+  5   '/index.html',
+  6   '/app.js',
+  7   '/manifest.json',
+  8   'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
+  9 ];
+ 10 
+ 11 // 安裝
+ 12 self.addEventListener('install', event => {
+ 13   event.waitUntil(
+ 14     caches.open(CACHE_NAME)
+ 15       .then(cache => {
+ 16         console.log('Opened cache');
+ 17         return cache.addAll(urlsToCache);
+ 18       })
+ 19   );
+ 20 });
+ 21 
+ 22 // 激活
+ 23 self.addEventListener('activate', event => {
+ 24   event.waitUntil(
+ 25     caches.keys().then(cacheNames => {
+ 26       return Promise.all(
+ 27         cacheNames.map(cacheName => {
+ 28           if (cacheName !== CACHE_NAME) {
+ 29             return caches.delete(cacheName);
+ 30           }
+ 31         })
+ 32       );
+ 33     })
+ 34   );
+ 35 });
+ 36 
+ 37 // 獲取
+ 38 self.addEventListener('fetch', event => {
+ 39   event.respondWith(
+ 40     caches.match(event.request)
+ 41       .then(response => {
+ 42         if (response) {
+ 43           return response;
+ 44         }
+ 45         return fetch(event.request).then(response => {
+ 46           // 檢查是否是有效的響應
+ 47           if (!response || response.status !== 200 || response.type !== 'basic') {
+ 48             return response;
+ 49           }
+ 50 
+ 51           // 克隆響應
+ 52           const responseToCache = response.clone();
+ 53 
+ 54           caches.open(CACHE_NAME)
+ 55             .then(cache => {
+ 56               cache.put(event.request, responseToCache);
+ 57             });
+ 58 
+ 59           return response;
+ 60         });
+ 61       })
+ 62   );
+ 63 });
