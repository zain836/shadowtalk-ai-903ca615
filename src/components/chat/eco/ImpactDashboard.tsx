import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Leaf, Droplets, Zap, TrendingUp, TreePine, Car, DollarSign, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ImpactData {
  co2Saved: number;
  waterSaved: number;
  energySaved: number;
  moneySaved: number;
  actionsCompleted: number;
  treesEquivalent: number;
  carsOffRoad: number;
}

interface ImpactHistory {
  date: string;
  co2: number;
  water: number;
  energy: number;
}

interface ImpactDashboardProps {
  impact: ImpactData;
  level: number;
  xp: number;
  streak: number;
}

const AnimatedCounter = ({ value, suffix = '', decimals = 1 }: { value: number; suffix?: string; decimals?: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(value, increment * step);
      setDisplay(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="tabular-nums font-bold">
      {display.toFixed(decimals)}{suffix}
    </span>
  );
};

const ProgressRing = ({ progress, size = 80, strokeWidth = 6, color }: { 
  progress: number; size?: number; strokeWidth?: number; color: string 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
};

const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ impact, level, xp, streak }) => {
  // Real history aggregated from eco_actions for the current user (last 7 days).
  const [history, setHistory] = useState<ImpactHistory[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Build 7 empty buckets keyed by weekday.
      const buckets: ImpactHistory[] = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en', { weekday: 'short' }),
        co2: 0,
        water: 0,
        energy: 0,
      }));

      if (!userId) {
        if (!cancelled) setHistory(buckets);
        return;
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data, error } = await supabase
        .from('eco_actions')
        .select('co2_saved, water_saved, energy_saved, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', sevenDaysAgo);

      if (!error && data) {
        data.forEach((row) => {
          const d = new Date(row.completed_at);
          const idx = 6 - Math.floor((Date.now() - d.getTime()) / 86400000);
          if (idx >= 0 && idx < 7) {
            buckets[idx].co2 += Number(row.co2_saved) || 0;
            buckets[idx].water += Number(row.water_saved) || 0;
            buckets[idx].energy += Number(row.energy_saved) || 0;
          }
        });
        buckets.forEach((b) => {
          b.co2 = +b.co2.toFixed(1);
          b.water = +b.water.toFixed(0);
          b.energy = +b.energy.toFixed(1);
        });
      }

      if (!cancelled) setHistory(buckets);
    })();
    return () => { cancelled = true; };
  }, [impact.actionsCompleted]);

  const pieData = [
    { name: 'CO₂', value: impact.co2Saved || 1, color: '#22c55e' },
    { name: 'Water', value: impact.waterSaved || 1, color: '#60a5fa' },
    { name: 'Energy', value: impact.energySaved || 1, color: '#facc15' },
  ];

  const stats = [
    { icon: Leaf, label: 'CO₂ Saved', value: impact.co2Saved, suffix: 'kg', color: 'text-green-500', ring: 'hsl(142, 71%, 45%)' },
    { icon: Droplets, label: 'Water Saved', value: impact.waterSaved, suffix: 'L', color: 'text-blue-400', ring: 'hsl(217, 91%, 60%)' },
    { icon: Zap, label: 'Energy Saved', value: impact.energySaved, suffix: 'kWh', color: 'text-yellow-400', ring: 'hsl(48, 96%, 53%)' },
    { icon: DollarSign, label: 'Money Saved', value: impact.moneySaved, suffix: '$', color: 'text-primary', ring: 'hsl(var(--primary))' },
  ];

  return (
    <div className="space-y-4">
      {/* Animated Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card/60 backdrop-blur-sm border-border/50 overflow-hidden relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <ProgressRing 
                      progress={Math.min(100, (stat.value / (stat.value + 50)) * 100)} 
                      size={56} strokeWidth={4} color={stat.ring} 
                    />
                    <stat.icon className={`h-5 w-5 ${stat.color} absolute`} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-lg ${stat.color}`}>
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Impact Trend Chart */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            7-Day Impact Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px' 
                }} 
              />
              <Area type="monotone" dataKey="co2" stroke="#22c55e" fill="url(#co2Gradient)" strokeWidth={2} />
              <Area type="monotone" dataKey="water" stroke="#60a5fa" fill="url(#waterGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Impact Distribution Pie */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Impact Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={45} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-medium">{d.value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-world equivalents */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3 text-center">
              <TreePine className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-500">{impact.treesEquivalent}</p>
              <p className="text-[10px] text-muted-foreground">Trees Equivalent</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3 text-center">
              <Car className="h-6 w-6 text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-400">{impact.carsOffRoad}</p>
              <p className="text-[10px] text-muted-foreground">Cars Off Road (days)</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
