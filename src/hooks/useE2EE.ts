import { useState, useCallback, useEffect } from 'react';
import { 
  deriveKey, 
  encrypt, 
  decrypt, 
  generateSalt, 
  generateIV, 
  arrayToBase64, 
  base64ToArray,
  hashForVerification 
} from '@/lib/e2e-encryption';
import { toast } from 'sonner';

/**
 * World-Class End-to-End Encryption (E2EE) Hook
 * Manages the Master Security Key and provides encryption/decryption services.
 * Security Protocol: PBKDF2 (100k iterations) + AES-256-GCM
 */

interface E2EEState {
  isUnlocked: boolean;
  masterKey: CryptoKey | null;
  masterSalt: string | null;
  keyFingerprint: string | null;
}

export const useE2EE = () => {
  const [state, setState] = useState<E2EEState>({
    isUnlocked: false,
    masterKey: null,
    masterSalt: localStorage.getItem('shadowtalk_e2e_salt'),
    keyFingerprint: localStorage.getItem('shadowtalk_e2e_fingerprint'),
  });

  // Initialize vault salt if it doesn't exist
  useEffect(() => {
    if (!state.masterSalt) {
      const newSalt = arrayToBase64(generateSalt());
      localStorage.setItem('shadowtalk_e2e_salt', newSalt);
      setState(prev => ({ ...prev, masterSalt: newSalt }));
    }
  }, [state.masterSalt]);

  /**
   * Unlock the E2EE engine with the user's master passphrase
   */
  const unlock = useCallback(async (passphrase: string) => {
    try {
      if (!state.masterSalt) throw new Error("Encryption engine not initialized");
      
      const saltArr = base64ToArray(state.masterSalt);
      const key = await deriveKey(passphrase, saltArr);
      const fingerprint = await hashForVerification(passphrase, state.masterSalt);

      // Verify if fingerprint exists and matches (if this is a returning user)
      const existingFingerprint = localStorage.getItem('shadowtalk_e2e_fingerprint');
      if (existingFingerprint && existingFingerprint !== fingerprint) {
        toast.error("Incorrect security passphrase. Access denied.");
        return false;
      }

      // First time setup or correct unlock
      if (!existingFingerprint) {
        localStorage.setItem('shadowtalk_e2e_fingerprint', fingerprint);
      }

      setState(prev => ({
        ...prev,
        isUnlocked: true,
        masterKey: key,
        keyFingerprint: fingerprint
      }));

      // Store in session storage for persistence across reloads during the session
      // (The key itself is NEVER stored, just the session-bound state)
      sessionStorage.setItem('shadowtalk_e2e_active', 'true');
      
      toast.success("Security engine engaged. ShadowTalk is now E2EE protected.");
      return true;
    } catch (error) {
      console.error("[E2EE] Unlock failed:", error);
      toast.error("Failed to engage encryption engine.");
      return false;
    }
  }, [state.masterSalt]);

  const lock = useCallback(() => {
    setState(prev => ({ ...prev, isUnlocked: false, masterKey: null }));
    sessionStorage.removeItem('shadowtalk_e2e_active');
    toast.info("Security engine disengaged.");
  }, []);

  /**
   * Encrypt arbitrary string data
   */
  const encryptData = useCallback(async (plaintext: string): Promise<{ data: string, iv: string } | null> => {
    if (!state.isUnlocked || !state.masterKey) {
      console.warn("[E2EE] Attempted encryption while locked");
      return null;
    }

    try {
      const iv = generateIV();
      const encrypted = await encrypt(plaintext, state.masterKey, iv);
      return {
        data: encrypted,
        iv: arrayToBase64(iv)
      };
    } catch (error) {
      console.error("[E2EE] Encryption failed:", error);
      return null;
    }
  }, [state.isUnlocked, state.masterKey]);

  /**
   * Decrypt data
   */
  const decryptData = useCallback(async (ciphertext: string, ivBase64: string): Promise<string | null> => {
    if (!state.isUnlocked || !state.masterKey) {
      // If locked, we return the ciphertext as a hint that it's encrypted
      return `[ENCRYPTED:${ciphertext.slice(0, 8)}...]`;
    }

    try {
      const iv = base64ToArray(ivBase64);
      return await decrypt(ciphertext, state.masterKey, iv);
    } catch (error) {
      console.error("[E2EE] Decryption failed:", error);
      return "[DECRYPTION_ERROR]";
    }
  }, [state.isUnlocked, state.masterKey]);

  /**
   * Helper to check if a string looks like an E2EE payload
   */
  const isEncrypted = (text: string) => text.startsWith('e2e:');

  /**
   * Wrap data in a recognizable format for the UI and DB
   */
  const wrapEncrypted = (data: string, iv: string) => `e2e:${iv}:${data}`;

  /**
   * Unwrap data into components
   */
  const unwrapEncrypted = (wrapped: string) => {
    if (!wrapped.startsWith('e2e:')) return null;
    const parts = wrapped.split(':');
    return { iv: parts[1], data: parts[2] };
  };

  return {
    ...state,
    unlock,
    lock,
    encryptData,
    decryptData,
    isEncrypted,
    wrapEncrypted,
    unwrapEncrypted
  };
};
