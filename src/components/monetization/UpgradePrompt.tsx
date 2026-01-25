import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Zap, Lock, Check, ArrowRight, Sparkles } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/lib/monetization";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  requiredPlan?: string;
  limitReached?: boolean;
}

export function UpgradePrompt({ 
  open, 
  onOpenChange, 
  feature = "this feature",
  requiredPlan = "Pro",
  limitReached = false
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/founder-access');
  };

  const eliteTier = SUBSCRIPTION_TIERS.find(t => t.id === 'elite');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary/60 flex items-center justify-center">
              {limitReached ? <Zap className="w-5 h-5 text-primary-foreground" /> : <Lock className="w-5 h-5 text-primary-foreground" />}
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {requiredPlan}+ Required
            </Badge>
          </div>
          <DialogTitle className="text-xl">
            {limitReached ? "Daily Limit Reached" : `Unlock ${feature}`}
          </DialogTitle>
          <DialogDescription>
            {limitReached 
              ? "You've used all your free credits for today. Upgrade for unlimited access!"
              : `${feature} is available for ${requiredPlan} subscribers and above.`
            }
          </DialogDescription>
        </DialogHeader>

        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Elite Founding Member</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">$39.99</span>
                <span className="text-xs text-muted-foreground block">one-time</span>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              {eliteTier?.features.slice(0, 5).map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground pl-6">
                +{(eliteTier?.features.length || 0) - 5} more features...
              </div>
            </div>

            <Button 
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80" 
              onClick={handleUpgrade}
            >
              <Sparkles className="w-4 h-4" />
              Claim Founding Member Access
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Limited founding member slots available • Lifetime access
        </p>
      </DialogContent>
    </Dialog>
  );
}
