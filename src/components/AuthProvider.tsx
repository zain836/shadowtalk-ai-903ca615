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
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  // Stripe product IDs mapped to plan names
  const PRODUCT_PLANS: Record<string, UserPlan> = {
    'prod_TZocSSpPddFCH1': 'pro',
    'prod_TbiuwlUUg3F17C': 'premium',
    'prod_TbhEVUPSLMSF53': 'elite',
    'prod_TbivJcOChrAcvq': 'enterprise',
  };

  // Special emails that get all features free
  const SPECIAL_ACCESS_EMAILS = ['j3451500@gmail.com', 'almadadali00@gmail.com'];

  const checkSubscription = async () => {
    if (!session?.user) {
      setSubscribed(false);
      setUserPlan('free');
      setSubscriptionEnd(null);
      return;
    }

    // Special access emails get elite for free
    if (SPECIAL_ACCESS_EMAILS.some(e => e.toLowerCase() === session.user.email?.toLowerCase())) {
      setSubscribed(true);
      setUserPlan('elite');
      setSubscriptionEnd(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Subscription check error:', error);
        setSubscribed(false);
        setUserPlan('free');
        return;
      }

      if (data?.subscribed && data?.product_id) {
        const plan = PRODUCT_PLANS[data.product_id] || 'pro';
        setSubscribed(true);
        setUserPlan(plan);
        setSubscriptionEnd(data.subscription_end || null);
      } else {
        setSubscribed(false);
        setUserPlan('free');
        setSubscriptionEnd(null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscribed(false);
      setUserPlan('free');
    }
  };

  const checkAndAssignAdminRole = async () => {
    if (!session) return;
    
    try {
      await supabase.functions.invoke('assign-admin-role');
    } catch (error) {
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
