import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, ChevronDown, Plus, Settings, Users, Check 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Workspace {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  plan: "free" | "pro" | "premium" | "elite";
  members: number;
}

const WorkspaceSwitcher = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mock workspaces - in production, fetch from database
  const [workspaces] = useState<Workspace[]>([
    { id: "1", name: "Personal Workspace", role: "owner", plan: "pro", members: 1 },
    { id: "2", name: "Acme Corp", role: "admin", plan: "premium", members: 12 },
    { id: "3", name: "Dev Team", role: "member", plan: "elite", members: 5 },
  ]);
  
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(workspaces[0]);

  const getPlanBadge = (plan: Workspace["plan"]) => {
    const colors = {
      free: "bg-muted text-muted-foreground",
      pro: "bg-primary/20 text-primary",
      premium: "bg-secondary/20 text-secondary",
      elite: "bg-accent/20 text-accent",
    };
    return colors[plan];
  };

  const getRoleBadge = (role: Workspace["role"]) => {
    const colors = {
      owner: "bg-accent/20 text-accent",
      admin: "bg-primary/20 text-primary",
      member: "bg-muted text-muted-foreground",
    };
    return colors[role];
  };

  const handleSwitch = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    toast({
      title: "Workspace switched",
      description: `Now working in ${workspace.name}`,
    });
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {currentWorkspace.name}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {workspaces.map((workspace) => (
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
                    {workspace.members}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getPlanBadge(workspace.plan)}`}>
                {workspace.plan}
              </Badge>
              {currentWorkspace.id === workspace.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Create Workspace
        </DropdownMenuItem>
        
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          Workspace Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;
