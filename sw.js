/**
 * ═══════════════════════════════════════════════════════
 * 바이탈그라피 생기코치 - Service Worker (PWA)
 * ═══════════════════════════════════════════════════════
 */

const CACHE_NAME = 'vitalgraphi-coach-v4.0.0';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/config.js',
  './js/utils.js',
  './js/data-manager.js',
  './js/cafe24-api.js',
  './js/recommendation-engine.js',
  './js/app.js',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
];

/**
 * Service Worker 설치
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

/**
 * Service Worker 활성화
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Fetch 이벤트 (네트워크 요청 가로채기)
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에 있으면 캐시 반환
        if (response) {
          return response;
        }

        // 없으면 네트워크 요청
        return fetch(event.request).then((response) => {
          // 유효한 응답이 아니면 그대로 반환
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답 복제하여 캐시에 저장
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // 네트워크 오류 시 오프라인 페이지 반환 (옵션)
        return caches.match('./index.html');
      })
  );
});

/**
 * 백그라운드 동기화
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-consultation') {
    event.waitUntil(syncConsultationData());
  }
});

/**
 * 푸시 알림 수신
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '바이탈그라피';
  const options = {
    body: data.body || '새로운 알림이 있습니다',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    data: data.url || '/',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * 알림 클릭 이벤트
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

/**
 * 문진 데이터 동기화
 */
async function syncConsultationData() {
  try {
    // IndexedDB에서 동기화할 데이터 가져오기
    const data = await getUnsyncedData();
    
    if (data && data.length > 0) {
      // 서버로 전송
      for (const item of data) {
        const response = await fetch('/api/consultations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          // 동기화 성공 시 로컬 데이터 업데이트
          await markAsSynced(item.id);
        }
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

/**
 * 동기화되지 않은 데이터 가져오기
 */
async function getUnsyncedData() {
  // IndexedDB 구현 필요
  return [];
}

/**
 * 동기화 완료 표시
 */
async function markAsSynced(id) {
  // IndexedDB 구현 필요
}
