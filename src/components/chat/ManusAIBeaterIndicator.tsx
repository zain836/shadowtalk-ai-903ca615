import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Brain, WifiOff, Globe, Users,
  ChevronDown, CheckCircle2, XCircle, Sparkles,
  Lock, Server, Cpu, Eye, Bot, Workflow,
  FileText, Code, Minus, Crown, Video,
  Mic, Upload, HardDrive, MonitorSmartphone,
  Layers, Search, Palette, MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Status = "yes" | "no" | "partial" | "superior" | "free" | "paid";

interface Feature {
  name: string;
  description: string;
  shadowtalk: Status;
  manus: Status;
  chatgpt: Status;
  claude: Status;
  gemini: Status;
  icon: React.ReactNode;
  category: string;
}

const FEATURES: Feature[] = [
  // Privacy & Security
  { name: "100% Offline Mode", description: "Full AI without internet — WebGPU local inference", shadowtalk: "free", manus: "no", chatgpt: "no", claude: "no", gemini: "no", icon: <WifiOff className="h-3.5 w-3.5" />, category: "privacy" },
  { name: "Zero-Knowledge Privacy", description: "Data never leaves your device", shadowtalk: "superior", manus: "no", chatgpt: "no", claude: "no", gemini: "no", icon: <Shield className="h-3.5 w-3.5" />, category: "privacy" },
  { name: "Encrypted Stealth Vault", description: "AES-256-GCM client-side encryption", shadowtalk: "free", manus: "no", chatgpt: "no", claude: "no", gemini: "no", icon: <Lock className="h-3.5 w-3.5" />, category: "privacy" },

  // Agentic
  { name: "Autonomous Agent Missions", description: "24/7 background task execution engine", shadowtalk: "superior", manus: "yes", chatgpt: "paid", claude: "no", gemini: "no", icon: <Bot className="h-3.5 w-3.5" />, category: "agentic" },
  { name: "Multi-Step Task Planning", description: "Planner-Executor-Critic autonomous loops", shadowtalk: "superior", manus: "yes", chatgpt: "paid", claude: "partial", gemini: "partial", icon: <Workflow className="h-3.5 w-3.5" />, category: "agentic" },
  { name: "30+ Tool Orchestration", description: "Natural language intent → auto-tool execution", shadowtalk: "superior", manus: "yes", chatgpt: "partial", claude: "partial", gemini: "no", icon: <Layers className="h-3.5 w-3.5" />, category: "agentic" },
  { name: "Visual Execution Dashboard", description: "Node-graph pipeline with live status", shadowtalk: "superior", manus: "partial", chatgpt: "no", claude: "no", gemini: "no", icon: <Eye className="h-3.5 w-3.5" />, category: "agentic" },
  { name: "Multi-Model Consensus", description: "GPT + Gemini + Claude simultaneous query", shadowtalk: "free", manus: "no", chatgpt: "no", claude: "no", gemini: "no", icon: <Brain className="h-3.5 w-3.5" />, category: "agentic" },
  { name: "Human-in-the-Loop Safety", description: "Approve/reject agent actions in real-time", shadowtalk: "superior", manus: "partial", chatgpt: "partial", claude: "no", gemini: "no", icon: <Shield className="h-3.5 w-3.5" />, category: "agentic" },
  { name: "Computer Use / Operator", description: "Autonomous browser automation agent", shadowtalk: "free", manus: "yes", chatgpt: "paid", claude: "paid", gemini: "no", icon: <MonitorSmartphone className="h-3.5 w-3.5" />, category: "agentic" },

  // Generation & Creation
  { name: "Advanced Voice Mode", description: "Real-time voice conversation via ElevenLabs", shadowtalk: "free", manus: "no", chatgpt: "paid", claude: "no", gemini: "partial", icon: <Mic className="h-3.5 w-3.5" />, category: "generation" },
  { name: "Code Interpreter (Sandbox)", description: "In-browser WebContainer code execution", shadowtalk: "free", manus: "partial", chatgpt: "paid", claude: "partial", gemini: "no", icon: <Code className="h-3.5 w-3.5" />, category: "generation" },
  { name: "Image Generation", description: "AI-powered image creation", shadowtalk: "free", manus: "no", chatgpt: "paid", claude: "no", gemini: "yes", icon: <Palette className="h-3.5 w-3.5" />, category: "generation" },
  { name: "Document & Report Gen", description: "PDFs, slides, articles, strategies", shadowtalk: "free", manus: "yes", chatgpt: "partial", claude: "partial", gemini: "no", icon: <FileText className="h-3.5 w-3.5" />, category: "generation" },
  { name: "Presentation Builder", description: "AI-generated slide decks with export", shadowtalk: "superior", manus: "yes", chatgpt: "no", claude: "no", gemini: "no", icon: <Cpu className="h-3.5 w-3.5" />, category: "generation" },
  { name: "Canvas / Artifacts", description: "Inline document & code editing", shadowtalk: "free", manus: "no", chatgpt: "paid", claude: "yes", gemini: "no", icon: <FileText className="h-3.5 w-3.5" />, category: "generation" },
  { name: "Deep Research Engine", description: "Multi-source analysis with citations", shadowtalk: "free", manus: "partial", chatgpt: "paid", claude: "no", gemini: "partial", icon: <Search className="h-3.5 w-3.5" />, category: "generation" },

  // File & Data
  { name: "File Upload & Analysis", description: "PDF, spreadsheet, image parsing", shadowtalk: "free", manus: "yes", chatgpt: "paid", claude: "yes", gemini: "yes", icon: <Upload className="h-3.5 w-3.5" />, category: "data" },
  { name: "Web Browsing / Search", description: "Real-time internet search & extraction", shadowtalk: "free", manus: "yes", chatgpt: "paid", claude: "no", gemini: "yes", icon: <Globe className="h-3.5 w-3.5" />, category: "data" },
  { name: "Memory / Personalization", description: "Persistent AI memory across sessions", shadowtalk: "free", manus: "no", chatgpt: "paid", claude: "partial", gemini: "no", icon: <Brain className="h-3.5 w-3.5" />, category: "data" },
  { name: "Knowledge Graph", description: "Visual knowledge base from conversations", shadowtalk: "free", manus: "no", chatgpt: "no", claude: "no", gemini: "no", icon: <Sparkles className="h-3.5 w-3.5" />, category: "data" },

  // Collaboration
  { name: "Real-Time Collaboration", description: "Multi-user agent rooms with live cursors", shadowtalk: "free", manus: "no", chatgpt: "partial", claude: "no", gemini: "no", icon: <Users className="h-3.5 w-3.5" />, category: "collab" },
  { name: "Unlimited Messages (Free)", description: "No message caps on free tier", shadowtalk: "free", manus: "no", chatgpt: "no", claude: "no", gemini: "partial", icon: <MessageSquare className="h-3.5 w-3.5" />, category: "collab" },
  { name: "Strategy Agent / CEO Suite", description: "Business planning with encrypted workflows", shadowtalk: "free", manus: "no", chatgpt: "no", claude: "no", gemini: "no", icon: <Server className="h-3.5 w-3.5" />, category: "collab" },
];

