import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  MessageSquare,
  BarChart3,
  Crown,
  Zap,
  MessageSquareHeart,
  ArrowRight,
} from "lucide-react";
import { adminQuickActions } from "./adminNav";
import type { LucideIcon } from "lucide-react";

export type AdminStats = {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  activeSubscribers: number;
  proSubscribers: number;
  eliteSubscribers: number;
  totalFeedback: number;
  pendingFeedback: number;
};

type Props = {
  stats: AdminStats;
  loading: boolean;
  onNavigate: (section: string) => void;
};

const StatCard = ({
  title,
  icon: Icon,
  loading,
  children,
}: {
  title: string;
  icon: LucideIcon;
  loading: boolean;
  children: React.ReactNode;
}) => (
  <Card className="bg-card border-border">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>{loading ? <Skeleton className="h-8 w-20" /> : children}</CardContent>
  </Card>
);

export function AdminDashboard({ stats, loading, onNavigate }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage ShadowTalk users, releases, monitoring, and platform configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total users" icon={Users} loading={loading}>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </StatCard>
        <StatCard title="Conversations" icon={MessageSquare} loading={loading}>
          <p className="text-2xl font-bold">{stats.totalConversations}</p>
        </StatCard>
        <StatCard title="Messages" icon={BarChart3} loading={loading}>
          <p className="text-2xl font-bold">{stats.totalMessages}</p>
        </StatCard>
        <StatCard title="Active subscribers" icon={Crown} loading={loading}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-bold">{stats.activeSubscribers}</p>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              {stats.proSubscribers} Pro
            </Badge>
            <Badge className="text-xs bg-gradient-primary">
              <Crown className="h-3 w-3 mr-1" />
              {stats.eliteSubscribers} Elite
            </Badge>
          </div>
        </StatCard>
      </div>

      {stats.pendingFeedback > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <MessageSquareHeart className="h-5 w-5 text-amber-500" />
              <p className="text-sm">
                <span className="font-semibold">{stats.pendingFeedback}</span> feedback items need review.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => onNavigate("feedback")}>
              Review now
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-3">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {adminQuickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.section}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start gap-2 text-left"
                onClick={() => onNavigate(action.section)}
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
