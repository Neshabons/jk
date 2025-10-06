// requests.js - с функцией отображения заявок
console.log(' requests.js started loading');

// Основные функции
function showRequestForm() {
    console.log(' showRequestForm called');
    const form = document.getElementById("request-form");
    if (form) {
        form.classList.remove("hidden");
        console.log('📋 Form shown');
    }
}

function submitRequest() {
    console.log('✅ submitRequest called');
    const title = document.getElementById("request-title").value.trim();
    const description = document.getElementById("request-description").value.trim();
    const priority = document.getElementById("request-priority").value;
    
    if (!title || !description) {
        alert("Пожалуйста, заполните все поля.");
        return;
    }
    
    console.log('📤 Sending request:', { title, description, priority });
    
    // Отправка на сервер
    const userKey = localStorage.getItem('userKey');
    if (!userKey) {
        alert('Ошибка авторизации');
        return;
    }
    
    fetch('http://localhost:3000/api/requests', {
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
            displayRequests(); // Обновляем список заявок
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
    console.log(' resetForm called');
    document.getElementById("request-title").value = "";
    document.getElementById("request-description").value = "";
    document.getElementById("request-form").classList.add("hidden");
}

// Функция для отображения заявок
async function displayRequests() {
    console.log(' Displaying requests');
    const container = document.getElementById("requests-container");
    
    if (!container) {
        console.error(' Container not found');
        return;
    }
    
    const userKey = localStorage.getItem('userKey');
    if (!userKey) {
        container.innerHTML = '<div class="no-requests">Для просмотра заявок необходимо войти в систему</div>';
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/requests', {
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
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Отображаем заявки
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
                        <button onclick="deleteRequest(${request.id})" class="btn-delete">Удалить</button>
                    </div>
                </div>
            `;
            container.appendChild(requestElement);
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
        const response = await fetch(`http://localhost:3000/api/requests/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': userKey
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Заявка удалена');
            displayRequests(); // Обновляем список
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
        'new': ' Новая',
        'in-progress': ' В работе',
        'completed': ' Завершена',
        'rejected': ' Отклонена'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'low': ' Низкий',
        'medium': ' Средний', 
        'high': ' Высокий',
        'critical': ' Критический'
    };
    return priorityMap[priority] || priority;
}

// Автоматически загружаем заявки при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded, displaying requests...');
    displayRequests();
});

// Регистрируем функции глобально
window.showRequestForm = showRequestForm;
window.submitRequest = submitRequest;
window.resetForm = resetForm;
window.displayRequests = displayRequests;
window.deleteRequest = deleteRequest;

console.log('🎉 requests.js loaded successfully');