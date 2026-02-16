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
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMessages: 0, activeUsers: 0, tokensUsed: 0, avgResponseTime: 0 });

  const usageData = [
    { date: "Jan 1", messages: 120, tokens: 15000, users: 45 },
    { date: "Jan 2", messages: 180, tokens: 22000, users: 52 },
    { date: "Jan 3", messages: 150, tokens: 18500, users: 48 },
    { date: "Jan 4", messages: 220, tokens: 28000, users: 65 },
    { date: "Jan 5", messages: 190, tokens: 24000, users: 58 },
    { date: "Jan 6", messages: 280, tokens: 35000, users: 72 },
    { date: "Jan 7", messages: 310, tokens: 38000, users: 80 },
  ];

  const modelUsage = [
    { name: "Gemini 2.5 Pro", value: 45, color: "hsl(var(--primary))" },
    { name: "Gemini 2.5 Flash", value: 35, color: "hsl(var(--secondary))" },
    { name: "GPT-5", value: 15, color: "hsl(var(--accent))" },
    { name: "Other", value: 5, color: "hsl(var(--muted))" },
  ];

  const featureUsage = [
    { feature: "Chat", usage: 85 },
    { feature: "Image Gen", usage: 45 },
    { feature: "Code Canvas", usage: 62 },
    { feature: "Voice", usage: 28 },
    { feature: "Web Search", usage: 38 },
  ];

  const regionData = [
    { region: "North America", users: 1250, percentage: 35 },
    { region: "Europe", users: 980, percentage: 27 },
    { region: "Asia Pacific", users: 850, percentage: 24 },
    { region: "Latin America", users: 320, percentage: 9 },
    { region: "Other", users: 180, percentage: 5 },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const [messagesRes, usageRes] = await Promise.all([
          supabase.from("messages").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("usage_analytics").select("tokens_used").eq("user_id", user.id),
        ]);
        const totalTokens = usageRes.data?.reduce((sum, item) => sum + (item.tokens_used || 0), 0) || 0;
        setStats({ totalMessages: messagesRes.count || 0, activeUsers: 1, tokensUsed: totalTokens, avgResponseTime: 1.2 });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, [user]);

  const statCards = [
    { title: "Total Messages", value: stats.totalMessages.toLocaleString(), change: "+12%", icon: MessageSquare, color: "text-primary" },
    { title: "Active Users", value: stats.activeUsers.toLocaleString(), change: "+8%", icon: Users, color: "text-secondary" },
    { title: "Tokens Used", value: stats.tokensUsed.toLocaleString(), change: "+23%", icon: Zap, color: "text-accent" },
    { title: "Avg Response Time", value: `${stats.avgResponseTime}s`, change: "-5%", icon: Clock, color: "text-success" },
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
                      <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"} className="mt-2 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />{stat.change} this week
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