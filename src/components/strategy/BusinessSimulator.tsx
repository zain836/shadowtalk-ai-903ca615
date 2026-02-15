import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, TrendingUp, Users, DollarSign, BarChart3,
  Globe, Zap, Target, ArrowRight, Loader2, Sparkles,
  PieChart, Activity, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface SimulationInput {
  idea: string;
  market: string;
  investment: string;
  model: string;
}

interface SimulationResult {
  monthlyData: Array<{
    month: string;
    users: number;
    revenue: number;
    costs: number;
    mrr: number;
  }>;
  kpis: {
    totalUsers: number;
    arr: number;
    cac: number;
    ltv: number;
    burnRate: number;
    runway: number;
    breakeven: string;
    growthRate: number;
  };
  milestones: Array<{
    month: number;
    event: string;
    impact: string;
  }>;
  landingPageMockup: {
    headline: string;
    subheadline: string;
    cta: string;
    features: string[];
    socialProof: string;
  };
}

const generateSimulation = (input: SimulationInput): SimulationResult => {
  const investmentNum = parseInt(input.investment.replace(/\D/g, "")) || 50000;
  const baseUsers = 50;
  const growthMultiplier = input.model === "saas" ? 1.18 : input.model === "marketplace" ? 1.22 : 1.15;

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const users = Math.round(baseUsers * Math.pow(growthMultiplier, i));
    const avgRevPerUser = input.model === "saas" ? 49 : input.model === "marketplace" ? 15 : 29;
    const revenue = users * avgRevPerUser;
    const costs = Math.round(investmentNum / 12 + users * 5);
    return {
      month: `M${i + 1}`,
      users,
      revenue,
      costs,
      mrr: revenue,
    };
  });

  const finalMonth = monthlyData[11];
  const breakevenMonth = monthlyData.findIndex(m => m.revenue >= m.costs);

  return {
    monthlyData,
    kpis: {
      totalUsers: finalMonth.users,
      arr: finalMonth.revenue * 12,
      cac: Math.round(investmentNum * 0.4 / finalMonth.users),
      ltv: Math.round(finalMonth.revenue / finalMonth.users * 18),
      burnRate: Math.round(investmentNum / 12),
      runway: Math.round(investmentNum / (investmentNum / 12)),
      breakeven: breakevenMonth >= 0 ? `Month ${breakevenMonth + 1}` : "12+ months",
      growthRate: Math.round((growthMultiplier - 1) * 100),
    },
    milestones: [
      { month: 1, event: "MVP Launch", impact: "First 50 users acquired" },
      { month: 3, event: "Product-Market Fit", impact: "Retention rate >40%" },
      { month: 6, event: "Growth Inflection", impact: "Organic growth >30% MoM" },
      { month: 9, event: "Revenue Milestone", impact: `$${Math.round(monthlyData[8].revenue / 1000)}K MRR` },
      { month: 12, event: "Series A Ready", impact: `${finalMonth.users} users, $${Math.round(finalMonth.revenue * 12 / 1000)}K ARR` },
    ],
    landingPageMockup: {
      headline: input.idea ? `${input.idea.split(" ").slice(0, 5).join(" ")} — Reimagined` : "Your Vision, Realized",
      subheadline: `The ${input.model === "saas" ? "all-in-one platform" : "next-generation solution"} for ${input.market || "modern businesses"}`,
      cta: "Start Free Trial →",
      features: [
        "AI-Powered Intelligence",
        "Zero Learning Curve",
        "Enterprise-Grade Security",
        "24/7 Sovereign Processing",
      ],
      socialProof: `Trusted by ${Math.round(finalMonth.users * 2.5)}+ professionals worldwide`,
    },
  };
};

