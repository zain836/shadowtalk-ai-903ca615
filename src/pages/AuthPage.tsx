import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Eye, EyeOff, WifiOff, Wifi, Loader2, Shield, Zap, Lock, CheckCircle2, XCircle, AlertTriangle, Fingerprint, Smartphone, Mail, KeyRound } from "lucide-react";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import shadowRobotImg from "@/assets/shadow-robot.png";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
  const [authMode, setAuthMode] = useState<'email' | 'phone' | 'magiclink'>('email');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const { isOffline, hasOfflineCredentials, saveCredentialsForOffline, verifyOfflineCredentials, getOfflineSession } = useOfflineAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [robotReacting, setRobotReacting] = useState(false);
  const [robotMessage, setRobotMessage] = useState("");
  const [robotSpeaking, setRobotSpeaking] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [robotTilt, setRobotTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [eyeGlow, setEyeGlow] = useState(0.3);
  const robotContainerRef = useRef<HTMLDivElement>(null);
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

  const playWelcomeVoice = useCallback(async (userName: string) => {
    try {
      setRobotReacting(true);
      setRobotSpeaking(true);
      const displayName = userName.split('@')[0];
      const welcomeMessages = [
        `Welcome back, ${displayName}. Your secure workspace is ready.`,
        `Hello ${displayName}. All systems encrypted and operational.`,
        `${displayName}, welcome to ShadowTalk. Your data fortress awaits.`,
      ];
      const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
      setRobotMessage(msg);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text: msg,
            voiceId: "onwK4e9ZLuTAKqWW03F9" // Daniel - deep, authoritative
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.audioContent) {
          const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
          const audio = new Audio(audioUrl);
          audio.volume = 0.8;
          
          return new Promise<void>((resolve) => {
            audio.onended = () => {
              setRobotSpeaking(false);
              setRobotReacting(false);
              setRobotMessage("");
              resolve();
            };
            audio.onerror = () => {
              setRobotSpeaking(false);
              setRobotReacting(false);
              setRobotMessage("");
              resolve();
            };
            audio.play().catch(() => {
              setRobotSpeaking(false);
              setRobotReacting(false);
              setRobotMessage("");
              resolve();
            });
          });
        }
      }
    } catch (err) {
      console.error("Voice welcome error:", err);
    } finally {
      setRobotSpeaking(false);
      setRobotReacting(false);
      setRobotMessage("");
    }
  }, []);

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

  const handleSendPhoneOTP = async () => {
    if (!phoneNumber || !/^\+\d{10,15}$/.test(phoneNumber)) {
      toast({ title: "Error", description: "Enter a valid phone number with country code (e.g. +1234567890)", variant: "destructive" });
      return;
    }
    const limit = checkLimit();
    if (!limit.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${limit.waitSec}s`);
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('phone-otp', {
        body: { action: 'send', phone: phoneNumber },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || 'Failed to send OTP');
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your phone for the verification code" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({ title: "Error", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('phone-otp', {
        body: { action: 'verify', phone: phoneNumber, code: otpCode },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || 'Verification failed');
      if (res.data?.verified) {
        toast({ title: "Verified!", description: res.data.user_exists 
          ? "Phone verified! Sign in with your email to continue." 
          : "Phone verified! Create an account with your email." 
        });
        setAuthMode('email');
        setOtpSent(false);
        setOtpCode("");
      }
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeInput(email);
    if (!cleanEmail) {
      toast({ title: "Error", description: "Enter your email address", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast({ title: "Error", description: "Enter a valid email address", variant: "destructive" });
      return;
    }
    const limit = checkLimit();
    if (!limit.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${limit.waitSec}s`);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email: cleanEmail,
        options: { emailRedirectTo: `${window.location.origin}/chatbot` }
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast({ title: "Magic Link Sent", description: "Check your email for the sign-in link" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
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

            {/* Auth Mode Tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl mb-6 border border-border/20">
              {[
                { key: 'email' as const, icon: <KeyRound className="h-3.5 w-3.5" />, label: 'Email' },
                { key: 'phone' as const, icon: <Smartphone className="h-3.5 w-3.5" />, label: 'Phone OTP' },
                { key: 'magiclink' as const, icon: <Mail className="h-3.5 w-3.5" />, label: 'Magic Link' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setAuthMode(tab.key); setRateLimitMsg(""); setOtpSent(false); setMagicLinkSent(false); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                    authMode === tab.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Email/Password Form */}
            <AnimatePresence mode="wait">
              {authMode === 'email' && (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleAuth}
                  className="space-y-4"
                >
                  <div>
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
                  </div>

                  <div>
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
                  </div>

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
                </motion.form>
              )}

              {/* Phone OTP Form */}
              {authMode === 'phone' && (
                <motion.div
                  key="phone-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {!otpSent ? (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="bg-muted/20 border-border/50 h-11 focus:border-primary/50"
                          maxLength={16}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1.5">Include country code (e.g. +1 for US, +91 for India)</p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSendPhoneOTP}
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-[0_4px_20px_hsl(var(--primary)/0.3)]"
                        disabled={loading || isOffline}
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending OTP...</>
                        ) : (
                          <><Smartphone className="h-4 w-4 mr-2" /> Send OTP Code</>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                          <Smartphone className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Enter verification code</p>
                          <p className="text-xs text-muted-foreground mt-1">Sent to {phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={otpCode} onChange={(value) => setOtpCode(value)}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button
                        type="button"
                        onClick={handleVerifyPhoneOTP}
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-[0_4px_20px_hsl(var(--primary)/0.3)]"
                        disabled={loading || otpCode.length !== 6}
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                        ) : (
                          <><Shield className="h-4 w-4 mr-2" /> Verify Code</>
                        )}
                      </Button>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-xs text-muted-foreground"
                          onClick={() => { setOtpSent(false); setOtpCode(""); }}
                        >
                          Change number
                        </Button>
                        <span className="text-muted-foreground/30">•</span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-xs text-primary"
                          onClick={handleSendPhoneOTP}
                          disabled={loading}
                        >
                          Resend code
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Magic Link Form */}
              {authMode === 'magiclink' && (
                <motion.form
                  key="magiclink-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleMagicLink}
                  className="space-y-4"
                >
                  {!magicLinkSent ? (
                    <>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email Address</label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-muted/20 border-border/50 h-11 focus:border-primary/50"
                          maxLength={255}
                          autoComplete="email"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1.5">We'll send a secure sign-in link to your inbox</p>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-[0_4px_20px_hsl(var(--primary)/0.3)]"
                        disabled={loading || isOffline}
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                        ) : (
                          <><Mail className="h-4 w-4 mr-2" /> Send Magic Link</>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center space-y-4 py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                        className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto"
                      >
                        <Mail className="h-8 w-8 text-success" />
                      </motion.div>
                      <div>
                        <p className="text-base font-semibold text-foreground">Check your email</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          We sent a sign-in link to <span className="text-foreground font-medium">{email}</span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Didn't receive it? Check spam or</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setMagicLinkSent(false); }}
                        className="text-xs"
                      >
                        Try again
                      </Button>
                    </div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

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

        {/* Robot image with cursor-tracking reactions */}
        <motion.div
          ref={robotContainerRef}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 cursor-pointer"
          onMouseMove={(e) => {
            if (!robotContainerRef.current) return;
            const rect = robotContainerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);
            setRobotTilt({ rotateY: deltaX * 15, rotateX: -deltaY * 10 });
            setMousePos({ x: deltaX, y: deltaY });
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            setEyeGlow(Math.max(0.3, 1 - dist * 0.5));
          }}
          onMouseEnter={() => setRobotReacting(true)}
          onMouseLeave={() => {
            setRobotReacting(false);
            setRobotMessage("");
            setRobotTilt({ rotateX: 0, rotateY: 0 });
            setEyeGlow(0.3);
          }}
          onClick={() => {
            const msgs = [
              "🔒 Your secrets are safe with me.",
              "👁️ I see you... but your data? Never.",
              "⚡ Zero-knowledge. Zero compromise.",
              "🛡️ Encrypting everything. Always.",
              "🤖 I guard. You create.",
              "🔐 AES-256-GCM active.",
              "🧠 Processing... threat level: zero.",
              "⚔️ 600,000 PBKDF2 iterations. Try me.",
            ];
            setRobotMessage(msgs[Math.floor(Math.random() * msgs.length)]);
            setTimeout(() => setRobotMessage(""), 3000);
          }}
          style={{ perspective: 800 }}
        >
          {/* Outer scanning ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full"
            style={{
              border: `1px solid hsl(var(--primary) / ${robotReacting ? 0.3 : 0.08})`,
              transition: "border-color 0.5s",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: robotReacting ? 6 : 30, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              animate={robotReacting ? { width: [6, 10, 6], height: [6, 10, 6], opacity: [0.6, 1, 0.6] } : { width: 6, height: 6, opacity: 0.4 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full bg-secondary"
              animate={robotReacting ? { width: [4, 8, 4], height: [4, 8, 4], opacity: [0.4, 1, 0.4] } : { width: 4, height: 4, opacity: 0.3 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          {/* Inner ring */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full"
            style={{
              border: `1px solid hsl(var(--primary) / ${robotReacting ? 0.2 : 0.05})`,
              transition: "border-color 0.5s",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: robotReacting ? 8 : 25, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
              animate={robotReacting ? { width: [4, 7, 4], height: [4, 7, 4] } : { width: 4, height: 4 }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </motion.div>

          {/* The robot — 3D tilts toward cursor */}
          <motion.div
            animate={{
              rotateX: robotTilt.rotateX,
              rotateY: robotTilt.rotateY,
            }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.img
              src={shadowRobotImg}
              alt="ShadowTalk AI Guardian"
              className="w-[380px] h-[380px] object-contain relative z-10"
              animate={robotReacting ? { y: [0, -6, 0] } : { y: [0, -14, 0] }}
              transition={robotReacting ? {
                duration: 2, repeat: Infinity, ease: "easeInOut",
              } : {
                duration: 5, repeat: Infinity, ease: "easeInOut",
              }}
              style={{
                filter: `drop-shadow(0 0 ${robotReacting ? 80 : 40}px hsl(var(--primary) / ${eyeGlow}))`,
                transition: "filter 0.3s",
              }}
            />
          </motion.div>

          {/* Dynamic eye glow that follows cursor */}
          <AnimatePresence>
            {robotReacting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: eyeGlow * 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute z-20 pointer-events-none"
                style={{
                  top: `calc(38% + ${mousePos.y * 8}px)`,
                  left: `calc(50% + ${mousePos.x * 12}px)`,
                  transform: "translate(-50%, -50%)",
                  width: 120,
                  height: 40,
                  background: `radial-gradient(ellipse, hsl(var(--primary) / 0.5) 0%, transparent 70%)`,
                  borderRadius: "50%",
                  transition: "top 0.1s, left 0.1s",
                }}
              />
            )}
          </AnimatePresence>

          {/* Scan line effect on hover */}
          <AnimatePresence>
            {robotReacting && (
              <motion.div
                initial={{ top: "10%", opacity: 0 }}
                animate={{ top: ["10%", "85%", "10%"], opacity: [0, 0.4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-[15%] right-[15%] h-[2px] z-20 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)`,
                  boxShadow: `0 0 20px 4px hsl(var(--primary) / 0.3)`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Speech bubble */}
          <AnimatePresence>
            {robotMessage && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.7 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.7 }}
                transition={{ type: "spring", damping: 18, stiffness: 350 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 backdrop-blur-xl rounded-2xl px-5 py-3 whitespace-nowrap"
                style={{
                  background: "hsl(var(--card) / 0.85)",
                  border: "1px solid hsl(var(--primary) / 0.4)",
                  boxShadow: "0 8px 32px hsl(var(--primary) / 0.15), 0 0 60px hsl(var(--primary) / 0.1)",
                }}
              >
                <span className="text-sm font-semibold text-foreground tracking-wide">{robotMessage}</span>
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
                  style={{
                    background: "hsl(var(--card) / 0.85)",
                    borderBottom: "1px solid hsl(var(--primary) / 0.4)",
                    borderRight: "1px solid hsl(var(--primary) / 0.4)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover hint */}
          <AnimatePresence>
            {robotReacting && !robotMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0.4, 0.8, 0.4], y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30 text-[11px] text-primary font-mono tracking-widest"
              >
                [ CLICK TO INTERACT ]
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
