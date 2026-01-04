/**
 * FileEncryptor - Шифрування/розшифрування файлів AES-256
 * Сумісний з Python версією (file_encryptor.py)
 */

class FileEncryptor {
    constructor() {
        // Параметри, що відповідають Python версії
        this.SALT_SIZE = 16;           // bytes
        this.IV_SIZE = 16;             // bytes
        this.KEY_SIZE = 32;            // bytes (256 bits)
        this.PBKDF2_ITERATIONS = 100000; // як в Python версії
    }

    /**
     * Генерує 256-бітний ключ з пароля за допомогою PBKDF2-HMAC-SHA256
     * Ідентично до Python: hashlib.pbkdf2_hmac('sha256', password, salt, 100000)
     */
    async generateKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        // Імпортуємо пароль як ключ для PBKDF2
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        // Виводимо ключ через PBKDF2
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            this.KEY_SIZE * 8 // bits
        );

        return new Uint8Array(derivedBits);
    }

    /**
     * Шифрує файл за допомогою AES-256-CBC
     * Формат: [16 bytes salt][16 bytes IV][encrypted data]
     * Ідентично до Python версії
     */
    async encryptFile(fileData, password) {
        try {
            // Генеруємо випадкову сіль та IV
            const salt = crypto.getRandomValues(new Uint8Array(this.SALT_SIZE));
            const iv = crypto.getRandomValues(new Uint8Array(this.IV_SIZE));

            // Створюємо ключ з пароля
            const keyBytes = await this.generateKeyFromPassword(password, salt);

            // Імпортуємо ключ для AES
            const key = await crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-CBC' },
                false,
                ['encrypt']
            );

            // Шифруємо дані (Web Crypto API автоматично додає PKCS7 padding)
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-CBC',
                    iv: iv
                },
                key,
                fileData
            );

            // Збираємо результат: salt + iv + ciphertext
            const result = new Uint8Array(
                this.SALT_SIZE + this.IV_SIZE + ciphertext.byteLength
            );
            result.set(salt, 0);
            result.set(iv, this.SALT_SIZE);
            result.set(new Uint8Array(ciphertext), this.SALT_SIZE + this.IV_SIZE);

            return {
                success: true,
                data: result,
                originalSize: fileData.byteLength,
                encryptedSize: ciphertext.byteLength,
                totalSize: result.byteLength
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Розшифровує файл за допомогою AES-256-CBC
     * Читає формат: [16 bytes salt][16 bytes IV][encrypted data]
     */
    async decryptFile(encryptedData, password) {
        try {
            // Перевіряємо мінімальний розмір файлу
            if (encryptedData.byteLength < this.SALT_SIZE + this.IV_SIZE) {
                throw new Error('Неправильний формат файлу (файл занадто малий)');
            }

            // Витягуємо salt, IV та зашифровані дані
            const salt = encryptedData.slice(0, this.SALT_SIZE);
            const iv = encryptedData.slice(this.SALT_SIZE, this.SALT_SIZE + this.IV_SIZE);
            const ciphertext = encryptedData.slice(this.SALT_SIZE + this.IV_SIZE);

            // Створюємо ключ з пароля
            const keyBytes = await this.generateKeyFromPassword(password, salt);

            // Імпортуємо ключ для AES
            const key = await crypto.subtle.importKey(
                'raw',
                keyBytes,
                { name: 'AES-CBC' },
                false,
                ['decrypt']
            );

            // Розшифровуємо дані (Web Crypto API автоматично видаляє PKCS7 padding)
            const plaintext = await crypto.subtle.decrypt(
                {
                    name: 'AES-CBC',
                    iv: iv
                },
                key,
                ciphertext
            );

            return {
                success: true,
                data: new Uint8Array(plaintext),
                size: plaintext.byteLength
            };
        } catch (error) {
            // Помилка розшифрування зазвичай означає невірний пароль
            if (error.name === 'OperationError') {
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
