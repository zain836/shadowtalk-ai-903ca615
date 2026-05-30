import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMetricCount } from "@/lib/formatMetrics";

export interface PlatformMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  totalConversations: number;
  isLoading: boolean;
}

const initial: PlatformMetrics = {
  totalUsers: 0,
  dailyActiveUsers: 0,
  totalConversations: 0,
  isLoading: true,
};

export function usePlatformMetrics(): PlatformMetrics {
  const [metrics, setMetrics] = useState<PlatformMetrics>(initial);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [usersRes, convsRes, activityRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("conversations").select("id", { count: "exact", head: true }),
        supabase.from("usage_analytics").select("user_id").gte("created_at", dayAgo).limit(5000),
      ]);

      if (cancelled) return;

      const dau = new Set((activityRes.data ?? []).map((r) => r.user_id)).size;

      setMetrics({
        totalUsers: usersRes.count ?? 0,
        dailyActiveUsers: dau,
        totalConversations: convsRes.count ?? 0,
        isLoading: false,
      });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return metrics;
}

export type CommunityHighlight = {
  label: string;
  value: string;
  description: string;
};

export function buildCommunityHighlights(metrics: PlatformMetrics): CommunityHighlight[] {
  const usersDisplay = metrics.isLoading ? "…" : formatMetricCount(metrics.totalUsers);
  const dauDisplay = metrics.isLoading ? "…" : formatMetricCount(metrics.dailyActiveUsers);
  const convDisplay = metrics.isLoading ? "…" : formatMetricCount(metrics.totalConversations);

  return [
    {
      label: "ShadowTalk users",
      value: usersDisplay,
      description: metrics.totalUsers
        ? `${metrics.totalUsers.toLocaleString()} creators and teams on the platform.`
        : "Be among the first builders on the platform.",
    },
    {
      label: "Daily active users",
      value: dauDisplay,
      description: metrics.dailyActiveUsers
        ? "People who used ShadowTalk in the last 24 hours — from live analytics."
        : "Daily active count updates from usage analytics.",
    },
    {
      label: "AI conversations",
      value: convDisplay,
      description: metrics.totalConversations
        ? `${metrics.totalConversations.toLocaleString()} conversations stored on the platform.`
        : "Conversation count grows with every chat you start.",
    },
    {
      label: "Ship cadence",
      value: "Weekly",
      description: "Features and fixes driven by what you actually use.",
    },
  ];
}
