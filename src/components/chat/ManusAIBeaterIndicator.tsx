import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Shield, Brain, WifiOff, Globe, Users,
  ChevronDown, CheckCircle2, XCircle, Sparkles,
  Lock, Server, Cpu, Eye, Bot, Workflow,
  FileText, Code, Minus, Crown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type Status = "yes" | "no" | "partial" | "superior";

interface Feature {
  name: string;
  description: string;
  shadowtalk: Status;
  manus: Status;
  icon: React.ReactNode;
  category: "agentic" | "privacy" | "generation" | "collaboration";
}

const FEATURES: Feature[] = [
  {
    name: "100% Offline Agents",
    description: "Run autonomous tasks without internet",
    shadowtalk: "yes",
    manus: "no",
    icon: <WifiOff className="h-4 w-4" />,
    category: "privacy",
  },
  {
    name: "Zero-Knowledge Privacy",
    description: "Agent tasks never leave your device",
    shadowtalk: "superior",
    manus: "no",
    icon: <Shield className="h-4 w-4" />,
    category: "privacy",
  },
  {
    name: "Stealth Vault Encryption",
    description: "AES-256-GCM encrypted agent credentials",
    shadowtalk: "yes",
    manus: "no",
    icon: <Lock className="h-4 w-4" />,
    category: "privacy",
  },
  {
    name: "Multi-Step Task Planning",
    description: "Planner-Executor-Critic autonomous loops",
    shadowtalk: "superior",
    manus: "yes",
    icon: <Workflow className="h-4 w-4" />,
    category: "agentic",
  },
  {
    name: "Visual Execution Dashboard",
    description: "Node-graph pipeline with live status tracking",
    shadowtalk: "superior",
    manus: "partial",
    icon: <Eye className="h-4 w-4" />,
    category: "agentic",
  },
  {
    name: "Multi-Model Consensus",
    description: "Query GPT + Gemini + Claude for optimal answers",
    shadowtalk: "yes",
    manus: "no",
    icon: <Brain className="h-4 w-4" />,
    category: "agentic",
  },
  {
    name: "30+ Tool Orchestration",
    description: "Auto-trigger tools via natural language intent",
    shadowtalk: "superior",
    manus: "yes",
    icon: <Bot className="h-4 w-4" />,
    category: "agentic",
  },
  {
    name: "Autonomous Web Browsing",
    description: "AI-powered browser with proxy and extraction",
    shadowtalk: "yes",
    manus: "yes",
    icon: <Globe className="h-4 w-4" />,
    category: "agentic",
  },
  {
    name: "PPTX Generation",
    description: "AI-powered slide deck creation & export",
    shadowtalk: "yes",
    manus: "yes",
    icon: <FileText className="h-4 w-4" />,
    category: "generation",
  },
  {
    name: "In-Browser Code Execution",
    description: "WebContainer sandbox — no server needed",
    shadowtalk: "superior",
    manus: "partial",
    icon: <Code className="h-4 w-4" />,
    category: "generation",
  },
  {
    name: "Document & Report Generation",
    description: "AI creates PDFs, articles, emails, strategies",
    shadowtalk: "superior",
    manus: "yes",
    icon: <Cpu className="h-4 w-4" />,
    category: "generation",
  },
  {
    name: "Real-Time Collaboration",
    description: "Multi-user agent rooms with live cursors",
    shadowtalk: "yes",
    manus: "no",
    icon: <Users className="h-4 w-4" />,
    category: "collaboration",
  },
  {
    name: "Human-in-the-Loop Safety",
    description: "Approve/reject agent actions in real-time",
    shadowtalk: "superior",
    manus: "partial",
    icon: <Shield className="h-4 w-4" />,
    category: "agentic",
  },
  {
    name: "24/7 Background Missions",
    description: "Sovereign engine runs tasks while browser closed",
    shadowtalk: "yes",
    manus: "yes",
    icon: <Server className="h-4 w-4" />,
    category: "agentic",
  },
  {
    name: "Deep Research Engine",
    description: "Multi-source analysis with citations — 5/day free",
    shadowtalk: "superior",
    manus: "partial",
    icon: <Sparkles className="h-4 w-4" />,
    category: "generation",
  },
];

const CATEGORIES = [
  { key: "agentic", label: "Agentic Capabilities" },
  { key: "privacy", label: "Privacy & Security" },
  { key: "generation", label: "Content Generation" },
  { key: "collaboration", label: "Collaboration" },
] as const;

const StatusIcon = ({ status }: { status: Status }) => {
  switch (status) {
    case "superior":
      return <Crown className="h-3.5 w-3.5 text-amber-500" />;
    case "yes":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    case "partial":
      return <Minus className="h-3.5 w-3.5 text-yellow-500" />;
    case "no":
      return <XCircle className="h-3.5 w-3.5 text-red-400" />;
  }
};

const statusLabel = (s: Status) =>
  s === "superior" ? "Best" : s === "yes" ? "Yes" : s === "partial" ? "Limited" : "No";

export const ManusAIBeaterIndicator = () => {
  const [isOpen, setIsOpen] = useState(false);

  const wins = FEATURES.filter(
    (f) => f.shadowtalk === "superior" || (f.shadowtalk === "yes" && f.manus === "no")
  ).length;
  const ties = FEATURES.filter(
    (f) => f.shadowtalk === f.manus
  ).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs h-7 px-2 hover:bg-primary/10"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3" />
          </motion.div>
          <Bot className="h-3 w-3 text-emerald-500" />
          <span className="text-muted-foreground">
            <span className="text-primary font-semibold">{wins}</span> advantages over Manus AI
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
              className="mt-2 p-3 rounded-xl bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-500" />
                  ShadowTalk vs Manus AI
                </h4>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Agentic Showdown
                </Badge>
              </div>

              {/* Score bar */}
              <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-background/50">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-primary">{wins}</div>
                  <div className="text-[10px] text-muted-foreground">ShadowTalk Wins</div>
                </div>
                <div className="text-muted-foreground text-xs">vs</div>
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-muted-foreground">{ties}</div>
                  <div className="text-[10px] text-muted-foreground">Tied</div>
                </div>
              </div>

              {/* Category Sections */}
              {CATEGORIES.map(({ key, label }) => {
                const categoryFeatures = FEATURES.filter((f) => f.category === key);
                return (
                  <div key={key} className="mb-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      {label}
                    </p>
                    <div className="space-y-1">
                      {categoryFeatures.map((feature) => {
                        const stWins =
                          feature.shadowtalk === "superior" ||
                          (feature.shadowtalk === "yes" && feature.manus !== "yes" && feature.manus !== "superior");
                        return (
                          <motion.div
                            key={feature.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
                              stWins ? "bg-primary/10" : "bg-muted/30"
                            }`}
                          >
                            <div className="w-5 h-5 rounded flex items-center justify-center bg-background/50">
                              {feature.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{feature.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {feature.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] shrink-0">
                              <div className="w-12 text-center flex flex-col items-center">
                                <StatusIcon status={feature.shadowtalk} />
                                <span className="text-[9px]">{statusLabel(feature.shadowtalk)}</span>
                              </div>
                              <div className="w-12 text-center flex flex-col items-center">
                                <StatusIcon status={feature.manus} />
                                <span className="text-[9px]">{statusLabel(feature.manus)}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Summary */}
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span className="text-emerald-500 font-semibold">{wins}</span> exclusive advantages
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-primary-foreground text-[10px]">
                  Sovereign AI beats cloud agents
                </Badge>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
};
