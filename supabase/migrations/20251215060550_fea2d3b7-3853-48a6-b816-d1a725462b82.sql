-- Create stealth vault table for encrypted entries
CREATE TABLE public.stealth_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title_encrypted text NOT NULL,
  content_encrypted text NOT NULL,
  iv text NOT NULL,
  salt text NOT NULL,
  category text DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.stealth_vault ENABLE ROW LEVEL SECURITY;

-- Users can only access their own vault entries
CREATE POLICY "Users can view own vault entries"
ON public.stealth_vault FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vault entries"
ON public.stealth_vault FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault entries"
ON public.stealth_vault FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault entries"
ON public.stealth_vault FOR DELETE
USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_stealth_vault_user_id ON public.stealth_vault(user_id);
CREATE INDEX idx_stealth_vault_category ON public.stealth_vault(user_id, category);
CREATE INDEX idx_stealth_vault_updated_at ON public.stealth_vault(user_id, updated_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_stealth_vault_updated_at
  BEFORE UPDATE ON public.stealth_vault
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();