import { Zap, Key } from "lucide-react";
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
    label: "Lovable AI",
    description: "Default AI provider",
    icon: <Zap className="h-4 w-4" />,
    color: "text-primary",
  },
  {
    value: "gemini" as const,
    label: "Gemini Keys",
    description: "Load-balanced API keys",
    icon: <Key className="h-4 w-4" />,
    color: "text-amber-500",
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
          className="gap-2 h-8 px-2 text-xs"
          disabled={disabled}
        >
          <span className={currentProvider.color}>{currentProvider.icon}</span>
          <span className="hidden sm:inline">{currentProvider.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {providers.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onClick={() => onProviderChange(p.value)}
            className={`flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer ${
              provider === p.value ? "bg-primary/10" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={p.color}>{p.icon}</span>
              <div>
                <div className="font-medium">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.description}</div>
              </div>
            </div>
            {provider === p.value && (
              <Badge variant="secondary" className="text-xs">Active</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
