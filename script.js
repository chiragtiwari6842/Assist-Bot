document.getElementById('inputField').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && this.value.trim() !== '') {
        addMessage(this.value, 'user');
        sendMessageToBackend(this.value);
        this.value = '';  // Clear the input field
    }
});

document.getElementById('sendBtn').addEventListener('click', function() {
    const message = document.getElementById('inputField').value;
    if (message.trim() !== '') {
        addMessage(message, 'user');
        sendMessageToBackend(message);
        document.getElementById('inputField').value = '';  // Clear the input field
    }
});

document.getElementById('clearBtn').addEventListener('click', function() {
    document.getElementById('messages').innerHTML = '';
});

document.getElementById('micBtn').addEventListener('click', function() {
    startSpeechRecognition();
});

document.getElementById('imageInput').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            addMessage(`<img src="${imageUrl}" alt="Image" class="image-message">`, 'user');
        };
        reader.readAsDataURL(file);
    }
});

function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    messageElement.innerHTML = message;
    document.getElementById('messages').appendChild(messageElement);
    scrollToBottom();
}

function sendMessageToBackend(message) {
    // Replace with your backend integration
    // Example: Fetch API to call your backend
    // fetch('/api/chat', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ message: message }),
    // })
    // .then(response => response.json())
    // .then(data => addMessage(data.reply, 'bot'));

    // For now, simulate bot response
    setTimeout(() => {
        const botReply = 'This is a bot reply to: ' + message;
        addMessage(botReply, 'bot');
    }, 1000);  // Simulate a 1-second delay
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Speech recognition functionality
function startSpeechRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('inputField').value = transcript;
        addMessage(transcript, 'user');
        sendMessageToBackend(transcript);
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error', event);
    };
}
