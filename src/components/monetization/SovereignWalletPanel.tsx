import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useOfflineCredits, FEATURE_COSTS } from '@/hooks/useOfflineCredits';
import { useShadowCredits, CREDIT_PACKAGES } from '@/hooks/useShadowCredits';
import { Wallet, Coins, ArrowUpRight, ArrowDownRight, RefreshCw, Zap, Shield, Cloud, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

const SovereignWalletPanel = () => {
  const offlineCredits = useOfflineCredits();
  const shadowCredits = useShadowCredits();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineHistory, setOfflineHistory] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    offlineCredits.getTransactionHistory(20).then(setOfflineHistory);
  }, [offlineCredits.balance]);

  const handleSync = async () => {
    const synced = await offlineCredits.syncCredits();
    toast.success(`Synced ${synced} transactions to cloud`);
  };

  const featureCostEntries = Object.entries(FEATURE_COSTS);

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
        {isOnline ? <Wifi className="h-5 w-5 text-emerald-400" /> : <WifiOff className="h-5 w-5 text-amber-400" />}
        <div>
          <p className="font-medium text-foreground">{isOnline ? 'Online — Cloud sync active' : 'Offline — Sovereign Mode'}</p>
          <p className="text-xs text-muted-foreground">{isOnline ? 'Credits syncing in real-time' : 'All local features are FREE. Credits queued for sync.'}</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline Balance</p>
                <p className="text-3xl font-bold text-foreground">{offlineCredits.balance}</p>
              </div>
              <Wallet className="h-10 w-10 text-primary opacity-60" />
            </div>
            {offlineCredits.pendingSyncCredits > 0 && (
              <Badge variant="outline" className="mt-2 text-amber-400 border-amber-400/30">
                {offlineCredits.pendingSyncCredits} pending sync
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cloud Balance</p>
                <p className="text-3xl font-bold text-foreground">{shadowCredits.balance?.balance ?? '—'}</p>
              </div>
              <Cloud className="h-10 w-10 text-muted-foreground opacity-60" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Purchased: {shadowCredits.balance?.totalPurchased ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Consumed</p>
                <p className="text-3xl font-bold text-foreground">{offlineCredits.totalConsumed + (shadowCredits.balance?.totalConsumed ?? 0)}</p>
              </div>
              <Zap className="h-10 w-10 text-muted-foreground opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="costs" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="costs">Feature Costs</TabsTrigger>
          <TabsTrigger value="packages">Credit Packages</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
          <TabsTrigger value="sync">Sync Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sovereign Pricing Model</CardTitle>
              <CardDescription>Use AI for FREE offline — pay only when syncing to cloud</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featureCostEntries.map(([feature, cost]) => (
                  <div key={feature} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2">
                      {cost === 0 ? <Shield className="h-4 w-4 text-emerald-400" /> : <Coins className="h-4 w-4 text-amber-400" />}
                      <span className="text-sm capitalize text-foreground">{feature.replace(/_/g, ' ')}</span>
                    </div>
                    <Badge variant={cost === 0 ? 'default' : 'secondary'} className={cost === 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}>
                      {cost === 0 ? 'FREE' : `${cost} credits`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREDIT_PACKAGES.map(pkg => (
              <Card key={pkg.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                      <p className="text-2xl font-bold text-primary mt-1">${pkg.price}</p>
                    </div>
                    {pkg.bonus > 0 && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">+{pkg.bonus} bonus</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credits</span>
                      <span className="text-foreground font-medium">{pkg.credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Per credit</span>
                      <span className="text-foreground">${pkg.pricePerCredit.toFixed(2)}</span>
                    </div>
                    <Progress value={(pkg.credits / 250) * 100} className="h-1 mt-2" />
                  </div>
                  <Button className="w-full mt-4" variant="outline" onClick={() => window.location.href = '/founder-access'}>
                    Purchase
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {shadowCredits.transactions.length === 0 && offlineHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {[...shadowCredits.transactions.map(t => ({
                    id: t.id,
                    amount: t.amount,
                    type: t.transactionType,
                    description: t.description || t.sessionType || t.transactionType,
                    time: new Date(t.createdAt).toLocaleString(),
                    source: 'cloud' as const,
                  })), ...offlineHistory.map(t => ({
                    id: t.id,
                    amount: t.amount,
                    type: t.type,
                    description: t.feature,
                    time: new Date(t.timestamp).toLocaleString(),
                    source: (t.synced ? 'synced' : 'local') as 'synced' | 'local',
                  }))].map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        {tx.amount > 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-red-400" />}
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-medium ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </p>
                        <Badge variant="outline" className="text-[10px]">{tx.source}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sync Queue</CardTitle>
              <CardDescription>Pending offline transactions waiting to sync</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div>
                  <p className="font-medium text-foreground">Pending Transactions</p>
                  <p className="text-sm text-muted-foreground">{offlineCredits.pendingSyncCredits} credits consumed offline</p>
                </div>
                <Button onClick={handleSync} disabled={!isOnline || offlineCredits.pendingSyncCredits === 0} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SovereignWalletPanel;
