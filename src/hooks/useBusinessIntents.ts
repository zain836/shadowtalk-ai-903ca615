import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Categories of business intents for B2B analytics
export const INTENT_CATEGORIES = [
  'startup_formation',
  'legal_services',
  'financial_services',
  'marketing',
  'technology',
  'ecommerce',
  'real_estate',
  'healthcare',
  'education',
  'manufacturing',
  'import_export',
  'consulting',
  'software_development',
  'ai_ml',
  'renewable_energy',
] as const;

export type IntentCategory = typeof INTENT_CATEGORIES[number];

// Keyword patterns for detecting intents
const INTENT_PATTERNS: Record<IntentCategory, string[]> = {
  startup_formation: ['llc', 'incorporate', 'startup', 'business plan', 'register company', 'corporation', 'founder'],
  legal_services: ['contract', 'nda', 'legal', 'attorney', 'lawsuit', 'compliance', 'trademark', 'patent'],
  financial_services: ['investment', 'funding', 'loan', 'bank', 'accounting', 'tax', 'budget', 'revenue'],
  marketing: ['marketing', 'advertising', 'brand', 'social media', 'seo', 'campaign', 'audience'],
  technology: ['software', 'app', 'website', 'api', 'cloud', 'saas', 'platform', 'automation'],
  ecommerce: ['ecommerce', 'online store', 'shopify', 'payment', 'checkout', 'inventory', 'dropshipping'],
  real_estate: ['real estate', 'property', 'rental', 'lease', 'mortgage', 'construction', 'land'],
  healthcare: ['healthcare', 'medical', 'clinic', 'hospital', 'pharmaceutical', 'health tech', 'telemedicine'],
  education: ['education', 'training', 'course', 'school', 'university', 'edtech', 'learning'],
  manufacturing: ['manufacturing', 'factory', 'production', 'supply chain', 'logistics', 'warehouse'],
  import_export: ['import', 'export', 'customs', 'shipping', 'international trade', 'freight'],
  consulting: ['consulting', 'advisory', 'strategy', 'management', 'business consulting'],
  software_development: ['developer', 'programming', 'code', 'web development', 'mobile app', 'frontend', 'backend'],
  ai_ml: ['ai', 'machine learning', 'neural network', 'chatbot', 'nlp', 'deep learning', 'automation'],
  renewable_energy: ['solar', 'wind', 'renewable', 'energy', 'battery', 'ev', 'sustainability', 'green'],
};

export function useBusinessIntents() {
  // Detect intent category from text
  const detectIntent = useCallback((text: string): { category: IntentCategory; keywords: string[] } | null => {
    if (!text) return null;

    const lowerText = text.toLowerCase();
    const scores: Map<IntentCategory, { score: number; keywords: string[] }> = new Map();

    (Object.keys(INTENT_PATTERNS) as IntentCategory[]).forEach(category => {
      const patterns = INTENT_PATTERNS[category];
      const matchedKeywords: string[] = [];

      patterns.forEach(pattern => {
        if (lowerText.includes(pattern.toLowerCase())) {
          matchedKeywords.push(pattern);
        }
      });

      if (matchedKeywords.length > 0) {
        scores.set(category, { score: matchedKeywords.length, keywords: matchedKeywords });
      }
    });

    if (scores.size === 0) return null;

    // Find highest scoring category
    let bestCategory: IntentCategory | null = null;
    let bestScore = 0;
    let bestKeywords: string[] = [];

    scores.forEach((data, category) => {
      if (data.score > bestScore) {
        bestScore = data.score;
        bestCategory = category;
        bestKeywords = data.keywords;
      }
    });

    return bestCategory ? { category: bestCategory, keywords: bestKeywords } : null;
  }, []);

  // Log business intent for analytics (anonymized)
  const logIntent = useCallback(async (
    text: string,
    region?: string,
    country?: string,
    industry?: string
  ): Promise<void> => {
    try {
      const detected = detectIntent(text);
      if (!detected) return;

      // Create anonymized summary (first 100 chars, no personal info)
      const summary = text
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
        .replace(/\b\d{10,}\b/g, '[phone]')
        .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[name]')
        .slice(0, 100);

      await supabase.from('business_intents').insert({
        intent_category: detected.category,
        intent_keywords: detected.keywords,
        query_summary: summary,
        region: region || null,
        country: country || null,
        industry: industry || detected.category,
      });
    } catch (error) {
      console.error('Error logging intent:', error);
    }
  }, [detectIntent]);

  return {
    detectIntent,
    logIntent,
    INTENT_CATEGORIES,
    INTENT_PATTERNS,
  };
}
