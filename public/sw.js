// 캐시 전략 v5
//   - navigate(HTML)         : network-first, 실패 시 캐시
//   - /assets/*-[hash].js|css: 파일명에 해시가 있어 불변 → cache-first
//     단, 캐시 미스 시 fetch 실패하면 빈 응답으로 빠지지 말고 명확한 404 반환
//     (main.tsx의 vite:preloadError 자동 reload 핸들러가 받음)
//   - 그 외(아이콘·매니페스트·/apply·/system): network-first, 실패 시 캐시
// 배포 후 새로고침 한 번이면 즉시 최신 버전이 표시됨 (강력 새로고침 불필요).
//
// CACHE_NAME을 bump하면 activate 시 모든 옛 캐시가 자동 삭제됨 — 새 deploy로
// 청크 해시가 바뀐 경우 옛 청크 잔재 제거 효과.

const CACHE_NAME = 'eum-camp-shell-v5';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/app-icon.png',
  '/icons.svg',
];

// Vite 출력 패턴: /assets/<name>-<hash>.<ext>
const HASHED_ASSET = /\/assets\/[^/]+-[A-Za-z0-9_]{6,}\.(?:js|css|woff2?|png|jpg|svg)$/;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1) HTML 페이지 진입 → 항상 네트워크 우선 (오래된 HTML 차단)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // 2) 해시 자산(영구 불변) → 캐시 우선
  if (HASHED_ASSET.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  // 3) 그 외(아이콘·매니페스트·정적 페이지) → 네트워크 우선, 실패 시 캐시
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
