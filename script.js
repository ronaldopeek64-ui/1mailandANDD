const API_URL = 'https://1secmail.com';
let currentEmail = '';
let login = '';
let domain = '';

// 1. Генерация случайного имейла
async function generateEmail() {
    try {
        const response = await fetch(`${API_URL}?action=genRandomMailbox&count=1`);
        const data = await response.json();
        currentEmail = data[0];
        [login, domain] = currentEmail.split('@');
        
        document.getElementById('email-address').value = currentEmail;
        checkMessages(); 
    } catch (error) {
        console.error("Ошибка генерации email:", error);
    }
}

// 2. Проверка входящих писем
async function checkMessages() {
    if (!login || !domain) return;
    
    try {
        const response = await fetch(`${API_URL}?action=getMessages&login=${login}&domain=${domain}`);
        const emails = await response.json();
        const container = document.getElementById('letters-container');
        container.innerHTML = '';

        if (emails.length === 0) {
            container.innerHTML = '<p class="empty-text">Писем пока нет. Ожидание...</p>';
            return;
        }

        // Используем for...of для корректной последовательной обработки асинхронных запросов
        for (const msg of emails) {
            const msgResponse = await fetch(`${API_URL}?action=readMessage&login=${login}&domain=${domain}&id=${msg.id}`);
            const msgData = await msgResponse.json();

            const letter = document.createElement('div');
            letter.className = 'letter';

            // Создаем элементы через createElement, чтобы избежать XSS уязвимостей
            const titleFrom = document.createElement('h3');
            titleFrom.textContent = `От: ${msgData.from}`;

            const titleSubject = document.createElement('h4');
            titleSubject.textContent = `Тема: ${msgData.subject}`;

            const letterBody = document.createElement('div');
            letterBody.className = 'letter-body';
            
            // Если есть чистый текст - выводим его безопасно. Если только HTML - выводим как текст, чтобы скрипты из письма не выполнились
            letterBody.textContent = msgData.textBody || msgData.htmlBody || 'Пустое письмо';

            letter.appendChild(titleFrom);
            letter.appendChild(titleSubject);
            letter.appendChild(letterBody);
            container.appendChild(letter);
        }
    } catch (error) {
        console.error("Ошибка при получении писем:", error);
    }
}

// Кнопка копирования
document.getElementById('copy-btn').addEventListener('click', () => {
    const emailField = document.getElementById('email-address');
    if (!emailField.value || emailField.value === 'Генерация...') return;
    
    emailField.select();
    navigator.clipboard.writeText(emailField.value);
    alert('Адрес скопирован!');
});

// Кнопка обновления
document.getElementById('refresh-btn').addEventListener('click', checkMessages);

// Старт при загрузке
generateEmail();
// Авто-обновление каждые 10 секунд
setInterval(checkMessages, 10000);
