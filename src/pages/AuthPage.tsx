import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Eye, EyeOff, WifiOff, Wifi, Loader2, Shield, Zap, Lock, CheckCircle2, XCircle, AlertTriangle, Fingerprint } from "lucide-react";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import shadowRobotImg from "@/assets/shadow-robot.png";

// Rate limiter
const useRateLimiter = (maxAttempts = 5, windowMs = 60000) => {
  const attemptsRef = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter(t => now - t < windowMs);
    if (attemptsRef.current.length >= maxAttempts) {
      const oldest = attemptsRef.current[0];
      const waitSec = Math.ceil((windowMs - (now - oldest)) / 1000);
      return { allowed: false, waitSec };
    }
    attemptsRef.current.push(now);
    return { allowed: true, waitSec: 0 };
  }, [maxAttempts, windowMs]);

  return { checkLimit };
};

// Password strength checker
const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-destructive", textColor: "text-destructive", pct: 25 };
  if (score <= 3) return { label: "Fair", color: "bg-warning", textColor: "text-warning", pct: 50 };
  if (score <= 4) return { label: "Good", color: "bg-primary", textColor: "text-primary", pct: 75 };
  return { label: "Strong", color: "bg-success", textColor: "text-success", pct: 100 };
};

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

// Floating particles for robot section
const FloatingParticle = ({ delay, x, y }: { delay: number; x: string; y: string }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-primary/40"
    style={{ left: x, top: y }}
    animate={{
      y: [0, -20, 0],
      opacity: [0, 1, 0],
      scale: [0, 1.5, 0],
    }}
    transition={{ duration: 3, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState("");

  const { isOffline, hasOfflineCredentials, saveCredentialsForOffline, verifyOfflineCredentials, getOfflineSession } = useOfflineAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [robotReacting, setRobotReacting] = useState(false);
  const [robotMessage, setRobotMessage] = useState("");
  const { checkLimit } = useRateLimiter(5, 60000);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    const checkUser = async () => {
      const offlineSession = getOfflineSession();
      if (offlineSession) { navigate('/chatbot'); return; }
      if (!isOffline) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) navigate('/chatbot');
      }
    };
    checkUser();
  }, [navigate, isOffline, getOfflineSession]);

  const sanitizeInput = (input: string) => input.trim().slice(0, 255);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitMsg("");

    const cleanEmail = sanitizeInput(email);
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (!isLogin && cleanPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (!isLogin && strength.pct < 50) {
      toast({ title: "Weak Password", description: "Please use a stronger password with mixed characters", variant: "destructive" });
      return;
    }

    // Rate limiting
    const limit = checkLimit();
    if (!limit.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${limit.waitSec}s`);
      toast({ title: "Rate Limited", description: `Too many attempts. Wait ${limit.waitSec} seconds.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isOffline) {
        if (!isLogin) { toast({ title: "Offline", description: "You need to be online to create an account", variant: "destructive" }); return; }
        const result = await verifyOfflineCredentials(cleanEmail, cleanPassword);
        if (result.success) { toast({ title: "Success", description: "Logged in offline!" }); navigate('/chatbot'); }
        else { toast({ title: "Error", description: result.error, variant: "destructive" }); }
        return;
      }
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (error) throw error;
        if (data.user) await saveCredentialsForOffline(cleanEmail, cleanPassword, data.user.id);
        toast({ title: "Success", description: "Logged in successfully!" });
        navigate('/chatbot');
      } else {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: cleanPassword, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (error) throw error;
        if (data.user && data.session) await saveCredentialsForOffline(cleanEmail, cleanPassword, data.user.id);
        toast({ title: "Success", description: data.session ? "Account created!" : "Check your email to confirm!" });
        if (data.session) navigate('/chatbot');
      }
    } catch (error: any) {
      toast({ title: "Authentication Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    if (isOffline) { toast({ title: "Offline", description: "Google sign-in requires internet connection", variant: "destructive" }); return; }
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to sign in with Google", variant: "destructive" });
    } finally { setGoogleLoading(false); }
  };

  const handleAppleSignIn = async () => {
    if (isOffline) { toast({ title: "Offline", description: "Apple sign-in requires internet connection", variant: "destructive" }); return; }
    setAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to sign in with Apple", variant: "destructive" });
    } finally { setAppleLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative overflow-hidden">
      {/* Left side — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  {isOffline ? (
                    <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20 text-[10px]">
                      <WifiOff className="h-3 w-3" /> Offline
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20 text-[10px]">
                      <Wifi className="h-3 w-3" /> Secure
                    </Badge>
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1.5">
                {isLogin ? "Sign in to your sovereign AI workspace" : "Set up your zero-knowledge account"}
              </p>
            </div>

            {/* Rate limit warning */}
            <AnimatePresence>
              {rateLimitMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-xs text-destructive">{rateLimitMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/20 border-border/50 h-11 focus:border-primary/50"
                  disabled={isOffline && !isLogin}
                  maxLength={255}
                  autoComplete="email"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/20 border-border/50 h-11 pr-10 focus:border-primary/50"
                    disabled={isOffline && !isLogin}
                    maxLength={128}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Password strength (signup only) */}
                <AnimatePresence>
                  {!isLogin && password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", strength.color)}
                            initial={{ width: 0 }}
                            animate={{ width: `${strength.pct}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className={cn("text-[10px] font-mono", strength.textColor)}>{strength.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {passwordRules.map((rule) => (
                          <div key={rule.label} className="flex items-center gap-1">
                            {rule.test(password) ? (
                              <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            )}
                            <span className={cn(
                              "text-[10px]",
                              rule.test(password) ? "text-success" : "text-muted-foreground/50"
                            )}>{rule.label}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm password (signup) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                          "bg-muted/20 border-border/50 h-11 pr-10 focus:border-primary/50",
                          confirmPassword && confirmPassword !== password && "border-destructive/50"
                        )}
                        disabled={isOffline}
                        maxLength={128}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-[0_4px_20px_hsl(var(--primary)/0.3)]"
                  disabled={loading || (isOffline && !isLogin) || (isOffline && isLogin && !hasOfflineCredentials)}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating...</>
                  ) : (
                    <><Shield className="h-4 w-4 mr-2" /> {isLogin ? (isOffline ? "Sign In Offline" : "Sign In Securely") : "Create Account"}</>
                  )}
                </Button>
              </motion.div>

              {/* OAuth */}
              <div className="relative my-6">
                <Separator className="bg-border/20" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 h-11 border-border/30 bg-muted/10 hover:bg-muted/20 hover:border-primary/30"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || isOffline}
                >
                  {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span className="text-sm">Google</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 h-11 border-border/30 bg-muted/10 hover:bg-muted/20 hover:border-primary/30"
                  onClick={handleAppleSignIn}
                  disabled={appleLoading || isOffline}
                >
                  {appleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                  )}
                  <span className="text-sm">Apple</span>
                </Button>
              </div>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={() => { setIsLogin(!isLogin); setRateLimitMsg(""); }}
                className="text-primary text-sm"
                disabled={isOffline && !isLogin}
              >
                {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
              </Button>
            </div>

            {/* Security footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground"
            >
              <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-success" /> E2E Encrypted</span>
              <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3 text-primary" /> 2FA Ready</span>
              <span className="flex items-center gap-1">
                {isOffline ? (
                  <><WifiOff className="h-3 w-3 text-warning" /> <span className="text-warning">Offline Mode</span></>
                ) : hasOfflineCredentials ? (
                  <><Zap className="h-3 w-3 text-success" /> <span className="text-success">Offline Ready</span></>
                ) : (
                  <><Zap className="h-3 w-3" /> Offline Not Set Up</>
                )}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right side — Shadow Robot Animation */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-muted/30 via-background to-primary/5">
        {/* Background effects */}
        <div className="absolute inset-0">
          {/* Radial glow behind robot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[80px]" />

          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }} />

          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Floating particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <FloatingParticle
              key={i}
              delay={i * 0.4}
              x={`${15 + Math.random() * 70}%`}
              y={`${10 + Math.random() * 80}%`}
            />
          ))}
        </div>

        {/* Robot image with animations */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 cursor-pointer group/robot"
          onMouseEnter={() => setRobotReacting(true)}
          onMouseLeave={() => { setRobotReacting(false); setRobotMessage(""); }}
          onClick={() => {
            const msgs = [
              "🔒 Your secrets are safe with me.",
              "👁️ I see you... but your data? Never.",
              "⚡ Zero-knowledge. Zero compromise.",
              "🛡️ Encrypting everything. Always.",
              "🤖 I guard. You create.",
              "🔐 AES-256-GCM active.",
            ];
            setRobotMessage(msgs[Math.floor(Math.random() * msgs.length)]);
          }}
        >
          {/* Glow ring behind robot — speeds up on hover */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full border border-primary/10 transition-all duration-500 group-hover/robot:border-primary/40"
            animate={{ rotate: 360 }}
            transition={{ duration: robotReacting ? 8 : 30, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/50 transition-all duration-300 group-hover/robot:w-3 group-hover/robot:h-3 group-hover/robot:bg-primary" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-secondary/40 transition-all duration-300 group-hover/robot:w-2.5 group-hover/robot:h-2.5 group-hover/robot:bg-secondary" />
          </motion.div>

          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-primary/5 transition-all duration-500 group-hover/robot:border-primary/20"
            animate={{ rotate: -360 }}
            transition={{ duration: robotReacting ? 6 : 20, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent/40 transition-all duration-300 group-hover/robot:w-2.5 group-hover/robot:h-2.5 group-hover/robot:bg-accent" />
          </motion.div>

          {/* Eye glow overlay — appears on hover */}
          <AnimatePresence>
            {robotReacting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] z-20 pointer-events-none"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-radial from-primary/20 via-transparent to-transparent animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* The robot */}
          <motion.img
            src={shadowRobotImg}
            alt="ShadowTalk AI Guardian"
            className="w-[340px] h-[340px] object-contain relative z-10 transition-all duration-500"
            animate={robotReacting ? {
              y: [0, -8, 0],
              scale: [1, 1.08, 1.04],
              filter: [
                "drop-shadow(0 0 60px hsl(var(--primary) / 0.3))",
                "drop-shadow(0 0 100px hsl(var(--primary) / 0.6))",
                "drop-shadow(0 0 80px hsl(var(--primary) / 0.5))",
              ],
            } : {
              y: [0, -12, 0],
              scale: 1,
              filter: "drop-shadow(0 0 60px hsl(var(--primary) / 0.3))",
            }}
            transition={robotReacting ? {
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            } : {
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Reaction speech bubble */}
          <AnimatePresence>
            {robotMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 bg-card/90 backdrop-blur-md border border-primary/30 rounded-xl px-4 py-2 shadow-lg shadow-primary/10 whitespace-nowrap"
              >
                <span className="text-sm font-medium text-foreground">{robotMessage}</span>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card/90 border-b border-r border-primary/30" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover hint */}
          <AnimatePresence>
            {robotReacting && !robotMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 text-[10px] text-primary/60 font-mono"
              >
                click me
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Text overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-12 left-0 right-0 text-center z-10"
        >
          <h2 className="text-xl font-bold text-foreground mb-2">Your AI Guardian</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Zero-knowledge architecture. Your data never leaves your control.
          </p>

          {/* Live security indicators */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 text-[10px] font-mono text-success"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              AES-256
            </motion.div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              className="flex items-center gap-1 text-[10px] font-mono text-primary"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              PBKDF2
            </motion.div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="flex items-center gap-1 text-[10px] font-mono text-secondary"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
              RLS
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Mobile robot peek (below form on small screens) */}
      <div className="lg:hidden flex justify-center py-8 relative">
        <motion.img
          src={shadowRobotImg}
          alt="ShadowTalk AI Guardian"
          className="w-32 h-32 object-contain opacity-30"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default AuthPage;
