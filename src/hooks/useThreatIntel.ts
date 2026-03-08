import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CVE {
  id: string;
  cve_id: string;
  severity: string;
  cvss_score: number;
  product: string;
  description: string;
  exploit_available: boolean;
  attack_vector: string;
  attack_complexity: string;
  auth_required: string;
  published_at: string;
  created_at: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  origin_country: string;
  origin_flag: string;
  targets: string;
  activity_status: string;
  ttps_count: number;
  last_seen_at: string;
  description: string;
}

export interface ScanResult {
  id: string;
  target_url: string;
  scan_depth: string;
  status: string;
  results: any;
  files_found: number;
  vulnerabilities_found: number;
  risk_score: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export function useLiveCVEs() {
  return useQuery({
    queryKey: ["threat-intel-cves"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        // Return cached DB data for non-auth fallback
        const { data } = await supabase
          .from("threat_intel_cves")
          .select("*")
          .order("published_at", { ascending: false })
          .limit(50);
        return (data || []) as CVE[];
      }

      // Trigger fresh fetch via edge function
      const { data, error } = await supabase.functions.invoke("fetch-threat-intel", {
        body: { action: "fetch-cves" },
      });

      if (error) throw error;
      return (data?.cves || []) as CVE[];
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000,
  });
}

export function useThreatActors() {
  return useQuery({
    queryKey: ["threat-actors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("threat_actors")
        .select("*")
        .order("last_seen_at", { ascending: false });
      return (data || []) as ThreatActor[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useScanHistory() {
  return useQuery({
    queryKey: ["cyber-scan-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cyber_scan_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as ScanResult[];
    },
  });
}

export function useWebsiteScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, scanDepth }: { url: string; scanDepth: string }) => {
      const { data, error } = await supabase.functions.invoke("fetch-threat-intel", {
        body: { action: "scan-website", url, scanDepth },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cyber-scan-history"] });
    },
  });
}

// Realtime subscription for new CVEs
export function useRealtimeCVEs(onNewCVE: (cve: CVE) => void) {
  const queryClient = useQueryClient();

  const subscribe = () => {
    const channel = supabase
      .channel("threat-intel-cves-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "threat_intel_cves" },
        (payload) => {
          onNewCVE(payload.new as CVE);
          queryClient.invalidateQueries({ queryKey: ["threat-intel-cves"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { subscribe };
}
