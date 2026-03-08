import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('journey_session_id');
  if (!sessionId) {
    sessionId = `journey_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('journey_session_id', sessionId);
  }
  return sessionId;
};

export const useJourneyTracking = () => {
  const location = useLocation();
  const { user } = useAuth();
  const lastPageRef = useRef<string | null>(null);
  const lastTimestampRef = useRef<number>(Date.now());

  useEffect(() => {
    // RLS requires authenticated user - skip tracking for anonymous visitors
    if (!user?.id) return;

    const trackPageVisit = async () => {
      const currentPath = location.pathname;
      const sessionId = getSessionId();
      const now = Date.now();

      const durationSeconds = lastPageRef.current
        ? Math.round((now - lastTimestampRef.current) / 1000)
        : null;

      try {
        await supabase
          .from('user_journeys')
          .insert({
            user_id: user?.id || null,
            session_id: sessionId,
            page_path: currentPath,
            page_title: document.title,
            referrer_path: lastPageRef.current || null,
            timestamp: new Date().toISOString(),
            duration_seconds: durationSeconds && durationSeconds > 0 ? durationSeconds : null,
          });
      } catch {
        // Silently fail - analytics should never break UX
      }

      lastPageRef.current = currentPath;
      lastTimestampRef.current = now;
    };

    trackPageVisit();
  }, [location.pathname, user?.id]);
};
