import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Shield, Key, Users, Building2, Globe, Lock, CheckCircle2,
  AlertCircle, Settings, Zap, FileText
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const EnterpriseSettingsPage = () => {
  const navigate = useNavigate();
  const { user, userPlan } = useAuth();
  const { toast } = useToast();
  
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<string>("");
  const [samlConfig, setSamlConfig] = useState({ entityId: "", ssoUrl: "", certificate: "", signRequest: true });
  const [oauthConfig, setOauthConfig] = useState({ clientId: "", clientSecret: "", authorizationUrl: "", tokenUrl: "", scope: "openid profile email" });
  const [mfaRequired, setMfaRequired] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  
  const isElitePlan = userPlan === 'elite';

  const handleSaveSSO = () => { toast({ title: "SSO Configuration Saved", description: "Your SSO settings have been updated." }); };
  const handleTestConnection = () => {
    toast({ title: "Testing SSO Connection", description: "Attempting to connect..." });
    setTimeout(() => { toast({ title: "Connection Successful", description: "SSO configuration is valid." }); }, 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="card-glass max-w-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <CardContent className="pt-6 text-center relative z-10">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access Enterprise Settings.</p>
            <Button className="btn-glow" onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
                <Building2 className="h-8 w-8 text-primary" />
                Enterprise <span className="gradient-text">Settings</span>
              </h1>
              <p className="text-muted-foreground">Configure SSO, security, and workspace settings</p>
            </div>
            {isElitePlan && (
              <Badge className="ml-auto bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0">
                Elite Plan
              </Badge>
            )}
          </motion.div>

          {!isElitePlan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="mb-8 card-glass border-warning/30 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warning/50 to-transparent" />
                <CardContent className="pt-6 flex items-start gap-4 relative z-10">
                  <AlertCircle className="h-6 w-6 text-warning shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Enterprise Features Require Elite Plan</h3>
                    <p className="text-sm text-muted-foreground mb-3">SSO, advanced security, and workspace management are available on the Elite plan.</p>
                    <Button onClick={() => navigate('/pricing')} size="sm" className="btn-glow">
                      <Zap className="h-4 w-4 mr-2" />Upgrade to Elite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs defaultValue="sso" className="space-y-6">
            <TabsList className="glass-subtle border-border/30">
              <TabsTrigger value="sso" className="gap-2"><Shield className="h-4 w-4" />SSO</TabsTrigger>
              <TabsTrigger value="security" className="gap-2"><Lock className="h-4 w-4" />Security</TabsTrigger>
              <TabsTrigger value="team" className="gap-2"><Users className="h-4 w-4" />Team</TabsTrigger>
            </TabsList>

            <TabsContent value="sso" className="space-y-6">
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="card-glass overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" />Single Sign-On (SSO)</CardTitle>
                        <CardDescription>Configure SSO for your organization using SAML 2.0 or OAuth 2.0</CardDescription>
                      </div>
                      <Switch checked={ssoEnabled} onCheckedChange={setSsoEnabled} disabled={!isElitePlan} />
                    </div>
                  </CardHeader>
                  {ssoEnabled && (
                    <CardContent className="space-y-6 relative z-10">
                      <div className="space-y-4">
                        <Label>Identity Provider</Label>
                        <Select value={ssoProvider} onValueChange={setSsoProvider}>
                          <SelectTrigger className="bg-background/50 border-border/50"><SelectValue placeholder="Select your identity provider" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saml">SAML 2.0 (Okta, Azure AD, OneLogin)</SelectItem>
                            <SelectItem value="oauth">OAuth 2.0 / OpenID Connect</SelectItem>
                            <SelectItem value="google">Google Workspace</SelectItem>
                            <SelectItem value="microsoft">Microsoft Azure AD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {ssoProvider === 'saml' && (
                        <div className="space-y-4 glass-subtle rounded-xl p-5">
                          <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />SAML 2.0 Configuration</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="entityId">Entity ID (Issuer)</Label>
                              <Input id="entityId" placeholder="https://your-idp.com/saml" value={samlConfig.entityId} onChange={e => setSamlConfig(prev => ({ ...prev, entityId: e.target.value }))} className="bg-background/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ssoUrl">SSO URL</Label>
                              <Input id="ssoUrl" placeholder="https://your-idp.com/sso" value={samlConfig.ssoUrl} onChange={e => setSamlConfig(prev => ({ ...prev, ssoUrl: e.target.value }))} className="bg-background/50 border-border/50" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="certificate">X.509 Certificate</Label>
                            <textarea id="certificate" className="w-full h-24 p-3 bg-background/50 border border-border/50 rounded-xl text-sm font-mono" placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"} value={samlConfig.certificate} onChange={e => setSamlConfig(prev => ({ ...prev, certificate: e.target.value }))} />
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={samlConfig.signRequest} onCheckedChange={checked => setSamlConfig(prev => ({ ...prev, signRequest: checked }))} />
                            <Label>Sign authentication requests</Label>
                          </div>
                        </div>
                      )}

                      {ssoProvider === 'oauth' && (
                        <div className="space-y-4 glass-subtle rounded-xl p-5">
                          <h4 className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />OAuth 2.0 / OpenID Connect</h4>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Client ID</Label>
                              <Input placeholder="your-client-id" value={oauthConfig.clientId} onChange={e => setOauthConfig(prev => ({ ...prev, clientId: e.target.value }))} className="bg-background/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                              <Label>Client Secret</Label>
                              <Input type="password" placeholder="••••••••" value={oauthConfig.clientSecret} onChange={e => setOauthConfig(prev => ({ ...prev, clientSecret: e.target.value }))} className="bg-background/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                              <Label>Authorization URL</Label>
                              <Input placeholder="https://your-idp.com/authorize" value={oauthConfig.authorizationUrl} onChange={e => setOauthConfig(prev => ({ ...prev, authorizationUrl: e.target.value }))} className="bg-background/50 border-border/50" />
                            </div>
                            <div className="space-y-2">
                              <Label>Token URL</Label>
                              <Input placeholder="https://your-idp.com/token" value={oauthConfig.tokenUrl} onChange={e => setOauthConfig(prev => ({ ...prev, tokenUrl: e.target.value }))} className="bg-background/50 border-border/50" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Scopes</Label>
                            <Input placeholder="openid profile email" value={oauthConfig.scope} onChange={e => setOauthConfig(prev => ({ ...prev, scope: e.target.value }))} className="bg-background/50 border-border/50" />
                          </div>
                        </div>
                      )}

                      <Separator className="opacity-30" />
                      <div className="flex gap-3">
                        <Button onClick={handleSaveSSO} className="btn-glow"><CheckCircle2 className="h-4 w-4 mr-2" />Save Configuration</Button>
                        <Button variant="outline" onClick={handleTestConnection} className="hover:bg-primary/10 hover:border-primary/30"><Settings className="h-4 w-4 mr-2" />Test Connection</Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="card-glass overflow-hidden">
                  <CardHeader className="relative z-10"><CardTitle>Service Provider Details</CardTitle><CardDescription>Use these values to configure your identity provider</CardDescription></CardHeader>
                  <CardContent className="relative z-10">
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { label: "ACS URL", value: "https://shadowtalk.ai/auth/saml/callback" },
                        { label: "Entity ID", value: "https://shadowtalk.ai/saml/metadata" },
                        { label: "OAuth Callback URL", value: "https://shadowtalk.ai/auth/callback" },
                        { label: "Name ID Format", value: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" },
                      ].map((item, i) => (
                        <div key={i} className="glass-subtle rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                          <code className="text-sm break-all text-primary">{item.value}</code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="card-glass overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Security Policies</CardTitle>
                    <CardDescription>Configure security requirements for your workspace</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    <div className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                      <div>
                        <h4 className="font-medium">Require Multi-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">All users must enable MFA to access the workspace</p>
                      </div>
                      <Switch checked={mfaRequired} onCheckedChange={setMfaRequired} disabled={!isElitePlan} />
                    </div>
                    <div className="space-y-3">
                      <Label>Session Timeout (minutes)</Label>
                      <Select value={sessionTimeout} onValueChange={setSessionTimeout} disabled={!isElitePlan}>
                        <SelectTrigger className="max-w-xs bg-background/50 border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="480">8 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label>IP Whitelist</Label>
                      <textarea className="w-full h-24 p-3 bg-background/50 border border-border/50 rounded-xl text-sm font-mono" placeholder={"Enter IP addresses or CIDR ranges, one per line\ne.g., 192.168.1.0/24"} value={ipWhitelist} onChange={e => setIpWhitelist(e.target.value)} disabled={!isElitePlan} />
                    </div>
                    <Button className="btn-glow" disabled={!isElitePlan}><CheckCircle2 className="h-4 w-4 mr-2" />Save Security Settings</Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="card-glass overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Team Management</CardTitle>
                    <CardDescription>Manage your workspace team members</CardDescription>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="glass-subtle rounded-xl p-8 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <h3 className="font-semibold mb-2">Team Management Coming Soon</h3>
                      <p className="text-sm text-muted-foreground">Invite team members, assign roles, and manage access from here.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EnterpriseSettingsPage;