import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, Download, WifiOff, AlertCircle, Check, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useSovereignAI } from '@/hooks/useSovereignAI';

export const OfflineAIIndicator: React.FC = () => {
  const {
    isReady,
    isLoading,
    loadProgress,
    loadStage,
    activeModel,
    error,
    initializeSovereignEngine: loadModel,
    availableModels,
  } = useSovereignAI();

  const isOffline = !navigator.onLine;
  const hasCachedModel = availableModels.some(m => m.tier === 'standard');

  if (!isOffline && !isReady && !isLoading && !hasCachedModel) return null;

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
                    Sovereign AI
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
                <p>🛡️ {activeModel?.name} running locally on your device.</p>
              ) : hasCachedModel ? (
                <p>You're offline. Click to load local AI model.</p>
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

        {isReady && !isLoading && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="gap-1 bg-green-500/20 text-green-400 border-green-500/30 cursor-help"
              >
                <Check className="h-3 w-3" />
                {activeModel?.name || 'Local AI'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>✅ {activeModel?.name} loaded locally. Works offline!</p>
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
            Load Sovereign AI
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};
