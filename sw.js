const CACHE_NAME = 'radio-wvox-v2';
const CACHE_EXPIRATION = 20 * 60; // 20 minutos en segundos

// Recursos a cachear - ACTUALIZADOS con todos los archivos necesarios
const RESOURCES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/sw.js',
  '/js/lunaradio-sincors.js',
  '/js/audifonos.png',
  '/js/logo.png',
  '/js/logo3.png',
  '/js/foto1.webp',
  '/js/uttlogo.png',
  '/js/fondo2.mp4',
  '/js/no-wifi.png',
  
  // Iconos PWA
  '/js/01.png',
  '/js/2.png',
  '/js/3.png',
  '/js/4.png',
  '/js/5.png',
  '/js/6.png',
  '/js/7.png',
  '/js/8.png',
  '/js/9.png'
];

// URLs que NO deben cachearse (archivos dinámicos o externos)
const EXCLUDED_URLS = [
  'https://stream.zeno.fm/',
  'https://www.gstatic.com/',
  'https://cdnjs.cloudflare.com/',
  'https://code.jquery.com/',
  'https://firebase',
  'chrome-extension'
];

// ============================================ //
// INSTALACIÓN DEL SERVICE WORKER              //
// ============================================ //
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cacheando recursos...');
        return cache.addAll(RESOURCES_TO_CACHE)
          .then(() => {
            console.log('✅ Recursos cacheados correctamente');
          })
          .catch((error) => {
            console.error('❌ Error al cachear recursos:', error);
          });
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================ //
// ACTIVACIÓN DEL SERVICE WORKER               //
// ============================================ //
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('🗑️ Eliminando caché antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado');
        return self.clients.claim();
      })
  );
});

// ============================================ //
// INTERCEPCIÓN DE PETICIONES (FETCH)          //
// ============================================ //
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // Excluir peticiones a URLs externas que no deben cachearse
  const shouldExclude = EXCLUDED_URLS.some(url => requestUrl.includes(url));
  
  // Excluir peticiones POST y otras que no sean GET
  if (event.request.method !== 'GET' || shouldExclude) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Primero intentamos obtener de la caché
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        // Verificar si la caché ha expirado
        const cachedTime = cachedResponse.headers.get('sw-cache-time');
        if (cachedTime) {
          const age = (Date.now() - parseInt(cachedTime)) / 1000;
          if (age < CACHE_EXPIRATION) {
            // La caché es válida - devolver respuesta
            return cachedResponse;
          }
        } else {
          // Sin timestamp, devolver caché pero actualizar en background
          updateCache(event.request, cache);
          return cachedResponse;
        }
      }

      // Si no está en caché o expiró, ir a la red
      try {
        const networkResponse = await fetch(event.request);
        
        // Solo cachear respuestas exitosas
        if (networkResponse && networkResponse.status === 200) {
          // Clonar la respuesta para poder cachearla y devolverla
          const responseToCache = networkResponse.clone();
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cache-time', Date.now().toString());
          
          const cachedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });
          
          cache.put(event.request, cachedResponse);
        }
        
        return networkResponse;
      } catch (error) {
        console.warn('⚠️ Error de red, sirviendo desde caché si es posible');
        // Si falla la red y no tenemos caché, mostrar página offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline - No se pudo cargar el recurso', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })
  );
});

// ============================================ //
// ACTUALIZAR CACHÉ EN BACKGROUND              //
// ============================================ //
async function updateCache(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const cachedResponse = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
  } catch (error) {
    // Silenciar errores de actualización en background
  }
}

// ============================================ //
// MANEJO DE MENSAJES                          //
// ============================================ //
self.addEventListener('message', (event) => {
  if (event.data === 'clearCache') {
    caches.open(CACHE_NAME).then(cache => {
      cache.keys().then(keys => {
        keys.forEach(key => {
          cache.delete(key);
        });
        console.log('🗑️ Caché limpiada');
      });
    });
  }
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// ============================================ //
// MANEJO DE NOTIFICACIONES PUSH               //
// ============================================ //
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '🎵 ¡Nueva transmisión en Radio Wvox Fm!',
    icon: '/js/audifonos.png',
    badge: '/js/8.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir Radio'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('📻 Radio Wvox Fm', options)
  );
});

// ============================================ //
// MANEJO DE CLIC EN NOTIFICACIONES            //
// ============================================ //
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url && client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('📻 Service Worker de Radio Wvox Fm cargado');
