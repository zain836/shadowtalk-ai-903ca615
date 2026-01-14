import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, Download, WifiOff, Zap, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OfflineAIIndicatorProps {
  isOffline: boolean;
  isModelLoaded: boolean;
  isLoading: boolean;
  loadProgress: number;
  loadStage: string;
  isSupported: boolean;
  error: string | null;
  onLoadModel: () => void;
}

export const OfflineAIIndicator: React.FC<OfflineAIIndicatorProps> = ({
  isOffline,
  isModelLoaded,
  isLoading,
  loadProgress,
  loadStage,
  isSupported,
  error,
  onLoadModel,
}) => {
  if (!isOffline && !isModelLoaded) return null;

  return (
    <div className="flex items-center gap-2">
      {isOffline && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className="gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 cursor-help"
            >
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>You're offline. Using local AI model.</p>
          </TooltipContent>
        </Tooltip>
      )}

      {error && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="destructive" 
              className="gap-1 cursor-help"
            >
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

      {isModelLoaded && !isLoading && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className="gap-1 bg-green-500/20 text-green-400 border-green-500/30 cursor-help"
            >
              <Zap className="h-3 w-3" />
              Local AI Ready
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI model loaded in browser. Works offline!</p>
          </TooltipContent>
        </Tooltip>
      )}

      {isOffline && !isModelLoaded && !isLoading && isSupported && !error && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadModel}
          className="gap-1 h-7 text-xs"
        >
          <Cpu className="h-3 w-3" />
          Load Offline AI
        </Button>
      )}
    </div>
  );
};
