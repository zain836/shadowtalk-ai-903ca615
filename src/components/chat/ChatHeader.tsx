import { useState } from "react";
import { Bot, ArrowLeft, LogOut, Settings, Download, Lock, Crown, Star, Zap, Menu, Search, Image, Play, Eye, Wand2, Compass, FileText, Mic, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/AuthProvider";
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
import { Heart, Laugh, Briefcase, Lightbulb, Scale, MessageCircle, Target, HelpCircle } from "lucide-react";
import { ProviderSelector, AIProvider } from "./ProviderSelector";

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
  const { user } = useAuth();
  const isProOrHigher = userPlan === 'pro' || userPlan === 'elite';

  // Get user initials for avatar
  const userInitials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "G";

  return (
    <div className="flex items-center justify-between px-4 py-3 md:px-5 border-b border-border/10 bg-background/40 backdrop-blur-xl">
      {/* Left Area: Sidebar Toggle & Model Switched Picker */}
      <div className="flex items-center gap-2 md:gap-3.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleSidebar} 
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <Menu className="h-[21px] w-[21px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Main menu</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')} 
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 hidden sm:flex transition-colors"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>

        {/* Gemini-style Model Selector Dropdown */}
        <div className="flex items-center gap-1.5">
          <ProviderSelector provider={aiProvider} onProviderChange={onProviderChange} />
        </div>
      </div>

      {/* Right Area: Controls, Plan Badges & Unified User Dropdown */}
      <div className="flex items-center gap-2">
        {/* Personality Selector */}
        <Select value={personality} onValueChange={(v) => onPersonalityChange(v as Personality)}>
          <SelectTrigger className="w-[105px] md:w-[125px] h-8.5 text-xs rounded-xl border-border/15 bg-muted/20 hover:bg-muted/30 focus:ring-0 focus:ring-offset-0 hidden xs:flex transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl bg-[#1e1f20]/95 backdrop-blur-2xl border border-border/10">
            {personalities.map(p => (
              <SelectItem key={p.value} value={p.value} className="rounded-lg py-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  {p.icon}
                  <span>{p.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Plan badge */}
        <Badge className={`hidden lg:flex gap-1 px-3 py-1 rounded-xl border text-[10px] font-semibold ${getPlanBadgeStyle(userPlan)}`}>
          {userPlan === 'elite' && <Crown className="h-3 w-3" />}
          {userPlan === 'pro' && <Star className="h-3 w-3" />}
          <span className="capitalize">{userPlan}</span>
        </Badge>

        {/* Dynamic Tools Icon Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
              <MoreVertical className="h-4.5 w-4.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 bg-[#1e1f20]/95 backdrop-blur-2xl border border-border/10 rounded-2xl shadow-2xl">
            {/* Quick AI Tools */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 rounded-xl py-2.5">
                <Zap className="h-4 w-4 text-violet-400" />
                <span>AI Tools</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="p-1.5 bg-[#1e1f20]/95 border border-border/10 rounded-xl shadow-xl">
                  <DropdownMenuItem onClick={onOpenDeepResearch} className="gap-2 rounded-lg py-2">
                    <Search className="h-4 w-4 text-blue-400" /> Deep Research
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenAgenticRunner} className="gap-2 rounded-lg py-2">
                    <Play className="h-4 w-4 text-green-400" /> Task Runner
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenVisualReasoning} className="gap-2 rounded-lg py-2">
                    <Eye className="h-4 w-4 text-purple-400" /> Visual Reasoning
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenCreativeSynthesis} className="gap-2 rounded-lg py-2">
                    <Wand2 className="h-4 w-4 text-pink-400" /> Creative Studio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenImageGenerator} className="gap-2 rounded-lg py-2">
                    <Image className="h-4 w-4 text-orange-400" /> Image Generator
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenShadowTalkLive} className="gap-2 rounded-lg py-2">
                    <Mic className="h-4 w-4 text-violet-400" /> Voice Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenBrowser} className="gap-2 rounded-lg py-2">
                    <Compass className="h-4 w-4 text-cyan-400" /> Browser
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 rounded-xl py-2.5">
                <FileText className="h-4 w-4 text-muted-foreground/60" />
                <span>Canvas</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="p-1.5 bg-[#1e1f20]/95 border border-border/10 rounded-xl shadow-xl">
                  <DropdownMenuItem onClick={() => onOpenCanvas("document")} className="gap-2 rounded-lg py-2">
                    <FileText className="h-4 w-4 text-muted-foreground/60" /> New Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenCanvas("code")} className="gap-2 rounded-lg py-2">
                    <Zap className="h-4 w-4 text-primary" /> New Code
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="bg-border/10 my-1" />

            <DropdownMenuItem onClick={onOpenAnalytics} className="gap-2 rounded-xl py-2.5">
              <Settings className="h-4 w-4 text-muted-foreground/60" /> Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExport} disabled={!isProOrHigher} className="gap-2 rounded-xl py-2.5">
              <Download className="h-4 w-4 text-muted-foreground/60" /> Export Chat
              {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground/45" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border/10 my-1" />

            {isProOrHigher && (
              <DropdownMenuItem onClick={onManageSubscription} className="gap-2 rounded-xl py-2.5">
                <Settings className="h-4 w-4 text-muted-foreground/60" /> Subscription
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSignOut} className="gap-2 rounded-xl py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Far Right: Circular User Avatar */}
        <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-[12.5px] font-bold text-primary-foreground border border-border/10 shadow-md ml-1 select-none shrink-0 cursor-pointer">
          {userInitials}
        </div>
      </div>
    </div>
  );
};
