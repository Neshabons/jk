const API_BASE = 'http://localhost:3000/api';

console.log('✅ requests.js loaded');

// Проверка авторизации
function checkAuth() {
    const userKey = localStorage.getItem('userKey');
    const username = localStorage.getItem('currentUsername');
    console.log('🔐 Auth check:', { userKey: !!userKey, username });
    return !!userKey;
}

// Требование авторизации
function requireAuth() {
    if (!checkAuth()) {
        alert('Для создания заявок необходимо войти в систему');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Получение текущего пользователя
function getCurrentUser() {
    return localStorage.getItem('currentUsername') || 'Неизвестный пользователь';
}

// Показать форму заявки
function showRequestForm() {
    console.log('📝 Show request form');
    if (!requireAuth()) return; 
    
    const form = document.getElementById("request-form");
    if (form) {
        form.classList.remove("hidden");
        console.log('✅ Form shown');
    }
}

// Отправить заявку
async function submitRequest() {
    console.log('📤 Submit request');
    if (!requireAuth()) return;

    const title = document.getElementById("request-title").value.trim();
    const description = document.getElementById("request-description").value.trim();
    const priority = document.getElementById("request-priority").value;

    if (!title || !description) {
        alert("Пожалуйста, заполните все поля.");
        return;
    }

    const userKey = localStorage.getItem('userKey');
    
    try {
        const response = await fetch(`${API_BASE}/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': userKey
            },
            body: JSON.stringify({ title, description, priority })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Заявка создана успешно!');
            resetForm();
            await displayRequests();
        } else {
            alert('Ошибка создания заявки: ' + data.error);
        }
    } catch (error) {
        console.error('Submit request error:', error);
        alert('Ошибка соединения с сервером');
    }
}

// Сброс формы
function resetForm() {
    console.log('🔄 Reset form');
    document.getElementById("request-title").value = "";
    document.getElementById("request-description").value = "";
    document.getElementById("request-form").classList.add("hidden");
}

// Загрузка и отображение заявок
async function displayRequests() {
    console.log('📂 Display requests');
    const container = document.getElementById("requests-container");
    if (!container) {
        console.error('❌ requests-container not found');
        return;
    }
    
    container.innerHTML = "";

    // Показать/скрыть кнопку создания
    const createButton = document.getElementById('create-request-btn');
    if (createButton) {
        createButton.style.display = checkAuth() ? 'block' : 'none';
        console.log('🔄 Create button display:', createButton.style.display);
    }

    if (!checkAuth()) {
        container.innerHTML = '<div class="no-requests">Для просмотра заявок необходимо войти в систему</div>';
        return;
    }

    const userKey = localStorage.getItem('userKey');
    
    try {
        const response = await fetch(`${API_BASE}/requests`, {
            headers: {
                'Authorization': userKey
            }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки заявок');
        }

        const requests = await response.json();
        console.log('📥 Loaded requests:', requests.length);

        if (requests.length === 0) {
            container.innerHTML = '<div class="no-requests">Заявок пока нет</div>';
            return;
        }

        requests.forEach(request => {
            const requestDiv = document.createElement("div");
            requestDiv.classList.add("request", `priority-${request.priority}`, `status-${request.status}`);
            
            requestDiv.innerHTML = `
                <div class="request-header">
                    <h4>${escapeHtml(request.title)}</h4>
                    <span class="status-badge status-${request.status}">${getStatusText(request.status)}</span>
                </div>
                <p>${escapeHtml(request.description)}</p>
                <div class="request-footer">
                    <div class="request-meta">
                        <small>Создано: ${formatDate(request.created_at)}</small>
                        <small>Автор: <strong>${escapeHtml(request.username)}</strong></small>
                        <small>Приоритет: ${getPriorityText(request.priority)}</small>
                        ${request.updated_at !== request.created_at ? 
                            `<small>Обновлено: ${formatDate(request.updated_at)}</small>` : ''}
                    </div>
                    <div class="request-actions">
                        ${getCurrentUser() === request.username ? `
                            <button onclick="deleteRequest(${request.id})" class="btn-delete">Удалить</button>
                        ` : ''}
                    </div>
                </div>
            `;

            container.appendChild(requestDiv);
        });

    } catch (error) {
        console.error('Error loading requests:', error);
        container.innerHTML = '<div class="error">Ошибка загрузки заявок</div>';
    }
}

// Удаление заявки
async function deleteRequest(id) {
    console.log('🗑️ Delete request:', id);
    if (!requireAuth()) return; 
    
    if (!confirm('Вы уверены, что хотите удалить эту заявку?')) {
        return;
    }

    const userKey = localStorage.getItem('userKey');
    
    try {
        const response = await fetch(`${API_BASE}/requests/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': userKey
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Заявка удалена успешно!');
            await displayRequests();
        } else {
            alert('Ошибка удаления заявки: ' + data.error);
        }
    } catch (error) {
        console.error('Delete request error:', error);
        alert('Ошибка соединения с сервером');
    }
}

// Вспомогательные функции
function getStatusText(status) {
    const statuses = {
        'new': '🆕 Новая',
        'in-progress': '🔄 В работе',
        'completed': '✅ Завершена', 
        'rejected': '❌ Отклонена'
    };
    return statuses[status] || status;
}

function getPriorityText(priority) {
    const priorities = {
        'low': '🟢 Низкий',
        'medium': '🟡 Средний',
        'high': '🟠 Высокий',
        'critical': '🔴 Критический'
    };
    return priorities[priority] || priority;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('ru-RU');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded in requests.js');
    displayRequests();
});

// Глобальные функции
window.showRequestForm = showRequestForm;
window.submitRequest = submitRequest;
window.resetForm = resetForm;
window.deleteRequest = deleteRequest;
window.displayRequests = displayRequests;

console.log('✅ requests.js initialized');