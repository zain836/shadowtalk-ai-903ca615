import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Unlink, CheckCircle2, ExternalLink, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { lovable } from "@/integrations/lovable/index";

const tabMotion = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

interface LinkedAccountsTabProps {
  userId: string;
  email: string;
}

export const LinkedAccountsTab = ({ userId, email }: LinkedAccountsTabProps) => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const { data } = await supabase
          .from("shadow_vault_connections")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true);
        setConnections(data || []);
      } catch (e) {
        console.error("Failed to load connections", e);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [userId]);

  const socialProviders = [
    { name: "Google", icon: "🔷", connected: true, description: "Sign in & calendar sync" },
    { name: "Apple", icon: "🍎", connected: false, description: "Sign in with Apple ID" },
  ];

  const integrations = [
    { name: "WhatsApp", icon: "💬", type: "messaging", description: "Receive AI insights via WhatsApp" },
    { name: "Slack", icon: "📱", type: "productivity", description: "Get notifications in Slack" },
    { name: "Notion", icon: "📝", type: "productivity", description: "Sync knowledge base" },
    { name: "GitHub", icon: "🐙", type: "development", description: "Code analysis & automation" },
  ];

  return (
    <motion.div {...tabMotion} className="space-y-6">
      {/* Social Sign-In */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Sign-In Methods
          </CardTitle>
          <CardDescription>Manage how you sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Email */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-sm font-medium">Email & Password</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
            </Badge>
          </div>

          {socialProviders.map((provider) => (
            <div key={provider.name} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <p className="text-sm font-medium">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                </div>
              </div>
              {provider.connected ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={async () => {
                  await lovable.auth.signInWithOAuth(provider.name.toLowerCase() as "google" | "apple", {
                    redirect_uri: window.location.origin,
                  });
                }}>
                  <Link2 className="h-3 w-3 mr-1" /> Connect
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Integrations
          </CardTitle>
          <CardDescription>Connect third-party services to enhance your workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {integrations.map((integration) => {
            const isConnected = connections.some(c => c.service_name.toLowerCase() === integration.name.toLowerCase());
            return (
              <div key={integration.name} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                      <Unlink className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};
