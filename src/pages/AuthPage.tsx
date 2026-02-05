import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Eye, EyeOff, WifiOff, Wifi, Loader2 } from "lucide-react";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

  useEffect(() => {
    const checkUser = async () => {
      // First check for offline session
      const offlineSession = getOfflineSession();
      if (offlineSession) {
        navigate('/chatbot');
        return;
      }
      
      // Then check for online session
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
      // If offline, try offline authentication
      if (isOffline) {
        if (!isLogin) {
          toast({ 
            title: "Offline", 
            description: "You need to be online to create an account", 
            variant: "destructive" 
          });
          return;
        }
        
        const result = await verifyOfflineCredentials(email, password);
        if (result.success) {
          toast({ title: "Success", description: "Logged in offline!" });
          navigate('/chatbot');
        } else {
          toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        return;
      }
      
      // Online authentication
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Save credentials for offline use
        if (data.user) {
          await saveCredentialsForOffline(email, password, data.user.id);
        }
        
        toast({ title: "Success", description: "Logged in successfully!" });
        navigate('/chatbot');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/` }
        });
        if (error) throw error;
        
        // Save credentials for offline use if session is created
        if (data.user && data.session) {
          await saveCredentialsForOffline(email, password, data.user.id);
        }
        
        toast({ title: "Success", description: data.session ? "Account created!" : "Check your email to confirm!" });
        if (data.session) navigate('/chatbot');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isOffline) {
      toast({ title: "Offline", description: "Google sign-in requires internet connection", variant: "destructive" });
      return;
    }
    
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to sign in with Google", variant: "destructive" });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-6 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
        
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-glow">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isOffline ? (
                <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <WifiOff className="h-3 w-3" /> Offline Mode
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                  <Wifi className="h-3 w-3" /> Online
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl gradient-text">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            {isOffline && isLogin && hasOfflineCredentials && (
              <CardDescription className="text-yellow-400/80">
                You can login offline with your saved credentials
              </CardDescription>
            )}
            {isOffline && isLogin && !hasOfflineCredentials && (
              <CardDescription className="text-yellow-400/80">
                No offline credentials found. Login online first to enable offline access.
              </CardDescription>
            )}
            {isOffline && !isLogin && (
              <CardDescription className="text-yellow-400/80">
                You need to be online to create an account
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <Input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="bg-muted/50" 
                disabled={isOffline && !isLogin}
              />
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-muted/50 pr-10" 
                  disabled={isOffline && !isLogin}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {!isLogin && (
                <Input 
                  type="password" 
                  placeholder="Confirm Password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="bg-muted/50" 
                  disabled={isOffline}
                />
              )}
              <Button 
                type="submit" 
                className="w-full btn-glow" 
                disabled={loading || (isOffline && !isLogin) || (isOffline && isLogin && !hasOfflineCredentials)}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  isLogin ? (isOffline ? "Sign In Offline" : "Sign In") : "Create Account"
                )}
              </Button>
              
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || isOffline}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Button
                variant="link" 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-primary"
                disabled={isOffline && !isLogin}
              >
                {isLogin ? "Create Account" : "Sign In"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Offline info */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          {isOffline ? (
            <p>Limited functionality available while offline</p>
          ) : (
            <p>Your credentials will be saved for offline access</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
