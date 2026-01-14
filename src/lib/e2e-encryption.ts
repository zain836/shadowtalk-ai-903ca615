/**
 * End-to-End Encryption System for Stealth Vault
 * Uses PBKDF2 for key derivation and AES-GCM for encryption
 * All encryption/decryption happens client-side - server never sees plaintext
 */

// Constants for encryption
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Generate a random salt for key derivation
 */
export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};

/**
 * Generate a random IV for encryption
 */
export const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
};

/**
 * Convert Uint8Array to base64 string
 */
export const arrayToBase64 = (array: Uint8Array): string => {
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
};

/**
 * Convert base64 string to Uint8Array
 */
export const base64ToArray = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Derive an encryption key from a password using PBKDF2
 * This is the core of our E2E encryption - the password never leaves the client
 */
export const deriveKey = async (
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive the actual encryption key
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
};

/**
 * Encrypt plaintext using AES-GCM
 * Returns the encrypted data as base64
 */
export const encrypt = async (
  plaintext: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> => {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encodedData
  );

  return arrayToBase64(new Uint8Array(encryptedData));
};

/**
 * Decrypt ciphertext using AES-GCM
 * Returns the decrypted plaintext
 */
export const decrypt = async (
  ciphertext: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> => {
  const encryptedData = base64ToArray(ciphertext);
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    encryptedData.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
};

/**
 * Encrypt a vault entry (title and content)
 * Returns encrypted data with IV and salt for storage
 */
export interface EncryptedEntry {
  titleEncrypted: string;
  contentEncrypted: string;
  iv: string;
  salt: string;
}

export const encryptEntry = async (
  title: string,
  content: string,
  password: string
): Promise<EncryptedEntry> => {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const titleEncrypted = await encrypt(title, key, iv);
  const contentEncrypted = await encrypt(content, key, iv);

  return {
    titleEncrypted,
    contentEncrypted,
    iv: arrayToBase64(iv),
    salt: arrayToBase64(salt),
  };
};

/**
 * Decrypt a vault entry
 * Returns decrypted title and content
 */
export interface DecryptedEntry {
  title: string;
  content: string;
}

export const decryptEntry = async (
  entry: EncryptedEntry,
  password: string
): Promise<DecryptedEntry> => {
  const salt = base64ToArray(entry.salt);
  const iv = base64ToArray(entry.iv);
  const key = await deriveKey(password, salt);

  const title = await decrypt(entry.titleEncrypted, key, iv);
  const content = await decrypt(entry.contentEncrypted, key, iv);

  return { title, content };
};

/**
 * Verify if a password can decrypt an entry
 * Used to validate the vault password
 */
export const verifyPassword = async (
  entry: EncryptedEntry,
  password: string
): Promise<boolean> => {
  try {
    await decryptEntry(entry, password);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate a strong random password suggestion
 */
export const generateStrongPassword = (length: number = 16): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
};

/**
 * Calculate password strength (0-100)
 */
export const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  
  return Math.min(100, score);
};

/**
 * Hash password for local storage verification (not for security)
 * This is used to check if the user remembers their password
 */
export const hashForVerification = async (password: string, salt: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayToBase64(new Uint8Array(hashBuffer));
};
