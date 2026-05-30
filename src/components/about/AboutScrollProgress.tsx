import { motion, useScroll, useSpring } from "framer-motion";

const AboutScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left bg-gradient-to-r from-primary via-accent to-secondary shadow-[0_0_20px_hsl(var(--primary)/0.6)]"
      style={{ scaleX }}
    />
  );
};

export default AboutScrollProgress;
