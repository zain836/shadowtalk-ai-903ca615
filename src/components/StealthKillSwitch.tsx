import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldOff, WifiOff, Wifi, AlertTriangle, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStealthKillSwitch } from "@/hooks/useStealthKillSwitch";
import { cn } from "@/lib/utils";

export const StealthKillSwitch = () => {
  const { isStealthMode, isTransitioning, activateStealthMode, deactivateStealthMode } = useStealthKillSwitch();
  const toggleStealthMode = () => isStealthMode ? deactivateStealthMode() : activateStealthMode();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = () => {
    if (!isStealthMode) {
      setShowConfirm(true);
    } else {
      toggleStealthMode();
    }
  };

  const confirmActivation = () => {
    setShowConfirm(false);
    toggleStealthMode();
  };

  return (
    <>
      {/* Kill Switch Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isTransitioning}
        className={cn(
          "relative gap-1.5 transition-all duration-500",
          isStealthMode
            ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isTransitioning ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="h-3.5 w-3.5" />
          </motion.div>
        ) : isStealthMode ? (
          <ShieldOff className="h-3.5 w-3.5" />
        ) : (
          <Shield className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline text-xs">
          {isStealthMode ? "Stealth ON" : "Stealth"}
        </span>
        {isStealthMode && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </Button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-background border border-destructive/30 rounded-xl p-6 mx-4 max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-destructive/15 rounded-full p-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Activate Stealth Mode?</h3>
                  <p className="text-xs text-muted-foreground">Local-only high-security mode</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground mb-6">
                <div className="flex items-start gap-2 bg-destructive/5 rounded-lg p-3 border border-destructive/10">
                  <WifiOff className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p><strong className="text-destructive">All network traffic</strong> will be immediately blocked</p>
                </div>
                <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3">
                  <Lock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p>AI will run <strong>100% on-device</strong> using local models</p>
                </div>
                <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3">
                  <Shield className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <p>Zero data leaves your device. <strong>Full sovereignty.</strong></p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                  onClick={confirmActivation}
                >
                  <ShieldOff className="h-4 w-4" />
                  Go Dark
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stealth Mode Banner */}
      <AnimatePresence>
        {isStealthMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-16 left-0 right-0 z-40 bg-destructive/10 border-b border-destructive/20 backdrop-blur-sm"
          >
            <div className="container mx-auto px-4 py-1.5 flex items-center justify-center gap-3 text-xs">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShieldOff className="h-3.5 w-3.5 text-destructive" />
              </motion.div>
              <span className="text-destructive font-semibold">STEALTH MODE ACTIVE</span>
              <span className="text-muted-foreground">— All network blocked · Local AI only · Zero cloud contact</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-destructive hover:text-destructive gap-1"
                onClick={toggleStealthMode}
              >
                <Unlock className="h-3 w-3" />
                Deactivate
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
