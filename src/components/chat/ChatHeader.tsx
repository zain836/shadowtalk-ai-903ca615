import { useState } from "react";
import { 
  Bot, ArrowLeft, LogOut, Settings, Download, Lock, Crown, Star, Zap, Menu, 
  Search, Image, Play, Eye, Wand2, Compass, FileText, Mic, AudioLines, MoreVertical,
  LayoutGrid, Sparkles, MessageCircle, Briefcase, Heart, Laugh, Lightbulb,
  Scale, Target, HelpCircle, Share2, Plus, Pin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
import { BunkerModeToggle } from "./BunkerModeToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ProviderSelector, AIProvider } from "./ProviderSelector";
import { motion } from "framer-motion";

type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";
type UserPlan = 'free' | 'pro' | 'premium' | 'lifetime' | 'elite' | 'enterprise';

const personalities: { value: Personality; label: string; icon: React.ReactNode }[] = [
  { value: "friendly", label: "Friendly", icon: <Heart className="h-3.5 w-3.5" /> },
  { value: "professional", label: "Professional", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: "creative", label: "Creative", icon: <Wand2 className="h-3.5 w-3.5" /> },
  { value: "sarcastic", label: "Sarcastic", icon: <Laugh className="h-3.5 w-3.5" /> },
  { value: "meticulous", label: "Meticulous", icon: <Search className="h-3.5 w-3.5" /> },
  { value: "curious", label: "Curious", icon: <Lightbulb className="h-3.5 w-3.5" /> },
  { value: "diplomatic", label: "Diplomatic", icon: <Scale className="h-3.5 w-3.5" /> },
  { value: "witty", label: "Witty", icon: <MessageCircle className="h-3.5 w-3.5" /> },
  { value: "pragmatic", label: "Pragmatic", icon: <Target className="h-3.5 w-3.5" /> },
  { value: "inquisitive", label: "Inquisitive", icon: <HelpCircle className="h-3.5 w-3.5" /> },
  { value: "spicy", label: "🌶️ Spicy", icon: <Zap className="h-3.5 w-3.5 text-orange-500" /> },
];

interface ChatHeaderProps {
  userPlan: UserPlan;
  personality: Personality;
  onPersonalityChange: (personality: Personality) => void;
  onToggleSidebar: () => void;
  onExport: () => void;
  onManageSubscription: () => void;
  onSignOut: () => void;
  onOpenAnalytics: () => void;
  onOpenScriptAutomation: () => void;
  onOpenStealthVault: () => void;
  onOpenAgentWorkflows: () => void;
  onOpenModelFineTuning: () => void;
  onOpenWhiteLabelBranding: () => void;
  onOpenGeminiAnalytics: () => void;
  onOpenCanvas: (type: "document" | "code") => void;
  onOpenDeepResearch: () => void;
  onOpenGoogleIntegration?: () => void;
  onOpenImageGenerator: () => void;
  onOpenShadowTalkLive: () => void;
  onOpenAgenticRunner: () => void;
  onOpenVisualReasoning: () => void;
  onOpenCreativeSynthesis: () => void;
  onOpenOfflineTools?: () => void;
  onOpenBrowser: () => void;
  aiProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  maxChats: string;
  dailyChats: number;
  variant?: "full" | "minimal";
  toolsMenuOpen?: boolean;
  onToolsMenuOpenChange?: (open: boolean) => void;
}

const ToolsHubMenu = ({
  open,
  onOpenChange,
  onOpenDeepResearch,
  onOpenGoogleIntegration,
  onOpenAgenticRunner,
  onOpenVisualReasoning,
  onOpenCreativeSynthesis,
  onOpenShadowTalkLive,
  onOpenBrowser,
  onOpenCanvas,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenDeepResearch: () => void;
  onOpenGoogleIntegration?: () => void;
  onOpenAgenticRunner: () => void;
  onOpenVisualReasoning: () => void;
  onOpenCreativeSynthesis: () => void;
  onOpenShadowTalkLive: () => void;
  onOpenBrowser: () => void;
  onOpenCanvas: (type: "document" | "code") => void;
}) => (
  <DropdownMenu open={open} onOpenChange={onOpenChange}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="sr-only" aria-hidden tabIndex={-1}>
        <LayoutGrid className="h-5 w-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" side="bottom" className="w-72 p-2 bg-[#1e1f20]/98 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl">
      <div className="px-3 py-3 mb-1">
        <h3 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="h-3 w-3" /> Tools
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-1 mb-2">
        <DropdownMenuItem onClick={onOpenDeepResearch} className="flex-col items-start gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer">
          <Search className="h-4 w-4 text-blue-400" />
          <span className="text-[12px] font-semibold">Deep Research</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenGoogleIntegration} className="flex-col items-start gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer">
          <Mail className="h-4 w-4 text-red-400" />
          <span className="text-[12px] font-semibold">Google Workspace</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenAgenticRunner} className="flex-col items-start gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-pointer">
          <Play className="h-4 w-4 text-green-400" />
          <span className="text-[12px] font-semibold">Agentic Runner</span>
        </DropdownMenuItem>
      </div>
      <DropdownMenuSeparator className="bg-white/5 my-2" />
      <div className="space-y-1">
        <DropdownMenuItem onClick={onOpenVisualReasoning} className="gap-3 rounded-xl py-2.5 px-3">
          <Eye className="h-4 w-4 text-purple-400" />
          <span className="text-[13px] font-medium">Visual Reasoning</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenCreativeSynthesis} className="gap-3 rounded-xl py-2.5 px-3">
          <Wand2 className="h-4 w-4 text-pink-400" />
          <span className="text-[13px] font-medium">Creative Studio</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenShadowTalkLive} className="gap-3 rounded-xl py-2.5 px-3">
          <Mic className="h-4 w-4 text-blue-400" />
          <span className="text-[13px] font-medium">ShadowTalk Live</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenBrowser} className="gap-3 rounded-xl py-2.5 px-3">
          <Compass className="h-4 w-4 text-cyan-400" />
          <span className="text-[13px] font-medium">AI Browser</span>
        </DropdownMenuItem>
      </div>
      <DropdownMenuSeparator className="bg-white/5 my-2" />
      <div className="space-y-1">
        <DropdownMenuItem onClick={() => onOpenCanvas("document")} className="gap-3 rounded-xl py-2.5 px-3">
          <FileText className="h-4 w-4 text-amber-400" />
          <span className="text-[13px] font-medium">New Artifact</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onOpenCanvas("code")} className="gap-3 rounded-xl py-2.5 px-3">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-[13px] font-medium">Code Canvas</span>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const ChatHeader = ({
  userPlan,
  personality,
  onPersonalityChange,
  onToggleSidebar,
  onExport,
  onManageSubscription,
  onSignOut,
  onOpenAnalytics,
  onOpenScriptAutomation,
  onOpenStealthVault,
  onOpenAgentWorkflows,
  onOpenModelFineTuning,
  onOpenWhiteLabelBranding,
  onOpenGeminiAnalytics,
  onOpenCanvas,
  onOpenDeepResearch,
  onOpenGoogleIntegration,
  onOpenAgenticRunner,
  onOpenVisualReasoning,
  onOpenCreativeSynthesis,
  onOpenImageGenerator,
  onOpenShadowTalkLive,
  onOpenBrowser,
  aiProvider,
  onProviderChange,
  variant = "full",
  toolsMenuOpen,
  onToolsMenuOpenChange,
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userInitials = user?.email ? user.email.charAt(0).toUpperCase() : "G";
  const showUpgrade = userPlan === "free" || userPlan === "pro";

  if (variant === "minimal") {
    return (
      <>
        <div className="flex items-center justify-between px-4 py-3 md:px-8 bg-transparent relative z-20 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20 md:hidden"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToolsMenuOpenChange?.(true)}
              className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20 md:hidden"
              aria-label="Tools"
            >
              <LayoutGrid className="h-5 w-5 text-primary" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {showUpgrade && (
              <Button
                onClick={() => navigate("/pricing")}
                className="rounded-full h-9 px-4 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
        <ToolsHubMenu
          open={toolsMenuOpen}
          onOpenChange={onToolsMenuOpenChange}
          onOpenDeepResearch={onOpenDeepResearch}
          onOpenGoogleIntegration={onOpenGoogleIntegration}
          onOpenAgenticRunner={onOpenAgenticRunner}
          onOpenVisualReasoning={onOpenVisualReasoning}
          onOpenCreativeSynthesis={onOpenCreativeSynthesis}
          onOpenShadowTalkLive={onOpenShadowTalkLive}
          onOpenBrowser={onOpenBrowser}
          onOpenCanvas={onOpenCanvas}
        />
      </>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 md:px-6 bg-transparent relative z-20">
      {/* Left: Menu & Model */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggleSidebar} 
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <Menu className="h-[22px] w-[22px]" />
        </Button>
        
        <div className="hidden xs:block h-4 w-px bg-white/10 mx-1" />
        
        <ProviderSelector provider={aiProvider} onProviderChange={onProviderChange} />
        <div className="hidden xs:block h-4 w-px bg-white/10 mx-1" />
        <BunkerModeToggle />
      </div>

      {/* Right: Tools & User */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Personality Selector */}
        <Select value={personality} onValueChange={(v) => onPersonalityChange(v as Personality)}>
          <SelectTrigger className="w-[110px] md:w-[130px] h-9 rounded-full border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:ring-0 focus:ring-offset-0 hidden sm:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl bg-[#1e1f20]/95 backdrop-blur-2xl border-white/10 shadow-2xl">
            {personalities.map(p => (
              <SelectItem key={p.value} value={p.value} className="rounded-xl py-2.5 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  {p.icon}
                  <span className="text-[13px] font-medium">{p.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToolsMenuOpenChange?.(true)}
          className="h-10 w-10 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
          aria-label="Tools"
        >
          <LayoutGrid className="h-5 w-5 text-primary" />
        </Button>
        <ToolsHubMenu
          open={toolsMenuOpen}
          onOpenChange={onToolsMenuOpenChange}
          onOpenDeepResearch={onOpenDeepResearch}
          onOpenAgenticRunner={onOpenAgenticRunner}
          onOpenVisualReasoning={onOpenVisualReasoning}
          onOpenCreativeSynthesis={onOpenCreativeSynthesis}
          onOpenShadowTalkLive={onOpenShadowTalkLive}
          onOpenBrowser={onOpenBrowser}
          onOpenCanvas={onOpenCanvas}
        />

        {/* User Profile / Unified Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 blur-sm opacity-0 group-hover:opacity-40 transition-all duration-500" />
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#1e1f20] to-[#2b2c2d] border border-white/10 flex items-center justify-center text-[14px] font-bold text-white shadow-xl">
                {userInitials}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 bg-[#1e1f20]/98 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl">
            <div className="px-4 py-4 mb-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-[14px] font-bold text-white">
                {userInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[14px] font-bold truncate">{user?.email?.split('@')[0]}</span>
                <Badge className="w-fit mt-1 h-5 text-[9px] px-2 bg-blue-500/10 text-blue-400 border-blue-500/20 uppercase tracking-widest font-bold">
                  {userPlan}
                </Badge>
              </div>
            </div>
            
            <DropdownMenuSeparator className="bg-white/5 my-1" />
            
            <div className="space-y-0.5">
              <DropdownMenuItem onClick={onOpenAnalytics} className="gap-3 rounded-xl py-3 px-4">
                <Target className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-[14px] font-medium">Performance Hub</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onManageSubscription} className="gap-3 rounded-xl py-3 px-4">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-[14px] font-medium">Subscription</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenGeminiAnalytics} className="gap-3 rounded-xl py-3 px-4">
                <Settings className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-[14px] font-medium">Neural Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport} className="gap-3 rounded-xl py-3 px-4">
                <Download className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-[14px] font-medium">Export History</span>
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuSeparator className="bg-white/5 my-1" />
            
            <DropdownMenuItem onClick={onSignOut} className="gap-3 rounded-xl py-3 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all">
              <LogOut className="h-4 w-4" />
              <span className="text-[14px] font-bold">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
