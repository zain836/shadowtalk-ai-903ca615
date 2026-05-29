-- Security hardening: tighten RLS policies and reduce abuse surface.

-- 1) Credit balance must not be user-writable.
ALTER TABLE public.shadow_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own credits" ON public.shadow_credits;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.shadow_credits;
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;

CREATE POLICY "Users can view their own credits"
  ON public.shadow_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the backend (service role) may mutate balances.
CREATE POLICY "Service role can write credits"
  ON public.shadow_credits
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update credits"
  ON public.shadow_credits
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view their own credit transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert credit transactions"
  ON public.credit_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 2) Gemini key management is admin-only.
ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_key_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage gemini keys" ON public.gemini_api_keys;
DROP POLICY IF EXISTS "Admins can manage gemini settings" ON public.gemini_settings;
DROP POLICY IF EXISTS "Admins can manage gemini analytics" ON public.gemini_key_analytics;
DROP POLICY IF EXISTS "Users can manage their sessions" ON public.gemini_sessions;

CREATE POLICY "Admins can manage gemini_api_keys"
  ON public.gemini_api_keys
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage gemini_settings"
  ON public.gemini_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage gemini_key_analytics"
  ON public.gemini_key_analytics
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Gemini sessions belong to the user.
CREATE POLICY "Users can view own gemini sessions"
  ON public.gemini_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own gemini sessions"
  ON public.gemini_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gemini sessions"
  ON public.gemini_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3) Users should be able to read their own role rows (supports edge admin checks).
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

