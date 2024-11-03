// Abre el modal de chat
document.getElementById('chat-btn').onclick = function() {
    document.getElementById('chat-modal').classList.add('show');
};

// Cierra el modal de chat
function closeChatModal() {
    document.getElementById('chat-modal').classList.remove('show');
}

// Configuración de Firebase
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
var chatRef = firebase.firestore().collection('chat');

// Enviar un mensaje
function sendMessage() {
    var message = document.getElementById('chat-input').value;
    if (message.trim() !== "") {
        chatRef.add({
            "message": message,
            "timestamp": firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('chat-input').value = '';
    }
}

// Mostrar mensajes en tiempo real
chatRef.orderBy('timestamp').onSnapshot(function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
        if (change.type === 'added') {
            var message = change.doc.data().message;
            var messageElement = document.createElement('div');
            messageElement.textContent = message;
            document.getElementById('chat-messages').appendChild(messageElement);
        }
    });
});

