-- Create table for tracking user page visits (journeys)
CREATE TABLE public.user_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer_path TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_user_journeys_session_id ON public.user_journeys(session_id);
CREATE INDEX idx_user_journeys_timestamp ON public.user_journeys(timestamp DESC);
CREATE INDEX idx_user_journeys_page_path ON public.user_journeys(page_path);

-- Enable Row Level Security
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anonymous users
CREATE POLICY "Anyone can insert journey data" 
ON public.user_journeys 
FOR INSERT 
WITH CHECK (true);

-- Only admins can read journey data
CREATE POLICY "Admins can read journey data" 
ON public.user_journeys 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create table for admin alerts
CREATE TABLE public.admin_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT DEFAULT 'system'
);

-- Create index for alerts
CREATE INDEX idx_admin_alerts_triggered_at ON public.admin_alerts(triggered_at DESC);
CREATE INDEX idx_admin_alerts_is_read ON public.admin_alerts(is_read);

-- Enable Row Level Security
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can read/update alerts
CREATE POLICY "Admins can read alerts" 
ON public.admin_alerts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update alerts" 
ON public.admin_alerts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- System can insert alerts (via edge functions)
CREATE POLICY "System can insert alerts" 
ON public.admin_alerts 
FOR INSERT 
WITH CHECK (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_journeys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;