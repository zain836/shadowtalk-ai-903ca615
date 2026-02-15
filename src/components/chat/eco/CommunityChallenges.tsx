import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, Users, Clock, Gift, Trophy, Swords, Timer, 
  CheckCircle2, ArrowRight, Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  reward: string;
  xpReward: number;
  endsAt: string;
  participants: number;
  category: 'energy' | 'water' | 'transport' | 'community' | 'waste';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  joined: boolean;
  timeLeft: string;
}

interface CommunityChallengesProps {
  userProgress?: { actionsCompleted: number; co2Saved: number };
}

const CommunityChallenges: React.FC<CommunityChallengesProps> = ({ userProgress }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: '1', name: '🌍 Zero Waste Week', description: 'Reduce waste by completing 5 waste-related actions this week',
      target: 5, progress: 2, reward: 'Gold Badge + 500 XP', xpReward: 500,
      endsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      participants: 1847, category: 'waste', difficulty: 'Medium', joined: true,
      timeLeft: '5 days',
    },
    {
      id: '2', name: '⚡ Energy Saver Sprint', description: 'Community goal: Save 10,000 kWh collectively this month',
      target: 10000, progress: 6234, reward: 'Platinum Badge + 1000 XP', xpReward: 1000,
      endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      participants: 3421, category: 'energy', difficulty: 'Hard', joined: false,
      timeLeft: '14 days',
    },
    {
      id: '3', name: '🚶 Walk More Week', description: 'Replace 3 car trips with walking or cycling',
      target: 3, progress: 0, reward: 'Silver Badge + 250 XP', xpReward: 250,
      endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      participants: 982, category: 'transport', difficulty: 'Easy', joined: false,
      timeLeft: '7 days',
    },
    {
      id: '4', name: '💧 Water Conservation Month', description: 'Save 500L of water through daily micro-actions',
      target: 500, progress: 120, reward: 'Eco Hero Title + 750 XP', xpReward: 750,
      endsAt: new Date(Date.now() + 21 * 86400000).toISOString(),
      participants: 2156, category: 'water', difficulty: 'Medium', joined: true,
      timeLeft: '21 days',
    },
  ]);

  const joinChallenge = (id: string) => {
    setChallenges(prev => prev.map(c =>
      c.id === id ? { ...c, joined: true, participants: c.participants + 1 } : c
    ));
    toast.success('🎯 Joined challenge! Complete actions to contribute.');
  };

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'Easy': return 'text-green-500 border-green-500/30 bg-green-500/10';
      case 'Medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'Hard': return 'text-red-500 border-red-500/30 bg-red-500/10';
      default: return '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Active Challenges Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">Community Challenges</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {challenges.filter(c => c.joined).length} joined
        </Badge>
      </div>

      {/* Challenge Cards */}
      {challenges.map((challenge, i) => (
        <motion.div
          key={challenge.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className={`border transition-all ${
            challenge.joined 
              ? 'border-primary/30 bg-primary/5' 
              : 'border-border/50 hover:border-primary/20'
          }`}>
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{challenge.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </Badge>
                    {challenge.joined && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Joined
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {challenge.progress.toLocaleString()}/{challenge.target.toLocaleString()}
                  </span>
                  <span className="font-medium">{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                </div>
                <Progress value={(challenge.progress / challenge.target) * 100} className="h-2" />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {challenge.participants.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" /> {challenge.timeLeft}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gift className="h-3 w-3" /> {challenge.reward}
                  </span>
                </div>
                {!challenge.joined && (
                  <Button size="sm" variant="outline" onClick={() => joinChallenge(challenge.id)} className="text-xs gap-1">
                    Join <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default CommunityChallenges;
