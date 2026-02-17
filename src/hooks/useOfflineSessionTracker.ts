import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface OfflineSession {
  id: string;
  startedAt: Date;
  messageCount: number;
  modelUsed: string | null;
  featuresUsed: Set<string>;
  deviceType: string;
}

export const useOfflineSessionTracker = () => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<OfflineSession | null>(null);
  const sessionRef = useRef<OfflineSession | null>(null);

  const detectDevice = (): string => {
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  };

  const startSession = useCallback((modelUsed?: string) => {
    const session: OfflineSession = {
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: new Date(),
      messageCount: 0,
      modelUsed: modelUsed || null,
      featuresUsed: new Set(),
      deviceType: detectDevice(),
    };
    sessionRef.current = session;
    setActiveSession(session);
    return session.id;
  }, []);

  const trackMessage = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.messageCount += 1;
      setActiveSession({ ...sessionRef.current });
    }
  }, []);

  const trackFeature = useCallback((feature: string) => {
    if (sessionRef.current) {
      sessionRef.current.featuresUsed.add(feature);
      setActiveSession({ ...sessionRef.current });
    }
  }, []);

  const endSession = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || !user) return;

    const now = new Date();
    const durationMs = now.getTime() - session.startedAt.getTime();

    try {
      await supabase.from('offline_session_analytics').insert({
        user_id: user.id,
        session_start: session.startedAt.toISOString(),
        session_end: now.toISOString(),
        duration_ms: durationMs,
        messages_sent: session.messageCount,
        model_used: session.modelUsed,
        features_used: Array.from(session.featuresUsed),
        device_type: session.deviceType,
        was_synced: true,
        synced_at: now.toISOString(),
      });
    } catch (err) {
      console.error('[OfflineSessionTracker] Failed to save session:', err);
    }

    sessionRef.current = null;
    setActiveSession(null);
  }, [user]);

  // Auto-end session when going online
  useEffect(() => {
    const handleOnline = () => {
      if (sessionRef.current) {
        endSession();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [endSession]);

  // Auto-start when going offline
  useEffect(() => {
    const handleOffline = () => {
      if (!sessionRef.current) {
        startSession();
      }
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, [startSession]);

  return {
    activeSession,
    startSession,
    endSession,
    trackMessage,
    trackFeature,
    isTracking: !!activeSession,
  };
};
