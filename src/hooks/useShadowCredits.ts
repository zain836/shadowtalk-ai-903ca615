import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalConsumed: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  transactionType: 'purchase' | 'consume' | 'refund' | 'bonus' | 'referral';
  description: string | null;
  sessionType: string | null;
  createdAt: string;
}

// Session costs in credits
export const SESSION_COSTS = {
  deepResearch: 3,      // Premium research session
  strategyReport: 5,    // Full strategy generation
  chatSession: 1,       // Regular chat session
  codeGeneration: 2,    // Code canvas session
  documentGeneration: 2, // Document creation
  voiceSession: 1,      // Voice conversation
} as const;

// Credit packages
export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter Pack', credits: 12, price: 10, bonus: 0, pricePerCredit: 0.83 },
  { id: 'value', name: 'Value Pack', credits: 30, price: 20, bonus: 5, pricePerCredit: 0.57 },
  { id: 'pro', name: 'Pro Pack', credits: 75, price: 40, bonus: 15, pricePerCredit: 0.44 },
  { id: 'enterprise', name: 'Enterprise', credits: 200, price: 100, bonus: 50, pricePerCredit: 0.40 },
];

export function useShadowCredits() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's credit balance
  const fetchBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shadow_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBalance({
          balance: data.balance,
          totalPurchased: data.total_purchased,
          totalConsumed: data.total_consumed,
        });
      } else {
        // Initialize credits for new user with 5 free credits
        const { data: newData, error: insertError } = await supabase
          .from('shadow_credits')
          .insert({ user_id: user.id, balance: 5, total_purchased: 0, total_consumed: 0 })
          .select()
          .single();

        if (insertError) throw insertError;

        setBalance({
          balance: newData.balance,
          totalPurchased: newData.total_purchased,
          totalConsumed: newData.total_consumed,
        });

        // Log the bonus transaction
        await supabase.from('credit_transactions').insert({
          user_id: user.id,
          amount: 5,
          transaction_type: 'bonus',
          description: 'Welcome bonus credits',
        });
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setTransactions(data.map(t => ({
        id: t.id,
        amount: t.amount,
        transactionType: t.transaction_type as CreditTransaction['transactionType'],
        description: t.description,
        sessionType: t.session_type,
        createdAt: t.created_at,
      })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user]);

  // Check if user has enough credits
  const hasCredits = useCallback((sessionType: keyof typeof SESSION_COSTS): boolean => {
    if (!balance) return false;
    return balance.balance >= SESSION_COSTS[sessionType];
  }, [balance]);

  // Consume credits for a session
  const consumeCredits = useCallback(async (
    sessionType: keyof typeof SESSION_COSTS,
    description?: string
  ): Promise<boolean> => {
    if (!user || !balance) return false;

    const cost = SESSION_COSTS[sessionType];
    if (balance.balance < cost) return false;

    try {
      // Update balance
      const { error: updateError } = await supabase
        .from('shadow_credits')
        .update({
          balance: balance.balance - cost,
          total_consumed: balance.totalConsumed + cost,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -cost,
        transaction_type: 'consume',
        session_type: sessionType,
        description: description || `${sessionType} session`,
      });

      // Update local state
      setBalance(prev => prev ? {
        ...prev,
        balance: prev.balance - cost,
        totalConsumed: prev.totalConsumed + cost,
      } : null);

      return true;
    } catch (error) {
      console.error('Error consuming credits:', error);
      return false;
    }
  }, [user, balance]);

  // Add credits (for purchases or bonuses)
  const addCredits = useCallback(async (
    amount: number,
    type: 'purchase' | 'bonus' | 'referral',
    description?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const currentBalance = balance?.balance || 0;
      const currentPurchased = balance?.totalPurchased || 0;

      const { error: updateError } = await supabase
        .from('shadow_credits')
        .upsert({
          user_id: user.id,
          balance: currentBalance + amount,
          total_purchased: type === 'purchase' ? currentPurchased + amount : currentPurchased,
        });

      if (updateError) throw updateError;

      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount,
        transaction_type: type,
        description: description || `${type}: ${amount} credits`,
      });

      await fetchBalance();
      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  }, [user, balance, fetchBalance]);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  return {
    balance,
    transactions,
    isLoading,
    hasCredits,
    consumeCredits,
    addCredits,
    refreshBalance: fetchBalance,
    refreshTransactions: fetchTransactions,
    SESSION_COSTS,
    CREDIT_PACKAGES,
  };
}
