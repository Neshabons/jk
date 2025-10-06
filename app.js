const API_BASE = window.location.origin + '/api';

// Функция для показа сообщений
function showMessage(elementId, text, type = 'success') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        
        // Автоскрытие для успешных сообщений
        if (type === 'success') {
            setTimeout(() => {
                element.classList.add('hidden');
            }, 3000);
        }
    }
}

// Регистрация
async function register() {
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    
    if (!username || !password) {
        showMessage('register-message', 'Заполните все поля!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('register-message', 'Регистрация успешна! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMessage('register-message', data.error, 'error');
        }
    } catch (error) {
        showMessage('register-message', 'Ошибка соединения с сервером', 'error');
    }
}

// Вход
async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    if (!username || !password) {
        showMessage('login-message', 'Заполните все поля!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Сохраняем данные пользователя
            localStorage.setItem('userKey', data.userKey);
            localStorage.setItem('currentUsername', data.username);
            
            showMessage('login-message', 'Вход выполнен успешно! Перенаправление...', 'success');
            setTimeout(() => {
                window.location.href = 'site.html';
            }, 1500);
        } else {
            showMessage('login-message', data.error, 'error');
        }
    } catch (error) {
        showMessage('login-message', 'Ошибка соединения с сервером', 'error');
    }
}

// Выход
function logout() {
    localStorage.removeItem('userKey');
    localStorage.removeItem('currentUsername');
    window.location.href = 'site.html';
}

// Проверка валидности токена
async function validateToken(userKey) {
    if (!userKey) return false;
    
    try {
        const response = await fetch(`${API_BASE}/user`, {
            headers: {
                'Authorization': userKey
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Загрузка сообщений
async function loadMessages() {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const userKey = localStorage.getItem('userKey');
    if (!userKey) {
        console.log('No user key, cannot load messages');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/messages`, {
            headers: {
                'Authorization': userKey
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            displayMessages(messages);
        } else if (response.status === 401 || response.status === 403) {
            console.log('Authentication failed in loadMessages, logging out...');
            logout();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Отображение сообщений
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">Сообщений пока нет</div>';
        return;
    }
    
    messagesContainer.innerHTML = messages.map(msg => `
        <div class="message-item">
            <div class="message-header">
                <span class="message-username">${msg.username}</span>
                <span class="message-time">${formatTime(msg.timestamp)}</span>
            </div>
            <div class="message-text">${msg.text}</div>
        </div>
    `).join('');
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Форматирование времени
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

// Отправка сообщения
async function sendMessage() {
    const input = document.getElementById('chat-input');
    const messageText = input.value.trim();
    
    if (!messageText) return;
    
    const userKey = localStorage.getItem('userKey');
    if (!userKey) {
        alert('Для отправки сообщений необходимо войти в систему');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userKey
            },
            body: JSON.stringify({ text: messageText })
        });
        
        if (response.ok) {
            input.value = '';
            await loadMessages(); // Перезагружаем сообщения
        } else {
            const data = await response.json();
            if (response.status === 401 || response.status === 403) {
                alert('Сессия истекла. Пожалуйста, войдите снова.');
                logout();
            } else {
                alert('Ошибка отправки сообщения: ' + data.error);
            }
        }
    } catch (error) {
        console.error('Send message error:', error);
        alert('Ошибка соединения с сервером');
    }
}

// Обновление информации о пользователе
async function updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    const authLinksElement = document.getElementById('auth-links');
    const welcomeElement = document.getElementById('Welcome');
    const chatElement = document.getElementById('chat');
    const createRequestBtn = document.getElementById('create-request-btn');
    
    const username = localStorage.getItem('currentUsername');
    const userKey = localStorage.getItem('userKey');
    
    console.log('Update user info:', { username, userKey });
    
    if (username && userKey) {
        // Проверяем валидность токена
        const isValid = await validateToken(userKey);
        
        if (isValid) {
            // Пользователь авторизован и токен валиден
            if (userInfoElement) userInfoElement.classList.remove('hidden');
            if (authLinksElement) authLinksElement.classList.add('hidden');
            if (welcomeElement) welcomeElement.classList.add('hidden');
            if (chatElement) chatElement.classList.remove('hidden');
            if (createRequestBtn) createRequestBtn.style.display = 'block';
            
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) usernameDisplay.textContent = username;
            
            // Загружаем сообщения только если есть контейнер для них
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                await loadMessages();
            }
            
        } else {
            // Токен невалиден, разлогиниваем
            console.log('Token invalid, logging out');
            logout();
        }
    } else {
        // Пользователь не авторизован
        if (userInfoElement) userInfoElement.classList.add('hidden');
        if (authLinksElement) authLinksElement.classList.remove('hidden');
        if (welcomeElement) welcomeElement.classList.remove('hidden');
        if (chatElement) chatElement.classList.add('hidden');
        if (createRequestBtn) createRequestBtn.style.display = 'none';
        
        // Показываем сообщение о необходимости авторизации на странице заявок
        const requestsContainer = document.getElementById('requests-container');
        if (requestsContainer && !userKey) {
            requestsContainer.innerHTML = '<div class="no-requests">Для просмотра заявок необходимо войти в систему</div>';
        }
    }
}

// Инициализация страницы заявок
function initRequestsPage() {
    const createRequestBtn = document.getElementById('create-request-btn');
    const requestsContainer = document.getElementById('requests-container');
    
    if (!createRequestBtn || !requestsContainer) {
        return; // Не страница заявок
    }
    
    console.log('Initializing requests page...');
    
    const userKey = localStorage.getItem('userKey');
    const username = localStorage.getItem('currentUsername');
    
    if (userKey && username) {
        createRequestBtn.style.display = 'block';
        // Если функция displayRequests существует, вызываем её
        if (typeof displayRequests === 'function') {
            console.log('Calling displayRequests...');
            displayRequests();
        } else {
            console.log('displayRequests function not found');
        }
    } else {
        createRequestBtn.style.display = 'none';
        requestsContainer.innerHTML = '<div class="no-requests">Для просмотра заявок необходимо войти в систему</div>';
    }
}

// Обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    updateUserInfo();
    initRequestsPage();
    
    // Обработчик Enter в поле ввода сообщения
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Обработчики Enter в формах авторизации
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                register();
            }
        });
    }
});

// Глобальные функции для HTML
window.login = login;
window.register = register;
window.logout = logout;
window.sendMessage = sendMessage;
