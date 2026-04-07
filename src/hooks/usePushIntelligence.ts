import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { usePushNotifications } from "./usePushNotifications";

interface IntelligenceSignal {
  type: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  body: string;
  action?: string;
}

interface UsePushIntelligenceOptions {
  pollIntervalMs?: number;
  enabled?: boolean;
}

export const usePushIntelligence = ({
  pollIntervalMs = 5 * 60 * 1000, // 5 minutes
  enabled = true,
}: UsePushIntelligenceOptions = {}) => {
  const { user } = useAuth();
  const { sendNotification, permission } = usePushNotifications();
  const [signals, setSignals] = useState<IntelligenceSignal[]>([]);
  const [briefing, setBriefing] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const lastCheckRef = useRef(0);
  const notifiedSignalsRef = useRef(new Set<string>());

  const checkSignals = useCallback(async () => {
    if (!user || !enabled) return;

    const now = Date.now();
    if (now - lastCheckRef.current < 30000) return; // 30s throttle
    lastCheckRef.current = now;

    try {
      const { data, error } = await supabase.functions.invoke("push-intelligence", {
        body: { action: "check" },
      });

      if (error) throw error;

      setSignals(data.signals || []);

      // Send browser notifications for new high/critical signals
      if (permission === "granted") {
        for (const signal of data.signals || []) {
          const signalKey = `${signal.type}-${signal.title}`;
          if (
            (signal.priority === "high" || signal.priority === "critical") &&
            !notifiedSignalsRef.current.has(signalKey)
          ) {
            sendNotification(signal.title, {
              body: signal.body,
              tag: signal.type,
              data: { action: signal.action },
            });
            notifiedSignalsRef.current.add(signalKey);
          }
        }
      }
    } catch (err) {
      console.error("[PushIntelligence] Check failed:", err);
    }
  }, [user, enabled, permission, sendNotification]);

  const fetchBriefing = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("push-intelligence", {
        body: { action: "briefing" },
      });

      if (error) throw error;

      setBriefing(data.briefing || "");
      setSignals(data.signals || []);
    } catch (err) {
      console.error("[PushIntelligence] Briefing failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Periodic polling
  useEffect(() => {
    if (!user || !enabled) return;

    checkSignals(); // Initial check

    const interval = setInterval(checkSignals, pollIntervalMs);
    return () => clearInterval(interval);
  }, [user, enabled, pollIntervalMs, checkSignals]);

  const criticalSignals = signals.filter(s => s.priority === "critical");
  const highSignals = signals.filter(s => s.priority === "high");

  return {
    signals,
    briefing,
    isLoading,
    criticalSignals,
    highSignals,
    checkSignals,
    fetchBriefing,
    signalCount: signals.length,
  };
};
