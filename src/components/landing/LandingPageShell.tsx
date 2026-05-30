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
    <div className="landing-page relative overflow-x-hidden">
      {!reduced && (
        <>
          <motion.div
            className="landing-scroll-progress fixed top-0 left-0 right-0 h-[2px] origin-left z-[100] pointer-events-none"
            style={{ scaleX }}
            aria-hidden
          />
          <motion.div
            className="landing-page-ambient pointer-events-none fixed inset-0 z-0"
            aria-hidden
            animate={{ opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

export default LandingPageShell;
