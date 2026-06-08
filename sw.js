/* MeslapBooks 서비스워커 — 앱 셸 캐시 (cache-first + 네트워크 폴백)
 * 과도하지 않게: 앱 셸과 아이콘/매니페스트, 그리고 사용된 CDN 폰트를 캐시한다.
 * 캐시 무효화는 CACHE_VERSION 키를 올려서 처리.
 */
const CACHE_VERSION = 'meslap-v4';
const SHELL = [
  '.',
  'index.html',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png'
];

// 설치: 앱 셸 사전 캐시 (개별 실패는 무시해 설치를 막지 않음)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(SHELL.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 옛 버전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 페치: GET 만 처리. cache-first → 네트워크 폴백(+런타임 캐시).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isShell = url.origin === self.location.origin;
  const isFont =
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.jsdelivr.net');

  if (!isShell && !isFont) return; // 그 외 요청은 브라우저 기본 처리

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // 정상 응답만 런타임 캐시 (불투명 응답도 폰트 CDN 용으로 보관)
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // 네비게이션 요청 실패 시 앱 셸로 폴백
          if (req.mode === 'navigate') return caches.match('index.html');
          return cached;
        });
    })
  );
});
