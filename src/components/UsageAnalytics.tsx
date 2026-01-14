import { useState, useEffect } from "react";
import { BarChart3, MessageSquare, Image, Code, Globe, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface UsageStats {
  totalQueries: number;
  queriesByCategory: { name: string; value: number }[];
  queriesByDay: { date: string; count: number }[];
  featureUsage: { name: string; value: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const UsageAnalytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UsageStats>({
    totalQueries: 0,
    queriesByCategory: [],
    queriesByDay: [],
    featureUsage: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      // Get usage analytics
      const { data: analyticsData } = await supabase
        .from('usage_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analyticsData) {
        // Calculate stats
        const totalQueries = analyticsData.length;

        // Group by category
        const categoryMap = new Map<string, number>();
        analyticsData.forEach((item) => {
          const category = item.query_category || 'general';
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });
        const queriesByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }));

        // Group by feature
        const featureMap = new Map<string, number>();
        analyticsData.forEach((item) => {
          const feature = item.feature_used || 'chat';
          featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
        });
        const featureUsage = Array.from(featureMap.entries()).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }));

        // Group by day (last 7 days)
        const dayMap = new Map<string, number>();
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          dayMap.set(dateStr, 0);
        }
        analyticsData.forEach((item) => {
          const dateStr = new Date(item.created_at).toISOString().split('T')[0];
          if (dayMap.has(dateStr)) {
            dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1);
          }
        });
        const queriesByDay = Array.from(dayMap.entries()).map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          count,
        }));

        setStats({
          totalQueries,
          queriesByCategory,
          queriesByDay,
          featureUsage,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'code':
        return <Code className="h-4 w-4" />;
      case 'translate':
        return <Globe className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalQueries}</p>
                <p className="text-sm text-muted-foreground">Total Queries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.queriesByCategory.length}</p>
                <p className="text-sm text-muted-foreground">Categories Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Code className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.featureUsage.length}</p>
                <p className="text-sm text-muted-foreground">Features Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <MessageSquare className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.queriesByDay.reduce((sum, d) => sum + d.count, 0) / 7 || 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg/Day (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.queriesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Query Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats.queriesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.queriesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.queriesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data yet. Start using the chatbot to see analytics!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.featureUsage.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.featureUsage.map((feature, index) => (
                <div
                  key={feature.name}
                  className="p-4 rounded-lg bg-muted/50 flex items-center gap-3"
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                  >
                    {getFeatureIcon(feature.name)}
                  </div>
                  <div>
                    <p className="font-medium">{feature.name}</p>
                    <p className="text-sm text-muted-foreground">{feature.value} uses</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No feature usage data yet. Start using the chatbot to see analytics!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageAnalytics;