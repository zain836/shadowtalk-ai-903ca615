import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useFeatureGating } from "@/hooks/useFeatureGating";

interface Ad {
  id: string;
  title: string;
  description: string;
  cta: string;
  link: string;
  image?: string;
  type: 'banner' | 'inline' | 'sponsored';
}

const INTERNAL_ADS: Ad[] = [
  {
    id: "upgrade-pro",
    title: "Unlock Unlimited Power",
    description: "Get 10x more AI queries and remove all ads with Pro",
    cta: "Upgrade Now",
    link: "/pricing",
    type: "banner",
  },
  {
    id: "credits",
    title: "Need More Credits?",
    description: "Buy credit packs and never run out of AI power",
    cta: "Buy Credits",
    link: "/pricing#credits",
    type: "inline",
  },
  {
    id: "referral",
    title: "Earn While You Share",
    description: "Get 20% commission on every referral subscription",
    cta: "Start Earning",
    link: "/profile#referral",
    type: "inline",
  },
  {
    id: "enterprise",
    title: "For Teams & Enterprises",
    description: "Custom solutions, API access, and dedicated support",
    cta: "Contact Sales",
    link: "/contact",
    type: "sponsored",
  },
];

interface AdBannerProps {
  placement: 'header' | 'sidebar' | 'inline' | 'footer';
  className?: string;
}

export function AdBanner({ placement, className = "" }: AdBannerProps) {
  const navigate = useNavigate();
  const { userPlan } = useAuth();
  const { isProOrHigher } = useFeatureGating();
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show ads to paying users
    if (isProOrHigher) return;

    // Rotate ads every 30 seconds
    const showAd = () => {
      const filteredAds = INTERNAL_ADS.filter(ad => {
        if (placement === 'header' || placement === 'footer') return ad.type === 'banner';
        if (placement === 'sidebar') return ad.type === 'sponsored';
        return ad.type === 'inline';
      });
      
      const randomAd = filteredAds[Math.floor(Math.random() * filteredAds.length)];
      setCurrentAd(randomAd);
      setDismissed(false);
    };

    showAd();
    const interval = setInterval(showAd, 30000);
    return () => clearInterval(interval);
  }, [isProOrHigher, placement]);

  // Don't render for paid users or if dismissed
  if (isProOrHigher || dismissed || !currentAd) return null;

  const handleClick = () => {
    if (!currentAd) return;
    if (currentAd.link.startsWith("http")) {
      window.open(currentAd.link, "_blank", "noopener,noreferrer");
      return;
    }
    const [path, hash] = currentAd.link.split("#");
    if (hash) {
      navigate(`${path}#${hash}`);
    } else {
      navigate(path);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={className}
      >
        <Card 
          className="bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-primary/20 overflow-hidden cursor-pointer hover:border-primary/40 transition-colors"
          onClick={handleClick}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                {currentAd.id.includes('upgrade') ? (
                  <Zap className="h-5 w-5 text-primary" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm truncate">{currentAd.title}</h4>
                  <Badge variant="outline" className="text-[10px] shrink-0">Sponsored</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{currentAd.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  size="sm" 
                  variant="default"
                  className="gap-1 text-xs"
                  asChild
                >
                  <a href={currentAd.link}>
                    {currentAd.cta}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleDismiss}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Sponsored content section for between messages
export function SponsoredContent() {
  const { isProOrHigher } = useFeatureGating();
  
  if (isProOrHigher) return null;

  return (
    <div className="py-2 px-4">
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            🚀 Enjoying ShadowTalk? Remove ads and unlock unlimited features!
          </p>
          <Button size="sm" variant="outline" asChild>
            <a href="/pricing">View Plans</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
