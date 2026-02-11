import { useMemo } from "react";
import { Clock, Target, TrendingUp, Zap } from "lucide-react";
import { CreditTransaction } from "@/hooks/useShadowCredits";

interface MissionValueDashboardProps {
  transactions: CreditTransaction[];
  balance: number;
}

const MINUTES_PER_CREDIT = 10;

export const MissionValueDashboard = ({ transactions, balance }: MissionValueDashboardProps) => {
  const stats = useMemo(() => {
    const consumptions = transactions.filter(t => t.transactionType === "consume");
    const totalCreditsUsed = consumptions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalMinutesSaved = totalCreditsUsed * MINUTES_PER_CREDIT;
    const totalHoursSaved = totalMinutesSaved / 60;
    const missionsCompleted = consumptions.length;

    return { totalCreditsUsed, totalHoursSaved, missionsCompleted };
  }, [transactions]);

  return (
    <div className="border border-border/40 bg-card/30 backdrop-blur-sm rounded-lg p-5">
      {/* Header — Bloomberg-style minimal */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Mission Performance
        </span>
        <span className="text-[10px] font-mono text-muted-foreground/60">
          LIVE
        </span>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <MetricCell
          icon={<Target className="h-3.5 w-3.5" />}
          label="Missions"
          value={stats.missionsCompleted.toString()}
        />
        <MetricCell
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Hours Saved"
          value={stats.totalHoursSaved.toFixed(1)}
        />
        <MetricCell
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Credits Left"
          value={balance.toString()}
        />
      </div>

      {/* Value calculation */}
      {stats.totalHoursSaved > 0 && (
        <div className="border-t border-border/30 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-muted-foreground">
              EST. VALUE DELIVERED (@$20/hr)
            </span>
            <span className="text-sm font-mono font-semibold text-primary">
              ${(stats.totalHoursSaved * 20).toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

function MetricCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-mono font-bold text-foreground">{value}</p>
    </div>
  );
}
