import { createContext, useContext } from "react";
import { useLandingMotion } from "@/hooks/use-landing-motion";
type LandingMotionContextValue = ReturnType<typeof useLandingMotion> & { isLandingPage: boolean };

const LandingMotionContext = createContext<LandingMotionContextValue | null>(null);

export function LandingMotionProvider({ children }: { children: React.ReactNode }) {
  const motion = useLandingMotion();
  return (
    <LandingMotionContext.Provider value={{ ...motion, isLandingPage: true }}>
      {children}
    </LandingMotionContext.Provider>
  );
}

/** Use on the home page (inside LandingMotionProvider) or falls back to fresh hook. */
export function useLandingMotionContext() {
  const ctx = useContext(LandingMotionContext);
  const fallback = useLandingMotion();
  if (ctx) return ctx;
  return { ...fallback, isLandingPage: false };
}
