import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, ShieldOff, WifiOff, Lock, Unlock,
  AlertTriangle, Zap, Eye, EyeOff, Radio,
  Fingerprint, Activity, Server, Globe, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStealthKillSwitch } from "@/hooks/useStealthKillSwitch";
import { STEALTH_KEYBOARD_SHORTCUT } from "@/lib/stealthTypes";
import { cn } from "@/lib/utils";

// Scan line animation component
const ScanLines = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} className="h-px w-full bg-foreground" style={{ marginTop: `${i * 2.5}%` }} />
    ))}
  </div>
);

// Particle effect for activation
const ActivationParticles = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-destructive"
          initial={{
            x: '50%',
            y: '50%',
            opacity: 0,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// Circular progress ring
const ProgressRing = ({ progress, size = 120 }: { progress: number; size?: number }) => {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
        opacity={0.2}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--destructive))"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="drop-shadow-[0_0_6px_hsl(var(--destructive)/0.5)]"
      />
    </svg>
  );
};

// Network activity visualization
const NetworkMonitor = ({ blockedCount }: { blockedCount: number }) => {
  const [dots, setDots] = useState<Array<{ id: number; x: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        const newDot = { id: Date.now(), x: Math.random() * 100 };
        return [...prev.slice(-8), newDot];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-12 w-full rounded-lg border border-destructive/20 bg-destructive/5 overflow-hidden">
      <ScanLines />
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute w-full h-px bg-destructive" style={{ top: `${(i + 1) * 16}%` }} />
        ))}
      </div>
      {/* Blocked request pulses */}
      <AnimatePresence>
        {dots.map(dot => (
          <motion.div
            key={dot.id}
            className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-destructive"
            initial={{ x: `${dot.x}%`, y: '-50%', scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          />
        ))}
      </AnimatePresence>
      {/* Status text */}
      <div className="absolute inset-0 flex items-center justify-between px-3">
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Radio className="h-3 w-3 text-destructive" />
          </motion.div>
          <span className="text-[10px] font-mono text-destructive/80 tracking-wider">MONITORING</span>
        </div>
        <span className="text-[10px] font-mono text-destructive font-bold">{blockedCount} BLOCKED</span>
      </div>
    </div>
  );
};

