import React from 'react';
import { Loader2, Brain, Cpu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSovereignAI } from '@/hooks/useSovereignAI';

interface OfflineTypingIndicatorProps {
  isTyping: boolean;
  stage?: 'thinking' | 'generating' | 'processing';
  className?: string;
}

export const OfflineTypingIndicator: React.FC<OfflineTypingIndicatorProps> = ({
  isTyping,
  stage = 'thinking',
  className
}) => {
  const { activeModel, mode } = useSovereignAI();

  if (!isTyping) return null;

  const getStageInfo = () => {
    switch (stage) {
      case 'thinking':
        return {
          icon: <Brain className="h-4 w-4" />,
          text: 'Reasoning...',
          subtext: 'Analyzing your request',
        };
      case 'generating':
        return {
          icon: <Sparkles className="h-4 w-4" />,
          text: 'Generating...',
          subtext: 'Writing response',
        };
      case 'processing':
        return {
          icon: <Cpu className="h-4 w-4" />,
          text: 'Processing...',
          subtext: 'Running inference',
        };
      default:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: 'Thinking...',
          subtext: '',
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300",
      className
    )}>
      {/* Avatar with animation */}
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
          <span className="text-primary-foreground animate-pulse">
            {stageInfo.icon}
          </span>
        </div>
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{stageInfo.text}</span>
          {mode === 'stealth' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-medium">
              LOCAL
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{stageInfo.subtext}</span>
          {activeModel && (
            <span className="text-xs text-muted-foreground">
              • {activeModel.name}
            </span>
          )}
        </div>

        {/* Animated dots skeleton */}
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

// Skeleton loader for message responses
interface MessageSkeletonProps {
  lines?: number;
  className?: string;
}

export const MessageSkeleton: React.FC<MessageSkeletonProps> = ({
  lines = 3,
  className
}) => {
  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded bg-muted/50",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
};

// Code block skeleton
export const CodeBlockSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("rounded-lg bg-muted/30 border border-border/50 p-4 animate-pulse", className)}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <div className="w-3 h-3 rounded-full bg-destructive/30" />
        <div className="w-3 h-3 rounded-full bg-amber-500/30" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
        <div className="flex-1" />
        <div className="w-16 h-4 rounded bg-muted/50" />
      </div>
      <div className="space-y-2">
        <div className="w-1/4 h-3 rounded bg-muted/40" />
        <div className="w-3/4 h-3 rounded bg-muted/40" />
        <div className="w-1/2 h-3 rounded bg-muted/40" />
        <div className="w-2/3 h-3 rounded bg-muted/40" />
        <div className="w-1/3 h-3 rounded bg-muted/40" />
      </div>
    </div>
  );
};
