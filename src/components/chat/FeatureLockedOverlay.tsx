import React from 'react';
import { Lock, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlanTier } from '@/hooks/useFeatureGating';

interface FeatureLockedOverlayProps {
  featureName: string;
  requiredPlan: PlanTier;
  children?: React.ReactNode;
  compact?: boolean;
}

export const FeatureLockedOverlay: React.FC<FeatureLockedOverlayProps> = ({
  featureName,
  requiredPlan,
  children,
  compact = false,
}) => {
  const navigate = useNavigate();
  
  const PlanIcon = requiredPlan === 'elite' ? Crown : Star;
  const planColor = requiredPlan === 'elite' ? 'text-amber-500' : 'text-primary';
  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  if (compact) {
    return (
      <div className="relative group">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4" />
            <span>{planLabel} Only</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-border/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-muted/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
        <div className={`p-3 rounded-full bg-muted mb-4 ${planColor}`}>
          <PlanIcon className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{featureName}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          This feature is available for {planLabel} subscribers.
        </p>
        <Button onClick={() => navigate('/pricing')} className="gap-2">
          <Lock className="h-4 w-4" />
          Upgrade to {planLabel}
        </Button>
      </div>
      <div className="opacity-20 pointer-events-none">
        {children}
      </div>
    </div>
  );
};
