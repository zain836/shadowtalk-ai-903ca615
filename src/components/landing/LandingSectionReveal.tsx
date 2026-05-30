import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";
import LandingAnimate from "@/components/landing/LandingAnimate";
import type { LandingAnimatePreset } from "@/lib/landingMotion";

type LandingSectionRevealProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  preset?: LandingAnimatePreset;
};

const LandingSectionReveal = ({
  children,
  className = "",
  id,
  preset = "section",
}: LandingSectionRevealProps) => {
  const { isLandingPage } = useLandingMotionContext();

  if (!isLandingPage) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <LandingAnimate id={id} className={className} preset={preset} as="div">
      {children}
    </LandingAnimate>
  );
};

export default LandingSectionReveal;
