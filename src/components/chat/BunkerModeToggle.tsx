import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import {
  Shield,
  Download,
  Pause,
  Play,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  HardDrive,
  Loader2,
  Check,
  X,
  AlertCircle,
  Zap,
  Clock,
  Trash2,
} from 'lucide-react';
import { useSilentDownloader } from '@/hooks/useSilentDownloader';
import { cn } from '@/lib/utils';

interface BunkerModeToggleProps {
  className?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(0)} KB`;
  if (bytes < 1e9) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e9).toFixed(1)} GB`;
};

export const BunkerModeToggle: React.FC<BunkerModeToggleProps> = ({ className }) => {
  const {
    bunkerMode,
    isDownloading,
    isPaused,
    pauseReason,
    tasks,
    currentTask,
    totalStorageUsed,
    estimatedStorageAvailable,
    bandwidthUsage,
    batteryStatus,
    enableBunkerMode,
    pauseDownload,
    resumeDownload,
    setBandwidthLimit,
    removeTask,
    getTimeRemaining,
    queueModelDownload,
  } = useSilentDownloader();

  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (enabled: boolean) => {
    if (enabled && !bunkerMode) {
      // Show consent dialog before enabling
      setShowConsentDialog(true);
    } else {
      enableBunkerMode(enabled);
    }
  };

  const handleConsent = () => {
    enableBunkerMode(true);
    setShowConsentDialog(false);
  };

  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'cached');
  const pendingTasks = tasks.filter(t => t.status === 'queued' || t.status === 'downloading');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'cached':
        return <Check className="h-3 w-3 text-emerald-500" />;
      case 'downloading': return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
      case 'paused': return <Pause className="h-3 w-3 text-amber-500" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-destructive" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  // Quick models to queue
  const quickQueueModels = [
    { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B', size: '800 MB' },
    { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B', size: '2.5 GB' },
    { id: 'Llama-3.1-8B-Instruct-q4f16_1-MLC', name: 'Llama 3.1 8B', size: '5.5 GB' },
  ];

  return (
    <>
      {/* Consent Dialog */}
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <AlertDialogTitle className="text-center">Prepare Your Bunker?</AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-2">
              <p>
                Enable background downloads to prepare your AI for fully offline use.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-left text-sm space-y-1 mt-4">
                <p className="font-medium text-foreground">🔐 What happens:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Models download silently while you chat</li>
                  <li>Uses up to 60% bandwidth (adjustable)</li>
                  <li>Pauses on low battery when unplugged</li>
                  <li>Storage: 2-6 GB depending on model</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                You won't feel a thing. Turn off Wi-Fi anytime and chat privately.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Not Now</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConsent}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Enable Bunker Mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Toggle Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant={bunkerMode ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'gap-2 relative',
              bunkerMode && 'bg-emerald-600 hover:bg-emerald-700',
              className
            )}
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Bunker</span>
            {isDownloading && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
            {completedTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
                {completedTasks.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              Bunker Mode
            </SheetTitle>
            <SheetDescription>
              Download AI models for fully offline, private use
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                {bunkerMode ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {bunkerMode ? 'Bunker Active' : 'Bunker Disabled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bunkerMode ? 'Background downloads enabled' : 'Enable to download models'}
                  </p>
                </div>
              </div>
              <Switch
                checked={bunkerMode}
                onCheckedChange={handleToggle}
              />
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-3">
              {/* Battery Status */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm">
                  {batteryStatus?.isCharging ? (
                    <BatteryCharging className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Battery className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-muted-foreground">Battery</span>
                </div>
                <p className="font-medium mt-1">
                  {batteryStatus ? `${Math.round(batteryStatus.level * 100)}%` : 'N/A'}
                </p>
              </div>

              {/* Storage */}
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Storage</span>
                </div>
                <p className="font-medium mt-1">
                  {formatBytes(estimatedStorageAvailable)} free
                </p>
              </div>
            </div>

            {/* Bandwidth Control */}
            {bunkerMode && (
              <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Bandwidth Limit</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{bandwidthUsage}%</span>
                </div>
                <Slider
                  value={[bandwidthUsage]}
                  onValueChange={([value]) => setBandwidthLimit(value)}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher = faster download but may lag chat
                </p>
              </div>
            )}

            {/* Current Download */}
            {currentTask && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="font-medium">{currentTask.modelName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => isPaused ? resumeDownload() : pauseDownload('user')}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                </div>
                <Progress value={currentTask.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatBytes(currentTask.downloadedBytes)} / {formatBytes(currentTask.totalBytes)}</span>
                  <span>{getTimeRemaining(currentTask)}</span>
                </div>
                {isPaused && pauseReason && (
                  <div className="flex items-center gap-2 text-xs text-amber-500">
                    <AlertCircle className="h-3 w-3" />
                    Paused: {pauseReason === 'battery' ? 'Low battery' : pauseReason === 'bandwidth' ? 'Bandwidth limit' : 'User paused'}
                  </div>
                )}
              </div>
            )}

            {/* Quick Queue */}
            {bunkerMode && !currentTask && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Quick Download</p>
                <div className="grid gap-2">
                  {quickQueueModels.map(model => {
                    const taskForModel = tasks.find(t => t.modelId === model.id);
                    const isQueued = !!taskForModel;
                    const isComplete = taskForModel?.status === 'completed' || taskForModel?.status === 'cached';
                    
                    return (
                      <Button
                        key={model.id}
                        variant={isComplete ? 'secondary' : 'outline'}
                        size="sm"
                        className="justify-between h-auto py-2"
                        onClick={() => !isQueued && queueModelDownload(model.id, model.name)}
                        disabled={isQueued}
                      >
                        <span className="flex items-center gap-2">
                          {isComplete ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {model.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {isComplete ? (taskForModel?.status === 'cached' ? 'Cached' : 'Ready') : isQueued ? 'Queued' : model.size}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Download Queue */}
            {tasks.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Download Queue</p>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className={cn(
                        'p-3 rounded-lg border flex items-center justify-between',
                        (task.status === 'completed' || task.status === 'cached') && 'bg-emerald-500/5 border-emerald-500/30',
                        task.status === 'error' && 'bg-destructive/5 border-destructive/30'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <p className="text-sm font-medium">{task.modelName}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.status === 'completed' 
                              ? 'Ready for offline use' 
                              : task.status === 'cached'
                                ? 'Already cached - ready to use'
                                : task.status === 'error'
                                  ? task.error
                                  : `${task.progress}% • ${formatBytes(task.totalBytes)}`
                            }
                          </p>
                        </div>
                      </div>
                      {task.status !== 'downloading' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Status */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                {navigator.onLine ? (
                  <Wifi className="h-4 w-4 text-emerald-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm font-medium">
                  {navigator.onLine ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {completedTasks.length > 0
                  ? `${completedTasks.length} model${completedTasks.length > 1 ? 's' : ''} ready for offline use`
                  : 'Download models to use ShadowTalk offline'
                }
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
