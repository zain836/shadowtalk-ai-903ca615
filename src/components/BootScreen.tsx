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
      setTimeout(() => setPhase('text'), 800),
      setTimeout(() => setPhase('loading'), 1600),
      setTimeout(() => setPhase('complete'), 3500),
      setTimeout(onComplete, 4000),
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
        delay: i * 0.08,
        duration: 0.5,
        type: "spring" as const,
        stiffness: 100
      }
    })
  };

  const title = "SHADOWTALK";
  const subtitle = "AI";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "hsl(240 10% 2%)" }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
          style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(200 100% 80% / 0.1) 2px, hsl(200 100% 80% / 0.1) 4px)" }}
        />

        {/* Animated background grid */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Pulsing radial backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, hsl(200 100% 60% / 0.08) 0%, transparent 70%)" }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(200 100% 60% / 0.15), transparent)" }}
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(280 100% 65% / 0.12), transparent)" }}
          animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, hsl(320 100% 60% / 0.08), transparent)" }}
          animate={{ x: [0, 30, 0], y: [0, 50, 0], scale: [1, 1.4, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo container */}
        <motion.div className="relative z-10 flex flex-col items-center">
          {/* Chatbot logo with glow */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative mb-10"
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute -inset-6 rounded-full"
              style={{ background: "conic-gradient(from 0deg, hsl(200 100% 60% / 0.4), hsl(280 100% 65% / 0.4), hsl(320 100% 60% / 0.4), hsl(200 100% 60% / 0.4))" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -inset-5 rounded-full"
              style={{ background: "hsl(240 10% 2%)" }}
            />

            {/* Logo container */}
            <motion.div
              className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(200 100% 60% / 0.2), hsl(280 100% 65% / 0.2))",
                boxShadow: "0 0 60px hsl(200 100% 60% / 0.3), 0 0 120px hsl(280 100% 65% / 0.15), inset 0 0 30px hsl(200 100% 60% / 0.1)",
                border: "1px solid hsl(200 100% 60% / 0.3)",
              }}
              animate={{
                boxShadow: [
                  "0 0 60px hsl(200 100% 60% / 0.3), 0 0 120px hsl(280 100% 65% / 0.15)",
                  "0 0 80px hsl(200 100% 60% / 0.5), 0 0 160px hsl(280 100% 65% / 0.25)",
                  "0 0 60px hsl(200 100% 60% / 0.3), 0 0 120px hsl(280 100% 65% / 0.15)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.img
                src={chatbotLogo}
                alt="ShadowTalk AI"
                className="w-16 h-16 object-contain"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
              />
            </motion.div>

            {/* Orbiting particles */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: [
                    "hsl(200 100% 60%)",
                    "hsl(280 100% 65%)",
                    "hsl(320 100% 60%)",
                    "hsl(160 100% 50%)",
                  ][i],
                  top: "50%",
                  left: "50%",
                  boxShadow: `0 0 8px ${["hsl(200 100% 60%)", "hsl(280 100% 65%)", "hsl(320 100% 60%)", "hsl(160 100% 50%)"][i]}`,
                }}
                animate={{
                  x: [0, 75 * Math.cos(i * 1.57), 0],
                  y: [0, 75 * Math.sin(i * 1.57), 0],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 2.5 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
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
                        background: "linear-gradient(135deg, hsl(200 100% 70%), hsl(280 100% 75%), hsl(320 100% 70%))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 20px hsl(200 100% 60% / 0.3))",
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                  <motion.span
                    initial={{ opacity: 0, x: -20, scale: 0.5 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
                    className="text-4xl md:text-6xl font-black ml-3 tracking-wider"
                    style={{
                      background: "linear-gradient(135deg, hsl(320 100% 70%), hsl(280 100% 75%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 20px hsl(320 100% 60% / 0.3))",
                    }}
                  >
                    {subtitle}
                  </motion.span>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="mt-4 text-sm md:text-base tracking-[0.3em] uppercase"
                  style={{ color: "hsl(200 40% 70%)" }}
                >
                  Powering the Future of Intelligence
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
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div
                  className="h-[2px] rounded-full overflow-hidden"
                  style={{ background: "hsl(200 20% 15%)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(200 100% 60%), hsl(280 100% 65%), hsl(320 100% 60%))" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <motion.p
                    className="text-xs tracking-wide"
                    style={{ color: "hsl(200 30% 55%)" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {progress < 30 ? "Initializing neural networks..." :
                     progress < 60 ? "Loading knowledge base..." :
                     progress < 90 ? "Calibrating AI models..." :
                     "Ready to assist"}
                  </motion.p>
                  <motion.span
                    className="text-xs font-mono"
                    style={{ color: "hsl(200 100% 60% / 0.6)" }}
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
          className="absolute bottom-8 text-center flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 2.5 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(160 100% 50%)" }} />
            <p className="text-xs tracking-[0.2em] uppercase" style={{ color: "hsl(200 20% 50%)" }}>
              Enterprise AI Platform
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BootScreen;
