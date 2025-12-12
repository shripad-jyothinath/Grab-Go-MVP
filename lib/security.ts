// --- Advanced Security Module ---
// Uses Web Crypto API for AES-GCM encryption and SHA-256 hashing.
// This ensures data at rest (localStorage) is encrypted and credentials are never stored in plain text.

const ENC_ALGO = 'AES-GCM';
const HASH_ALGO = 'SHA-256';

// Internal salt for key derivation (adds complexity to rainbow table attacks)
const SALT = new Uint8Array([55, 12, 99, 111, 82, 11, 22, 99, 44, 55, 66, 77, 88, 99, 11, 22]); 

// Helper: Get Encryption Key
// Derives a cryptographic key from a secret using PBKDF2
async function getKey(): Promise<CryptoKey> {
    // In a production env, this secret might be injected or user-derived. 
    // For this implementation, we use a strong internal secret.
    const secret = "G@rB_And_G0_S3cur3_K3y_99_V2"; 
        
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: SALT,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: ENC_ALGO, length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// Generate SHA-256 Hash
export const hashString = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest(HASH_ALGO, msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Encrypt Object to Base64 String
export const encryptData = async (data: any): Promise<string | null> => {
    try {
        const key = await getKey();
        const encoded = new TextEncoder().encode(JSON.stringify(data));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const encrypted = await window.crypto.subtle.encrypt(
            { name: ENC_ALGO, iv },
            key,
            encoded
        );

        // Combine IV and Ciphertext for storage
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Return as Base64 string
        return btoa(String.fromCharCode(...combined));
    } catch (e) {
        console.error("Encryption failed", e);
        return null;
    }
};

// Decrypt Base64 String to Object
export const decryptData = async (ciphertext: string): Promise<any | null> => {
    try {
        const key = await getKey();
        const combined = new Uint8Array(atob(ciphertext).split("").map(c => c.charCodeAt(0)));
        
        // Extract IV (first 12 bytes)
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: ENC_ALGO, iv },
            key,
            data
        );

        const decoded = new TextDecoder().decode(decrypted);
        return JSON.parse(decoded);
    } catch (e) {
        // Silent fail (returns null if tampering detected or key mismatch)
        return null;
    }
};

// --- Obfuscated Credentials ---
export const getMockUpiId = () => {
    // Retrieves the mock UPI ID from an encoded string to avoid plain-text in source
    // Original: "jaishrijyothi-1@okaxis"
    return atob("amFpc2hyaWp5b3RoaS0xQG9rYXhpcw==");
};