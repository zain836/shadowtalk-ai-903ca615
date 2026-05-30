import { motion, useScroll, useSpring } from "framer-motion";
import { useLandingMotion } from "@/hooks/use-landing-motion";

type LandingPageShellProps = {
  children: React.ReactNode;
};

/**
 * Wraps the home page: top scroll progress + smooth section flow.
 */
const LandingPageShell = ({ children }: LandingPageShellProps) => {
  const { scrollYProgress } = useScroll();
  const { reduced } = useLandingMotion();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <div className="landing-page relative">
      {!reduced && (
        <motion.div
          className="landing-scroll-progress fixed top-0 left-0 right-0 h-[2px] origin-left z-[100] pointer-events-none"
          style={{ scaleX }}
          aria-hidden
        />
      )}
      {children}
    </div>
  );
};

export default LandingPageShell;
