import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Cpu,
  Check,
  AlertCircle,
  Zap,
  Code,
  Brain,
  Languages,
  HardDrive,
  Loader2,
  Trash2,
  Star,
  Shield,
  Lock,
  Sparkles,
  Crown,
  Rocket,
  Server,
} from 'lucide-react';
import { useSovereignAI, SovereignModel } from '@/hooks/useSovereignAI';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SovereignModelManagerProps {
  onClose?: () => void;
}

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  chat: <Zap className="h-3 w-3" />,
  'fast-responses': <Rocket className="h-3 w-3" />,
  'basic-reasoning': <Brain className="h-3 w-3" />,
  reasoning: <Brain className="h-3 w-3" />,
  'deep-reasoning': <Brain className="h-3 w-3" />,
  analysis: <Brain className="h-3 w-3" />,
  code: <Code className="h-3 w-3" />,
  'code-basic': <Code className="h-3 w-3" />,
  creative: <Sparkles className="h-3 w-3" />,
  math: <Cpu className="h-3 w-3" />,
  multilingual: <Languages className="h-3 w-3" />,
};

const TIER_INFO = {
  standard: {
    label: 'Standard',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Cpu className="h-3 w-3" />,
    description: 'Runs on most modern devices',
  },
  elite: {
    label: 'Elite',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <Crown className="h-3 w-3" />,
    description: 'ChatGPT-level intelligence locally',
  },
  enterprise: {
    label: 'Enterprise',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <Server className="h-3 w-3" />,
    description: 'High-end devices (32GB+ RAM)',
  },
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e9).toFixed(1)} GB`;
};

export const SovereignModelManager: React.FC<SovereignModelManagerProps> = ({ onClose }) => {
  const {
    availableModels,
    activeModel,
    isLoading,
    loadProgress,
    loadStage,
    mode,
    isWebGPUAvailable,
    encryptionEnabled,
    contextTokens,
    maxContextTokens,
    initializeSovereignEngine,
    switchModel,
    unloadModel,
    capabilities,
  } = useSovereignAI();

  const [selectedTier, setSelectedTier] = useState<'all' | 'standard' | 'elite' | 'enterprise'>('all');

  const filteredModels = selectedTier === 'all' 
    ? availableModels 
    : availableModels.filter(m => m.tier === selectedTier);

  const handleLoadModel = async (modelId: string) => {
    await initializeSovereignEngine(modelId);
  };

  const getTierBadge = (tier: SovereignModel['tier']) => {
    const info = TIER_INFO[tier];
    return (
      <Badge variant="outline" className={cn("gap-1 text-[10px]", info.color)}>
        {info.icon}
        {info.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl bg-card/95 backdrop-blur-lg border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Stealth Vault - AI Models
            </CardTitle>
            <CardDescription className="mt-1">
              Download Llama 3 models for fully offline, private AI
            </CardDescription>
          </div>
          <Badge variant="outline" className={cn(
            "gap-1",
            mode === 'stealth' 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
          )}>
            <Lock className="h-3 w-3" />
            {mode === 'stealth' ? 'Offline' : 'Hybrid'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Zero-Server Promise */}
        <Alert className="border-emerald-500/30 bg-emerald-500/5">
          <Shield className="h-4 w-4 text-emerald-500" />
          <AlertDescription className="text-sm text-emerald-600 dark:text-emerald-400">
            <strong>Zero-Server Promise:</strong> Once downloaded, models run entirely on your device. 
            Turn off Wi-Fi and keep chatting with full privacy.
          </AlertDescription>
        </Alert>

        {/* Hardware Info */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            Your Device Capabilities
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div>RAM: {capabilities.deviceMemory} GB</div>
            <div>Runtime: {isWebGPUAvailable ? 'WebGPU ⚡' : 'WASM CPU'}</div>
            <div>VRAM: ~{capabilities.estimatedVRAM} GB</div>
            <div>Tier: <span className="capitalize font-medium text-foreground">{capabilities.tier}</span></div>
          </div>
        </div>

        {/* Loading Progress */}
        {isLoading && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{loadStage}</span>
              <span className="text-sm text-muted-foreground">{loadProgress}%</span>
            </div>
            <Progress value={loadProgress} className="h-2" />
          </div>
        )}

        {/* Tier Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'standard', 'elite', 'enterprise'] as const).map(tier => (
            <Button
              key={tier}
              size="sm"
              variant={selectedTier === tier ? 'default' : 'outline'}
              onClick={() => setSelectedTier(tier)}
              className="text-xs h-7"
            >
              {tier === 'all' ? 'All Models' : TIER_INFO[tier].label}
            </Button>
          ))}
        </div>

        {/* Model List */}
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {filteredModels.map((model) => {
              const isActive = activeModel?.id === model.id;
              const tierInfo = TIER_INFO[model.tier];
              
              return (
                <div
                  key={model.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-muted/30 border-border/50 hover:border-border'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{model.name}</span>
                        {isActive && (
                          <Star className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                        )}
                        {getTierBadge(model.tier)}
                        <Badge variant="outline" className="text-[10px]">
                          {model.quantization}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {model.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{model.size} parameters</span>
                        <span>~{formatBytes(model.sizeBytes)} download</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <TooltipProvider>
                          {model.capabilities.map((cap) => (
                            <Tooltip key={cap}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="gap-1 text-[10px] cursor-help"
                                >
                                  {CAPABILITY_ICONS[cap] || <Zap className="h-3 w-3" />}
                                  {cap.replace('-', ' ')}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="capitalize">{cap.replace('-', ' ')} capability</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </TooltipProvider>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {isActive ? (
                        <Badge className="bg-emerald-500/20 text-emerald-500 border-0">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleLoadModel(model.id)}
                          disabled={isLoading}
                          className="gap-1"
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          Load
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredModels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No models available for your device tier.</p>
                <p className="text-sm">Try selecting a different filter.</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            {activeModel ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Active: {activeModel.name}
                <span className="text-xs">({contextTokens.toLocaleString()} tokens used)</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                No model loaded - select one above
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {activeModel && (
              <Button
                size="sm"
                variant="outline"
                onClick={unloadModel}
                disabled={isLoading}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Unload
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="secondary" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
