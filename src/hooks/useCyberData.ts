import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Incidents (War Room) ──────────────────────────────────

export interface CyberIncident {
  id: string;
  user_id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CyberIncidentEvent {
  id: string;
  incident_id: string;
  user_id: string;
  event_time: string;
  event_description: string;
  severity: string;
  mitre_tactic: string | null;
  source: string | null;
  created_at: string;
}

export function useIncidents() {
  return useQuery({
    queryKey: ["cyber-incidents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cyber_incidents")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as CyberIncident[];
    },
  });
}

export function useIncidentEvents(incidentId: string | null) {
  return useQuery({
    queryKey: ["cyber-incident-events", incidentId],
    enabled: !!incidentId,
    queryFn: async () => {
      const { data } = await supabase
        .from("cyber_incident_events")
        .select("*")
        .eq("incident_id", incidentId!)
        .order("event_time", { ascending: true });
      return (data || []) as CyberIncidentEvent[];
    },
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (incident: { title: string; severity: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required");
      const { data, error } = await supabase
        .from("cyber_incidents")
        .insert({ ...incident, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cyber-incidents"] }),
  });
}

export function useAddIncidentEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      incident_id: string;
      event_time: string;
      event_description: string;
      severity: string;
      mitre_tactic?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase
        .from("cyber_incident_events")
        .insert({ ...event, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["cyber-incident-events", vars.incident_id] }),
  });
}

// ── Research Projects (Zero-Day Lab) ──────────────────────

export interface ResearchProject {
  id: string;
  user_id: string;
  project_code: string;
  target: string;
  vulnerability_type: string;
  status: string;
  estimated_bounty: number;
  progress: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useResearchProjects() {
  return useQuery({
    queryKey: ["cyber-research-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cyber_research_projects")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as ResearchProject[];
    },
  });
}

export function useCreateResearchProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: {
      project_code: string;
      target: string;
      vulnerability_type: string;
      status?: string;
      estimated_bounty?: number;
      progress?: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in required");
      const { data, error } = await supabase
        .from("cyber_research_projects")
        .insert({ ...project, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cyber-research-projects"] }),
  });
}

export function useUpdateResearchProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; progress?: number; notes?: string }) => {
      const { error } = await supabase
        .from("cyber_research_projects")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cyber-research-projects"] }),
  });
}

// ── OSINT Header Analysis ─────────────────────────────────

export function useHeaderAnalysis() {
  return useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke("website-security-scan", {
        body: { url, scanDepth: "standard" },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ── Hero Stats (real counts) ──────────────────────────────

export function useCyberStats() {
  return useQuery({
    queryKey: ["cyber-hero-stats"],
    queryFn: async () => {
      const [cveRes, actorRes, scanRes] = await Promise.all([
        supabase.from("threat_intel_cves").select("id", { count: "exact", head: true }),
        supabase.from("threat_actors").select("id", { count: "exact", head: true }),
        supabase.from("cyber_scan_results").select("id", { count: "exact", head: true }),
      ]);
      return {
        cveCount: cveRes.count || 0,
        actorCount: actorRes.count || 0,
        scanCount: scanRes.count || 0,
      };
    },
    staleTime: 60_000,
  });
}
