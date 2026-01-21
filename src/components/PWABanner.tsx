import { useState, useEffect, useCallback } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const PWABanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session or permanently
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const sessionDismissed = sessionStorage.getItem('pwa-banner-session-dismissed');
    
    if (dismissed === 'true' || sessionDismissed === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay before showing to avoid jarring UX
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if running as installed PWA
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    if (isInStandaloneMode) {
      // Already installed, don't show
      return;
    }

    // Show banner for iOS users after a delay (no beforeinstallprompt event)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isInStandaloneMode) {
      const timer = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Auto-hide after 10 seconds if no interaction
  useEffect(() => {
    if (showBanner && !hasInteracted) {
      const timer = setTimeout(() => {
        setShowBanner(false);
        sessionStorage.setItem('pwa-banner-session-dismissed', 'true');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showBanner, hasInteracted]);

  const handleInstall = useCallback(async () => {
    setHasInteracted(true);
    if (!deferredPrompt) {
      // iOS - just close and mark as seen
      setShowBanner(false);
      sessionStorage.setItem('pwa-banner-session-dismissed', 'true');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        localStorage.setItem('pwa-banner-dismissed', 'true');
      } else {
        sessionStorage.setItem('pwa-banner-session-dismissed', 'true');
      }
    } catch (e) {
      console.error('Install prompt error:', e);
    }
    
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleClose = useCallback(() => {
    setShowBanner(false);
    sessionStorage.setItem('pwa-banner-session-dismissed', 'true');
  }, []);

  const handleDismissPermanently = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gradient-card border border-border rounded-lg p-4 shadow-glow">
        <div className="flex items-start space-x-3">
          <div className="bg-primary/20 rounded-lg p-2 flex-shrink-0">
            <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Install Our App
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Get instant access, offline mode, and a native app experience
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="btn-glow flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                Install
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="px-2"
                title="Dismiss for now"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <button
              onClick={handleDismissPermanently}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWABanner;
