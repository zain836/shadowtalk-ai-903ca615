import { useState } from "react";
import { Bot, ArrowLeft, LogOut, Settings, Download, Lock, MessageSquare, BarChart3, Workflow, Crown, Star, Shield, Zap, Brain, Palette, Users, MoreVertical, Menu, Key, Activity, Share2, FileEdit, PenLine, Search, Image, Play, Eye, Wand2, Sparkles, Globe, Terminal, Mic, WifiOff, Compass, Flag, Calculator } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Heart, Laugh, Briefcase, Lightbulb, Scale, MessageCircle, Target, HelpCircle } from "lucide-react";

import { OfflineModeIndicator } from "./OfflineModeIndicator";
import { ConnectionStatusIndicator } from "./ConnectionStatusIndicator";
import { SovereignModeIndicator } from "./SovereignModeIndicator";
import { ProviderSelector, AIProvider } from "./ProviderSelector";
import { ModelSelector, AIModel } from "./ModelSelector";
import { MemoryPanel } from "./MemoryPanel";
import { CustomInstructions } from "./CustomInstructions";
import { BunkerModeToggle } from "./BunkerModeToggle";
import { SovereignPulse } from "./SovereignPulse";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRobustOfflineAI } from "@/hooks/useRobustOfflineAI";
import { usePrivacyScore } from "@/hooks/usePrivacyScore";

type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive" | "spicy";
type UserPlan = 'free' | 'pro' | 'premium' | 'lifetime' | 'elite' | 'enterprise';

const personalities: { value: Personality; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "friendly", label: "Friendly", icon: <Heart className="h-4 w-4" />, description: "Warm and enthusiastic with a conversational tone" },
  { value: "sarcastic", label: "Sarcastic", icon: <Laugh className="h-4 w-4" />, description: "Witty and playful with dry humor" },
  { value: "professional", label: "Professional", icon: <Briefcase className="h-4 w-4" />, description: "Formal and precise with structured responses" },
  { value: "creative", label: "Creative", icon: <Sparkles className="h-4 w-4" />, description: "Imaginative with vivid metaphors and bold ideas" },
  { value: "meticulous", label: "Meticulous", icon: <Search className="h-4 w-4" />, description: "Detail-oriented auditor ensuring precision" },
  { value: "curious", label: "Curious", icon: <Lightbulb className="h-4 w-4" />, description: "Explores deeply to understand your goals" },
  { value: "diplomatic", label: "Diplomatic", icon: <Scale className="h-4 w-4" />, description: "Balanced mediator for sensitive topics" },
  { value: "witty", label: "Witty", icon: <MessageCircle className="h-4 w-4" />, description: "Intellectually amusing with clever wordplay" },
  { value: "pragmatic", label: "Pragmatic", icon: <Target className="h-4 w-4" />, description: "Practical realist focused on what works" },
  { value: "inquisitive", label: "Inquisitive", icon: <HelpCircle className="h-4 w-4" />, description: "Asks targeted questions for precise answers" },
  { value: "spicy", label: "🌶️ Spicy Mode", icon: <Zap className="h-4 w-4 text-orange-500" />, description: "Grok-style: Bold, edgy, unfiltered takes with real-time awareness" },
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
   onOpenOfflineTools?: () => void; // Optional - offline now handled automatically
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

const getPlanIcon = (plan: UserPlan) => {
  switch (plan) {
    case 'elite':
      return <Crown className="h-3 w-3" />;
    case 'pro':
      return <Star className="h-3 w-3" />;
    default:
      return null;
  }
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
  badge?: string;
  badgeColor?: string;
  shortcut?: string;
}

