import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  User, Bell, Shield, Save, Loader2, CreditCard, ExternalLink, Crown,
  Lock, KeyRound, LogOut, Trash2, Mail, Eye, EyeOff, CheckCircle2,
  AlertTriangle, Activity, Settings, Link2,
} from "lucide-react";
import { motion } from "framer-motion";
import ReferralProgram from "@/components/ReferralProgram";
import { PLAN_DETAILS } from "@/lib/stripe";
import { MissionValueDashboard } from "@/components/MissionValueDashboard";
import { UsageHistoryTable } from "@/components/UsageHistoryTable";
import { CreditEmptyPrompt } from "@/components/CreditEmptyPrompt";
import { useShadowCredits } from "@/hooks/useShadowCredits";
import { TwoFactorSetup } from "@/components/profile/TwoFactorSetup";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTab } from "@/components/profile/ProfileTab";
import { ActivityTab } from "@/components/profile/ActivityTab";
import { PreferencesTab } from "@/components/profile/PreferencesTab";
import { LinkedAccountsTab } from "@/components/profile/LinkedAccountsTab";
import { AdminPanelLink } from "@/components/admin/AdminPanelLink";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  notification_email: boolean;
  notification_push: boolean;
  notification_mentions: boolean;
  created_at?: string;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userPlan, subscribed, subscriptionEnd, signOut } = useAuth();
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

  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const currentPlanDetails = PLAN_DETAILS[userPlan as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;
  const { balance, transactions, isLoading: creditsLoading } = useShadowCredits();

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") console.error("Error loading profile:", error);

    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");
      setNotificationEmail(data.notification_email ?? true);
      setNotificationPush(data.notification_push ?? true);
      setNotificationMentions(data.notification_mentions ?? true);
    } else {
      const defaultName = user.email?.split("@")[0] || "User";
      setDisplayName(defaultName);
      await supabase.from("profiles").insert({ id: user.id, display_name: defaultName });
    }
    setIsLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
      notification_email: notificationEmail,
      notification_push: notificationPush,
      notification_mentions: notificationMentions,
      updated_at: new Date().toISOString(),
    });
    toast(
      error
        ? { title: "Error", description: "Failed to save profile", variant: "destructive" as const }
        : { title: "Profile saved", description: "Your changes have been saved successfully" }
    );
    setIsSaving(false);
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal");
      if (error) throw new Error(error.message);
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to open subscription portal", variant: "destructive" });
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed successfully" });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to change password", variant: "destructive" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6"><AdminPanelLink /></div>
            <ProfileHeader
        displayName={displayName}
        email={user?.email || ""}
        avatarUrl={avatarUrl}
        userPlan={userPlan}
        isSaving={isSaving}
        onSave={saveProfile}
        onSignOut={handleSignOut}
      />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Credits Dashboard */}
        {!creditsLoading && balance && (
          <motion.div {...tabMotion} className="mb-6">
            <MissionValueDashboard transactions={transactions} balance={balance.balance} />
          </motion.div>
        )}
        {!creditsLoading && balance && balance.balance <= 0 && (
          <motion.div {...tabMotion} className="mb-6">
            <CreditEmptyPrompt transactions={transactions} />
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full max-w-2xl mx-auto bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="profile" className="gap-1 text-xs">
              <User className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1 text-xs">
              <Activity className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 text-xs">
              <Bell className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1 text-xs">
              <Shield className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="linked" className="gap-1 text-xs">
              <Link2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Linked</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1 text-xs">
              <Settings className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Prefs</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1 text-xs">
              <CreditCard className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== PROFILE TAB ===== */}
          <TabsContent value="profile">
            <ProfileTab
              displayName={displayName}
              setDisplayName={setDisplayName}
              email={user?.email || ""}
              bio={bio}
              setBio={setBio}
              avatarUrl={avatarUrl}
              setAvatarUrl={setAvatarUrl}
              createdAt={profile?.created_at}
            />
          </TabsContent>

          {/* ===== ACTIVITY TAB ===== */}
          <TabsContent value="activity">
            {user && <ActivityTab userId={user.id} />}
          </TabsContent>

          {/* ===== NOTIFICATIONS TAB ===== */}
          <TabsContent value="notifications">
            <motion.div {...tabMotion}>
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notification Preferences
                  </CardTitle>
                  <CardDescription>Control how and when you receive alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {[
                    { label: "Email Notifications", desc: "Receive email updates about your conversations", value: notificationEmail, onChange: setNotificationEmail, icon: Mail },
                    { label: "Push Notifications", desc: "Get push notifications on your device", value: notificationPush, onChange: setNotificationPush, icon: Bell },
                    { label: "Mention Notifications", desc: "Get notified when someone mentions you", value: notificationMentions, onChange: setNotificationMentions, icon: User },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <item.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch checked={item.value} onCheckedChange={item.onChange} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ===== SECURITY TAB ===== */}
          <TabsContent value="security">
            <motion.div {...tabMotion} className="space-y-6">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>Protect your account with TOTP-based 2FA</CardDescription>
                </CardHeader>
                <CardContent>
                  <TwoFactorSetup />
                </CardContent>
              </Card>

              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" /> Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-5 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <KeyRound className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Account Password</p>
                        <p className="text-xs text-muted-foreground">Use a strong, unique password</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" /> Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-5 rounded-xl bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="font-medium text-sm text-destructive">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently remove your account and all data</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ===== LINKED ACCOUNTS TAB ===== */}
          <TabsContent value="linked">
            {user && <LinkedAccountsTab userId={user.id} email={user.email || ""} />}
          </TabsContent>

          {/* ===== PREFERENCES TAB ===== */}
          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>

          {/* ===== BILLING TAB ===== */}
          <TabsContent value="billing">
            <motion.div {...tabMotion} className="space-y-6">
              <Card className={`glass border-border/50 ${subscribed ? "ring-2 ring-primary/30" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" /> Subscription
                    </CardTitle>
                    <Badge variant={subscribed ? "default" : "secondary"} className="capitalize">
                      {subscribed && <Crown className="h-3 w-3 mr-1" />}
                      {currentPlanDetails.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent border border-primary/15">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg">{currentPlanDetails.name} Plan</p>
                        <p className="text-3xl font-bold gradient-text">
                          ${currentPlanDetails.price}
                          {currentPlanDetails.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                        </p>
                      </div>
                      {subscribed && subscriptionEnd && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Renews on</p>
                          <p className="text-sm font-medium">{new Date(subscriptionEnd).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {currentPlanDetails.features.slice(0, 4).map((feature, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {feature}
                        </p>
                      ))}
                    </div>

                    {subscribed ? (
                      <Button onClick={handleManageSubscription} disabled={isManagingSubscription} className="w-full">
                        {isManagingSubscription ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                        Manage Subscription
                      </Button>
                    ) : (
                      <Button onClick={() => navigate("/pricing")} className="w-full btn-glow">
                        <Crown className="h-4 w-4 mr-2" /> Upgrade Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {!creditsLoading && transactions.length > 0 && (
                <UsageHistoryTable transactions={transactions} />
              )}

              <ReferralProgram />
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-sm glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" /> Change Password
            </DialogTitle>
            <DialogDescription>Enter a new password for your account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="bg-muted/30 pr-10"
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowNewPw(!showNewPw)}>
                  {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="bg-muted/30" />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Passwords do not match
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword || newPassword.length < 8 || newPassword !== confirmPassword}>
              {isChangingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm glass-strong border-destructive/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder='Type "DELETE"' className="bg-muted/30 font-mono" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteConfirm !== "DELETE"} onClick={() => {
              toast({ title: "Contact Support", description: "Account deletion requires contacting support for data safety." });
              setShowDeleteDialog(false);
            }}>
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
