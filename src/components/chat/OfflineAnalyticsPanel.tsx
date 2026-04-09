import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, Cloud, CloudOff, RefreshCw, Trash2,
  Activity, Clock, Layers
} from 'lucide-react';
import { useOfflineAnalytics } from '@/hooks/useOfflineAnalytics';

const OfflineAnalyticsPanel = () => {
  const {
    summary, syncing,
    loadSummary, syncToCloud, clearSyncedEvents, clearAll,
  } = useOfflineAnalytics();

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadSummary();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadSummary]);

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Offline Analytics
          <Badge variant={isOnline ? 'default' : 'secondary'} className="ml-auto text-xs">
            {isOnline ? <><Cloud className="h-3 w-3 mr-1" /> Online</> : <><CloudOff className="h-3 w-3 mr-1" /> Offline</>}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary ? (
          <div className="text-center py-4">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-md bg-muted/30">
                <p className="text-lg font-bold">{summary.totalEvents}</p>
                <p className="text-[10px] text-muted-foreground">Total Events</p>
              </div>
              <div className="text-center p-2 rounded-md bg-muted/30">
                <p className="text-lg font-bold">{summary.sessionsCount}</p>
                <p className="text-[10px] text-muted-foreground">Sessions</p>
              </div>
              <div className="text-center p-2 rounded-md bg-muted/30">
                <p className="text-lg font-bold">{formatDuration(summary.avgSessionDuration)}</p>
                <p className="text-[10px] text-muted-foreground">Avg Duration</p>
              </div>
            </div>

            {/* Sync status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending sync</span>
                <span className="font-medium">{summary.pendingSync} events</span>
              </div>
              <Progress
                value={summary.totalEvents > 0 ? ((summary.totalEvents - summary.pendingSync) / summary.totalEvents) * 100 : 100}
                className="h-2"
              />
              {summary.lastSyncAt && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last synced: {new Date(summary.lastSyncAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Event breakdown */}
            {summary.eventsByType.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Event Breakdown
                </p>
                {summary.eventsByType.slice(0, 6).map(({ type, count }) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-xs capitalize flex-1 truncate">
                      {type.replace(/_/g, ' ')}
                    </span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${(count / summary.totalEvents) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Top features */}
            {summary.topFeatures.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Top Features</p>
                <div className="flex flex-wrap gap-1">
                  {summary.topFeatures.map(({ feature, count }) => (
                    <Badge key={feature} variant="outline" className="text-[10px]">
                      {feature} ({count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={syncToCloud}
                disabled={syncing || !isOnline || summary.pendingSync === 0}
                className="text-xs flex-1"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : `Sync ${summary.pendingSync} Events`}
              </Button>
              <Button size="sm" variant="outline" onClick={clearSyncedEvents} className="text-xs">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineAnalyticsPanel;