const MenuItem = ({ icon, label, description, onClick, disabled, locked, badge, badgeColor, shortcut }: MenuItemProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted hover:scale-[1.01] active:bg-muted/80 active:scale-[0.99]'
    }`}
  >
    <div className="shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{label}</span>
        {badge && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${badgeColor || 'bg-primary/20 text-primary'}`}>
            {badge}
          </span>
        )}
      </div>
      {description && (
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{description}</p>
      )}
    </div>
    {shortcut && <span className="text-[10px] text-muted-foreground font-mono opacity-60 shrink-0">{shortcut}</span>}
    {locked && <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
  </button>
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isProOrHigher = userPlan === 'pro' || userPlan === 'elite';
  const isElite = userPlan === 'elite';
  const { isReady: isAIReady } = useRobustOfflineAI();
  const { score: privacyScore } = usePrivacyScore();
  const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;

  const handleMenuAction = (action: () => void) => {
    setDrawerOpen(false);
    action();
  };

  const menuContent = (
    <div className="flex flex-col gap-1">
      {/* Plan Badge for Mobile */}
      <div className="px-4 py-2 mb-2">
        <Badge className={`w-full justify-center gap-1.5 px-3 py-2 rounded-xl border ${getPlanBadgeStyle(userPlan)}`}>
          {getPlanIcon(userPlan)}
          <span className="capitalize">{userPlan}</span>
          <span className="text-muted-foreground">•</span>
          <span>{isProOrHigher ? '∞' : `${dailyChats}/${maxChats}`}</span>
        </Badge>
      </div>

      {/* AI Tools */}
      <div className="px-2">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">AI Tools <span className="opacity-50">(Ctrl+Shift+...)</span></p>
        <MenuItem
          icon={<Search className="h-5 w-5 text-blue-500" />}
          label="Deep Research (R)"
          onClick={() => handleMenuAction(onOpenDeepResearch)}
        />
        <MenuItem
          icon={<Play className="h-5 w-5 text-green-500" />}
          label="Agentic Task Runner (A)"
          onClick={() => handleMenuAction(onOpenAgenticRunner)}
        />
        <MenuItem
          icon={<Eye className="h-5 w-5 text-purple-500" />}
          label="Visual Reasoning (V)"
          onClick={() => handleMenuAction(onOpenVisualReasoning)}
        />
        <MenuItem
          icon={<Wand2 className="h-5 w-5 text-pink-500" />}
          label="Creative Synthesis (C)"
          onClick={() => handleMenuAction(onOpenCreativeSynthesis)}
        />
        <MenuItem
          icon={<Image className="h-5 w-5 text-orange-500" />}
          label="Image Generator (E)"
          onClick={() => handleMenuAction(onOpenImageGenerator)}
        />
        <MenuItem
          icon={<Mic className="h-5 w-5 text-violet-500" />}
          label="ShadowTalk Live (L)"
          onClick={() => handleMenuAction(onOpenShadowTalkLive)}
        />
        <MenuItem
          icon={<Compass className="h-5 w-5 text-sky-500" />}
          label="ShadowBrowser (B)"
          onClick={() => handleMenuAction(onOpenBrowser)}
        />
      </div>

      {/* Canvas */}
      <div className="px-2 mt-2">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium flex items-center gap-1.5">
          <FileEdit className="h-3 w-3" /> Canvas Studio
        </p>
        <MenuItem
          icon={<FileEdit className="h-5 w-5 text-blue-400" />}
          label="New Document"
          description="Rich text editor with AI assist & formatting"
          onClick={() => handleMenuAction(() => onOpenCanvas("document"))}
          shortcut="⇧D"
        />
        <MenuItem
          icon={<PenLine className="h-5 w-5 text-emerald-400" />}
          label="New Code"
          description="Multi-language IDE with live preview & execution"
          onClick={() => handleMenuAction(() => onOpenCanvas("code"))}
          shortcut="⇧K"
          badge="10+ langs"
          badgeColor="bg-emerald-500/20 text-emerald-400"
        />
      </div>

      {/* Pro Features */}
      <div className="px-2 mt-2">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium flex items-center gap-1.5">
          <Crown className="h-3 w-3 text-primary" /> Pro Features
        </p>
        <MenuItem
          icon={<Users className="h-5 w-5 text-violet-400" />}
          label="Collaborative Rooms"
          description="Real-time co-editing, live cursors & @mentions"
          onClick={() => handleMenuAction(() => navigate('/rooms'))}
          disabled={!isProOrHigher}
          locked={!isProOrHigher}
          badge="Live"
          badgeColor="bg-violet-500/20 text-violet-400"
        />
        <MenuItem
          icon={<Workflow className="h-5 w-5 text-amber-400" />}
          label="Script Automation"
          description="Automate AI workflows with custom triggers"
          onClick={() => handleMenuAction(onOpenScriptAutomation)}
          disabled={!isProOrHigher}
          locked={!isProOrHigher}
        />
        <MenuItem
          icon={<Download className="h-5 w-5 text-cyan-400" />}
          label="Export Chat"
          description="Download as PDF, Markdown, or JSON"
          onClick={() => handleMenuAction(onExport)}
          disabled={!isProOrHigher}
          locked={!isProOrHigher}
        />
        <MenuItem
          icon={<Share2 className="h-5 w-5 text-pink-400" />}
          label="Share & Publish"
          description="Share conversations via link or embed"
          onClick={() => handleMenuAction(onExport)}
          disabled={!isProOrHigher}
          locked={!isProOrHigher}
          badge="New"
          badgeColor="bg-pink-500/20 text-pink-400"
        />
      </div>

      {/* Elite Features */}
      <div className="px-2 mt-2">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Elite Features</p>
        <MenuItem
          icon={<Brain className="h-5 w-5" />}
          label="Model Fine-Tuning"
          onClick={() => handleMenuAction(onOpenModelFineTuning)}
          disabled={!isElite}
          locked={!isElite}
        />
        <MenuItem
          icon={<Palette className="h-5 w-5" />}
          label="White-Label Branding"
          onClick={() => handleMenuAction(onOpenWhiteLabelBranding)}
          disabled={!isElite}
          locked={!isElite}
        />
        <MenuItem
          icon={<Shield className="h-5 w-5" />}
          label="Stealth Vault"
          onClick={() => handleMenuAction(onOpenStealthVault)}
          disabled={!isElite}
          locked={!isElite}
        />
        <MenuItem
          icon={<BarChart3 className="h-5 w-5" />}
          label="Analytics"
          onClick={() => handleMenuAction(onOpenAnalytics)}
          disabled={!isElite}
          locked={!isElite}
        />
        <MenuItem
          icon={<Activity className="h-5 w-5" />}
          label="Gemini Key Analytics"
          onClick={() => handleMenuAction(onOpenGeminiAnalytics)}
        />
      </div>

      {/* Account */}
      <div className="px-2 mt-2 border-t border-border pt-2">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Account</p>
        {isProOrHigher && (
          <MenuItem
            icon={<Settings className="h-5 w-5" />}
            label="Manage Subscription"
            onClick={() => handleMenuAction(onManageSubscription)}
          />
        )}
        <MenuItem
          icon={<LogOut className="h-5 w-5" />}
          label="Sign Out"
          onClick={() => handleMenuAction(onSignOut)}
        />
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b border-border/20 bg-background/80 backdrop-blur-xl">
      {/* Left Section */}
      <div className="flex items-center gap-1.5 md:gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl hidden sm:flex">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to home</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
            <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-semibold">ShadowTalk AI</h1>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Personality Selector - Hidden on very small screens */}
        <Select value={personality} onValueChange={(v) => onPersonalityChange(v as Personality)}>
          <SelectTrigger className="w-[90px] sm:w-[120px] md:w-[140px] h-8 md:h-9 text-xs rounded-lg md:rounded-xl border-border/50 hidden xs:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-[280px]">
            {personalities.map(p => (
              <SelectItem key={p.value} value={p.value}>
                <div className="flex items-center gap-2">
                  {p.icon}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{p.description}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Provider Selector - Hidden on mobile */}
        <div className="hidden sm:block">
          <ProviderSelector
            provider={aiProvider}
            onProviderChange={onProviderChange}
          />
        </div>

        {/* Plan Badge - Desktop only */}
        <Badge className={`hidden lg:flex gap-1.5 px-3 py-1 rounded-xl border ${getPlanBadgeStyle(userPlan)}`}>
          {getPlanIcon(userPlan)}
          <span className="capitalize">{userPlan}</span>
          <span className="text-muted-foreground">•</span>
          <span>{isProOrHigher ? '∞' : `${dailyChats}/${maxChats}`}</span>
        </Badge>

        {/* Bunker Mode Toggle - Compact on mobile */}
        <div className="hidden sm:block">
          <BunkerModeToggle />
        </div>

        {/* Sovereign Pulse - Privacy-aware status indicator */}
        <SovereignPulse
          isOffline={isOffline}
          isAIReady={isAIReady}
          privacyScore={privacyScore.overall}
          blockedAttempts={privacyScore.trackersBlocked}
        />


        {/* Connection Status Indicator - Shows online/offline + LLM status */}
        <div className="flex items-center">
          <ConnectionStatusIndicator />
        </div>

        {/* Mobile: Drawer */}
        {isMobile ? (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl">
                <Menu className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="border-b border-border pb-4">
                <DrawerTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Menu
                </DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-auto py-4">
                {menuContent}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          /* Desktop: Dropdown */
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover max-h-[80vh] overflow-y-auto">
              {/* AI Tools */}
              <div className="px-2 py-1.5">
                <span className="text-xs text-muted-foreground font-medium">AI Tools</span>
              </div>
              <DropdownMenuItem onClick={onOpenDeepResearch}>
                <Search className="h-4 w-4 mr-2 text-blue-500" />
                Deep Research
                <span className="ml-auto text-xs text-muted-foreground">⇧R</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenAgenticRunner}>
                <Play className="h-4 w-4 mr-2 text-green-500" />
                Agentic Task Runner
                <span className="ml-auto text-xs text-muted-foreground">⇧A</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenVisualReasoning}>
                <Eye className="h-4 w-4 mr-2 text-purple-500" />
                Visual Reasoning
                <span className="ml-auto text-xs text-muted-foreground">⇧V</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenCreativeSynthesis}>
                <Wand2 className="h-4 w-4 mr-2 text-pink-500" />
                Creative Synthesis
                <span className="ml-auto text-xs text-muted-foreground">⇧C</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenImageGenerator}>
                <Image className="h-4 w-4 mr-2 text-orange-500" />
                Image Generator
                <span className="ml-auto text-xs text-muted-foreground">⇧E</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenShadowTalkLive}>
                <Mic className="h-4 w-4 mr-2 text-violet-500" />
                ShadowTalk Live
                <span className="ml-auto text-xs text-muted-foreground">⇧L</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenOfflineTools}>
                <WifiOff className="h-4 w-4 mr-2 text-emerald-500" />
                Offline Tools
                <span className="ml-auto text-xs text-muted-foreground">⇧O</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenBrowser}>
                <Compass className="h-4 w-4 mr-2 text-sky-500" />
                ShadowBrowser
                <span className="ml-auto text-xs text-muted-foreground">⇧B</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Canvas Studio */}
              <div className="px-2 py-1.5">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <FileEdit className="h-3 w-3" /> Canvas Studio
                </span>
              </div>
              <DropdownMenuItem onClick={() => onOpenCanvas("document")} className="flex-col items-start py-2">
                <div className="flex items-center w-full">
                  <FileEdit className="h-4 w-4 mr-2 text-blue-400" />
                  <span>New Document</span>
                  <span className="ml-auto text-xs text-muted-foreground">⇧D</span>
                </div>
                <span className="text-[10px] text-muted-foreground ml-6">Rich text with AI-powered formatting</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenCanvas("code")} className="flex-col items-start py-2">
                <div className="flex items-center w-full">
                  <PenLine className="h-4 w-4 mr-2 text-emerald-400" />
                  <span>New Code</span>
                  <Badge className="ml-1.5 text-[9px] px-1 py-0 bg-emerald-500/20 text-emerald-400 border-0">10+ langs</Badge>
                  <span className="ml-auto text-xs text-muted-foreground">⇧K</span>
                </div>
                <span className="text-[10px] text-muted-foreground ml-6">Multi-language IDE with live preview</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Pro Features */}
              <div className="px-2 py-1.5">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Crown className="h-3 w-3 text-primary" /> Pro Features
                </span>
              </div>
              <DropdownMenuItem onClick={() => navigate('/rooms')} disabled={!isProOrHigher} className="flex-col items-start py-2">
                <div className="flex items-center w-full">
                  <Users className="h-4 w-4 mr-2 text-violet-400" />
                  <span>Collaborative Rooms</span>
                  <Badge className="ml-1.5 text-[9px] px-1 py-0 bg-violet-500/20 text-violet-400 border-0">Live</Badge>
                  {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                </div>
                <span className="text-[10px] text-muted-foreground ml-6">Real-time co-editing & live cursors</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenScriptAutomation} disabled={!isProOrHigher} className="flex-col items-start py-2">
                <div className="flex items-center w-full">
                  <Workflow className="h-4 w-4 mr-2 text-amber-400" />
                  <span>Script Automation</span>
                  {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                </div>
                <span className="text-[10px] text-muted-foreground ml-6">Automate AI workflows with triggers</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport} disabled={!isProOrHigher} className="flex-col items-start py-2">
                <div className="flex items-center w-full">
                  <Download className="h-4 w-4 mr-2 text-cyan-400" />
                  <span>Export Chat</span>
                  {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                </div>
                <span className="text-[10px] text-muted-foreground ml-6">Download as PDF, MD, or JSON</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport} disabled={!isProOrHigher} className="flex-col items-start py-2">
                <div className="flex items-center w-full">
                  <Share2 className="h-4 w-4 mr-2 text-pink-400" />
                  <span>Share & Publish</span>
                  <Badge className="ml-1.5 text-[9px] px-1 py-0 bg-pink-500/20 text-pink-400 border-0">New</Badge>
                  {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                </div>
                <span className="text-[10px] text-muted-foreground ml-6">Share via link or embed</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Elite Features */}
              <DropdownMenuItem onClick={onOpenModelFineTuning} disabled={!isElite}>
                <Brain className="h-4 w-4 mr-2" />
                Model Fine-Tuning
                {!isElite && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenWhiteLabelBranding} disabled={!isElite}>
                <Palette className="h-4 w-4 mr-2" />
                White-Label Branding
                {!isElite && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenStealthVault} disabled={!isElite}>
                <Shield className="h-4 w-4 mr-2" />
                Stealth Vault
                {!isElite && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenAnalytics} disabled={!isElite}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
                {!isElite && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenGeminiAnalytics}>
                <Activity className="h-4 w-4 mr-2" />
                Gemini Key Analytics
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Account */}
              {isProOrHigher && (
                <DropdownMenuItem onClick={onManageSubscription}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Subscription
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
