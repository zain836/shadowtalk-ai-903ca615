
-- ============================================
-- 1. BLOG POSTS TABLE (CMS)
-- ============================================
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  author text NOT NULL DEFAULT 'ShadowTalk Team',
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone,
  read_time_minutes integer DEFAULT 5,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. CHANGELOG ENTRIES TABLE (CMS)
-- ============================================
CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  change_type text NOT NULL DEFAULT 'improvement',
  tags text[] DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published changelog" ON public.changelog_entries
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage changelog" ON public.changelog_entries
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 3. FAQ ITEMS TABLE (CMS)
-- ============================================
CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  sort_order integer DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published FAQs" ON public.faq_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage FAQs" ON public.faq_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 4. STATUS MONITORS TABLE
-- ============================================
CREATE TABLE public.status_monitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  status text NOT NULL DEFAULT 'operational',
  description text,
  uptime_percentage numeric DEFAULT 99.9,
  last_incident_at timestamp with time zone,
  last_checked_at timestamp with time zone DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.status_monitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active status monitors" ON public.status_monitors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage status monitors" ON public.status_monitors
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 5. USER SETTINGS TABLE (replaces localStorage)
-- ============================================
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. JOURNEY TRACKING TABLE
-- ============================================
CREATE TABLE public.journey_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  step_name text NOT NULL,
  step_data jsonb DEFAULT '{}',
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their journey data" ON public.journey_tracking
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous inserts for guest tracking
CREATE POLICY "Guests can insert journey data" ON public.journey_tracking
  FOR INSERT WITH CHECK (user_id IS NULL);

-- ============================================
-- 7. NEWSLETTER SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE public.newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  source text DEFAULT 'website',
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  unsubscribed_at timestamp with time zone
);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view subscriptions" ON public.newsletter_subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage subscriptions" ON public.newsletter_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 8. DOCS PAGES TABLE (CMS)
-- ============================================
CREATE TABLE public.docs_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'getting-started',
  sort_order integer DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  parent_id uuid REFERENCES public.docs_pages(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.docs_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published docs" ON public.docs_pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage docs" ON public.docs_pages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
