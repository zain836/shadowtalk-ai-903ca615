import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Leaf, 
  Droplets, 
  Zap as Lightning,
  Trophy,
  Target,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  Loader2,
  Flame,
  Gift,
  Share2,
  BarChart3,
  Calendar,
  Award,
  Star,
  Thermometer,
  Wind,
  Sun,
  CloudRain,
  Recycle,
  Car,
  Utensils,
  Home,
  Lightbulb,
  RefreshCw,
  TreePine,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import EcoLeaderboard from './EcoLeaderboard';

interface EcoAction {
  id: string;
  title: string;
  description: string;
  impact: {
    co2Saved: number;
    waterSaved: number;
    energySaved: number;
    moneySaved: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'energy' | 'water' | 'transport' | 'food' | 'waste' | 'home' | 'community';
  eroi: number;
  timeRequired: string;
  completed: boolean;
  recurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  tips?: string[];
  localBonus?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  progress: number;
  requirement: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  reward: string;
  endsAt: string;
  participants: number;
}

interface PlanetaryActionPanelProps {
  onGetActions: (location: string) => Promise<EcoAction[]>;
  isLoading: boolean;
}

const PlanetaryActionPanel: React.FC<PlanetaryActionPanelProps> = ({
  onGetActions,
  isLoading
}) => {
  const { user } = useAuth();
  const [location, setLocation] = useState('');
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [actions, setActions] = useState<EcoAction[]>([]);
  const [activeTab, setActiveTab] = useState('actions');
  const [totalImpact, setTotalImpact] = useState({
    co2Saved: 0,
    waterSaved: 0,
    energySaved: 0,
    moneySaved: 0,
    actionsCompleted: 0,
    treesEquivalent: 0,
    carsOffRoad: 0,
  });
  const [badges, setBadges] = useState<Badge[]>([
    { id: '1', name: 'Carbon Pioneer', description: 'Save 10kg of CO2', icon: '🌱', earned: false, progress: 0, requirement: 10, tier: 'bronze' },
    { id: '2', name: 'Water Guardian', description: 'Save 100L of water', icon: '💧', earned: false, progress: 0, requirement: 100, tier: 'bronze' },
    { id: '3', name: 'Energy Hero', description: 'Save 50kWh of energy', icon: '⚡', earned: false, progress: 0, requirement: 50, tier: 'bronze' },
    { id: '4', name: 'Eco Champion', description: 'Complete 10 actions', icon: '🏆', earned: false, progress: 0, requirement: 10, tier: 'silver' },
    { id: '5', name: 'Local Legend', description: 'Complete 5 high-EROI actions', icon: '🌍', earned: false, progress: 0, requirement: 5, tier: 'gold' },
    { id: '6', name: 'Streak Master', description: 'Maintain a 7-day streak', icon: '🔥', earned: false, progress: 0, requirement: 7, tier: 'silver' },
    { id: '7', name: 'Community Leader', description: 'Share 10 achievements', icon: '👥', earned: false, progress: 0, requirement: 10, tier: 'gold' },
    { id: '8', name: 'Planet Protector', description: 'Save 100kg CO2', icon: '🌎', earned: false, progress: 0, requirement: 100, tier: 'platinum' },
  ]);
  const [challenges, setChallenges] = useState<Challenge[]>([
    { id: '1', name: 'Winter Energy Challenge', description: 'Reduce energy consumption by 20%', target: 100, progress: 45, reward: '500 XP + Gold Badge', endsAt: '2026-02-01', participants: 1234 },
    { id: '2', name: 'No-Car Week', description: 'Use alternative transport for a week', target: 7, progress: 3, reward: '300 XP + Silver Badge', endsAt: '2026-01-21', participants: 567 },
  ]);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState({ target: 10, completed: 0 });
  const [carbonOffset, setCarbonOffset] = useState({ monthly: 0, yearly: 0 });
  const [weatherData, setWeatherData] = useState<{ temp: number; condition: string } | null>(null);
  const [localGrid, setLocalGrid] = useState<{ renewable: number; peak: boolean } | null>(null);

  const xpToNextLevel = level * 100;

  // Auto-detect location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // In production, you'd use a geocoding API
            setDetectedLocation('Your Location');
            // Simulate weather data
            setWeatherData({ temp: 12, condition: 'partly_cloudy' });
            // Simulate grid data
            setLocalGrid({ renewable: 65, peak: false });
          } catch (e) {
            console.error('Location detection failed:', e);
          }
        },
        () => {
          console.log('Location permission denied');
        }
      );
    }
  }, []);

  // Load saved progress
  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;
    
    try {
      const { data: stats } = await supabase
        .from('eco_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (stats) {
        setTotalImpact({
          co2Saved: stats.co2_saved || 0,
          waterSaved: stats.water_saved || 0,
          energySaved: stats.energy_saved || 0,
          moneySaved: stats.money_saved || 0,
          actionsCompleted: stats.actions_completed || 0,
          treesEquivalent: Math.floor((stats.co2_saved || 0) / 21),
          carsOffRoad: Math.floor((stats.co2_saved || 0) / 4600),
        });
        setLevel(stats.level || 1);
        setXp(stats.xp || 0);
        setStreak(stats.streak || 0);
      }

      // Load badges
      const { data: earnedBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);
      
      if (earnedBadges) {
        setBadges(prev => prev.map(badge => ({
          ...badge,
          earned: earnedBadges.some(eb => eb.badge_id === badge.id)
        })));
      }
    } catch (error) {
      console.error('Failed to load eco progress:', error);
    }
  };

  const fetchActions = async () => {
    const locationToUse = location.trim() || detectedLocation;
    if (!locationToUse) {
      toast.error('Please enter your location or enable location detection');
      return;
    }

    try {
      const newActions = await onGetActions(locationToUse);
      
      // Enhance actions with local context
      const enhancedActions = newActions.map(action => ({
        ...action,
        localBonus: localGrid?.renewable && localGrid.renewable > 50 && action.category === 'energy' 
          ? 1.2 
          : 1,
        tips: generateTips(action, weatherData),
      }));
      
      setActions(enhancedActions);
    } catch (error) {
      toast.error('Failed to get eco-actions');
    }
  };

  const generateTips = (action: EcoAction, weather: typeof weatherData): string[] => {
    const tips: string[] = [];
    
    if (action.category === 'energy' && weather) {
      if (weather.temp < 15) {
        tips.push('Layer up instead of turning up the heat');
      }
      if (weather.condition === 'sunny') {
        tips.push('Great day to use natural light instead of artificial');
      }
    }
    
    if (action.category === 'transport') {
      if (weather?.condition !== 'rainy') {
        tips.push('Perfect weather for biking or walking');
      }
    }
    
    return tips;
  };

  const completeAction = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action || action.completed) return;

    // Apply local bonus
    const bonus = action.localBonus || 1;
    const actualImpact = {
      co2Saved: action.impact.co2Saved * bonus,
      waterSaved: action.impact.waterSaved * bonus,
      energySaved: action.impact.energySaved * bonus,
      moneySaved: action.impact.moneySaved * bonus,
    };

    // Update action status
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, completed: true } : a
    ));

    // Update total impact
    const newTotalImpact = {
      co2Saved: totalImpact.co2Saved + actualImpact.co2Saved,
      waterSaved: totalImpact.waterSaved + actualImpact.waterSaved,
      energySaved: totalImpact.energySaved + actualImpact.energySaved,
      moneySaved: totalImpact.moneySaved + actualImpact.moneySaved,
      actionsCompleted: totalImpact.actionsCompleted + 1,
      treesEquivalent: Math.floor((totalImpact.co2Saved + actualImpact.co2Saved) / 21),
      carsOffRoad: Math.floor((totalImpact.co2Saved + actualImpact.co2Saved) / 4600 * 365),
    };
    setTotalImpact(newTotalImpact);

    // Update weekly goal
    setWeeklyGoal(prev => ({ ...prev, completed: prev.completed + 1 }));

    // Update carbon offset
    setCarbonOffset(prev => ({
      monthly: prev.monthly + actualImpact.co2Saved,
      yearly: prev.yearly + actualImpact.co2Saved,
    }));

    // Calculate XP with bonuses
    let xpGained = action.eroi * 10;
    if (bonus > 1) xpGained = Math.floor(xpGained * bonus);
    if (action.difficulty === 'hard') xpGained += 20;
    
    setXp(prev => {
      const newXp = prev + xpGained;
      if (newXp >= xpToNextLevel) {
        setLevel(l => l + 1);
        toast.success(`🎉 Level Up! You're now level ${level + 1}!`, {
          description: 'Keep making a difference!',
        });
        return newXp - xpToNextLevel;
      }
      return newXp;
    });

    // Update badges
    setBadges(prev => prev.map(badge => {
      let newProgress = badge.progress;
      
      switch (badge.id) {
        case '1':
        case '8':
          newProgress = newTotalImpact.co2Saved;
          break;
        case '2':
          newProgress = newTotalImpact.waterSaved;
          break;
        case '3':
          newProgress = newTotalImpact.energySaved;
          break;
        case '4':
          newProgress = newTotalImpact.actionsCompleted;
          break;
        case '5':
          if (action.eroi >= 7) {
            newProgress = badge.progress + 1;
          }
          break;
        case '6':
          newProgress = streak;
          break;
      }

      const earned = newProgress >= badge.requirement;
      if (earned && !badge.earned) {
        toast.success(`🏅 Badge Earned: ${badge.name}!`, {
          description: badge.description,
        });
        // Save badge to database
        if (user) {
          supabase.from('user_badges').insert({
            user_id: user.id,
            badge_id: badge.id,
            badge_name: badge.name,
            badge_icon: badge.icon,
          });
        }
      }

      return { ...badge, progress: newProgress, earned };
    }));

    // Update streak
    setStreak(prev => prev + 1);

    // Save to database
    if (user) {
      await supabase.from('eco_actions').insert({
        user_id: user.id,
        title: action.title,
        description: action.description,
        category: action.category,
        co2_saved: actualImpact.co2Saved,
        water_saved: actualImpact.waterSaved,
        energy_saved: actualImpact.energySaved,
        money_saved: actualImpact.moneySaved,
        eroi: action.eroi,
      });

      await supabase.from('eco_stats').upsert({
        user_id: user.id,
        co2_saved: newTotalImpact.co2Saved,
        water_saved: newTotalImpact.waterSaved,
        energy_saved: newTotalImpact.energySaved,
        money_saved: newTotalImpact.moneySaved,
        actions_completed: newTotalImpact.actionsCompleted,
        level: level,
        xp: xp,
        streak: streak + 1,
        last_action_date: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }
    
    toast.success(`+${xpGained} XP! ${bonus > 1 ? `(${Math.round((bonus - 1) * 100)}% local bonus!)` : ''}`, {
      description: `Saved ${actualImpact.co2Saved.toFixed(1)}kg CO₂`,
    });
  };

  const shareAchievement = async (type: 'badge' | 'milestone', data: any) => {
    const text = type === 'badge' 
      ? `🏅 I just earned the "${data.name}" badge on ShadowTalk's Planetary Action Guide!`
      : `🌍 I've saved ${data.co2}kg of CO₂ - equivalent to ${data.trees} trees planted!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Eco Achievement',
          text,
          url: window.location.href,
        });
        setBadges(prev => prev.map(b => 
          b.id === '7' ? { ...b, progress: b.progress + 1 } : b
        ));
        toast.success('Achievement shared!');
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
  };

  const getEROIColor = (eroi: number) => {
    if (eroi >= 8) return 'text-green-500';
    if (eroi >= 5) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'energy': return <Lightning className="h-4 w-4" />;
      case 'water': return <Droplets className="h-4 w-4" />;
      case 'transport': return <Car className="h-4 w-4" />;
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'waste': return <Recycle className="h-4 w-4" />;
      case 'home': return <Home className="h-4 w-4" />;
      case 'community': return <Globe className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'partly_cloudy': return <Sun className="h-4 w-4 text-yellow-400" />;
      case 'rainy': return <CloudRain className="h-4 w-4 text-blue-400" />;
      default: return <Wind className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-700';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-cyan-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Level & XP with Weather Context */}
      <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              <span className="font-bold">Level {level}</span>
              <Badge variant="secondary">{streak} day streak 🔥</Badge>
            </div>
            <div className="flex items-center gap-3">
              {weatherData && (
                <div className="flex items-center gap-1 text-sm">
                  {getWeatherIcon(weatherData.condition)}
                  <span>{weatherData.temp}°C</span>
                </div>
              )}
              {localGrid && (
                <Badge variant={localGrid.renewable > 50 ? "default" : "secondary"} className="gap-1">
                  <Lightning className="h-3 w-3" />
                  {localGrid.renewable}% renewable
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">{xp}/{xpToNextLevel} XP</span>
            </div>
          </div>
          <Progress value={(xp / xpToNextLevel) * 100} className="h-2" />
          
          {/* Weekly Goal */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekly Goal</span>
            <div className="flex items-center gap-2">
              <Progress value={(weeklyGoal.completed / weeklyGoal.target) * 100} className="w-24 h-1.5" />
              <span className="font-medium">{weeklyGoal.completed}/{weeklyGoal.target}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Stats - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="bg-card/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                <p className="font-bold text-green-500">{totalImpact.co2Saved.toFixed(1)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs text-muted-foreground">Water Saved</p>
                <p className="font-bold text-blue-400">{totalImpact.waterSaved.toFixed(0)} L</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <TreePine className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Trees Equivalent</p>
                <p className="font-bold text-green-600">{totalImpact.treesEquivalent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Money Saved</p>
                <p className="font-bold text-primary">${totalImpact.moneySaved.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="actions" className="text-xs gap-1">
            <Target className="h-3 w-3" /> Actions
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-xs gap-1">
            <Award className="h-3 w-3" /> Badges
          </TabsTrigger>
          <TabsTrigger value="challenges" className="text-xs gap-1">
            <Flame className="h-3 w-3" /> Challenges
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs gap-1">
            <Trophy className="h-3 w-3" /> Leaders
          </TabsTrigger>
        </TabsList>

        {/* Actions Tab */}
        <TabsContent value="actions" className="mt-4 space-y-4">
          {/* Location Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={detectedLocation || "Enter your city or zip code..."}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchActions()}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchActions} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Actions'}
            </Button>
          </div>

          {/* Grid Status Alert */}
          {localGrid && !localGrid.peak && localGrid.renewable > 50 && (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Lightbulb className="h-4 w-4 text-green-500" />
              <p className="text-xs text-green-600">
                <span className="font-medium">Green Grid Alert:</span> Your local grid is {localGrid.renewable}% renewable right now - great time for energy-intensive tasks!
              </p>
            </div>
          )}

          {/* Action List */}
          <ScrollArea className="h-[400px]">
            {actions.length === 0 ? (
              <Card className="bg-card/30">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Enter your location to get personalized eco-actions</p>
                  <p className="text-xs mt-1">Actions are tailored to your local weather, grid, and infrastructure</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {actions.sort((a, b) => b.eroi - a.eroi).map(action => (
                  <Card 
                    key={action.id} 
                    className={`transition-all ${action.completed ? 'opacity-60 border-green-500' : ''}`}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="gap-1">
                              {getCategoryIcon(action.category)}
                              {action.category}
                            </Badge>
                            <Badge className={`${getEROIColor(action.eroi)} bg-transparent border`}>
                              EROI: {action.eroi}/10
                            </Badge>
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Clock className="h-3 w-3" />
                              {action.timeRequired}
                            </Badge>
                            {action.localBonus && action.localBonus > 1 && (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                                <Sparkles className="h-3 w-3" />
                                +{Math.round((action.localBonus - 1) * 100)}% local bonus
                              </Badge>
                            )}
                            {action.recurring && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <RefreshCw className="h-3 w-3" />
                                {action.frequency}
                              </Badge>
                            )}
                          </div>
                          
                          <p className={`text-sm font-medium ${action.completed ? 'line-through' : ''}`}>
                            {action.title}
                          </p>
                          
                          <p className="text-xs text-muted-foreground">
                            {action.description}
                          </p>

                          {/* Tips */}
                          {action.tips && action.tips.length > 0 && !action.completed && (
                            <div className="flex items-start gap-1 text-xs text-primary">
                              <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>{action.tips[0]}</span>
                            </div>
                          )}
                          
                          <div className="flex gap-3 text-xs">
                            <span className="text-green-500">🌱 {action.impact.co2Saved}kg CO₂</span>
                            <span className="text-blue-400">💧 {action.impact.waterSaved}L</span>
                            <span className="text-yellow-400">⚡ {action.impact.energySaved}kWh</span>
                            <span className="text-primary">💰 ${action.impact.moneySaved}</span>
                          </div>
                        </div>
                        
                        <Button 
                          variant={action.completed ? "ghost" : "default"}
                          size="sm"
                          onClick={() => completeAction(action.id)}
                          disabled={action.completed}
                          className="shrink-0"
                        >
                          {action.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1" />
                              Complete
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {badges.map(badge => (
              <Card 
                key={badge.id}
                className={`transition-all ${badge.earned ? 'border-primary' : 'opacity-60 grayscale'}`}
              >
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{badge.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-sm truncate">{badge.name}</p>
                        {badge.tier && (
                          <Star className={`h-3 w-3 ${getTierColor(badge.tier)}`} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                      {!badge.earned && (
                        <div className="mt-1">
                          <Progress value={(badge.progress / badge.requirement) * 100} className="h-1" />
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {badge.progress}/{badge.requirement}
                          </p>
                        </div>
                      )}
                    </div>
                    {badge.earned && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => shareAchievement('badge', badge)}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="mt-4 space-y-3">
          {challenges.map(challenge => (
            <Card key={challenge.id} className="border-warning/30">
              <CardContent className="py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-warning" />
                      <p className="font-medium">{challenge.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                    <div className="mt-2">
                      <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
                      <div className="flex justify-between text-xs mt-1">
                        <span>{challenge.progress}/{challenge.target}</span>
                        <span className="text-muted-foreground">Ends {new Date(challenge.endsAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      <Gift className="h-3 w-3 mr-1" />
                      {challenge.reward}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{challenge.participants} joined</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-4">
          <EcoLeaderboard currentUserId={user?.id} />
        </TabsContent>
      </Tabs>

      {/* Share Overall Progress */}
      {totalImpact.actionsCompleted > 0 && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => shareAchievement('milestone', { 
            co2: totalImpact.co2Saved.toFixed(1), 
            trees: totalImpact.treesEquivalent 
          })}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share My Impact
        </Button>
      )}
    </div>
  );
};

export default PlanetaryActionPanel;
