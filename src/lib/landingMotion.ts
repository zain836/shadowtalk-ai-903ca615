import type { Transition, Variants } from "framer-motion";

/** Shared easing for landing scroll reveals */
export const LANDING_EASE = [0.25, 0.46, 0.45, 0.94] as const;

export type LandingMotionProfile = {
  reduced: boolean;
  mobile: boolean;
};

export function landingViewport({ mobile }: Pick<LandingMotionProfile, "mobile">) {
  return { once: true, margin: mobile ? "-5% 0px -5% 0px" : "-12% 0px -8% 0px" } as const;
}

export function motionDuration(profile: LandingMotionProfile, desktop = 0.7): number {
  if (profile.reduced) return 0.01;
  return profile.mobile ? Math.min(desktop, 0.5) : desktop;
}

export function staggerDelay(profile: LandingMotionProfile, desktop = 0.12): number {
  if (profile.reduced) return 0;
  return profile.mobile ? desktop * 0.6 : desktop;
}

export function fadeSlideUp(profile: LandingMotionProfile): Variants {
  const y = profile.reduced ? 0 : profile.mobile ? 18 : 40;
  const blur = profile.reduced ? "blur(0px)" : profile.mobile ? "blur(4px)" : "blur(8px)";
  return {
    hidden: { opacity: 0, y, filter: blur },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: motionDuration(profile, 0.7),
        ease: LANDING_EASE,
      },
    },
  };
}

export function scaleFadeIn(profile: LandingMotionProfile): Variants {
  return {
    hidden: { opacity: 0, scale: profile.reduced ? 1 : profile.mobile ? 0.97 : 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: motionDuration(profile, 0.6),
        ease: LANDING_EASE,
      },
    },
  };
}

export function staggerContainer(profile: LandingMotionProfile): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay(profile, 0.12),
        delayChildren: profile.reduced ? 0 : profile.mobile ? 0.05 : 0.1,
      },
    },
  };
}

export function cardReveal(profile: LandingMotionProfile): Variants {
  const y = profile.reduced ? 0 : profile.mobile ? 24 : 50;
  return {
    hidden: { opacity: 0, y, scale: profile.reduced ? 1 : 0.96 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: profile.reduced ? 0 : i * staggerDelay(profile, 0.1),
        duration: motionDuration(profile, 0.55),
        ease: LANDING_EASE,
      },
    }),
  };
}

export function sectionReveal(profile: LandingMotionProfile): Variants {
  return {
    hidden: { opacity: profile.reduced ? 1 : 0, y: profile.reduced ? 0 : profile.mobile ? 12 : 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: motionDuration(profile, 0.65), ease: LANDING_EASE },
    },
  };
}

export function hoverLift(profile: LandingMotionProfile) {
  if (profile.reduced) return {};
  if (profile.mobile) return { y: -3, transition: { type: "spring" as const, stiffness: 400, damping: 28 } };
  return {
    y: -8,
    scale: 1.02,
    transition: { type: "spring" as const, stiffness: 400, damping: 20 },
  };
}

export function floatingOrbTransition(profile: LandingMotionProfile, duration = 6): Transition {
  if (profile.reduced) return { duration: 0 };
  return {
    duration: profile.mobile ? duration * 1.25 : duration,
    repeat: Infinity,
    ease: "easeInOut",
  };
}

export function parallaxRange(profile: LandingMotionProfile): [number, number] {
  if (profile.reduced) return [0, 0];
  return profile.mobile ? [0, 40] : [0, 80];
}

export function scrollOpacityRange(profile: LandingMotionProfile): [number, number] {
  if (profile.reduced) return [1, 1];
  return [1, profile.mobile ? 0.85 : 0.6];
}
