# 📝 Шпаргалка - Швидкі команди

## 🖥️ Windows (Python)

### Встановлення
```bash
pip install cryptography
```

### Запуск програми
```bash
python file_encryptor.py
```

### Тест сумісності
```bash
python test_compatibility.py
```

---

## 🌐 PWA - Локальний запуск

### Python HTTP сервер
```bash
cd FileEncryptorPWA
python -m http.server 8000
# Відкрийте: http://localhost:8000
```

### Node.js HTTP сервер
```bash
cd FileEncryptorPWA
npx http-server -p 8000
# Відкрийте: http://localhost:8000
```

---

## 📱 Розгортання PWA

### GitHub Pages
```bash
cd FileEncryptorPWA
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/file-encryptor-pwa.git
git push -u origin main

# В Settings → Pages → Source: main, folder: / (root)
```

### Netlify CLI
```bash
npm install -g netlify-cli
cd FileEncryptorPWA
netlify login
netlify deploy --prod
```

### Vercel CLI
```bash
npm install -g vercel
cd FileEncryptorPWA
vercel --prod
```

---

## 🔧 Генерація іконок

1. Відкрийте `generate-icons.html` в браузері
2. Натисніть "Згенерувати іконки"
3. Завантажте всі 8 файлів
4. Помістіть в папку `icons/`

Або створіть власні іконки:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

---

## 🧪 Тестування

### Тест Python → JavaScript
```bash
# 1. Запустіть тест
python test_compatibility.py

# 2. Отримаєте: test_compatibility.txt.encrypted

# 3. Відкрийте PWA, розшифруйте з паролем: test12345678
```

### Тест JavaScript → Python
```bash
# 1. В PWA: зашифруйте файл з паролем: test12345678

# 2. Завантажте .encrypted файл

# 3. Запустіть Python програму
python file_encryptor.py
# Виберіть: 2 (Розшифрувати)
# Пароль: test12345678
```

---

## 📱 iPhone - Встановлення PWA

### Safari на iPhone:
1. Відкрийте URL PWA
2. Натисніть кнопку "Поділитися" (⬆️)
3. "На екран «Домой»"
4. "Добавить"

---

## 🔐 Приклади використання

### Шифрування
```
Файл: document.pdf
Пароль: MySecret123!
Результат: document.pdf.encrypted
```

### Розшифрування
```
Файл: document.pdf.encrypted
Пароль: MySecret123!
Результат: document.pdf
```

---

## 🛠️ Налагодження

### Chrome DevTools - PWA audit
```
F12 → Lighthouse → Generate report (PWA)
```

### Service Worker debug
```
Chrome: chrome://serviceworker-internals/
Firefox: about:debugging#/runtime/this-firefox
```

### Перевірка manifest
```
Chrome: F12 → Application → Manifest
```

### Очистка кешу PWA
```
Chrome: F12 → Application → Storage → Clear site data
```

---

## 📊 Корисні URL

### Локальні
```
http://localhost:8000          - PWA локально
generate-icons.html            - Генератор іконок
```

### Online інструменти
```
https://web.dev/progressive-web-apps/   - PWA документація
https://realfavicongenerator.net/       - Генератор іконок
https://manifest-validator.appspot.com/ - Перевірка manifest
```

---

## 🔒 Швидка довідка по безпеці

### Рекомендовані паролі
```
✅ Добре: MySecure#Pass2024!
✅ Добре: Tr0ng_P@ssw0rd_123
❌ Погано: password123
❌ Погано: 12345678
```

### Формат зашифрованого файлу
```
[16 bytes Salt][16 bytes IV][Encrypted Data]
```

### Параметри шифрування
```
Алгоритм:         AES-256-CBC
Генерація ключа:  PBKDF2-HMAC-SHA256
Ітерації:         100,000
Padding:          PKCS7 (128-bit)
```

---

## 🚨 Troubleshooting

### Python: ModuleNotFoundError
```bash
pip install cryptography
```

### PWA: не встановлюється
```
- Перевірте HTTPS (або localhost)
- Перевірте manifest.json
- Згенеруйте всі іконки
- Використовуйте Safari на iOS
```

### Service Worker: не оновлюється
```javascript
// В service-worker.js змініть версію:
const CACHE_NAME = 'file-encryptor-v2'; // v1 → v2
```

### Помилка "Невірний пароль"
```
- Перевірте регістр (A ≠ a)
- Перевірте розкладку клавіатури
- Перевірте, чи не пошкоджений файл
```

---

## 📋 Checklist перед розгортанням

- [ ] Всі іконки згенеровані (8 штук)
- [ ] manifest.json налаштовано
- [ ] service-worker.js працює
- [ ] index.html коректний
- [ ] Тест шифрування пройдено
- [ ] Тест розшифрування пройдено
- [ ] Тест сумісності пройдено
- [ ] PWA audit: зелений
- [ ] HTTPS увімкнено (якщо не localhost)

---

## 🎯 Швидкі посилання

### Документація
```
START_HERE.md              - Початок роботи
PROJECT_SUMMARY.md         - Огляд проєкту
README.md                  - Технічна документація
QUICKSTART.md             - Швидкий старт
DEPLOYMENT.md             - Розгортання
INSTALL_IPHONE_UA.md      - Інструкція для iPhone
```

### Основні файли
```
file_encryptor.py         - Windows версія
test_compatibility.py     - Тест сумісності
index.html               - PWA головна сторінка
manifest.json            - PWA manifest
service-worker.js        - Service Worker
js/encryptor.js          - Логіка шифрування
js/app.js                - UI логіка
```

---

**Збережіть цю шпаргалку для швидкого доступу!** 📌
