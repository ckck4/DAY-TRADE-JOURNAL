(function () {
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    function toBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    }

    function fromBase64(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result || '';
                const base64 = result.toString().split(',')[1] || '';
                resolve(base64);
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });
    }

    function base64ToBlob(base64, type) {
        const buffer = fromBase64(base64);
        return new Blob([buffer], { type });
    }

    async function serializeTrades(trades) {
        return Promise.all(trades.map(async trade => {
            const images = trade.images || [];
            const serializedImages = await Promise.all(images.map(async image => {
                if (image && image.blob) {
                    const data = await blobToBase64(image.blob);
                    return {
                        name: image.name,
                        type: image.type,
                        data
                    };
                }
                if (image && image.data) {
                    return image;
                }
                return null;
            }));

            return {
                ...trade,
                images: serializedImages.filter(Boolean)
            };
        }));
    }

    function deserializeTrades(trades) {
        return trades.map(trade => {
            const images = (trade.images || []).map(image => {
                if (image && image.data) {
                    return {
                        name: image.name,
                        type: image.type,
                        blob: base64ToBlob(image.data, image.type)
                    };
                }
                return image;
            }).filter(Boolean);

            return {
                ...trade,
                images
            };
        });
    }

    async function deriveKey(password, salt) {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            textEncoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async function encryptString(plainText, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(password, salt);
        const cipherBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            textEncoder.encode(plainText)
        );

        return {
            salt: toBase64(salt.buffer),
            iv: toBase64(iv.buffer),
            ciphertext: toBase64(cipherBuffer)
        };
    }

    async function decryptString(payload, password) {
        const salt = new Uint8Array(fromBase64(payload.salt));
        const iv = new Uint8Array(fromBase64(payload.iv));
        const ciphertext = fromBase64(payload.ciphertext);
        const key = await deriveKey(password, salt);
        const plainBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );
        return textDecoder.decode(plainBuffer);
    }

    function buildEquityCurveSvg(points, width = 640, height = 220) {
        if (!points.length) {
            return '<div class="report-empty">No equity data yet</div>';
        }

        const values = points.map(point => point.value);
        const min = Math.min(...values, 0);
        const max = Math.max(...values, 1);
        const range = max - min || 1;

        const step = width / (points.length - 1 || 1);
        const path = points.map((point, index) => {
            const x = index * step;
            const y = height - ((point.value - min) / range) * height;
            return `${index === 0 ? 'M' : 'L'}${x},${y}`;
        }).join(' ');

        return `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="report-chart">
                <path d="${path}" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
        `;
    }

    window.TradeJournalReports = {
        serializeTrades,
        deserializeTrades,
        encryptString,
        decryptString,
        buildEquityCurveSvg
    };
})();
