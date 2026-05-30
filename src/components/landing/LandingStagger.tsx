import { motion } from "framer-motion";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";

type LandingStaggerProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "section";
  inView?: boolean;
};

/** Staggers direct motion children (use LandingAnimate with index prop). */
const LandingStagger = ({ children, className, as = "div", inView = true }: LandingStaggerProps) => {
  const { variants, viewport } = useLandingMotionContext();
  const Component = motion[as] as typeof motion.div;

  return (
    <Component
      variants={variants.staggerContainer}
      initial="hidden"
      {...(inView ? { whileInView: "visible" as const, viewport } : { animate: "visible" })}
      className={className}
    >
      {children}
    </Component>
  );
};

export default LandingStagger;
