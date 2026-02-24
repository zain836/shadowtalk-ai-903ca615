import { useState } from "react";
import { Shield, Lock, Wifi, WifiOff, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface PrivacyBadgeProps {
  /** Where data is stored for this feature */
  dataLocation: "device" | "encrypted-server" | "local-ai";
  /** Short label */
  label?: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

const configs = {
  "device": { icon: WifiOff, text: "On-Device Only", color: "text-success", bg: "bg-success/10", border: "border-success/30", tooltip: "This data never leaves your device. Stored in IndexedDB locally." },
  "encrypted-server": { icon: Lock, text: "E2E Encrypted", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", tooltip: "Encrypted on your device before upload. Server only stores ciphertext." },
  "local-ai": { icon: Shield, text: "Local AI", color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/30", tooltip: "Processed entirely on-device using WebLLM. No data sent to servers." },
};

const PrivacyBadge = ({ dataLocation, label, compact = false }: PrivacyBadgeProps) => {
  const config = configs[dataLocation];
  const Icon = config.icon;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 text-[10px] ${config.color} cursor-help`}>
            <Icon className="h-3 w-3" />
            <span>{label || config.text}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{config.tooltip}</p>
          <Link to="/transparency" className="text-xs text-primary underline mt-1 inline-block">
            View full transparency report →
          </Link>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${config.border} ${config.bg} cursor-help transition-colors hover:opacity-80`}>
          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
          <span className={`text-xs font-medium ${config.color}`}>{label || config.text}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">{config.tooltip}</p>
        <Link to="/transparency" className="text-xs text-primary underline mt-1 inline-block">
          View full transparency report →
        </Link>
      </TooltipContent>
    </Tooltip>
  );
};

/** Floating privacy indicator for pages/sections */
export const PrivacyBanner = ({ dataLocation, featureName }: { dataLocation: "device" | "encrypted-server" | "local-ai"; featureName: string }) => {
  const [dismissed, setDismissed] = useState(false);
  const config = configs[dataLocation];
  const Icon = config.icon;

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border ${config.border} ${config.bg} mb-4`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
          <p className="text-xs text-muted-foreground">
            <strong className={config.color}>{featureName}</strong> data is {config.text.toLowerCase()}.{" "}
            <Link to="/transparency" className="text-primary underline">Verify →</Link>
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground text-xs shrink-0">✕</button>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivacyBadge;
