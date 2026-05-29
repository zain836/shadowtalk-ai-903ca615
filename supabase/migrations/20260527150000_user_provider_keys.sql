-- Per-user BYOK (bring your own key) credentials for AI providers
CREATE TABLE IF NOT EXISTS public.user_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  label TEXT,
  key_prefix TEXT NOT NULL,
  key_ciphertext TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_provider_keys_provider_check CHECK (
    provider IN ('google', 'openai', 'anthropic', 'xai', 'perplexity', 'openrouter', 'mistral', 'groq')
  ),
  CONSTRAINT user_provider_keys_user_provider_unique UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_provider_keys_user_id ON public.user_provider_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_provider_keys_default ON public.user_provider_keys(user_id, is_default) WHERE is_default = true;

ALTER TABLE public.user_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own provider keys metadata"
  ON public.user_provider_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own provider keys"
  ON public.user_provider_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Inserts/updates go through edge function (service role); block direct client writes of ciphertext
CREATE POLICY "Users cannot insert provider keys directly"
  ON public.user_provider_keys FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users cannot update provider keys directly"
  ON public.user_provider_keys FOR UPDATE
  USING (false);

COMMENT ON TABLE public.user_provider_keys IS 'Encrypted per-user API keys for external AI providers (BYOK)';
