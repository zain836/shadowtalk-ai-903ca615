import { motion } from "framer-motion";

/** Centerpiece orb for Shadow Pulse empty state */
export function ShadowPulseOrb() {
  return (
    <div className="relative flex items-center justify-center w-[140px] h-[140px] md:w-[168px] md:h-[168px] mb-8">
      <motion.div
        className="absolute inset-0 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-[#0a0a0c] via-[#121218] to-[#000000] shadow-[inset_0_0_40px_rgba(0,229,255,0.15)]" />
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-400/30"
        style={{
          background:
            "conic-gradient(from 200deg, transparent 0deg, rgba(34,211,238,0.5) 60deg, transparent 120deg, transparent 360deg)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative w-10 h-10 rounded-full bg-cyan-400/90 shadow-[0_0_32px_rgba(34,211,238,0.85)]" />
    </div>
  );
}
