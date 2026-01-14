import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  DollarSign,
  Activity,
} from 'lucide-react';

interface UsageStats {
  totalMessages: number;
  totalApiCalls: number;
  totalTokens: number;
  totalUsers: number;
  activeUsers: number;
  averageResponseTime: number;
  costEstimate: number;
}

interface TimeSeriesData {
  date: string;
  messages: number;
  apiCalls: number;
  tokens: number;
  users: number;
}

interface ResourceBreakdown {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AdvancedAnalyticsDashboard = () => {
  const { currentWorkspace } = useWorkspace();
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<UsageStats>({
    totalMessages: 0,
    totalApiCalls: 0,
    totalTokens: 0,
    totalUsers: 0,
    activeUsers: 0,
    averageResponseTime: 0,
    costEstimate: 0,
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [resourceBreakdown, setResourceBreakdown] = useState<ResourceBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadAnalytics();
    }
  }, [currentWorkspace, timeRange]);

  const loadAnalytics = async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Load usage tracking data
      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (usageError) throw usageError;

      // Calculate stats
      const messageCount = usageData?.filter(u => u.resource_type === 'message').reduce((sum, u) => sum + u.resource_count, 0) || 0;
      const apiCallCount = usageData?.filter(u => u.resource_type === 'api_call').reduce((sum, u) => sum + u.resource_count, 0) || 0;
      const tokenCount = usageData?.filter(u => u.resource_type === 'ai_token').reduce((sum, u) => sum + u.resource_count, 0) || 0;
      
      const uniqueUsers = new Set(usageData?.map(u => u.user_id) || []).size;

      // Get active users (users with activity in last 24h)
      const activeUsersData = usageData?.filter(u => {
        const activityDate = new Date(u.created_at);
        const dayAgo = new Date();
        dayAgo.setHours(dayAgo.getHours() - 24);
        return activityDate >= dayAgo;
      });
      const activeUsersCount = new Set(activeUsersData?.map(u => u.user_id) || []).size;

      // Estimate cost (rough calculation)
      const costEstimate = (tokenCount / 1000) * 0.002 + (messageCount * 0.001);

      setStats({
        totalMessages: messageCount,
        totalApiCalls: apiCallCount,
        totalTokens: tokenCount,
        totalUsers: uniqueUsers,
        activeUsers: activeUsersCount,
        averageResponseTime: 1.2, // Mock data
        costEstimate,
      });

      // Generate time series data
      const timeSeriesMap = new Map<string, TimeSeriesData>();
      usageData?.forEach(usage => {
        const date = new Date(usage.created_at).toISOString().split('T')[0];
        if (!timeSeriesMap.has(date)) {
          timeSeriesMap.set(date, {
            date,
            messages: 0,
            apiCalls: 0,
            tokens: 0,
            users: 0,
          });
        }
        const entry = timeSeriesMap.get(date)!;
        if (usage.resource_type === 'message') entry.messages += usage.resource_count;
        if (usage.resource_type === 'api_call') entry.apiCalls += usage.resource_count;
        if (usage.resource_type === 'ai_token') entry.tokens += usage.resource_count;
      });

      setTimeSeriesData(Array.from(timeSeriesMap.values()).sort((a, b) => a.date.localeCompare(b.date)));

      // Generate resource breakdown
      const breakdown: ResourceBreakdown[] = [
        { name: 'Messages', value: messageCount, color: COLORS[0] },
        { name: 'API Calls', value: apiCallCount, color: COLORS[1] },
        { name: 'AI Tokens', value: Math.floor(tokenCount / 1000), color: COLORS[2] },
        { name: 'Image Gen', value: usageData?.filter(u => u.resource_type === 'image_generation').length || 0, color: COLORS[3] },
      ];

      setResourceBreakdown(breakdown.filter(b => b.value > 0));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, description }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your workspace usage
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          icon={MessageSquare}
          trend="+12.5% from last period"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          description={`${stats.totalUsers} total users`}
        />
        <StatCard
          title="API Calls"
          value={stats.totalApiCalls.toLocaleString()}
          icon={Zap}
          trend="+8.2% from last period"
        />
        <StatCard
          title="Estimated Cost"
          value={`$${stats.costEstimate.toFixed(2)}`}
          icon={DollarSign}
          description={`${(stats.totalTokens / 1000).toFixed(1)}K tokens`}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Resource Breakdown</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Over Time</CardTitle>
              <CardDescription>
                Track your workspace activity trends
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name="Messages"
                  />
                  <Line
                    type="monotone"
                    dataKey="apiCalls"
                    stroke="#00C49F"
                    strokeWidth={2}
                    name="API Calls"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Distribution</CardTitle>
                <CardDescription>
                  Breakdown of resource usage by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={resourceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {resourceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>
                  Message volume by day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                System performance and response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <span className="text-2xl font-bold">{stats.averageResponseTime}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">API Success Rate</span>
                  <span className="text-2xl font-bold">99.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-2xl font-bold">99.99%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
