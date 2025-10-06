
function getStorageItem(key, defaultValue = {}) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return defaultValue;
    }
}

function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Error writing to localStorage:', e);
        return false;
    }
}


function debugStorage() {
    console.log('=== LOCALSTORAGE DEBUG ===');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            const value = localStorage.getItem(key);
            console.log(`${key}:`, value);
        } catch (e) {
            console.log(`${key}: [Error reading]`);
        }
    }
    console.log('==========================');
}

function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    
    console.log('Register attempt:', {username, password});
    
    if (!username || !password) {
        alert('Заполните все поля!');
        return;
    }
    
    const users = getStorageItem('users', {});
    console.log('Current users from storage:', users);

    if (users[username]) {
        alert('Пользователь с таким именем уже существует!');
    } else {
        users[username] = password;
        
        if (setStorageItem('users', users)) {
            console.log('User successfully registered:', users);
            alert('Регистрация успешна! Пожалуйста, войдите.');
            
            // Принудительно обновляем данные перед переходом
            debugStorage();
            window.location.href = 'login.html';
        } else {
            alert('Ошибка сохранения данных!');
        }
    }
}

function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    console.log('Login attempt:', {username, password});
    
    if (!username || !password) {
        alert('Заполните все поля!');
        return;
    }
    
    const users = getStorageItem('users', {});
    console.log('Users available for login:', users);
    debugStorage(); 

    if (users[username] === password) {
        localStorage.setItem('currentUsername', username); 
        console.log('Login successful!');
        alert('Вход выполнен успешно!');
        window.location.href = 'site.html';
    } else {
        console.log('Login failed. Available users:', Object.keys(users));
        alert('Неверное имя пользователя или пароль!');
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function loadMessages() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) {
        console.log('Messages container not found');
        return;
    }
    
    const messages = getStorageItem('chatMessages', []);
    console.log('Loading messages:', messages.length);
    
    messagesContainer.innerHTML = '';
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">Сообщений пока нет</div>';
        return;
    }
    
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <strong>${msg.username}:</strong> 
            <span>${msg.text}</span>
            <small>${formatTime(msg.timestamp)}</small>
        `;
        messagesContainer.appendChild(messageElement);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const messageText = input.value.trim();
    
    if (!messageText) return;
    
    const username = localStorage.getItem('currentUsername');
    if (!username) {
        alert('Для отправки сообщений необходимо войти в систему');
        return;
    }
    
    const message = {
        username: username,
        text: messageText,
        timestamp: new Date().getTime()
    };
    
    const messages = getStorageItem('chatMessages', []);
    messages.push(message);
    
    const limitedMessages = messages.slice(-100);
    setStorageItem('chatMessages', limitedMessages);
    
    input.value = '';
    
    loadMessages();
}

function setupChatHandlers() {
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}


function updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    if (!userInfoElement) return;
    
    const username = localStorage.getItem('currentUsername');
    console.log('Current user:', username);
    
    if (username) {
        userInfoElement.classList.remove('hidden');
        document.getElementById('username-display').textContent = username;
        document.getElementById('auth-links').classList.add('hidden');
        document.getElementById('chat').classList.remove('hidden');
        document.getElementById('Welcome').classList.add('hidden');
        

        loadMessages();
        

        setupChatHandlers();
    } else {
        userInfoElement.classList.add('hidden');
        document.getElementById('auth-links').classList.remove('hidden');
        document.getElementById('chat').classList.add('hidden');
        document.getElementById('Welcome').classList.remove('hidden');
    }
}


function logout() {
    localStorage.removeItem('currentUsername');
    window.location.reload();
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded:', window.location.pathname);
    

    debugStorage();
    

    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
        console.log('Chat page detected, loading messages');
        loadMessages();
    }
    
    if (document.getElementById('user-info')) {
        updateUserInfo();
    }
    
    setupChatHandlers();
});