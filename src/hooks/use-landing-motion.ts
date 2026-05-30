import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import type { LandingMotionProfile } from "@/lib/landingMotion";
import {
  cardReveal,
  fadeSlideUp,
  floatingOrbTransition,
  hoverLift,
  landingViewport,
  motionDuration,
  parallaxRange,
  popIn,
  scaleFadeIn,
  scrollOpacityRange,
  sectionReveal,
  slideDown,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerDelay,
} from "@/lib/landingMotion";

/**
 * Responsive landing motion: respects prefers-reduced-motion and smaller screens.
 */
export function useLandingMotion() {
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const profile: LandingMotionProfile = { reduced, mobile: isMobile };

  return {
    profile,
    reduced,
    isMobile,
    viewport: landingViewport(profile),
    duration: (desktop = 0.7) => motionDuration(profile, desktop),
    stagger: (desktop = 0.12) => staggerDelay(profile, desktop),
    variants: {
      fadeSlideUp: fadeSlideUp(profile),
      scaleFadeIn: scaleFadeIn(profile),
      staggerContainer: staggerContainer(profile),
      cardReveal: cardReveal(profile),
      sectionReveal: sectionReveal(profile),
      slideDown: slideDown(profile),
      slideInLeft: slideInLeft(profile),
      slideInRight: slideInRight(profile),
      popIn: popIn(profile),
    },
    hoverLift: hoverLift(profile),
    orbTransition: (duration = 6) => floatingOrbTransition(profile, duration),
    parallaxRange: parallaxRange(profile),
    scrollOpacityRange: scrollOpacityRange(profile),
    shouldAnimateAmbient: !reduced,
    enableParallax: !reduced,
  };
}
