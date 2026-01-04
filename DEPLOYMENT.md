# 🚀 Розгортання PWA

Цей документ описує різні способи розгортання вашого PWA шифрувальника.

---

## 1️⃣ GitHub Pages (Безкоштовно, Рекомендовано)

### Переваги:
- ✅ Безкоштовно
- ✅ HTTPS за замовчуванням
- ✅ Автоматичне оновлення при push
- ✅ Зручний URL: `username.github.io/repo-name`

### Інструкція:

1. **Створіть репозиторій на GitHub**:
   ```bash
   # Ініціалізуйте git (якщо ще не зробили)
   cd FileEncryptorPWA
   git init

   # Додайте всі файли
   git add .
   git commit -m "Initial commit: PWA File Encryptor"

   # Створіть репозиторій на GitHub через веб-інтерфейс
   # Потім підключіть його:
   git remote add origin https://github.com/YOUR_USERNAME/file-encryptor-pwa.git
   git branch -M main
   git push -u origin main
   ```

2. **Увімкніть GitHub Pages**:
   - Перейдіть у Settings репозиторію
   - Scroll до секції "Pages"
   - Source: "Deploy from a branch"
   - Branch: `main`, folder: `/ (root)`
   - Натисніть "Save"

3. **Готово!** Ваш додаток буде доступний за адресою:
   ```
   https://YOUR_USERNAME.github.io/file-encryptor-pwa/
   ```

---

## 2️⃣ Netlify (Безкоштовно)

### Переваги:
- ✅ Дуже просте розгортання
- ✅ Автоматичний HTTPS
- ✅ Швидкий CDN
- ✅ Можна використати власний домен

### Інструкція:

1. **Зареєструйтесь на Netlify**: https://netlify.com

2. **Розгорніть через Netlify Drop**:
   - Перейдіть на https://app.netlify.com/drop
   - Перетягніть папку `FileEncryptorPWA`
   - Готово! Отримаєте URL типу: `random-name.netlify.app`

3. **Або через Git**:
   ```bash
   # Встановіть Netlify CLI
   npm install -g netlify-cli

   # Залогіньтесь
   netlify login

   # Розгорніть
   cd FileEncryptorPWA
   netlify deploy --prod
   ```

---

## 3️⃣ Vercel (Безкоштовно)

### Переваги:
- ✅ Дуже швидкий
- ✅ Автоматичний HTTPS
- ✅ Інтеграція з GitHub
- ✅ Гарна панель керування

### Інструкція:

1. **Зареєструйтесь на Vercel**: https://vercel.com

2. **Встановіть Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Розгорніть**:
   ```bash
   cd FileEncryptorPWA
   vercel

   # Відповідайте на питання:
   # Set up and deploy? Y
   # Which scope? [ваш аккаунт]
   # Link to existing project? N
   # Project name? file-encryptor-pwa
   # Directory? ./
   # Override settings? N
   ```

4. **Для production**:
   ```bash
   vercel --prod
   ```

---

## 4️⃣ Cloudflare Pages (Безкоштовно)

### Переваги:
- ✅ Безлімітні запити
- ✅ Глобальний CDN
- ✅ Швидкість
- ✅ Інтеграція з GitHub

### Інструкція:

1. **Зареєструйтесь на Cloudflare**: https://pages.cloudflare.com

2. **Підключіть GitHub репозиторій**:
   - Dashboard → Pages → Create a project
   - Підключіть GitHub
   - Виберіть репозиторій
   - Build settings залиште порожніми (це статичний сайт)
   - Deploy!

---

## 5️⃣ Firebase Hosting (Безкоштовно)

### Переваги:
- ✅ Google інфраструктура
- ✅ Швидкий CDN
- ✅ Можна додати аналітику
- ✅ Інтеграція з іншими сервісами Google

### Інструкція:

1. **Встановіть Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Ініціалізуйте проєкт**:
   ```bash
   cd FileEncryptorPWA
   firebase login
   firebase init hosting

   # Відповідайте:
   # Public directory? .
   # Single-page app? N
   # Set up automatic builds? N
   ```

3. **Розгорніть**:
   ```bash
   firebase deploy
   ```

---

## 6️⃣ Власний сервер (NGINX/Apache)

### Вимоги:
- VPS або хостинг з підтримкою HTTPS
- Власний домен

### NGINX конфігурація:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (використовуйте Let's Encrypt)
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/file-encryptor-pwa;
    index index.html;

    # PWA Service Worker headers
    location /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # Manifest and icons
    location ~ \.(json|png)$ {
        add_header Cache-Control "public, max-age=31536000";
    }

    # Default location
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Let's Encrypt SSL:

```bash
# Встановіть certbot
sudo apt install certbot python3-certbot-nginx

# Отримайте сертифікат
sudo certbot --nginx -d your-domain.com
```

---

## 📝 Після розгортання

### 1. Перевірте PWA:

Відкрийте Chrome DevTools → Lighthouse → Run audit (PWA)

Має бути ✅ зелений результат для:
- Fast and reliable
- Installable
- PWA optimized

### 2. Протестуйте на iPhone:

1. Відкрийте Safari
2. Перейдіть на ваш URL
3. Натисніть "Поділитися" → "На екран «Домой»"
4. Перевірте, що іконка з'явилася
5. Відкрийте PWA та протестуйте шифрування/розшифрування

### 3. Тест сумісності:

```bash
# На Windows
python test_compatibility.py

# Перешліть .encrypted файл на iPhone
# Розшифруйте в PWA
# Перевірте результат
```

---

## 🔒 Безпека

### Важливо для Production:

1. **HTTPS обов'язково** - Service Worker працює тільки через HTTPS

2. **Content Security Policy** (додайте в `index.html`):
   ```html
   <meta http-equiv="Content-Security-Policy"
         content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
   ```

3. **Security headers** (додайте в NGINX):
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "no-referrer-when-downgrade" always;
   ```

---

## 📊 Моніторинг

### Google Analytics (опціонально):

Додайте перед `</head>` в `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🔄 Оновлення PWA

Коли вносите зміни:

1. **Змініть версію кешу** в `service-worker.js`:
   ```javascript
   const CACHE_NAME = 'file-encryptor-v2'; // v1 → v2
   ```

2. **Задеплойте зміни** (залежно від платформи)

3. **На iPhone**:
   - Закрийте PWA
   - Можливо, доведеться перевстановити
   - Або просто почекайте автоматичного оновлення Service Worker

---

## ❓ Troubleshooting

**PWA не встановлюється:**
- Переконайтеся, що всі іконки є в папці `/icons/`
- Перевірте `manifest.json` на помилки
- Використовуйте HTTPS (або localhost для тестування)

**Service Worker не оновлюється:**
- Очистіть кеш браузера
- Змініть `CACHE_NAME` в `service-worker.js`
- Використовуйте "Update on reload" в Chrome DevTools

**Помилки CORS:**
- Переконайтеся, що всі файли на тому самому домені
- Перевірте CORS headers на сервері

---

## ✅ Готово!

Ваш PWA шифрувальник тепер онлайн і доступний з будь-якого пристрою!

**Корисні посилання:**
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
