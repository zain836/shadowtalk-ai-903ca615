import { ChevronDown, Sparkles, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type AIProvider = "lovable" | "gemini";

interface ProviderSelectorProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  disabled?: boolean;
}

const providers = [
  {
    value: "lovable" as const,
    label: "ShadowTalk Pro",
    description: "Default premium AI model",
    icon: <Sparkles className="h-4 w-4 text-violet-400" />,
  },
  {
    value: "gemini" as const,
    label: "ShadowTalk API (Gemini)",
    description: "External API load-balancer",
    icon: <Key className="h-4 w-4 text-amber-400" />,
  },
];

export const ProviderSelector = ({ provider, onProviderChange, disabled }: ProviderSelectorProps) => {
  const currentProvider = providers.find(p => p.value === provider) || providers[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 h-9 px-2 bg-transparent hover:bg-muted/15 border-none shadow-none text-base md:text-[17px] font-semibold text-foreground/80 hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl"
          disabled={disabled}
        >
          <span>{currentProvider.value === "lovable" ? "ShadowTalk Pro" : "ShadowTalk API"}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground/60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-1.5 bg-[#1e1f20]/95 backdrop-blur-2xl border border-border/10 rounded-2xl shadow-2xl">
        {providers.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onClick={() => onProviderChange(p.value)}
            className={`flex items-center justify-between gap-3 px-3 py-3 cursor-pointer rounded-xl transition-colors hover:bg-muted/30 focus:bg-muted/30 ${
              provider === p.value ? "bg-muted/20" : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="shrink-0">{p.icon}</span>
              <div className="text-left">
                <div className="text-[13.5px] font-semibold text-foreground/90">{p.label}</div>
                <div className="text-[11px] text-muted-foreground/60 font-normal leading-normal">{p.description}</div>
              </div>
            </div>
            {provider === p.value && (
              <Badge variant="secondary" className="text-[10px] bg-primary/10 border-primary/20 text-primary hover:bg-primary/15 font-semibold">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
