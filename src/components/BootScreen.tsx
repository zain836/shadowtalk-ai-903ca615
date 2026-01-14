import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        {/* Floating orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(200 100% 60% / 0.2), transparent)" }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(280 100% 65% / 0.15), transparent)" }}
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(320 100% 60% / 0.1), transparent)" }}
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Logo container */}
        <motion.div className="relative z-10 flex flex-col items-center">
          {/* Main logo icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="relative mb-8"
          >
            <motion.div
              className="w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(200 100% 60%), hsl(280 100% 65%))" }}
              animate={{
                borderRadius: ["16px", "24px", "16px"],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary-foreground"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </motion.svg>
            </motion.div>
            
            {/* Orbiting particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: i === 0 ? "hsl(200 100% 60%)" : i === 1 ? "hsl(280 100% 65%)" : "hsl(320 100% 60%)",
                  top: "50%",
                  left: "50%",
                }}
                animate={{
                  rotate: 360,
                  x: [0, 60 * Math.cos(i * 2.1), 0],
                  y: [0, 60 * Math.sin(i * 2.1), 0],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.3,
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
                      className="text-4xl md:text-6xl font-bold"
                      style={{
                        background: "linear-gradient(135deg, hsl(200 100% 60%), hsl(280 100% 65%), hsl(320 100% 60%))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                  <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                    className="text-4xl md:text-6xl font-bold ml-3"
                    style={{
                      background: "linear-gradient(135deg, hsl(320 100% 60%), hsl(280 100% 65%))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {subtitle}
                  </motion.span>
                </div>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  className="text-muted-foreground mt-4 text-lg"
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
                animate={{ opacity: 1, width: 280 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(200 100% 60%), hsl(280 100% 65%), hsl(320 100% 60%))" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <motion.p
                  className="text-xs text-muted-foreground text-center mt-3"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {progress < 30 ? "Initializing neural networks..." : 
                   progress < 60 ? "Loading knowledge base..." : 
                   progress < 90 ? "Calibrating AI models..." : 
                   "Ready to assist"}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom signature */}
        <motion.div
          className="absolute bottom-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2.5 }}
        >
          <p className="text-xs text-muted-foreground">
            Enterprise AI Platform
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BootScreen;
