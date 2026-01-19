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
    const trackPageVisit = async () => {
      const currentPath = location.pathname;
      const sessionId = getSessionId();
      const now = Date.now();
      
      // Calculate duration on previous page
      const durationSeconds = lastPageRef.current 
        ? Math.round((now - lastTimestampRef.current) / 1000)
        : null;

      // Update the previous page's duration if we have one
      if (lastPageRef.current && durationSeconds && durationSeconds > 0) {
        await supabase
          .from('user_journeys')
          .update({ duration_seconds: durationSeconds })
          .eq('session_id', sessionId)
          .eq('page_path', lastPageRef.current)
          .order('timestamp', { ascending: false })
          .limit(1);
      }

      // Insert new page visit
      const { error } = await supabase
        .from('user_journeys')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId,
          page_path: currentPath,
          page_title: document.title,
          referrer_path: lastPageRef.current || null,
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Error tracking page visit:', error);
      }

      // Update refs for next navigation
      lastPageRef.current = currentPath;
      lastTimestampRef.current = now;
    };

    trackPageVisit();
  }, [location.pathname, user?.id]);

  // Track page unload to update final duration
  useEffect(() => {
    const handleBeforeUnload = async () => {
      const sessionId = getSessionId();
      const durationSeconds = Math.round((Date.now() - lastTimestampRef.current) / 1000);
      
      if (lastPageRef.current && durationSeconds > 0) {
        // Use sendBeacon for reliability on page unload
        const payload = JSON.stringify({
          session_id: sessionId,
          page_path: lastPageRef.current,
          duration_seconds: durationSeconds,
        });
        
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_journeys?session_id=eq.${sessionId}&page_path=eq.${lastPageRef.current}`,
          payload
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
};
