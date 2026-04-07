import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Brain, ChevronRight, X, AlertTriangle, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { usePushIntelligence } from "@/hooks/usePushIntelligence";
import { useNavigate } from "react-router-dom";

export const PushIntelligencePanel = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const {
    signals,
    briefing,
    isLoading,
    criticalSignals,
    highSignals,
    fetchBriefing,
    signalCount,
  } = usePushIntelligence({ pollIntervalMs: 5 * 60 * 1000 });

  const handleSignalClick = (action?: string) => {
    if (action) {
      navigate(action);
      setIsOpen(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "high": return <Zap className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "border-destructive/50 bg-destructive/5";
      case "high": return "border-orange-500/50 bg-orange-500/5";
      default: return "border-border";
    }
  };

  const hasUrgent = criticalSignals.length > 0 || highSignals.length > 0;

  return (
    <>
      {/* Floating bell button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-8 w-8 p-0"
        >
          <Bell className={cn("h-4 w-4", hasUrgent && "text-orange-500")} />
          {signalCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] flex items-center justify-center text-white",
              hasUrgent ? "bg-destructive" : "bg-primary"
            )}>
              {signalCount}
            </span>
          )}
        </Button>
      </div>

      {/* Intelligence panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 sm:w-96 bg-background border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Push Intelligence</span>
                <Badge variant="secondary" className="text-[10px] px-1.5">AI</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBriefing(!showBriefing);
                    if (!briefing) fetchBriefing();
                  }}
                  className="h-7 text-xs"
                >
                  Briefing
                </Button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Briefing section */}
            <AnimatePresence>
              {showBriefing && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-primary/5 border-b">
                    {isLoading ? (
                      <p className="text-xs text-muted-foreground animate-pulse">Generating your briefing...</p>
                    ) : (
                      <p className="text-xs leading-relaxed">{briefing || "Click to generate your daily briefing."}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Signals */}
            <ScrollArea className="max-h-72">
              {signals.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  All clear — no alerts right now.
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {signals.map((signal, i) => (
                    <button
                      key={i}
                      onClick={() => handleSignalClick(signal.action)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-lg border transition-colors hover:bg-muted/50 flex items-start gap-2",
                        getPriorityColor(signal.priority)
                      )}
                    >
                      {getPriorityIcon(signal.priority)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{signal.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{signal.body}</p>
                      </div>
                      {signal.action && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
