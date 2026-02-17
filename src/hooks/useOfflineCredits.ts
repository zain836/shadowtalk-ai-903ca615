import { useState, useCallback, useEffect } from 'react';
import { openDB } from 'idb';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface CreditState {
  balance: number;
  totalConsumed: number;
  pendingSyncCredits: number;
  isLoaded: boolean;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: 'consume' | 'purchase' | 'bonus';
  feature: string;
  timestamp: number;
  synced: boolean;
}

// Feature costs in credits
export const FEATURE_COSTS: Record<string, number> = {
  chat: 0,             // Free while offline
  deep_research: 0,    // Uses local data = free
  strategy: 0,         // Local processing = free
  code_execution: 0,   // Local sandbox = free
  online_sync: 1,      // Pay when syncing to cloud
  cloud_ai: 2,         // Using cloud AI models
  voice_tts: 1,        // Text-to-speech via cloud
  image_generation: 3, // Cloud image generation
};

const DB_NAME = 'shadowtalk-credits';
const CREDITS_STORE = 'credits';
const TRANSACTIONS_STORE = 'transactions';

export const useOfflineCredits = () => {
  const { user } = useAuth();
  const [state, setState] = useState<CreditState>({
    balance: 0,
    totalConsumed: 0,
    pendingSyncCredits: 0,
    isLoaded: false,
  });

  const getDB = useCallback(async () => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CREDITS_STORE)) {
          db.createObjectStore(CREDITS_STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(TRANSACTIONS_STORE)) {
          const store = db.createObjectStore(TRANSACTIONS_STORE, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('synced', 'synced');
        }
      },
    });
  }, []);

  // Load credits from local storage + Supabase
  useEffect(() => {
    const loadCredits = async () => {
      try {
        const db = await getDB();

        // Load local balance
        const localBalance = await db.get(CREDITS_STORE, 'balance');

        if (user && navigator.onLine) {
          // Sync from server
          const { data } = await supabase
            .from('shadow_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (data) {
            const balance = data.balance;
            await db.put(CREDITS_STORE, { key: 'balance', value: balance });
            await db.put(CREDITS_STORE, { key: 'total_consumed', value: data.total_consumed });

            setState({
              balance,
              totalConsumed: data.total_consumed,
              pendingSyncCredits: 0,
              isLoaded: true,
            });
            return;
          }
        }

        // Fallback to local
        setState({
          balance: localBalance?.value || 10, // Default 10 free credits
          totalConsumed: 0,
          pendingSyncCredits: 0,
          isLoaded: true,
        });
      } catch (e) {
        console.error('[OfflineCredits] Load failed:', e);
        setState(prev => ({ ...prev, isLoaded: true, balance: 10 }));
      }
    };

    loadCredits();
  }, [user, getDB]);

  // Consume credits for a feature
  const consumeCredits = useCallback(async (
    feature: string,
    customAmount?: number
  ): Promise<boolean> => {
    const cost = customAmount ?? FEATURE_COSTS[feature] ?? 1;

    // Free features don't need credits
    if (cost === 0) return true;

    if (state.balance < cost) {
      return false; // Insufficient credits
    }

    const db = await getDB();
    const newBalance = state.balance - cost;

    // Update local balance
    await db.put(CREDITS_STORE, { key: 'balance', value: newBalance });

    // Record transaction
    const transaction: CreditTransaction = {
      id: crypto.randomUUID(),
      amount: -cost,
      type: 'consume',
      feature,
      timestamp: Date.now(),
      synced: false,
    };
    await db.put(TRANSACTIONS_STORE, transaction);

    setState(prev => ({
      ...prev,
      balance: newBalance,
      totalConsumed: prev.totalConsumed + cost,
      pendingSyncCredits: prev.pendingSyncCredits + cost,
    }));

    return true;
  }, [state.balance, getDB]);

  // Add credits (purchase, bonus, etc.)
  const addCredits = useCallback(async (
    amount: number,
    type: 'purchase' | 'bonus' = 'purchase'
  ) => {
    const db = await getDB();
    const newBalance = state.balance + amount;

    await db.put(CREDITS_STORE, { key: 'balance', value: newBalance });

    const transaction: CreditTransaction = {
      id: crypto.randomUUID(),
      amount,
      type,
      feature: type,
      timestamp: Date.now(),
      synced: false,
    };
    await db.put(TRANSACTIONS_STORE, transaction);

    setState(prev => ({ ...prev, balance: newBalance }));

    // Sync to server if online
    if (user && navigator.onLine) {
      await supabase
        .from('shadow_credits')
        .upsert({
          user_id: user.id,
          balance: newBalance,
          total_purchased: amount,
        }, { onConflict: 'user_id' });
    }
  }, [state.balance, user, getDB]);

  // Sync consumed credits to server
  const syncCredits = useCallback(async (): Promise<number> => {
    if (!user || !navigator.onLine) return 0;

    const db = await getDB();
    const tx = db.transaction(TRANSACTIONS_STORE, 'readwrite');
    const store = tx.objectStore(TRANSACTIONS_STORE);
    const unsyncedIndex = store.index('synced');
    
    // Get all unsynced transactions
    const unsynced = [] as CreditTransaction[];
    let cursor = await unsyncedIndex.openCursor(IDBKeyRange.only(false));
    while (cursor) {
      unsynced.push(cursor.value);
      cursor = await cursor.continue();
    }
    await tx.done;

    if (unsynced.length === 0) return 0;

    // Batch insert credit_transactions
    for (const transaction of unsynced) {
      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: transaction.amount,
        transaction_type: transaction.type,
        description: `Offline ${transaction.feature}`,
        session_type: 'offline',
      });

      // Mark as synced
      const updateTx = db.transaction(TRANSACTIONS_STORE, 'readwrite');
      await updateTx.objectStore(TRANSACTIONS_STORE).put({ ...transaction, synced: true });
      await updateTx.done;
    }

    // Update server balance
    await supabase
      .from('shadow_credits')
      .upsert({
        user_id: user.id,
        balance: state.balance,
        total_consumed: state.totalConsumed,
      }, { onConflict: 'user_id' });

    setState(prev => ({ ...prev, pendingSyncCredits: 0 }));
    return unsynced.length;
  }, [user, state.balance, state.totalConsumed, getDB]);

  // Check if user can afford a feature
  const canAfford = useCallback((feature: string): boolean => {
    const cost = FEATURE_COSTS[feature] ?? 1;
    return cost === 0 || state.balance >= cost;
  }, [state.balance]);

  // Get transaction history
  const getTransactionHistory = useCallback(async (limit = 20): Promise<CreditTransaction[]> => {
    const db = await getDB();
    const all = await db.getAllFromIndex(TRANSACTIONS_STORE, 'timestamp') as CreditTransaction[];
    return all.reverse().slice(0, limit);
  }, [getDB]);

  return {
    ...state,
    consumeCredits,
    addCredits,
    syncCredits,
    canAfford,
    getTransactionHistory,
    featureCosts: FEATURE_COSTS,
  };
};
