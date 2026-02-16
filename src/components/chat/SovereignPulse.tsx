import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Wifi, WifiOff, Brain, Zap, Lock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SovereignPulseProps {
  isOffline?: boolean;
  isAIReady?: boolean;
  isProcessing?: boolean;
  privacyScore?: number;
  blockedAttempts?: number;
  isTurboMode?: boolean;
}

export const SovereignPulse: React.FC<SovereignPulseProps> = ({
  isOffline = false,
  isAIReady = false,
  isProcessing = false,
  privacyScore = 98,
  blockedAttempts = 0,
  isTurboMode = false,
}) => {
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);

  // Pulse animation based on activity
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setPulseIntensity(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
    setPulseIntensity(0);
  }, [isProcessing]);

  // Shield animation triggers during chat
  useEffect(() => {
    if (isProcessing) {
      setShieldActive(true);
      const timeout = setTimeout(() => setShieldActive(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [isProcessing]);

  const isFullySovereign = isOffline && isAIReady;

  // Color scheme based on sovereignty level
  const getGlowColor = () => {
    if (isFullySovereign) return 'hsl(195 100% 55%)'; // Sovereign blue
    if (isAIReady) return 'hsl(150 80% 45%)'; // Green - AI ready
    if (isOffline) return 'hsl(40 95% 55%)'; // Amber - offline no AI
    return 'hsl(195 100% 55% / 0.5)'; // Dim blue - online
  };

  const getStatusLabel = () => {
    if (isFullySovereign) return 'Sovereign Mode';
    if (isAIReady && !isOffline) return 'AI Shield Active';
    if (isOffline) return 'Offline';
    return 'Protected';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="relative flex items-center gap-1.5 cursor-pointer select-none"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Sovereign Pulse Glow Ring */}
            <div className="relative">
              {/* Outer glow */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: `0 0 ${isProcessing ? 20 : 8}px ${getGlowColor()}, 0 0 ${isProcessing ? 40 : 16}px ${getGlowColor()}`,
                }}
                animate={{
                  scale: isProcessing ? [1, 1.3, 1] : [1, 1.1, 1],
                  opacity: isProcessing ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: isProcessing ? 1 : 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Core icon */}
              <motion.div
                className={cn(
                  'relative z-10 w-7 h-7 rounded-full flex items-center justify-center border',
                  isFullySovereign && 'bg-primary/20 border-primary/60',
                  isAIReady && !isOffline && 'bg-green-500/20 border-green-500/60',
                  isOffline && !isAIReady && 'bg-amber-500/20 border-amber-500/60',
                  !isOffline && !isAIReady && 'bg-primary/10 border-primary/30',
                )}
              >
                <AnimatePresence mode="wait">
                  {isFullySovereign ? (
                    <motion.div key="sovereign" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Shield className="h-3.5 w-3.5 text-primary" />
                    </motion.div>
                  ) : isAIReady ? (
                    <motion.div key="ready" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Brain className="h-3.5 w-3.5 text-green-500" />
                    </motion.div>
                  ) : isOffline ? (
                    <motion.div key="offline" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                    </motion.div>
                  ) : (
                    <motion.div key="online" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Wifi className="h-3.5 w-3.5 text-primary/70" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Status badges */}
            <div className="hidden sm:flex items-center gap-1">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] h-5 gap-1 px-1.5 border',
                  isFullySovereign && 'border-primary/50 text-primary bg-primary/10',
                  isAIReady && !isOffline && 'border-green-500/50 text-green-500 bg-green-500/10',
                  isOffline && !isAIReady && 'border-amber-500/50 text-amber-500 bg-amber-500/10',
                  !isOffline && !isAIReady && 'border-primary/30 text-primary/70 bg-primary/5',
                )}
              >
                {getStatusLabel()}
              </Badge>

              {isTurboMode && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Badge variant="outline" className="text-[10px] h-5 gap-0.5 px-1.5 border-amber-400/50 text-amber-400 bg-amber-400/10">
                    <Zap className="h-2.5 w-2.5" />
                    Turbo
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Privacy Shield Animation Overlay */}
            <AnimatePresence>
              {shieldActive && isProcessing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -right-1 -top-1"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Lock className="h-3 w-3 text-primary" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <div className="space-y-1">
            <p className="font-semibold text-xs">{getStatusLabel()}</p>
            <p className="text-[10px] text-muted-foreground">
              {isFullySovereign
                ? '100% on-device processing. Zero data leaves your device.'
                : isAIReady
                ? 'Local AI active. Privacy shield engaged.'
                : isOffline
                ? 'Offline. Download a model for full sovereignty.'
                : 'Online mode. Enable Bunker Mode for full privacy.'}
            </p>
            {blockedAttempts > 0 && (
              <p className="text-[10px] text-primary flex items-center gap-1">
                <Eye className="h-2.5 w-2.5" />
                {blockedAttempts} tracking attempts blocked
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
