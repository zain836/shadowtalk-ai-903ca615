import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Eye, EyeOff, Lock, Fingerprint, Cookie, 
  Activity, TrendingUp, Zap, Brain, Server, Wifi, WifiOff,
  ArrowLeft, AlertTriangle, CheckCircle2, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SEOHead } from '@/components/SEOHead';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { usePrivacyScore } from '@/hooks/usePrivacyScore';
import { cn } from '@/lib/utils';

const PrivacyScorePage = () => {
  const navigate = useNavigate();
  const { score } = usePrivacyScore();
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setAnimatedScore(prev => {
          if (prev >= score.overall) {
            clearInterval(interval);
            return score.overall;
          }
          return prev + 1;
        });
      }, 20);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, [score.overall]);

  const getScoreColor = () => {
    if (score.overall >= 90) return 'text-primary';
    if (score.overall >= 70) return 'text-green-500';
    if (score.overall >= 50) return 'text-amber-500';
    return 'text-destructive';
  };

  const getLevelConfig = () => {
    switch (score.level) {
      case 'sovereign':
        return { label: 'Sovereign', color: 'bg-primary/20 text-primary border-primary/40', icon: <Shield className="h-4 w-4" /> };
      case 'protected':
        return { label: 'Protected', color: 'bg-green-500/20 text-green-500 border-green-500/40', icon: <Lock className="h-4 w-4" /> };
      case 'guarded':
        return { label: 'Guarded', color: 'bg-amber-500/20 text-amber-500 border-amber-500/40', icon: <Eye className="h-4 w-4" /> };
      default:
        return { label: 'Exposed', color: 'bg-destructive/20 text-destructive border-destructive/40', icon: <AlertTriangle className="h-4 w-4" /> };
    }
  };

  const levelConfig = getLevelConfig();

  const statCards = [
    {
      icon: <EyeOff className="h-5 w-5 text-primary" />,
      label: 'Trackers Blocked',
      value: score.trackersBlocked,
      description: 'Data harvesting attempts intercepted',
      color: 'from-primary/20 to-primary/5',
    },
    {
      icon: <Cookie className="h-5 w-5 text-amber-500" />,
      label: 'Cookies Blocked',
      value: score.cookiesBlocked,
      description: 'Third-party cookies prevented',
      color: 'from-amber-500/20 to-amber-500/5',
    },
    {
      icon: <Fingerprint className="h-5 w-5 text-violet-500" />,
      label: 'Fingerprint Attempts',
      value: score.fingerprintAttempts,
      description: 'Browser fingerprinting blocked',
      color: 'from-violet-500/20 to-violet-500/5',
    },
    {
      icon: <Brain className="h-5 w-5 text-green-500" />,
      label: 'Local Processing',
      value: `${score.localProcessingRate}%`,
      description: 'AI queries processed on-device',
      color: 'from-green-500/20 to-green-500/5',
    },
  ];

  return (
    <>
      <SEOHead
        meta={{
          title: "Privacy Score | ShadowTalk AI",
          description: "See your real-time privacy score. Track blocked trackers, cookies, and fingerprinting attempts. Your data stays sovereign.",
        }}
      />
      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {/* Hero Section - Privacy Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className={cn('mb-4 gap-1.5 px-3 py-1', levelConfig.color)}>
              {levelConfig.icon}
              {levelConfig.label} Level
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Privacy <span className="gradient-text">Score</span>
            </h1>

            {/* Score Circle */}
            <div className="relative w-48 h-48 mx-auto my-8">
              {/* Background ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r="85"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="100" cy="100" r="85"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 85}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - animatedScore / 100) }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                  style={{
                    filter: `drop-shadow(0 0 8px hsl(var(--primary) / 0.5))`,
                  }}
                />
              </svg>
              {/* Score number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-5xl font-bold', getScoreColor())}>
                  {animatedScore}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    '0 0 20px hsl(var(--primary) / 0.1)',
                    '0 0 40px hsl(var(--primary) / 0.2)',
                    '0 0 20px hsl(var(--primary) / 0.1)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            <p className="text-muted-foreground max-w-lg mx-auto">
              ShadowTalk AI actively monitors and blocks data-harvesting attempts.
              Your privacy score reflects real-time protection status.
            </p>
          </motion.div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card className="glass-subtle hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br', stat.color)}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm font-medium">{stat.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Data Sovereignty Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Data Sovereignty Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data stored on your device</span>
                  <span className="text-sm font-bold text-primary">{score.dataOnDevice}%</span>
                </div>
                <Progress value={score.dataOnDevice} className="h-2" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">End-to-End Encrypted</p>
                      <p className="text-xs text-muted-foreground">AES-256-GCM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Client-Side Encryption</p>
                      <p className="text-xs text-muted-foreground">Vault data encrypted in your browser</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                    <Brain className="h-5 w-5 text-violet-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">On-Device AI</p>
                      <p className="text-xs text-muted-foreground">Runs locally via WebGPU</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Privacy Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {score.recentEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Privacy monitoring active. Events will appear here.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {score.recentEvents.slice(0, 15).map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          event.type === 'tracker_blocked' && 'bg-destructive/20',
                          event.type === 'cookie_blocked' && 'bg-amber-500/20',
                          event.type === 'fingerprint_blocked' && 'bg-violet-500/20',
                          event.type === 'local_processing' && 'bg-green-500/20',
                          event.type === 'data_request_blocked' && 'bg-primary/20',
                        )}>
                          {event.type === 'tracker_blocked' && <EyeOff className="h-4 w-4 text-destructive" />}
                          {event.type === 'cookie_blocked' && <Cookie className="h-4 w-4 text-amber-500" />}
                          {event.type === 'fingerprint_blocked' && <Fingerprint className="h-4 w-4 text-violet-500" />}
                          {event.type === 'local_processing' && <Brain className="h-4 w-4 text-green-500" />}
                          {event.type === 'data_request_blocked' && <Shield className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">
                            {event.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{event.source}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Competitor comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-8"
          >
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Privacy Comparison: ShadowTalk vs Cloud AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Vault data encrypted client-side', us: 100, them: 0 },
                    { label: 'Optional on-device AI', us: score.localProcessingRate, them: 0 },
                    { label: 'Tracker blocking', us: 100, them: 5 },
                    { label: 'Client-side encryption', us: 100, them: 0 },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <span className="text-primary font-medium">{item.us}%</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.us}%` }}
                              transition={{ delay: 1 + i * 0.2, duration: 1 }}
                            />
                          </div>
                          <p className="text-[10px] text-primary mt-0.5">ShadowTalk AI</p>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-destructive/50"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.them}%` }}
                              transition={{ delay: 1 + i * 0.2, duration: 1 }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Cloud AI (ChatGPT, etc.)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyScorePage;
