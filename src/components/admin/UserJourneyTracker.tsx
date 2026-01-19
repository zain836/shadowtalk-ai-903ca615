import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Route, 
  ArrowRight, 
  Clock, 
  Users, 
  TrendingUp,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface JourneyData {
  id: string;
  session_id: string;
  page_path: string;
  page_title: string | null;
  referrer_path: string | null;
  timestamp: string;
  duration_seconds: number | null;
  user_id: string | null;
}

interface PathFlow {
  from: string;
  to: string;
  count: number;
}

interface PageStats {
  path: string;
  visits: number;
  avgDuration: number;
  bounceRate: number;
}

export const UserJourneyTracker: React.FC = () => {
  const [journeys, setJourneys] = useState<JourneyData[]>([]);
  const [pathFlows, setPathFlows] = useState<PathFlow[]>([]);
  const [pageStats, setPageStats] = useState<PageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    fetchJourneyData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('journey-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_journeys' },
        () => fetchJourneyData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchJourneyData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_journeys')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (error) throw error;

      setJourneys(data || []);
      calculatePathFlows(data || []);
      calculatePageStats(data || []);
    } catch (error) {
      console.error('Error fetching journey data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePathFlows = (data: JourneyData[]) => {
    const flowMap = new Map<string, number>();
    
    data.forEach(journey => {
      if (journey.referrer_path) {
        const key = `${journey.referrer_path}|${journey.page_path}`;
        flowMap.set(key, (flowMap.get(key) || 0) + 1);
      }
    });

    const flows: PathFlow[] = Array.from(flowMap.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('|');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    setPathFlows(flows);
  };

  const calculatePageStats = (data: JourneyData[]) => {
    const pageMap = new Map<string, { visits: number; durations: number[]; hasExits: number }>();
    
    data.forEach(journey => {
      const stats = pageMap.get(journey.page_path) || { visits: 0, durations: [], hasExits: 0 };
      stats.visits++;
      if (journey.duration_seconds) {
        stats.durations.push(journey.duration_seconds);
      }
      if (!journey.referrer_path) {
        stats.hasExits++;
      }
      pageMap.set(journey.page_path, stats);
    });

    const stats: PageStats[] = Array.from(pageMap.entries())
      .map(([path, { visits, durations, hasExits }]) => ({
        path,
        visits,
        avgDuration: durations.length > 0 
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0,
        bounceRate: visits > 0 ? Math.round((hasExits / visits) * 100) : 0,
      }))
      .sort((a, b) => b.visits - a.visits);

    setPageStats(stats);
  };

  const getUniqueSessionsCount = () => {
    return new Set(journeys.map(j => j.session_id)).size;
  };

  const getSessionJourneys = (sessionId: string) => {
    return journeys
      .filter(j => j.session_id === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getRecentSessions = () => {
    const sessions = new Map<string, { firstVisit: Date; pageCount: number; userId: string | null }>();
    
    journeys.forEach(j => {
      const existing = sessions.get(j.session_id);
      const timestamp = new Date(j.timestamp);
      
      if (!existing || timestamp < existing.firstVisit) {
        sessions.set(j.session_id, {
          firstVisit: timestamp,
          pageCount: (existing?.pageCount || 0) + 1,
          userId: j.user_id,
        });
      } else {
        sessions.set(j.session_id, {
          ...existing,
          pageCount: existing.pageCount + 1,
        });
      }
    });

    return Array.from(sessions.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.firstVisit.getTime() - a.firstVisit.getTime())
      .slice(0, 20);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  const getPathColor = (path: string) => {
    const colors: Record<string, string> = {
      '/': 'bg-blue-500',
      '/chatbot': 'bg-green-500',
      '/pricing': 'bg-purple-500',
      '/auth': 'bg-yellow-500',
      '/admin': 'bg-red-500',
      '/profile': 'bg-pink-500',
    };
    return colors[path] || 'bg-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Page Views</p>
                <p className="text-2xl font-bold">{journeys.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Sessions</p>
                <p className="text-2xl font-bold">{getUniqueSessionsCount()}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Pages/Session</p>
                <p className="text-2xl font-bold">
                  {getUniqueSessionsCount() > 0 
                    ? (journeys.length / getUniqueSessionsCount()).toFixed(1)
                    : '0'}
                </p>
              </div>
              <Route className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Paths</p>
                <p className="text-2xl font-bold">{pageStats.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flows" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="flows">Navigation Flows</TabsTrigger>
            <TabsTrigger value="pages">Page Stats</TabsTrigger>
            <TabsTrigger value="sessions">User Sessions</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={fetchJourneyData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value="flows">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Top Navigation Paths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pathFlows.map((flow, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                    >
                      <Badge variant="outline" className="font-mono text-xs">
                        #{index + 1}
                      </Badge>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Badge className={`${getPathColor(flow.from)} text-white`}>
                          {flow.from}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Badge className={`${getPathColor(flow.to)} text-white`}>
                          {flow.to}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {flow.count} visits
                      </Badge>
                    </div>
                  ))}
                  {pathFlows.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No navigation data yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Page Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pageStats.map((page, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${getPathColor(page.path)} text-white`}>
                          {page.path}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{page.visits} visits</p>
                          <p className="text-xs text-muted-foreground">
                            Avg: {formatDuration(page.avgDuration)}
                          </p>
                        </div>
                        <Badge variant={page.bounceRate > 50 ? 'destructive' : 'secondary'}>
                          {page.bounceRate}% entry
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {pageStats.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No page data yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {getRecentSessions().map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSession === session.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card/50 hover:bg-card'
                        }`}
                        onClick={() => setSelectedSession(session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm">
                              {session.id.substring(0, 20)}...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(session.firstVisit, 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{session.pageCount} pages</Badge>
                            {session.userId && (
                              <Badge variant="outline" className="ml-2">
                                Logged in
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Session Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {selectedSession ? (
                    <div className="space-y-3">
                      {getSessionJourneys(selectedSession).map((journey, index, arr) => (
                        <div
                          key={journey.id}
                          className="relative flex items-start gap-3"
                        >
                          {index < arr.length - 1 && (
                            <div className="absolute left-3 top-8 w-0.5 h-full bg-border" />
                          )}
                          <div className={`w-6 h-6 rounded-full ${getPathColor(journey.page_path)} flex items-center justify-center text-white text-xs font-bold z-10`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium">{journey.page_path}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(journey.timestamp), 'h:mm:ss a')}
                              {journey.duration_seconds && (
                                <> • {formatDuration(journey.duration_seconds)}</>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Select a session to view journey
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
