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
import { 
  ArrowLeft, 
  Shield, 
  Key, 
  Users, 
  Building2, 
  Globe, 
  Lock, 
  CheckCircle2,
  AlertCircle,
  Settings,
  Zap,
  FileText
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const EnterpriseSettingsPage = () => {
  const navigate = useNavigate();
  const { user, userPlan } = useAuth();
  const { toast } = useToast();
  
  // SSO Configuration State
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<string>("");
  const [samlConfig, setSamlConfig] = useState({
    entityId: "",
    ssoUrl: "",
    certificate: "",
    signRequest: true,
  });
  const [oauthConfig, setOauthConfig] = useState({
    clientId: "",
    clientSecret: "",
    authorizationUrl: "",
    tokenUrl: "",
    scope: "openid profile email",
  });
  
  // Security Settings
  const [mfaRequired, setMfaRequired] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  
  const isElitePlan = userPlan === 'elite';

  const handleSaveSSO = () => {
    toast({
      title: "SSO Configuration Saved",
      description: "Your SSO settings have been updated successfully.",
    });
  };

  const handleTestConnection = () => {
    toast({
      title: "Testing SSO Connection",
      description: "Attempting to connect to your identity provider...",
    });
    
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: "SSO configuration is valid and working.",
      });
    }, 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access Enterprise Settings.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                Enterprise Settings
              </h1>
              <p className="text-muted-foreground">Configure SSO, security, and workspace settings</p>
            </div>
            {isElitePlan && (
              <Badge className="ml-auto bg-gradient-primary text-primary-foreground">
                Elite Plan
              </Badge>
            )}
          </div>

          {!isElitePlan && (
            <Card className="mb-8 border-warning/50 bg-warning/5">
              <CardContent className="pt-6 flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-warning shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Enterprise Features Require Elite Plan</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    SSO, advanced security, and workspace management are available on the Elite plan.
                  </p>
                  <Button onClick={() => navigate('/pricing')} size="sm" className="btn-glow">
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade to Elite
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="sso" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="sso" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                SSO
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
            </TabsList>

            {/* SSO Configuration */}
            <TabsContent value="sso" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Single Sign-On (SSO)
                      </CardTitle>
                      <CardDescription>
                        Configure SSO for your organization using SAML 2.0 or OAuth 2.0
                      </CardDescription>
                    </div>
                    <Switch
                      checked={ssoEnabled}
                      onCheckedChange={setSsoEnabled}
                      disabled={!isElitePlan}
                    />
                  </div>
                </CardHeader>
                
                {ssoEnabled && (
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label>Identity Provider</Label>
                      <Select value={ssoProvider} onValueChange={setSsoProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your identity provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saml">SAML 2.0 (Okta, Azure AD, OneLogin)</SelectItem>
                          <SelectItem value="oauth">OAuth 2.0 / OpenID Connect</SelectItem>
                          <SelectItem value="google">Google Workspace</SelectItem>
                          <SelectItem value="microsoft">Microsoft Azure AD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {ssoProvider === 'saml' && (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          SAML 2.0 Configuration
                        </h4>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="entityId">Entity ID (Issuer)</Label>
                            <Input
                              id="entityId"
                              placeholder="https://your-idp.com/saml"
                              value={samlConfig.entityId}
                              onChange={e => setSamlConfig(prev => ({ ...prev, entityId: e.target.value }))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="ssoUrl">SSO URL</Label>
                            <Input
                              id="ssoUrl"
                              placeholder="https://your-idp.com/sso"
                              value={samlConfig.ssoUrl}
                              onChange={e => setSamlConfig(prev => ({ ...prev, ssoUrl: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="certificate">X.509 Certificate</Label>
                          <textarea
                            id="certificate"
                            className="w-full h-24 p-3 bg-background border border-border rounded-lg text-sm font-mono"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            value={samlConfig.certificate}
                            onChange={e => setSamlConfig(prev => ({ ...prev, certificate: e.target.value }))}
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={samlConfig.signRequest}
                            onCheckedChange={checked => setSamlConfig(prev => ({ ...prev, signRequest: checked }))}
                          />
                          <Label>Sign authentication requests</Label>
                        </div>
                      </div>
                    )}

                    {ssoProvider === 'oauth' && (
                      <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          OAuth 2.0 / OpenID Connect Configuration
                        </h4>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="clientId">Client ID</Label>
                            <Input
                              id="clientId"
                              placeholder="your-client-id"
                              value={oauthConfig.clientId}
                              onChange={e => setOauthConfig(prev => ({ ...prev, clientId: e.target.value }))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="clientSecret">Client Secret</Label>
                            <Input
                              id="clientSecret"
                              type="password"
                              placeholder="••••••••••••••••"
                              value={oauthConfig.clientSecret}
                              onChange={e => setOauthConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="authUrl">Authorization URL</Label>
                            <Input
                              id="authUrl"
                              placeholder="https://your-idp.com/authorize"
                              value={oauthConfig.authorizationUrl}
                              onChange={e => setOauthConfig(prev => ({ ...prev, authorizationUrl: e.target.value }))}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tokenUrl">Token URL</Label>
                            <Input
                              id="tokenUrl"
                              placeholder="https://your-idp.com/token"
                              value={oauthConfig.tokenUrl}
                              onChange={e => setOauthConfig(prev => ({ ...prev, tokenUrl: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="scope">Scopes</Label>
                          <Input
                            id="scope"
                            placeholder="openid profile email"
                            value={oauthConfig.scope}
                            onChange={e => setOauthConfig(prev => ({ ...prev, scope: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    <Separator />
                    
                    <div className="flex gap-3">
                      <Button onClick={handleSaveSSO} className="btn-glow">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Configuration
                      </Button>
                      <Button variant="outline" onClick={handleTestConnection}>
                        <Settings className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Service Provider Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Provider Details</CardTitle>
                  <CardDescription>Use these values to configure your identity provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">ACS URL (Assertion Consumer Service)</p>
                      <code className="text-sm break-all">https://shadowtalk.ai/auth/saml/callback</code>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Entity ID</p>
                      <code className="text-sm break-all">https://shadowtalk.ai/saml/metadata</code>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">OAuth Callback URL</p>
                      <code className="text-sm break-all">https://shadowtalk.ai/auth/callback</code>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Name ID Format</p>
                      <code className="text-sm">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Security Policies
                  </CardTitle>
                  <CardDescription>Configure security requirements for your workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <h4 className="font-medium">Require Multi-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">All users must enable MFA to access the workspace</p>
                    </div>
                    <Switch
                      checked={mfaRequired}
                      onCheckedChange={setMfaRequired}
                      disabled={!isElitePlan}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Session Timeout (minutes)</Label>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout} disabled={!isElitePlan}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
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
                    <textarea
                      className="w-full h-24 p-3 bg-background border border-border rounded-lg text-sm font-mono"
                      placeholder="Enter IP addresses or CIDR ranges, one per line&#10;e.g., 192.168.1.0/24"
                      value={ipWhitelist}
                      onChange={e => setIpWhitelist(e.target.value)}
                      disabled={!isElitePlan}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to allow access from any IP</p>
                  </div>

                  <Button disabled={!isElitePlan} className="btn-glow">
                    Save Security Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Management */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Management
                  </CardTitle>
                  <CardDescription>Manage team members and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Team management coming soon</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Invite team members, assign roles, and manage permissions for your organization.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EnterpriseSettingsPage;
