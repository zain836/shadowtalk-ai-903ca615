-- Create table to track Gemini API key usage analytics
CREATE TABLE public.gemini_key_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_id UUID NOT NULL REFERENCES public.gemini_api_keys(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  tokens_used INTEGER,
  was_exhausted BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gemini_key_analytics ENABLE ROW LEVEL SECURITY;

-- Policies: Allow insert from edge functions (service role), allow admins to view all
CREATE POLICY "Allow service role insert" 
ON public.gemini_key_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics" 
ON public.gemini_key_analytics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own analytics" 
ON public.gemini_key_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add usage_count column to gemini_api_keys for quick stats
ALTER TABLE public.gemini_api_keys 
ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN exhaustion_count INTEGER NOT NULL DEFAULT 0;

-- Create index for faster analytics queries
CREATE INDEX idx_gemini_key_analytics_key_id ON public.gemini_key_analytics(key_id);
CREATE INDEX idx_gemini_key_analytics_created_at ON public.gemini_key_analytics(created_at);
CREATE INDEX idx_gemini_key_analytics_user_id ON public.gemini_key_analytics(user_id);