export const StealthKillSwitch = () => {
  const {
    isStealthMode,
    isTransitioning,
    activateStealthMode,
    deactivateStealthMode,
    blockedRequests,
    recentBlocks,
    clearRecentBlocks,
    countdownPhase,
    activationProgress,
  } = useStealthKillSwitch();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);

  const handleToggle = () => {
    if (!isStealthMode) {
      setShowConfirm(true);
    } else {
      deactivateStealthMode();
    }
  };

  const confirmActivation = () => {
    setShowConfirm(false);
    setShowFullScreen(true);
    activateStealthMode();
  };

  // Auto-dismiss full-screen after activation completes
  useEffect(() => {
    if (isStealthMode && !isTransitioning && showFullScreen) {
      const timer = setTimeout(() => setShowFullScreen(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isStealthMode, isTransitioning, showFullScreen]);

  const stealthOverlays =
    typeof document !== "undefined"
      ? createPortal(
          <>
      {/* ===== CONFIRMATION MODAL (Tactical Briefing) ===== */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            {/* Backdrop with grid */}
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl">
              <div className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: 'linear-gradient(hsl(var(--destructive)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--destructive)) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
            </div>

            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md mx-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card */}
              <div className="rounded-2xl border border-destructive/20 bg-card/80 backdrop-blur-xl p-8 shadow-[0_0_60px_-15px_hsl(var(--destructive)/0.3)]">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-destructive/30 bg-destructive/10 mb-5"
                    animate={{
                      boxShadow: [
                        '0 0 0 0 hsl(var(--destructive) / 0)',
                        '0 0 0 12px hsl(var(--destructive) / 0.1)',
                        '0 0 0 0 hsl(var(--destructive) / 0)',
                      ],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    <ShieldOff className="h-9 w-9 text-destructive" />
                  </motion.div>
                  <h2 className="text-2xl font-bold tracking-tight mb-1">Go Dark?</h2>
                  <p className="text-sm text-muted-foreground font-mono tracking-wide">STEALTH PROTOCOL ACTIVATION</p>
                </div>

                {/* Intel Briefing */}
                <div className="space-y-3 mb-8">
                  {[
                    { icon: WifiOff, text: "Blocks fetch, XHR, WebSocket, beacons & SSE to third parties", accent: true },
                    { icon: Lock, text: "Same-origin app shell still loads; cloud chat & APIs stop", accent: false },
                    { icon: Zap, text: "Use Bunker Mode / offline tools for on-device AI while dark", accent: false },
                    { icon: Globe, text: `Shortcut: ${STEALTH_KEYBOARD_SHORTCUT} to toggle anytime`, accent: false },
                  ].map(({ icon: Icon, text, accent }, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 border",
                        accent
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-border/50 bg-muted/20"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", accent ? "text-destructive" : "text-muted-foreground")} />
                      <span className="text-sm font-mono tracking-wide">{text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 font-mono tracking-wider"
                    onClick={() => setShowConfirm(false)}
                  >
                    ABORT
                  </Button>
                  <Button
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 font-mono tracking-wider shadow-[0_0_20px_-5px_hsl(var(--destructive)/0.5)] hover:shadow-[0_0_25px_-5px_hsl(var(--destructive)/0.7)] transition-shadow"
                    onClick={confirmActivation}
                  >
                    <ShieldOff className="h-4 w-4" />
                    GO DARK
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowConfirm(false)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FULL-SCREEN ACTIVATION SEQUENCE ===== */}
      <AnimatePresence>
        {showFullScreen && isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[210] grid place-items-center min-h-[100dvh] bg-background"
          >
            <ScanLines />
            <ActivationParticles active={countdownPhase > 0} />

            {/* Grid background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--destructive)) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            />

            {/* Central countdown — viewport centered */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-4">
              {/* Progress ring */}
              <div className="relative">
                <ProgressRing progress={activationProgress} size={160} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {countdownPhase > 0 ? (
                    <motion.span
                      key={countdownPhase}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="text-6xl font-mono font-black text-destructive tabular-nums"
                      style={{ textShadow: '0 0 30px hsl(var(--destructive) / 0.5)' }}
                    >
                      {countdownPhase}
                    </motion.span>
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                    >
                      <ShieldOff className="h-14 w-14 text-destructive drop-shadow-[0_0_15px_hsl(var(--destructive)/0.5)]" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Status text */}
              <div className="text-center space-y-2">
                <motion.h2
                  className="text-xl font-mono font-bold tracking-[0.3em] text-destructive uppercase"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {countdownPhase > 0 ? "ENGAGING STEALTH" : "GOING DARK"}
                </motion.h2>
                <p className="text-xs font-mono text-muted-foreground tracking-widest min-h-[1rem]">
                  {countdownPhase === 3 && "Encrypting local storage..."}
                  {countdownPhase === 2 && "Blocking network interfaces..."}
                  {countdownPhase === 1 && "Activating on-device AI..."}
                  {countdownPhase === 0 && "Stealth mode engaged"}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-64 max-w-[80vw] h-1 rounded-full bg-muted/20 overflow-hidden">
                <motion.div
                  className="h-full bg-destructive rounded-full"
                  style={{ width: `${activationProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Corner decorations */}
            {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos, i) => (
              <motion.div
                key={i}
                className={`absolute ${pos} w-8 h-8 border-destructive/30 pointer-events-none`}
                style={{
                  borderTopWidth: i < 2 ? 2 : 0,
                  borderBottomWidth: i >= 2 ? 2 : 0,
                  borderLeftWidth: i % 2 === 0 ? 2 : 0,
                  borderRightWidth: i % 2 === 1 ? 2 : 0,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== ACTIVE STATE BANNER (Tactical HUD) ===== */}
      <AnimatePresence>
        {isStealthMode && !showFullScreen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-16 left-0 right-0 z-[190] overflow-hidden"
          >
            <div className="relative border-b border-destructive/20 bg-background/95 backdrop-blur-xl">
              <ScanLines />

              {/* Glow line at top */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/50 to-transparent"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="container mx-auto px-4 py-2.5">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Status */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="flex items-center justify-center w-7 h-7 rounded-full border border-destructive/40 bg-destructive/10"
                      animate={{
                        boxShadow: [
                          '0 0 0 0 hsl(var(--destructive) / 0)',
                          '0 0 0 6px hsl(var(--destructive) / 0.1)',
                          '0 0 0 0 hsl(var(--destructive) / 0)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <EyeOff className="h-3.5 w-3.5 text-destructive" />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold tracking-[0.15em] text-destructive">STEALTH ACTIVE</span>
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-destructive"
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground tracking-wider">
                        NETWORK BLOCKED · {STEALTH_KEYBOARD_SHORTCUT} TO SURFACE
                      </p>
                    </div>
                  </div>

                  {/* Center: Network monitor + recent blocks */}
                  <div className="hidden md:flex flex-1 max-w-md flex-col gap-1.5 min-w-0">
                    <NetworkMonitor blockedCount={blockedRequests} />
                    {recentBlocks.length > 0 && (
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-[9px] font-mono text-muted-foreground truncate flex-1" title={recentBlocks[0].url}>
                          Last: {recentBlocks[0].method} {recentBlocks[0].url.replace(/^https?:\/\//, "").slice(0, 48)}
                        </p>
                        <button
                          type="button"
                          onClick={clearRecentBlocks}
                          className="text-[9px] font-mono text-destructive/70 hover:text-destructive shrink-0"
                        >
                          CLEAR
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Stats + Deactivate */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Server className="h-3 w-3 text-destructive/60" />
                        <span>{blockedRequests} blocked</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-emerald-500/60" />
                        <span>Local only</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] font-mono tracking-wider text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                      onClick={() => deactivateStealthMode()}
                    >
                      <Unlock className="h-3 w-3" />
                      SURFACE
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
          </>,
          document.body
        )
      : null;

  return (
    <>
      {/* ===== TRIGGER BUTTON ===== */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isTransitioning}
        className={cn(
          "relative gap-1.5 transition-all duration-500 group",
          isStealthMode
            ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.3)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isTransitioning ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          >
            <Fingerprint className="h-3.5 w-3.5" />
          </motion.div>
        ) : isStealthMode ? (
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <EyeOff className="h-3.5 w-3.5" />
          </motion.div>
        ) : (
          <Eye className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
        )}
        <span className="hidden sm:inline text-xs font-mono tracking-wider">
          {isStealthMode ? "DARK" : "STEALTH"}
        </span>
        {isStealthMode && (
          <>
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-md border border-destructive/40"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        )}
      </Button>

      {stealthOverlays}
    </>
  );
};
