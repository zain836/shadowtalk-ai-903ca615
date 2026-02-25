import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { INDUSTRIES, type IndustryConfig } from "@/lib/industries";
import { cn } from "@/lib/utils";

interface IndustrySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (industryId: string) => void;
  currentIndustryId?: string;
}

export const IndustrySelector = ({
  isOpen,
  onClose,
  onSelect,
  currentIndustryId,
}: IndustrySelectorProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/30 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Industry Command Center
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select your industry — AI adapts responses, dashboards, and tools to your sector
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INDUSTRIES.map((industry, i) => {
              const Icon = industry.icon;
              const isSelected = industry.id === currentIndustryId;
              const isHovered = industry.id === hoveredId;

              return (
                <motion.button
                  key={industry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onMouseEnter={() => setHoveredId(industry.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => {
                    onSelect(industry.id);
                    onClose();
                  }}
                  className={cn(
                    "relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200",
                    isSelected
                      ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/40 bg-background hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className={cn("p-2 rounded-lg bg-muted/50", industry.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-sm">{industry.name}</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {industry.description}
                  </p>

                  {/* Quick actions preview */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {industry.quickActions.slice(0, 3).map((action) => (
                      <Badge
                        key={action}
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 h-4 font-normal opacity-60"
                      >
                        {action}
                      </Badge>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Footer */}
          {currentIndustryId && (
            <div className="border-t border-border/30 px-6 py-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSelect("");
                  onClose();
                }}
                className="text-xs text-muted-foreground"
              >
                Clear industry selection
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
