import { motion, type HTMLMotionProps } from "framer-motion";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";
import { variantForPreset, type LandingAnimatePreset } from "@/lib/landingMotion";

type LandingAnimateProps = HTMLMotionProps<"div"> & {
  preset?: LandingAnimatePreset;
  index?: number;
  inView?: boolean;
  as?: "div" | "section" | "article" | "span" | "li" | "header" | "footer" | "nav";
};

const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  span: motion.span,
  li: motion.li,
  header: motion.header,
  footer: motion.footer,
  nav: motion.nav,
} as const;

const LandingAnimate = ({
  preset = "fadeUp",
  index,
  inView = true,
  as = "div",
  children,
  className,
  whileHover,
  whileTap,
  ...rest
}: LandingAnimateProps) => {
  const { profile, viewport, hoverLift } = useLandingMotionContext();
  const Component = motionTags[as];
  const motionVariants = variantForPreset(profile, preset);

  return (
    <Component
      custom={index}
      variants={motionVariants}
      initial="hidden"
      {...(inView
        ? { whileInView: "visible" as const, viewport }
        : { animate: "visible" as const })}
      whileHover={whileHover ?? (preset === "card" ? hoverLift : undefined)}
      whileTap={whileTap}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default LandingAnimate;
