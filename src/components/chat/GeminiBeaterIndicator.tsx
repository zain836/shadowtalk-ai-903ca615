import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Shield, Wifi, WifiOff, Brain, Lock, 
  Zap, Eye, Server, Globe, ChevronDown, ChevronUp,
  Crown, CheckCircle2, XCircle, Minus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type FeatureStatus = 'yes' | 'no' | 'partial' | 'superior';

interface FeatureComparison {
  feature: string;
  shadowtalk: FeatureStatus;
  gemini: FeatureStatus;
  advantage: 'shadowtalk' | 'gemini' | 'tie';
  description?: string;
}

const FEATURE_COMPARISONS: FeatureComparison[] = [
  {
    feature: '100% Offline AI',
    shadowtalk: 'yes',
    gemini: 'no',
    advantage: 'shadowtalk',
    description: 'Full AI capabilities without internet'
  },
  {
    feature: 'Zero-Data Privacy',
    shadowtalk: 'superior',
    gemini: 'no',
    advantage: 'shadowtalk',
    description: 'No data collection, E2E encryption'
  },
  {
    feature: 'Local Model Sovereignty',
    shadowtalk: 'yes',
    gemini: 'no',
    advantage: 'shadowtalk',
    description: 'Run AI entirely on your device'
  },
  {
    feature: 'Multi-Model Consensus',
    shadowtalk: 'yes',
    gemini: 'no',
    advantage: 'shadowtalk',
    description: 'Query multiple AIs for best answer'
  },
  {
    feature: 'Thinking Transparency',
    shadowtalk: 'yes',
    gemini: 'no',
    advantage: 'shadowtalk',
    description: 'See AI reasoning steps, not just answers'
  },
  {
    feature: 'Stealth Vault Encryption',
    shadowtalk: 'yes',
    gemini: 'no',
    advantage: 'shadowtalk',
    description: 'AES-GCM encrypted private conversations'
  },
  {
    feature: 'Agentic Task Automation',
    shadowtalk: 'yes',
    gemini: 'partial',
    advantage: 'shadowtalk',
    description: 'Multi-step autonomous workflows'
  },
  {
    feature: 'Collaborative AI Rooms',
    shadowtalk: 'yes',
    gemini: 'no',
    advantage: 'shadowtalk',
    description: 'Team AI sessions with live cursors'
  },
  {
    feature: 'Image Generation',
    shadowtalk: 'yes',
    gemini: 'yes',
    advantage: 'tie',
    description: 'AI-powered image creation'
  },
  {
    feature: 'Voice Conversations',
    shadowtalk: 'yes',
    gemini: 'yes',
    advantage: 'tie',
    description: 'Real-time voice interaction'
  },
  {
    feature: 'Context Window',
    shadowtalk: 'yes',
    gemini: 'superior',
    advantage: 'gemini',
    description: 'Gemini: 1M+ tokens, ShadowTalk: 128K'
  },
  {
    feature: 'Google Integration',
    shadowtalk: 'yes',
    gemini: 'superior',
    advantage: 'gemini',
    description: 'Native vs API-based integration'
  }
];

const StatusIcon = ({ status }: { status: 'yes' | 'no' | 'partial' | 'superior' }) => {
  switch (status) {
    case 'yes':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'superior':
      return <Crown className="w-4 h-4 text-amber-500" />;
    case 'partial':
      return <Minus className="w-4 h-4 text-yellow-500" />;
    case 'no':
      return <XCircle className="w-4 h-4 text-red-400" />;
  }
};

export const GeminiBeaterIndicator: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullComparison, setShowFullComparison] = useState(false);
  
  const shadowTalkWins = FEATURE_COMPARISONS.filter(f => f.advantage === 'shadowtalk').length;
  const geminiWins = FEATURE_COMPARISONS.filter(f => f.advantage === 'gemini').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 rounded-2xl border border-blue-500/20 p-4 mb-4"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Gemini Beater</h3>
              <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                {shadowTalkWins} Advantages
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Privacy-first AI that beats Google's data collection
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Key Advantages Grid */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
              >
                <WifiOff className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-green-400">100% Offline</span>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20"
              >
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-purple-400">Zero Data Collection</span>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <Server className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-400">Local AI Sovereignty</span>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <Brain className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-400">Multi-Model Consensus</span>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
              >
                <Eye className="w-4 h-4 text-cyan-500" />
                <span className="text-xs font-medium text-cyan-400">Thinking Transparency</span>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20"
              >
                <Lock className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-medium text-rose-400">Stealth Vault E2E</span>
              </motion.div>
            </div>

            {/* Full Comparison Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullComparison(!showFullComparison)}
              className="w-full mt-3 text-xs"
            >
              {showFullComparison ? 'Hide' : 'Show'} Full Comparison
              {showFullComparison ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </Button>

            <AnimatePresence>
              {showFullComparison && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {/* Score Summary */}
                  <div className="flex items-center justify-center gap-4 py-3 border-b border-border/50 mt-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{shadowTalkWins}</div>
                      <div className="text-xs text-muted-foreground">ShadowTalk</div>
                    </div>
                    <div className="text-muted-foreground">vs</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">{geminiWins}</div>
                      <div className="text-xs text-muted-foreground">Gemini</div>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div className="space-y-1 mt-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b border-border/50">
                      <div>Feature</div>
                      <div className="text-center">ShadowTalk</div>
                      <div className="text-center">Gemini</div>
                    </div>
                    
                    {FEATURE_COMPARISONS.map((comp, i) => (
                      <motion.div
                        key={comp.feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`grid grid-cols-3 gap-2 text-xs py-2 rounded-lg px-2 ${
                          comp.advantage === 'shadowtalk' 
                            ? 'bg-primary/5' 
                            : comp.advantage === 'gemini'
                              ? 'bg-muted/30'
                              : ''
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{comp.feature}</span>
                          {comp.description && (
                            <span className="text-[10px] text-muted-foreground">{comp.description}</span>
                          )}
                        </div>
                        <div className="flex justify-center items-center">
                          <StatusIcon status={comp.shadowtalk} />
                        </div>
                        <div className="flex justify-center items-center">
                          <StatusIcon status={comp.gemini} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Message */}
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-center">
                <span className="font-semibold text-primary">ShadowTalk AI</span>
                <span className="text-muted-foreground"> delivers Gemini's power with </span>
                <span className="font-semibold text-green-500">zero data collection</span>
                <span className="text-muted-foreground"> and </span>
                <span className="font-semibold text-purple-500">100% offline capability</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
