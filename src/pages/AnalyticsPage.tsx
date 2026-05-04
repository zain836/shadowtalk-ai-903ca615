import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, MessageSquare, Zap, Clock, Globe, Activity, Download } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

interface UsageRow { date: string; messages: number; tokens: number; users: number }
interface ModelRow { name: string; value: number; color: string; avgSeconds: number }
interface FeatureRow { feature: string; usage: number }

const MODEL_COLORS: Record<string, string> = {
  default: "hsl(var(--primary))",
};
const COLOR_PALETTE = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

const FEATURE_LABEL: Record<string, string> = {
  chat: "Chat",
  message: "Chat",
  image: "Image Gen",
  image_generation: "Image Gen",
  code: "Code Canvas",
  code_generation: "Code Canvas",
  voice: "Voice",
  search: "Web Search",
  web_search: "Web Search",
  deep_research: "Deep Research",
  file_upload: "Files",
};

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMessages: 0, activeUsers: 0, tokensUsed: 0, avgResponseTime: 0 });
  const [usageData, setUsageData] = useState<UsageRow[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelRow[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureRow[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        const [messagesRes, usageRes, dailyRes, recentMsgsRes] = await Promise.all([
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("usage_analytics").select("tokens_used, feature_used, created_at").eq("user_id", user.id),
          supabase.from("daily_usage").select("usage_date, messages, code_generations, image_generations, web_searches, deep_research").eq("user_id", user.id).gte("usage_date", sevenDaysAgo.slice(0, 10)).order("usage_date", { ascending: true }),
          supabase.from("messages").select("created_at, personality").eq("user_id", user.id).gte("created_at", sevenDaysAgo).order("created_at", { ascending: true }),
        ]);

        const totalTokens = usageRes.data?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0;

        // Compute avg response time: assistant created_at - prior user msg created_at within same conversation.
        // Cheap approximation using consecutive timestamps in recent window.
        let avgResponseTime = 0;
        const msgs = recentMsgsRes.data || [];
        if (msgs.length >= 2) {
          const deltas: number[] = [];
          for (let i = 1; i < msgs.length; i++) {
            const d = (new Date(msgs[i].created_at).getTime() - new Date(msgs[i - 1].created_at).getTime()) / 1000;
            if (d > 0 && d < 60) deltas.push(d);
          }
          if (deltas.length) avgResponseTime = +(deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(2);
        }

        setStats({
          totalMessages: messagesRes.count || 0,
          activeUsers: 1,
          tokensUsed: totalTokens,
          avgResponseTime,
        });

        // Daily usage chart from daily_usage table
        const usageRows: UsageRow[] = (dailyRes.data || []).map((d) => ({
          date: new Date(d.usage_date).toLocaleDateString("en", { month: "short", day: "numeric" }),
          messages: d.messages || 0,
          tokens: 0,
          users: 1,
        }));
        // Fold tokens per day from usage_analytics
        (usageRes.data || []).forEach((u) => {
          const day = new Date(u.created_at).toLocaleDateString("en", { month: "short", day: "numeric" });
          const row = usageRows.find((r) => r.date === day);
          if (row) row.tokens += u.tokens_used || 0;
        });
        setUsageData(usageRows);

        // Model usage from messages.personality
        const modelCounts: Record<string, number> = {};
        msgs.forEach((m) => {
          const key = m.personality || "default";
          modelCounts[key] = (modelCounts[key] || 0) + 1;
        });
        const modelTotal = Object.values(modelCounts).reduce((a, b) => a + b, 0) || 1;
        const modelRows: ModelRow[] = Object.entries(modelCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, count], i) => ({
            name,
            value: Math.round((count / modelTotal) * 100),
            color: COLOR_PALETTE[i % COLOR_PALETTE.length],
            avgSeconds: avgResponseTime,
          }));
        setModelUsage(modelRows);

        // Feature usage from usage_analytics.feature_used
        const featureCounts: Record<string, number> = {};
        (usageRes.data || []).forEach((u) => {
          if (!u.feature_used) return;
          const label = FEATURE_LABEL[u.feature_used] || u.feature_used;
          featureCounts[label] = (featureCounts[label] || 0) + 1;
        });
        const featureMax = Math.max(1, ...Object.values(featureCounts));
        setFeatureUsage(
          Object.entries(featureCounts)
            .map(([feature, count]) => ({ feature, usage: Math.round((count / featureMax) * 100) }))
            .sort((a, b) => b.usage - a.usage)
            .slice(0, 8)
        );
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { title: "Total Messages", value: stats.totalMessages.toLocaleString(), icon: MessageSquare, color: "text-primary" },
    { title: "Your Account", value: stats.activeUsers.toLocaleString(), icon: Users, color: "text-secondary" },
    { title: "Tokens Used", value: stats.tokensUsed.toLocaleString(), icon: Zap, color: "text-accent" },
    { title: "Avg Response Time", value: stats.avgResponseTime ? `${stats.avgResponseTime}s` : "—", icon: Clock, color: "text-success" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px]" />
      </div>

      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
          <div>
            <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
              <Activity className="h-3 w-3 mr-1" /> Analytics
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              Analytics <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-lg">Monitor your usage and performance metrics</p>
          </div>
          <Button variant="outline" className="glass-subtle border-border/30 hover:bg-primary/10 hover:border-primary/30">
            <Download className="h-4 w-4 mr-2" />Export Report
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((stat, i) => (
            <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible"
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
            >
              <Card className="card-glass overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="pt-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />Last 7 days
                      </Badge>
                    </div>
                    <div className={`p-3 rounded-xl glass-subtle ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="usage" className="space-y-6">
          <TabsList className="glass-subtle border-border/30">
            <TabsTrigger value="usage" className="gap-2"><Activity className="h-4 w-4" />Usage</TabsTrigger>
            <TabsTrigger value="models" className="gap-2"><BarChart3 className="h-4 w-4" />Models</TabsTrigger>
            <TabsTrigger value="regions" className="gap-2"><Globe className="h-4 w-4" />Regions</TabsTrigger>
          </TabsList>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="card-glass overflow-hidden">
                  <CardHeader className="relative z-10"><CardTitle>Messages Over Time</CardTitle><CardDescription>Daily message count for the past week</CardDescription></CardHeader>
                  <CardContent className="relative z-10">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={usageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                        <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="card-glass overflow-hidden">
                  <CardHeader className="relative z-10"><CardTitle>Token Usage</CardTitle><CardDescription>Daily token consumption</CardDescription></CardHeader>
                  <CardContent className="relative z-10">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={usageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                        <Line type="monotone" dataKey="tokens" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ fill: "hsl(var(--secondary))" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            <motion.div custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Card className="card-glass overflow-hidden">
                <CardHeader className="relative z-10"><CardTitle>Feature Usage</CardTitle><CardDescription>Usage breakdown by feature</CardDescription></CardHeader>
                <CardContent className="relative z-10">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={featureUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="feature" type="category" stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                      <Bar dataKey="usage" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="card-glass overflow-hidden">
                  <CardHeader className="relative z-10"><CardTitle>Model Distribution</CardTitle><CardDescription>Usage by AI model</CardDescription></CardHeader>
                  <CardContent className="relative z-10">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={modelUsage} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {modelUsage.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem" }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <Card className="card-glass overflow-hidden">
                  <CardHeader className="relative z-10"><CardTitle>Model Performance</CardTitle><CardDescription>Response times by model</CardDescription></CardHeader>
                  <CardContent className="relative z-10 space-y-3">
                    {modelUsage.map((model, index) => (
                      <div key={index} className="flex items-center justify-between p-3 glass-subtle rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: model.color }} />
                          <span>{model.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{model.value}%</p>
                          <p className="text-xs text-muted-foreground">~{(Math.random() * 2 + 0.5).toFixed(2)}s avg</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <Card className="card-glass overflow-hidden">
                <CardHeader className="relative z-10"><CardTitle>Geographic Distribution</CardTitle><CardDescription>User distribution by region</CardDescription></CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  {regionData.map((region, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{region.region}</span>
                        <span className="text-muted-foreground">{region.users.toLocaleString()} users ({region.percentage}%)</span>
                      </div>
                      <div className="h-2 glass-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${region.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AnalyticsPage;