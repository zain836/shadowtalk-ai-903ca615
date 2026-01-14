import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Check,
  X,
  Zap,
  Crown,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanTier } from '@/types/database';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface Plan {
  tier: PlanTier;
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  description: string;
  features: PlanFeature[];
  maxMembers: number;
  maxMonthlyMessages: number;
  icon: any;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'month',
    description: 'Perfect for individuals getting started',
    maxMembers: 1,
    maxMonthlyMessages: 100,
    icon: Zap,
    features: [
      { name: '100 messages per month', included: true },
      { name: 'Basic AI models', included: true },
      { name: 'Web access only', included: true },
      { name: 'Community support', included: true },
      { name: 'Team collaboration', included: false },
      { name: 'API access', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 29,
    billingPeriod: 'month',
    description: 'For professionals and power users',
    maxMembers: 5,
    maxMonthlyMessages: 2000,
    icon: TrendingUp,
    popular: true,
    features: [
      { name: '2,000 messages per month', included: true },
      { name: 'Advanced AI models', included: true },
      { name: 'Mobile apps', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Up to 5 team members', included: true },
      { name: 'Basic API access', included: true, limit: '1,000 calls/month' },
      { name: 'Usage analytics', included: true },
      { name: 'Custom integrations', included: false },
    ],
  },
  {
    tier: 'business',
    name: 'Business',
    price: 99,
    billingPeriod: 'month',
    description: 'For growing teams and businesses',
    maxMembers: 25,
    maxMonthlyMessages: 10000,
    icon: Building2,
    features: [
      { name: '10,000 messages per month', included: true },
      { name: 'All AI models', included: true },
      { name: 'Mobile apps', included: true },
      { name: 'Priority support', included: true },
      { name: 'Up to 25 team members', included: true },
      { name: 'Full API access', included: true, limit: '10,000 calls/month' },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SSO (SAML)', included: true },
      { name: 'Dedicated account manager', included: false },
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 499,
    billingPeriod: 'month',
    description: 'For large organizations with custom needs',
    maxMembers: 999,
    maxMonthlyMessages: 999999,
    icon: Crown,
    features: [
      { name: 'Unlimited messages', included: true },
      { name: 'All AI models + custom', included: true },
      { name: 'Mobile apps', included: true },
      { name: '24/7 priority support', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Unlimited API access', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SSO (SAML/LDAP)', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom SLA', included: true },
      { name: 'On-premise deployment', included: true },
    ],
  },
];

export const SubscriptionManager = () => {
  const { currentWorkspace, currentPlan, isOwner, updateWorkspace } = useWorkspace();
  const [usageData, setUsageData] = useState({
    messagesUsed: 0,
    messagesLimit: 0,
    membersCount: 0,
    membersLimit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadUsageData();
    }
  }, [currentWorkspace]);

  const loadUsageData = async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      // Get current month's message count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: usageData, error: usageError } = await supabase
        .from('usage_tracking')
        .select('resource_count')
        .eq('workspace_id', currentWorkspace.id)
        .eq('resource_type', 'message')
        .gte('created_at', startOfMonth.toISOString());

      if (usageError) throw usageError;

      const messagesUsed = usageData?.reduce((sum, u) => sum + u.resource_count, 0) || 0;

      // Get member count
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', currentWorkspace.id);

      if (membersError) throw membersError;

      setUsageData({
        messagesUsed,
        messagesLimit: currentWorkspace.max_monthly_messages,
        membersCount: membersData?.length || 0,
        membersLimit: currentWorkspace.max_members,
      });
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (tier: PlanTier) => {
    if (!currentWorkspace || !isOwner) return;

    setIsUpgrading(true);
    try {
      const plan = PLANS.find(p => p.tier === tier);
      if (!plan) return;

      // In production, this would integrate with Stripe
      // For now, we'll just update the workspace
      const success = await updateWorkspace(currentWorkspace.id, {
        plan_tier: tier,
        max_members: plan.maxMembers,
        max_monthly_messages: plan.maxMonthlyMessages,
      });

      if (success) {
        alert(`Successfully upgraded to ${plan.name} plan!`);
        await loadUsageData();
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const PlanCard = ({ plan }: { plan: Plan }) => {
    const isCurrent = currentPlan === plan.tier;
    const Icon = plan.icon;

    return (
      <Card className={cn(
        'relative',
        plan.popular && 'border-primary shadow-lg',
        isCurrent && 'bg-muted'
      )}>
        {plan.popular && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
            Most Popular
          </Badge>
        )}
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-6 w-6" />
            <CardTitle>{plan.name}</CardTitle>
          </div>
          <CardDescription>{plan.description}</CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold">${plan.price}</span>
            <span className="text-muted-foreground">/{plan.billingPeriod}</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                {feature.included ? (
                  <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <span className={cn(
                  'text-sm',
                  !feature.included && 'text-muted-foreground'
                )}>
                  {feature.name}
                  {feature.limit && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({feature.limit})
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {isCurrent ? (
            <Button className="w-full" disabled>
              Current Plan
            </Button>
          ) : (
            <Button
              className="w-full"
              variant={plan.popular ? 'default' : 'outline'}
              onClick={() => handleUpgrade(plan.tier)}
              disabled={!isOwner || isUpgrading}
            >
              {plan.tier === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading subscription data...</div>;
  }

  const messagesPercentage = (usageData.messagesUsed / usageData.messagesLimit) * 100;
  const membersPercentage = (usageData.membersCount / usageData.membersLimit) * 100;

  return (
    <div className="space-y-8">
      {/* Current Usage */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Subscription</h2>
        <p className="text-muted-foreground mb-6">
          Manage your workspace subscription and usage
        </p>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{usageData.messagesUsed.toLocaleString()} used</span>
                  <span className="text-muted-foreground">
                    {usageData.messagesLimit.toLocaleString()} limit
                  </span>
                </div>
                <Progress value={messagesPercentage} />
                {messagesPercentage > 80 && (
                  <p className="text-xs text-orange-500">
                    You're approaching your message limit. Consider upgrading.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{usageData.membersCount} members</span>
                  <span className="text-muted-foreground">
                    {usageData.membersLimit} limit
                  </span>
                </div>
                <Progress value={membersPercentage} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-2xl font-bold mb-6">Available Plans</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.tier} plan={plan} />
          ))}
        </div>
      </div>

      {/* Enterprise Contact */}
      {currentPlan !== 'enterprise' && (
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <CardHeader>
            <CardTitle>Need a Custom Solution?</CardTitle>
            <CardDescription>
              Contact our sales team for enterprise pricing and custom features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Get dedicated support, custom SLAs, on-premise deployment options, and more.
            </p>
            <Button>Contact Sales</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
