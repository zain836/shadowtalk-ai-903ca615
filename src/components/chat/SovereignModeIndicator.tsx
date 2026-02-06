import { Wifi, WifiOff, Loader2, Shield, Download, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRobustOfflineAI } from "@/hooks/useRobustOfflineAI";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export const SovereignModeIndicator = () => {
  const { 
    isReady, 
    isLoading, 
    loadProgress,
    activeModel,
    isBackgroundDownloading,
    backgroundProgress,
    hasCachedModel,
    recommendedModel,
  } = useRobustOfflineAI();
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Listen for online/offline changes
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

  // Show background download progress when online
  if (!isOffline && isBackgroundDownloading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className="gap-1.5 px-2 py-1 text-xs cursor-default bg-blue-500/15 border-blue-500/40 text-blue-500"
            >
              <Download className="h-3 w-3 animate-pulse" />
              <span className="hidden sm:inline">{backgroundProgress}%</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>📥 Auto-downloading {recommendedModel?.name || 'AI model'} for offline use</p>
            <p className="text-xs text-muted-foreground">Works offline: reasoning, code, math</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show loading indicator when preparing offline AI
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
            Loading local AI engine... {loadProgress}%
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show offline mode indicator
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
                  <span className="hidden sm:inline">Offline AI</span>
                </>
              ) : hasCachedModel ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span className="hidden sm:inline">Loading...</span>
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
              ? `🧠 Using ${activeModel || 'Local AI'}. 100% private - reasoning, code, math.`
              : hasCachedModel 
                ? 'Offline - Local AI loading...'
                : 'Offline - No local AI model available'
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Don't show anything if online and not doing anything special
  return null;
};
