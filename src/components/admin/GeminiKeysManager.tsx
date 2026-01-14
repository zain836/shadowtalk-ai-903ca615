import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  TestTube,
  TrendingUp,
  Download,
  ChevronDown,
  ChevronUp,
  Mail,
  Settings,
  Ban,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

interface GeminiKey {
  id: string;
  key_string: string;
  is_exhausted: boolean;
  usage_count: number;
  exhaustion_count: number;
  last_exhausted_at: string | null;
  created_at: string;
  updated_at: string;
  auto_disabled?: boolean;
  disabled_reason?: string;
}

interface AnalyticsData {
  key_id: string;
  request_count: number;
  was_exhausted: boolean;
  created_at: string;
}

interface ChartData {
  date: string;
  requests: number;
  exhaustions: number;
}

interface PerKeyChartData {
  date: string;
  requests: number;
}

interface GeminiSettings {
  exhaustion_threshold: number;
  usage_alert_threshold: number;
  alerts_enabled: boolean;
  alert_email: string;
}

export const GeminiKeysManager = () => {
  const [keys, setKeys] = useState<GeminiKey[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [adding, setAdding] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<GeminiSettings>({
    exhaustion_threshold: 5,
    usage_alert_threshold: 100,
    alerts_enabled: false,
    alert_email: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchKeys();
    fetchAnalytics();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (analytics.length > 0) {
      processChartData();
    }
  }, [analytics]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gemini_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKeys(data || []);
    } catch (error) {
      console.error('Error fetching keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const { data, error } = await supabase
        .from('gemini_key_analytics')
        .select('key_id, request_count, was_exhausted, created_at')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('gemini_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      if (data) {
        const newSettings: GeminiSettings = {
          exhaustion_threshold: 5,
          usage_alert_threshold: 100,
          alerts_enabled: false,
          alert_email: ''
        };
        data.forEach((s: { setting_key: string; setting_value: string }) => {
          if (s.setting_key === 'exhaustion_threshold') newSettings.exhaustion_threshold = parseInt(s.setting_value) || 5;
          if (s.setting_key === 'usage_alert_threshold') newSettings.usage_alert_threshold = parseInt(s.setting_value) || 100;
          if (s.setting_key === 'alerts_enabled') newSettings.alerts_enabled = s.setting_value === 'true';
          if (s.setting_key === 'alert_email') newSettings.alert_email = s.setting_value;
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updates = [
        { setting_key: 'exhaustion_threshold', setting_value: settings.exhaustion_threshold.toString() },
        { setting_key: 'usage_alert_threshold', setting_value: settings.usage_alert_threshold.toString() },
        { setting_key: 'alerts_enabled', setting_value: settings.alerts_enabled.toString() },
        { setting_key: 'alert_email', setting_value: settings.alert_email }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('gemini_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);

        if (error) throw error;
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReEnableKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .update({ auto_disabled: false, disabled_reason: null, is_exhausted: false })
        .eq('id', keyId);

      if (error) throw error;

      setKeys(prev => prev.map(k => 
        k.id === keyId ? { ...k, auto_disabled: false, disabled_reason: undefined, is_exhausted: false } : k
      ));
      toast.success('Key re-enabled successfully');
    } catch (error) {
      console.error('Error re-enabling key:', error);
      toast.error('Failed to re-enable key');
    }
  };

  const processChartData = () => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const data = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayAnalytics = analytics.filter(a => {
        const date = new Date(a.created_at);
        return date >= dayStart && date < dayEnd;
      });

      return {
        date: format(day, 'MMM d'),
        requests: dayAnalytics.reduce((sum, a) => sum + a.request_count, 0),
        exhaustions: dayAnalytics.filter(a => a.was_exhausted).length
      };
    });

    setChartData(data);
  };

  const getPerKeyChartData = (keyId: string): PerKeyChartData[] => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const keyAnalytics = analytics.filter(a => {
        const date = new Date(a.created_at);
        return a.key_id === keyId && date >= dayStart && date < dayEnd;
      });

      return {
        date: format(day, 'MMM d'),
        requests: keyAnalytics.reduce((sum, a) => sum + a.request_count, 0)
      };
    });
  };

  const handleExportCSV = () => {
    const headers = ['Key ID', 'Key (Masked)', 'Status', 'Usage Count', 'Exhaustion Count', 'Last Exhausted', 'Created At'];
    const rows = keys.map(key => [
      key.id,
      maskKey(key.key_string),
      key.is_exhausted ? 'Exhausted' : 'Available',
      key.usage_count.toString(),
      key.exhaustion_count.toString(),
      key.last_exhausted_at ? format(new Date(key.last_exhausted_at), 'yyyy-MM-dd HH:mm:ss') : 'Never',
      format(new Date(key.created_at), 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gemini-keys-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  };

  const handleExportAnalyticsCSV = () => {
    const headers = ['Date', 'Key ID', 'Request Count', 'Was Exhausted'];
    const rows = analytics.map(a => [
      format(new Date(a.created_at), 'yyyy-MM-dd HH:mm:ss'),
      a.key_id,
      a.request_count.toString(),
      a.was_exhausted ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `gemini-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Analytics CSV exported successfully');
  };

  const toggleKeyExpanded = (keyId: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const handleTestKey = async () => {
    if (!newKey.trim()) {
      toast.error('Please enter an API key to test');
      return;
    }

    if (!newKey.startsWith('AIza')) {
      toast.error('Invalid Gemini API key format');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-gemini-key', {
        body: { apiKey: newKey.trim() }
      });

      if (error) throw error;

      if (data.success) {
        setTestResult({ success: true, message: data.message || 'Key is valid!' });
        toast.success('API key is valid and working!');
      } else {
        setTestResult({ success: false, message: data.error || 'Key validation failed' });
        toast.error(data.error || 'Invalid API key');
      }
    } catch (error) {
      console.error('Error testing key:', error);
      setTestResult({ success: false, message: 'Failed to test key' });
      toast.error('Failed to test API key');
    } finally {
      setTesting(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    if (!newKey.startsWith('AIza')) {
      toast.error('Invalid Gemini API key format');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .insert({ key_string: newKey.trim() });

      if (error) throw error;

      toast.success('API key added successfully');
      setNewKey('');
      setTestResult(null);
      fetchKeys();
    } catch (error: any) {
      console.error('Error adding key:', error);
      if (error.code === '23505') {
        toast.error('This API key already exists');
      } else {
        toast.error('Failed to add API key');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      setKeys(prev => prev.filter(k => k.id !== keyId));
      toast.success('API key deleted');
    } catch (error) {
      console.error('Error deleting key:', error);
      toast.error('Failed to delete API key');
    }
  };

  const handleResetKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .update({ is_exhausted: false })
        .eq('id', keyId);

      if (error) throw error;

      setKeys(prev => prev.map(k => 
        k.id === keyId ? { ...k, is_exhausted: false } : k
      ));
      toast.success('API key reset to available');
    } catch (error) {
      console.error('Error resetting key:', error);
      toast.error('Failed to reset API key');
    }
  };

  const handleResetAllKeys = async () => {
    if (!confirm('Reset all exhausted keys to available?')) return;

    try {
      const { error } = await supabase
        .from('gemini_api_keys')
        .update({ is_exhausted: false })
        .eq('is_exhausted', true);

      if (error) throw error;

      setKeys(prev => prev.map(k => ({ ...k, is_exhausted: false })));
      toast.success('All keys reset to available');
    } catch (error) {
      console.error('Error resetting keys:', error);
      toast.error('Failed to reset keys');
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  const totalUsage = keys.reduce((sum, k) => sum + k.usage_count, 0);
  const availableKeys = keys.filter(k => !k.is_exhausted && !k.auto_disabled).length;
  const exhaustedKeys = keys.filter(k => k.is_exhausted).length;
  const disabledKeys = keys.filter(k => k.auto_disabled).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{keys.length}</div>
            <p className="text-xs text-muted-foreground">Total Keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{availableKeys}</div>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-500">{exhaustedKeys}</div>
            <p className="text-xs text-muted-foreground">Exhausted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{disabledKeys}</div>
            <p className="text-xs text-muted-foreground">Auto-Disabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Auto-Rotation & Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto-Rotation Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Auto-Rotation
              </h4>
              <div className="space-y-2">
                <Label htmlFor="exhaustion-threshold">Exhaustion Threshold</Label>
                <Input
                  id="exhaustion-threshold"
                  type="number"
                  min={1}
                  max={20}
                  value={settings.exhaustion_threshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, exhaustion_threshold: parseInt(e.target.value) || 5 }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Keys will be auto-disabled after this many exhaustions
                </p>
              </div>
            </div>

            {/* Email Alert Settings */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Alerts
              </h4>
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts-enabled">Enable Email Alerts</Label>
                <Switch
                  id="alerts-enabled"
                  checked={settings.alerts_enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, alerts_enabled: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-email">Alert Email</Label>
                <Input
                  id="alert-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={settings.alert_email}
                  onChange={(e) => setSettings(prev => ({ ...prev, alert_email: e.target.value }))}
                  disabled={!settings.alerts_enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usage-threshold">Usage Alert Threshold</Label>
                <Input
                  id="usage-threshold"
                  type="number"
                  min={10}
                  value={settings.usage_alert_threshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, usage_alert_threshold: parseInt(e.target.value) || 100 }))}
                  disabled={!settings.alerts_enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Send alert when a key reaches this many requests
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={savingSettings}>
            {savingSettings ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Usage Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Request Trends (7 Days)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportAnalyticsCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="requests" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#requestGradient)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Exhaustion Events (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar 
                      dataKey="exhaustions" 
                      fill="hsl(var(--destructive))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Key Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Add New API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter Gemini API key (AIza...)"
              value={newKey}
              onChange={(e) => {
                setNewKey(e.target.value);
                setTestResult(null);
              }}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleTestKey} disabled={testing || !newKey.trim()}>
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Test
            </Button>
            <Button onClick={handleAddKey} disabled={adding || !newKey.trim()}>
              {adding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
          
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.success ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Keys List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Keys ({keys.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={keys.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            {exhaustedKeys > 0 && (
              <Button variant="outline" size="sm" onClick={handleResetAllKeys}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No API keys configured</p>
              <p className="text-sm">Add your first Gemini API key above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map(key => {
                const isExpanded = expandedKeys.has(key.id);
                const perKeyData = isExpanded ? getPerKeyChartData(key.id) : [];
                
                return (
                  <Collapsible key={key.id} open={isExpanded} onOpenChange={() => toggleKeyExpanded(key.id)}>
                    <div className="rounded-lg border border-border bg-card/50 hover:bg-card transition-colors overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              key.auto_disabled ? 'bg-destructive/20' : 
                              key.is_exhausted ? 'bg-yellow-500/20' : 'bg-green-500/20'
                            }`}>
                              {key.auto_disabled ? (
                                <Ban className="h-4 w-4 text-destructive" />
                              ) : key.is_exhausted ? (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div>
                              <code className="text-sm font-mono">{maskKey(key.key_string)}</code>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant={key.auto_disabled ? 'destructive' : key.is_exhausted ? 'outline' : 'secondary'}>
                                  {key.auto_disabled ? 'Auto-Disabled' : key.is_exhausted ? 'Exhausted' : 'Available'}
                                </Badge>
                                {key.disabled_reason && (
                                  <span className="text-xs text-destructive">{key.disabled_reason}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  Added {format(new Date(key.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right text-sm">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                                <span>{key.usage_count} uses</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {key.exhaustion_count} exhaustions
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" title="View analytics">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </CollapsibleTrigger>
                              {key.auto_disabled ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReEnableKey(key.id)}
                                  title="Re-enable key"
                                  className="text-green-500 hover:text-green-500 hover:bg-green-500/10"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              ) : key.is_exhausted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResetKey(key.id)}
                                  title="Reset to available"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteKey(key.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {key.last_exhausted_at && (
                          <p className="text-xs text-muted-foreground mt-2 pl-11">
                            Last exhausted: {format(new Date(key.last_exhausted_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                      
                      <CollapsibleContent>
                        <div className="border-t border-border p-4 bg-muted/30">
                          <p className="text-sm font-medium mb-3">Usage Over 7 Days</p>
                          <div className="h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={perKeyData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'hsl(var(--card))', 
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                  }} 
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="requests" 
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={2}
                                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
