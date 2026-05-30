import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Gift, Swords, Timer, 
  CheckCircle2, ArrowRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useEcoChallenges } from '@/hooks/useEcoChallenges';

interface CommunityChallengesProps {
  userProgress?: { actionsCompleted: number; co2Saved: number };
}

const CommunityChallenges: React.FC<CommunityChallengesProps> = () => {
  const { challenges, isLoading, setChallenges } = useEcoChallenges();

  const joinChallenge = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, joined: true, participants: c.participants + 1 } : c
      )
    );
    toast.success('🎯 Joined challenge! Complete eco actions in this category to contribute.');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">Community Challenges</span>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {challenges.filter((c) => c.joined).length} joined
        </Badge>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && challenges.map((challenge, i) => (
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

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {challenge.progress.toLocaleString()}/{challenge.target.toLocaleString()}
                  </span>
                  <span className="font-medium">
                    {challenge.target > 0
                      ? Math.min(100, Math.round((challenge.progress / challenge.target) * 100))
                      : 0}%
                  </span>
                </div>
                <Progress
                  value={challenge.target > 0 ? (challenge.progress / challenge.target) * 100 : 0}
                  className="h-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {challenge.participants.toLocaleString()} participants
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
