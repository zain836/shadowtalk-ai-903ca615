import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export type PlanTier = 'free' | 'pro' | 'premium' | 'elite' | 'enterprise';

export interface FeatureConfig {
  name: string;
  requiredPlan: PlanTier;
  freeLimit?: number;
  description?: string;
}

export const FEATURES: Record<string, FeatureConfig> = {
  // Free features
  basicChat: { name: "Basic Chat", requiredPlan: "free" },
  dailyMessages: { name: "Daily Messages", requiredPlan: "free", freeLimit: 50 },
  
  // Pro features
  unlimitedMessages: { name: "Unlimited Messages", requiredPlan: "pro" },
  advancedCodeGeneration: { name: "Advanced Code Generation", requiredPlan: "pro" },
  chatExport: { name: "Save & Export", requiredPlan: "pro" },
  noAds: { name: "No Advertisements", requiredPlan: "pro" },
  prioritySupport: { name: "Priority Support", requiredPlan: "pro" },
  translation100: { name: "100+ Language Translation", requiredPlan: "pro" },
  urmFull: { name: "Full Universal Regulation Mapping", requiredPlan: "pro" },
  
  // Premium features
  pceEngine: { name: "Proactive Context Engine (PCE)", requiredPlan: "premium" },
  mweExecutor: { name: "Multi-Step Workflow Executor (MWE)", requiredPlan: "premium" },
  documentGeneration: { name: "Document Generation", requiredPlan: "premium" },
  lifeEventSuggestions: { name: "Life Event Proactive Suggestions", requiredPlan: "premium" },
  guidedWalkthroughs: { name: "Guided Application Walkthroughs", requiredPlan: "premium" },
  scriptAutomation: { name: "Script Automation Engine", requiredPlan: "premium" },
  textToSpeech: { name: "Text-to-Speech", requiredPlan: "premium" },
  imageGeneration: { name: "Image Generation", requiredPlan: "premium" },
  codeCanvas: { name: "Code Canvas", requiredPlan: "premium" },
  collaborativeRooms: { name: "Collaborative Rooms", requiredPlan: "premium" },

  // Elite features  
  offlineMode: { name: "Offline Mode", requiredPlan: "elite" },
  stealthMode: { name: "Stealth Mode & Encrypted Vault", requiredPlan: "elite" },
  aiAgents: { name: "AI Agents & Workflow Automation", requiredPlan: "elite" },
  customFineTuning: { name: "Custom Model Fine-Tuning", requiredPlan: "elite" },
  modelFineTuning: { name: "Model Fine-Tuning", requiredPlan: "elite" },
  whiteLabel: { name: "White-Label Solutions", requiredPlan: "elite" },
  whiteLabelBranding: { name: "White-Label Branding", requiredPlan: "elite" },
  analyticsDashboard: { name: "Advanced Analytics Dashboard", requiredPlan: "elite" },
  betaAccess: { name: "Early Beta Access", requiredPlan: "elite" },
  phoneSupport: { name: "24/7 Phone Support", requiredPlan: "elite" },
  
  // Enterprise features
  apiAccess: { name: "API Access", requiredPlan: "enterprise" },
  customKnowledgeBase: { name: "Custom Knowledge Base", requiredPlan: "enterprise" },
  teamManagement: { name: "Team Management & SSO", requiredPlan: "enterprise" },
  dedicatedSupport: { name: "Dedicated Account Manager", requiredPlan: "enterprise" },
  slaGuarantee: { name: "SLA Guarantees", requiredPlan: "enterprise" },
  complianceModules: { name: "Custom Compliance Modules", requiredPlan: "enterprise" },
};

const planHierarchy: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  premium: 2,
  elite: 3,
  enterprise: 4,
};

// Special access email that gets all features
const SPECIAL_ACCESS_EMAIL = 'j3451500@gmail.com';

export const useFeatureGating = () => {
  const { userPlan, user } = useAuth();
  const { toast } = useToast();

  // Check if user has special access
  const hasSpecialAccess = user?.email?.toLowerCase() === SPECIAL_ACCESS_EMAIL.toLowerCase();

  // Get effective plan level (handle the type correctly)
  const getEffectivePlanLevel = (): number => {
    if (hasSpecialAccess) return planHierarchy.enterprise;
    return planHierarchy[userPlan as PlanTier] ?? 0;
  };

  const canAccess = (featureKey: string): boolean => {
    // Special access email gets all features
    if (hasSpecialAccess) return true;
    
    const feature = FEATURES[featureKey];
    if (!feature) return true;
    
    return getEffectivePlanLevel() >= planHierarchy[feature.requiredPlan];
  };

  const checkAccess = (featureKey: string): boolean => {
    // Special access email gets all features
    if (hasSpecialAccess) return true;
    
    const feature = FEATURES[featureKey];
    if (!feature) return true;
    
    const hasAccess = canAccess(featureKey);
    
    if (!hasAccess) {
      toast({
        title: `${feature.requiredPlan.charAt(0).toUpperCase() + feature.requiredPlan.slice(1)} Feature`,
        description: `${feature.name} is available for ${feature.requiredPlan.charAt(0).toUpperCase() + feature.requiredPlan.slice(1)} subscribers. Upgrade to unlock!`,
        variant: "destructive",
      });
    }
    
    return hasAccess;
  };

  const getUpgradeMessage = (featureKey: string): string => {
    if (hasSpecialAccess) return "";
    const feature = FEATURES[featureKey];
    if (!feature) return "";
    return `Upgrade to ${feature.requiredPlan.charAt(0).toUpperCase() + feature.requiredPlan.slice(1)} to unlock ${feature.name}`;
  };

  const getDailyMessageLimit = (): number => {
    if (hasSpecialAccess) return Infinity;
    if (getEffectivePlanLevel() >= planHierarchy.pro) return Infinity;
    return FEATURES.dailyMessages.freeLimit || 50;
  };

  const effectivePlan = hasSpecialAccess ? 'enterprise' : userPlan;
  const effectiveLevel = getEffectivePlanLevel();

  return {
    userPlan: effectivePlan as PlanTier,
    canAccess,
    checkAccess,
    getUpgradeMessage,
    getDailyMessageLimit,
    isProOrHigher: effectiveLevel >= planHierarchy.pro,
    isPremiumOrHigher: effectiveLevel >= planHierarchy.premium,
    isElite: effectiveLevel >= planHierarchy.elite,
    isEnterprise: effectiveLevel >= planHierarchy.enterprise,
    hasSpecialAccess,
  };
};