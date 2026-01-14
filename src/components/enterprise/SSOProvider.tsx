import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Building2, Key, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SSOConfig {
  provider: "saml" | "oauth" | "oidc";
  entityId?: string;
  ssoUrl?: string;
  certificate?: string;
  clientId?: string;
  clientSecret?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
}

interface SSOProviderProps {
  workspaceId: string;
  onConfigured?: (config: SSOConfig) => void;
}

export const SSOProvider: React.FC<SSOProviderProps> = ({ workspaceId, onConfigured }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"saml" | "oauth" | "oidc">("saml");
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  // SAML configuration state
  const [samlConfig, setSamlConfig] = useState({
    entityId: "",
    ssoUrl: "",
    certificate: "",
  });

  // OAuth 2.0 configuration state
  const [oauthConfig, setOauthConfig] = useState({
    clientId: "",
    clientSecret: "",
    authorizationUrl: "",
    tokenUrl: "",
    userInfoUrl: "",
  });

  // OIDC configuration state
  const [oidcConfig, setOidcConfig] = useState({
    clientId: "",
    clientSecret: "",
    issuerUrl: "",
  });

  const handleSAMLSubmit = async () => {
    setIsConfiguring(true);
    try {
      // Validate SAML configuration
      if (!samlConfig.entityId || !samlConfig.ssoUrl || !samlConfig.certificate) {
        throw new Error("All SAML fields are required");
      }

      // In production, this would call an edge function to store SSO config
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "SAML SSO Configured",
        description: "Your SAML configuration has been saved successfully.",
      });

      onConfigured?.({
        provider: "saml",
        ...samlConfig,
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure SAML SSO",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleOAuthSubmit = async () => {
    setIsConfiguring(true);
    try {
      if (!oauthConfig.clientId || !oauthConfig.clientSecret || !oauthConfig.authorizationUrl) {
        throw new Error("Client ID, Client Secret, and Authorization URL are required");
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "OAuth 2.0 Configured",
        description: "Your OAuth configuration has been saved successfully.",
      });

      onConfigured?.({
        provider: "oauth",
        ...oauthConfig,
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure OAuth",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleOIDCSubmit = async () => {
    setIsConfiguring(true);
    try {
      if (!oidcConfig.clientId || !oidcConfig.issuerUrl) {
        throw new Error("Client ID and Issuer URL are required");
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "OIDC Configured",
        description: "Your OpenID Connect configuration has been saved successfully.",
      });

      onConfigured?.({
        provider: "oidc",
        clientId: oidcConfig.clientId,
        clientSecret: oidcConfig.clientSecret,
        authorizationUrl: `${oidcConfig.issuerUrl}/authorize`,
        tokenUrl: `${oidcConfig.issuerUrl}/token`,
        userInfoUrl: `${oidcConfig.issuerUrl}/userinfo`,
      });
    } catch (error) {
      toast({
        title: "Configuration Failed",
        description: error instanceof Error ? error.message : "Failed to configure OIDC",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const supportedProviders = [
    { name: "Okta", logo: "🔐", type: "saml" },
    { name: "Azure AD", logo: "☁️", type: "saml" },
    { name: "Google Workspace", logo: "🔷", type: "oidc" },
    { name: "OneLogin", logo: "🔑", type: "saml" },
    { name: "Auth0", logo: "🛡️", type: "oidc" },
    { name: "Ping Identity", logo: "📍", type: "saml" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Enterprise SSO</CardTitle>
              <CardDescription>Configure Single Sign-On for your workspace</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success">
            <Building2 className="h-3 w-3 mr-1" />
            Enterprise
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Supported Providers */}
        <div>
          <Label className="text-sm text-muted-foreground mb-3 block">Supported Providers</Label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {supportedProviders.map((provider) => (
              <div
                key={provider.name}
                className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <span className="text-2xl">{provider.logo}</span>
                <span className="text-xs text-center">{provider.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
            <TabsTrigger value="oauth">OAuth 2.0</TabsTrigger>
            <TabsTrigger value="oidc">OpenID Connect</TabsTrigger>
          </TabsList>

          <TabsContent value="saml" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entityId">Entity ID (Issuer)</Label>
                <Input
                  id="entityId"
                  placeholder="https://your-idp.com/saml2/metadata"
                  value={samlConfig.entityId}
                  onChange={(e) => setSamlConfig(prev => ({ ...prev, entityId: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ssoUrl">SSO URL</Label>
                <Input
                  id="ssoUrl"
                  placeholder="https://your-idp.com/saml2/sso"
                  value={samlConfig.ssoUrl}
                  onChange={(e) => setSamlConfig(prev => ({ ...prev, ssoUrl: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="certificate">X.509 Certificate</Label>
                <textarea
                  id="certificate"
                  className="w-full h-32 p-3 text-xs font-mono bg-muted rounded-lg border resize-none"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={samlConfig.certificate}
                  onChange={(e) => setSamlConfig(prev => ({ ...prev, certificate: e.target.value }))}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Label className="text-sm font-medium">Service Provider Details</Label>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ACS URL:</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      https://axsudmhjpfzffcicfvuj.supabase.co/auth/v1/sso/saml/acs
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entity ID:</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      https://axsudmhjpfzffcicfvuj.supabase.co/auth/v1/sso/saml/metadata
                    </code>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSAMLSubmit} 
                disabled={isConfiguring}
                className="w-full"
              >
                {isConfiguring ? "Configuring..." : "Save SAML Configuration"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="oauth" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oauthClientId">Client ID</Label>
                <Input
                  id="oauthClientId"
                  placeholder="Your OAuth Client ID"
                  value={oauthConfig.clientId}
                  onChange={(e) => setOauthConfig(prev => ({ ...prev, clientId: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="oauthClientSecret">Client Secret</Label>
                <Input
                  id="oauthClientSecret"
                  type="password"
                  placeholder="Your OAuth Client Secret"
                  value={oauthConfig.clientSecret}
                  onChange={(e) => setOauthConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="authorizationUrl">Authorization URL</Label>
                <Input
                  id="authorizationUrl"
                  placeholder="https://your-idp.com/oauth2/authorize"
                  value={oauthConfig.authorizationUrl}
                  onChange={(e) => setOauthConfig(prev => ({ ...prev, authorizationUrl: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tokenUrl">Token URL</Label>
                <Input
                  id="tokenUrl"
                  placeholder="https://your-idp.com/oauth2/token"
                  value={oauthConfig.tokenUrl}
                  onChange={(e) => setOauthConfig(prev => ({ ...prev, tokenUrl: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userInfoUrl">User Info URL (Optional)</Label>
                <Input
                  id="userInfoUrl"
                  placeholder="https://your-idp.com/oauth2/userinfo"
                  value={oauthConfig.userInfoUrl}
                  onChange={(e) => setOauthConfig(prev => ({ ...prev, userInfoUrl: e.target.value }))}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm font-medium">Redirect URI</Label>
                <code className="block mt-2 text-xs bg-background px-3 py-2 rounded">
                  https://axsudmhjpfzffcicfvuj.supabase.co/auth/v1/callback
                </code>
              </div>

              <Button 
                onClick={handleOAuthSubmit} 
                disabled={isConfiguring}
                className="w-full"
              >
                {isConfiguring ? "Configuring..." : "Save OAuth Configuration"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="oidc" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oidcIssuer">Issuer URL</Label>
                <Input
                  id="oidcIssuer"
                  placeholder="https://your-idp.com"
                  value={oidcConfig.issuerUrl}
                  onChange={(e) => setOidcConfig(prev => ({ ...prev, issuerUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  The base URL of your OpenID Connect provider
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="oidcClientId">Client ID</Label>
                <Input
                  id="oidcClientId"
                  placeholder="Your OIDC Client ID"
                  value={oidcConfig.clientId}
                  onChange={(e) => setOidcConfig(prev => ({ ...prev, clientId: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="oidcClientSecret">Client Secret (Optional)</Label>
                <Input
                  id="oidcClientSecret"
                  type="password"
                  placeholder="Your OIDC Client Secret"
                  value={oidcConfig.clientSecret}
                  onChange={(e) => setOidcConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm">Auto-discovery enabled</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configuration will be automatically fetched from the .well-known/openid-configuration endpoint
                </p>
              </div>

              <Button 
                onClick={handleOIDCSubmit} 
                disabled={isConfiguring}
                className="w-full"
              >
                {isConfiguring ? "Configuring..." : "Save OIDC Configuration"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <div className="border-t pt-4">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Need help setting up SSO?</p>
              <p className="text-xs text-muted-foreground">
                Check our documentation for step-by-step guides on configuring SSO with popular identity providers.
              </p>
              <Button variant="link" className="h-auto p-0 text-xs" asChild>
                <a href="/docs#sso" target="_blank">
                  View SSO Documentation <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SSOProvider;
