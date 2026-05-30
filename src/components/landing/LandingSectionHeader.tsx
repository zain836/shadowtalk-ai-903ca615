import { motion } from "framer-motion";
import { useLandingMotion } from "@/hooks/use-landing-motion";
import type { LucideIcon } from "lucide-react";

type LandingSectionHeaderProps = {
  badge?: string;
  badgeIcon?: LucideIcon;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
};

const LandingSectionHeader = ({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  className = "",
}: LandingSectionHeaderProps) => {
  const { variants, viewport, hoverLift } = useLandingMotion();

  return (
    <div className={`text-center mb-16 md:mb-20 ${className}`}>
      {badge && (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={variants.scaleFadeIn}
          whileHover={hoverLift}
          className="inline-flex items-center space-x-2 glass-subtle rounded-full px-4 py-2 sm:px-5 sm:py-2.5 mb-6 md:mb-8"
        >
          {BadgeIcon && <BadgeIcon className="h-4 w-4 text-primary shrink-0" />}
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">{badge}</span>
        </motion.div>
      )}
      <motion.h2
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={variants.fadeSlideUp}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 md:mb-6 tracking-tight leading-tight px-1"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={variants.fadeSlideUp}
          transition={{ delay: 0.08 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};

export default LandingSectionHeader;
