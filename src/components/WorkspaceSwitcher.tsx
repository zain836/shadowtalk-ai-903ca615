import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2, ChevronDown, Plus, Settings, Users, Check, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Workspace {
  id: string;
  name: string;
  role: string;
  memberCount: number;
}

const WorkspaceSwitcher = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      // Get workspaces where user is a member
      const { data: memberships, error: memErr } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id);

      if (memErr) throw memErr;

      if (!memberships || memberships.length === 0) {
        // Auto-create a personal workspace
        const slug = `personal-${user.id.slice(0, 8)}`;
        const { data: ws, error: wsErr } = await supabase
          .from("workspaces")
          .insert({ name: "Personal Workspace", slug, owner_id: user.id })
          .select()
          .single();

        if (wsErr) throw wsErr;

        await supabase
          .from("workspace_members")
          .insert({ workspace_id: ws.id, user_id: user.id, role: "owner" });

        setWorkspaces([{ id: ws.id, name: ws.name, role: "owner", memberCount: 1 }]);
        setCurrentWorkspace({ id: ws.id, name: ws.name, role: "owner", memberCount: 1 });
        setLoading(false);
        return;
      }

      const wsIds = memberships.map((m) => m.workspace_id);
      const roleMap: Record<string, string> = {};
      memberships.forEach((m) => { roleMap[m.workspace_id] = m.role; });

      const { data: wsData, error: wsErr } = await supabase
        .from("workspaces")
        .select("id, name")
        .in("id", wsIds);

      if (wsErr) throw wsErr;

      // Get member counts
      const { data: counts } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .in("workspace_id", wsIds);

      const countMap: Record<string, number> = {};
      counts?.forEach((c) => {
        countMap[c.workspace_id] = (countMap[c.workspace_id] || 0) + 1;
      });

      const list: Workspace[] = (wsData || []).map((ws) => ({
        id: ws.id,
        name: ws.name,
        role: roleMap[ws.id] || "member",
        memberCount: countMap[ws.id] || 1,
      }));

      setWorkspaces(list);
      if (!currentWorkspace || !list.find((w) => w.id === currentWorkspace.id)) {
        setCurrentWorkspace(list[0] || null);
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleSwitch = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    toast({
      title: "Workspace switched",
      description: `Now working in ${workspace.name}`,
    });
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + Date.now();
      const { data: ws, error } = await supabase
        .from("workspaces")
        .insert({ name: newName.trim(), slug, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("workspace_members")
        .insert({ workspace_id: ws.id, user_id: user.id, role: "owner" });

      const newWs: Workspace = { id: ws.id, name: ws.name, role: "owner", memberCount: 1 };
      setWorkspaces((prev) => [...prev, newWs]);
      setCurrentWorkspace(newWs);
      setCreateOpen(false);
      setNewName("");
      toast({ title: "Workspace created", description: `${ws.name} is ready` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create workspace", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-accent/20 text-accent",
      admin: "bg-primary/20 text-primary",
      member: "bg-muted text-muted-foreground",
    };
    return colors[role] || colors.member;
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline max-w-[120px] truncate">
              {loading ? "Loading…" : currentWorkspace?.name || "Workspace"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : workspaces.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No workspaces yet</p>
          ) : (
            workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleSwitch(workspace)}
                className="flex items-center justify-between py-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {workspace.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{workspace.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-xs ${getRoleBadge(workspace.role)}`}>
                        {workspace.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {workspace.memberCount}
                      </span>
                    </div>
                  </div>
                </div>
                {currentWorkspace?.id === workspace.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create Workspace
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/enterprise-settings")}
          >
            <Settings className="h-4 w-4" />
            Workspace Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Acme Corp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkspaceSwitcher;
