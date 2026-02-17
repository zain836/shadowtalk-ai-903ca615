import { useState, useCallback, useEffect } from 'react';
import { openDB } from 'idb';
import { supabase } from '@/integrations/supabase/client';

interface GhostAd {
  id: string;
  partnerName: string;
  description: string;
  affiliateUrl: string;
  logoUrl: string | null;
  keywords: string[];
  category: string;
  priority: number;
}

interface AdImpression {
  adId: string;
  partnerId: string;
  timestamp: number;
  context: string;
  clicked: boolean;
  synced: boolean;
}

interface GhostAdsState {
  cachedAds: GhostAd[];
  isLoaded: boolean;
  pendingImpressions: number;
}

const DB_NAME = 'shadowtalk-ghost-ads';
const ADS_STORE = 'ads';
const IMPRESSIONS_STORE = 'impressions';

export const useGhostAds = () => {
  const [state, setState] = useState<GhostAdsState>({
    cachedAds: [],
    isLoaded: false,
    pendingImpressions: 0,
  });

  const getDB = useCallback(async () => {
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ADS_STORE)) {
          db.createObjectStore(ADS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IMPRESSIONS_STORE)) {
          const store = db.createObjectStore(IMPRESSIONS_STORE, { keyPath: 'adId' });
          store.createIndex('synced', 'synced');
        }
      },
    });
  }, []);

  // Cache sponsor data locally for offline use
  const cacheSponsors = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('sponsor_partners')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!data || data.length === 0) return;

      const db = await getDB();
      const ads: GhostAd[] = data.map(partner => ({
        id: partner.id,
        partnerName: partner.name,
        description: partner.description || '',
        affiliateUrl: partner.affiliate_url || partner.website_url || '',
        logoUrl: partner.logo_url,
        keywords: partner.keywords || [],
        category: partner.category,
        priority: partner.priority || 1,
      }));

      // Cache all ads locally
      const tx = db.transaction(ADS_STORE, 'readwrite');
      for (const ad of ads) {
        await tx.objectStore(ADS_STORE).put(ad);
      }
      await tx.done;

      setState(prev => ({ ...prev, cachedAds: ads, isLoaded: true }));
    } catch (e) {
      console.error('[GhostAds] Cache sync failed:', e);
    }
  }, [getDB]);

  // Load cached ads on mount
  useEffect(() => {
    const loadCached = async () => {
      const db = await getDB();
      const ads = await db.getAll(ADS_STORE) as GhostAd[];
      setState(prev => ({ ...prev, cachedAds: ads, isLoaded: true }));

      // Refresh cache if online
      if (navigator.onLine) {
        cacheSponsors();
      }
    };
    loadCached();
  }, [getDB, cacheSponsors]);

  // Find relevant ads based on conversation context keywords
  const findRelevantAds = useCallback((
    messageContent: string,
    maxAds = 1
  ): GhostAd[] => {
    const contentLower = messageContent.toLowerCase();

    const scored = state.cachedAds.map(ad => {
      let score = 0;
      ad.keywords.forEach(keyword => {
        if (contentLower.includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
      // Boost by category match
      if (contentLower.includes(ad.category.toLowerCase())) score += 5;
      // Boost by priority
      score += ad.priority;

      return { ad, score };
    });

    return scored
      .filter(s => s.score > 5) // Only show truly relevant ads
      .sort((a, b) => b.score - a.score)
      .slice(0, maxAds)
      .map(s => s.ad);
  }, [state.cachedAds]);

  // Generate a contextual recommendation string for injection into AI response
  const generateGhostRecommendation = useCallback((
    messageContent: string
  ): string | null => {
    const relevantAds = findRelevantAds(messageContent);
    if (relevantAds.length === 0) return null;

    const ad = relevantAds[0];
    return `\n\n💡 **Recommended**: [${ad.partnerName}](${ad.affiliateUrl}) — ${ad.description}`;
  }, [findRelevantAds]);

  // Record an ad impression
  const recordImpression = useCallback(async (
    adId: string,
    partnerId: string,
    context: string,
    clicked = false
  ) => {
    const db = await getDB();
    const impression: AdImpression = {
      adId: `${adId}-${Date.now()}`,
      partnerId,
      timestamp: Date.now(),
      context: context.slice(0, 200),
      clicked,
      synced: false,
    };
    await db.put(IMPRESSIONS_STORE, impression);
    setState(prev => ({ ...prev, pendingImpressions: prev.pendingImpressions + 1 }));

    // Sync immediately if online
    if (navigator.onLine) {
      try {
        await supabase.from('affiliate_clicks').insert({
          partner_id: partnerId,
          session_id: crypto.randomUUID(),
          converted: clicked,
        });
        // Mark as synced
        const updateTx = db.transaction(IMPRESSIONS_STORE, 'readwrite');
        await updateTx.objectStore(IMPRESSIONS_STORE).put({ ...impression, synced: true });
        await updateTx.done;
      } catch (e) {
        console.warn('[GhostAds] Impression sync failed:', e);
      }
    }
  }, [getDB]);

  // Sync all pending impressions to server
  const syncImpressions = useCallback(async (): Promise<number> => {
    if (!navigator.onLine) return 0;

    const db = await getDB();
    const tx = db.transaction(IMPRESSIONS_STORE, 'readonly');
    const index = tx.objectStore(IMPRESSIONS_STORE).index('synced');
    
    const unsynced: AdImpression[] = [];
    let cursor = await index.openCursor(IDBKeyRange.only(false));
    while (cursor) {
      unsynced.push(cursor.value);
      cursor = await cursor.continue();
    }
    await tx.done;

    let synced = 0;
    for (const impression of unsynced) {
      try {
        await supabase.from('affiliate_clicks').insert({
          partner_id: impression.partnerId,
          session_id: impression.adId,
          converted: impression.clicked,
        });

        const updateTx = db.transaction(IMPRESSIONS_STORE, 'readwrite');
        await updateTx.objectStore(IMPRESSIONS_STORE).put({ ...impression, synced: true });
        await updateTx.done;
        synced++;
      } catch {
        // Will retry next sync
      }
    }

    setState(prev => ({ ...prev, pendingImpressions: prev.pendingImpressions - synced }));
    return synced;
  }, [getDB]);

  return {
    ...state,
    findRelevantAds,
    generateGhostRecommendation,
    recordImpression,
    syncImpressions,
    cacheSponsors,
  };
};
