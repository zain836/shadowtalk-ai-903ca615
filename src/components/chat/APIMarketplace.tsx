import { useState, useEffect } from "react";
import { 
  Store, Key, Zap, Shield, BarChart3, Copy, 
  Eye, EyeOff, Plus, Trash2, Clock, Globe,
  Code, ExternalLink, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
  rate_limit: number;
  permissions: string[];
}

interface UsageMetric {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface APIMarketplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_TIERS = [
  {
    name: "Developer",
    price: 0,
    requests: 1000,
    rateLimit: 10,
    features: ["Basic API access", "Community support", "Standard models"],
  },
  {
    name: "Startup",
    price: 49,
    requests: 50000,
    rateLimit: 100,
    features: ["Priority API access", "Email support", "All models", "Webhooks"],
  },
  {
    name: "Enterprise",
    price: 299,
    requests: 500000,
    rateLimit: 1000,
    features: ["Unlimited access", "Dedicated support", "Custom models", "SLA guarantee", "White-label"],
  },
];

const CODE_EXAMPLES = {
  curl: `curl -X POST https://api.shadowtalk-ai.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'`,
  
  javascript: `const response = await fetch('https://api.shadowtalk-ai.com/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);`,

  python: `import requests

response = requests.post(
    'https://api.shadowtalk-ai.com/v1/chat',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    }
)

print(response.json()['choices'][0]['message']['content'])`,
};

export const APIMarketplace = ({ isOpen, onClose }: APIMarketplaceProps) => {
  const { user, userPlan } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCodeLang, setSelectedCodeLang] = useState<"curl" | "javascript" | "python">("javascript");
  const [usageMetrics, setUsageMetrics] = useState<UsageMetric[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && user) {
      loadApiKeys();
      loadUsageMetrics();
    }
  }, [isOpen, user]);

  const loadApiKeys = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      setApiKeys(data.map(k => ({
        ...k,
        permissions: (k.permissions as string[]) || ['read', 'write']
      })));
    }
  };

  const loadUsageMetrics = async () => {
    if (!user) return;
    
    // Fetch real usage data from usage_analytics for last 7 days
    const metrics: UsageMetric[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
      
      const { data, count } = await supabase
        .from('usage_analytics')
        .select('tokens_used', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', dayStart)
        .lt('created_at', dayEnd);
      
      const totalTokens = (data || []).reduce((sum, r) => sum + (r.tokens_used || 0), 0);
      metrics.push({
        date: date.toISOString().split('T')[0],
        requests: count || 0,
        tokens: totalTokens,
        cost: totalTokens * 0.00001, // $0.01 per 1000 tokens estimate
      });
    }
    setUsageMetrics(metrics);
  };

  const createApiKey = async () => {
    if (!user || !newKeyName.trim()) return;
    
    setIsCreating(true);
    
    try {
      // Generate a secure API key
      const keyBytes = crypto.getRandomValues(new Uint8Array(32));
      const fullKey = `stk_${Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      const keyPrefix = fullKey.slice(0, 12) + '...';
      
      // Hash the key for storage
      const encoder = new TextEncoder();
      const data = encoder.encode(fullKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const keyHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          rate_limit: userPlan === 'elite' ? 1000 : userPlan === 'premium' ? 100 : 10,
          permissions: ['read', 'write'],
          is_active: true,
        });
      
      if (error) throw error;
      
      setShowNewKey(fullKey);
      setNewKeyName("");
      loadApiKeys();
      
      toast({ title: "API Key Created", description: "Save your key now - you won't see it again!" });
      
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast({ title: "Error", description: "Failed to create API key", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);
    
    if (!error) {
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      toast({ title: "API Key Deleted" });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const totalRequests = usageMetrics.reduce((sum, m) => sum + m.requests, 0);
  const totalTokens = usageMetrics.reduce((sum, m) => sum + m.tokens, 0);
  const totalCost = usageMetrics.reduce((sum, m) => sum + m.cost, 0);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              API Marketplace
              <Badge variant="secondary" className="text-xs">Developer Portal</Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Monetize your AI integrations with our powerful API
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="container max-w-6xl mx-auto p-6 space-y-8">
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>This Week</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  {totalRequests.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">API Requests</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Tokens Used</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  {(totalTokens / 1000).toFixed(1)}K
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Total tokens</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Estimated Cost</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Globe className="h-5 w-5 text-green-500" />
                  ${totalCost.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Usage charges</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Keys</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Key className="h-5 w-5 text-purple-500" />
                  {apiKeys.filter(k => k.is_active).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">API keys</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="keys" className="space-y-6">
            <TabsList>
              <TabsTrigger value="keys" className="gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="docs" className="gap-2">
                <Code className="h-4 w-4" />
                Documentation
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2">
                <Store className="h-4 w-4" />
                Pricing
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="keys" className="space-y-6">
              {/* New Key Created Alert */}
              <AnimatePresence>
                {showNewKey && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 rounded-lg bg-green-500/10 border border-green-500/30"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <p className="font-medium text-green-500">API Key Created Successfully!</p>
                        <p className="text-sm text-muted-foreground">
                          Copy your API key now. You won't be able to see it again.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-background rounded text-sm font-mono">
                            {showNewKey}
                          </code>
                          <Button size="sm" onClick={() => copyToClipboard(showNewKey)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setShowNewKey(null)}
                          className="mt-2"
                        >
                          I've saved my key
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Create New Key */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Create New API Key</CardTitle>
                  <CardDescription>
                    Generate a new API key for your applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Key name (e.g., Production, Development)"
                      className="flex-1"
                    />
                    <Button onClick={createApiKey} disabled={!newKeyName.trim() || isCreating}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Key
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Keys */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your API Keys</CardTitle>
                  <CardDescription>
                    Manage your existing API keys
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {apiKeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No API keys yet. Create one to get started!
                    </p>
                  ) : (
                    apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <Key className={`h-4 w-4 ${key.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                          <div>
                            <p className="font-medium text-sm">{key.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <code>{key.key_prefix}</code>
                              <span>•</span>
                              <span>{key.rate_limit} req/min</span>
                              {key.last_used_at && (
                                <>
                                  <span>•</span>
                                  <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={key.is_active ? "default" : "secondary"}>
                            {key.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(key.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documentation Tab */}
            <TabsContent value="docs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Start</CardTitle>
                  <CardDescription>
                    Get started with the ShadowTalk AI API in minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    {(["curl", "javascript", "python"] as const).map((lang) => (
                      <Button
                        key={lang}
                        variant={selectedCodeLang === lang ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCodeLang(lang)}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-muted/50 overflow-x-auto text-sm">
                      <code>{CODE_EXAMPLES[selectedCodeLang]}</code>
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(CODE_EXAMPLES[selectedCodeLang])}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">API Endpoints</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { method: "POST", path: "/v1/chat", desc: "Send chat messages" },
                    { method: "POST", path: "/v1/images/generate", desc: "Generate images" },
                    { method: "POST", path: "/v1/audio/transcribe", desc: "Transcribe audio" },
                    { method: "GET", path: "/v1/models", desc: "List available models" },
                    { method: "GET", path: "/v1/usage", desc: "Get usage statistics" },
                  ].map((endpoint) => (
                    <div key={endpoint.path} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <Badge variant={endpoint.method === "POST" ? "default" : "secondary"}>
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm font-mono">{endpoint.path}</code>
                      <span className="text-sm text-muted-foreground ml-auto">{endpoint.desc}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {API_TIERS.map((tier, i) => (
                  <Card key={tier.name} className={i === 1 ? "border-primary ring-2 ring-primary/20" : ""}>
                    <CardHeader>
                      {i === 1 && (
                        <Badge className="w-fit mb-2">Most Popular</Badge>
                      )}
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription>
                        <span className="text-3xl font-bold text-foreground">
                          ${tier.price}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Requests</span>
                          <span className="font-medium">{tier.requests.toLocaleString()}/mo</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Rate Limit</span>
                          <span className="font-medium">{tier.rateLimit} req/min</span>
                        </div>
                      </div>
                      <div className="space-y-2 pt-4 border-t">
                        {tier.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <Button className="w-full" variant={i === 1 ? "default" : "outline"}>
                        {tier.price === 0 ? "Current Plan" : "Upgrade"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </motion.div>
  );
};
