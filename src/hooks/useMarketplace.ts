import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  downloads: number;
  rating: number;
  price: string;
  tags: string[];
  icon: string;
  verified: boolean;
}

export const useMarketplace = () => {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_agents")
      .select("*")
      .eq("is_active", true)
      .order("downloads", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load marketplace agents", variant: "destructive" });
    } else {
      setAgents(data || []);
    }
    setLoading(false);
  };

  const fetchInstalled = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_installed_agents")
      .select("agent_id")
      .eq("user_id", user.id);

    if (data) {
      setInstalledIds(new Set(data.map((d) => d.agent_id)));
    }
  };

  const installAgent = async (agentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to install agents.", variant: "destructive" });
      return;
    }

    setInstallingId(agentId);
    const { error } = await supabase
      .from("user_installed_agents")
      .insert({ user_id: user.id, agent_id: agentId });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already installed", description: "This agent is already in your workspace." });
      } else {
        toast({ title: "Error", description: "Failed to install agent", variant: "destructive" });
      }
    } else {
      setInstalledIds((prev) => new Set([...prev, agentId]));
      toast({ title: "✅ Installed!", description: "Agent added to your workspace." });
      // Increment download count optimistically
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, downloads: a.downloads + 1 } : a))
      );
    }
    setInstallingId(null);
  };

  const uninstallAgent = async (agentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setInstallingId(agentId);
    const { error } = await supabase
      .from("user_installed_agents")
      .delete()
      .eq("user_id", user.id)
      .eq("agent_id", agentId);

    if (!error) {
      setInstalledIds((prev) => {
        const next = new Set(prev);
        next.delete(agentId);
        return next;
      });
      toast({ title: "Uninstalled", description: "Agent removed from your workspace." });
    }
    setInstallingId(null);
  };

  useEffect(() => {
    fetchAgents();
    fetchInstalled();
  }, []);

  return { agents, installedIds, loading, installingId, installAgent, uninstallAgent, fetchAgents };
};
