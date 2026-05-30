import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Sparkles, Zap } from "lucide-react";
import {
  getPlanPsychology,
  getRiskReversalBullets,
  getSocialProofLine,
  getValueAnchorLine,
  MONTHLY_PLANS,
  RECOMMENDED_MONTHLY_PLAN,
  type MonthlyPlanId,
} from "@/lib/conversionPsychology";
import { usePlatformMetrics } from "@/hooks/usePlatformMetrics";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  requiredPlan?: MonthlyPlanId;
  limitReached?: boolean;
}

function UpgradePromptBody({
  onOpenChange,
  feature = "this feature",
  requiredPlan = "pro",
  limitReached = false,
}: Omit<UpgradePromptProps, "open">) {
  const navigate = useNavigate();
  const { totalUsers, isLoading } = usePlatformMetrics();
  const recommended = RECOMMENDED_MONTHLY_PLAN;
  const highlight = getPlanPsychology(recommended);

  const handleSelect = (planId: MonthlyPlanId) => {
    onOpenChange(false);
    navigate(`/founder-access?plan=${planId}`);
  };

  return (
    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Monthly · Cancel anytime
            </Badge>
          </div>
          <DialogTitle className="text-xl pr-6">
            {limitReached ? "Keep the conversation going" : `Unlock ${feature}`}
          </DialogTitle>
          <DialogDescription>
            {limitReached
              ? "Free tier resets at midnight. Pro and Premium remove daily caps so you never stop mid-flow."
              : `${feature} works best without limits. Pick a monthly plan — most teams start on Premium.`}
          </DialogDescription>
          {!isLoading && (
            <p className="text-xs text-muted-foreground pt-1">{getSocialProofLine(totalUsers)}</p>
          )}
        </DialogHeader>

        <div className="grid gap-3">
          {MONTHLY_PLANS.map((planId) => {
            const plan = getPlanPsychology(planId);
            const isRecommended = planId === recommended;
            const isRequired = planId === requiredPlan || planHierarchy(planId) >= planHierarchy(requiredPlan);

            return (
              <Card
                key={planId}
                className={`cursor-pointer transition-all hover:border-primary/40 ${
                  isRecommended ? "ring-2 ring-primary/50 border-primary/30" : "border-border/50"
                }`}
                onClick={() => handleSelect(planId)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{plan.name}</span>
                        {isRecommended && (
                          <Badge className="text-[10px] h-5">Most chosen</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {getValueAnchorLine(planId)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-bold">${plan.price}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                      <p className="text-[10px] text-primary">{plan.daily}/day</p>
                    </div>
                  </div>
                  <ul className="space-y-1 mb-3">
                    {plan.topFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    className={`w-full gap-1.5 ${isRecommended ? "btn-glow" : ""}`}
                    variant={isRecommended ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(planId);
                    }}
                  >
                    {isRequired ? `Get ${plan.name}` : `Choose ${plan.name}`}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-dashed bg-muted/20">
          <CardContent className="pt-3 pb-3">
            <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Why {highlight.name}? ({highlight.comparison})
            </p>
            <ul className="grid grid-cols-2 gap-1">
              {getRiskReversalBullets().map((b) => (
                <li key={b} className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-success shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
    </DialogContent>
  );
}

export function UpgradePrompt({ open, onOpenChange, ...props }: UpgradePromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <UpgradePromptBody onOpenChange={onOpenChange} {...props} /> : null}
    </Dialog>
  );
}

function planHierarchy(id: MonthlyPlanId): number {
  return { pro: 1, premium: 2, elite: 3 }[id];
}
