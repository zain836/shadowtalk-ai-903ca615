import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  MessageSquare,
  Clock,
  Zap,
  TrendingUp,
  Calendar,
  Target,
  Brain,
  X
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface AnalyticsDashboardProps {
  onClose: () => void;
  messageCount: number;
  conversationCount: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onClose,
  messageCount,
  conversationCount,
}) => {
  const { user, subscriptionEnd } = useAuth();
  const [stats, setStats] = useState({
    totalMessages: messageCount,
    totalConversations: conversationCount,
    avgResponseTime: 1.2,
    tokensUsed: Math.floor(messageCount * 150),
    peakHour: 14,
    topModes: ['General', 'Code', 'Explain'],
    weeklyGrowth: 23,
    productivityScore: 87,
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = [12, 8, 15, 22, 18, 5, 8];
  const maxWeekly = Math.max(...weeklyData);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Analytics Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground">Your AI usage insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
              Elite Feature
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <MessageSquare className="h-4 w-4" />
                  Total Messages
                </div>
                <p className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</p>
                <p className="text-xs text-success flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.weeklyGrowth}% this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  Avg Response
                </div>
                <p className="text-2xl font-bold">{stats.avgResponseTime}s</p>
                <p className="text-xs text-muted-foreground mt-1">Faster than average</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Zap className="h-4 w-4" />
                  Tokens Used
                </div>
                <p className="text-2xl font-bold">{(stats.tokensUsed / 1000).toFixed(1)}K</p>
                <p className="text-xs text-muted-foreground mt-1">This billing cycle</p>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Target className="h-4 w-4" />
                  Productivity
                </div>
                <p className="text-2xl font-bold">{stats.productivityScore}%</p>
                <Progress value={stats.productivityScore} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity Chart */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {weeklyData.map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${(value / maxWeekly) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-muted-foreground">{weekDays[index]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mode Usage & Insights */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Top Chat Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.topModes.map((mode, index) => (
                  <div key={mode} className="flex items-center justify-between">
                    <span className="text-sm">{mode}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={100 - index * 25} className="w-24 h-2" />
                      <span className="text-xs text-muted-foreground w-8">
                        {100 - index * 25}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Usage Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Peak usage at <strong className="text-foreground">{stats.peakHour}:00</strong></p>
                <p>• <strong className="text-foreground">{stats.totalConversations}</strong> total conversations</p>
                <p>• Average <strong className="text-foreground">{Math.round(stats.totalMessages / Math.max(stats.totalConversations, 1))}</strong> messages per chat</p>
                {subscriptionEnd && (
                  <p>• Billing cycle ends <strong className="text-foreground">{new Date(subscriptionEnd).toLocaleDateString()}</strong></p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
