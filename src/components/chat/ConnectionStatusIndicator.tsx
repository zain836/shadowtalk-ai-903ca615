import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Wifi,
  WifiOff,
  Brain,
  Download,
  Check,
  X,
  Loader2,
  HardDrive,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSovereignAI } from '@/hooks/useSovereignAI';

export const ConnectionStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const {
    isReady,
    isLoading,
    loadProgress,
    loadStage,
    activeModel,
    error,
    initializeSovereignEngine: loadModel,
    availableModels,
    isWebGPUAvailable,
    capabilities,
  } = useSovereignAI();

  const hasCachedModel = availableModels.some(m => m.tier === 'standard'); // Simplified check

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      if (!isReady && !isLoading) {
        console.log('[ConnectionStatus] Going offline - attempting engine init');
        loadModel();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isReady, isLoading, loadModel]);

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        bgClass: 'bg-blue-500/15 border-blue-500/40',
        textClass: 'text-blue-500',
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        label: 'Loading',
      };
    }
    if (!isOnline) {
      if (isReady) {
        return {
          bgClass: 'bg-green-500/15 border-green-500/40',
          textClass: 'text-green-500',
          icon: <Brain className="h-3.5 w-3.5" />,
          label: 'Sovereign AI',
        };
      }
      return {
        bgClass: 'bg-amber-500/15 border-amber-500/40',
        textClass: 'text-amber-500',
        icon: <WifiOff className="h-3.5 w-3.5" />,
        label: 'Offline',
      };
    }
    if (isReady) {
      return {
        bgClass: 'bg-green-500/15 border-green-500/40',
        textClass: 'text-green-500',
        icon: <Wifi className="h-3.5 w-3.5" />,
        label: 'AI Ready',
      };
    }
    return {
      bgClass: 'bg-primary/15 border-primary/40',
      textClass: 'text-primary',
      icon: <Wifi className="h-3.5 w-3.5" />,
      label: 'Online',
    };
  };

  const status = getStatusConfig();

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all hover:opacity-80 ${status.bgClass} ${status.textClass}`}
              >
                {status.icon}
                <span className="hidden sm:inline">{status.label}</span>
                {isLoading && (
                  <span className="text-[10px] opacity-70">{loadProgress}%</span>
                )}
              </div>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="bottom">
            <p>Click for connection details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-amber-500" />
                  <span>Offline</span>
                </>
              )}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isOnline
                ? 'Connected to the internet. Cloud AI available.'
                : 'No internet connection. Using local AI if available.'}
            </p>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>Local AI Status</span>
            </h4>

            {isLoading && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="truncate max-w-[160px]">{loadStage}</span>
                  <span className="text-muted-foreground font-medium">{loadProgress}%</span>
                </div>
                <Progress value={loadProgress} className="h-1.5" />
              </div>
            )}

            {isReady && activeModel && !isLoading && (
              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{activeModel.name}</p>
                  <p className="text-[10px] text-muted-foreground">Sovereign Mode Active — 100% Private</p>
                </div>
              </div>
            )}

            {!isLoading && !activeModel && (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-center gap-2">
                  <X className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">Engine Not Loaded</p>
                    <p className="text-[10px] text-muted-foreground">
                      Initialize local AI for sovereign offline use
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => loadModel()}
                  disabled={!isOnline && !hasCachedModel}
                  className="w-full gap-1.5 h-8"
                >
                  <Brain className="h-3.5 w-3.5" />
                  Initialize AI
                </Button>
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-xs text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => loadModel()}
                  className="h-6 text-[10px] mt-1 px-2"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          {capabilities.usedStorage !== undefined && (
            <>
              <div className="border-t border-border" />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Local Storage</span>
                  <span>{capabilities.usedStorage}GB / {capabilities.estimatedStorage}GB</span>
                </div>
                <Progress value={(capabilities.usedStorage / capabilities.estimatedStorage) * 100} className="h-1" />
              </div>
            </>
          )}

          <p className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border">
            {isReady
              ? '✨ Sovereign AI active — 100% Private'
              : '🚀 Powerful local intelligence available for download'}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
