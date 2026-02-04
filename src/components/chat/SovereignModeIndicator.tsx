import { useState, useEffect } from "react";
import { 
  Shield, Wifi, WifiOff, Zap, Brain, Battery, 
  BatteryLow, BatteryCharging, Cpu, HardDrive,
  AlertTriangle, CheckCircle, Loader2, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOfflineChat } from "@/hooks/useOfflineChat";
import { useOfflineMode } from "@/hooks/useOfflineMode";
import { motion, AnimatePresence } from "framer-motion";

export const SovereignModeIndicator = () => {
  const offlineChat = useOfflineChat();
  const { isOffline } = useOfflineMode();
  const [showDetails, setShowDetails] = useState(false);

  // Battery icon based on level and charging state
  const getBatteryIcon = () => {
    if (offlineChat.batteryLevel === null) return null;
    if (offlineChat.isPluggedIn) return <BatteryCharging className="h-3.5 w-3.5 text-green-500" />;
    if (offlineChat.batteryLevel < 20) return <BatteryLow className="h-3.5 w-3.5 text-destructive" />;
    return <Battery className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  // Status color based on state
  const getStatusColor = () => {
    if (offlineChat.isReady) return "bg-green-500";
    if (offlineChat.isInitializing) return "bg-yellow-500";
    if (offlineChat.error) return "bg-destructive";
    return "bg-muted-foreground";
  };

  // Don't show if online and not initialized
  if (!isOffline && !offlineChat.isReady && !offlineChat.isInitializing) {
    return null;
  }

  return (
    <TooltipProvider>
      <Popover open={showDetails} onOpenChange={setShowDetails}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1.5 px-2 hover:bg-accent/50"
          >
            <AnimatePresence mode="wait">
              {isOffline ? (
                <motion.div
                  key="offline"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <div className="relative">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${getStatusColor()} ring-2 ring-background`} />
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">
                    {offlineChat.isReady ? "Stealth Vault" : 
                     offlineChat.isInitializing ? "Initializing..." : 
                     "Offline"}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="online"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium hidden sm:inline">Online</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Sovereign AI Mode</h4>
              </div>
              <Badge variant={isOffline ? "destructive" : "secondary"} className="text-xs">
                {isOffline ? (
                  <><WifiOff className="h-3 w-3 mr-1" /> Offline</>
                ) : (
                  <><Wifi className="h-3 w-3 mr-1" /> Online</>
                )}
              </Badge>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Local AI Status</span>
                <div className="flex items-center gap-1.5">
                  {offlineChat.isReady ? (
                    <><CheckCircle className="h-4 w-4 text-green-500" /><span className="text-green-500">Ready</span></>
                  ) : offlineChat.isInitializing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Loading...</span></>
                  ) : (
                    <><AlertTriangle className="h-4 w-4 text-yellow-500" /><span>Not initialized</span></>
                  )}
                </div>
              </div>

              {/* Loading Progress */}
              {offlineChat.isInitializing && (
                <div className="space-y-1.5">
                  <Progress value={offlineChat.loadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{offlineChat.loadStage}</p>
                </div>
              )}

              {/* Active Model */}
              {offlineChat.activeModel && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Model</span>
                  <Badge variant="outline" className="gap-1">
                    <Brain className="h-3 w-3" />
                    {offlineChat.activeModel}
                  </Badge>
                </div>
              )}

              {/* Model Tier */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Performance Tier</span>
                <Badge 
                  variant={offlineChat.modelTier === 'elite' ? 'default' : 
                          offlineChat.modelTier === 'enterprise' ? 'default' : 'secondary'}
                  className={offlineChat.modelTier === 'elite' ? 'bg-gradient-to-r from-primary to-purple-500' : ''}
                >
                  {offlineChat.modelTier === 'elite' ? '⚡ Elite' : 
                   offlineChat.modelTier === 'enterprise' ? '🚀 Enterprise' : 
                   '📱 Standard'}
                </Badge>
              </div>

              {/* Battery */}
              {offlineChat.batteryLevel !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Battery</span>
                  <div className="flex items-center gap-1.5">
                    {getBatteryIcon()}
                    <span className={offlineChat.batteryLevel < 20 ? 'text-destructive' : ''}>
                      {offlineChat.batteryLevel}%
                    </span>
                    {offlineChat.isPluggedIn && (
                      <span className="text-xs text-green-500">Charging</span>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              {offlineChat.documentCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Local Knowledge Base</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    {offlineChat.documentCount} docs
                  </span>
                </div>
              )}
            </div>

            {/* Capabilities */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Capabilities</p>
              <div className="flex flex-wrap gap-1">
                {offlineChat.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline" className="text-xs">
                    {cap === 'chat' && '💬 Chat'}
                    {cap === 'reasoning' && '🧠 Reasoning'}
                    {cap === 'code' && '💻 Code'}
                    {cap === 'math' && '🔢 Math'}
                    {cap === 'creative' && '🎨 Creative'}
                    {cap === 'multilingual' && '🌍 Multilingual'}
                    {cap === 'rag' && '📚 Documents'}
                    {cap === 'documents' && '📄 Analysis'}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {!offlineChat.isReady && !offlineChat.isInitializing && (
                <Button 
                  size="sm" 
                  onClick={() => offlineChat.initialize()}
                  className="flex-1 gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Initialize Offline AI
                </Button>
              )}
              {offlineChat.isReady && offlineChat.batteryLevel !== null && 
               offlineChat.batteryLevel < 30 && !offlineChat.isPluggedIn && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => offlineChat.enablePowerSaving()}
                  className="flex-1 gap-1.5"
                >
                  <Zap className="h-4 w-4" />
                  Power Saving
                </Button>
              )}
            </div>

            {/* Warning */}
            {offlineChat.error && (
              <div className="p-2 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="text-xs text-destructive">{offlineChat.error}</p>
              </div>
            )}

            {/* Zero-Server Promise */}
            <p className="text-xs text-center text-muted-foreground italic">
              🛡️ All data stays on your device. Zero server contact.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
