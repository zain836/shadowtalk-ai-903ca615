import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Key, Copy, Eye, EyeOff, Trash2, Plus, Code, Terminal, Book, Zap, Shield, Clock, Activity } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface APIKey {
  id: string; name: string; key: string; created_at: string; last_used: string | null; requests: number;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const APIPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newKeyName, setNewKeyName] = useState("");

  const [apiKeys] = useState<APIKey[]>([
    { id: "1", name: "Production Key", key: "stk_live_abc123xyz789...", created_at: "2025-01-01T00:00:00Z", last_used: "2025-01-09T10:30:00Z", requests: 15420 },
    { id: "2", name: "Development Key", key: "stk_test_def456uvw012...", created_at: "2025-01-05T00:00:00Z", last_used: "2025-01-08T14:22:00Z", requests: 892 },
  ]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const codeExamples = {
    curl: `curl -X POST https://api.shadowtalk.ai/v1/chat \\
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
                      <Input id="keyName" placeholder="e.g., Production Server" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="bg-background/50 border-border/50" />
                    </div>
                    <div className="flex items-end">
                      <Button className="btn-glow" disabled={!newKeyName} onClick={() => { toast({ title: "API key created" }); setNewKeyName(""); }}>
                        <Plus className="h-4 w-4 mr-2" />Create Key
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
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-4 glass-subtle rounded-xl">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.name}</span>
                          <Badge variant="outline" className="text-xs border-border/50">{key.requests.toLocaleString()} requests</Badge>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                          {showKeys[key.id] ? key.key : "stk_•••••••••••••••••••"}
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKeys(prev => ({ ...prev, [key.id]: !prev[key.id] }))}>
                            {showKeys[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(key.key)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(key.created_at).toLocaleDateString()} • Last used {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
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
