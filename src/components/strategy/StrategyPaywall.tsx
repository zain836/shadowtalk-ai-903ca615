import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Crown, Zap, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StrategyPaywallProps {
  monthlyUsage: number;
  hasActiveDayPass: boolean;
}

export const StrategyPaywall = ({ monthlyUsage, hasActiveDayPass }: StrategyPaywallProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto mt-12"
    >
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/5 overflow-hidden">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Free Report Used This Month</CardTitle>
          <p className="text-muted-foreground mt-2">
            You've used your <strong>1 free strategy report</strong> for this month.
            Get unlimited daily access for just <strong>$1/day</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="flex justify-center gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{monthlyUsage}</div>
              <div className="text-xs text-muted-foreground">Reports Used</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-500">$1</div>
              <div className="text-xs text-muted-foreground">Per Day</div>
            </div>
          </div>

          {/* What you get */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              $1/Day Includes:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Unlimited strategy reports for 24 hours",
                "Real-time market intelligence",
                "Professional PDF export",
                "SWOT analysis & financial projections",
                "Daily market monitoring alerts",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={() => navigate('/founder-access')}
            >
              <Crown className="h-5 w-5" />
              Pay $1 — Get 24h Access
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate('/lifetime-deal')}
            >
              <Sparkles className="h-4 w-4" />
              Or Get Lifetime Deal ($99) — Unlimited Forever
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            <Clock className="inline h-3 w-3 mr-1" />
            Your free report resets on the 1st of every month
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
