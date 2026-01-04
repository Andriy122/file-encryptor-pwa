/**
 * Головна логіка додатку
 */

// Ініціалізація FileEncryptor
const encryptor = new FileEncryptor();

// Глобальні змінні для зберігання вибраних файлів
let encryptSelectedFile = null;
let decryptSelectedFile = null;

// ==================== DOM Elements ====================
// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Encrypt elements
const encryptFileInput = document.getElementById('encrypt-file-input');
const encryptFileInfo = document.getElementById('encrypt-file-info');
const encryptPassword = document.getElementById('encrypt-password');
const encryptPasswordConfirm = document.getElementById('encrypt-password-confirm');
const encryptBtn = document.getElementById('encrypt-btn');
const encryptResult = document.getElementById('encrypt-result');

// Decrypt elements
const decryptFileInput = document.getElementById('decrypt-file-input');
const decryptFileInfo = document.getElementById('decrypt-file-info');
const decryptPassword = document.getElementById('decrypt-password');
const decryptBtn = document.getElementById('decrypt-btn');
const decryptResult = document.getElementById('decrypt-result');

// Toggle password buttons
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

// ==================== Tab Switching ====================
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        // Оновлюємо активні класи
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        document.getElementById(`${targetTab}-tab`).classList.add('active');

        // Очищаємо результати при перемиканні табів
        clearResults();
    });
});

// ==================== Password Toggle ====================
togglePasswordButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    });
});

// ==================== Encrypt Tab Logic ====================
// Обробка вибору файлу для шифрування
encryptFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        encryptSelectedFile = file;
        encryptFileInfo.innerHTML = `
            <strong>📄 Вибрано файл:</strong><br>
            Назва: ${file.name}<br>
            Розмір: ${encryptor.formatFileSize(file.size)}
        `;
        encryptFileInfo.classList.remove('hidden');
        validateEncryptForm();
    }
});

// Валідація форми шифрування
encryptPassword.addEventListener('input', validateEncryptForm);
encryptPasswordConfirm.addEventListener('input', validateEncryptForm);

function validateEncryptForm() {
    const hasFile = encryptSelectedFile !== null;
    const password = encryptPassword.value;
    const passwordConfirm = encryptPasswordConfirm.value;
    const passwordValid = password.length >= 8;
    const passwordsMatch = password === passwordConfirm && password.length > 0;

    encryptBtn.disabled = !(hasFile && passwordValid && passwordsMatch);
}

// Обробка шифрування
encryptBtn.addEventListener('click', async () => {
    if (!encryptSelectedFile) {
        showResult(encryptResult, 'error', 'Файл не вибрано');
        return;
    }

    const password = encryptPassword.value;
    const passwordConfirm = encryptPasswordConfirm.value;

    if (password !== passwordConfirm) {
        showResult(encryptResult, 'error', 'Паролі не збігаються!');
        return;
    }

    if (password.length < 8) {
        showResult(encryptResult, 'error', 'Пароль повинен містити мінімум 8 символів!');
        return;
    }

    // Показуємо індикатор завантаження
    encryptBtn.classList.add('loading');
    encryptBtn.disabled = true;
    clearResults();

    try {
        // Читаємо файл
        const fileData = await encryptor.readFileAsArrayBuffer(encryptSelectedFile);

        // Шифруємо файл
        const result = await encryptor.encryptFile(fileData, password);

        if (result.success) {
            // Генеруємо ім'я для зашифрованого файлу
            const encryptedFileName = encryptSelectedFile.name + '.encrypted';

            // Зберігаємо файл
            encryptor.downloadFile(result.data, encryptedFileName);

            // Показуємо результат
            showResult(encryptResult, 'success', `
                <strong>✓ Файл успішно зашифровано!</strong><br><br>
                Назва: ${encryptedFileName}<br>
                Розмір оригіналу: ${encryptor.formatFileSize(result.originalSize)}<br>
                Розмір зашифрованого: ${encryptor.formatFileSize(result.encryptedSize)}<br>
                Загальний розмір: ${encryptor.formatFileSize(result.totalSize)}<br><br>
                <em>Файл автоматично завантажено</em>
            `);

            // Очищаємо форму
            resetEncryptForm();
        } else {
            showResult(encryptResult, 'error', `✗ Помилка шифрування: ${result.error}`);
        }
    } catch (error) {
        showResult(encryptResult, 'error', `✗ Помилка: ${error.message}`);
    } finally {
        encryptBtn.classList.remove('loading');
        validateEncryptForm();
    }
});

