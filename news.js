
let news = JSON.parse(localStorage.getItem("news")) || [];


function showNewsForm() {
    if (!checkAuth()) {
        alert('Для добавления новостей необходимо войти в систему');
        window.location.href = 'login.html';
        return;
    }
    document.getElementById("news-form").classList.remove("hidden");
    document.getElementById("add-news-btn").style.display = "none";
}


function hideNewsForm() {
    document.getElementById("news-form").classList.add("hidden");
    document.getElementById("add-news-btn").style.display = "block";
    document.getElementById("news-title").value = "";
    document.getElementById("news-content").value = "";
    document.getElementById("news-image").value = "";
}


function addNews() {
    if (!checkAuth()) {
        alert('Для добавления новостей необходимо войти в систему');
        return;
    }

    const title = document.getElementById("news-title").value.trim();
    const content = document.getElementById("news-content").value.trim();
    const imageInput = document.getElementById("news-image");
    
    if (!title || !content) {
        alert("Пожалуйста, заполните заголовок и текст новости");
        return;
    }

    const newNews = {
        id: Date.now(),
        title: title,
        content: content,
        image: "",
        date: new Date().toISOString(),
        author: localStorage.getItem('currentUsername')
    };


    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newNews.image = e.target.result;
            saveNews(newNews);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveNews(newNews);
    }
}


function saveNews(newsItem) {
    news.push(newsItem);
    localStorage.setItem("news", JSON.stringify(news));
    displayNews();
    hideNewsForm();
    alert("Новость успешно добавлена!");
}


function deleteNews(id) {
    if (!checkAuth()) {
        alert('Для удаления новостей необходимо войти в систему');
        return;
    }

    const newsItem = news.find(item => item.id === id);
    const currentUser = localStorage.getItem('currentUsername');
    
    if (!newsItem) {
        alert('Новость не найдена');
        return;
    }


    if (newsItem.author !== currentUser) {
        alert('Вы можете удалять только свои новости');
        return;
    }

    if (confirm('Вы уверены, что хотите удалить эту новость?')) {
        news = news.filter(item => item.id !== id);
        localStorage.setItem("news", JSON.stringify(news));
        displayNews();
        alert('Новость успешно удалена');
    }
}


function displayNews() {
    const container = document.getElementById("news-container");
    const staticNewsContainer = document.getElementById("static-news");
    
    if (!container) return;
    

    container.innerHTML = "";


    if (news.length > 0) {
        const sortedNews = news.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedNews.forEach(item => {
            const newsItem = document.createElement("article");
            newsItem.classList.add("news-item");
            newsItem.dataset.id = item.id;
            
            const currentUser = localStorage.getItem('currentUsername');
            const canDelete = currentUser && currentUser === item.author;
            
            newsItem.innerHTML = `
                <div class="news-header">
                    <h2>${item.title}</h2>
                </div>
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="news-image">` : ''}
                <p style="white-space: pre-line">${item.content}</p>
                <div class="news-footer">
                    <div class="news-meta">
                        <small>Опубликовано: ${formatDate(item.date)}</small>
                        <small>Автор: ${item.author}</small>
                    </div>
                    ${canDelete ? `
                        <button class="delete-news-btn" onclick="deleteNews(${item.id})">
                            Удалить
                        </button>
                    ` : ''}
                </div>
            `;

            container.appendChild(newsItem);
        });
    }


    if (news.length === 0) {
        container.innerHTML = staticNewsContainer.innerHTML;
        staticNewsContainer.style.display = 'none'; 
    } else {
        staticNewsContainer.style.display = 'block'; 
    }
}
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('ru-RU');
}


function checkAuth() {
    return !!localStorage.getItem('currentUsername');
}


function getCurrentUser() {
    return localStorage.getItem('currentUsername');
}


document.addEventListener('DOMContentLoaded', function() {
    const savedNews = JSON.parse(localStorage.getItem("news"));
    if (savedNews) {
        news = savedNews;
    }
    
    displayNews();
    updateUserInfo();
});


function updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    const authLinksElement = document.getElementById('auth-links');
    const addButton = document.getElementById('add-news-btn');
    
    if (!userInfoElement || !authLinksElement) return;
    
    const username = getCurrentUser();
    
    if (username) {
        userInfoElement.classList.remove('hidden');
        document.getElementById('username-display').textContent = username;
        authLinksElement.classList.add('hidden');
        if (addButton) addButton.style.display = 'block';
    } else {
        userInfoElement.classList.add('hidden');
        authLinksElement.classList.remove('hidden');
        if (addButton) addButton.style.display = 'none';
    }
}