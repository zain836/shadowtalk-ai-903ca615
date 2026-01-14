import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useFeatureGating } from '@/hooks/useFeatureGating';

export const AdBanner: React.FC = () => {
  const navigate = useNavigate();
  const { canAccess } = useFeatureGating();
  const [dismissed, setDismissed] = React.useState(false);

  // Don't show ads for Pro+ users
  if (canAccess('noAds') || dismissed) return null;

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-y border-border/50 px-4 py-3">
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Upgrade to Pro</span>
            <span className="text-muted-foreground"> — Remove ads, unlock unlimited messages & advanced features</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={() => navigate('/pricing')} className="text-xs h-7">
            Upgrade Now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
