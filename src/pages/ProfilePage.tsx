import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Bell, Shield, Save, Loader2, Camera, Gift, BarChart3, CreditCard, ExternalLink, Crown } from "lucide-react";
import ReferralProgram from "@/components/ReferralProgram";
import UsageAnalytics from "@/components/UsageAnalytics";
import { PLAN_DETAILS } from "@/lib/stripe";
import { MissionValueDashboard } from "@/components/MissionValueDashboard";
import { UsageHistoryTable } from "@/components/UsageHistoryTable";
import { CreditEmptyPrompt } from "@/components/CreditEmptyPrompt";
import { useShadowCredits } from "@/hooks/useShadowCredits";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  notification_email: boolean;
  notification_push: boolean;
  notification_mentions: boolean;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userPlan, subscribed, subscriptionEnd } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationPush, setNotificationPush] = useState(true);
  const [notificationMentions, setNotificationMentions] = useState(true);

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-portal');
      
      if (error) throw new Error(error.message);
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to open subscription portal",
        variant: "destructive",
      });
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const currentPlanDetails = PLAN_DETAILS[userPlan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
  const { balance, transactions, isLoading: creditsLoading } = useShadowCredits();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error loading profile:', error);
    }
    
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
      setNotificationEmail(data.notification_email ?? true);
      setNotificationPush(data.notification_push ?? true);
      setNotificationMentions(data.notification_mentions ?? true);
    } else {
      // Create profile if it doesn't exist
      const defaultName = user.email?.split('@')[0] || 'User';
      setDisplayName(defaultName);
      
      await supabase.from('profiles').insert({
        id: user.id,
        display_name: defaultName
      });
    }
    
    setIsLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        notification_email: notificationEmail,
        notification_push: notificationPush,
        notification_mentions: notificationMentions,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } else {
      toast({ title: "Profile saved", description: "Your changes have been saved successfully" });
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">Customize your account</p>
            </div>
          </div>
          <Button onClick={saveProfile} disabled={isSaving} className="btn-glow">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Mission Value Dashboard */}
          {!creditsLoading && balance && (
            <MissionValueDashboard
              transactions={transactions}
              balance={balance.balance}
            />
          )}

          {/* Credit Empty Prompt */}
          {!creditsLoading && balance && balance.balance <= 0 && (
            <CreditEmptyPrompt transactions={transactions} />
          )}

          {/* Profile Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                This information will be displayed to other users in chat rooms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary/20">
                      {displayName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-primary rounded-full">
                    <Camera className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Avatar URL</Label>
                  <Input
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a URL to an image for your avatar
                  </p>
                </div>
              </div>

              <Separator />

              {/* Display Name */}
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  This name will be shown in chat rooms and conversations
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell others a bit about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed here
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your conversations
                  </p>
                </div>
                <Switch
                  checked={notificationEmail}
                  onCheckedChange={setNotificationEmail}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications on your device
                  </p>
                </div>
                <Switch
                  checked={notificationPush}
                  onCheckedChange={setNotificationPush}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mention Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone mentions you
                  </p>
                </div>
                <Switch
                  checked={notificationMentions}
                  onCheckedChange={setNotificationMentions}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card className={subscribed ? "ring-2 ring-primary/50" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Subscription</CardTitle>
                </div>
                <Badge variant={subscribed ? "default" : "secondary"} className="capitalize">
                  {subscribed && <Crown className="h-3 w-3 mr-1" />}
                  {currentPlanDetails.name}
                </Badge>
              </div>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{currentPlanDetails.name} Plan</p>
                    <p className="text-2xl font-bold gradient-text">
                      ${currentPlanDetails.price}
                      {currentPlanDetails.price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                    </p>
                  </div>
                  {subscribed && subscriptionEnd && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Renews on</p>
                      <p className="text-sm font-medium">
                        {new Date(subscriptionEnd).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {currentPlanDetails.features.slice(0, 4).map((feature, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-primary">✓</span> {feature}
                    </p>
                  ))}
                </div>

                <div className="flex gap-2">
                  {subscribed ? (
                    <Button 
                      onClick={handleManageSubscription} 
                      disabled={isManagingSubscription}
                      className="flex-1"
                    >
                      {isManagingSubscription ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => navigate('/pricing')} 
                      className="flex-1 btn-glow"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>

              {!subscribed && (
                <p className="text-xs text-center text-muted-foreground">
                  Upgrade to unlock unlimited queries, advanced features, and priority support
                </p>
              )}
            </CardContent>
          </Card>

          {/* Usage History */}
          {!creditsLoading && transactions.length > 0 && (
            <UsageHistoryTable transactions={transactions} />
          )}

          {/* Account Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Account Security</CardTitle>
              </div>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last changed: Unknown
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
