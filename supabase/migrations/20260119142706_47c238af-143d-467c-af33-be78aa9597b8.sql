-- Create user_locations table to store geolocation data
CREATE TABLE public.user_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  country TEXT,
  country_code TEXT,
  region TEXT,
  city TEXT,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  timezone TEXT,
  isp TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Allow insert for anyone (including anonymous)
CREATE POLICY "Anyone can insert locations"
ON public.user_locations
FOR INSERT
WITH CHECK (true);

-- Allow select for admins only
CREATE POLICY "Admins can view locations"
ON public.user_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow update for session owners
CREATE POLICY "Update own session location"
ON public.user_locations
FOR UPDATE
USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_user_locations_country ON public.user_locations(country_code);
CREATE INDEX idx_user_locations_timezone ON public.user_locations(timezone);
CREATE INDEX idx_user_locations_created ON public.user_locations(created_at DESC);
CREATE INDEX idx_user_locations_session ON public.user_locations(session_id);

-- Enable realtime for user_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;