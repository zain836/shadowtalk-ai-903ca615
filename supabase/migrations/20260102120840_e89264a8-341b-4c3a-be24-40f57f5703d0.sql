-- Create table for storing Gemini API keys
CREATE TABLE public.gemini_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_string text NOT NULL,
  is_exhausted boolean NOT NULL DEFAULT false,
  last_exhausted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for storing chat sessions/conversations for load balancer
CREATE TABLE public.gemini_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gemini_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_sessions ENABLE ROW LEVEL SECURITY;

-- API keys: Only admins can manage
CREATE POLICY "Admins can manage API keys"
ON public.gemini_api_keys
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Sessions: Users can manage their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.gemini_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.gemini_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.gemini_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.gemini_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_gemini_api_keys_updated_at
BEFORE UPDATE ON public.gemini_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gemini_sessions_updated_at
BEFORE UPDATE ON public.gemini_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();