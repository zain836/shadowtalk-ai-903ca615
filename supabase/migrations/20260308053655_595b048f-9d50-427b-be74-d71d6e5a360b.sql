
-- Guest usage tracking (for unauthenticated users, keyed by fingerprint/session)
CREATE TABLE public.guest_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  chats integer NOT NULL DEFAULT 0,
  images integer NOT NULL DEFAULT 0,
  deep_research integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_reset date NOT NULL DEFAULT CURRENT_DATE,
  ip_address text
);

CREATE UNIQUE INDEX idx_guest_usage_session ON public.guest_usage (session_id);

ALTER TABLE public.guest_usage ENABLE ROW LEVEL SECURITY;

-- Anyone can read/write guest usage (unauthenticated users)
CREATE POLICY "Anyone can insert guest usage" ON public.guest_usage FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view guest usage by session" ON public.guest_usage FOR SELECT USING (true);
CREATE POLICY "Anyone can update guest usage" ON public.guest_usage FOR UPDATE USING (true);

-- Daily limits tracking (for authenticated users)
CREATE TABLE public.daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  messages integer NOT NULL DEFAULT 0,
  file_uploads integer NOT NULL DEFAULT 0,
  code_generations integer NOT NULL DEFAULT 0,
  image_generations integer NOT NULL DEFAULT 0,
  web_searches integer NOT NULL DEFAULT 0,
  deep_research integer NOT NULL DEFAULT 0,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily usage" ON public.daily_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily usage" ON public.daily_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily usage" ON public.daily_usage FOR UPDATE USING (auth.uid() = user_id);

-- User journeys table (already referenced by code but may need creation)
CREATE TABLE IF NOT EXISTS public.user_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  page_path text NOT NULL,
  page_title text,
  referrer_path text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  duration_seconds integer
);

ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert journeys" ON public.user_journeys FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own journeys" ON public.user_journeys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all journeys" ON public.user_journeys FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
