import { useState } from "react";
import { Calculator, Search, Code2, Globe, MapPin, Calendar, CloudSun, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type PluginType = 'calculator' | 'websearch' | 'code_interpreter' | 'browse' | 'location' | 'calendar' | 'weather' | 'image_gen' | 'research' | 'agent' | 'voice';

interface Plugin {
  id: PluginType;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PluginsManagerProps {
  enabledPlugins: PluginType[];
  onPluginsChange: (plugins: PluginType[]) => void;
}

const availablePlugins: Plugin[] = [
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Perform mathematical calculations',
    icon: <Calculator className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'websearch',
    name: 'Web Search',
    description: 'Search the web for information',
    icon: <Search className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'code_interpreter',
    name: 'Code Interpreter',
    description: 'Execute code and analyze data',
    icon: <Code2 className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'browse',
    name: 'Web Browser',
    description: 'Browse and read web pages',
    icon: <Globe className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'location',
    name: 'Location',
    description: 'Get location-based information',
    icon: <MapPin className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Check dates and schedules',
    icon: <Calendar className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Get current weather information',
    icon: <CloudSun className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'image_gen',
    name: 'Image Generator',
    description: 'Create images from text',
    icon: <Sparkles className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'research',
    name: 'Deep Research',
    description: 'In-depth analysis & reports',
    icon: <Search className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'agent',
    name: 'AI Agent',
    description: 'Autonomous task execution',
    icon: <Globe className="h-4 w-4" />,
    enabled: true,
  },
  {
    id: 'voice',
    name: 'Voice Chat',
    description: 'Live voice conversation',
    icon: <Sparkles className="h-4 w-4" />,
    enabled: true,
  },
];

export const PluginsManager = ({ enabledPlugins, onPluginsChange }: PluginsManagerProps) => {
  // All plugins are now auto-enabled - AI detects and triggers them automatically
  const allEnabled = availablePlugins.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 text-xs text-green-600 dark:text-green-400">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">All Tools</span>
          <Badge variant="secondary" className="text-[10px] px-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
            {allEnabled} Active
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-green-500" />
          <span>AI Auto-Tool Detection</span>
        </DropdownMenuLabel>
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-md mx-2 mb-2">
          All tools are <span className="text-green-600 font-medium">always active</span>. 
          Just ask naturally and I'll use the right tool automatically!
        </div>
        <DropdownMenuSeparator />
        {availablePlugins.map((plugin) => (
          <DropdownMenuItem
            key={plugin.id}
            className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-default"
          >
            <div className="flex items-center gap-2">
              <span className="text-green-500">{plugin.icon}</span>
              <div>
                <div className="font-medium">{plugin.name}</div>
                <div className="text-xs text-muted-foreground">{plugin.description}</div>
              </div>
            </div>
            <Check className="h-4 w-4 text-green-500" />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Function to check if a message should trigger a plugin
export const detectPluginTrigger = (message: string): PluginType | null => {
  const lowerMessage = message.toLowerCase();
  
  // Calculator triggers
  if (/^[\d\s+\-*/().^%]+$/.test(message) || 
      /calculate|compute|solve|what is \d/.test(lowerMessage)) {
    return 'calculator';
  }
  
  // Web search triggers
  if (/search for|look up|find information|what is the latest|news about/.test(lowerMessage)) {
    return 'websearch';
  }
  
  // Code interpreter triggers
  if (/run this code|execute|analyze this data|create a chart/.test(lowerMessage)) {
    return 'code_interpreter';
  }
  
  // Weather triggers
  if (/weather|temperature|forecast|rain|snow/.test(lowerMessage)) {
    return 'weather';
  }
  
  // Location triggers
  if (/near me|nearby|local|directions to/.test(lowerMessage)) {
    return 'location';
  }
  
  return null;
};

// Simple calculator function
export const executeCalculator = (expression: string): string => {
  try {
    // Sanitize and evaluate
    const sanitized = expression.replace(/[^0-9+\-*/().^ ]/g, '');
    // eslint-disable-next-line no-eval
    const result = eval(sanitized);
    return `Result: ${result}`;
  } catch (e) {
    return 'Could not calculate. Please check the expression.';
  }
};