export const BusinessSimulator = () => {
  const [input, setInput] = useState<SimulationInput>({
    idea: "",
    market: "",
    investment: "$50,000",
    model: "saas",
  });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [activeView, setActiveView] = useState("growth");

  const runSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setResult(generateSimulation(input));
      setSimulating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Simulator Input */}
      <Card className="border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Business Simulator
          </CardTitle>
          <CardDescription>
            Enter your idea and instantly visualize a 12-month growth trajectory with financial projections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Idea *</label>
              <Textarea
                placeholder="Describe your business idea in 1-2 sentences..."
                value={input.idea}
                onChange={(e) => setInput(prev => ({ ...prev, idea: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Market</label>
                <Input
                  placeholder="e.g., Small businesses, Digital nomads..."
                  value={input.market}
                  onChange={(e) => setInput(prev => ({ ...prev, market: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Investment</label>
                <Input
                  placeholder="$50,000"
                  value={input.investment}
                  onChange={(e) => setInput(prev => ({ ...prev, investment: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business Model</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "saas", label: "SaaS", icon: Activity },
                { id: "marketplace", label: "Marketplace", icon: Globe },
                { id: "services", label: "Services", icon: Users },
              ].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setInput(prev => ({ ...prev, model: model.id }))}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    input.model === model.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <model.icon className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-sm font-medium">{model.label}</p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={runSimulation}
            disabled={!input.idea.trim() || simulating}
            size="lg"
            className="w-full gap-2"
          >
            {simulating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Simulating 12-month trajectory...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Run Simulation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* KPI Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users (Y1)", value: result.kpis.totalUsers.toLocaleString(), icon: Users, color: "text-blue-400" },
                { label: "ARR Projection", value: `$${(result.kpis.arr / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-green-400" },
                { label: "CAC", value: `$${result.kpis.cac}`, icon: Target, color: "text-orange-400" },
                { label: "Breakeven", value: result.kpis.breakeven, icon: TrendingUp, color: "text-primary" },
              ].map((kpi) => (
                <Card key={kpi.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                      <span className="text-xs text-muted-foreground">{kpi.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">12-Month Projection</CardTitle>
                  <Tabs value={activeView} onValueChange={setActiveView}>
                    <TabsList className="h-8">
                      <TabsTrigger value="growth" className="text-xs">Growth</TabsTrigger>
                      <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>
                      <TabsTrigger value="pnl" className="text-xs">P&L</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeView === "growth" ? (
                      <AreaChart data={result.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area type="monotone" dataKey="users" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </AreaChart>
                    ) : activeView === "revenue" ? (
                      <BarChart data={result.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="revenue" fill="hsl(120, 100%, 40%)" name="Revenue" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="costs" fill="hsl(0, 100%, 50%)" name="Costs" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={result.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(120, 100%, 40%)" strokeWidth={2} dot={false} name="Revenue" />
                        <Line type="monotone" dataKey="costs" stroke="hsl(0, 100%, 50%)" strokeWidth={2} dot={false} name="Costs" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Milestones Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Growth Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {result.milestones.map((milestone, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-4 relative"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shrink-0 z-10">
                          <span className="text-xs font-bold text-primary">{milestone.month}</span>
                        </div>
                        <div className="pb-1">
                          <p className="font-medium text-sm">{milestone.event}</p>
                          <p className="text-xs text-muted-foreground">{milestone.impact}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Landing Page Mockup */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Landing Page Preview
                </CardTitle>
                <CardDescription>Auto-generated based on your business idea</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-8 md:p-12 text-center border-t border-border">
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                    Now in Beta
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                    {result.landingPageMockup.headline}
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                    {result.landingPageMockup.subheadline}
                  </p>
                  <Button size="lg" className="gap-2 mb-8">
                    {result.landingPageMockup.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
                    {result.landingPageMockup.features.map((feature, i) => (
                      <div key={i} className="p-3 rounded-lg bg-card/50 border border-border/50">
                        <p className="text-sm font-medium">{feature}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {result.landingPageMockup.socialProof}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessSimulator;
