const API_BASE = window.location.origin + '/api';
console.log('API Base URL:', API_BASE);

console.log('✅ requests2.js started loading');

// Основные функции
function showRequestForm() {
    console.log('📝 Show request form called');
    const form = document.getElementById("request-form");
    if (form) {
        form.classList.remove("hidden");
        console.log('✅ Form shown');
    } else {
        console.error('❌ Form element not found');
    }
}

function submitRequest() {
    console.log('📤 Submit request called');
    const title = document.getElementById("request-title").value.trim();
    const description = document.getElementById("request-description").value.trim();
    const priority = document.getElementById("request-priority").value;
    
    if (!title || !description) {
        alert("Пожалуйста, заполните все поля.");
        return;
    }
    
    console.log('📤 Sending request:', { title, description, priority });
    
    const userKey = localStorage.getItem('userKey');
    if (!userKey) {
        alert('Ошибка авторизации');
        return;
    }
    
    fetch(API_BASE + '/requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': userKey
        },
        body: JSON.stringify({ title, description, priority })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Заявка создана успешно!');
            resetForm();
            displayRequests();
        } else {
            alert('Ошибка: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка соединения с сервером');
    });
}

function resetForm() {
    console.log('🔄 Reset form called');
    document.getElementById("request-title").value = "";
    document.getElementById("request-description").value = "";
    document.getElementById("request-priority").value = "medium";
    const form = document.getElementById("request-form");
    if (form) form.classList.add("hidden");
}

// Функция для отображения заявок
async function displayRequests() {
    console.log('📂 Displaying requests');
    const container = document.getElementById("requests-container");
    
    if (!container) {
        console.error('❌ Container not found');
        return;
    }
    
    const userKey = localStorage.getItem('userKey');
    if (!userKey) {
        container.innerHTML = '<div class="no-requests">Для просмотра заявок необходимо войти в систему</div>';
        return;
    }
    
    try {
        const response = await fetch(API_BASE + '/requests', {
            headers: {
                'Authorization': userKey
            }
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки заявок');
        }
        
        const requests = await response.json();
        console.log('📥 Loaded requests:', requests);
        
        if (requests.length === 0) {
            container.innerHTML = '<div class="no-requests">Заявок пока нет</div>';
            return;
        }
        
        container.innerHTML = '';
        
        requests.forEach(request => {
            const requestElement = document.createElement('div');
            requestElement.className = `request priority-${request.priority} status-${request.status}`;
            requestElement.innerHTML = `
                <div class="request-header">
                    <h4>${request.title}</h4>
                    <span class="status-badge status-${request.status}">${getStatusText(request.status)}</span>
                </div>
                <p>${request.description}</p>
                <div class="request-footer">
                    <div class="request-meta">
                        <small>Создано: ${new Date(request.created_at).toLocaleString('ru-RU')}</small>
                        <small>Автор: <strong>${request.username}</strong></small>
                        <small>Приоритет: ${getPriorityText(request.priority)}</small>
                    </div>
                    <div class="request-actions">
                        <button class="btn-delete" data-id="${request.id}">Удалить</button>
                    </div>
                </div>
            `;
            container.appendChild(requestElement);
        });
        
        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', function() {
                const requestId = this.getAttribute('data-id');
                deleteRequest(requestId);
            });
        });
        
    } catch (error) {
        console.error('Error loading requests:', error);
        container.innerHTML = '<div class="error">Ошибка загрузки заявок</div>';
    }
}

// Функция удаления заявки
async function deleteRequest(id) {
    if (!confirm('Удалить эту заявку?')) return;
    
    const userKey = localStorage.getItem('userKey');
    if (!userKey) return;
    
    try {
        const response = await fetch(API_BASE + '/requests/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': userKey
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Заявка удалена');
            displayRequests();
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        alert('Ошибка соединения');
    }
}

// Вспомогательные функции
function getStatusText(status) {
    const statusMap = {
        'new': '🆕 Новая',
        'in-progress': '🔄 В работе',
        'completed': '✅ Завершена',
        'rejected': '❌ Отклонена'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'low': '🟢 Низкий',
        'medium': '🟡 Средний', 
        'high': '🟠 Высокий',
        'critical': '🔴 Критический'
    };
    return priorityMap[priority] || priority;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, initializing...');
    
    // Проверяем авторизацию и показываем кнопку создания заявки
    const userKey = localStorage.getItem('userKey');
    const createBtn = document.getElementById('create-request-btn');
    
    if (userKey && createBtn) {
        createBtn.style.display = 'block';
        console.log('✅ User authorized, show create button');
    }
    
    // Загружаем заявки
    displayRequests();
    
    console.log('🎉 requests2.js initialized successfully');
});

// Регистрируем функции глобально
window.showRequestForm = showRequestForm;
window.submitRequest = submitRequest;
window.resetForm = resetForm;
window.displayRequests = displayRequests;
window.deleteRequest = deleteRequest;

console.log('✅ requests2.js loaded');
