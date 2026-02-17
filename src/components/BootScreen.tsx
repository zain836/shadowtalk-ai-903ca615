import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import chatbotLogo from "@/assets/chatbot-logo.png";

interface BootScreenProps {
  onComplete: () => void;
}

type Phase = 'logo' | 'text' | 'loading' | 'complete';

const BootScreen = ({ onComplete }: BootScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('logo');

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('text'), 300),
      setTimeout(() => setPhase('loading'), 600),
      setTimeout(() => setPhase('complete'), 1400),
      setTimeout(onComplete, 1600),
    ];

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 150);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  const letterVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -90 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        delay: i * 0.06,
        duration: 0.4,
        type: "spring" as const,
        stiffness: 120
      }
    })
  };

  const title = "SHADOWTALK";
  const subtitle = "AI";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#000000" }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Dark feather texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 opacity-[0.04]"
          style={{
            background: `repeating-linear-gradient(
              175deg,
              transparent,
              transparent 1px,
              hsl(0 0% 100% / 0.03) 1px,
              hsl(0 0% 100% / 0.03) 2px
            )`,
          }}
        />

        {/* Midnight void radial */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, hsl(0 0% 8%) 0%, #000 70%)",
          }}
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Swan silhouette glow — dark gold accent */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            background: "radial-gradient(circle, hsl(40 60% 30% / 0.12), transparent)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Secondary dark ember */}
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full blur-[100px]"
          style={{
            background: "radial-gradient(circle, hsl(20 80% 20% / 0.08), transparent)",
          }}
          animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo container */}
        <motion.div className="relative z-10 flex flex-col items-center">
          {/* Logo with dark swan ring */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative mb-10"
          >
            {/* Outer ring — muted gold */}
            <motion.div
              className="absolute -inset-6 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, hsl(40 50% 25% / 0.6), hsl(0 0% 5% / 0.8), hsl(40 50% 25% / 0.6), hsl(0 0% 5% / 0.8), hsl(40 50% 25% / 0.6))",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-5 rounded-full"
              style={{ background: "#000" }}
            />

            {/* Logo circle */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(40 40% 15% / 0.3), hsl(0 0% 5% / 0.8))",
                boxShadow: "0 0 40px hsl(40 50% 25% / 0.15), 0 0 80px hsl(0 0% 0% / 0.5), inset 0 0 20px hsl(40 40% 20% / 0.1)",
                border: "1px solid hsl(40 40% 25% / 0.25)",
              }}
              animate={{
                boxShadow: [
                  "0 0 40px hsl(40 50% 25% / 0.15), 0 0 80px hsl(0 0% 0% / 0.5)",
                  "0 0 60px hsl(40 50% 25% / 0.25), 0 0 120px hsl(0 0% 0% / 0.6)",
                  "0 0 40px hsl(40 50% 25% / 0.15), 0 0 80px hsl(0 0% 0% / 0.5)",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.img
                src={chatbotLogo}
                alt="ShadowTalk AI"
                className="w-16 h-16 object-contain"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
              />
            </motion.div>

            {/* Orbiting dark particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: ["hsl(40 50% 40%)", "hsl(0 0% 50%)", "hsl(40 30% 60%)"][i],
                  top: "50%",
                  left: "50%",
                  boxShadow: `0 0 6px ${["hsl(40 50% 40% / 0.5)", "hsl(0 0% 50% / 0.3)", "hsl(40 30% 60% / 0.4)"][i]}`,
                }}
                animate={{
                  x: [0, 70 * Math.cos(i * 2.09), 0],
                  y: [0, 70 * Math.sin(i * 2.09), 0],
                  opacity: [0.2, 0.7, 0.2],
                }}
                transition={{
                  duration: 3 + i * 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.5,
                }}
              />
            ))}
          </motion.div>

          {/* Title */}
          <AnimatePresence>
            {(phase === 'text' || phase === 'loading' || phase === 'complete') && (
              <motion.div className="flex flex-col items-center mb-8">
                <div className="flex overflow-hidden">
                  {title.split("").map((letter, i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      variants={letterVariants}
                      initial="hidden"
                      animate="visible"
                      className="text-4xl md:text-6xl font-black tracking-wider"
                      style={{
                        background: "linear-gradient(180deg, hsl(0 0% 85%), hsl(0 0% 45%))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 12px hsl(0 0% 30% / 0.3))",
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                  <motion.span
                    initial={{ opacity: 0, x: -20, scale: 0.5 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.4, type: "spring" }}
                    className="text-4xl md:text-6xl font-black ml-3 tracking-wider"
                    style={{
                      background: "linear-gradient(180deg, hsl(40 60% 55%), hsl(40 40% 30%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 12px hsl(40 50% 40% / 0.3))",
                    }}
                  >
                    {subtitle}
                  </motion.span>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  transition={{ delay: 1, duration: 0.4 }}
                  className="mt-4 text-sm md:text-base tracking-[0.3em] uppercase"
                  style={{ color: "hsl(40 20% 45%)" }}
                >
                  The Black Swan of Intelligence
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading bar */}
          <AnimatePresence>
            {(phase === 'loading' || phase === 'complete') && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 320 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <div
                  className="h-px rounded-full overflow-hidden"
                  style={{ background: "hsl(0 0% 12%)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, hsl(40 50% 25%), hsl(40 60% 45%), hsl(40 50% 25%))",
                    }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <motion.p
                    className="text-xs tracking-wide"
                    style={{ color: "hsl(0 0% 35%)" }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {progress < 30
                      ? "Emerging from the void..."
                      : progress < 60
                        ? "Calibrating dark intelligence..."
                        : progress < 90
                          ? "Deploying sovereign layer..."
                          : "Ascended"}
                  </motion.p>
                  <motion.span
                    className="text-xs font-mono"
                    style={{ color: "hsl(40 40% 35% / 0.6)" }}
                  >
                    {Math.min(Math.round(progress), 100)}%
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom signature */}
        <motion.div
          className="absolute bottom-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-1 h-1 rounded-full"
              style={{ background: "hsl(40 50% 40%)" }}
            />
            <p
              className="text-xs tracking-[0.25em] uppercase"
              style={{ color: "hsl(0 0% 30%)" }}
            >
              Sovereign Intelligence
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BootScreen;
