/* MeslapBooks 서비스워커 — 오프라인 완전 지원
 * 전략: Cache-First for shell+books, Network-First for dynamic
 * 캐시 무효화: CACHE_VERSION 올리기
 */
const CACHE_VERSION = 'meslap-v5';

/* 앱 셸 + 모든 책 HTML — 설치 시 사전 캐시 */
const SHELL = [
  '.',
  'index.html',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'icon-180.png',
  'icon-192-maskable.png',
  'og-image.png',
  /* 모든 책 HTML */
  'spirit-guide.html',
  'spirit-secret.html',
  'blessed-church.html',
  'blessed-family.html',
  'prayer.html',
  'bible-guide.html',
  'doctrine-god.html',
  'doctrine-man.html',
  'doctrine-christ.html',
  'doctrine-salvation.html',
  'doctrine-spirit.html',
  'doctrine-church.html',
  'doctrine-last.html',
];

/* 설치: 앱 셸 + 책 전체 사전 캐시
 * 개별 실패는 무시 — 하나 실패해도 설치 완료 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.allSettled(SHELL.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

/* 활성화: 이전 버전 캐시 전부 정리 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* 페치: Cache-First 전략
 * - 같은 오리진(HTML/아이콘/매니페스트): 캐시 우선 → 네트워크 폴백 + 런타임 캐시
 * - CDN 폰트(Google/jsDelivr): 캐시 우선 → 네트워크 폴백
 * - 그 외: 브라우저 기본 처리
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFont =
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.jsdelivr.net');

  if (!isSameOrigin && !isFont) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          /* 오프라인: 네비게이션 요청 → index.html로 폴백 */
          if (req.mode === 'navigate') return caches.match('index.html');
          return new Response('오프라인 상태입니다.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
    })
  );
});

/* 백그라운드 동기화: 새 콘텐츠 있으면 클라이언트에 알림 */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
