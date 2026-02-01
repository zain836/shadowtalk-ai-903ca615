import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  Lock, 
  Database,
  Loader2,
  Cpu
} from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { useSovereignAI } from '@/hooks/useSovereignAI';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface OfflineModeIndicatorProps {
  compact?: boolean;
}

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({ compact = true }) => {
  const { isOffline, isOfflineModeAvailable, cachedConversations, offlineMessagesQueue } = useOfflineMode();
  const { mode, activeModel, isLoading, loadProgress, encryptionEnabled, isReady } = useSovereignAI();

  if (!isOfflineModeAvailable && !isOffline && mode === 'online') return null;

  // Determine display mode
  const isStealthMode = mode === 'stealth' || isOffline;
  const isHybridMode = mode === 'hybrid' && !isOffline;

  const getIndicatorStyle = () => {
    if (isStealthMode) {
      return {
        bgColor: 'bg-emerald-500/15 border-emerald-500/40',
        textColor: 'text-emerald-500',
        icon: isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />,
        label: 'Stealth Vault',
        sublabel: activeModel ? activeModel.name : 'Offline Mode',
      };
    }
    if (isHybridMode && isReady) {
      return {
        bgColor: 'bg-blue-500/15 border-blue-500/40',
        textColor: 'text-blue-500',
        icon: <Cpu className="h-3.5 w-3.5" />,
        label: 'Hybrid',
        sublabel: 'Local + Cloud',
      };
    }
    return {
      bgColor: 'bg-primary/15 border-primary/40',
      textColor: 'text-primary',
      icon: <Database className="h-3.5 w-3.5" />,
      label: 'Online',
      sublabel: 'Cloud AI',
    };
  };

  const style = getIndicatorStyle();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-help",
            style.bgColor,
            style.textColor
          )}>
            {style.icon}
            <span className="hidden sm:inline">{style.label}</span>
            {encryptionEnabled && isStealthMode && (
              <Lock className="h-3 w-3" />
            )}
            {isLoading && (
              <span className="text-[10px] opacity-70">{loadProgress}%</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {style.icon}
              <span className="font-semibold">{style.label}</span>
              {encryptionEnabled && (
                <Badge variant="outline" className="text-[9px] h-4 gap-0.5 border-emerald-500/30 text-emerald-500">
                  <Lock className="h-2 w-2" />
                  E2E
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {isStealthMode ? (
                <>
                  <strong>Zero-Server Mode:</strong> All AI processing happens locally. 
                  Your data never leaves your device.
                </>
              ) : isHybridMode && isReady ? (
                <>
                  <strong>Hybrid Mode:</strong> Local AI ready as backup. 
                  Using cloud for best performance.
                </>
              ) : (
                <>
                  Connected to cloud AI services. 
                  Enable offline mode for private processing.
                </>
              )}
            </p>

            {activeModel && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs">
                  <Cpu className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{activeModel.name}</span>
                </div>
              </div>
            )}

            {cachedConversations.length > 0 && (
              <div className="flex items-center gap-2 text-xs pt-1">
                <Database className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{cachedConversations.length} conversations cached</span>
              </div>
            )}

            {offlineMessagesQueue.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-500">
                <WifiOff className="h-3 w-3" />
                <span>{offlineMessagesQueue.length} messages pending sync</span>
              </div>
            )}

            {isLoading && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Loading model...</span>
                  <span className="font-medium">{loadProgress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
