import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  MousePointer, 
  LogIn, 
  LogOut, 
  MessageSquare, 
  Globe,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface UserActivity {
  id: string;
  userId: string;
  email?: string;
  action: string;
  page: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ActiveUser {
  userId: string;
  email?: string;
  currentPage: string;
  lastActivity: Date;
  sessionStart: Date;
}

export const RealTimeUserFlow: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [stats, setStats] = useState({
    onlineNow: 0,
    todayVisits: 0,
    avgSessionTime: '0m',
    pageViews: 0
  });

  useEffect(() => {
    // Subscribe to realtime presence for active users
    const presenceChannel = supabase.channel('admin-presence-tracking');

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: ActiveUser[] = [];
        
        Object.entries(state).forEach(([key, presences]) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const presence = presences[0] as Record<string, unknown>;
            users.push({
              userId: key,
              email: presence.email as string | undefined,
              currentPage: (presence.page as string) || '/chatbot',
              lastActivity: new Date(presence.lastActivity as string || Date.now()),
              sessionStart: new Date(presence.sessionStart as string || Date.now())
            });
          }
        });
        
        setActiveUsers(users);
        setStats(prev => ({ ...prev, onlineNow: users.length }));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0] as Record<string, unknown>;
        const activity: UserActivity = {
          id: crypto.randomUUID(),
          userId: key,
          email: presence.email as string | undefined,
          action: 'joined',
          page: (presence.page as string) || '/chatbot',
          timestamp: new Date()
        };
        setRecentActivities(prev => [activity, ...prev.slice(0, 49)]);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const presence = leftPresences[0] as Record<string, unknown>;
        const activity: UserActivity = {
          id: crypto.randomUUID(),
          userId: key,
          email: presence.email as string | undefined,
          action: 'left',
          page: (presence.page as string) || '/chatbot',
          timestamp: new Date()
        };
        setRecentActivities(prev => [activity, ...prev.slice(0, 49)]);
      })
      .subscribe();

    // Subscribe to usage analytics for real-time activity
    const analyticsChannel = supabase
      .channel('admin-analytics')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_analytics'
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          const activity: UserActivity = {
            id: data.id as string,
            userId: data.user_id as string,
            action: data.action_type as string,
            page: (data.feature_used as string) || 'unknown',
            timestamp: new Date(data.created_at as string),
            metadata: data.metadata as Record<string, unknown>
          };
          setRecentActivities(prev => [activity, ...prev.slice(0, 49)]);
          setStats(prev => ({ ...prev, pageViews: prev.pageViews + 1 }));
        }
      )
      .subscribe();

    // Load initial stats
    loadStats();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(analyticsChannel);
    };
  }, []);

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('usage_analytics')
      .select('*')
      .gte('created_at', today.toISOString());

    if (!error && data) {
      const uniqueUsers = new Set(data.map(d => d.user_id));
      setStats(prev => ({
        ...prev,
        todayVisits: uniqueUsers.size,
        pageViews: data.length
      }));
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'joined':
        return <LogIn className="h-4 w-4 text-green-500" />;
      case 'left':
        return <LogOut className="h-4 w-4 text-red-500" />;
      case 'chat_message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'mode_switch':
        return <Globe className="h-4 w-4 text-blue-500" />;
      default:
        return <MousePointer className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'joined':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'left':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'chat_message':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Now</p>
                <p className="text-3xl font-bold text-green-500">{stats.onlineNow}</p>
              </div>
              <div className="relative">
                <Users className="h-8 w-8 text-green-500/50" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Visits</p>
                <p className="text-3xl font-bold text-blue-500">{stats.todayVisits}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Session</p>
                <p className="text-3xl font-bold text-purple-500">{stats.avgSessionTime}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Page Views</p>
                <p className="text-3xl font-bold text-orange-500">{stats.pageViews}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Active Users
              <Badge variant="outline" className="ml-auto bg-green-500/10 text-green-500 border-green-500/20">
                {activeUsers.length} online
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {activeUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Users className="h-12 w-12 mb-2 opacity-50" />
                  <p>No active users right now</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {activeUsers.map(user => (
                      <motion.div
                        key={user.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {user.email || `User ${user.userId.slice(0, 8)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              on {user.currentPage}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {format(user.lastActivity, 'HH:mm')}
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Live Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Activity className="h-12 w-12 mb-2 opacity-50" />
                  <p>Waiting for activity...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {recentActivities.map(activity => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                          {getActionIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">
                            <span className="font-medium">
                              {activity.email || `User ${activity.userId.slice(0, 8)}`}
                            </span>{' '}
                            <span className="text-muted-foreground">
                              {activity.action.replace('_', ' ')}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(activity.timestamp, 'HH:mm:ss')}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
