import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLandingMotion } from "@/hooks/use-landing-motion";

type RotatingHookTextProps = {
  hooks: readonly string[];
  intervalMs?: number;
  className?: string;
};

const RotatingHookText = ({ hooks, intervalMs = 4200, className = "" }: RotatingHookTextProps) => {
  const [index, setIndex] = useState(0);
  const { reduced, duration } = useLandingMotion();

  useEffect(() => {
    if (reduced || hooks.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % hooks.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [hooks.length, intervalMs, reduced]);

  if (reduced || hooks.length < 2) {
    return <span className={className}>{hooks[0]}</span>;
  }

  return (
    <span className={`inline-block relative min-h-[1.25em] ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={hooks[index]}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
          transition={{ duration: duration(0.45) }}
          className="gradient-text inline-block"
        >
          {hooks[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default RotatingHookText;
