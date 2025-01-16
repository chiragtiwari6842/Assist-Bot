let selectedImage = null;  

const micBtn = document.getElementById('micBtn');
const micModal = document.getElementById('micModal');
const micClose = document.querySelector('.mic-close');
const inputField = document.getElementById('inputField');
const imageBtn = document.getElementById('imageBtn');
const sendBtn = document.getElementById('sendBtn');
const imageInput = document.getElementById('imageInput');
const messagesContainer = document.getElementById('messages');
const micImg = micBtn.querySelector('img'); 

let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob;

let context = [];

imageBtn.addEventListener('click', () => {
    imageInput.click();
});
window.onload = () => {
    const inputField = document.getElementById('inputField');
    inputField.focus();
};

imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    
    if (file) {
        selectedImage = file;  
        const reader = new FileReader();

        reader.onload = function(e) {
            const imgPreview = document.createElement('img');
            imgPreview.src = e.target.result;
            imgPreview.alt = 'Selected Image';

            addMessage(imgPreview, 'user');
            showThinkingAnimation();
            getCalories();
        };

        reader.readAsDataURL(file);
    }
});

inputField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && inputField.value.trim() !== '') {
        event.preventDefault(); 
        const messageText = inputField.value.trim();
        addMessage(messageText, 'user');
        sendMessageToBackend(messageText);
        inputField.value = ''; 
    }
});

sendBtn.addEventListener('click', () => {
    const messageText = inputField.value.trim();

    if (messageText) {
        addMessage(messageText, 'user');
        sendMessageToBackend(messageText);
        inputField.value = ''; 
    }
});

function showThinkingAnimation() {
    const thinkingMessage = document.createElement('div');
    thinkingMessage.classList.add('message', 'bot', 'thinking');
    thinkingMessage.innerHTML = 'Bot is thinking...';
    messagesContainer.appendChild(thinkingMessage);
    scrollToBottom();
}
function removeThinkingAnimation() {
    const thinkingMessage = document.querySelector('.message.thinking');
    if (thinkingMessage) {
        thinkingMessage.remove();
    }
}

function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    if (message instanceof HTMLImageElement) {
        messageElement.appendChild(message);  
    } else {
        messageElement.innerHTML = marked.parse(message);  
    }
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessageToBackend(message) {
    getRightAPI(message);
}

async function getCalories() {
    if (!selectedImage) {
        alert("Please select an image first!");
        return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
        const response = await fetch('https://vicious-shalne-koree-29e7c3e4.koyeb.app/api/calories', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch calories from API');
        }

        const data = await response.json();
        
        const responseBox = document.createElement('div');
        responseBox.classList.add('message', 'bot-message');
        removeThinkingAnimation();

        if (data.calories && /not a food/i.test(data.calories)) {
            const markdownText = `**This** is not a food item.\n\n**Estimated product**: ${data.food}`;
            responseBox.innerHTML = marked.parse(markdownText);
        }
        else if (data.calories && data.food) {
            const swiggySearchUrl = `https://www.swiggy.com/search?q=${encodeURIComponent(data.food)}&query=${encodeURIComponent(data.food)}`;
            const markdownText = `**Estimated Food:** ${data.food}\n\n**Estimated Calories**: **${data.calories}** cal/100gm\n\n**Order on Swiggy**: (<a href="${swiggySearchUrl}" target="_blank">${data.food} and related dishes on Swiggy</a>)`;
    
            responseBox.innerHTML =  marked.parse(markdownText);
        } else {
            responseBox.innerHTML = marked.parse("API response **does not** contain calories or food data.");
        }

        messagesContainer.appendChild(responseBox);
        scrollToBottom();

    } catch (error) {
        console.log(error);
        const responseBox = document.createElement('div');
        responseBox.classList.add('message', 'bot-message');
        responseBox.innerHTML = "Error: Could not fetch data from API.";
        messagesContainer.appendChild(responseBox);
        scrollToBottom();
    }
}

micBtn.addEventListener('click', async() => {
    micImg.src = 'assets/mic-btn-on.png';
    if(mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true});
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                recordedAudioBlob = new Blob(audioChunks, { type: 'audio/wav'});
                audioChunks = [];
                micImg.src = 'assets/mic-icon.png';

                micBtn.classList.remove("recording");

                //showLoading();  //write this
                await processAudio(recordedAudioBlob); 
                //hideLoading(); //write this
            };
            mediaRecorder.start();
            micBtn.classList.add("recording");
        }
        catch (error) {
            console.error("Microphone didn't get accessed, ", error);
        }
    }
})

async function processAudio(blob) {
    showThinkingAnimation();
    const formData = new FormData();
    formData.append("file", new File([blob], "recorded_audio.wav"));

    // const contextJson = JSON.stringify(context);
    // formData.append("context", contextJson);

    try {
        const response = await fetch("https://brief-auroora-anuraguniversity-530bb9d7.koyeb.app/process-audio/", {
            method: "POST",
            body: formData,
            
        });
        const data = await response.json();

        if (response.ok) {
            removeThinkingAnimation();
            context.push({ 'user': data.trancsript, 'response': data.response });
            addMessage(data.trancsript, "user")
            addMessage(data.response, "bot");
        } else {
            addMessage("Error: " + data.error, "bot");
        }
    } catch (error) {
        console.log(error);
        const responseBox = document.createElement('div');
        responseBox.classList.add('message', 'bot-message');
        responseBox.innerHTML = "Error: Could not fetch data from API.";
        messagesContainer.appendChild(responseBox);
        scrollToBottom();
    }
}

async function getRightAPI(userPrompt) {
    showThinkingAnimation();
    if (!userPrompt) {
        return;
    }
    try {
        // const response = await fetch('https://yammering-kristin-personalorgani-f2f18d5f.koyeb.app/api/main', {
        const response = await fetch("http://172.16.3.15:5000/api/main", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                'context': context,
                'query': userPrompt,
            }), 
        });

        if (!response.ok) {
            console.log("Something is definitely wrong");
            const responseBox = document.createElement('div');
            responseBox.classList.add('message', 'bot-message');
            responseBox.innerHTML = "Error: Something went wrong.";
            messagesContainer.appendChild(responseBox);
            scrollToBottom();
            removeThinkingAnimation();
            return; 
        }

        const data = await response.json();
        // console.log(data); 

        let reply;
        if (data.replyImage) {
            reply = data.replyImage;
            console.log("Reply is an image URL:", reply);
        } else {
            reply = data.reply;
            // console.log("Reply is text:", reply);
        }

        removeThinkingAnimation();
        context.push({ 'user': userPrompt, 'response': reply });
        console.log(context);
        addMessage(reply, "bot");

    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        const responseBox = document.createElement('div');
        responseBox.classList.add('message', 'bot-message');
        responseBox.innerHTML = "Error: Could not fetch data from API.";
        messagesContainer.appendChild(responseBox);
        scrollToBottom();
        removeThinkingAnimation();
    }
}
