import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Calendar,
  Link2,
  Unlink,
  Loader2,
  RefreshCw,
  Clock,
  Inbox,
  AlertCircle,
  CheckCircle2,
  Zap,
  Database,
  Shield,
  WifiOff,
  Crown,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { logClientError } from '@/lib/logging';
import { useFeatureGating } from '@/hooks/useFeatureGating';

interface IntegrationSource {
  id: string;
  name: string;
  type: 'email' | 'calendar';
  icon: React.ReactNode;
  connected: boolean;
  lastSync?: string;
  itemCount?: number;
  provider: 'google' | 'microsoft';
  status: 'idle' | 'syncing' | 'error';
  syncProgress?: number;
}

interface SyncedItem {
  id: string;
  title: string;
  source: string;
  type: 'email' | 'event';
  date: string;
  priority: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

interface EmailCalendarIntegrationProps {
  onImportTasks: (source: string, items: string[]) => void;
}

const EmailCalendarIntegration: React.FC<EmailCalendarIntegrationProps> = ({ onImportTasks }) => {
  const { user } = useAuth();
  const { checkAccess, isElite } = useFeatureGating();
  const [integrations, setIntegrations] = useState<IntegrationSource[]>([
    { id: 'gmail', name: 'Gmail', type: 'email', icon: <Mail className="h-4 w-4" />, connected: false, provider: 'google', status: 'idle' },
    { id: 'outlook', name: 'Outlook', type: 'email', icon: <Mail className="h-4 w-4" />, connected: false, provider: 'microsoft', status: 'idle' },
    { id: 'gcal', name: 'Google Calendar', type: 'calendar', icon: <Calendar className="h-4 w-4" />, connected: false, provider: 'google', status: 'idle' },
    { id: 'outlook-cal', name: 'Outlook Calendar', type: 'calendar', icon: <Calendar className="h-4 w-4" />, connected: false, provider: 'microsoft', status: 'idle' },
  ]);
  
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState('15');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  const [syncedItems, setSyncedItems] = useState<SyncedItem[]>([]);
  const [totalSynced, setTotalSynced] = useState({ emails: 0, events: 0 });
  const [lastFullSync, setLastFullSync] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for existing OAuth tokens on mount
  useEffect(() => {
    if (user) {
      checkExistingConnections();
    }
  }, [user]);

  // Auto-sync interval
  useEffect(() => {
    if (autoSync && integrations.some(i => i.connected)) {
      const interval = setInterval(() => {
        handleSync();
      }, parseInt(syncInterval) * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoSync, syncInterval, integrations]);

  const checkExistingConnections = async () => {
    if (!user) return;
    setConnectionStatus('checking');
    
    try {
      const { data: tokens, error } = await supabase
        .from('oauth_tokens')
        .select('provider, scope, expires_at, updated_at')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (tokens && tokens.length > 0) {
        setIntegrations(prev => prev.map(int => {
          const matchingToken = tokens.find(t => {
            if (int.provider === 'google' && t.provider === 'google') {
              if (int.type === 'email' && t.scope?.includes('gmail')) return true;
              if (int.type === 'calendar' && t.scope?.includes('calendar')) return true;
            }
            if (int.provider === 'microsoft' && (t.provider === 'azure' || t.provider === 'microsoft')) {
              if (int.type === 'email' && t.scope?.includes('mail')) return true;
              if (int.type === 'calendar' && t.scope?.includes('calendars')) return true;
            }
            return false;
          });
          
          if (matchingToken) {
            const isExpired = matchingToken.expires_at && new Date(matchingToken.expires_at) < new Date();
            return {
              ...int,
              connected: !isExpired,
              lastSync: matchingToken.updated_at ? new Date(matchingToken.updated_at).toLocaleTimeString() : 'Connected',
              status: 'idle' as const,
            };
          }
          return int;
        }));
      }
      setConnectionStatus('idle');
    } catch (error) {
      logClientError(error, {
        feature: 'integrations',
        action: 'checkExistingConnections',
        userId: user?.id,
        severity: 'warning',
      });
      setConnectionStatus('error');
    }
  };

  const handleConnect = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration || !user) return;

    // Feature gating check
    if (!checkAccess('cognitive_filter')) {
      return;
    }

    // Offline check
    if (isOffline) {
      toast.error('You need an internet connection to connect integrations.');
      return;
    }
    
    setIsConnecting(integrationId);
    setError(null);
    
    try {
      // For Google integrations, use our custom OAuth edge function
      if (integration.provider === 'google') {
        const scope = integration.type === 'email' ? 'gmail' : 
                      integration.type === 'calendar' ? 'calendar' : 'both';
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast.error('Please sign in to connect integrations.');
          return;
        }

        // Call our OAuth initiate edge function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-initiate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ provider: 'google', scope }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          // If OAuth not configured, fall back to demo mode
          if (result.error === 'OAuth not configured') {
            toast.info('Google OAuth not configured. Using demo mode with realistic data.');
            await simulateConnection(integrationId);
            return;
          }
          throw new Error(result.error || 'Failed to initiate OAuth');
        }

        // Redirect to Google OAuth
        if (result.authUrl) {
          toast.info('Redirecting to Google for authorization...');
          window.location.href = result.authUrl;
          return;
        }
      }
      
      // For Microsoft integrations, use Supabase OAuth directly
      if (integration.provider === 'microsoft') {
        const scopes = integration.type === 'email' 
          ? 'Mail.Read Mail.ReadBasic'
          : 'Calendars.Read Calendars.ReadBasic';
          
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            scopes,
            redirectTo: window.location.href,
          }
        });
        
        if (error) throw error;
        
        toast.info('Redirecting to Microsoft for authorization...');
        return;
      }
      
      // Fallback simulation for demo purposes if OAuth not configured
      await simulateConnection(integrationId);
      
    } catch (err: any) {
      logClientError(err, {
        feature: 'integrations',
        action: 'oauth-connect',
        userId: user?.id,
        severity: 'error',
      });
      
      // If OAuth fails (provider not configured), fall back to demo mode
      if (err.message?.includes('not enabled') || err.message?.includes('not configured')) {
        toast.info('OAuth not configured. Using demo mode with realistic data.');
        await simulateConnection(integrationId);
      } else {
        setError(`Connection failed: ${err.message}`);
        toast.error('Connection failed: ' + err.message);
        setIntegrations(prev => prev.map(int => 
          int.id === integrationId ? { ...int, status: 'error' } : int
        ));
      }
    } finally {
      setIsConnecting(null);
    }
  };
  
  const simulateConnection = async (integrationId: string) => {
    // Simulate OAuth flow with progress
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId ? { ...int, status: 'syncing', syncProgress: 0 } : int
    ));

    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId ? { ...int, syncProgress: i } : int
      ));
    }
    
    const itemCount = integrations.find(i => i.id === integrationId)?.type === 'email' 
      ? Math.floor(Math.random() * 50) + 20 
      : Math.floor(Math.random() * 20) + 5;

    setIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { 
            ...int, 
            connected: true, 
            lastSync: new Date().toLocaleTimeString(),
            itemCount,
            status: 'idle',
            syncProgress: undefined
          }
        : int
    ));
    
    toast.success(`Connected to ${integrations.find(i => i.id === integrationId)?.name}! Found ${itemCount} items.`);
  };

  const handleDisconnect = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration || !user) return;
    
    try {
      // Remove OAuth token from database
      await supabase
        .from('oauth_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', integration.provider === 'microsoft' ? 'azure' : integration.provider);
      
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, connected: false, lastSync: undefined, itemCount: undefined, status: 'idle' }
          : int
      ));
      
      // Remove synced items from this source
      setSyncedItems(prev => prev.filter(item => !item.source.toLowerCase().includes(integration.name.toLowerCase())));
      
      toast.info(`Disconnected from ${integration.name}. All synced data has been removed.`);
    } catch (error) {
      logClientError(error, {
        feature: 'integrations',
        action: 'disconnect',
        userId: user?.id,
        severity: 'warning',
      });
      // Still update UI even if database delete fails
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, connected: false, lastSync: undefined, itemCount: undefined, status: 'idle' }
          : int
      ));
    }
  };

  const handleSync = async () => {
    // Feature gating check
    if (!checkAccess('cognitive_filter')) {
      return;
    }

    // Offline check
    if (isOffline) {
      toast.error('You need an internet connection to sync data.');
      return;
    }

    const connectedIntegrations = integrations.filter(i => i.connected);
    if (connectedIntegrations.length === 0) {
      toast.error('No integrations connected');
      return;
    }

    setIsSyncing(true);
    setError(null);

    // Update all connected integrations to syncing state
    setIntegrations(prev => prev.map(int =>
      int.connected ? { ...int, status: 'syncing', syncProgress: 0 } : int
    ));

    try {
      const allTasks: string[] = [];
      const newSyncedItems: SyncedItem[] = [];

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error('You must be signed in to sync data');
        return;
      }

      for (const integration of connectedIntegrations) {
        try {
          // Progress animation while request is in-flight
          for (let progress = 0; progress <= 75; progress += 25) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setIntegrations(prev => prev.map(int =>
              int.id === integration.id ? { ...int, syncProgress: progress } : int
            ));
          }

          const isEmail = integration.type === 'email';
          let endpoint: string | null = null;

          if (integration.provider === 'google') {
            endpoint = isEmail ? 'email-sync' : 'calendar-sync';
          }

          if (!endpoint) {
            // For non-supported providers, skip gracefully for now
            setIntegrations(prev => prev.map(int =>
              int.id === integration.id ? { ...int, status: 'idle', syncProgress: undefined } : int
            ));
            continue;
          }

          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            console.error(`[Sync] ${endpoint} failed`, err);
            toast.error(`Failed to sync ${integration.name}: ${err?.error || resp.statusText}`);
            setIntegrations(prev => prev.map(int =>
              int.id === integration.id ? { ...int, status: 'error', syncProgress: undefined } : int
            ));
            continue;
          }

          const data = await resp.json() as { items?: SyncedItem[] };
          const items = (data.items || []).map((item, idx) => ({
            ...item,
            id: item.id || `${integration.id}-${Date.now()}-${idx}`,
            source: integration.name,
          }));

          items.forEach((item) => {
            allTasks.push(item.title);
            newSyncedItems.push(item);
          });

          setIntegrations(prev => prev.map(int =>
            int.id === integration.id
              ? {
                  ...int,
                  lastSync: new Date().toLocaleTimeString(),
                  itemCount: items.length,
                  status: 'idle',
                  syncProgress: 100,
                }
              : int
          ));
        } catch (err) {
          logClientError(err, {
            feature: 'integrations',
            action: 'sync-integration',
            userId: user?.id,
            severity: 'warning',
            extra: { integrationId: integration.id },
          });
          setIntegrations(prev => prev.map(int =>
            int.id === integration.id ? { ...int, status: 'error', syncProgress: undefined } : int
          ));
        }
      }

      // Update synced items state
      setSyncedItems(prev => [...newSyncedItems, ...prev].slice(0, 100));

      // Update totals
      const emails = newSyncedItems.filter(i => i.type === 'email').length;
      const events = newSyncedItems.filter(i => i.type === 'event').length;
      setTotalSynced(prev => ({
        emails: prev.emails + emails,
        events: prev.events + events,
      }));
      setLastFullSync(new Date().toLocaleString());

      // Import tasks to cognitive filter
      if (allTasks.length > 0) {
        const emailTasks = newSyncedItems.filter(i => i.type === 'email').map(i => i.title);
        const calendarTasks = newSyncedItems.filter(i => i.type === 'event').map(i => i.title);

        if (emailTasks.length > 0) onImportTasks('Email', emailTasks);
        if (calendarTasks.length > 0) onImportTasks('Calendar', calendarTasks);
      }

      toast.success(`Synced ${connectedIntegrations.length} integration(s) - ${newSyncedItems.length} items imported for cognitive analysis`);
    } catch (error) {
      logClientError(error, {
        feature: 'integrations',
        action: 'sync-all',
        userId: user?.id,
        severity: 'error',
      });
      toast.error('Failed to sync integrations');

      // Reset status on error
      setIntegrations(prev => prev.map(int =>
        int.connected ? { ...int, status: 'error', syncProgress: undefined } : int
      ));
    } finally {
      setIsSyncing(false);
    }
  };

  const connectedCount = integrations.filter(i => i.connected).length;
  const totalItems = integrations.reduce((sum, i) => sum + (i.itemCount || 0), 0);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              Real-Time Data Sync
            </CardTitle>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Crown className="h-3 w-3" />
              ELITE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isOffline && (
              <Badge variant="destructive" className="gap-1 text-[10px]">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {connectionStatus === 'checking' && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
            <Badge variant="outline" className="text-xs gap-1">
              <Database className="h-3 w-3" />
              {connectedCount} connected
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Offline Alert */}
        {isOffline && (
          <Alert variant="destructive" className="py-2">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="text-xs">
              You're offline. Syncing is paused until you reconnect.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Sync Stats Banner */}
        {connectedCount > 0 && (
          <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <div className="text-center">
              <Mail className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-sm font-bold">{totalSynced.emails}</p>
              <p className="text-[10px] text-muted-foreground">Emails</p>
            </div>
            <div className="text-center">
              <Calendar className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-sm font-bold">{totalSynced.events}</p>
              <p className="text-[10px] text-muted-foreground">Events</p>
            </div>
            <div className="text-center">
              <Zap className="h-4 w-4 mx-auto text-warning mb-1" />
              <p className="text-sm font-bold">{totalItems}</p>
              <p className="text-[10px] text-muted-foreground">Active Items</p>
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
          <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Connect your real accounts to sync emails and calendar events. Your data is encrypted and only used for cognitive load analysis.
          </p>
        </div>

        {/* Integration List */}
        <div className="space-y-2">
          {integrations.map(integration => (
            <div 
              key={integration.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                integration.connected 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/30 hover:bg-muted/50'
              } ${integration.status === 'error' ? 'border-destructive/50' : ''}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`${
                  integration.connected ? 'text-primary' : 
                  integration.status === 'error' ? 'text-destructive' : 
                  'text-muted-foreground'
                }`}>
                  {integration.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{integration.name}</p>
                    {integration.connected && integration.status === 'idle' && (
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    )}
                    {integration.status === 'syncing' && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                    )}
                  </div>
                  {integration.connected && integration.lastSync && integration.status === 'idle' && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {integration.lastSync}
                      {integration.itemCount && (
                        <span className="ml-2">• {integration.itemCount} items</span>
                      )}
                    </p>
                  )}
                  {integration.status === 'syncing' && integration.syncProgress !== undefined && (
                    <Progress value={integration.syncProgress} className="h-1 mt-1" />
                  )}
                </div>
              </div>
              
              <Button
                variant={integration.connected ? "ghost" : "outline"}
                size="sm"
                onClick={() => integration.connected 
                  ? handleDisconnect(integration.id) 
                  : handleConnect(integration.id)
                }
                disabled={isConnecting === integration.id || integration.status === 'syncing'}
                className={integration.connected ? 'text-destructive hover:text-destructive' : ''}
              >
                {isConnecting === integration.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : integration.connected ? (
                  <>
                    <Unlink className="h-3 w-3 mr-1" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Link2 className="h-3 w-3 mr-1" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Auto-sync Settings */}
        {connectedCount > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${autoSync ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm">Auto-sync</span>
                {autoSync && (
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                )}
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            
            {autoSync && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Every</span>
                <Input 
                  type="number" 
                  min="5" 
                  max="60" 
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(e.target.value)}
                  className="w-16 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">minutes</span>
              </div>
            )}

            {lastFullSync && (
              <p className="text-xs text-muted-foreground">
                Last full sync: {lastFullSync}
              </p>
            )}
          </div>
        )}

        {/* Sync Button */}
        <Button 
          className="w-full" 
          onClick={handleSync}
          disabled={connectedCount === 0 || isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing All Sources...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All & Import Tasks
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Tasks will be analyzed for cognitive load priority scoring (CLS)
        </p>
      </CardContent>
    </Card>
  );
};

export default EmailCalendarIntegration;
