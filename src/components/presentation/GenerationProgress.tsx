import { motion, AnimatePresence } from "framer-motion";
import { Search, ListTree, Palette, Sparkles, Check, Loader2 } from "lucide-react";

export type GenerationPhase = "idle" | "researching" | "structuring" | "designing" | "polishing" | "done";

const PHASES = [
  { key: "researching", label: "Researching Topic", desc: "Gathering data, statistics, and insights from knowledge base", icon: Search },
  { key: "structuring", label: "Building Outline", desc: "Creating narrative arc and selecting optimal slide layouts", icon: ListTree },
  { key: "designing", label: "Generating Content", desc: "Writing data-rich bullets, stats, and speaker notes", icon: Palette },
  { key: "polishing", label: "Final Polish", desc: "Validating content density and adding finishing touches", icon: Sparkles },
] as const;

interface GenerationProgressProps {
  phase: GenerationPhase;
  topic: string;
}

const GenerationProgress = ({ phase, topic }: GenerationProgressProps) => {
  if (phase === "idle" || phase === "done") return null;

  const currentIndex = PHASES.findIndex(p => p.key === phase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          key={phase}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          {(() => {
            const PhaseIcon = PHASES[currentIndex]?.icon || Sparkles;
            return <PhaseIcon className="w-10 h-10 text-primary animate-pulse" />;
          })()}
        </motion.div>
        <h3 className="text-xl font-bold mb-1">{PHASES[currentIndex]?.label}</h3>
        <p className="text-sm text-muted-foreground">{PHASES[currentIndex]?.desc}</p>
      </div>

      <div className="space-y-3">
        {PHASES.map((p, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isPending = i > currentIndex;

          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : isComplete
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-border/50 opacity-40"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isComplete
                  ? "bg-green-500/10 text-green-500"
                  : isCurrent
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {isComplete ? (
                  <Check className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <p.icon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isCurrent ? "text-foreground" : isComplete ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                  {p.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">{p.desc}</p>
              </div>
              {isComplete && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full"
                >
                  Done
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground italic">
          Generating presentation on "<span className="text-foreground font-medium">{topic}</span>"
        </p>
      </div>
    </motion.div>
  );
};

export default GenerationProgress;
