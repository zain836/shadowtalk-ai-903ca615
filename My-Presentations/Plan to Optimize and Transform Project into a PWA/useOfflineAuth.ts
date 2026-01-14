import { useState, useEffect, useCallback } from 'react';
import bcrypt from 'bcryptjs';

const OFFLINE_AUTH_KEY = 'shadowtalk_offline_auth';
const AUTH_TOKEN_KEY = 'shadowtalk_auth_token';

interface OfflineCredentials {
  email: string;
  passwordHash: string;
  userId: string;
  lastSynced: number;
}

interface OfflineAuthState {
  isOffline: boolean;
  hasOfflineCredentials: boolean;
  offlineUser: { id: string; email: string } | null;
}

export const useOfflineAuth = () => {
  const [state, setState] = useState<OfflineAuthState>({
    isOffline: !navigator.onLine,
    hasOfflineCredentials: false,
    offlineUser: null,
  });

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for stored credentials
    checkStoredCredentials();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkStoredCredentials = () => {
    try {
      const stored = localStorage.getItem(OFFLINE_AUTH_KEY);
      if (stored) {
        const credentials: OfflineCredentials = JSON.parse(stored);
        setState(prev => ({ ...prev, hasOfflineCredentials: true }));
      }
    } catch (e) {
      console.error('Error checking stored credentials:', e);
    }
  };

  // Save credentials for offline use (called after successful online login)
  const saveCredentialsForOffline = useCallback(async (email: string, password: string, userId: string) => {
    try {
      // Hash the password with bcrypt (10 rounds)
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const credentials: OfflineCredentials = {
        email,
        passwordHash,
        userId,
        lastSynced: Date.now(),
      };

      localStorage.setItem(OFFLINE_AUTH_KEY, JSON.stringify(credentials));
      setState(prev => ({ ...prev, hasOfflineCredentials: true }));
      
      console.log('[Offline Auth] Credentials saved for offline use');
      return true;
    } catch (e) {
      console.error('Error saving offline credentials:', e);
      return false;
    }
  }, []);

  // Verify credentials offline
  const verifyOfflineCredentials = useCallback(async (email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> => {
    try {
      const stored = localStorage.getItem(OFFLINE_AUTH_KEY);
      if (!stored) {
        return { success: false, error: 'No offline credentials found. Please login online first.' };
      }

      const credentials: OfflineCredentials = JSON.parse(stored);

      // Check email
      if (credentials.email.toLowerCase() !== email.toLowerCase()) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Verify password hash
      const isValid = await bcrypt.compare(password, credentials.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check if credentials are too old (30 days)
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - credentials.lastSynced > thirtyDays) {
        return { success: false, error: 'Offline credentials expired. Please login online to refresh.' };
      }

      // Generate a session token
      const sessionToken = crypto.randomUUID();
      sessionStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({
        userId: credentials.userId,
        email: credentials.email,
        token: sessionToken,
        isOffline: true,
      }));

      setState(prev => ({
        ...prev,
        offlineUser: { id: credentials.userId, email: credentials.email },
      }));

      return { success: true, userId: credentials.userId };
    } catch (e) {
      console.error('Error verifying offline credentials:', e);
      return { success: false, error: 'Error verifying credentials' };
    }
  }, []);

  // Check if user is logged in offline
  const getOfflineSession = useCallback(() => {
    try {
      const session = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.isOffline) {
          return { id: parsed.userId, email: parsed.email };
        }
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Clear offline session
  const clearOfflineSession = useCallback(() => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setState(prev => ({ ...prev, offlineUser: null }));
  }, []);

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    localStorage.removeItem(OFFLINE_AUTH_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setState(prev => ({ ...prev, hasOfflineCredentials: false, offlineUser: null }));
  }, []);

  return {
    ...state,
    saveCredentialsForOffline,
    verifyOfflineCredentials,
    getOfflineSession,
    clearOfflineSession,
    clearOfflineData,
  };
};
