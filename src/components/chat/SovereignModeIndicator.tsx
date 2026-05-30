import { WifiOff, Loader2, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSovereignAI } from "@/hooks/useSovereignAI";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export const SovereignModeIndicator = () => {
  const { 
    isReady, 
    isLoading, 
    loadProgress,
    activeModel,
    availableModels,
  } = useSovereignAI();
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const hasCachedModel = availableModels.some(m => m.tier === 'standard');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className="gap-1.5 px-2 py-1 text-xs cursor-default"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="hidden sm:inline">{loadProgress}%</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Initializing Sovereign AI... {loadProgress}%
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isOffline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={isReady ? "default" : "secondary"}
              className={cn(
                "gap-1.5 px-2 py-1 text-xs cursor-default",
                isReady && "bg-emerald-600 hover:bg-emerald-600"
              )}
            >
              {isReady ? (
                <>
                  <Brain className="h-3 w-3" />
                  <span className="hidden sm:inline">Sovereign AI</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {isReady 
              ? `🧠 Using ${activeModel?.name || 'Local AI'}. 100% private.`
              : 'Offline - Local AI not loaded'
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};
