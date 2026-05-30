import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BRAND_HOOKS } from "@/lib/brand";

/** Cycles through brand hooks for a memorable, living headline area */
export const RotatingTagline = ({ className = "" }: { className?: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BRAND_HOOKS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`min-h-[1.75rem] flex items-center justify-center ${className}`}>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="text-sm md:text-base text-primary/90 font-medium tracking-wide"
        >
          {BRAND_HOOKS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};
