import React from 'react';
import { WifiOff, CloudOff, Database } from 'lucide-react';
import { useOfflineMode } from '@/hooks/useOfflineMode';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const OfflineModeIndicator: React.FC = () => {
  const { isOffline, isOfflineModeAvailable, cachedConversations, offlineMessagesQueue } = useOfflineMode();

  if (!isOfflineModeAvailable) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isOffline 
              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
              : 'bg-green-500/20 text-green-500 border border-green-500/30'
          }`}>
            {isOffline ? (
              <>
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <Database className="h-3 w-3" />
                <span>Online</span>
              </>
            )}
            {cachedConversations.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {cachedConversations.length} cached
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              {isOffline ? 'Offline Mode Active' : 'Online - Caching Enabled'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isOffline 
                ? 'Limited AI responses available. Messages will sync when online.'
                : 'Conversations are being cached for offline access.'}
            </p>
            <div className="flex items-center gap-2 text-xs mt-2">
              <CloudOff className="h-3 w-3" />
              <span>{cachedConversations.length} conversations cached</span>
            </div>
            {offlineMessagesQueue.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-500">
                <span>{offlineMessagesQueue.length} messages pending sync</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
