import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
 import { Cpu, Download, WifiOff, Zap, AlertCircle, Check, Shield } from 'lucide-react';
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
     hasWebGPU,
     hasCachedModel,
     loadModel,
   } = useRobustOfflineAI();
 
   const isOffline = !navigator.onLine;
 
   // Don't show anything if online, no cached model, and not loading
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
               <p>🛡️ {activeModel} running locally. 100% private.</p>
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
