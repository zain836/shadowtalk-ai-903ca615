import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  unit: string;
  overage?: number;
  overageRate?: number;
}

interface BillingCycle {
  start: Date;
  end: Date;
  currentUsage: number;
  estimatedBill: number;
}

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  free: {
    messages: 50,
    imageGenerations: 5,
    codeExecutions: 10,
    webSearches: 20,
    voiceMinutes: 5,
    fileUploads: 10,
  },
  pro: {
    messages: 2000,
    imageGenerations: 100,
    codeExecutions: 200,
    webSearches: 500,
    voiceMinutes: 60,
    fileUploads: 100,
  },
  premium: {
    messages: 10000,
    imageGenerations: 500,
    codeExecutions: 1000,
    webSearches: 2000,
    voiceMinutes: 300,
    fileUploads: 500,
  },
  elite: {
    messages: Infinity,
    imageGenerations: Infinity,
    codeExecutions: Infinity,
    webSearches: Infinity,
    voiceMinutes: Infinity,
    fileUploads: Infinity,
  },
};

const OVERAGE_RATES: Record<string, number> = {
  messages: 0.01,
  imageGenerations: 0.10,
  codeExecutions: 0.05,
  webSearches: 0.02,
  voiceMinutes: 0.05,
  fileUploads: 0.03,
};

export function UsageBasedBilling() {
  const { userPlan } = useAuth();
  const [metrics, setMetrics] = useState<UsageMetric[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>({
    start: new Date(),
    end: new Date(),
    currentUsage: 0,
    estimatedBill: 0,
  });

  useEffect(() => {
    loadUsageData();
  }, [userPlan]);

  const loadUsageData = useCallback(async () => {
    const limits = PLAN_LIMITS[userPlan] || PLAN_LIMITS.free;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current month start
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch real usage data from usage_analytics for current billing cycle
    const { data: usageData } = await supabase
      .from('usage_analytics')
      .select('action_type')
      .eq('user_id', user.id)
      .gte('created_at', cycleStart.toISOString());

    // Count by action type
    const counts: Record<string, number> = {
      messages: 0,
      imageGenerations: 0,
      codeExecutions: 0,
      webSearches: 0,
      voiceMinutes: 0,
      fileUploads: 0,
    };

    const actionMap: Record<string, string> = {
      'message': 'messages',
      'chat_message': 'messages',
      'image_generation': 'imageGenerations',
      'code_execution': 'codeExecutions',
      'web_search': 'webSearches',
      'deep_research': 'webSearches',
      'voice_input': 'voiceMinutes',
      'voice_output': 'voiceMinutes',
      'file_upload': 'fileUploads',
    };

    (usageData || []).forEach(row => {
      const key = actionMap[row.action_type] || 'messages';
      counts[key] = (counts[key] || 0) + 1;
    });

    const newMetrics: UsageMetric[] = [
      { name: "AI Messages", used: counts.messages, limit: limits.messages, unit: "messages" },
      { name: "Image Generations", used: counts.imageGenerations, limit: limits.imageGenerations, unit: "images" },
      { name: "Code Executions", used: counts.codeExecutions, limit: limits.codeExecutions, unit: "runs" },
      { name: "Web Searches", used: counts.webSearches, limit: limits.webSearches, unit: "searches" },
      { name: "Voice Minutes", used: counts.voiceMinutes, limit: limits.voiceMinutes, unit: "min" },
      { name: "File Uploads", used: counts.fileUploads, limit: limits.fileUploads, unit: "files" },
    ];

    // Calculate overages
    newMetrics.forEach(metric => {
      if (metric.used > metric.limit && metric.limit !== Infinity) {
        metric.overage = metric.used - metric.limit;
        const key = Object.keys(limits).find(k => k.toLowerCase().includes(metric.name.toLowerCase().split(' ')[0]));
        metric.overageRate = key ? OVERAGE_RATES[key] : 0.01;
      }
    });

    setMetrics(newMetrics);

    const totalOverage = newMetrics.reduce((sum, m) => {
      return sum + (m.overage && m.overageRate ? m.overage * m.overageRate : 0);
    }, 0);

    setBillingCycle({
      start: cycleStart,
      end: cycleEnd,
      currentUsage: totalOverage,
      estimatedBill: totalOverage,
    });
  }, [userPlan]);

  const formatLimit = (limit: number): string => {
    if (limit === Infinity) return "Unlimited";
    return limit.toLocaleString();
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-primary";
  };

  const daysRemaining = Math.ceil((billingCycle.end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Billing Overview */}
      <Card className="bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Usage This Month
            </div>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {daysRemaining} days left
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground mb-1">Billing Period</p>
              <p className="font-semibold">
                {billingCycle.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {billingCycle.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
              <p className="font-semibold capitalize">{userPlan}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground mb-1">Overage Charges</p>
              <p className="font-semibold text-warning">${billingCycle.currentUsage.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-background/50">
              <p className="text-sm text-muted-foreground mb-1">Est. Total Bill</p>
              <p className="font-semibold gradient-text">${billingCycle.estimatedBill.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resource Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => {
              const percentage = metric.limit === Infinity ? 0 : (metric.used / metric.limit) * 100;
              const isOverLimit = metric.used > metric.limit && metric.limit !== Infinity;

              return (
                <div key={metric.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{metric.name}</span>
                      {isOverLimit && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Over Limit
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {metric.used.toLocaleString()} / {formatLimit(metric.limit)} {metric.unit}
                      </span>
                      {metric.overage && metric.overageRate && (
                        <Badge variant="outline" className="text-xs">
                          +${(metric.overage * metric.overageRate).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getUsageColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                    {isOverLimit && (
                      <div 
                        className="absolute top-0 right-0 h-full bg-destructive/50"
                        style={{ width: `${Math.min(((metric.overage || 0) / metric.limit) * 100, 50)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Suggestion */}
      {userPlan !== 'elite' && billingCycle.currentUsage > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">You're hitting your limits!</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to save ${(billingCycle.currentUsage * 0.8).toFixed(2)} in overage charges
                  </p>
                </div>
              </div>
              <Button className="gap-2">
                <Zap className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Elite Benefits */}
      {userPlan === 'elite' && (
        <Card className="border-success/50 bg-success/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium">Unlimited Usage Active</p>
                <p className="text-sm text-muted-foreground">
                  You have unlimited access to all features with your Elite plan
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
