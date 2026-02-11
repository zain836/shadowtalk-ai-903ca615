import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Target, ArrowRight } from "lucide-react";
import { CreditTransaction } from "@/hooks/useShadowCredits";
import { useMemo } from "react";

interface CreditEmptyPromptProps {
  transactions: CreditTransaction[];
  onDismiss?: () => void;
}

const MINUTES_PER_CREDIT = 10;

export const CreditEmptyPrompt = ({ transactions, onDismiss }: CreditEmptyPromptProps) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const consumptions = transactions.filter(t => t.transactionType === "consume");
    const totalCreditsUsed = consumptions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const hoursSaved = (totalCreditsUsed * MINUTES_PER_CREDIT) / 60;
    const missionsCompleted = consumptions.length;
    return { hoursSaved, missionsCompleted };
  }, [transactions]);

  // Project forward: 10x more value with a refill
  const projectedHours = Math.round(stats.hoursSaved * 10) || 80;

  return (
    <div className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-lg p-6 space-y-5">
      {/* Stats recap */}
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Your Impact
        </span>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-mono font-bold text-foreground">{stats.missionsCompleted}</p>
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Missions Done</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-2xl font-mono font-bold text-foreground">{stats.hoursSaved.toFixed(1)}</p>
              <p className="text-[10px] font-mono uppercase text-muted-foreground">Hours Saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* The persuasion line */}
      <div className="border-t border-border/30 pt-4">
        <p className="text-sm font-mono text-foreground leading-relaxed">
          You have saved <span className="text-primary font-semibold">{stats.hoursSaved.toFixed(0)} hours</span> of
          work with ShadowTalk. To save another{" "}
          <span className="text-primary font-semibold">{projectedHours} hours</span>, refill your credits here.
        </p>
      </div>

      {/* CTA */}
      <Button
        onClick={() => navigate("/founder-access")}
        className="w-full gap-2 font-mono"
      >
        Refill Credits
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
