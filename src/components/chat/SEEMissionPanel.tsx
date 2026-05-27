import { motion } from "framer-motion";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Play,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Mission } from "@/hooks/useMissions";
import type { PendingApproval } from "@/hooks/useMissionExecutor";
import { useNavigate } from "react-router-dom";

interface SEEMissionPanelProps {
  mission: Mission | null;
  isExecuting: boolean;
  pendingApproval: PendingApproval | null;
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onOpenFullControl?: () => void;
  compact?: boolean;
}

export const SEEMissionPanel = ({
  mission,
  isExecuting,
  pendingApproval,
  onApprove,
  onReject,
  onCancel,
  onOpenFullControl,
  compact = false,
}: SEEMissionPanelProps) => {
  const navigate = useNavigate();

  if (!mission) return null;

  const steps = mission.steps || [];
  const completedCount = steps.filter((s) => s.status === "completed").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card/40 to-secondary/5 overflow-hidden",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">S.E.E. Mission</p>
            <p className="text-sm font-medium truncate">{mission.title}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px]",
            mission.status === "running" && "border-blue-500/40 text-blue-400",
            mission.status === "completed" && "border-green-500/40 text-green-400",
            mission.status === "paused" && "border-amber-500/40 text-amber-400",
            mission.status === "failed" && "border-red-500/40 text-red-400"
          )}
        >
          {isExecuting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {mission.status}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{mission.goal}</p>

      <div className="flex items-center gap-2 mb-3">
        <Progress value={mission.progress} className="h-1.5 flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground">{mission.progress}%</span>
      </div>

      {!compact && steps.length > 0 && (
        <ScrollArea className="max-h-32 mb-3">
          <div className="space-y-1.5 pr-2">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 text-[11px] rounded-lg px-2 py-1.5 border border-border/30",
                  step.status === "running" && "bg-blue-500/10 border-blue-500/30",
                  step.status === "completed" && "bg-green-500/5",
                  step.status === "awaiting_approval" && "bg-amber-500/10 border-amber-500/30"
                )}
              >
                {step.status === "completed" && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                {step.status === "running" && <Loader2 className="h-3 w-3 text-blue-400 animate-spin shrink-0" />}
                {step.status === "failed" && <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                {step.status === "pending" && (
                  <span className="w-3 h-3 rounded-full bg-muted shrink-0 text-[8px] flex items-center justify-center">
                    {i + 1}
                  </span>
                )}
                <span className="flex-1 truncate">{step.action}</span>
                {step.tool_name && (
                  <Badge variant="secondary" className="text-[8px] h-4 px-1 shrink-0">
                    {step.tool_name}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {pendingApproval && (
        <div className="mb-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <p className="text-xs font-medium text-amber-200 mb-2 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Approval required: {pendingApproval.step.action}
          </p>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 flex-1" onClick={onApprove}>
              Approve & continue
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={onReject}>
              Skip
            </Button>
          </div>
        </div>
      )}

      {mission.status === "completed" && mission.result && (
        <div className="mb-3 p-2 rounded-lg bg-green-500/5 border border-green-500/20 text-[11px] text-muted-foreground max-h-24 overflow-y-auto">
          {typeof mission.result === "object" && mission.result !== null && "output" in mission.result
            ? String((mission.result as { output?: string }).output).slice(0, 400)
            : "Mission deliverable ready."}
          …
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1"
          onClick={() => (onOpenFullControl ? onOpenFullControl() : navigate("/missioncontrol"))}
        >
          Open Mission Control
          <ChevronRight className="h-3 w-3" />
        </Button>
        {(isExecuting || pendingApproval) && onCancel && (
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        )}
        {steps.some((s) => s.proof?.sources?.length) && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground w-full mt-1">
            <ExternalLink className="h-3 w-3" />
            {completedCount} steps with verified sources
          </div>
        )}
      </div>
    </motion.div>
  );
};
