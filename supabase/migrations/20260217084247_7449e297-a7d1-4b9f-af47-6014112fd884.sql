
-- Table to link WhatsApp phone numbers to ShadowTalk user accounts
CREATE TABLE public.whatsapp_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(phone_number)
);

-- Enable RLS
ALTER TABLE public.whatsapp_links ENABLE ROW LEVEL SECURITY;

-- Users can manage their own links
CREATE POLICY "Users can view their own WhatsApp links"
  ON public.whatsapp_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp links"
  ON public.whatsapp_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp links"
  ON public.whatsapp_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp links"
  ON public.whatsapp_links FOR DELETE
  USING (auth.uid() = user_id);

-- Service role needs to look up by phone number (for incoming webhooks)
CREATE POLICY "Service can read by phone number"
  ON public.whatsapp_links FOR SELECT
  USING (true);

-- Timestamp trigger
CREATE TRIGGER update_whatsapp_links_updated_at
  BEFORE UPDATE ON public.whatsapp_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast phone number lookups from webhook
CREATE INDEX idx_whatsapp_links_phone ON public.whatsapp_links(phone_number);
CREATE INDEX idx_whatsapp_links_user ON public.whatsapp_links(user_id);
