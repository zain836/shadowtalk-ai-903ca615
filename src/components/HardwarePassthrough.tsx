import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Zap, Monitor, Settings2, ChevronDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHardwareCapabilities } from "@/hooks/useHardwareCapabilities";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type AccelerationMode = 'auto' | 'webgpu' | 'npu' | 'cpu';

export const HardwarePassthrough = () => {
  const { capabilities } = useHardwareCapabilities();
  const [accelerationMode, setAccelerationMode] = useState<AccelerationMode>(() => {
    return (localStorage.getItem('shadowtalk_acceleration_mode') as AccelerationMode) || 'auto';
  });

  // Load from backend on mount
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_settings')
          .select('setting_value')
          .eq('user_id', user.id)
          .eq('setting_key', 'acceleration_mode')
          .maybeSingle();
        if (data?.setting_value) {
          setAccelerationMode(data.setting_value as AccelerationMode);
        }
      }
    };
    load();
  }, []);

  const handleModeChange = (mode: AccelerationMode) => {
    setAccelerationMode(mode);
    localStorage.setItem('shadowtalk_acceleration_mode', mode);

    // Sync to backend
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('user_settings').upsert({
          user_id: user.id,
          setting_key: 'acceleration_mode',
          setting_value: mode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,setting_key' }).then(() => {});
      }
    });
  };

  const modes: Array<{
    id: AccelerationMode;
    label: string;
    icon: typeof Cpu;
    description: string;
    available: boolean;
    badge?: string;
  }> = [
    {
      id: 'auto',
      label: 'Auto',
      icon: Settings2,
      description: 'Automatically select best available',
      available: true,
    },
    {
      id: 'webgpu',
      label: 'WebGPU',
      icon: Monitor,
      description: capabilities.hasWebGPU
        ? `${capabilities.gpuAdapter || 'GPU'} · ${capabilities.estimatedVRAM}GB VRAM`
        : 'Not available on this device',
      available: capabilities.hasWebGPU,
      badge: capabilities.hasWebGPU ? 'Fast' : undefined,
    },
    {
      id: 'npu',
      label: 'NPU',
      icon: Zap,
      description: capabilities.hasNPU
        ? `${capabilities.npuType || 'Neural Engine'} · Ultra-low latency`
        : 'No NPU detected',
      available: capabilities.hasNPU,
      badge: capabilities.hasNPU ? 'Turbo' : undefined,
    },
    {
      id: 'cpu',
      label: 'CPU (WASM)',
      icon: Cpu,
      description: `${capabilities.logicalCores} cores · ${capabilities.deviceMemory}GB RAM`,
      available: true,
      badge: 'Fallback',
    },
  ];

  const activeMode = modes.find(m => m.id === accelerationMode) || modes[0];
  const ActiveIcon = activeMode.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ActiveIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">{activeMode.label}</span>
          {capabilities.turboAvailable && accelerationMode !== 'cpu' && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-primary/10 text-primary border-0">
              ⚡
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs">
          <Activity className="h-3.5 w-3.5" />
          Hardware Acceleration
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {modes.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <DropdownMenuItem
              key={mode.id}
              disabled={!mode.available}
              className={cn(
                "flex items-start gap-3 py-2.5 cursor-pointer",
                accelerationMode === mode.id && "bg-primary/5"
              )}
              onClick={() => mode.available && handleModeChange(mode.id)}
            >
              <div className={cn(
                "mt-0.5 p-1.5 rounded-md",
                mode.available ? "bg-muted" : "bg-muted/50"
              )}>
                <ModeIcon className={cn(
                  "h-3.5 w-3.5",
                  !mode.available && "opacity-40"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    !mode.available && "text-muted-foreground"
                  )}>
                    {mode.label}
                  </span>
                  {mode.badge && mode.available && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                      {mode.badge}
                    </Badge>
                  )}
                  {accelerationMode === mode.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {mode.description}
                </p>
              </div>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
          Tier: <span className="font-medium capitalize">{capabilities.tier}</span> · Max model: {capabilities.maxModelSize}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
