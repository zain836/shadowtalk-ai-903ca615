import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Wifi, 
  WifiOff, 
  Lock, 
  Cpu, 
  Zap,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSovereignAI } from '@/hooks/useSovereignAI';
import { cn } from '@/lib/utils';

interface StealthVaultIndicatorProps {
  compact?: boolean;
  onInitialize?: () => void;
}

export const StealthVaultIndicator: React.FC<StealthVaultIndicatorProps> = ({ 
  compact = false,
  onInitialize 
}) => {
  const {
    mode,
    isReady,
    isLoading,
    loadProgress,
    loadStage,
    activeModel,
    isWebGPUAvailable,
    isWASMFallback,
    encryptionEnabled,
    contextTokens,
    maxContextTokens,
    availableModels,
    recommendedModel,
    initializeSovereignEngine,
    capabilities,
  } = useSovereignAI();

  const [expanded, setExpanded] = useState(false);

  const getModeInfo = () => {
    if (mode === 'stealth') {
      return {
        icon: <ShieldCheck className="h-4 w-4" />,
        label: 'Stealth Vault',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        description: 'Fully offline. Zero server contact.',
      };
    }
    if (mode === 'hybrid') {
      return {
        icon: <Shield className="h-4 w-4" />,
        label: 'Hybrid Mode',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10 border-blue-500/30',
        description: 'Local AI active. Cloud available.',
      };
    }
    return {
      icon: <Wifi className="h-4 w-4" />,
      label: 'Online',
      color: 'text-primary',
      bgColor: 'bg-primary/10 border-primary/30',
      description: 'Using cloud AI services.',
    };
  };

  const modeInfo = getModeInfo();

  const handleInitialize = async () => {
    await initializeSovereignEngine();
    onInitialize?.();
  };

  // Compact mode - just shows badge
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-help",
              modeInfo.bgColor,
              modeInfo.color
            )}>
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                modeInfo.icon
              )}
              <span className="hidden sm:inline">{modeInfo.label}</span>
              {encryptionEnabled && <Lock className="h-3 w-3" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold flex items-center gap-2">
                {modeInfo.icon}
                {modeInfo.label}
              </p>
              <p className="text-xs text-muted-foreground">{modeInfo.description}</p>
              {activeModel && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Model: </span>
                  <span className="font-medium">{activeModel.name}</span>
                </div>
              )}
              {isLoading && (
                <div className="space-y-1">
                  <p className="text-xs">{loadStage}</p>
                  <Progress value={loadProgress} className="h-1" />
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full expanded mode
  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className={cn(
        "rounded-lg border transition-all",
        modeInfo.bgColor
      )}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full", modeInfo.bgColor)}>
                {isLoading ? (
                  <Loader2 className={cn("h-5 w-5 animate-spin", modeInfo.color)} />
                ) : (
                  <span className={modeInfo.color}>{modeInfo.icon}</span>
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className={cn("font-semibold", modeInfo.color)}>
                    {modeInfo.label}
                  </span>
                  {encryptionEnabled && (
                    <Badge variant="outline" className="gap-1 text-[10px] h-5 border-emerald-500/30 text-emerald-500">
                      <Lock className="h-2.5 w-2.5" />
                      E2E
                    </Badge>
                  )}
                  {activeModel && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {activeModel.tier.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{modeInfo.description}</p>
              </div>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Loading Progress */}
        {isLoading && (
          <div className="px-3 pb-3">
            <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">{loadStage}</span>
                <span className="text-xs text-muted-foreground">{loadProgress}%</span>
              </div>
              <Progress value={loadProgress} className="h-2" />
            </div>
          </div>
        )}

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
            {/* Active Model */}
            {activeModel ? (
              <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    {activeModel.name}
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-500 border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{activeModel.description}</p>
                <div className="flex flex-wrap gap-1">
                  {activeModel.capabilities.map(cap => (
                    <Badge key={cap} variant="outline" className="text-[10px]">
                      {cap}
                    </Badge>
                  ))}
                </div>
                {/* Context usage */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Context used</span>
                    <span>{contextTokens.toLocaleString()} / {maxContextTokens.toLocaleString()}</span>
                  </div>
                  <Progress value={(contextTokens / maxContextTokens) * 100} className="h-1" />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">No Model Loaded</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Recommended: <strong>{recommendedModel?.name}</strong>
                </p>
                <Button 
                  size="sm" 
                  onClick={handleInitialize}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Initialize Stealth Vault
                </Button>
              </div>
            )}

            {/* Hardware Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Cpu className="h-3 w-3" />
                  Runtime
                </div>
                <span className="font-medium">
                  {isWebGPUAvailable ? 'WebGPU ⚡' : 'WASM CPU'}
                </span>
              </div>
              <div className="p-2 rounded bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Zap className="h-3 w-3" />
                  Tier
                </div>
                <span className="font-medium capitalize">{capabilities.tier}</span>
              </div>
              <div className="p-2 rounded bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <HardDrive className="h-3 w-3" />
                  RAM
                </div>
                <span className="font-medium">{capabilities.deviceMemory} GB</span>
              </div>
              <div className="p-2 rounded bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  {mode === 'stealth' ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                  Network
                </div>
                <span className="font-medium">{mode === 'stealth' ? 'Offline' : 'Connected'}</span>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>Zero-Server Promise:</strong> Once downloaded, all processing happens locally. 
                  Your data never leaves your device. Turn off Wi-Fi and keep chatting.
                </span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
