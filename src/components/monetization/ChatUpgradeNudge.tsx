import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import type { NudgeIntensity } from "@/hooks/useSubscriptionNudge";
import { getPlanPsychology, getValueAnchorLine } from "@/lib/conversionPsychology";

interface ChatUpgradeNudgeProps {
  open: boolean;
  intensity: NudgeIntensity;
  headline: string;
  subline: string;
  used: number;
  limit: number;
  recommendedPlan?: "pro" | "premium" | "elite";
  onDismiss?: () => void;
}

export function ChatUpgradeNudge({
  open,
  intensity,
  headline,
  subline,
  used,
  limit,
  recommendedPlan = "premium",
  onDismiss,
}: ChatUpgradeNudgeProps) {
  const navigate = useNavigate();
  const plan = getPlanPsychology(recommendedPlan);
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  if (!open || intensity === "none") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`mx-3 md:mx-6 mb-2 rounded-xl border px-4 py-3 ${
          intensity === "blocking"
            ? "border-destructive/40 bg-destructive/10"
            : intensity === "strong"
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-primary/30 bg-primary/5"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {intensity === "blocking" ? (
              <Crown className="h-5 w-5 text-destructive" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-sm font-semibold">{headline}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{subline}</p>
            </div>
            {limit !== Infinity && (
              <div className="space-y-1">
                <Progress value={pct} className="h-1.5" />
                <p className="text-[10px] font-mono text-muted-foreground">
                  {used}/{limit} free messages today
                </p>
              </div>
            )}
            <p className="text-[10px] text-primary/90 font-medium">
              {plan.name} · ${plan.price}/mo ({plan.daily}/day) — {getValueAnchorLine(recommendedPlan)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 btn-glow"
                onClick={() => navigate(`/founder-access?plan=${recommendedPlan}`)}
              >
                <Crown className="h-3.5 w-3.5" />
                Upgrade to {plan.name}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => navigate("/pricing")}
              >
                Compare plans
              </Button>
            </div>
          </div>
          {intensity !== "blocking" && onDismiss && (
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
