import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const SESSION_KEY = "shadowtalk_session_id";

const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const useGeoLocation = () => {
  const { user } = useAuth();
  const tracked = useRef(false);
  const heartbeatInterval = useRef<number | null>(null);

  useEffect(() => {
    const trackLocation = async () => {
      if (tracked.current) return;
      tracked.current = true;

      const sessionId = getOrCreateSessionId();

      try {
        const { error } = await supabase.functions.invoke("track-location", {
          body: {
            sessionId,
            userId: user?.id || null,
          },
        });

        if (error) {
          console.error("Failed to track location:", error);
        }
      } catch (err) {
        console.error("Location tracking error:", err);
      }
    };

    // Track on mount
    trackLocation();

    // Heartbeat to update last_seen_at every 5 minutes
    heartbeatInterval.current = window.setInterval(async () => {
      const sessionId = getOrCreateSessionId();
      try {
        await supabase.functions.invoke("track-location", {
          body: {
            sessionId,
            userId: user?.id || null,
          },
        });
      } catch (err) {
        // Silently fail heartbeats
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [user?.id]);
};

export default useGeoLocation;
