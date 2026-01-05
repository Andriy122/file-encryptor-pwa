/**
 * FileEncryptor V3 - Безпечне гібридне шифрування AES-256-GCM
 * Покращення безпеки: GCM замість CBC, 600k ітерацій PBKDF2, валідація паролів
 * Формат: [16 salt][12 IV_KEK][48 encrypted_DEK][12 IV_data][encrypted data][16 auth_tag]
 * Сумісний з Python версією (file_encryptor_v3.py)
 */

class FileEncryptorV3 {
    constructor() {
        // Параметри гібридного підходу
        this.SALT_SIZE = 16;              // bytes
        this.IV_SIZE = 12;                // bytes (GCM рекомендує 12 bytes)
        this.DEK_SIZE = 32;               // bytes (256 bits) - Data Encryption Key
        this.KEK_SIZE = 32;               // bytes (256 bits) - Key Encryption Key
        this.AUTH_TAG_SIZE = 16;          // bytes (128 bits) - GCM authentication tag
        this.ENCRYPTED_DEK_SIZE = 48;     // 32 bytes DEK + 16 bytes auth tag
        this.PBKDF2_ITERATIONS = 600000;  // OWASP 2023 рекомендація
        this.MIN_PASSWORD_LENGTH = 12;    // Мінімальна довжина пароля
    }

    /**
     * Валідує пароль
     */
    validatePassword(password) {
        if (!password || password.length < this.MIN_PASSWORD_LENGTH) {
            throw new Error(`Пароль повинен містити мінімум ${this.MIN_PASSWORD_LENGTH} символів`);
        }

        // Перевірка складності
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const complexityScore = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

        if (complexityScore < 3) {
            console.warn('[SECURITY] Пароль слабкий. Рекомендується використовувати великі/малі літери, цифри та спецсимволи.');
        }

        return true;
    }

    /**
     * Генерує KEK (Key Encryption Key) з пароля за допомогою PBKDF2
     */
    async generateKEKFromPassword(password, salt) {
        this.validatePassword(password);

        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            this.KEK_SIZE * 8
        );

