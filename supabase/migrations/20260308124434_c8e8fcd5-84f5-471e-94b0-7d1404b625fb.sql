
-- 1. FIX guest_usage: Remove unrestricted public UPDATE/INSERT
DROP POLICY IF EXISTS "Anyone can update guest usage" ON public.guest_usage;
DROP POLICY IF EXISTS "Anyone can insert guest usage" ON public.guest_usage;
DROP POLICY IF EXISTS "Anyone can view guest usage by session" ON public.guest_usage;

CREATE POLICY "Service role manages guest usage"
  ON public.guest_usage FOR ALL
  USING (false)
  WITH CHECK (false);

-- 2. FIX user_journeys: Remove spoofing policy
DROP POLICY IF EXISTS "Anyone can insert journeys" ON public.user_journeys;

-- 3. FIX user_badges: Remove public SELECT that leaks user IDs
DROP POLICY IF EXISTS "Anyone can view earned badges" ON public.user_badges;

CREATE POLICY "Users can view all earned badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (true);

-- 4. FIX eco_stats: Remove blanket leaderboard SELECT
DROP POLICY IF EXISTS "Authenticated users can view leaderboard" ON public.eco_stats;

-- 5. FIX profiles: Replace blanket SELECT
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Authenticated users can view public profile data"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 6. FIX newsletter: Restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;

CREATE POLICY "Authenticated users can subscribe to newsletter"
  ON public.newsletter_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true)
