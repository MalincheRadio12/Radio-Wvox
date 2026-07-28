// ========================================== //
// CHAT EN VIVO CON FIREBASE                  //
// ========================================== //

// ========================================== //
// CONFIGURACIÓN DE FIREBASE                  //
// ========================================== //
const firebaseConfig = {
    apiKey: "AIzaSyCwBKq4hOSc4TmY87xMUJCGhfMV8afA4Qs",
    authDomain: "radio-wvox-fm-28f00.firebaseapp.com",
    projectId: "radio-wvox-fm-28f00",
    storageBucket: "radio-wvox-fm-28f00.firebasestorage.app",
    messagingSenderId: "554075648438",
    appId: "1:554075648438:web:425fefbfe31707bd3e1117",
    measurementId: "G-N8T7F4BD5C"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Referencia a la colección de mensajes en Firestore
const chatRef = firebase.firestore().collection('chat');

// ========================================== //
// ELEMENTOS DEL DOM                          //
// ========================================== //
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const emojiPicker = document.getElementById('emojiPicker');
const emojiButton = document.getElementById('emojiButton');
const sendBtn = document.getElementById('send-chat-btn');
const chatModal = document.getElementById('chat-modal');

// ========================================== //
// VARIABLES                                  //
// ========================================== //
let isFirstLoad = true;
let messageCount = 0; // Para alternar mensajes

// ========================================== //
// FUNCIÓN: ABRIR/CERRAR MODAL                //
// ========================================== //
function openChatModal() {
    chatModal.style.display = 'block';
    chatModal.style.opacity = '1';
    setTimeout(() => chatInput.focus(), 300);
}

function closeChatModal() {
    chatModal.style.display = 'none';
    chatModal.style.opacity = '0';
}

// ========================================== //
// FUNCIÓN: CREAR MENSAJE EN EL DOM           //
// ========================================== //
function createMessageElement(user, text, timestamp) {
    const msgDiv = document.createElement('div');
    
    // Alternar entre izquierda y derecha (uno y uno)
    const isRight = messageCount % 2 === 0;
    messageCount++;
    
    // Asignar clase según la posición
    msgDiv.className = `chat-msg ${isRight ? 'right' : 'left'}`;
    
    // Formatear hora
    let timeStr = 'Ahora';
    if (timestamp) {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    msgDiv.innerHTML = `
        <div class="text">${text.replace(/\n/g, '<br>')}</div>
        <div class="time">${timeStr}</div>
    `;
    
    return msgDiv;
}

// ========================================== //
// FUNCIÓN: MOSTRAR MENSAJE DE BIENVENIDA     //
// ========================================== //
function showWelcomeMessage() {
    chatRef.limit(1).get().then((snapshot) => {
        if (snapshot.empty) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'chat-welcome';
            welcomeDiv.innerHTML = `
                <i class="fas fa-hand-peace" style="color: #ffd93d; font-size: 24px; display: block; margin-bottom: 6px;"></i>
                <span style="color: #1a1a2e; font-size: 14px; font-weight: 600;">
                    ¡Bienvenido a Radio Wvox Fm! 🎵
                </span>
                <span style="display: block; color: #666; font-size: 12px; margin-top: 4px;">
                    Comparte tu opinión y saluda a la comunidad
                </span>
            `;
            chatMessages.appendChild(welcomeDiv);
            
            // Agregar mensaje de bienvenida automático
            setTimeout(() => {
                const bienvenida = {
                    user: 'Radio Wvox',
                    message: '¡Hola! Bienvenido al chat en vivo. ¿Cómo estás hoy? 🎶',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                };
                chatRef.add(bienvenida);
            }, 500);
        }
    });
}

// ========================================== //
// ENVIAR MENSAJE A FIREBASE                  //
// ========================================== //
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    // Enviar a Firebase como "Tú"
    chatRef.add({
        user: 'Tú',
        message: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    chatInput.value = '';
    chatInput.focus();
}

// ========================================== //
// ESCUCHAR MENSAJES EN TIEMPO REAL           //
// ========================================== //
chatRef.orderBy('timestamp', 'asc').onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
        if (change.type === 'added') {
            const data = change.doc.data();
            const user = data.user || 'Oyente';
            const message = data.message || '';
            const timestamp = data.timestamp;
            
            const msgElement = createMessageElement(user, message, timestamp);
            chatMessages.appendChild(msgElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            const welcomeMsg = chatMessages.querySelector('.chat-welcome');
            if (welcomeMsg) welcomeMsg.remove();
        }
    });
    
    if (isFirstLoad) {
        isFirstLoad = false;
        setTimeout(() => {
            if (chatMessages.children.length === 0) {
                showWelcomeMessage();
            }
        }, 1000);
    }
});

// ========================================== //
// EVENTOS DEL CHAT                          //
// ========================================== //

// 1. Abrir modal de chat
document.getElementById('chat-btn').onclick = openChatModal;

// 2. Enviar con botón
sendBtn.addEventListener('click', sendMessage);

// 3. Enviar con Enter
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 4. Emoji Picker - Mostrar/Ocultar
emojiButton.addEventListener('click', (e) => {
    e.stopPropagation();
    emojiPicker.style.display = emojiPicker.style.display === 'flex' ? 'none' : 'flex';
});

// 5. Emoji Picker - Seleccionar emoji
emojiPicker.querySelectorAll('span').forEach(emoji => {
    emoji.addEventListener('click', (e) => {
        e.stopPropagation();
        chatInput.value += emoji.textContent;
        chatInput.focus();
        emojiPicker.style.display = 'none';
    });
});

// 6. Cerrar emoji picker al hacer clic fuera
document.addEventListener('click', () => {
    emojiPicker.style.display = 'none';
});

// 7. Cerrar modal con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatModal.style.display === 'block') {
        closeChatModal();
    }
});

// ========================================== //
// EXPORTAR FUNCIONES PARA USO GLOBAL        //
// ========================================== //
window.sendMessage = sendMessage;
window.closeChatModal = closeChatModal;

console.log('💬 Chat en vivo iniciado - Conversación alternada');
