import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Key, Copy, Eye, EyeOff, Trash2, Plus, Code, Terminal, Book, Zap, Shield, Clock, Activity, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface APIKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  created_at: string | null;
  last_used_at: string | null;
  is_active: boolean | null;
  rate_limit: number | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// Simple hash function for demo purposes (not cryptographic)
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "stk_live_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const APIPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [apiKeys, setApiKeys] = useState<APIKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Store full keys temporarily after creation (only visible once)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});

  const fetchKeys = useCallback(async () => {
    if (!user) { setApiKeys([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, key_hash, created_at, last_used_at, is_active, rate_limit")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch API keys:", error);
      toast({ title: "Error loading API keys", description: error.message, variant: "destructive" });
    } else {
      setApiKeys(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const createKey = async () => {
    if (!user || !newKeyName.trim()) return;
    setCreating(true);
    try {
      const fullKey = generateApiKey();
      const prefix = fullKey.slice(0, 12) + "...";
      const hash = await hashKey(fullKey);

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          name: newKeyName.trim(),
          key_prefix: prefix,
          key_hash: hash,
        })
        .select()
        .single();

      if (error) throw error;

      // Store the full key so user can copy it (only shown once)
      setRevealedKeys(prev => ({ ...prev, [data.id]: fullKey }));
      setNewKeyName("");
      await fetchKeys();
      toast({
        title: "API key created",
        description: "Copy your key now — it won't be shown again.",
      });
    } catch (err: any) {
      toast({ title: "Failed to create key", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
      setApiKeys(prev => prev.filter(k => k.id !== id));
      setRevealedKeys(prev => { const n = { ...prev }; delete n[id]; return n; });
      toast({ title: "API key deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete key", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getDisplayKey = (key: APIKeyRow) => {
    if (revealedKeys[key.id]) return revealedKeys[key.id];
    if (showKeys[key.id]) return key.key_prefix;
    return "stk_•••••••••••••••••••";
  };

  const codeExamples = {
    curl: `curl -X POST https://api.shadowtalk-ai.com/v1/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "model": "gemini-2.5-pro"
  }'`,
    javascript: `import { ShadowTalk } from '@shadowtalk/sdk';

const client = new ShadowTalk({
  apiKey: process.env.SHADOWTALK_API_KEY,
});

const response = await client.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'gemini-2.5-pro',
});

console.log(response.choices[0].message.content);`,
    python: `from shadowtalk import ShadowTalk

client = ShadowTalk(api_key="YOUR_API_KEY")

response = client.chat.completions.create(
    messages=[{"role": "user", "content": "Hello!"}],
    model="gemini-2.5-pro"
)

print(response.choices[0].message.content)`,
  };

  const endpoints = [
    { method: "POST", path: "/v1/chat/completions", description: "Create a chat completion" },
    { method: "POST", path: "/v1/images/generate", description: "Generate images from text" },
    { method: "GET", path: "/v1/models", description: "List available models" },
    { method: "POST", path: "/v1/embeddings", description: "Create text embeddings" },
    { method: "GET", path: "/v1/usage", description: "Get usage statistics" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[180px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
            <Code className="h-3 w-3 mr-1" /> Developer API
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            Developer <span className="gradient-text">API</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Build powerful integrations with our comprehensive REST API
          </p>
        </motion.div>

        <Tabs defaultValue="keys" className="space-y-6">
          <TabsList className="glass-subtle border-border/30">
            <TabsTrigger value="keys" className="gap-2"><Key className="h-4 w-4" />API Keys</TabsTrigger>
            <TabsTrigger value="docs" className="gap-2"><Book className="h-4 w-4" />Docs</TabsTrigger>
            <TabsTrigger value="examples" className="gap-2"><Code className="h-4 w-4" />Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6">
            {!user ? (
              <Card className="card-glass overflow-hidden">
                <CardContent className="py-12 text-center">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Sign in to manage API keys</p>
                  <p className="text-muted-foreground mb-4">You need an account to create and manage API keys.</p>
                  <Button className="btn-glow" onClick={() => navigate("/auth")}>Sign In</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Create Key */}
                <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                  <Card className="card-glass overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Create New API Key</CardTitle>
                      <CardDescription>Generate a new API key for your application</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor="keyName">Key Name</Label>
                          <Input
                            id="keyName"
                            placeholder="e.g., Production Server"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="bg-background/50 border-border/50"
                            onKeyDown={(e) => e.key === "Enter" && newKeyName.trim() && createKey()}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button className="btn-glow" disabled={!newKeyName.trim() || creating} onClick={createKey}>
                            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                            Create Key
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Existing Keys */}
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                  <Card className="card-glass overflow-hidden">
                    <CardHeader className="relative z-10">
                      <CardTitle>Your API Keys</CardTitle>
                      <CardDescription>Manage your existing API keys</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : apiKeys.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No API keys yet. Create one above to get started.</p>
                        </div>
                      ) : (
                        apiKeys.map((key) => (
                          <div key={key.id} className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{key.name}</span>
                                <Badge variant={key.is_active ? "outline" : "secondary"} className="text-xs border-border/50">
                                  {key.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {revealedKeys[key.id] && (
                                  <Badge className="text-xs bg-accent/20 text-accent border-accent/30">New — copy now!</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                                <span className="truncate">{getDisplayKey(key)}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => setShowKeys(prev => ({ ...prev, [key.id]: !prev[key.id] }))}>
                                  {showKeys[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => copyToClipboard(revealedKeys[key.id] || key.key_prefix)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Created {key.created_at ? new Date(key.created_at).toLocaleDateString() : "N/A"} • Last used {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive flex-shrink-0"
                              disabled={deletingId === key.id}
                              onClick={() => deleteKey(key.id)}
                            >
                              {deletingId === key.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Rate Limits */}
                <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                  <Card className="card-glass overflow-hidden">
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Rate Limits</CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { icon: Clock, label: "Requests per minute", value: "60", color: "text-primary" },
                          { icon: Zap, label: "Tokens per minute", value: "100,000", color: "text-secondary" },
                          { icon: Shield, label: "Daily limit", value: "10,000", color: "text-accent" },
                        ].map((stat, i) => (
                          <div key={i} className="glass-subtle rounded-xl p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <stat.icon className={`h-4 w-4 ${stat.color}`} />{stat.label}
                            </div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="card-glass overflow-hidden">
                <CardHeader className="relative z-10">
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>Available endpoints for the ShadowTalk API</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  {endpoints.map((endpoint, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 glass-subtle rounded-xl">
                      <Badge variant={endpoint.method === "GET" ? "secondary" : "default"} className="font-mono">{endpoint.method}</Badge>
                      <code className="flex-1 font-mono text-sm text-primary">{endpoint.path}</code>
                      <span className="text-muted-foreground text-sm">{endpoint.description}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="card-glass overflow-hidden">
                <CardHeader className="relative z-10"><CardTitle>Authentication</CardTitle></CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-muted-foreground mb-4">
                    All API requests require authentication. Include your key in the <code className="mx-1 px-2 py-0.5 glass-subtle rounded text-primary">Authorization</code> header:
                  </p>
                  <pre className="glass-subtle p-4 rounded-xl overflow-x-auto font-mono text-sm">
                    <code className="text-primary">Authorization: Bearer YOUR_API_KEY</code>
                  </pre>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            {Object.entries(codeExamples).map(([lang, code], i) => (
              <motion.div key={lang} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                <Card className="card-glass overflow-hidden">
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-primary" />
                      {lang === 'curl' ? 'cURL' : lang === 'javascript' ? 'JavaScript / TypeScript' : 'Python'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="relative">
                      <pre className="glass-subtle p-4 rounded-xl overflow-x-auto text-sm font-mono">
                        <code className="text-muted-foreground">{code}</code>
                      </pre>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 hover:bg-primary/10" onClick={() => copyToClipboard(code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default APIPage;
