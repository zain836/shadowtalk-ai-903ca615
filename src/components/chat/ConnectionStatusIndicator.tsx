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
  Gauge,
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
import { useRobustOfflineAI } from '@/hooks/useRobustOfflineAI';

export const ConnectionStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const {
    isReady,
    isLoading,
    loadProgress,
    loadStage,
    activeModel,
    hasCachedModel,
    error,
    loadModel,
    models,
    downloadModel,
    isBackgroundDownloading,
    backgroundProgress,
    downloadSpeed,
    recommendedModel,
    storageEstimate,
    formatBytes,
  } = useRobustOfflineAI();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      if (hasCachedModel && !isReady && !isLoading) {
        console.log('[ConnectionStatus] Going offline - loading cached model');
        loadModel();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasCachedModel, isReady, isLoading, loadModel]);

  const getStatusConfig = () => {
    if (isOnline && isBackgroundDownloading) {
      return {
        bgClass: 'bg-blue-500/15 border-blue-500/40',
        textClass: 'text-blue-500',
        icon: <Download className="h-3.5 w-3.5 animate-pulse" />,
        label: `${backgroundProgress}%`,
      };
    }
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
          label: 'Offline AI',
        };
      }
      if (hasCachedModel) {
        return {
          bgClass: 'bg-amber-500/15 border-amber-500/40',
          textClass: 'text-amber-500',
          icon: <WifiOff className="h-3.5 w-3.5" />,
          label: 'Offline',
        };
      }
      return {
        bgClass: 'bg-red-500/15 border-red-500/40',
        textClass: 'text-red-500',
        icon: <WifiOff className="h-3.5 w-3.5" />,
        label: 'No AI',
      };
    }
    if (isReady || hasCachedModel) {
      return {
        bgClass: 'bg-green-500/15 border-green-500/40',
        textClass: 'text-green-500',
        icon: <Wifi className="h-3.5 w-3.5" />,
        label: isReady ? 'AI Ready' : 'Online',
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
  const storageUsedPercent = storageEstimate
    ? Math.round((storageEstimate.used / storageEstimate.quota) * 100)
    : null;

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
          {/* Connection Status */}
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

          {/* Offline LLM Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>Local AI Status</span>
            </h4>

            {/* Loading State */}
            {isLoading && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="truncate max-w-[160px]">{loadStage}</span>
                  <span className="text-muted-foreground font-medium">{loadProgress}%</span>
                </div>
                <Progress value={loadProgress} className="h-1.5" />
              </div>
            )}

            {/* Ready State */}
            {isReady && activeModel && !isLoading && (
              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{activeModel}</p>
                  <p className="text-[10px] text-muted-foreground">Installed & Ready — works 100% offline</p>
                </div>
              </div>
            )}

            {/* Background Download Progress */}
            {isBackgroundDownloading && !isLoading && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="truncate max-w-[140px]">Downloading {recommendedModel?.name}...</span>
                  <span className="text-muted-foreground font-medium">{backgroundProgress}%</span>
                </div>
                <Progress value={backgroundProgress} className="h-1.5" />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-muted-foreground">
                    📥 Auto-downloading for full offline AI
                  </p>
                  {downloadSpeed && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Gauge className="h-2.5 w-2.5" />
                      {downloadSpeed}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Not Installed State */}
            {!isReady && !isLoading && !isBackgroundDownloading && (
              <div className="space-y-2">
                <div className={`p-2.5 rounded-lg flex items-center gap-2 ${
                  hasCachedModel
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : 'bg-muted/50 border border-border'
                }`}>
                  {hasCachedModel ? (
                    <>
                      <HardDrive className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">Model Cached</p>
                        <p className="text-[10px] text-muted-foreground">Click Load to activate</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">Not Installed</p>
                        <p className="text-[10px] text-muted-foreground">
                          Download a model for offline use (~{formatBytes(recommendedModel?.bytes || models[0]?.bytes || 0)})
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {hasCachedModel ? (
                  <Button
                    size="sm"
                    onClick={() => loadModel()}
                    className="w-full gap-1.5 h-8"
                  >
                    <Brain className="h-3.5 w-3.5" />
                    Load Offline AI
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadModel(recommendedModel?.id || models[0]?.id)}
                    disabled={!isOnline}
                    className="w-full gap-1.5 h-8"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download {recommendedModel?.name || models[0]?.name || 'Model'}
                  </Button>
                )}
              </div>
            )}

            {/* Error State */}
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

          {/* Storage Info */}
          {storageEstimate && storageUsedPercent !== null && (
            <>
              <div className="border-t border-border" />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Device Storage</span>
                  <span>{formatBytes(storageEstimate.used)} / {formatBytes(storageEstimate.quota)}</span>
                </div>
                <Progress value={storageUsedPercent} className="h-1" />
              </div>
            </>
          )}

          {/* Info Footer */}
          <p className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border">
            {isReady
              ? '✨ Works 100% offline — reasoning, code, math'
              : isBackgroundDownloading
              ? '⏳ Auto-downloading AI for full offline capabilities'
              : hasCachedModel
              ? '💾 Model cached — ready to load when offline'
              : isOnline
              ? '🚀 A powerful model will auto-download in background'
              : 'Connect to internet to download offline AI'}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
