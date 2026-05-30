import { motion } from "framer-motion";
import { useLandingMotion } from "@/hooks/use-landing-motion";

type LandingAmbientOrbProps = {
  className?: string;
  animate?: { y?: number[]; x?: number[]; scale?: number[]; opacity?: number[] };
  duration?: number;
};

const LandingAmbientOrb = ({ className = "", animate, duration = 6 }: LandingAmbientOrbProps) => {
  const { shouldAnimateAmbient, orbTransition } = useLandingMotion();

  if (!shouldAnimateAmbient) {
    return <div className={className} aria-hidden />;
  }

  return (
    <motion.div
      animate={animate ?? { y: [0, -12, 0], scale: [1, 1.04, 1] }}
      transition={orbTransition(duration)}
      className={className}
      aria-hidden
    />
  );
};

export default LandingAmbientOrb;
