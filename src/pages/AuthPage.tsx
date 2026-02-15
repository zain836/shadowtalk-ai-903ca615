import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Eye, EyeOff, WifiOff, Wifi, Loader2, Bot, Shield, Zap } from "lucide-react";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const AuthPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    isOffline, 
    hasOfflineCredentials, 
    saveCredentialsForOffline, 
    verifyOfflineCredentials,
    getOfflineSession
  } = useOfflineAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (isOffline) {
        if (!isLogin) { toast({ title: "Offline", description: "You need to be online to create an account", variant: "destructive" }); return; }
        const result = await verifyOfflineCredentials(email, password);
        if (result.success) { toast({ title: "Success", description: "Logged in offline!" }); navigate('/chatbot'); }
        else { toast({ title: "Error", description: result.error, variant: "destructive" }); }
        return;
      }
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await saveCredentialsForOffline(email, password, data.user.id);
        toast({ title: "Success", description: "Logged in successfully!" });
        navigate('/chatbot');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (error) throw error;
        if (data.user && data.session) await saveCredentialsForOffline(email, password, data.user.id);
        toast({ title: "Success", description: data.session ? "Account created!" : "Check your email to confirm!" });
        if (data.session) navigate('/chatbot');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <motion.div
        animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[150px]"
      />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-6 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <Card className="glass-strong border-border/50 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.1)] overflow-hidden relative">
            {/* Top glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            
            <CardHeader className="text-center pb-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
              >
                <Bot className="h-7 w-7 text-primary" />
              </motion.div>

              <div className="flex items-center justify-center gap-2 mb-3">
                {isOffline ? (
                  <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20">
                    <WifiOff className="h-3 w-3" /> Offline Mode
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
                    <Wifi className="h-3 w-3" /> Online
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="text-sm">
                {isOffline && isLogin && hasOfflineCredentials && "Login with saved offline credentials"}
                {isOffline && isLogin && !hasOfflineCredentials && "Login online first to enable offline access"}
                {isOffline && !isLogin && "Online connection required to create account"}
                {!isOffline && isLogin && "Sign in to your sovereign AI workspace"}
                {!isOffline && !isLogin && "Create your account to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-muted/30 border-border/50 h-11" disabled={isOffline && !isLogin} />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-muted/30 border-border/50 h-11 pr-10" disabled={isOffline && !isLogin} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </motion.div>
                {!isLogin && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="bg-muted/30 border-border/50 h-11" disabled={isOffline} />
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Button type="submit" className="w-full btn-glow h-11" disabled={loading || (isOffline && !isLogin) || (isOffline && isLogin && !hasOfflineCredentials)}>
                    {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : (isLogin ? (isOffline ? "Sign In Offline" : "Sign In") : "Create Account")}
                  </Button>
                </motion.div>
                
                <div className="relative my-6">
                  <Separator className="bg-border/30" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">or continue with</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="outline" className="gap-2 h-11 border-border/50 hover:border-primary/30" onClick={handleGoogleSignIn} disabled={googleLoading || isOffline}>
                    {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    )}
                    Google
                  </Button>
                  <Button type="button" variant="outline" className="gap-2 h-11 border-border/50 hover:border-primary/30" onClick={handleAppleSignIn} disabled={appleLoading || isOffline}>
                    {appleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    )}
                    Apple
                  </Button>
                </div>
              </form>
              <div className="mt-6 text-center">
                <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="text-primary text-sm" disabled={isOffline && !isLogin}>
                  {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground"
        >
          <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-success" /> E2E Encrypted</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> Offline Ready</span>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
