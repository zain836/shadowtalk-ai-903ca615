import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { useSovereignAI } from '@/hooks/useSovereignAI';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ModelDownloadManagerProps {
  onClose?: () => void;
}

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  chat: <Zap className="h-3 w-3" />,
  code: <Code className="h-3 w-3" />,
  'code-basic': <Code className="h-3 w-3" />,
  reasoning: <Brain className="h-3 w-3" />,
  analysis: <Brain className="h-3 w-3" />,
  multilingual: <Languages className="h-3 w-3" />,
  'basic-qa': <Zap className="h-3 w-3" />,
  math: <Cpu className="h-3 w-3" />,
};

const SIZE_ESTIMATES: Record<string, string> = {
  '135M': '~130 MB',
  '360M': '~360 MB',
  '1.1B': '~675 MB',
  '1B': '~800 MB',
  '2B': '~2 GB',
  '3B': '~2.5 GB',
  '7B': '~5 GB',
  '8B': '~5.5 GB',
};

export const ModelDownloadManager: React.FC<ModelDownloadManagerProps> = ({ onClose }) => {
  const {
    availableModels,
    activeModel,
    isLoading,
    loadProgress,
    loadStage,
    initializeSovereignEngine: loadModel,
    unloadModel,
    capabilities,
  } = useSovereignAI();

  const handleLoadModel = async (modelId: string) => {
    await loadModel(modelId);
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'mid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-card/95 backdrop-blur-lg border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Sovereign AI Manager
            </CardTitle>
            <CardDescription className="mt-1">
              Download and manage private AI models for your Stealth Vault
            </CardDescription>
          </div>
          <Badge variant="outline" className={getTierBadgeColor(capabilities.tier)}>
            {capabilities.tier.charAt(0).toUpperCase() + capabilities.tier.slice(1)} Tier
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hardware Info */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            Neural Hardware Stats
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div>RAM: {capabilities.deviceMemory} GB</div>
            <div>Accelerator: {capabilities.hasWebGPU ? 'WebGPU' : 'WASM (CPU)'}</div>
            <div>VRAM: ~{capabilities.estimatedVRAM} GB</div>
            <div>CPU Cores: {capabilities.logicalCores}</div>
            <div className="col-span-2">
              Vault Storage: {capabilities.usedStorage.toFixed(2)} / {capabilities.estimatedStorage} GB
            </div>
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

        {/* Model List */}
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {availableModels.map((model) => (
              <div
                key={model.id}
                className={`p-4 rounded-lg border transition-colors ${
                  model.id === activeModel?.id
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted/30 border-border/50 hover:border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                      {model.id === activeModel?.id && (
                        <Star className="h-4 w-4 text-primary fill-primary" />
                      )}
                      {model.id === activeModel?.id && (
                        <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-400">
                          <Check className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{model.size} parameters</span>
                      <span>{SIZE_ESTIMATES[model.size] || 'Unknown size'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <TooltipProvider>
                        {model.capabilities.map((cap) => (
                          <Tooltip key={cap}>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="gap-1 text-xs cursor-help"
                              >
                                {CAPABILITY_ICONS[cap] || <Zap className="h-3 w-3" />}
                                {cap}
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

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={model.id === activeModel?.id ? "secondary" : "default"}
                      onClick={() => handleLoadModel(model.id)}
                      disabled={isLoading || model.id === activeModel?.id}
                      className="gap-1"
                    >
                      {model.id === activeModel?.id ? <Check className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                      {model.id === activeModel?.id ? 'Active' : 'Load'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            {activeModel ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Sovereign AI Active
              </span>
            ) : (
              <span>No local engine active</span>
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
