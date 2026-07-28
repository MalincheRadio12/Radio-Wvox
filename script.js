// ============================================ //
// REGISTRO DEL SERVICE WORKER                 //
// ============================================ //

// Función para registrar el Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Esperar a que la página cargue completamente
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registrado con éxito:', registration);
          
          // Verificar actualizaciones cada 30 segundos
          setInterval(() => {
            registration.update();
          }, 30000);

          // Escuchar actualizaciones del Service Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 Nueva versión del Service Worker encontrada');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('📦 Nueva versión disponible - Recarga la página para actualizar');
                // Mostrar notificación al usuario
                showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Error al registrar el Service Worker:', error);
        });

      // Detectar cambios en el Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker actualizado');
        // Recargar automáticamente si hay nueva versión
        // window.location.reload();
      });
    });
  } else {
    console.warn('⚠️ Service Worker no soportado en este navegador');
  }
}

// ============================================ //
// NOTIFICACIÓN DE ACTUALIZACIÓN               //
// ============================================ //
function showUpdateNotification() {
  // Crear notificación personalizada
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 16px 24px;
    border-radius: 16px;
    z-index: 99999;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
      <span style="font-size: 24px;">🔄</span>
      <span style="font-size: 16px; font-weight: 600;">Nueva versión disponible</span>
    </div>
    <p style="margin: 0 0 12px 0; font-size: 13px; opacity: 0.8;">
      Haz clic en actualizar para obtener la última versión.
    </p>
    <div style="display: flex; gap: 10px; justify-content: center;">
      <button onclick="updateApp()" style="
        background: linear-gradient(135deg, #0084ff, #6c5ce7);
        border: none;
        color: white;
        padding: 8px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
      ">Actualizar</button>
      <button onclick="this.closest('div[style]').remove()" style="
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 8px 24px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s;
      ">Cerrar</button>
    </div>
  `;

  document.body.appendChild(notification);

  // Eliminar después de 30 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      setTimeout(() => notification.remove(), 500);
    }
  }, 30000);
}

// ============================================ //
// FUNCIÓN PARA ACTUALIZAR APP                 //
// ============================================ //
function updateApp() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
      // Mostrar mensaje de actualización
      const notification = document.querySelector('div[style*="bottom: 100px"]');
      if (notification) {
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">✅</span>
            <span style="font-size: 16px; font-weight: 600;">¡Actualizando!</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.8;">
            La página se recargará automáticamente...
          </p>
        `;
      }
      
      // Recargar después de un momento
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    });
  }
}

// ============================================ //
// COMPROBAR SI LA APP ESTÁ INSTALADA          //
// ============================================ //
function checkIfInstalled() {
  // Verificar si la app está en modo standalone (instalada)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  if (isStandalone) {
    console.log('📱 App instalada y ejecutándose en modo standalone');
    document.body.classList.add('app-installed');
  } else {
    console.log('🌐 App ejecutándose en el navegador');
  }
}

// ============================================ //
// DETECTAR INSTALACIÓN DE LA APP              //
// ============================================ //
window.addEventListener('appinstalled', (event) => {
  console.log('📱 App instalada exitosamente');
  // Mostrar mensaje de bienvenida
  showInstallSuccess();
});

function showInstallSuccess() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0084ff, #6c5ce7);
    color: white;
    padding: 16px 24px;
    border-radius: 16px;
    z-index: 99999;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 132, 255, 0.4);
    animation: slideDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 28px;">🎉</span>
      <div>
        <div style="font-weight: 600; font-size: 16px;">¡Radio Wvox instalada!</div>
        <div style="font-size: 12px; opacity: 0.9;">Disfruta de la mejor música en tu dispositivo</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// ============================================ //
// INICIALIZACIÓN                              //
// ============================================ //

// Registrar Service Worker
registerServiceWorker();

// Verificar instalación
checkIfInstalled();

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(1);
    }
  }
`;
document.head.appendChild(style);

console.log('📻 Radio Wvox Fm - PWA inicializada correctamente');
