import { motion } from "framer-motion";
import ChatbotLogo from "@/components/ChatbotLogo";
import { Lightbulb, Code2, Compass, PenLine } from "lucide-react";

interface GeminiEmptyStateProps {
  userName: string;
  onSelectPrompt: (prompt: string) => void;
}

const quickPrompts = [
  {
    label: "Brainstorm",
    prompt: "Help me brainstorm creative ideas for a product launch",
    icon: Lightbulb,
  },
  {
    label: "Code",
    prompt: "Write a clean TypeScript utility function with tests",
    icon: Code2,
  },
  {
    label: "Plan",
    prompt: "Create a weekend travel itinerary with nature and local food",
    icon: Compass,
  },
  {
    label: "Draft",
    prompt: "Draft a professional email asking for feedback on a new feature",
    icon: PenLine,
  },
];

export const GeminiEmptyState = ({ userName, onSelectPrompt }: GeminiEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center w-full max-w-[720px] mx-auto px-4 gap-8 md:gap-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        <div
          className="absolute inset-0 rounded-full blur-3xl opacity-40"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.35), hsl(var(--secondary) / 0.15), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative flex h-16 w-16 md:h-[72px] md:w-[72px] items-center justify-center rounded-2xl bg-card/40 border border-border/40 shadow-lg ring-1 ring-primary/10">
          <ChatbotLogo size={44} className="drop-shadow-[0_0_12px_hsl(var(--primary)/0.35)]" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl md:text-[2.25rem] font-normal text-foreground tracking-tight leading-snug">
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Hello, {userName}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground/50 font-normal tracking-tight">
          What would you like to explore?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
      >
        {quickPrompts.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelectPrompt(item.prompt)}
              className="group flex flex-col items-start gap-3 p-3.5 rounded-2xl border border-border/30 bg-card/20 hover:bg-card/40 hover:border-primary/20 transition-all duration-300 text-left"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/30 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground">
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};
