import { useState } from "react";
import { Percent, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLandingMotionContext } from "@/components/landing/LandingMotionProvider";
import LandingAnimate from "@/components/landing/LandingAnimate";

const CouponBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { hoverLift, profile, orbTransition } = useLandingMotionContext();

  if (!isVisible) return null;

  return (
    <LandingAnimate preset="slideDown" inView={false} className="bg-gradient-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <motion.div
            className="flex items-center space-x-3 min-w-0"
            animate={profile.reduced ? undefined : { x: [0, 2, 0] }}
            transition={orbTransition(4)}
          >
            <motion.div
              className="bg-background/20 rounded-full p-1 shrink-0"
              animate={profile.reduced ? undefined : { rotate: [0, 8, -8, 0] }}
              transition={orbTransition(3)}
            >
              <Percent className="h-4 w-4" />
            </motion.div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 min-w-0">
              <span className="font-semibold text-sm sm:text-base truncate">
                🎉 Limited Time: 50% OFF Lifetime Plan!
              </span>
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Ends Dec 31st</span>
              </div>
            </div>
          </motion.div>
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <motion.div whileHover={hoverLift} whileTap={{ scale: 0.97 }}>
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
                Use Code: LIFETIME50
              </Button>
            </motion.div>
            <motion.button
              type="button"
              onClick={() => setIsVisible(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground p-1"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Dismiss offer"
            >
              <X className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </LandingAnimate>
  );
};

export default CouponBanner;
