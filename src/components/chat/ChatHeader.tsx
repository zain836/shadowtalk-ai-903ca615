import { useState } from "react";
import { Bot, ArrowLeft, LogOut, Settings, Download, Lock, MessageSquare, BarChart3, Workflow, Crown, Star, Shield, Zap, Brain, Palette, Users, MoreVertical, Menu, Key, Activity, Share2, FileEdit, PenLine, Search, Image, Play, Eye, Wand2, Sparkles } from "lucide-react";
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
import { ProviderSelector, AIProvider } from "./ProviderSelector";
import { ModelSelector, AIModel } from "./ModelSelector";
import { MemoryPanel } from "./MemoryPanel";
import { CustomInstructions } from "./CustomInstructions";
import { useIsMobile } from "@/hooks/use-mobile";

type Personality = "friendly" | "sarcastic" | "professional" | "creative" | "meticulous" | "curious" | "diplomatic" | "witty" | "pragmatic" | "inquisitive";
type UserPlan = 'free' | 'pro' | 'premium' | 'elite' | 'enterprise';

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
  onOpenImageEditor: () => void;
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
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
}

const MenuItem = ({ icon, label, onClick, disabled, locked }: MenuItemProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-colors ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted active:bg-muted/80'
    }`}
  >
    {icon}
    <span className="flex-1">{label}</span>
    {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
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
  onOpenImageEditor,
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
          label="Image Editor (E)"
          onClick={() => handleMenuAction(onOpenImageEditor)}
        />
      </div>

      {/* Canvas */}
      <div className="px-2 mt-2">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Canvas</p>
        <MenuItem
          icon={<FileEdit className="h-5 w-5" />}
          label="New Document (D)"
          onClick={() => handleMenuAction(() => onOpenCanvas("document"))}
        />
        <MenuItem
          icon={<PenLine className="h-5 w-5" />}
          label="New Code (K)"
          onClick={() => handleMenuAction(() => onOpenCanvas("code"))}
        />
      </div>

      {/* Pro Features */}
      <div className="px-2 mt-2">
        <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Pro Features</p>
        <MenuItem
          icon={<Users className="h-5 w-5" />}
          label="Collaborative Rooms"
          onClick={() => handleMenuAction(() => navigate('/rooms'))}
          disabled={!isProOrHigher}
          locked={!isProOrHigher}
        />
        <MenuItem
          icon={<Workflow className="h-5 w-5" />}
          label="Script Automation"
          onClick={() => handleMenuAction(onOpenScriptAutomation)}
          disabled={!isProOrHigher}
          locked={!isProOrHigher}
        />
        <MenuItem
          icon={<Download className="h-5 w-5" />}
          label="Export Chat"
          onClick={() => handleMenuAction(onExport)}
          disabled={!isProOrHigher}
          locked={!isProOrHigher}
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
          icon={<Zap className="h-5 w-5" />}
          label="AI Agent Workflows"
          onClick={() => handleMenuAction(onOpenAgentWorkflows)}
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
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-9 w-9 rounded-xl">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to home</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold">ShadowTalk AI</h1>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Personality Selector - Compact on mobile */}
        <Select value={personality} onValueChange={(v) => onPersonalityChange(v as Personality)}>
          <SelectTrigger className="w-[120px] sm:w-[140px] h-9 text-xs rounded-xl border-border/50">
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

        {/* Provider Selector */}
        <ProviderSelector
          provider={aiProvider}
          onProviderChange={onProviderChange}
        />

        {/* Plan Badge - Desktop only */}
        <Badge className={`hidden md:flex gap-1.5 px-3 py-1 rounded-xl border ${getPlanBadgeStyle(userPlan)}`}>
          {getPlanIcon(userPlan)}
          <span className="capitalize">{userPlan}</span>
          <span className="text-muted-foreground">•</span>
          <span>{isProOrHigher ? '∞' : `${dailyChats}/${maxChats}`}</span>
        </Badge>

        {/* Offline Mode Indicator */}
        <OfflineModeIndicator />

        {/* Mobile: Drawer */}
        {isMobile ? (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
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
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
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
              <DropdownMenuItem onClick={onOpenImageEditor}>
                <Image className="h-4 w-4 mr-2 text-orange-500" />
                Image Editor
                <span className="ml-auto text-xs text-muted-foreground">⇧E</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Canvas */}
              <div className="px-2 py-1.5">
                <span className="text-xs text-muted-foreground font-medium">Canvas</span>
              </div>
              <DropdownMenuItem onClick={() => onOpenCanvas("document")}>
                <FileEdit className="h-4 w-4 mr-2" />
                New Document
                <span className="ml-auto text-xs text-muted-foreground">⇧D</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenCanvas("code")}>
                <PenLine className="h-4 w-4 mr-2" />
                New Code
                <span className="ml-auto text-xs text-muted-foreground">⇧K</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Pro Features */}
              <div className="px-2 py-1.5">
                <span className="text-xs text-muted-foreground font-medium">Pro Features</span>
              </div>
              <DropdownMenuItem onClick={() => navigate('/rooms')} disabled={!isProOrHigher}>
                <Users className="h-4 w-4 mr-2" />
                Collaborative Rooms
                {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenScriptAutomation} disabled={!isProOrHigher}>
                <Workflow className="h-4 w-4 mr-2" />
                Script Automation
                {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport} disabled={!isProOrHigher}>
                <Download className="h-4 w-4 mr-2" />
                Export Chat
                {!isProOrHigher && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
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
              <DropdownMenuItem onClick={onOpenAgentWorkflows} disabled={!isElite}>
                <Zap className="h-4 w-4 mr-2" />
                AI Agent Workflows
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
