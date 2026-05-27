const API_URL = 'https://mail.tm';
let currentToken = '';
let currentEmail = '';
let accountId = '';

// Вспомогательная функция для генерации случайной строки (для логина и пароля)
function getRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 1. Шаг первый: Получаем доступный домен и создаем аккаунт
async function generateEmail() {
    try {
        // Получаем список рабочих доменов
        const domainsResponse = await fetch(`${API_URL}/domains`);
        const domainsData = await domainsResponse.json();
        if (!domainsData['hydra:member'] || domainsData['hydra:member'].length === 0) {
            throw new Error('Нет доступных доменов');
        }
        const domain = domainsData['hydra:member'][0].domain;

        // Генерируем случайные учетные данные
        const username = getRandomString(10);
        const password = getRandomString(12);
        currentEmail = `${username}@${domain}`;

        // Регистрируем ящик на сервере Mail.tm
        const createResponse = await fetch(`${API_URL}/accounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: currentEmail, password: password })
        });
        const createData = await createResponse.json();
        accountId = createData.id;

        // Авторизуемся, чтобы получить токен для чтения писем
        const tokenResponse = await fetch(`${API_URL}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: currentEmail, password: password })
        });
        const tokenData = await tokenResponse.json();
        currentToken = tokenData.token;

        // Выводим адрес на экран
        document.getElementById('email-address').value = currentEmail;
        checkMessages();
    } catch (error) {
        console.error("Ошибка при создании почты:", error);
        document.getElementById('letters-container').innerHTML = 
            `<p style="color:red;">Ошибка сети. Возможно, API заблокировано вашим провайдером или антивирусом.</p>`;
    }
}

// 2. Шаг второй: Проверяем входящие письма
async function checkMessages() {
    if (!currentToken) return;

    try {
        const response = await fetch(`${API_URL}/messages`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        const emails = data['hydra:member'];
        
        const container = document.getElementById('letters-container');
        container.innerHTML = '';

        if (!emails || emails.length === 0) {
            container.innerHTML = '<p class="empty-text">Писем пока нет. Ожидание...</p>';
            return;
        }

        // Рендерим каждое письмо
        for (const msg of emails) {
            const letter = document.createElement('div');
            letter.className = 'letter';

            const titleFrom = document.createElement('h3');
            titleFrom.textContent = `От: ${msg.from.address} (${msg.from.name || ''})`;

            const titleSubject = document.createElement('h4');
            titleSubject.textContent = `Тема: ${msg.subject || 'Без темы'}`;

            const letterBody = document.createElement('div');
            letterBody.className = 'letter-body';
            // Используем только безопасный текст превью, чтобы избежать XSS-уязвимостей
            letterBody.textContent = msg.intro || 'Текст письма пуст';

            letter.appendChild(titleFrom);
            letter.appendChild(titleSubject);
            letter.appendChild(letterBody);
            container.appendChild(letter);
        }
    } catch (error) {
        console.error("Ошибка при получении списка писем:", error);
    }
}

// События для кнопок интерфейса
document.getElementById('copy-btn').addEventListener('click', () => {
    const emailField = document.getElementById('email-address');
    if (!emailField.value || emailField.value === 'Генерация...') return;
    
    emailField.select();
    navigator.clipboard.writeText(emailField.value);
    alert('Адрес скопирован!');
});

document.getElementById('refresh-btn').addEventListener('click', checkMessages);

// Запуск приложения
generateEmail();
// Проверка ящика каждые 10 секунд
setInterval(checkMessages, 10000);
