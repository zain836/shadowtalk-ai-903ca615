import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, Download, WifiOff, AlertCircle, Check, Shield, Gauge } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useRobustOfflineAI } from '@/hooks/useRobustOfflineAI';

export const OfflineAIIndicator: React.FC = () => {
  const {
    isReady,
    isLoading,
    loadProgress,
    loadStage,
    activeModel,
    error,
    hasCachedModel,
    loadModel,
    downloadSpeed,
    isBackgroundDownloading,
    backgroundProgress,
  } = useRobustOfflineAI();

  const isOffline = !navigator.onLine;

  // Don't show anything if online, no cached model, and not loading
  if (!isOffline && !isReady && !isLoading && !hasCachedModel && !isBackgroundDownloading) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {isOffline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={`gap-1 cursor-help ${
                  isReady
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}
              >
                {isReady ? (
                  <>
                    <Shield className="h-3 w-3" />
                    Offline AI
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {isReady ? (
                <p>🛡️ {activeModel} running locally on your device.</p>
              ) : hasCachedModel ? (
                <p>You're offline. Click to load cached AI model.</p>
              ) : (
                <p>You're offline. Basic responses only.</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}

        {error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="gap-1 cursor-help">
                <AlertCircle className="h-3 w-3" />
                AI Error
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{error}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
            <Download className="h-3 w-3 animate-bounce text-primary" />
            <div className="flex flex-col gap-0.5 min-w-[120px]">
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {loadStage || 'Loading AI...'}
              </span>
              <Progress value={loadProgress} className="h-1" />
            </div>
            <span className="text-xs text-muted-foreground">{loadProgress}%</span>
          </div>
        )}

        {/* Background download mini indicator */}
        {isBackgroundDownloading && !isLoading && !isOffline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 cursor-help bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Download className="h-3 w-3 animate-pulse" />
                {backgroundProgress}%
                {downloadSpeed && (
                  <span className="text-[10px] opacity-70 flex items-center gap-0.5">
                    <Gauge className="h-2.5 w-2.5" />
                    {downloadSpeed}
                  </span>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>📥 Auto-downloading offline AI model ({backgroundProgress}%)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isReady && !isLoading && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="gap-1 bg-green-500/20 text-green-400 border-green-500/30 cursor-help"
              >
                <Check className="h-3 w-3" />
                {activeModel || 'Local AI'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>✅ {activeModel} loaded locally. Works offline!</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isOffline && !isReady && !isLoading && hasCachedModel && !error && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadModel()}
            className="gap-1 h-7 text-xs"
          >
            <Cpu className="h-3 w-3" />
            Load Offline AI
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};
