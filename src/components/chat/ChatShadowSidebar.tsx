import { NavLink, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  MessageSquarePlus,
  Brain,
  Network,
  FileText,
  Radio,
  Workflow,
  Plug,
  Settings,
  Sparkles,
  History,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getShadowModeEnabled, setShadowModeEnabled } from "@/lib/shadowMode";

const NAV = [
  { label: "Chat", icon: MessageSquare, to: "/chatbot", end: true },
  { label: "Intelligence", icon: Brain, to: "/missioncontrol" },
  { label: "Knowledge", icon: Network, to: "/knowledge" },
  { label: "Documents", icon: FileText, to: "/workspace" },
  { label: "Signals", icon: Radio, to: "/analytics" },
  { label: "Automations", icon: Workflow, to: "/workspace" },
  { label: "Integrations", icon: Plug, to: "/developers" },
  { label: "Settings", icon: Settings, to: "/profile" },
] as const;

interface ChatShadowSidebarProps {
  userInitials: string;
  userDisplayName: string;
  onNewChat: () => void;
  onOpenHistory?: () => void;
}

export function ChatShadowSidebar({
  userInitials,
  userDisplayName,
  onNewChat,
  onOpenHistory,
}: ChatShadowSidebarProps) {
  const navigate = useNavigate();
  const [shadowMode, setShadowMode] = useState(() => getShadowModeEnabled());

  useEffect(() => {
    setShadowModeEnabled(shadowMode);
  }, [shadowMode]);

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar relative z-30">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-3 px-5 pt-6 pb-8 text-left w-full hover:opacity-90 transition-opacity"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_hsl(var(--primary)/0.35)]">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground tracking-tight">ShadowTalk AI</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/80">Sovereign Intelligence</p>
        </div>
      </button>

      <div className="px-3 pb-3 space-y-1">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-sidebar-foreground bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4 text-primary shrink-0" />
          New chat
        </button>
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <History className="h-4 w-4 shrink-0" />
            Chat history
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const { label, icon: Icon, to } = item;
          const end = "end" in item && item.end;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.9)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground" title="Deeper dark sovereign UI">
            Shadow Mode
          </span>
          <Switch
            checked={shadowMode}
            onCheckedChange={setShadowMode}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <div className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground ring-1 ring-border">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userDisplayName}</p>
            <p className="text-[11px] text-muted-foreground">Executive</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
