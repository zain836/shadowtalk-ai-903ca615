import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquareHeart, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  email: string | null;
  category: string;
  rating: number | null;
  message: string;
  status: string;
  created_at: string;
}

interface RatingStats {
  average: number;
  total: number;
  trend: 'up' | 'down' | 'stable';
  distribution: number[];
}

export const RealTimeFeedback: React.FC = () => {
  const [liveFeeback, setLiveFeedback] = useState<FeedbackItem[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    average: 0,
    total: 0,
    trend: 'stable',
    distribution: [0, 0, 0, 0, 0]
  });
  const [todayStats, setTodayStats] = useState({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0
  });
  const [hourlyData, setHourlyData] = useState<{ hour: string; count: number; avgRating: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    // Subscribe to real-time feedback
    const channel = supabase
      .channel('admin-feedback-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback'
        },
        (payload) => {
          const newFeedback = payload.new as FeedbackItem;
          setLiveFeedback(prev => [newFeedback, ...prev.slice(0, 19)]);
          
          // Show notification
          toast.success(`New ${newFeedback.category} feedback received!`, {
            description: newFeedback.rating 
              ? `Rating: ${newFeedback.rating}/5 stars` 
              : 'No rating provided'
          });
          
          // Update stats
          loadStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'feedback'
        },
        (payload) => {
          const updatedFeedback = payload.new as FeedbackItem;
          setLiveFeedback(prev => 
            prev.map(f => f.id === updatedFeedback.id ? updatedFeedback : f)
          );
        }
      )
      .subscribe();

    // Load initial data
    loadInitialFeedback();
    loadStats();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadInitialFeedback = async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setLiveFeedback(data);
    }
  };

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .gte('created_at', today.toISOString());

    if (!error && data) {
      // Calculate today's stats
      const positive = data.filter(f => f.rating && f.rating >= 4).length;
      const negative = data.filter(f => f.rating && f.rating <= 2).length;
      const neutral = data.filter(f => !f.rating || f.rating === 3).length;

      setTodayStats({
        total: data.length,
        positive,
        negative,
        neutral
      });

      // Calculate rating distribution
      const distribution = [0, 0, 0, 0, 0];
      data.forEach(f => {
        if (f.rating && f.rating >= 1 && f.rating <= 5) {
          distribution[f.rating - 1]++;
        }
      });

      const ratingsOnly = data.filter(f => f.rating);
      const average = ratingsOnly.length > 0
        ? ratingsOnly.reduce((acc, f) => acc + (f.rating || 0), 0) / ratingsOnly.length
        : 0;

      setRatingStats({
        average: Math.round(average * 10) / 10,
        total: ratingsOnly.length,
        trend: average >= 4 ? 'up' : average <= 2 ? 'down' : 'stable',
        distribution
      });

      // Calculate hourly data
      const hourlyMap: Record<string, { count: number; totalRating: number; ratingCount: number }> = {};
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        hourlyMap[hour] = { count: 0, totalRating: 0, ratingCount: 0 };
      }
      
      data.forEach(f => {
        const hour = format(new Date(f.created_at), 'HH');
        hourlyMap[hour].count++;
        if (f.rating) {
          hourlyMap[hour].totalRating += f.rating;
          hourlyMap[hour].ratingCount++;
        }
      });

      setHourlyData(
        Object.entries(hourlyMap).map(([hour, stats]) => ({
          hour: `${hour}:00`,
          count: stats.count,
          avgRating: stats.ratingCount > 0 
            ? Math.round((stats.totalRating / stats.ratingCount) * 10) / 10 
            : 0
        }))
      );

      // Calculate category data
      const categories: Record<string, number> = {};
      data.forEach(f => {
        categories[f.category] = (categories[f.category] || 0) + 1;
      });

      setCategoryData(
        Object.entries(categories).map(([name, value]) => ({ name, value }))
      );
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const handleQuickResolve = async (id: string) => {
    const { error } = await supabase
      .from('feedback')
      .update({ status: 'resolved' })
      .eq('id', id);

    if (!error) {
      setLiveFeedback(prev => 
        prev.map(f => f.id === id ? { ...f, status: 'resolved' } : f)
      );
      toast.success('Feedback marked as resolved');
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Feedback</p>
                <p className="text-3xl font-bold">{todayStats.total}</p>
              </div>
              <MessageSquareHeart className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{ratingStats.average}</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.round(ratingStats.average) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {ratingStats.trend === 'up' ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : ratingStats.trend === 'down' ? (
                <TrendingDown className="h-8 w-8 text-red-500" />
              ) : (
                <Sparkles className="h-8 w-8 text-yellow-500/50" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive</p>
                <p className="text-3xl font-bold text-green-500">{todayStats.positive}</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-3xl font-bold text-red-500">{todayStats.negative}</p>
              </div>
              <ThumbsDown className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Today's Feedback Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="feedbackGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#feedbackGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              By Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No category data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Live Feedback Feed
            <Badge variant="outline" className="ml-auto animate-pulse bg-green-500/10 text-green-500 border-green-500/20">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {liveFeeback.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquareHeart className="h-12 w-12 mb-2 opacity-50" />
                <p>No feedback yet today</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {liveFeeback.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="capitalize">
                              {item.category}
                            </Badge>
                            {item.rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${i < item.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                                  />
                                ))}
                              </div>
                            )}
                            <Badge 
                              variant="outline"
                              className={
                                item.status === 'resolved'
                                  ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                  : item.status === 'in_progress'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    : ''
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/90 line-clamp-2">{item.message}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                            {item.email && (
                              <>
                                <span>•</span>
                                <span>{item.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {item.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleQuickResolve(item.id)}
                            className="shrink-0"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
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
  );
};
