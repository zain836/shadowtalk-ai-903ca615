-- Add columns for auto-rotation and alert thresholds
ALTER TABLE public.gemini_api_keys 
ADD COLUMN IF NOT EXISTS auto_disabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disabled_reason TEXT;

-- Create a settings table for global thresholds
CREATE TABLE IF NOT EXISTS public.gemini_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gemini_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read/write settings
CREATE POLICY "Admins can manage gemini settings" 
ON public.gemini_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default settings
INSERT INTO public.gemini_settings (setting_key, setting_value) VALUES
  ('exhaustion_threshold', '5'),
  ('alert_email', ''),
  ('usage_alert_threshold', '100'),
  ('alerts_enabled', 'false')
ON CONFLICT (setting_key) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_gemini_settings_updated_at
BEFORE UPDATE ON public.gemini_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();