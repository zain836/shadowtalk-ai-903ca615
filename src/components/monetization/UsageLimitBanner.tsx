import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Crown, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { DAILY_LIMITS } from "@/lib/monetization";

interface UsageLimitBannerProps {
  currentUsage: number;
  action: keyof typeof DAILY_LIMITS.free;
  onDismiss?: () => void;
}

export function UsageLimitBanner({ 
  currentUsage, 
  action,
  onDismiss 
}: UsageLimitBannerProps) {
  const navigate = useNavigate();
  const { userPlan } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const plan = userPlan as keyof typeof DAILY_LIMITS;
  const limit = DAILY_LIMITS[plan]?.[action] || DAILY_LIMITS.free[action];
  
  if (limit === Infinity || dismissed) return null;
  
  const percentage = Math.min((currentUsage / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = currentUsage >= limit;

  if (percentage < 50) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const actionLabels: Record<string, string> = {
    messages: 'messages',
    fileUploads: 'file uploads',
    codeGenerations: 'code generations',
    imageGenerations: 'image generations',
    webSearches: 'web searches',
  };

  return (
    <Alert 
      className={`relative ${
        isAtLimit 
          ? 'border-destructive/50 bg-destructive/10' 
          : isNearLimit 
            ? 'border-amber-500/50 bg-amber-500/10' 
            : 'border-primary/50 bg-primary/10'
      }`}
    >
      <div className="flex items-start gap-3">
        {isAtLimit ? (
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        ) : (
          <Zap className="w-5 h-5 text-amber-500 shrink-0" />
        )}
        
        <div className="flex-1 space-y-2">
          <AlertDescription className="text-sm">
            {isAtLimit ? (
              <span className="font-semibold text-destructive">
                Daily limit reached! You've used all {limit} {actionLabels[action]}.
              </span>
            ) : (
              <span>
                You've used <span className="font-semibold">{currentUsage}/{limit}</span> {actionLabels[action]} today.
              </span>
            )}
          </AlertDescription>
          
          <Progress 
            value={percentage} 
            className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}`}
          />
          
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {plan === 'free' ? 'Free Plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}
            </Badge>
            
            <Button 
              size="sm" 
              className="gap-1"
              variant={isAtLimit ? "default" : "outline"}
              onClick={() => navigate('/founder-access')}
            >
              <Crown className="w-3 h-3" />
              Upgrade for Unlimited
            </Button>
          </div>
        </div>
        
        {!isAtLimit && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="shrink-0 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
