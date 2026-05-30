import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export type PlanTier = 'free' | 'pro' | 'premium' | 'lifetime' | 'elite' | 'enterprise';

export interface FeatureConfig {
  name: string;
  requiredPlan: PlanTier;
  freeLimit?: number;
  description?: string;
}

// ALL features are available on FREE plan (with daily limits).
// Paid plans remove limits + give better models/priority.
export const FEATURES: Record<string, FeatureConfig> = {
  // Core features - FREE for everyone
  basicChat: { name: "AI Chat", requiredPlan: "free" },
  dailyMessages: { name: "Daily Messages", requiredPlan: "free", freeLimit: 50 },
  advancedCodeGeneration: { name: "Code Generation", requiredPlan: "free" },
  chatExport: { name: "Save & Export", requiredPlan: "free" },
  translation100: { name: "Language Translation", requiredPlan: "free" },
  imageGeneration: { name: "Image Generation", requiredPlan: "free", freeLimit: 5 },
  textToSpeech: { name: "Text-to-Speech", requiredPlan: "free" },
  codeCanvas: { name: "Code Canvas", requiredPlan: "free" },
  documentGeneration: { name: "Document Generation", requiredPlan: "free" },
  urmFull: { name: "Universal Regulation Mapping", requiredPlan: "free" },

  // Premium features - also FREE but with limits
  pceEngine: { name: "Proactive Context Engine", requiredPlan: "free" },
  mweExecutor: { name: "Multi-Step Workflow Executor", requiredPlan: "free" },
  collaborativeRooms: { name: "Collaborative Rooms", requiredPlan: "free" },
  lifeEventSuggestions: { name: "Life Event Suggestions", requiredPlan: "free" },
  guidedWalkthroughs: { name: "Guided Walkthroughs", requiredPlan: "free" },
  scriptAutomation: { name: "Script Automation", requiredPlan: "free" },

  // Advanced features - FREE with limits
  offlineMode: { name: "Offline Mode", requiredPlan: "free" },
  stealthMode: { name: "Stealth Mode & Encrypted Vault", requiredPlan: "free" },
  aiAgents: { name: "AI Agents", requiredPlan: "free" },
  analyticsDashboard: { name: "Analytics Dashboard", requiredPlan: "free" },
  betaAccess: { name: "Beta Access", requiredPlan: "free" },
  missions: { name: "S.E.E. Missions", requiredPlan: "free", freeLimit: 3 },

  // Paid-only differentiators (limits/priority, not feature locks)
  unlimitedMessages: { name: "Unlimited Messages", requiredPlan: "pro" },
  noAds: { name: "No Advertisements", requiredPlan: "pro" },
  prioritySupport: { name: "Priority Support", requiredPlan: "pro" },
  customFineTuning: { name: "Custom Model Fine-Tuning", requiredPlan: "elite" },
  modelFineTuning: { name: "Model Fine-Tuning", requiredPlan: "elite" },
  whiteLabel: { name: "White-Label Solutions", requiredPlan: "elite" },
  whiteLabelBranding: { name: "White-Label Branding", requiredPlan: "elite" },
  phoneSupport: { name: "24/7 Phone Support", requiredPlan: "elite" },

  // Enterprise-only
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
  lifetime: 3,
  elite: 3,
  enterprise: 4,
};

// Special access emails that get all features
const SPECIAL_ACCESS_EMAILS = ['j3451500@gmail.com', 'almadadali00@gmail.com'];

export const useFeatureGating = () => {
  const { userPlan, user } = useAuth();
  const { toast } = useToast();

  const hasSpecialAccess = SPECIAL_ACCESS_EMAILS.some(e => e.toLowerCase() === user?.email?.toLowerCase());

  const getEffectivePlanLevel = (): number => {
    if (hasSpecialAccess) return planHierarchy.enterprise;
    return planHierarchy[userPlan] ?? planHierarchy.free;
  };

  const canAccess = (featureKey: string): boolean => {
    if (hasSpecialAccess) return true;
    const feature = FEATURES[featureKey];
    if (!feature) return true;
    return getEffectivePlanLevel() >= planHierarchy[feature.requiredPlan];
  };

  const checkAccess = (featureKey: string): boolean => {
    if (hasSpecialAccess) return true;
    const feature = FEATURES[featureKey];
    if (!feature) return true;
    const hasAccess = canAccess(featureKey);
    if (!hasAccess) {
      const planLabel = feature.requiredPlan.charAt(0).toUpperCase() + feature.requiredPlan.slice(1);
      const monthly =
        feature.requiredPlan === "elite" || feature.requiredPlan === "enterprise"
          ? 20
          : feature.requiredPlan === "premium" || feature.requiredPlan === "lifetime"
            ? 15
            : 5;
      toast({
        title: `Unlock ${feature.name}`,
        description: `${planLabel} from $${monthly}/mo — unlimited use, cancel anytime. Open Pricing to compare plans.`,
        variant: "destructive",
      });
    }
    return hasAccess;
  };

  const getUpgradeMessage = (featureKey: string): string => {
    if (hasSpecialAccess) return "";
    const feature = FEATURES[featureKey];
    if (!feature) return "";
    return `Upgrade to ${feature.requiredPlan.charAt(0).toUpperCase() + feature.requiredPlan.slice(1)} to unlock unlimited ${feature.name}`;
  };

  const getDailyMessageLimit = (): number => {
    if (hasSpecialAccess) return Infinity;
    if (getEffectivePlanLevel() >= planHierarchy.pro) return Infinity;
    return FEATURES.dailyMessages.freeLimit || 50;
  };

  const effectiveLevel = getEffectivePlanLevel();

  return {
    userPlan: (hasSpecialAccess ? 'enterprise' : userPlan) as PlanTier,
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
