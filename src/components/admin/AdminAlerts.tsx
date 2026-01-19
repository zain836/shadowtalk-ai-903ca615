import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AdminAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  metadata: any;
  is_read: boolean;
  is_dismissed: boolean;
  triggered_at: string;
}

export const AdminAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAlerts, setCheckingAlerts] = useState(false);

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to real-time alerts
    const channel = supabase
      .channel('admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_alerts' },
        (payload) => {
          setAlerts(prev => [payload.new as AdminAlert, ...prev]);
          toast.warning(`New Alert: ${(payload.new as AdminAlert).title}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_alerts')
        .select('*')
        .eq('is_dismissed', false)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForAlerts = async () => {
    setCheckingAlerts(true);
    try {
      // Check for traffic anomalies
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Get recent usage analytics
      const { data: recentData } = await supabase
        .from('usage_analytics')
        .select('id, created_at')
        .gte('created_at', oneHourAgo.toISOString());

      const { data: previousData } = await supabase
        .from('usage_analytics')
        .select('id, created_at')
        .gte('created_at', twoHoursAgo.toISOString())
        .lt('created_at', oneHourAgo.toISOString());

      const recentCount = recentData?.length || 0;
      const previousCount = previousData?.length || 0;

      // Check for traffic spike (>200% increase)
      if (previousCount > 0 && recentCount > previousCount * 3) {
        await createAlert({
          alert_type: 'traffic_spike',
          severity: 'warning',
          title: 'Traffic Spike Detected',
          message: `Traffic increased by ${Math.round((recentCount / previousCount - 1) * 100)}% in the last hour`,
          metadata: { recentCount, previousCount },
        });
      }

      // Check for traffic drop (>50% decrease)
      if (previousCount > 10 && recentCount < previousCount * 0.5) {
        await createAlert({
          alert_type: 'traffic_drop',
          severity: 'warning',
          title: 'Traffic Drop Detected',
          message: `Traffic decreased by ${Math.round((1 - recentCount / previousCount) * 100)}% in the last hour`,
          metadata: { recentCount, previousCount },
        });
      }

      // Check for high error rate
      const { data: errorData } = await supabase
        .from('feedback')
        .select('id')
        .eq('category', 'bug')
        .gte('created_at', oneHourAgo.toISOString());

      if ((errorData?.length || 0) >= 5) {
        await createAlert({
          alert_type: 'high_error_rate',
          severity: 'error',
          title: 'High Bug Reports',
          message: `${errorData?.length} bug reports received in the last hour`,
          metadata: { errorCount: errorData?.length },
        });
      }

      toast.success('Alert check completed');
      fetchAlerts();
    } catch (error) {
      console.error('Error checking alerts:', error);
      toast.error('Failed to check for alerts');
    } finally {
      setCheckingAlerts(false);
    }
  };

  const createAlert = async (alertData: Omit<AdminAlert, 'id' | 'is_read' | 'is_dismissed' | 'triggered_at'>) => {
    try {
      await supabase.from('admin_alerts').insert(alertData);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await supabase
        .from('admin_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);

      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await supabase
        .from('admin_alerts')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', alertId);

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success('Alert dismissed');
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'traffic_spike':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'traffic_drop':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread Alerts</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <Bell className={`h-8 w-8 ${unreadCount > 0 ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-destructive">
                  {alerts.filter(a => a.severity === 'error').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {alerts.filter(a => a.severity === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Activity Alerts
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkForAlerts}
              disabled={checkingAlerts}
            >
              <Settings className={`h-4 w-4 mr-2 ${checkingAlerts ? 'animate-spin' : ''}`} />
              Check Now
            </Button>
            <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    !alert.is_read
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card/50'
                  }`}
                  onClick={() => !alert.is_read && markAsRead(alert.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getAlertTypeIcon(alert.alert_type)}
                          <h4 className="font-medium">{alert.title}</h4>
                          {!alert.is_read && (
                            <Badge variant="outline" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(alert.severity)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(alert.triggered_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(alert.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No alerts to display</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Check Now" to scan for activity anomalies
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
