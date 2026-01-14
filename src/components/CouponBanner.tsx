import { useState } from "react";
import { Percent, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const CouponBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-background/20 rounded-full p-1">
              <Percent className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-semibold">
                🎉 Limited Time: 50% OFF Lifetime Plan!
              </span>
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Ends Dec 31st</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Use Code: LIFETIME50
            </Button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-primary-foreground/80 hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponBanner;
