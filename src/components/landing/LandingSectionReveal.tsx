import { motion } from "framer-motion";
import { useLandingMotion } from "@/hooks/use-landing-motion";

type LandingSectionRevealProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

/** Scroll-triggered section entrance — lighter on mobile, off when reduced motion. */
const LandingSectionReveal = ({ children, className = "", id }: LandingSectionRevealProps) => {
  const { variants, viewport } = useLandingMotion();

  return (
    <motion.div
      id={id}
      className={className}
      variants={variants.sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
};

export default LandingSectionReveal;
