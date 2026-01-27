import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export interface SponsorPartner {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  affiliateUrl: string | null;
  keywords: string[];
  category: string;
  commissionRate: number;
  priority: number;
}

export interface AffiliateClick {
  id: string;
  partnerId: string;
  clickedAt: string;
  converted: boolean;
  commissionEarned: number;
}

export function useSponsorPartners() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<SponsorPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all active sponsor partners
  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_partners')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      setPartners(data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        logoUrl: p.logo_url,
        websiteUrl: p.website_url,
        affiliateUrl: p.affiliate_url,
        keywords: p.keywords || [],
        category: p.category,
        commissionRate: Number(p.commission_rate) || 0,
        priority: p.priority,
      })));
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Find relevant sponsors based on keywords in conversation
  const findRelevantSponsors = useCallback((text: string, limit = 2): SponsorPartner[] => {
    if (!text || partners.length === 0) return [];

    const lowerText = text.toLowerCase();
    const matches: { partner: SponsorPartner; score: number }[] = [];

    partners.forEach(partner => {
      let score = 0;
      partner.keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      if (score > 0) {
        matches.push({ partner, score });
      }
    });

    return matches
      .sort((a, b) => b.score - a.score || b.partner.priority - a.partner.priority)
      .slice(0, limit)
      .map(m => m.partner);
  }, [partners]);

  // Track affiliate click
  const trackClick = useCallback(async (partnerId: string, sessionId?: string): Promise<void> => {
    try {
      await supabase.from('affiliate_clicks').insert({
        user_id: user?.id || null,
        partner_id: partnerId,
        session_id: sessionId || crypto.randomUUID(),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, [user]);

  // Generate sponsored recommendation text for AI "thinking trace"
  const generateSponsoredRecommendation = useCallback((
    context: string,
    category?: string
  ): { recommendation: string; partner: SponsorPartner } | null => {
    let relevantPartners = findRelevantSponsors(context, 3);

    // Filter by category if specified
    if (category && relevantPartners.length > 0) {
      relevantPartners = relevantPartners.filter(p => p.category === category);
    }

    if (relevantPartners.length === 0) return null;

    const partner = relevantPartners[0];
    const recommendation = `💡 **Expert Recommendation**: For ${partner.category.toLowerCase()}, we recommend [${partner.name}](${partner.affiliateUrl || partner.websiteUrl}). ${partner.description || ''}`;

    return { recommendation, partner };
  }, [findRelevantSponsors]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  return {
    partners,
    isLoading,
    findRelevantSponsors,
    trackClick,
    generateSponsoredRecommendation,
    refreshPartners: fetchPartners,
  };
}
