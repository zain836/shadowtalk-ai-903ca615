import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTier, type PowerTier } from "@/hooks/useReferralTracking";

export type ReferrerStatus = "identified" | "offered" | "active" | "champion";

export interface PowerReferrer {
  id: string;
  name: string;
  referralCode: string;
  sessions: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  referrals: number;
  potentialReach: number;
  bonusCredits: number;
  status: ReferrerStatus;
}

function tierKeyFromPowerTier(tier: PowerTier | null): PowerReferrer["tier"] {
  if (!tier) return "bronze";
  const map: Record<string, PowerReferrer["tier"]> = {
    Bronze: "bronze",
    Silver: "silver",
    Gold: "gold",
    Platinum: "platinum",
  };
  return map[tier.name] ?? "bronze";
}

function deriveStatus(referrals: number, conversions: number): ReferrerStatus {
  if (referrals >= 25 || conversions >= 10) return "champion";
  if (conversions > 0) return "active";
  if (referrals > 0) return "offered";
  return "identified";
}

export function usePowerReferrers() {
  const [referrers, setReferrers] = useState<PowerReferrer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: codes, error } = await supabase
        .from("user_referral_codes")
        .select("id, user_id, referral_code, total_referrals, successful_conversions, total_earnings")
        .order("total_referrals", { ascending: false })
        .limit(12);

      if (cancelled) return;

      if (error || !codes?.length) {
        setReferrers([]);
        setIsLoading(false);
        return;
      }

      const userIds = codes.map((c) => c.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

      const enriched: PowerReferrer[] = [];
      for (const code of codes) {
        const { count: sessionCount } = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", code.user_id);

        if (cancelled) return;

        const referrals = code.total_referrals ?? 0;
        const conversions = code.successful_conversions ?? 0;
        const powerTier = getTier(referrals);
        const displayName = profileMap.get(code.user_id);
        const name = displayName?.trim() || "Community member";

        enriched.push({
          id: code.id,
          name: name.length > 24 ? `${name.slice(0, 21)}…` : name,
          referralCode: code.referral_code,
          sessions: sessionCount ?? 0,
          tier: tierKeyFromPowerTier(powerTier),
          referrals,
          potentialReach: referrals * 200,
          bonusCredits: powerTier?.bonus ?? 0,
          status: deriveStatus(referrals, conversions),
        });
      }

      // Surface high-engagement users even with zero referrals yet
      const highSession = enriched.filter((u) => u.sessions >= 20);
      const sorted = (highSession.length ? highSession : enriched).sort(
        (a, b) => b.referrals - a.referrals || b.sessions - a.sessions
      );

      setReferrers(sorted.slice(0, 8));
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { referrers, isLoading };
}
