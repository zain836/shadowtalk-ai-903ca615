import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Cpu, Shield, Zap, Terminal, Key, Globe, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const codeExamples = {
  quickstart: `// Initialize the Shadow SDK
import { ShadowAI } from '@shadowtalk/sdk';

const shadow = new ShadowAI({
  apiKey: 'stk_your_api_key',
  mode: 'hybrid', // 'online' | 'offline' | 'hybrid'
});

// Run inference locally or in the cloud
const response = await shadow.chat({
  model: 'phi-3.5-mini',
  messages: [
    { role: 'user', content: 'Analyze Q3 revenue trends' }
  ],
  privacy: 'sovereign', // data never leaves device
});

console.log(response.content);`,
  embedding: `// Use the local embedding engine
const embeddings = await shadow.embed({
  input: ['privacy-first AI', 'on-device inference'],
  model: 'local-minilm',
});

// Semantic search across your private data
const results = await shadow.search({
  query: 'board meeting preparation',
  index: 'business-memories',
  topK: 5,
});`,
  agent: `// Create an autonomous agent
const agent = shadow.createAgent({
  name: 'MarketWatcher',
  tools: ['web-search', 'pdf-export', 'email-notify'],
  schedule: '0 9 * * *', // daily at 9 AM
});

agent.on('complete', (report) => {
  console.log('Market report:', report.summary);
});

await agent.run({
  goal: 'Monitor competitor pricing changes',
  scope: ['stripe.com', 'openai.com'],
});`,
};

const sdkFeatures = [
  { icon: Cpu, title: "On-Device Inference", description: "Run 7B+ models locally via WebGPU. Zero cloud dependency." },
  { icon: Shield, title: "Sovereign Privacy", description: "E2E encrypted. Data never leaves the user's device." },
  { icon: Zap, title: "Hybrid Mode", description: "Automatic fallback between local and cloud inference." },
  { icon: Globe, title: "Edge-First", description: "Optimized for low-latency, offline-capable applications." },
  { icon: Terminal, title: "Agent Framework", description: "Build autonomous agents with built-in tool orchestration." },
  { icon: Key, title: "API Keys & Billing", description: "Metered usage, rate limiting, and developer dashboard." },
];

const DevelopersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            <Code className="h-3.5 w-3.5 mr-1.5" />
            Shadow SDK
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            The <span className="gradient-text">"Intel Inside"</span> for On-Device AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Embed ShadowTalk's local inference engine into your own apps. Privacy-first, offline-capable AI for every developer.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/api')}>
              <Key className="mr-2 h-5 w-5" />
              Get API Key
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/docs')}>
              Read Docs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* SDK Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {sdkFeatures.map((f, i) => (
            <Card key={i} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Code Examples */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Ship in <span className="gradient-text">Minutes</span>, Not Months
          </h2>
          <Tabs defaultValue="quickstart" className="max-w-4xl mx-auto">
            <TabsList className="mx-auto flex w-fit">
              <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
              <TabsTrigger value="embedding">Embeddings & Search</TabsTrigger>
              <TabsTrigger value="agent">Autonomous Agents</TabsTrigger>
            </TabsList>
            {Object.entries(codeExamples).map(([key, code]) => (
              <TabsContent key={key} value={key}>
                <Card className="bg-card border-border">
                  <CardContent className="p-0">
                    <pre className="p-6 overflow-x-auto text-sm">
                      <code className="text-muted-foreground">{code}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Pricing */}
        <Card className="border-primary/20 bg-primary/5 max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Developer Pricing</h3>
            <p className="text-muted-foreground mb-6">Start free. Scale with usage.</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">Free</p>
                <p className="text-xs text-muted-foreground">1K requests/mo</p>
              </div>
              <div>
                <p className="text-2xl font-bold gradient-text">$29/mo</p>
                <p className="text-xs text-muted-foreground">50K requests/mo</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">Custom</p>
                <p className="text-xs text-muted-foreground">Enterprise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default DevelopersPage;
