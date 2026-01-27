-- Shadow Credits / Token System for Pay-Per-Session
CREATE TABLE public.shadow_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit transactions ledger
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'consume', 'refund', 'bonus', 'referral')),
  description TEXT,
  session_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sponsorship/Partner database for Ghost Ads
CREATE TABLE public.sponsor_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  affiliate_url TEXT,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  commission_rate NUMERIC DEFAULT 0,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track affiliate clicks and conversions
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  partner_id UUID REFERENCES public.sponsor_partners(id) ON DELETE CASCADE,
  session_id TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  commission_earned NUMERIC DEFAULT 0
);

-- Business Intent Analytics for B2B Data Insights
CREATE TABLE public.business_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_category TEXT NOT NULL,
  intent_keywords TEXT[],
  query_summary TEXT,
  region TEXT,
  country TEXT,
  industry TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shadow_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shadow_credits
CREATE POLICY "Users can view their own credits" ON public.shadow_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits" ON public.shadow_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits" ON public.shadow_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for sponsor_partners (public read)
CREATE POLICY "Anyone can view active sponsors" ON public.sponsor_partners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage sponsors" ON public.sponsor_partners
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for affiliate_clicks
CREATE POLICY "Users can view their own clicks" ON public.affiliate_clicks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (true);

-- RLS Policies for business_intents (admin only for reading insights)
CREATE POLICY "Admins can view all intents" ON public.business_intents
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert intents" ON public.business_intents
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_shadow_credits_user ON public.shadow_credits(user_id);
CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX idx_sponsor_keywords ON public.sponsor_partners USING GIN(keywords);
CREATE INDEX idx_affiliate_clicks_partner ON public.affiliate_clicks(partner_id);
CREATE INDEX idx_business_intents_category ON public.business_intents(intent_category);
CREATE INDEX idx_business_intents_region ON public.business_intents(region);

-- Triggers for updated_at
CREATE TRIGGER update_shadow_credits_updated_at
  BEFORE UPDATE ON public.shadow_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsor_partners_updated_at
  BEFORE UPDATE ON public.sponsor_partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();