import { useState, useEffect, useCallback } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";

const PWABanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { hoverLift, profile } = useLandingMotionContext();

  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    const sessionDismissed = sessionStorage.getItem("pwa-banner-session-dismissed");

    if (dismissed === "true" || sessionDismissed === "true") {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    if (isInStandaloneMode) {
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isInStandaloneMode) {
      const timer = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (showBanner && !hasInteracted) {
      const timer = setTimeout(() => {
        setShowBanner(false);
        sessionStorage.setItem("pwa-banner-session-dismissed", "true");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showBanner, hasInteracted]);

  const handleInstall = useCallback(async () => {
    setHasInteracted(true);
    if (!deferredPrompt) {
      setShowBanner(false);
      sessionStorage.setItem("pwa-banner-session-dismissed", "true");
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        localStorage.setItem("pwa-banner-dismissed", "true");
      } else {
        sessionStorage.setItem("pwa-banner-session-dismissed", "true");
      }
    } catch (e) {
      console.error("Install prompt error:", e);
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleClose = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem("pwa-banner-session-dismissed", "true");
  }, []);

  const handleDismissPermanently = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", "true");
  }, []);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32, scale: 0.94 }}
          transition={{
            type: "spring",
            stiffness: profile.reduced ? 500 : 320,
            damping: 26,
          }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40"
        >
          <motion.div
            className="bg-gradient-card border border-border rounded-lg p-4 shadow-glow"
            animate={profile.reduced ? undefined : { boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 24px 0 hsl(var(--primary) / 0.2)", "0 0 0 0 hsl(var(--primary) / 0)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="flex items-start space-x-3">
              <motion.div
                className="bg-primary/20 rounded-lg p-2 flex-shrink-0"
                animate={profile.reduced ? undefined : { y: [0, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Smartphone className="h-5 w-5 text-primary" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">Install Our App</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Get instant access, offline mode, and a native app experience
                </p>
                <div className="flex space-x-2">
                  <motion.div className="flex-1" whileHover={hoverLift} whileTap={{ scale: 0.97 }}>
                    <Button size="sm" onClick={handleInstall} className="btn-glow w-full">
                      <Download className="h-3 w-3 mr-1" />
                      Install
                    </Button>
                  </motion.div>
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <Button variant="ghost" size="sm" onClick={handleClose} className="px-2" title="Dismiss for now">
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                </div>
                <motion.button
                  type="button"
                  onClick={handleDismissPermanently}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
                  whileHover={{ opacity: 1 }}
                >
                  Don't show again
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWABanner;
