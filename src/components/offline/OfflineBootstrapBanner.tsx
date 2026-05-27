import { Download, Wifi, X, Cpu, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOfflineBootstrap } from "@/hooks/useOfflineBootstrap";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Tier A — prompts all users to install the default on-device model (~130MB).
 */
export function OfflineBootstrapBanner() {
  const {
    phase,
    progress,
    statusText,
    error,
    isDesktopBundled,
    tierASizeMB,
    acceptAndInstall,
    skipInstall,
    retry,
  } = useOfflineBootstrap();

  if (phase === "idle" || phase === "ready" || phase === "skipped") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mx-4 mt-2 rounded-2xl border border-primary/25 bg-primary/5 backdrop-blur-md p-4 shadow-lg"
      >
        {phase === "needs_consent" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Install offline AI (included)</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  ShadowTalk can run a private on-device model (~{tierASizeMB} MB) so chat works
                  without the cloud. One-time download — then it&apos;s yours, even offline.
                  {isDesktopBundled && " Desktop builds can bundle this model in the installer."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="ghost" onClick={skipInstall} className="text-xs">
                Later
              </Button>
              <Button size="sm" onClick={() => void acceptAndInstall()} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Install now
              </Button>
            </div>
          </div>
        )}

        {phase === "downloading" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wifi className="h-4 w-4 text-primary animate-pulse" />
              Installing offline AI…
            </div>
            <Progress value={Math.round(progress * 100)} className="h-2" />
            <p className="text-[11px] text-muted-foreground truncate">{statusText}</p>
          </div>
        )}

        {phase === "error" && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={skipInstall}>
                Skip
              </Button>
              <Button size="sm" onClick={retry}>
                Retry
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** Compact chip for chat header when local model is active */
export function OfflineReadyBadge({ tier }: { tier?: "smollm" | "gemma" }) {
  if (!tier) return null;
  const label = tier === "gemma" ? "Gemma on-device" : "Offline AI";
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </span>
  );
}
