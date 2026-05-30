import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface EcoChallenge {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  reward: string;
  xpReward: number;
  endsAt: string;
  participants: number;
  category: "energy" | "water" | "transport" | "community" | "waste";
  difficulty: "Easy" | "Medium" | "Hard";
  joined: boolean;
  timeLeft: string;
}

const CHALLENGE_DEFS: Omit<
  EcoChallenge,
  "progress" | "participants" | "joined" | "timeLeft" | "endsAt"
>[] = [
  {
    id: "waste-week",
    name: "🌍 Zero Waste Week",
    description: "Reduce waste by completing 5 waste-related eco actions this week",
    target: 5,
    reward: "Gold Badge + 500 XP",
    xpReward: 500,
    category: "waste",
    difficulty: "Medium",
  },
  {
    id: "energy-sprint",
    name: "⚡ Energy Saver Sprint",
    description: "Community goal: save 10,000 kWh collectively this month",
    target: 10000,
    reward: "Platinum Badge + 1000 XP",
    xpReward: 1000,
    category: "energy",
    difficulty: "Hard",
  },
  {
    id: "walk-week",
    name: "🚶 Walk More Week",
    description: "Replace 3 car trips with walking or cycling (transport actions)",
    target: 3,
    reward: "Silver Badge + 250 XP",
    xpReward: 250,
    category: "transport",
    difficulty: "Easy",
  },
  {
    id: "water-month",
    name: "💧 Water Conservation Month",
    description: "Save 500L of water through daily micro-actions",
    target: 500,
    reward: "Eco Hero Title + 750 XP",
    xpReward: 750,
    category: "water",
    difficulty: "Medium",
  },
];

function daysLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(ms / 86400000));
  return days === 1 ? "1 day" : `${days} days`;
}

function windowForChallenge(id: string): { start: string; end: string } {
  const now = Date.now();
  switch (id) {
    case "waste-week":
    case "walk-week":
      return {
        start: new Date(now - 7 * 86400000).toISOString(),
        end: new Date(now + 7 * 86400000).toISOString(),
      };
    case "energy-sprint":
      return {
        start: new Date(now - 30 * 86400000).toISOString(),
        end: new Date(now + 14 * 86400000).toISOString(),
      };
    case "water-month":
    default:
      return {
        start: new Date(now - 30 * 86400000).toISOString(),
        end: new Date(now + 21 * 86400000).toISOString(),
      };
  }
}

export function useEcoChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<EcoChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const built: EcoChallenge[] = [];

      for (const def of CHALLENGE_DEFS) {
        const { start, end } = windowForChallenge(def.id);

        const { data: participantRows } = await supabase
          .from("eco_actions")
          .select("user_id")
          .eq("category", def.category)
          .gte("completed_at", start)
          .limit(2000);
        const participantCount = new Set((participantRows ?? []).map((r) => r.user_id)).size;

        let progress = 0;
        if (def.id === "energy-sprint") {
          const { data: sums } = await supabase
            .from("eco_actions")
            .select("energy_saved")
            .eq("category", "energy")
            .gte("completed_at", start);
          progress = (sums ?? []).reduce((s, r) => s + (r.energy_saved ?? 0), 0);
        } else if (def.id === "water-month") {
          const { data: sums } = await supabase
            .from("eco_actions")
            .select("water_saved")
            .eq("category", "water")
            .gte("completed_at", start);
          progress = (sums ?? []).reduce((s, r) => s + (r.water_saved ?? 0), 0);
        } else {
          const { count: actionCount } = await supabase
            .from("eco_actions")
            .select("id", { count: "exact", head: true })
            .eq("category", def.category)
            .gte("completed_at", start);
          progress = actionCount ?? 0;
        }

        let joined = false;
        if (user) {
          const { count: userActions } = await supabase
            .from("eco_actions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("category", def.category)
            .gte("completed_at", start);
          joined = (userActions ?? 0) > 0;
        }

        if (cancelled) return;

        built.push({
          ...def,
          endsAt: end,
          progress,
          participants: participantCount ?? 0,
          joined,
          timeLeft: daysLeft(end),
        });
      }

      if (!cancelled) {
        setChallenges(built);
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { challenges, isLoading, setChallenges };
}
