import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Zap, Star, Crown, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakSystemProps {
  streak: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

const getStreakMultiplier = (streak: number) => {
  if (streak >= 30) return { mult: 3.0, label: 'Legendary', icon: Crown, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30' };
  if (streak >= 14) return { mult: 2.0, label: 'Epic', icon: Star, color: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' };
  if (streak >= 7) return { mult: 1.5, label: 'Great', icon: Flame, color: 'text-orange-400', bg: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30' };
  if (streak >= 3) return { mult: 1.25, label: 'Nice', icon: Zap, color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' };
  return { mult: 1.0, label: 'Building', icon: Trophy, color: 'text-muted-foreground', bg: 'from-muted/20 to-muted/10', border: 'border-border' };
};

const StreakSystem: React.FC<StreakSystemProps> = ({ streak, level, xp, xpToNextLevel }) => {
  const streakInfo = getStreakMultiplier(streak);
  const StreakIcon = streakInfo.icon;

  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak) || streak + 10;

  return (
    <Card className={`bg-gradient-to-r ${streakInfo.bg} ${streakInfo.border} overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Streak Counter with Fire Animation */}
          <div className="flex items-center gap-3">
            <motion.div
              className="relative"
              animate={streak > 0 ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${streakInfo.bg} flex items-center justify-center border-2 ${streakInfo.border}`}>
                <span className="text-2xl font-black">{streak}</span>
              </div>
              {streak >= 3 && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Flame className={`h-5 w-5 ${streakInfo.color}`} />
                </motion.div>
              )}
              {streak >= 14 && (
                <motion.div
                  className="absolute -top-2 -left-1"
                  animate={{ rotate: [0, -15, 15, 0], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                >
                  <Flame className={`h-4 w-4 ${streakInfo.color} opacity-60`} />
                </motion.div>
              )}
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Day Streak</span>
                <Badge variant="secondary" className={`text-[10px] ${streakInfo.color} bg-transparent border ${streakInfo.border}`}>
                  <StreakIcon className="h-3 w-3 mr-1" />
                  {streakInfo.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {streakInfo.mult > 1 ? `${streakInfo.mult}x XP multiplier active!` : `${nextMilestone - streak} days to next bonus`}
              </p>
            </div>
          </div>

          {/* Multiplier Badge */}
          {streakInfo.mult > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`text-center px-3 py-1.5 rounded-lg bg-gradient-to-br ${streakInfo.bg} border ${streakInfo.border}`}
            >
              <p className={`text-lg font-black ${streakInfo.color}`}>{streakInfo.mult}x</p>
              <p className="text-[9px] text-muted-foreground">XP Boost</p>
            </motion.div>
          )}
        </div>

        {/* Milestone Progress */}
        <div className="mt-3 flex items-center gap-1">
          {milestones.map(m => (
            <div key={m} className="flex-1 flex flex-col items-center">
              <div className={`w-full h-1.5 rounded-full ${streak >= m ? 'bg-primary' : 'bg-muted'}`} />
              <span className={`text-[9px] mt-1 ${streak >= m ? streakInfo.color : 'text-muted-foreground'}`}>{m}d</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export { getStreakMultiplier };
export default StreakSystem;
