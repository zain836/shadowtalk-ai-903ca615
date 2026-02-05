import { useState } from "react";
import { 
  Brain, Eye, Code, Mic, Sparkles, Zap, Shield, 
  ChevronDown, ChevronUp, CheckCircle2, Globe, 
  Cloud, Lock, Layers, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// =============================================================================
// CLAUDE BEATER INDICATOR - Shows why we're better than Claude
// =============================================================================

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  claudeStatus: 'limited' | 'none' | 'basic';
  ourStatus: 'full' | 'advanced' | 'exclusive';
  category: 'transparency' | 'artifacts' | 'multimodal' | 'memory' | 'privacy';
}

const CLAUDE_BEATER_FEATURES: Feature[] = [
  {
    id: 'thinking',
    name: 'Thinking Transparency',
    description: "See EXACTLY how AI reasons through your request, step by step",
    icon: Brain,
    claudeStatus: 'basic',
    ourStatus: 'advanced',
    category: 'transparency'
  },
  {
    id: 'artifacts',
    name: 'Live Code Artifacts',
    description: "Edit & run code INSIDE the chat with split view and live preview",
    icon: Code,
    claudeStatus: 'basic',
    ourStatus: 'advanced',
    category: 'artifacts'
  },
  {
    id: 'multimodal',
    name: 'Multi-Modal Fusion',
    description: "Combine images, voice, documents, and code in ONE conversation",
    icon: Layers,
    claudeStatus: 'limited',
    ourStatus: 'full',
    category: 'multimodal'
  },
  {
    id: 'memory',
    name: 'Persistent Memory',
    description: "AI remembers YOUR preferences, facts, and context across sessions",
    icon: MessageSquare,
    claudeStatus: 'limited',
    ourStatus: 'advanced',
    category: 'memory'
  },
  {
    id: 'offline',
    name: '100% Offline AI',
    description: "Works without internet using local models - Claude can't do this",
    icon: Cloud,
    claudeStatus: 'none',
    ourStatus: 'exclusive',
    category: 'privacy'
  },
  {
    id: 'privacy',
    name: 'Zero-Knowledge Privacy',
    description: "Encrypted vault, local processing - your data stays YOURS",
    icon: Lock,
    claudeStatus: 'none',
    ourStatus: 'exclusive',
    category: 'privacy'
  },
  {
    id: 'models',
    name: 'Multi-Model Consensus',
    description: "GPT + Gemini + Claude together = better than Claude alone",
    icon: Sparkles,
    claudeStatus: 'none',
    ourStatus: 'exclusive',
    category: 'transparency'
  },
  {
    id: 'voice',
    name: 'Real-Time Voice',
    description: "Natural voice conversations with interrupt support",
    icon: Mic,
    claudeStatus: 'none',
    ourStatus: 'full',
    category: 'multimodal'
  },
];

interface ClaudeBeaterIndicatorProps {
  variant?: 'compact' | 'full' | 'badge';
  showOnlyExclusive?: boolean;
}

export const ClaudeBeaterIndicator = ({ 
  variant = 'compact',
  showOnlyExclusive = false 
}: ClaudeBeaterIndicatorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const features = showOnlyExclusive 
    ? CLAUDE_BEATER_FEATURES.filter(f => f.ourStatus === 'exclusive')
    : CLAUDE_BEATER_FEATURES;

  const exclusiveCount = CLAUDE_BEATER_FEATURES.filter(f => f.ourStatus === 'exclusive').length;

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer gap-1.5 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 border-purple-500/30 hover:border-purple-500/50 transition-colors"
            >
              <Brain className="h-3 w-3 text-purple-500" />
              <span className="text-purple-600 dark:text-purple-400">Claude Beater</span>
              <span className="text-xs bg-purple-500/20 px-1 rounded">{exclusiveCount} exclusive</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs p-3">
            <div className="space-y-2">
              <p className="font-medium">ShadowTalk beats Claude with:</p>
              <ul className="text-xs space-y-1">
                {CLAUDE_BEATER_FEATURES.filter(f => f.ourStatus === 'exclusive').map(f => (
                  <li key={f.id} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-indigo-500/10 border border-purple-500/20"
      >
        <Brain className="h-4 w-4 text-purple-500" />
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
          {exclusiveCount} features Claude doesn't have
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-purple-500 hover:text-purple-600 transition-colors">
                <Eye className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm p-3">
              <div className="grid grid-cols-2 gap-2">
                {CLAUDE_BEATER_FEATURES.filter(f => f.ourStatus === 'exclusive').map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs">
                    <f.icon className="h-3 w-3 text-purple-500" />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    );
  }

  // Full variant
  return (
    <motion.div
      layout
      className="rounded-xl border bg-gradient-to-br from-purple-500/5 via-violet-500/5 to-indigo-500/5 border-purple-500/20 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-purple-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold flex items-center gap-2">
              ShadowTalk vs Claude
              <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-600">
                {exclusiveCount} exclusive
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Why we beat Anthropic's Claude
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    feature.ourStatus === 'exclusive' 
                      ? 'bg-gradient-to-br from-purple-500/20 to-violet-500/20' 
                      : 'bg-muted'
                  )}>
                    <feature.icon className={cn(
                      "h-4 w-4",
                      feature.ourStatus === 'exclusive' ? 'text-purple-500' : 'text-muted-foreground'
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">{feature.name}</span>
                      {feature.ourStatus === 'exclusive' && (
                        <Badge className="text-[10px] px-1 py-0 bg-purple-500/20 text-purple-600 border-0">
                          EXCLUSIVE
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                    
                    {/* Comparison */}
                    <div className="flex items-center gap-4 mt-2 text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Claude:</span>
                        <span className={cn(
                          feature.claudeStatus === 'none' ? 'text-red-500' :
                          feature.claudeStatus === 'limited' ? 'text-amber-500' :
                          'text-muted-foreground'
                        )}>
                          {feature.claudeStatus === 'none' ? '❌ None' :
                           feature.claudeStatus === 'limited' ? '⚠️ Limited' :
                           '➖ Basic'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">ShadowTalk:</span>
                        <span className="text-emerald-500">
                          ✅ {feature.ourStatus === 'exclusive' ? 'Exclusive' :
                              feature.ourStatus === 'advanced' ? 'Advanced' : 'Full'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Summary */}
              <div className="flex items-center justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  {exclusiveCount} exclusive features
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  {features.filter(f => f.ourStatus === 'advanced').length} advanced
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  {features.filter(f => f.category === 'privacy').length} privacy features
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ClaudeBeaterIndicator;
