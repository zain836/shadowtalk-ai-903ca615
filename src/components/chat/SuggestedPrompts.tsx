import { Code, Lightbulb, Compass, Pen, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  personality: string;
}

const customPrompts = [
  {
    label: "Brainstorm ideas",
    prompt: "Help brainstorm a list of creative team bonding activities",
    description: "for a remote engineering team",
    icon: Lightbulb,
  },
  {
    label: "Write & format code",
    prompt: "Write a clean JavaScript function to format date strings",
    description: "using standard locales",
    icon: Code,
  },
  {
    label: "Plan a trip",
    prompt: "Create a detailed travel itinerary for a 3-day weekend trip",
    description: "exploring nature and local dining",
    icon: Compass,
  },
  {
    label: "Draft communications",
    prompt: "Draft a professional email requesting feedback on a new feature",
    description: "to send to our beta users",
    icon: Pen,
  },
];

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  const { user } = useAuth();
  
  // Extract user's name or fallback
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Friend";
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  return (
    <div className="w-full flex flex-col items-stretch px-4 max-w-4xl mx-auto select-none mt-10 md:mt-16">
      {/* Gemini-style Greeting */}
      <div className="mb-10 md:mb-14 text-left px-1">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight pb-1">
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Hello, {capitalizedName}
          </span>
        </h1>
        <p className="text-3xl md:text-4xl font-normal text-muted-foreground/40 mt-2 tracking-tight">
          How can I help you today?
        </p>
      </div>

      {/* Suggestion Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {customPrompts.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.prompt}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onSelect(item.prompt)}
              className="group flex flex-col justify-between items-stretch p-5 rounded-2xl border border-border/10 bg-card/25 hover:bg-card/50 hover:border-border/30 cursor-pointer transition-all duration-300 text-left h-44 hover:shadow-lg hover:shadow-black/5"
            >
              <div className="space-y-1">
                <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors block">
                  {item.prompt}
                </span>
                <span className="text-[11px] text-muted-foreground/45 group-hover:text-muted-foreground/60 transition-colors block leading-normal">
                  {item.description}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-background/55 group-hover:bg-primary/5 flex items-center justify-center border border-border/10 text-muted-foreground/50 group-hover:text-primary transition-all duration-300 self-end">
                <Icon className="w-4 h-4" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Subtle keyboard shortcut hint */}
      <div className="mt-12 flex items-center gap-3 text-[10px] text-muted-foreground/20 font-mono justify-center sm:justify-start px-1">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/5 bg-muted/5">⌘K</kbd>
          AI Tools
        </span>
        <span className="opacity-20">·</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-border/5 bg-muted/5">⌘⇧R</kbd>
          Deep Research
        </span>
      </div>
    </div>
  );
};
