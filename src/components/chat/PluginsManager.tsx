import { useState } from "react";
import { Calculator, Search, Code2, Globe, MapPin, Calendar, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export type PluginType = 'calculator' | 'websearch' | 'code_interpreter' | 'browse' | 'location' | 'calendar' | 'weather';

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
    enabled: false,
  },
  {
    id: 'location',
    name: 'Location',
    description: 'Get location-based information',
    icon: <MapPin className="h-4 w-4" />,
    enabled: false,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Check dates and schedules',
    icon: <Calendar className="h-4 w-4" />,
    enabled: false,
  },
  {
    id: 'weather',
    name: 'Weather',
    description: 'Get current weather information',
    icon: <CloudSun className="h-4 w-4" />,
    enabled: false,
  },
];

export const PluginsManager = ({ enabledPlugins, onPluginsChange }: PluginsManagerProps) => {
  const togglePlugin = (pluginId: PluginType) => {
    if (enabledPlugins.includes(pluginId)) {
      onPluginsChange(enabledPlugins.filter(p => p !== pluginId));
    } else {
      onPluginsChange([...enabledPlugins, pluginId]);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 text-xs">
          <Code2 className="h-4 w-4" />
          <span className="hidden sm:inline">Plugins</span>
          {enabledPlugins.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1">{enabledPlugins.length}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          AI Plugins & Tools
        </div>
        <DropdownMenuSeparator />
        {availablePlugins.map((plugin) => (
          <DropdownMenuItem
            key={plugin.id}
            onClick={() => togglePlugin(plugin.id)}
            className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-primary">{plugin.icon}</span>
              <div>
                <div className="font-medium">{plugin.name}</div>
                <div className="text-xs text-muted-foreground">{plugin.description}</div>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full ${enabledPlugins.includes(plugin.id) ? 'bg-green-500' : 'bg-muted'}`} />
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