const COMPETITORS = [
  { key: "manus" as const, label: "Manus", color: "text-orange-400" },
  { key: "chatgpt" as const, label: "GPT", color: "text-emerald-400" },
  { key: "claude" as const, label: "Claude", color: "text-amber-400" },
  { key: "gemini" as const, label: "Gemini", color: "text-blue-400" },
];

const CATEGORIES = [
  { key: "privacy", label: "🛡️ Privacy & Security" },
  { key: "agentic", label: "🤖 Agentic Capabilities" },
  { key: "generation", label: "✨ Content & Creation" },
  { key: "data", label: "📊 File & Data" },
  { key: "collab", label: "👥 Collaboration" },
];

const StatusDot = ({ status }: { status: Status }) => {
  const config: Record<Status, { icon: React.ReactNode; cls: string }> = {
    superior: { icon: <Crown className="h-3 w-3" />, cls: "text-amber-400" },
    free: { icon: <CheckCircle2 className="h-3 w-3" />, cls: "text-emerald-400" },
    yes: { icon: <CheckCircle2 className="h-3 w-3" />, cls: "text-green-500" },
    paid: { icon: <Zap className="h-3 w-3" />, cls: "text-yellow-500" },
    partial: { icon: <Minus className="h-3 w-3" />, cls: "text-muted-foreground" },
    no: { icon: <XCircle className="h-3 w-3" />, cls: "text-red-400/60" },
  };
  const c = config[status];
  return <span className={c.cls}>{c.icon}</span>;
};

