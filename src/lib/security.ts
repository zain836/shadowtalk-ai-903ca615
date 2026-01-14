/**
 * Security utilities for client-side encryption and data protection
 * Note: True E2E encryption requires key exchange mechanisms and is complex to implement fully.
 * This provides client-side encryption helpers using the Web Crypto API.
 */

// Generate a random encryption key
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// Export key to base64 for storage
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

// Import key from base64
export const importKey = async (keyStr: string): Promise<CryptoKey> => {
  const keyData = Uint8Array.from(atob(keyStr), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};

// Encrypt text with AES-GCM
export const encryptText = async (text: string, key: CryptoKey): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

// Decrypt text with AES-GCM
export const decryptText = async (encryptedStr: string, key: CryptoKey): Promise<string> => {
  const combined = Uint8Array.from(atob(encryptedStr), c => c.charCodeAt(0));
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
};

// Hash sensitive data (one-way, for verification)
export const hashData = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
};

// Generate secure random string
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Secure session storage wrapper
export const secureStorage = {
  setItem: async (key: string, value: string, encryptionKey?: CryptoKey) => {
    if (encryptionKey) {
      const encrypted = await encryptText(value, encryptionKey);
      sessionStorage.setItem(key, encrypted);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  
  getItem: async (key: string, encryptionKey?: CryptoKey): Promise<string | null> => {
    const value = sessionStorage.getItem(key);
    if (!value) return null;
    
    if (encryptionKey) {
      try {
        return await decryptText(value, encryptionKey);
      } catch {
        return null;
      }
    }
    return value;
  },
  
  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
  },
  
  clear: () => {
    sessionStorage.clear();
  }
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
};

// Content Security Policy helpers
export const generateNonce = (): string => {
  return generateSecureToken(16);
};

// Fingerprint detection (for fraud prevention)
export const getDeviceFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
    navigator.hardwareConcurrency?.toString() || '',
  ];
  
  return await hashData(components.join('|'));
};
