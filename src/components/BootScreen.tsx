import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import chatbotLogo from "@/assets/chatbot-logo.png";

interface BootScreenProps {
  onComplete: () => void;
}

type Phase = 'void' | 'emerge' | 'reveal' | 'loading' | 'ascend';

const GLYPHS = "⟁⟐⟡⟢⟣⟤⟥⬡⬢⬣◇◈◆❖✦✧⊡⊞⊟";

const BootScreen = ({ onComplete }: BootScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('void');
  const [glitchText, setGlitchText] = useState("");

  // Randomized particle positions (stable across renders)
  const particles = useMemo(() => 
    Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 3,
      duration: Math.random() * 4 + 3,
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    })), []
  );

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('emerge'), 200),
      setTimeout(() => setPhase('reveal'), 500),
      setTimeout(() => setPhase('loading'), 800),
      setTimeout(() => setPhase('ascend'), 1800),
      setTimeout(onComplete, 2100),
    ];

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + Math.random() * 12 + 4;
      });
    }, 120);

    // Glitch text cycle
    const glitchInterval = setInterval(() => {
      const fragments = [
        "INIT_SOVEREIGN_CORE",
        "DECRYPT_LAYER_0x7F",
        "ZERO_KNOWLEDGE_SYNC",
        "NEURAL_MESH_ONLINE",
        "PHANTOM_PROTOCOL_OK",
        "E2E_VERIFIED ✓",
        "LOCAL_AI_READY",
        "KILL_SWITCH_ARMED",
      ];
      setGlitchText(fragments[Math.floor(Math.random() * fragments.length)]);
    }, 200);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progressInterval);
      clearInterval(glitchInterval);
    };
  }, [onComplete]);

  const title = "SHADOWTALK";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
        style={{ background: "#000" }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.15, filter: "blur(20px)" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* ── Grid overlay ── */}
        <div
          className="absolute inset-0 pointer-events-none z-[1] opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(0 0% 100% / 0.05) 1px, transparent 1px),
              linear-gradient(90deg, hsl(0 0% 100% / 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* ── Scanline effect ── */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 0% 0% / 0.15) 2px, hsl(0 0% 0% / 0.15) 4px)",
          }}
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />

        {/* ── Primary void radial ── */}
        <motion.div
          className="absolute inset-0 z-[3]"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 45%, hsl(195 100% 8% / 0.4), transparent 70%)",
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Accent glow orbs ── */}
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] z-[3]"
          style={{ background: "radial-gradient(circle, hsl(195 100% 50% / 0.06), transparent)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-[120px] z-[3]"
          style={{ background: "radial-gradient(circle, hsl(270 90% 50% / 0.05), transparent)" }}
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Floating glyphs ── */}
        {phase !== 'void' && particles.slice(0, 20).map((p, i) => (
          <motion.span
            key={i}
            className="absolute font-mono z-[4] pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size * 6}px`,
              color: `hsl(195 80% 50% / ${0.08 + p.size * 0.04})`,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15 + p.size * 0.05, 0],
              y: [0, -40 - p.size * 20, -80],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeOut",
            }}
          >
            {p.glyph}
          </motion.span>
        ))}

        {/* ── Main content ── */}
        <motion.div className="relative z-10 flex flex-col items-center">

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
            className="relative mb-12"
          >
            {/* Pulsing outer rings */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  inset: `${-12 - i * 8}px`,
                  border: `1px solid hsl(195 100% 55% / ${0.15 - i * 0.04})`,
                }}
                animate={{
                  scale: [1, 1.05 + i * 0.02, 1],
                  opacity: [0.3 - i * 0.08, 0.6 - i * 0.1, 0.3 - i * 0.08],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}

            {/* Rotating conic ring */}
            <motion.div
              className="absolute -inset-6 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, hsl(195 100% 55% / 0.5), transparent 30%, hsl(270 90% 60% / 0.3), transparent 60%, hsl(315 90% 55% / 0.2), transparent 90%, hsl(195 100% 55% / 0.5))",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute -inset-[19px] rounded-full bg-black" />

            {/* Logo circle */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(195 50% 8%), hsl(240 10% 4%))",
                boxShadow: "0 0 50px hsl(195 100% 55% / 0.15), 0 0 100px hsl(0 0% 0% / 0.6), inset 0 0 30px hsl(195 100% 55% / 0.05)",
                border: "1px solid hsl(195 100% 55% / 0.2)",
              }}
              animate={{
                boxShadow: [
                  "0 0 50px hsl(195 100% 55% / 0.15), 0 0 100px hsl(0 0% 0% / 0.6)",
                  "0 0 80px hsl(195 100% 55% / 0.3), 0 0 140px hsl(270 90% 60% / 0.1)",
                  "0 0 50px hsl(195 100% 55% / 0.15), 0 0 100px hsl(0 0% 0% / 0.6)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.img
                src={chatbotLogo}
                alt="ShadowTalk AI"
                className="w-16 h-16 object-contain"
                initial={{ opacity: 0, scale: 0.3, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
              />
            </motion.div>

            {/* Orbiting dots */}
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={`orb-${i}`}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: ["hsl(195 100% 60%)", "hsl(270 90% 65%)", "hsl(315 90% 60%)", "hsl(150 80% 50%)"][i],
                  top: "50%",
                  left: "50%",
                  boxShadow: `0 0 8px ${["hsl(195 100% 60% / 0.6)", "hsl(270 90% 65% / 0.4)", "hsl(315 90% 60% / 0.4)", "hsl(150 80% 50% / 0.4)"][i]}`,
                }}
                animate={{
                  x: [0, 75 * Math.cos(i * 1.57), 0],
                  y: [0, 75 * Math.sin(i * 1.57), 0],
                  opacity: [0.2, 0.9, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2.5 + i * 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
              />
            ))}
          </motion.div>

          {/* Title */}
          <AnimatePresence>
            {phase !== 'void' && (
              <motion.div className="flex flex-col items-center mb-8">
                <div className="flex overflow-hidden">
                  {title.split("").map((letter, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 60, rotateX: -90, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                      transition={{
                        delay: i * 0.04 + 0.1,
                        duration: 0.5,
                        type: "spring",
                        stiffness: 150,
                      }}
                      className="text-4xl md:text-6xl font-black tracking-[0.15em]"
                      style={{
                        background: "linear-gradient(180deg, hsl(0 0% 95%), hsl(195 30% 60%), hsl(0 0% 35%))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 20px hsl(195 100% 55% / 0.2))",
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                  <motion.span
                    initial={{ opacity: 0, x: -30, scale: 0.3, filter: "blur(10px)" }}
                    animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                    transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
                    className="text-4xl md:text-6xl font-black ml-4 tracking-[0.15em]"
                    style={{
                      background: "linear-gradient(180deg, hsl(195 100% 65%), hsl(270 90% 60%), hsl(315 90% 55%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 20px hsl(195 100% 55% / 0.3))",
                    }}
                  >
                    AI
                  </motion.span>
                </div>

                {/* Tagline */}
                <motion.p
                  initial={{ opacity: 0, y: 15, letterSpacing: "0.5em" }}
                  animate={{ opacity: 0.6, y: 0, letterSpacing: "0.35em" }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="mt-5 text-xs md:text-sm uppercase font-medium"
                  style={{ color: "hsl(195 60% 50%)" }}
                >
                  Sovereign Intelligence Engine
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading section */}
          <AnimatePresence>
            {(phase === 'loading' || phase === 'ascend') && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 360 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Progress bar */}
                <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "hsl(0 0% 10%)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, hsl(195 100% 50%), hsl(270 90% 60%), hsl(315 90% 55%))",
                      boxShadow: "0 0 12px hsl(195 100% 55% / 0.5)",
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                {/* Status text */}
                <div className="flex items-center justify-between mt-3">
                  <motion.p
                    className="text-[11px] font-mono tracking-wide"
                    style={{ color: "hsl(195 60% 45% / 0.7)" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {progress < 25
                      ? "◈ Initializing void matrix..."
                      : progress < 50
                        ? "◈ Deploying sovereign layer..."
                        : progress < 75
                          ? "◈ Encrypting neural pathways..."
                          : progress < 95
                            ? "◈ Arming kill switch..."
                            : "✦ SOVEREIGN MODE ACTIVE"}
                  </motion.p>
                  <motion.span
                    className="text-[11px] font-mono tabular-nums"
                    style={{ color: "hsl(195 100% 55% / 0.5)" }}
                  >
                    {Math.min(Math.round(progress), 100)}%
                  </motion.span>
                </div>

                {/* Glitch text — rapid cycling terminal output */}
                <motion.div
                  className="mt-2 text-[9px] font-mono tracking-widest text-center overflow-hidden h-3"
                  style={{ color: "hsl(150 80% 45% / 0.3)" }}
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 0.3, repeat: Infinity }}
                >
                  {glitchText}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Corner decorations ── */}
        {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map((pos, i) => (
          <motion.div
            key={pos}
            className={`absolute ${pos} z-10`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <div className="w-6 h-6" style={{
              borderLeft: i % 2 === 0 ? "1px solid hsl(195 100% 55% / 0.3)" : "none",
              borderRight: i % 2 === 1 ? "1px solid hsl(195 100% 55% / 0.3)" : "none",
              borderTop: i < 2 ? "1px solid hsl(195 100% 55% / 0.3)" : "none",
              borderBottom: i >= 2 ? "1px solid hsl(195 100% 55% / 0.3)" : "none",
            }} />
          </motion.div>
        ))}

        {/* Bottom signature */}
        <motion.div
          className="absolute bottom-8 text-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(195 100% 55% / 0.3))" }} />
            <p className="text-[10px] tracking-[0.4em] uppercase font-mono" style={{ color: "hsl(195 60% 50% / 0.5)" }}>
              v2.0 — Zero Knowledge Protocol
            </p>
            <div className="w-8 h-px" style={{ background: "linear-gradient(90deg, hsl(195 100% 55% / 0.3), transparent)" }} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BootScreen;
