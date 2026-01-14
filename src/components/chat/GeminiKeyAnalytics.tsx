import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Key, TrendingUp, AlertTriangle, Clock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface KeyStats {
  id: string;
  key_string: string;
  usage_count: number;
  exhaustion_count: number;
  is_exhausted: boolean;
  last_exhausted_at: string | null;
}

interface AnalyticsSummary {
  totalRequests: number;
  totalExhaustions: number;
  avgResponseTime: number;
  activeKeys: number;
  exhaustedKeys: number;
}

interface GeminiKeyAnalyticsProps {
  onClose: () => void;
}

export const GeminiKeyAnalytics = ({ onClose }: GeminiKeyAnalyticsProps) => {
  const [keys, setKeys] = useState<KeyStats[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch all keys with their stats
      const { data: keysData, error: keysError } = await supabase
        .from('gemini_api_keys')
        .select('id, key_string, usage_count, exhaustion_count, is_exhausted, last_exhausted_at')
        .order('usage_count', { ascending: false });

      if (keysError) throw keysError;

      // Fetch analytics summary
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('gemini_key_analytics')
        .select('response_time_ms, was_exhausted');

      if (analyticsError) throw analyticsError;

      const totalRequests = analyticsData?.length || 0;
      const totalExhaustions = analyticsData?.filter(a => a.was_exhausted).length || 0;
      const avgResponseTime = totalRequests > 0 
        ? Math.round(analyticsData!.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / totalRequests)
        : 0;

      const activeKeys = keysData?.filter(k => !k.is_exhausted).length || 0;
      const exhaustedKeys = keysData?.filter(k => k.is_exhausted).length || 0;

      setKeys(keysData || []);
      setSummary({
        totalRequests,
        totalExhaustions,
        avgResponseTime,
        activeKeys,
        exhaustedKeys
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '****';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Gemini Load Balancer Analytics</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-48 rounded-lg" />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Total Requests</span>
                    </div>
                    <div className="text-2xl font-bold">{summary?.totalRequests.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">Exhaustions</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-500">{summary?.totalExhaustions}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Avg Response</span>
                    </div>
                    <div className="text-2xl font-bold">{summary?.avgResponseTime}ms</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Key className="h-4 w-4" />
                      <span className="text-xs">Active Keys</span>
                    </div>
                    <div className="text-2xl font-bold">
                      <span className="text-green-500">{summary?.activeKeys}</span>
                      <span className="text-muted-foreground text-sm"> / {(summary?.activeKeys || 0) + (summary?.exhaustedKeys || 0)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Keys List */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Key Usage
                </h3>
                <div className="space-y-2">
                  {keys.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No API keys configured. Add keys to the gemini_api_keys table.
                    </div>
                  ) : (
                    keys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${key.is_exhausted ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                            <Key className={`h-4 w-4 ${key.is_exhausted ? 'text-destructive' : 'text-green-500'}`} />
                          </div>
                          <div>
                            <code className="text-sm font-mono">{maskKey(key.key_string)}</code>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant={key.is_exhausted ? "destructive" : "secondary"} className="text-xs">
                                {key.is_exhausted ? 'Exhausted' : 'Active'}
                              </Badge>
                              {key.last_exhausted_at && (
                                <span className="text-xs text-muted-foreground">
                                  Last exhausted: {new Date(key.last_exhausted_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{key.usage_count}</div>
                          <div className="text-xs text-muted-foreground">
                            {key.exhaustion_count} exhaustions
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