export const ManusAIBeaterIndicator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const exclusiveFeatures = FEATURES.filter(f =>
    f.manus === "no" && f.chatgpt === "no" && f.claude === "no" && f.gemini === "no"
    && (f.shadowtalk === "free" || f.shadowtalk === "superior")
  ).length;

  const totalWins = FEATURES.filter(f => {
    const stScore = f.shadowtalk === "superior" ? 4 : f.shadowtalk === "free" ? 3 : f.shadowtalk === "yes" ? 2 : 0;
    const bestCompetitor = Math.max(
      ...[f.manus, f.chatgpt, f.claude, f.gemini].map(s =>
        s === "superior" ? 4 : s === "free" ? 3 : s === "yes" ? 2 : s === "paid" ? 1.5 : s === "partial" ? 1 : 0
      )
    );
    return stScore > bestCompetitor;
  }).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs h-7 px-2 hover:bg-primary/10">
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-3 w-3" />
          </motion.div>
          <Crown className="h-3 w-3 text-amber-400" />
          <span className="text-muted-foreground">
            <span className="text-primary font-semibold">{totalWins}</span> wins vs all competitors •{" "}
            <span className="text-amber-400 font-semibold">{exclusiveFeatures}</span> exclusive
          </span>
        </Button>
      </CollapsibleTrigger>

      <AnimatePresence>
        {isOpen && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 rounded-xl bg-gradient-to-br from-primary/5 via-amber-500/5 to-emerald-500/5 border border-border overflow-hidden"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="p-3 pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400" />
                      ShadowTalk vs Everyone
                    </h4>
                    <Badge className="text-[9px] bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border-amber-500/30">
                      Industry Domination
                    </Badge>
                  </div>
                  <TabsList className="h-7 bg-background/50">
                    <TabsTrigger value="overview" className="text-[10px] h-5 px-2">Overview</TabsTrigger>
                    <TabsTrigger value="matrix" className="text-[10px] h-5 px-2">Full Matrix</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="p-3 pt-2 space-y-2">
                  {/* Score cards */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {COMPETITORS.map(c => {
                      const wins = FEATURES.filter(f => {
                        const stScore = f.shadowtalk === "superior" ? 4 : f.shadowtalk === "free" ? 3 : f.shadowtalk === "yes" ? 2 : 0;
                        const cScore = f[c.key] === "superior" ? 4 : f[c.key] === "free" ? 3 : f[c.key] === "yes" ? 2 : f[c.key] === "paid" ? 1.5 : f[c.key] === "partial" ? 1 : 0;
                        return stScore > cScore;
                      }).length;
                      return (
                        <div key={c.key} className="text-center p-1.5 rounded-lg bg-background/50">
                          <div className="text-lg font-bold text-primary">{wins}</div>
                          <div className="text-[9px] text-muted-foreground">vs {c.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Key differentiators */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">🏆 Exclusive to ShadowTalk</p>
                    {FEATURES.filter(f =>
                      f.manus === "no" && f.chatgpt === "no" && f.claude === "no" && f.gemini === "no"
                    ).slice(0, 6).map(f => (
                      <div key={f.name} className="flex items-center gap-2 p-1 rounded-md bg-primary/10 text-xs">
                        <span className="text-primary">{f.icon}</span>
                        <span className="font-medium truncate">{f.name}</span>
                        <Badge variant="outline" className="ml-auto text-[8px] border-primary/30 text-primary shrink-0">FREE</Badge>
                      </div>
                    ))}
                  </div>

                  {/* Free vs Paid callout */}
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-[10px] font-semibold text-emerald-400 mb-1">💰 What costs $200/mo on ChatGPT Pro is FREE here</p>
                    <div className="flex flex-wrap gap-1">
                      {["Voice Mode", "Code Sandbox", "Deep Research", "Canvas", "Memory", "Image Gen"].map(f => (
                        <Badge key={f} variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="matrix" className="p-3 pt-2">
                  {/* Header row */}
                  <div className="flex items-center gap-1 mb-2 text-[9px] font-semibold text-muted-foreground">
                    <div className="flex-1">Feature</div>
                    <div className="w-8 text-center text-primary">ST</div>
                    {COMPETITORS.map(c => (
                      <div key={c.key} className={`w-8 text-center ${c.color}`}>{c.label.slice(0, 2)}</div>
                    ))}
                  </div>

                  {/* Categories */}
                  {CATEGORIES.map(cat => (
                    <div key={cat.key} className="mb-2">
                      <p className="text-[9px] font-medium text-muted-foreground mb-1">{cat.label}</p>
                      {FEATURES.filter(f => f.category === cat.key).map(f => {
                        const stWins = [f.manus, f.chatgpt, f.claude, f.gemini].every(s =>
                          s === "no" || s === "partial" || (f.shadowtalk === "free" && s === "paid")
                        );
                        return (
                          <div
                            key={f.name}
                            className={`flex items-center gap-1 p-1 rounded text-[10px] mb-0.5 ${stWins ? "bg-primary/8" : "bg-muted/20"}`}
                          >
                            <span className="shrink-0">{f.icon}</span>
                            <span className="flex-1 truncate font-medium" title={f.description}>{f.name}</span>
                            <span className="w-8 flex justify-center"><StatusDot status={f.shadowtalk} /></span>
                            {COMPETITORS.map(c => (
                              <span key={c.key} className="w-8 flex justify-center"><StatusDot status={f[c.key]} /></span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Crown className="h-2.5 w-2.5 text-amber-400" /> Best</span>
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Free</span>
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5 text-green-500" /> Yes</span>
                    <span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5 text-yellow-500" /> Paid</span>
                    <span className="flex items-center gap-0.5"><Minus className="h-2.5 w-2.5 text-muted-foreground" /> Limited</span>
                    <span className="flex items-center gap-0.5"><XCircle className="h-2.5 w-2.5 text-red-400/60" /> No</span>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Bottom bar */}
              <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between bg-background/30">
                <div className="text-[10px] text-muted-foreground">
                  <span className="text-amber-400 font-bold">{exclusiveFeatures}</span> features no competitor has
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-primary text-primary-foreground text-[9px] shadow-lg">
                  Sovereign AI dominates all
                </Badge>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
};
