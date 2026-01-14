import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserPlan = 'free' | 'pro' | 'premium' | 'elite' | 'enterprise';

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
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  // Stripe product IDs mapped to plan names
  const PRODUCT_PLANS: Record<string, UserPlan> = {
    'prod_TZocSSpPddFCH1': 'pro',      // ShadowTalk Pro
    'prod_TbiuwlUUg3F17C': 'premium',  // ShadowTalk Premium
    'prod_TbhEVUPSLMSF53': 'elite',    // ShadowTalk Elite
    'prod_TbivJcOChrAcvq': 'enterprise', // ShadowTalk Enterprise
  };

  // Special email that gets all features free
  const SPECIAL_ACCESS_EMAIL = 'j3451500@gmail.com';

  const checkSubscription = async () => {
    if (!session) return;

    // Check for special access email first
    const userEmail = session.user?.email?.toLowerCase();
    if (userEmail === SPECIAL_ACCESS_EMAIL.toLowerCase()) {
      setSubscribed(true);
      setUserPlan('elite');
      setSubscriptionEnd(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data?.subscribed) {
        setSubscribed(true);
        // Map product ID to plan name
        const productId = data.product_id;
        const plan = productId ? (PRODUCT_PLANS[productId] || 'pro') : 'pro';
        setUserPlan(plan);
        setSubscriptionEnd(data.subscription_end || null);
      } else {
        setSubscribed(false);
        setUserPlan('free');
        setSubscriptionEnd(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
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
