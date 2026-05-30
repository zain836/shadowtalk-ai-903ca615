import {
  Sparkles,
  SquarePen,
  Search,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface ChatIconRailProps {
  userInitials: string;
  onNewChat: () => void;
  onOpenHistory: () => void;
  onOpenTools: () => void;
  onOpenSettings: () => void;
}

export const ChatIconRail = ({
  userInitials,
  onNewChat,
  onOpenHistory,
  onOpenTools,
  onOpenSettings,
}: ChatIconRailProps) => {
  const navigate = useNavigate();

  const navItems = [
    { icon: SquarePen, label: "New chat", onClick: onNewChat },
    { icon: Search, label: "Search chats", onClick: onOpenHistory },
    { icon: LayoutGrid, label: "Tools", onClick: onOpenTools },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="flex md:hidden w-[72px] shrink-0 flex-col items-center py-4 border-r border-sidebar-border bg-sidebar relative z-30">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted/30 transition-colors"
              aria-label="ShadowTalk home"
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">ShadowTalk</TooltipContent>
        </Tooltip>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map(({ icon: Icon, label, onClick }) => (
            <Tooltip key={label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClick}
                  className="h-10 w-10 rounded-lg text-muted-foreground/80 hover:text-foreground hover:bg-white/5"
                  aria-label={label}
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-1 mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                className="h-10 w-10 rounded-lg text-muted-foreground/80 hover:text-foreground hover:bg-white/5"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSettings}
                className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground ring-1 ring-border/50"
                aria-label="Account"
              >
                {userInitials}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Account</TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};
