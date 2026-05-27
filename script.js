const API_URL = 'https://1secmail.com';
let currentEmail = '';
let login = '';
let domain = '';

// 1. Генерация случайного имейла
async function generateEmail() {
    const response = await fetch(`${API_URL}?action=genRandomMailbox&count=1`);
    const data = await response.json();
    currentEmail = data[0];
    [login, domain] = currentEmail.split('@');
    
    document.getElementById('email-address').value = currentEmail;
    checkMessages(); // проверяем почту сразу
}

// 2. Проверка входящих писем
async function checkMessages() {
    if (!login || !domain) return;
    
    const response = await fetch(`${API_URL}?action=getMessages&login=${login}&domain=${domain}`);
    const emails = await response.json();
    const container = document.getElementById('letters-container');
    container.innerHTML = '';

    if (emails.length === 0) {
        container.innerHTML = '<p class="empty-text">Писем пока нет. Ожидание...</p>';
        return;
    }

    emails.forEach(async (msg) => {
        // Получаем полный текст каждого письма
        const msgResponse = await fetch(`${API_URL}?action=readMessage&login=${login}&domain=${domain}&id=${msg.id}`);
        const msgData = await msgResponse.json();

        const letter = document.createElement('div');
        letter.className = 'letter';
        letter.innerHTML = `
            <h3>От: ${msgData.from}</h3>
            <h4>Тема: ${msgData.subject}</h4>
            <div class="letter-body">${msgData.textBody || msgData.htmlBody}</div>
        `;
        container.appendChild(letter);
    });
}

// Кнопка копирования
document.getElementById('copy-btn').addEventListener('click', () => {
    const emailField = document.getElementById('email-address');
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
