import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Cpu,
  Download,
  WifiOff,
  Zap,
  AlertCircle,
  Brain,
  Code,
  Search,
  FileText,
  Languages,
  Calculator,
  HardDrive,
  Check,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAdvancedOfflineAI } from '@/hooks/useAdvancedOfflineAI';
import { useOfflineRAG } from '@/hooks/useOfflineRAG';
import { useOfflineMode } from '@/hooks/useOfflineMode';

interface OfflineCapabilityIndicatorProps {
  onOpenModelManager?: () => void;
  compact?: boolean;
}

const CAPABILITY_CONFIG = [
  { id: 'chat', name: 'Chat', icon: Zap, requires: 'model' },
  { id: 'reasoning', name: 'Reasoning', icon: Brain, requires: 'model' },
  { id: 'code', name: 'Code', icon: Code, requires: 'model' },
  { id: 'search', name: 'Knowledge', icon: Search, requires: 'rag' },
  { id: 'docs', name: 'Documents', icon: FileText, requires: 'rag' },
  { id: 'translate', name: 'Translate', icon: Languages, requires: 'model' },
  { id: 'math', name: 'Math', icon: Calculator, requires: 'basic' },
];

export const OfflineCapabilityIndicator: React.FC<OfflineCapabilityIndicatorProps> = ({
  onOpenModelManager,
  compact = false,
}) => {
  const { isOffline } = useOfflineMode();
  const {
    isReady,
    isLoading,
    loadProgress,
    loadStage,
    activeModel,
    availableModels,
    performanceTier,
    contextTokens,
    maxContextTokens,
    loadModel,
    error,
  } = useAdvancedOfflineAI();
  const { documentCount, isModelLoaded: ragLoaded } = useOfflineRAG();

  const getCapabilityStatus = (requires: string): 'available' | 'loading' | 'unavailable' => {
    if (requires === 'basic') return 'available';
    if (requires === 'model') {
      if (isLoading) return 'loading';
      return isReady ? 'available' : 'unavailable';
    }
    if (requires === 'rag') {
      return ragLoaded && documentCount > 0 ? 'available' : 'unavailable';
    }
    return 'unavailable';
  };

  const availableCount = CAPABILITY_CONFIG.filter(
    c => getCapabilityStatus(c.requires) === 'available'
  ).length;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                isOffline
                  ? isReady
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
              onClick={onOpenModelManager}
            >
              {isLoading ? (
                <>
                  <Download className="h-3 w-3 animate-bounce" />
                  <span>{loadProgress}%</span>
                </>
              ) : isReady ? (
                <>
                  <Brain className="h-3 w-3" />
                  <span>AI Ready</span>
                </>
              ) : isOffline ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </>
              ) : (
                <>
                  <Cpu className="h-3 w-3" />
                  <span>Local AI</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">
                {isReady ? 'Sovereign AI Active' : 'Offline Intelligence'}
              </p>
              {isReady && activeModel && (
                <p className="text-xs text-muted-foreground">
                  Model: {availableModels.find(m => m.id === activeModel)?.name}
                </p>
              )}
              <p className="text-xs">
                {availableCount}/{CAPABILITY_CONFIG.length} capabilities available
              </p>
              <p className="text-xs text-muted-foreground">
                Click to manage AI models
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${
            isReady
              ? 'border-green-500/30 hover:border-green-500/50'
              : 'border-border'
          }`}
        >
          {isLoading ? (
            <Download className="h-4 w-4 animate-bounce text-primary" />
          ) : isReady ? (
            <Brain className="h-4 w-4 text-green-500" />
          ) : (
            <Cpu className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isLoading ? 'Loading...' : isReady ? 'AI Ready' : 'Local AI'}
          </span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {availableCount}/{CAPABILITY_CONFIG.length}
          </Badge>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Sovereign AI</h4>
              <p className="text-xs text-muted-foreground">
                Local intelligence capabilities
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {performanceTier}
            </Badge>
          </div>

          {/* Loading Progress */}
          {isLoading && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate max-w-[180px]">{loadStage}</span>
                <span className="text-muted-foreground">{loadProgress}%</span>
              </div>
              <Progress value={loadProgress} className="h-1.5" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Active Model */}
          {isReady && activeModel && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {availableModels.find(m => m.id === activeModel)?.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              {contextTokens > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Context</span>
                    <span>{contextTokens} / {maxContextTokens} tokens</span>
                  </div>
                  <Progress
                    value={(contextTokens / maxContextTokens) * 100}
                    className="h-1"
                  />
                </div>
              )}
            </div>
          )}

          {/* Capabilities Grid */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Capabilities</h5>
            <div className="grid grid-cols-4 gap-2">
              {CAPABILITY_CONFIG.map((cap) => {
                const status = getCapabilityStatus(cap.requires);
                const Icon = cap.icon;

                return (
                  <TooltipProvider key={cap.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                            status === 'available'
                              ? 'bg-green-500/10 text-green-500'
                              : status === 'loading'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px] mt-1">{cap.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {cap.name}:{' '}
                          {status === 'available'
                            ? 'Available'
                            : status === 'loading'
                            ? 'Loading...'
                            : 'Requires AI model'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>

          {/* Storage Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded bg-muted/30">
            <HardDrive className="h-3 w-3" />
            <span>{documentCount} documents indexed for offline search</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isReady && !isLoading && (
              <Button
                size="sm"
                onClick={() => loadModel()}
                className="flex-1 gap-1"
              >
                <Download className="h-3 w-3" />
                Load AI
              </Button>
            )}
            {onOpenModelManager && (
              <Button
                size="sm"
                variant={isReady ? 'default' : 'outline'}
                onClick={onOpenModelManager}
                className="flex-1 gap-1"
              >
                <Cpu className="h-3 w-3" />
                Manage Models
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
