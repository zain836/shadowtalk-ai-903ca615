import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Award, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImpactComparisonProps {
  co2Saved: number;
  actionsCompleted: number;
  streak: number;
  level: number;
}

const getPercentile = (value: number, avg: number): number => {
  if (value <= 0) return 0;
  // Simple sigmoid-based percentile estimation
  const ratio = value / Math.max(avg, 1);
  const percentile = Math.min(99, Math.floor(100 / (1 + Math.exp(-2 * (ratio - 1)))));
  return Math.max(1, percentile);
};

const ImpactComparison: React.FC<ImpactComparisonProps> = ({ co2Saved, actionsCompleted, streak, level }) => {
  // Simulated community averages
  const communityAvg = { co2: 25, actions: 8, streak: 4, level: 3 };

  const comparisons = [
    {
      label: 'CO₂ Savings',
      percentile: getPercentile(co2Saved, communityAvg.co2),
      yours: `${co2Saved.toFixed(1)}kg`,
      avg: `${communityAvg.co2}kg`,
      better: co2Saved > communityAvg.co2,
    },
    {
      label: 'Actions Done',
      percentile: getPercentile(actionsCompleted, communityAvg.actions),
      yours: `${actionsCompleted}`,
      avg: `${communityAvg.actions}`,
      better: actionsCompleted > communityAvg.actions,
    },
    {
      label: 'Streak',
      percentile: getPercentile(streak, communityAvg.streak),
      yours: `${streak} days`,
      avg: `${communityAvg.streak} days`,
      better: streak > communityAvg.streak,
    },
  ];

  const overallPercentile = Math.round(
    comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length
  );

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Your Impact vs Community</span>
          </div>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Award className="h-3 w-3" />
            Top {100 - overallPercentile}%
          </Badge>
        </div>

        {/* Overall Percentile Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg"
        >
          <p className="text-3xl font-black text-primary">{overallPercentile}th</p>
          <p className="text-xs text-muted-foreground">percentile overall</p>
          {overallPercentile > 50 && (
            <p className="text-[10px] text-green-500 mt-1 flex items-center justify-center gap-1">
              <ArrowUp className="h-3 w-3" />
              You're doing better than {overallPercentile}% of eco warriors!
            </p>
          )}
        </motion.div>

        {/* Individual Comparisons */}
        <div className="space-y-2">
          {comparisons.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className={c.better ? 'text-green-500' : 'text-muted-foreground'}>
                    {c.yours} vs avg {c.avg}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.better ? 'bg-green-500' : 'bg-yellow-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.percentile}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.15 }}
                  />
                </div>
              </div>
              <span className={`text-xs font-bold min-w-[40px] text-right ${c.better ? 'text-green-500' : 'text-yellow-500'}`}>
                {c.percentile}%
              </span>
            </motion.div>
          ))}
        </div>

        {overallPercentile < 50 && (
          <p className="text-xs text-center text-muted-foreground">
            Complete more actions to climb the ranks! 💪
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ImpactComparison;