        return new Uint8Array(derivedBits);
    }

    /**
     * Генерує випадковий DEK (Data Encryption Key)
     */
    generateDEK() {
        return crypto.getRandomValues(new Uint8Array(this.DEK_SIZE));
    }

    /**
     * Шифрує DEK за допомогою KEK (AES-256-GCM)
     */
    async encryptDEK(dek, kek, iv) {
        const kekKey = await crypto.subtle.importKey(
            'raw',
            kek,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        // GCM автоматично додає authentication tag
        const encryptedDEK = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128  // 16 bytes auth tag
            },
            kekKey,
            dek
        );

        return new Uint8Array(encryptedDEK);
    }

    /**
     * Розшифровує DEK за допомогою KEK (AES-256-GCM)
     */
    async decryptDEK(encryptedDEK, kek, iv) {
        const kekKey = await crypto.subtle.importKey(
            'raw',
            kek,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        // GCM автоматично перевіряє authentication tag
        const dekArrayBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128
            },
            kekKey,
            encryptedDEK
        );

        const dek = new Uint8Array(dekArrayBuffer);

        // Перевіряємо розмір
        if (dek.length !== this.DEK_SIZE) {
            throw new Error(`DEK має неправильний розмір: ${dek.length} (очікувалось ${this.DEK_SIZE})`);
        }

        return dek;
    }

    /**
     * Шифрує файл за допомогою гібридного підходу (AES-256-GCM)
     * Формат: [salt][IV_KEK][encrypted_DEK][IV_data][encrypted_data_with_tag]
     */
    async encryptFile(fileData, password) {
        try {
            console.log('[INFO] V3 Гібридне шифрування: AES-256-GCM + 600k PBKDF2...');

            // 1. Генеруємо випадкові значення
            const salt = crypto.getRandomValues(new Uint8Array(this.SALT_SIZE));
            const ivKEK = crypto.getRandomValues(new Uint8Array(this.IV_SIZE));
            const ivData = crypto.getRandomValues(new Uint8Array(this.IV_SIZE));

            // 2. Генеруємо випадковий DEK (256-bit)
            const dek = this.generateDEK();
            console.log('[INFO] DEK згенеровано (максимальна ентропія)');

            // 3. Генеруємо KEK з пароля (з валідацією)
            const kek = await this.generateKEKFromPassword(password, salt);

            // 4. Шифруємо DEK за допомогою KEK (AES-GCM)
            const encryptedDEK = await this.encryptDEK(dek, kek, ivKEK);

            // 5. Імпортуємо DEK для шифрування даних
            const dekKey = await crypto.subtle.importKey(
                'raw',
                dek,
                { name: 'AES-GCM' },
                false,
                ['encrypt']
            );

            // 6. Шифруємо дані за допомогою DEK (AES-GCM)
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: ivData,
                    tagLength: 128
                },
                dekKey,
                fileData
            );

            // 7. Збираємо результат: salt + ivKEK + encryptedDEK + ivData + ciphertext_with_tag
            const headerSize = this.SALT_SIZE + this.IV_SIZE + this.ENCRYPTED_DEK_SIZE + this.IV_SIZE;
            const result = new Uint8Array(headerSize + ciphertext.byteLength);

            let offset = 0;
            result.set(salt, offset); offset += this.SALT_SIZE;
            result.set(ivKEK, offset); offset += this.IV_SIZE;
            result.set(encryptedDEK, offset); offset += this.ENCRYPTED_DEK_SIZE;
            result.set(ivData, offset); offset += this.IV_SIZE;
            result.set(new Uint8Array(ciphertext), offset);

            console.log('[SECURITY] Файл зашифровано з AES-256-GCM (authenticated encryption)');

            return {
                success: true,
                data: result,
                originalSize: fileData.byteLength,
                encryptedSize: ciphertext.byteLength,
                totalSize: result.byteLength,
                headerSize: headerSize
            };
        } catch (error) {
            console.error('[ERROR] Помилка шифрування:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Розшифровує файл за допомогою гібридного підходу (AES-256-GCM)
     * Формат: [salt][IV_KEK][encrypted_DEK][IV_data][encrypted_data_with_tag]
     */
    async decryptFile(encryptedData, password) {
        try {
            // 1. Перевіряємо мінімальний розмір файлу
            const minSize = this.SALT_SIZE + this.IV_SIZE + this.ENCRYPTED_DEK_SIZE + this.IV_SIZE + this.AUTH_TAG_SIZE;
            if (encryptedData.byteLength < minSize) {
                throw new Error('Неправильний формат файлу (файл занадто малий)');
            }

            // 2. Витягуємо компоненти
            let offset = 0;
            const salt = encryptedData.slice(offset, offset + this.SALT_SIZE);
            offset += this.SALT_SIZE;

            const ivKEK = encryptedData.slice(offset, offset + this.IV_SIZE);
            offset += this.IV_SIZE;

            const encryptedDEK = encryptedData.slice(offset, offset + this.ENCRYPTED_DEK_SIZE);
            offset += this.ENCRYPTED_DEK_SIZE;

            const ivData = encryptedData.slice(offset, offset + this.IV_SIZE);
            offset += this.IV_SIZE;

            const ciphertext = encryptedData.slice(offset);

            console.log('[INFO] Формат файлу коректний, розшифровуємо...');

            // 3. Генеруємо KEK з пароля
            const kek = await this.generateKEKFromPassword(password, salt);

            // 4. Розшифровуємо DEK за допомогою KEK
            let dek;
            try {
                dek = await this.decryptDEK(encryptedDEK, kek, ivKEK);
            } catch (error) {
                throw new Error('Невірний пароль або пошкоджений файл');
            }

            // 5. Імпортуємо DEK для розшифрування даних
            const dekKey = await crypto.subtle.importKey(
                'raw',
                dek,
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            // 6. Розшифровуємо дані за допомогою DEK (GCM перевірить автентичність)
            const plaintext = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivData,
                    tagLength: 128
                },
                dekKey,
                ciphertext
            );

            console.log('[INFO] Файл успішно розшифровано та верифіковано');

            return {
                success: true,
                data: new Uint8Array(plaintext),
                size: plaintext.byteLength
            };
        } catch (error) {
            console.error('[ERROR] Помилка розшифрування:', error);

            // Спеціальна обробка помилки невірного пароля або підробленого файлу
            if (error.name === 'OperationError' || error.message.includes('Невірний пароль')) {
                return {
                    success: false,
                    error: 'Невірний пароль або файл був змінений'
                };
            }
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Допоміжна функція для читання файлу як ArrayBuffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.onerror = (e) => reject(new Error('Помилка читання файлу'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Допоміжна функція для збереження даних як файл
     */
    downloadFile(data, filename) {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Форматує розмір файлу для відображення
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}
