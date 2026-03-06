import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logClientError } from '@/lib/logging';

type UserPlan = 'free' | 'pro' | 'premium' | 'lifetime' | 'elite' | 'enterprise';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userPlan: UserPlan;
  subscribed: boolean;
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // PAYMENT SYSTEM DISABLED: All users get elite access by default
  const [userPlan, setUserPlan] = useState<UserPlan>('elite');
  const [subscribed, setSubscribed] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  // Stripe product IDs mapped to plan names (kept in sync with supabase/functions/_shared/plans.ts)
  const PRODUCT_PLANS: Record<string, UserPlan> = {
    'prod_TZocSSpPddFCH1': 'pro',      // ShadowTalk Pro
    'prod_TbiuwlUUg3F17C': 'premium',  // ShadowTalk Premium
    'prod_TbhEVUPSLMSF53': 'elite',    // ShadowTalk Elite
    'prod_TbivJcOChrAcvq': 'enterprise', // ShadowTalk Enterprise
  };

  // Special email that gets all features free
  const SPECIAL_ACCESS_EMAILS = ['j3451500@gmail.com', 'almadadali00@gmail.com'];

  const checkSubscription = async () => {
    if (!session) return;

    // Check for special access email first
    const userEmail = session.user?.email?.toLowerCase();
    if (SPECIAL_ACCESS_EMAILS.some(e => e.toLowerCase() === userEmail)) {
      setSubscribed(true);
      setUserPlan('elite');
      setSubscriptionEnd(null);
      return;
    }

    try {
      // 1) Primary source of truth: LemonSqueezy/webhook-backed subscribers table
      const { data: lemonData, error: lemonError } = await supabase.functions.invoke('check-lemonsqueezy-subscription');

      if (lemonError) {
        logClientError(lemonError, {
          feature: 'billing',
          action: 'check-lemonsqueezy-subscription',
          userId: session.user?.id,
          severity: 'warning',
        });
      }

      if (lemonData?.subscribed) {
        setSubscribed(true);
        setUserPlan((lemonData.plan as UserPlan) || 'pro');
        setSubscriptionEnd(lemonData.subscription_end || null);
        return;
      }

      // 2) Fallback to Stripe subscription lookup
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('stripe-subscription');

      if (stripeError) {
        logClientError(stripeError, {
          feature: 'billing',
          action: 'stripe-subscription',
          userId: session.user?.id,
          severity: 'warning',
        });
        return;
      }

      if (stripeData?.subscribed) {
        setSubscribed(true);
        const productId = stripeData.product_id as string | null | undefined;
        const plan = productId ? (PRODUCT_PLANS[productId] || 'pro') : 'pro';
        setUserPlan(plan);
        setSubscriptionEnd(stripeData.subscription_end || null);
      } else {
        setSubscribed(false);
        setUserPlan('free');
        setSubscriptionEnd(null);
      }
    } catch (error) {
      logClientError(error, {
        feature: 'billing',
        action: 'checkSubscription',
        userId: session.user?.id,
        severity: 'error',
      });
    }
  };

  const checkAndAssignAdminRole = async () => {
    if (!session) return;
    
    try {
      await supabase.functions.invoke('assign-admin-role');
    } catch (error) {
      // Silent fail - not critical
      console.error('Error checking admin role:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkSubscription();
            checkAndAssignAdminRole();
          }, 100);
        } else {
          setUserPlan('free');
          setSubscribed(false);
          setSubscriptionEnd(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          checkSubscription();
          checkAndAssignAdminRole();
        }, 100);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Refresh subscription status periodically
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserPlan('free');
    setSubscribed(false);
    setSubscriptionEnd(null);
  };

  const value = {
    user,
    session,
    loading,
    userPlan,
    subscribed,
    subscriptionEnd,
    signOut,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
