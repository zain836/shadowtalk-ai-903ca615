import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/** Centerpiece orb for ShadowTalk empty chat state */
export function ShadowTalkOrb() {
  return (
    <div className="relative flex items-center justify-center w-[140px] h-[140px] md:w-[168px] md:h-[168px] mb-8">
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full bg-secondary/15 blur-2xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-card via-background to-background shadow-[inset_0_0_40px_hsl(var(--primary)/0.12)] ring-1 ring-border/40" />
      <motion.div
        className="absolute inset-0 rounded-full border border-primary/25"
        style={{
          background:
            "conic-gradient(from 200deg, transparent 0deg, hsl(var(--primary) / 0.45) 60deg, hsl(var(--secondary) / 0.35) 120deg, transparent 200deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-[0_0_32px_hsl(var(--primary)/0.5)]">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
    </div>
  );
}
