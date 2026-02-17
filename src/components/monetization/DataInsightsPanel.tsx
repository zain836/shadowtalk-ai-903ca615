import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useServerSyncQueue } from '@/hooks/useServerSyncQueue';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Upload, Shield, Database, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsItem {
  id: string;
  action_type: string;
  feature_used: string | null;
  query_category: string | null;
  tokens_used: number | null;
  created_at: string;
}

const DataInsightsPanel = () => {
  const { user } = useAuth();
  const syncQueue = useServerSyncQueue();
  const [pendingCount, setPendingCount] = useState(0);
  const [recentAnalytics, setRecentAnalytics] = useState<AnalyticsItem[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [count, { data }] = await Promise.all([
        syncQueue.getPendingCount(),
        supabase
          .from('usage_analytics')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);
      setPendingCount(count);
      setRecentAnalytics(data || []);
    } catch (e) {
      console.error('Failed to load insights data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user, syncQueue]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleProcessQueue = async () => {
    const processed = await syncQueue.processQueue();
    toast.success(`Processed ${processed} queued operations`);
    loadData();
  };

  // Aggregate stats from analytics
  const featureUsage = recentAnalytics.reduce<Record<string, number>>((acc, item) => {
    const key = item.feature_used || item.action_type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const categoryBreakdown = recentAnalytics.reduce<Record<string, number>>((acc, item) => {
    const key = item.query_category || 'general';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const totalTokens = recentAnalytics.reduce((sum, item) => sum + (item.tokens_used || 0), 0);

  return (
    <div className="space-y-6">
      {/* Data Consent Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Anonymized Data Insights</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When enabled, aggregated and fully anonymized usage data helps improve the platform. 
                  Data is stripped of all personal identifiers before processing. Fully GDPR/CCPA compliant.
                </p>
              </div>
            </div>
            <Switch checked={consentGiven} onCheckedChange={setConsentGiven} />
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-6 w-6 mx-auto text-primary opacity-60" />
            <p className="text-2xl font-bold text-foreground mt-2">{recentAnalytics.length}</p>
            <p className="text-xs text-muted-foreground">Recent Events</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <Database className="h-6 w-6 mx-auto text-muted-foreground opacity-60" />
            <p className="text-2xl font-bold text-foreground mt-2">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending Sync</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-muted-foreground opacity-60" />
            <p className="text-2xl font-bold text-foreground mt-2">{Object.keys(featureUsage).length}</p>
            <p className="text-xs text-muted-foreground">Features Used</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center">
            <Clock className="h-6 w-6 mx-auto text-muted-foreground opacity-60" />
            <p className="text-2xl font-bold text-foreground mt-2">{totalTokens.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Tokens Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Offline Analytics Queue</CardTitle>
              <CardDescription>Queued behavior data waiting for batch upload</CardDescription>
            </div>
            <Button onClick={handleProcessQueue} disabled={pendingCount === 0} size="sm">
              <Upload className="h-4 w-4 mr-2" /> Process Queue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="font-medium text-foreground">{pendingCount} operations pending</p>
              <p className="text-xs text-muted-foreground">Will sync automatically when online</p>
            </div>
            <Button onClick={loadData} variant="ghost" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Usage Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(featureUsage).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No usage data</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(featureUsage)
                  .sort(([, a], [, b]) => b - a)
                  .map(([feature, count]) => (
                    <div key={feature} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="text-sm capitalize text-foreground">{feature.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Query Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryBreakdown).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No category data</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="text-sm capitalize text-foreground">{category.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataInsightsPanel;