// ==================== Decrypt Tab Logic ====================
// Обробка вибору файлу для розшифрування
decryptFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        decryptSelectedFile = file;
        decryptFileInfo.innerHTML = `
            <strong>📄 Вибрано файл:</strong><br>
            Назва: ${file.name}<br>
            Розмір: ${encryptor.formatFileSize(file.size)}
        `;
        decryptFileInfo.classList.remove('hidden');
        validateDecryptForm();
    }
});

// Валідація форми розшифрування
decryptPassword.addEventListener('input', validateDecryptForm);

function validateDecryptForm() {
    const hasFile = decryptSelectedFile !== null;
    const hasPassword = decryptPassword.value.length > 0;

    decryptBtn.disabled = !(hasFile && hasPassword);
}

// Обробка розшифрування
decryptBtn.addEventListener('click', async () => {
    if (!decryptSelectedFile) {
        showResult(decryptResult, 'error', 'Файл не вибрано');
        return;
    }

    const password = decryptPassword.value;

    if (!password) {
        showResult(decryptResult, 'error', 'Введіть пароль!');
        return;
    }

    // Показуємо індикатор завантаження
    decryptBtn.classList.add('loading');
    decryptBtn.disabled = true;
    clearResults();

    try {
        // Читаємо файл
        const fileData = await encryptor.readFileAsArrayBuffer(decryptSelectedFile);

        // Розшифровуємо файл
        const result = await encryptor.decryptFile(fileData, password);

        if (result.success) {
            // Генеруємо ім'я для розшифрованого файлу
            let decryptedFileName = decryptSelectedFile.name;
            if (decryptedFileName.endsWith('.encrypted')) {
                decryptedFileName = decryptedFileName.slice(0, -10); // видаляємо .encrypted
            } else {
                decryptedFileName = decryptedFileName + '.decrypted';
            }

            // Зберігаємо файл
            encryptor.downloadFile(result.data, decryptedFileName);

            // Показуємо результат
            showResult(decryptResult, 'success', `
                <strong>✓ Файл успішно розшифровано!</strong><br><br>
                Назва: ${decryptedFileName}<br>
                Розмір: ${encryptor.formatFileSize(result.size)}<br><br>
                <em>Файл автоматично завантажено</em>
            `);

            // Очищаємо форму
            resetDecryptForm();
        } else {
            showResult(decryptResult, 'error', `✗ ${result.error}`);
        }
    } catch (error) {
        showResult(decryptResult, 'error', `✗ Помилка: ${error.message}`);
    } finally {
        decryptBtn.classList.remove('loading');
        validateDecryptForm();
    }
});

// ==================== Helper Functions ====================
function showResult(element, type, message) {
    element.className = `result ${type}`;
    element.innerHTML = message;
    element.classList.remove('hidden');
}

function clearResults() {
    encryptResult.classList.add('hidden');
    decryptResult.classList.add('hidden');
}

function resetEncryptForm() {
    encryptSelectedFile = null;
    encryptFileInput.value = '';
    encryptPassword.value = '';
    encryptPasswordConfirm.value = '';
    encryptFileInfo.classList.add('hidden');
    encryptBtn.disabled = true;
}

function resetDecryptForm() {
    decryptSelectedFile = null;
    decryptFileInput.value = '';
    decryptPassword.value = '';
    decryptFileInfo.classList.add('hidden');
    decryptBtn.disabled = true;
}

// ==================== PWA Installation ====================
// Реєстрація Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker зареєстровано:', registration);
            })
            .catch(error => {
                console.log('Помилка реєстрації Service Worker:', error);
            });
    });
}

// Обробка установки PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA можна встановити');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA встановлено');
    deferredPrompt = null;
});

// ==================== Ініціалізація ====================
console.log('🔐 Шифрувальник файлів ініціалізовано');
console.log('Сумісний з Python версією (file_encryptor.py)');
