import { useState, useEffect } from "react";
import { 
  BarChart3, Globe, TrendingUp, Building2, 
  MapPin, Calendar, Download, Filter, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { INTENT_CATEGORIES } from "@/hooks/useBusinessIntents";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

interface IntentStats {
  category: string;
  count: number;
  percentage: number;
}

interface RegionStats {
  region: string;
  count: number;
}

interface TrendData {
  date: string;
  count: number;
}

export function BusinessInsightsDashboard() {
  const [intents, setIntents] = useState<IntentStats[]>([]);
  const [regions, setRegions] = useState<RegionStats[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [totalIntents, setTotalIntents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();

      // Fetch intent counts by category
      const { data: intentData, error: intentError } = await supabase
        .from('business_intents')
        .select('intent_category')
        .gte('created_at', startDate);

      if (intentError) throw intentError;

      // Calculate category stats
      const categoryCounts: Record<string, number> = {};
      intentData?.forEach(item => {
        const cat = item.intent_category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const total = intentData?.length || 0;
      setTotalIntents(total);

      const stats: IntentStats[] = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      setIntents(stats);

      // Fetch region stats
      const { data: regionData, error: regionError } = await supabase
        .from('business_intents')
        .select('region')
        .gte('created_at', startDate)
        .not('region', 'is', null);

      if (regionError) throw regionError;

      const regionCounts: Record<string, number> = {};
      regionData?.forEach(item => {
        if (item.region) {
          regionCounts[item.region] = (regionCounts[item.region] || 0) + 1;
        }
      });

      setRegions(
        Object.entries(regionCounts)
          .map(([region, count]) => ({ region, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      // Generate trend data from real database records
      const { data: allIntentData, error: trendError } = await supabase
        .from('business_intents')
        .select('created_at')
        .gte('created_at', startDate);

      const trendData: TrendData[] = [];
      const dailyCounts: Record<string, number> = {};
      
      // Initialize all days with 0
      for (let i = days - 1; i >= 0; i--) {
        const dateKey = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dailyCounts[dateKey] = 0;
      }
      
      // Count actual records per day
      if (!trendError && allIntentData) {
        allIntentData.forEach(item => {
          const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
          if (dailyCounts[dateKey] !== undefined) {
            dailyCounts[dateKey]++;
          }
        });
      }

      // Convert to trend array
      Object.entries(dailyCounts).forEach(([dateKey, count]) => {
        trendData.push({ date: format(new Date(dateKey), 'MMM dd'), count });
      });
      
      setTrends(trendData);

    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
  ];

  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      period: dateRange,
      totalIntents,
      topCategories: intents.slice(0, 5),
      topRegions: regions.slice(0, 5),
      trends,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-insights-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Business Insights
          </h2>
          <p className="text-muted-foreground">
            Anonymized market intelligence from user queries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: '7d' | '30d' | '90d') => setDateRange(v)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Queries</p>
                <p className="text-3xl font-bold">{totalIntents.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-3xl font-bold">{intents.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regions</p>
                <p className="text-3xl font-bold">{regions.length}</p>
              </div>
              <Globe className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Intent</p>
                <p className="text-xl font-bold truncate">
                  {intents[0]?.category || 'N/A'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Query Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Intent Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={intents.slice(0, 6)}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {intents.slice(0, 6).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Business Intents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {intents.slice(0, 10).map((intent, index) => (
              <div
                key={intent.category}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{intent.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {intent.count.toLocaleString()} queries
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${intent.percentage}%` }}
                    />
                  </div>
                  <Badge variant="secondary">{intent.percentage}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regional Distribution */}
      {regions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="region"
                    width={100}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
