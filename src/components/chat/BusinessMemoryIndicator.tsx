import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessMemory, MEMORY_CATEGORIES } from '@/hooks/useBusinessMemory';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Brain, Settings2, Sparkles, CheckCircle2 } from 'lucide-react';

interface BusinessMemoryIndicatorProps {
  compact?: boolean;
}

export const BusinessMemoryIndicator: React.FC<BusinessMemoryIndicatorProps> = ({ compact = false }) => {
  const navigate = useNavigate();
  const { memories, getActiveMemories, loading } = useBusinessMemory();
  const activeMemories = getActiveMemories();

  if (loading) {
    return null;
  }

  // Compact mode - just an icon with tooltip
  if (compact) {
    if (activeMemories.length === 0) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground"
              onClick={() => navigate('/workspace')}
            >
              <Brain className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Setup AI Memory for your business</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Brain className="h-4 w-4 text-primary" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[8px] text-primary-foreground font-bold">{activeMemories.length}</span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Memory Active</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {activeMemories.length} items
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              The AI is using your business context to personalize responses.
            </div>
            <div className="space-y-1">
              {MEMORY_CATEGORIES.map(cat => {
                const count = activeMemories.filter(m => m.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <div key={cat.id} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>{cat.label}</span>
                    <span className="text-muted-foreground">({count})</span>
                  </div>
                );
              })}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={() => navigate('/workspace')}
            >
              <Settings2 className="h-3 w-3" />
              Manage Memory
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full mode - shown in sidebar or settings
  if (activeMemories.length === 0) {
    return (
      <div 
        className="p-3 rounded-lg border border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => navigate('/workspace')}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Brain className="h-4 w-4" />
          <span className="text-sm">Setup AI Memory</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Teach the AI about your business for personalized responses
        </p>
      </div>
    );
  }

  return (
    <div 
      className="p-3 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
      onClick={() => navigate('/workspace')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Memory Active</span>
        </div>
        <Badge className="text-xs gap-1">
          <Sparkles className="h-2 w-2" />
          {activeMemories.length}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1">
        {MEMORY_CATEGORIES.map(cat => {
          const count = activeMemories.filter(m => m.category === cat.id).length;
          if (count === 0) return null;
          return (
            <Badge key={cat.id} variant="outline" className="text-xs py-0">
              {cat.icon} {count}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default BusinessMemoryIndicator;
