/**
 * FileEncryptor V2 - Гібридне шифрування файлів AES-256
 * Формат: [16 salt][16 IV_KEK][48 encrypted_DEK][16 IV_data][encrypted data]
 * Сумісний з Python версією (file_encryptor_v2.py)
 */

class FileEncryptorV2 {
    constructor() {
        // Параметри гібридного підходу
        this.SALT_SIZE = 16;              // bytes
        this.IV_SIZE = 16;                // bytes
        this.DEK_SIZE = 32;               // bytes (256 bits) - Data Encryption Key
        this.KEK_SIZE = 32;               // bytes (256 bits) - Key Encryption Key
        this.ENCRYPTED_DEK_SIZE = 48;     // 32 bytes DEK + 16 bytes padding
        this.PBKDF2_ITERATIONS = 100000;  // для генерації KEK
    }

    /**
     * Генерує KEK (Key Encryption Key) з пароля за допомогою PBKDF2
     */
    async generateKEKFromPassword(password, salt) {
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
     * Шифрує DEK за допомогою KEK
     */
    async encryptDEK(dek, kek, iv) {
        // Імпортуємо KEK
        const kekKey = await crypto.subtle.importKey(
            'raw',
            kek,
            { name: 'AES-CBC' },
            false,
            ['encrypt']
        );

        // Шифруємо DEK (Web Crypto API автоматично додає padding)
        const encryptedDEK = await crypto.subtle.encrypt(
            {
                name: 'AES-CBC',
                iv: iv
            },
            kekKey,
            dek
        );

        return new Uint8Array(encryptedDEK);
    }

    /**
     * Розшифровує DEK за допомогою KEK
     */
    async decryptDEK(encryptedDEK, kek, iv) {
        // Імпортуємо KEK
        const kekKey = await crypto.subtle.importKey(
            'raw',
            kek,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );

        // Розшифровуємо DEK (Web Crypto API автоматично видаляє padding)
        const dekArrayBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: iv
            },
            kekKey,
            encryptedDEK
        );

        // Повертаємо тільки перші 32 байти (256 біт)
        const dek = new Uint8Array(dekArrayBuffer);

        // Перевіряємо розмір
        if (dek.length < this.DEK_SIZE) {
            throw new Error(`DEK має неправильний розмір: ${dek.length} (очікувалось ${this.DEK_SIZE})`);
        }

        // Повертаємо рівно 32 байти
        return dek.slice(0, this.DEK_SIZE);
    }

    /**
     * Шифрує файл за допомогою гібридного підходу
     * Формат: [salt][IV_KEK][encrypted_DEK][IV_data][encrypted_data]
     */
    async encryptFile(fileData, password) {
        try {
            console.log('[INFO] Гібридне шифрування: генерація випадкового 256-bit ключа...');

            // 1. Генеруємо випадкові значення
            const salt = crypto.getRandomValues(new Uint8Array(this.SALT_SIZE));
            const ivKEK = crypto.getRandomValues(new Uint8Array(this.IV_SIZE));
            const ivData = crypto.getRandomValues(new Uint8Array(this.IV_SIZE));

            // 2. Генеруємо випадковий DEK (256-bit)
            const dek = this.generateDEK();
            console.log('[INFO] DEK згенеровано (максимальна ентропія)');

            // 3. Генеруємо KEK з пароля
            const kek = await this.generateKEKFromPassword(password, salt);

            // 4. Шифруємо DEK за допомогою KEK
            const encryptedDEK = await this.encryptDEK(dek, kek, ivKEK);

            // 5. Імпортуємо DEK для шифрування даних
            const dekKey = await crypto.subtle.importKey(
                'raw',
                dek,
                { name: 'AES-CBC' },
                false,
                ['encrypt']
            );

            // 6. Шифруємо дані за допомогою DEK
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: ivData
                },
                dekKey,
                fileData
            );

            // 7. Збираємо результат: salt + ivKEK + encryptedDEK + ivData + ciphertext
            const headerSize = this.SALT_SIZE + this.IV_SIZE + this.ENCRYPTED_DEK_SIZE + this.IV_SIZE;
            const result = new Uint8Array(headerSize + ciphertext.byteLength);

            let offset = 0;
            result.set(salt, offset); offset += this.SALT_SIZE;
            result.set(ivKEK, offset); offset += this.IV_SIZE;
            result.set(encryptedDEK, offset); offset += this.ENCRYPTED_DEK_SIZE;
            result.set(ivData, offset); offset += this.IV_SIZE;
            result.set(new Uint8Array(ciphertext), offset);

            console.log('[SECURITY] Файл зашифровано випадковим 256-bit ключем');

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
     * Розшифровує файл за допомогою гібридного підходу
     * Формат: [salt][IV_KEK][encrypted_DEK][IV_data][encrypted_data]
     */
    async decryptFile(encryptedData, password) {
        try {
            // 1. Перевіряємо мінімальний розмір файлу
            const minSize = this.SALT_SIZE + this.IV_SIZE + this.ENCRYPTED_DEK_SIZE + this.IV_SIZE;
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
                throw new Error('Невірний пароль або пошкоджений ключ');
            }

            // 5. Імпортуємо DEK для розшифрування даних
            const dekKey = await crypto.subtle.importKey(
                'raw',
                dek,
                { name: 'AES-CBC' },
                false,
                ['decrypt']
            );

            // 6. Розшифровуємо дані за допомогою DEK
            const plaintext = await crypto.subtle.decrypt(
                {
                    name: 'AES-CBC',
                    iv: ivData
                },
                dekKey,
                ciphertext
            );

            console.log('[INFO] Файл успішно розшифровано');

            return {
                success: true,
                data: new Uint8Array(plaintext),
                size: plaintext.byteLength
            };
        } catch (error) {
            console.error('[ERROR] Помилка розшифрування:', error);

            // Спеціальна обробка помилки невірного пароля
            if (error.name === 'OperationError' || error.message.includes('Невірний пароль')) {
                return {
                    success: false,
                    error: 'Невірний пароль або пошкоджений файл'
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
