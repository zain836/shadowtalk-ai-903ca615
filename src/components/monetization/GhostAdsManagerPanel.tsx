import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useGhostAds } from '@/hooks/useGhostAds';
import { Ghost, RefreshCw, Eye, MousePointerClick, ExternalLink, Search, Database } from 'lucide-react';
import { toast } from 'sonner';

const GhostAdsManagerPanel = () => {
  const ghostAds = useGhostAds();
  const [testQuery, setTestQuery] = useState('');
  const [matchedAds, setMatchedAds] = useState<any[]>([]);

  const handleTestMatch = () => {
    if (!testQuery.trim()) return;
    const results = ghostAds.findRelevantAds(testQuery, 5);
    setMatchedAds(results);
  };

  const handleSyncImpressions = async () => {
    const synced = await ghostAds.syncImpressions();
    toast.success(`Synced ${synced} impressions to server`);
  };

  const handleRefreshCache = async () => {
    await ghostAds.cacheSponsors();
    toast.success('Sponsor cache refreshed');
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cached Sponsors</p>
                <p className="text-3xl font-bold text-foreground">{ghostAds.cachedAds.length}</p>
              </div>
              <Database className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Impressions</p>
                <p className="text-3xl font-bold text-foreground">{ghostAds.pendingImpressions}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6 flex flex-col gap-2">
            <Button onClick={handleRefreshCache} variant="outline" size="sm" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh Cache
            </Button>
            <Button onClick={handleSyncImpressions} variant="outline" size="sm" className="w-full" disabled={ghostAds.pendingImpressions === 0}>
              <MousePointerClick className="h-4 w-4 mr-2" /> Sync Impressions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Keyword Match Tester */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" /> Ghost Ad Matcher
          </CardTitle>
          <CardDescription>Test which ads would be injected for a given message context</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testQuery}
              onChange={e => setTestQuery(e.target.value)}
              placeholder="Enter a message to test ad matching..."
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && handleTestMatch()}
            />
            <Button onClick={handleTestMatch}>Test</Button>
          </div>
          {matchedAds.length > 0 && (
            <div className="space-y-2">
              {matchedAds.map(ad => (
                <div key={ad.id} className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Ghost className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{ad.partnerName}</p>
                      <p className="text-xs text-muted-foreground">{ad.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{ad.category}</Badge>
                </div>
              ))}
            </div>
          )}
          {testQuery && matchedAds.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No matching ads for this context</p>
          )}
        </CardContent>
      </Card>

      {/* Cached Sponsors List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cached Sponsor Database</CardTitle>
          <CardDescription>Locally stored sponsors available for offline ad injection</CardDescription>
        </CardHeader>
        <CardContent>
          {ghostAds.cachedAds.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sponsors cached. Click "Refresh Cache" while online.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ghostAds.cachedAds.map(ad => (
                <div key={ad.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{ad.partnerName}</p>
                      <Badge variant="secondary" className="text-[10px]">P{ad.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ad.keywords.slice(0, 5).map(kw => (
                        <Badge key={kw} variant="outline" className="text-[10px]">{kw}</Badge>
                      ))}
                      {ad.keywords.length > 5 && <Badge variant="outline" className="text-[10px]">+{ad.keywords.length - 5}</Badge>}
                    </div>
                  </div>
                  {ad.affiliateUrl && (
                    <a href={ad.affiliateUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GhostAdsManagerPanel;
