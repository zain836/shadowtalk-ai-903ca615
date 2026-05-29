import { NavLink, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Brain,
  Network,
  FileText,
  Radio,
  Workflow,
  Plug,
  Settings,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
}

export function ChatShadowSidebar({
  userInitials,
  userDisplayName,
  onNewChat,
}: ChatShadowSidebarProps) {
  const navigate = useNavigate();
  const [shadowMode, setShadowMode] = useState(true);

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#050506] relative z-30">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-3 px-5 pt-6 pb-8 text-left w-full hover:opacity-90 transition-opacity"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white tracking-tight">ShadowTalk AI</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-400/80">Shadow Pulse</p>
        </div>
      </button>

      <nav className="flex-1 px-3 space-y-0.5">
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
                    ? "bg-white/[0.06] text-white"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.03]",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.06] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/50">Shadow Mode</span>
          <Switch
            checked={shadowMode}
            onCheckedChange={setShadowMode}
            className="data-[state=checked]:bg-cyan-500"
          />
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04] transition-colors text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1e] text-xs font-bold text-white/90 ring-1 ring-white/10">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userDisplayName}</p>
            <p className="text-[11px] text-white/35">Executive</p>
          </div>
        </button>
      </div>
    </aside>
  );
}
