import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThinkingModeProps {
  isThinking: boolean;
  thinkingContent: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const ThinkingMode = ({ 
  isThinking, 
  thinkingContent, 
  isExpanded, 
  onToggleExpand 
}: ThinkingModeProps) => {
  if (!thinkingContent && !isThinking) return null;

  return (
    <div className="mb-3">
      <button
        onClick={onToggleExpand}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all w-full",
          "bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15",
          isThinking && "animate-pulse"
        )}
      >
        {isThinking ? (
          <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
        ) : (
          <Brain className="h-4 w-4 text-violet-500" />
        )}
        <span className="text-violet-600 dark:text-violet-400 font-medium">
          {isThinking ? "Thinking..." : "View reasoning process"}
        </span>
        <span className="flex-1" />
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-violet-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-violet-500" />
        )}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border/50 text-sm">
              <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {thinkingContent || "Processing..."}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Parsing utility for thinking content
export const parseThinkingResponse = (content: string): { thinking: string; response: string } => {
  // Look for <thinking> tags
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
  
  if (thinkingMatch) {
    const thinking = thinkingMatch[1].trim();
    const response = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    return { thinking, response };
  }
  
  // Look for [THINKING] markers
  const altMatch = content.match(/\[THINKING\]([\s\S]*?)\[\/THINKING\]/);
  if (altMatch) {
    const thinking = altMatch[1].trim();
    const response = content.replace(/\[THINKING\][\s\S]*?\[\/THINKING\]/, '').trim();
    return { thinking, response };
  }
  
  return { thinking: '', response: content };
};
