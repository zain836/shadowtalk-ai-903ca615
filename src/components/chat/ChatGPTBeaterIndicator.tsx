import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Shield, Brain, Wifi, WifiOff, Globe, Users, 
  ChevronDown, CheckCircle2, XCircle, Sparkles,
  Lock, Server, Cpu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Feature {
  id: string;
  name: string;
  description: string;
  shadowtalk: boolean | string;
  chatgpt: boolean | string;
  icon: React.ReactNode;
  category: "privacy" | "capability" | "collaboration";
}

const COMPARISON_FEATURES: Feature[] = [
  {
    id: "offline",
    name: "Optional Offline AI",
    description: "Can work without internet (user opt-in download required)",
    shadowtalk: true,
    chatgpt: false,
    icon: <WifiOff className="h-4 w-4" />,
    category: "privacy",
  },
  {
    id: "privacy",
    name: "Client-Side Encryption",
    description: "Data encrypted in your browser before storage",
    shadowtalk: true,
    chatgpt: false,
    icon: <Shield className="h-4 w-4" />,
    category: "privacy",
  },
  {
    id: "local-storage",
    name: "Encrypted Local Vault",
    description: "Store secrets with end-to-end encryption",
    shadowtalk: true,
    chatgpt: false,
    icon: <Lock className="h-4 w-4" />,
    category: "privacy",
  },
  {
    id: "multi-model",
    name: "Multi-Model Consensus",
    description: "Query GPT + Gemini + Claude together",
    shadowtalk: true,
    chatgpt: false,
    icon: <Brain className="h-4 w-4" />,
    category: "capability",
  },
  {
    id: "deep-research",
    name: "Deep Research (5/day free)",
    description: "Multi-source analysis with citations",
    shadowtalk: "5/day",
    chatgpt: "Pro only",
    icon: <Globe className="h-4 w-4" />,
    category: "capability",
  },
  {
    id: "images",
    name: "Image Generation",
    description: "AI-powered image creation",
    shadowtalk: "4/day",
    chatgpt: "Pro only",
    icon: <Sparkles className="h-4 w-4" />,
    category: "capability",
  },
  {
    id: "code-execution",
    name: "In-Browser Code Execution",
    description: "Run Python/JS without server",
    shadowtalk: true,
    chatgpt: "Limited",
    icon: <Cpu className="h-4 w-4" />,
    category: "capability",
  },
  {
    id: "collab",
    name: "Real-Time Collaboration",
    description: "Multiplayer AI chat rooms",
    shadowtalk: true,
    chatgpt: false,
    icon: <Users className="h-4 w-4" />,
    category: "collaboration",
  },
  {
    id: "agentic",
    name: "Agentic Task Runner",
    description: "Autonomous multi-step workflows",
    shadowtalk: true,
    chatgpt: "GPT-4o only",
    icon: <Server className="h-4 w-4" />,
    category: "capability",
  },
];

export const ChatGPTBeaterIndicator = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const advantages = COMPARISON_FEATURES.filter(f => 
    f.shadowtalk === true && f.chatgpt === false
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
          <Zap className="h-3 w-3 text-amber-500" />
          <span className="text-muted-foreground">
            <span className="text-primary font-semibold">{advantages}</span> advantages over ChatGPT
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
              className="mt-2 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  ShadowTalk vs ChatGPT
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  Real-time comparison
                </Badge>
              </div>
              
              {/* Category Sections */}
              {["privacy", "capability", "collaboration"].map(category => {
                const categoryFeatures = COMPARISON_FEATURES.filter(f => f.category === category);
                const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
                
                return (
                  <div key={category} className="mb-3">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      {categoryLabel}
                    </p>
                    <div className="space-y-1">
                      {categoryFeatures.map(feature => (
                        <FeatureRow key={feature.id} feature={feature} />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Summary */}
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-500 font-semibold">{advantages}</span> exclusive features
                </div>
                <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-[10px]">
                  You're using the better AI
                </Badge>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  );
};

const FeatureRow = ({ feature }: { feature: Feature }) => {
  const renderStatus = (value: boolean | string, isWinner: boolean) => {
    if (value === true) {
      return (
        <span className={`flex items-center gap-1 ${isWinner ? 'text-primary' : 'text-muted-foreground'}`}>
          <CheckCircle2 className="h-3 w-3" />
          <span className="text-[10px]">Yes</span>
        </span>
      );
    }
    if (value === false) {
      return (
        <span className="flex items-center gap-1 text-red-400">
          <XCircle className="h-3 w-3" />
          <span className="text-[10px]">No</span>
        </span>
      );
    }
    return (
      <span className={`text-[10px] ${isWinner ? 'text-primary' : 'text-secondary'}`}>
        {value}
      </span>
    );
  };
  
  const shadowtalkWins = feature.shadowtalk === true && feature.chatgpt !== true;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 p-1.5 rounded-lg text-xs ${
        shadowtalkWins ? 'bg-primary/10' : 'bg-muted/30'
      }`}
    >
      <div className="w-5 h-5 rounded flex items-center justify-center bg-background/50">
        {feature.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{feature.name}</p>
      </div>
      <div className="flex items-center gap-3 text-[10px]">
        <div className="w-14 text-center">
          {renderStatus(feature.shadowtalk, shadowtalkWins)}
        </div>
        <div className="w-14 text-center">
          {renderStatus(feature.chatgpt, !shadowtalkWins)}
        </div>
      </div>
    </motion.div>
  );
};
