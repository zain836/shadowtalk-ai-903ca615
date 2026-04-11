import { useState } from "react";
import { Bot, ArrowLeft, LogOut, Settings, Download, Lock, MessageSquare, Crown, Star, Shield, Zap, Brain, MoreVertical, Menu, Search, Image, Play, Eye, Wand2, Globe, Mic, Compass, FileText, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Heart, Laugh, Briefcase, Lightbulb, Scale, MessageCircle, Target, HelpCircle, Sparkles } from "lucide-react";
import { ProviderSelector, AIProvider } from "./ProviderSelector";
import { useIsMobile } from "@/hooks/use-mobile";

type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";
type UserPlan = 'free' | 'pro' | 'premium' | 'lifetime' | 'elite' | 'enterprise';

const personalities: { value: Personality; label: string; icon: React.ReactNode }[] = [
  { value: "friendly", label: "Friendly", icon: <Heart className="h-3.5 w-3.5" /> },
  { value: "professional", label: "Professional", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: "creative", label: "Creative", icon: <Sparkles className="h-3.5 w-3.5" /> },
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
  onOpenAgenticRunner: () => void;
  onOpenVisualReasoning: () => void;
  onOpenCreativeSynthesis: () => void;
  onOpenImageGenerator: () => void;
  onOpenShadowTalkLive: () => void;
  onOpenOfflineTools?: () => void;
  onOpenBrowser: () => void;
  aiProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  maxChats: string;
  dailyChats: number;
}

const getPlanBadgeStyle = (plan: UserPlan) => {
  switch (plan) {
    case 'elite':
      return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30';
    case 'pro':
      return 'bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

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
  onOpenAgenticRunner,
  onOpenVisualReasoning,
  onOpenCreativeSynthesis,
  onOpenImageGenerator,
  onOpenShadowTalkLive,
  onOpenOfflineTools,
  onOpenBrowser,
  aiProvider,
  onProviderChange,
  maxChats,
  dailyChats,
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isProOrHigher = userPlan === 'pro' || userPlan === 'elite';

  return (
    <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b border-border/20 bg-background/80 backdrop-blur-xl">
      {/* Left */}
      <div className="flex items-center gap-1.5 md:gap-2.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-8 w-8 rounded-lg">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Conversations</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8 rounded-lg hidden sm:flex">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold hidden md:inline">ShadowTalk AI</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 md:gap-1.5">
        {/* Personality - compact */}
        <Select value={personality} onValueChange={(v) => onPersonalityChange(v as Personality)}>
          <SelectTrigger className="w-[100px] md:w-[120px] h-8 text-xs rounded-lg border-border/30 hidden xs:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personalities.map(p => (
              <SelectItem key={p.value} value={p.value}>
                <div className="flex items-center gap-1.5">
                  {p.icon}
                  <span>{p.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Provider - desktop */}
        <div className="hidden sm:block">
          <ProviderSelector provider={aiProvider} onProviderChange={onProviderChange} />
        </div>

        {/* Plan badge - desktop */}
        <Badge className={`hidden lg:flex gap-1 px-2.5 py-1 rounded-lg border text-[10px] ${getPlanBadgeStyle(userPlan)}`}>
          {userPlan === 'elite' && <Crown className="h-3 w-3" />}
          {userPlan === 'pro' && <Star className="h-3 w-3" />}
          <span className="capitalize">{userPlan}</span>
        </Badge>

        {/* Tools dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Quick AI Tools */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Zap className="h-4 w-4 text-primary" />
                AI Tools
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={onOpenDeepResearch} className="gap-2">
                    <Search className="h-4 w-4 text-blue-400" /> Deep Research
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenAgenticRunner} className="gap-2">
                    <Play className="h-4 w-4 text-green-400" /> Task Runner
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenVisualReasoning} className="gap-2">
                    <Eye className="h-4 w-4 text-purple-400" /> Visual Reasoning
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenCreativeSynthesis} className="gap-2">
                    <Wand2 className="h-4 w-4 text-pink-400" /> Creative Studio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenImageGenerator} className="gap-2">
                    <Image className="h-4 w-4 text-orange-400" /> Image Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenShadowTalkLive} className="gap-2">
                    <Mic className="h-4 w-4 text-violet-400" /> Voice Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenBrowser} className="gap-2">
                    <Compass className="h-4 w-4 text-cyan-400" /> Browser
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <FileText className="h-4 w-4" />
                Canvas
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onOpenCanvas("document")} className="gap-2">
                    <FileText className="h-4 w-4" /> New Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenCanvas("code")} className="gap-2">
                    <Zap className="h-4 w-4" /> New Code
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onOpenAnalytics} className="gap-2">
              <Settings className="h-4 w-4" /> Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport} disabled={!isProOrHigher} className="gap-2">
              <Download className="h-4 w-4" /> Export Chat
              {!isProOrHigher && <Lock className="h-3 w-3 ml-auto" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {isProOrHigher && (
              <DropdownMenuItem onClick={onManageSubscription} className="gap-2">
                <Settings className="h-4 w-4" /> Subscription
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSignOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
