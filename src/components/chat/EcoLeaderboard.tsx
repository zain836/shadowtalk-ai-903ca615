import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, Leaf, Droplets, Zap, TrendingUp, Medal, Crown, Star, Users, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  level: number;
  totalImpact: {
    co2Saved: number;
    waterSaved: number;
    energySaved: number;
    moneySaved: number;
    actionsCompleted: number;
  };
  streak: number;
  badges: string[];
  rank: number;
}

interface EcoLeaderboardProps {
  currentUserId?: string;
}

const EcoLeaderboard: React.FC<EcoLeaderboardProps> = ({ currentUserId }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        // Calculate date range based on timeframe
        const now = new Date();
        let startDate: string | null = null;
        if (timeframe === 'weekly') {
          startDate = new Date(now.getTime() - 7 * 86400000).toISOString();
        } else if (timeframe === 'monthly') {
          startDate = new Date(now.getTime() - 30 * 86400000).toISOString();
        }

        // Fetch eco_stats for leaderboard rankings
        const { data: stats, error } = await supabase
          .from('eco_stats')
          .select('*')
          .order('co2_saved', { ascending: false })
          .limit(20);

        if (error) throw error;

        if (!stats || stats.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Fetch display names for all users
        const userIds = stats.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

        // Also fetch actions count filtered by timeframe
        let actionCounts = new Map<string, number>();
        if (startDate) {
          for (const stat of stats) {
            const { count } = await supabase
              .from('eco_actions')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', stat.user_id)
              .gte('completed_at', startDate);
            actionCounts.set(stat.user_id, count || 0);
          }
        }

        const entries: LeaderboardEntry[] = stats.map((stat, index) => {
          const displayName = profileMap.get(stat.user_id) || 'Anonymous';
          const isCurrentUser = stat.user_id === currentUserId;
          const actionsForPeriod = startDate ? (actionCounts.get(stat.user_id) || 0) : stat.actions_completed;

          // Determine badges based on stats
          const badges: string[] = [];
          if (stat.co2_saved > 100) badges.push('🌱');
          if (stat.water_saved > 500) badges.push('💧');
          if (stat.energy_saved > 50) badges.push('⚡');
          if (stat.streak > 7) badges.push('🔥');
          if (stat.level >= 10) badges.push('🏆');

          return {
            id: stat.user_id,
            username: isCurrentUser ? 'You' : displayName,
            avatar: displayName.slice(0, 2).toUpperCase(),
            level: stat.level,
            totalImpact: {
              co2Saved: Number(stat.co2_saved),
              waterSaved: Number(stat.water_saved),
              energySaved: Number(stat.energy_saved),
              moneySaved: Number(stat.money_saved),
              actionsCompleted: actionsForPeriod,
            },
            streak: stat.streak,
            badges,
            rank: index + 1,
          };
        });

        setLeaderboard(entries);
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [timeframe, currentUserId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2: return <Medal className="h-5 w-5 text-gray-300" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm text-muted-foreground font-mono">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-300/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
      default: return 'bg-card/50';
    }
  };

  // Calculate aggregate stats
  const totalCommunityImpact = leaderboard.reduce((acc, entry) => ({
    co2: acc.co2 + entry.totalImpact.co2Saved,
    water: acc.water + entry.totalImpact.waterSaved,
    energy: acc.energy + entry.totalImpact.energySaved,
    actions: acc.actions + entry.totalImpact.actionsCompleted,
  }), { co2: 0, water: 0, energy: 0, actions: 0 });

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            Eco Champions Leaderboard
          </CardTitle>
          <Badge variant="outline" className="gap-1 text-xs">
            <Users className="h-3 w-3" />
            {leaderboard.length} contributors
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Community Impact Summary */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
          <div className="text-center">
            <Leaf className="h-4 w-4 mx-auto text-success mb-1" />
            <p className="text-xs font-bold text-success">{totalCommunityImpact.co2.toFixed(0)}kg</p>
            <p className="text-[10px] text-muted-foreground">CO₂</p>
          </div>
          <div className="text-center">
            <Droplets className="h-4 w-4 mx-auto text-blue-400 mb-1" />
            <p className="text-xs font-bold text-blue-400">{(totalCommunityImpact.water / 1000).toFixed(1)}k L</p>
            <p className="text-[10px] text-muted-foreground">Water</p>
          </div>
          <div className="text-center">
            <Zap className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
            <p className="text-xs font-bold text-yellow-400">{totalCommunityImpact.energy.toFixed(0)}kWh</p>
            <p className="text-[10px] text-muted-foreground">Energy</p>
          </div>
          <div className="text-center">
            <Star className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-bold text-primary">{totalCommunityImpact.actions}</p>
            <p className="text-[10px] text-muted-foreground">Actions</p>
          </div>
        </div>

        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
            <TabsTrigger value="alltime" className="text-xs">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={timeframe} className="mt-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No eco-actions recorded yet. Be the first!
              </p>
            ) : (
              leaderboard.slice(0, 10).map((entry) => (
                <div 
                  key={entry.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border transition-all hover:scale-[1.02] ${
                    getRankStyle(entry.rank)
                  } ${entry.username === 'You' ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-xs ${
                      entry.rank === 1 ? 'bg-yellow-500 text-yellow-950' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-800' :
                      entry.rank === 3 ? 'bg-amber-600 text-amber-50' :
                      'bg-primary/20'
                    }`}>
                      {entry.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${
                        entry.username === 'You' ? 'text-primary' : ''
                      }`}>
                        {entry.username}
                      </p>
                      <Badge variant="secondary" className="text-[10px] px-1 h-4">
                        Lv.{entry.level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Leaf className="h-3 w-3 text-success" />
                        {entry.totalImpact.co2Saved}kg
                      </span>
                      <span>•</span>
                      <span>{entry.streak}🔥</span>
                      <span className="flex gap-0.5">
                        {entry.badges.slice(0, 3).map((b, i) => (
                          <span key={i}>{b}</span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">
                      {entry.totalImpact.actionsCompleted}
                    </p>
                    <p className="text-[10px] text-muted-foreground">actions</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center">
          Complete eco-actions to climb the leaderboard!
        </p>
      </CardContent>
    </Card>
  );
};

export default EcoLeaderboard;
