// requests2.js - ультра-минимальная версия
console.log('🎯 REQUESTS2.JS STARTED LOADING');

// Сразу регистрируем функции глобально
window.showRequestForm = function() {
    console.log('✅ showRequestForm EXECUTED!');
    const form = document.getElementById("request-form");
    if (form) {
        form.classList.remove("hidden");
        console.log('✅ Form shown!');
    }
};

window.submitRequest = function() {
    console.log('✅ submitRequest called');
    const title = document.getElementById("request-title").value;
    const description = document.getElementById("request-description").value;
    
    if (!title || !description) {
        alert("Заполните все поля");
        return;
    }
    
    alert('Заявка отправлена!');
    
    // Сброс формы
    document.getElementById("request-title").value = "";
    document.getElementById("request-description").value = "";
    document.getElementById("request-form").classList.add("hidden");
};

window.resetForm = function() {
    console.log('✅ resetForm called');
    document.getElementById("request-title").value = "";
    document.getElementById("request-description").value = "";
    document.getElementById("request-form").classList.add("hidden");
};

console.log('🎯 REQUESTS2.JS LOADED SUCCESSFULLY');
console.log('🔍 Functions registered:', {
    showRequestForm: typeof window.showRequestForm,
    submitRequest: typeof window.submitRequest,
    resetForm: typeof window.resetForm
});
