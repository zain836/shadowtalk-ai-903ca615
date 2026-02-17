import { useState, useCallback } from 'react';

interface BiometricState {
  isAvailable: boolean;
  isRegistered: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

const CREDENTIAL_STORAGE_KEY = 'shadowtalk_webauthn_credential';

export const useBiometricAuth = () => {
  const [state, setState] = useState<BiometricState>({
    isAvailable: typeof window !== 'undefined' && !!window.PublicKeyCredential,
    isRegistered: !!localStorage.getItem(CREDENTIAL_STORAGE_KEY),
    isAuthenticating: false,
    error: null,
  });

  // Check if WebAuthn / platform authenticator is available
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (!window.PublicKeyCredential) return false;
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setState(prev => ({ ...prev, isAvailable: available }));
      return available;
    } catch {
      return false;
    }
  }, []);

  // Register biometric credential
  const registerBiometric = useCallback(async (userId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'ShadowTalk AI', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(userId),
            name: 'ShadowTalk User',
            displayName: 'ShadowTalk User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!credential) throw new Error('No credential returned');

      // Store credential ID for future authentication
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem(CREDENTIAL_STORAGE_KEY, credentialId);

      setState(prev => ({ ...prev, isRegistered: true, isAuthenticating: false }));
      return true;
    } catch (e: any) {
      console.error('[Biometric] Registration failed:', e);
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: e.message || 'Biometric registration failed',
      }));
      return false;
    }
  }, []);

  // Authenticate with biometric
  const authenticateBiometric = useCallback(async (): Promise<boolean> => {
    const storedCredentialId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (!storedCredentialId) {
      setState(prev => ({ ...prev, error: 'No biometric credential registered' }));
      return false;
    }

    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credentialIdBytes = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: credentialIdBytes,
            type: 'public-key',
            transports: ['internal'],
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!assertion) throw new Error('Authentication cancelled');

      setState(prev => ({ ...prev, isAuthenticating: false }));
      return true;
    } catch (e: any) {
      console.error('[Biometric] Authentication failed:', e);
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: e.message || 'Biometric authentication failed',
      }));
      return false;
    }
  }, []);

  // Remove biometric registration
  const removeBiometric = useCallback(() => {
    localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
    setState(prev => ({ ...prev, isRegistered: false }));
  }, []);

  return {
    ...state,
    checkAvailability,
    registerBiometric,
    authenticateBiometric,
    removeBiometric,
  };
};
