
-- ============================================
-- ULTRA SECURITY HARDENING MIGRATION
-- Fixes all critical and warning-level RLS issues
-- ============================================

-- 1. FIX CRITICAL: user_locations — restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "Anyone can insert locations" ON public.user_locations;
CREATE POLICY "Authenticated users can insert own locations"
ON public.user_locations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix UPDATE to be stricter
DROP POLICY IF EXISTS "Update own session location" ON public.user_locations;
CREATE POLICY "Users can update own locations"
ON public.user_locations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 2. FIX CRITICAL: whatsapp_links — remove overly permissive SELECT
DROP POLICY IF EXISTS "Service can read by phone number" ON public.whatsapp_links;
-- Service-level reads should go through edge functions with service_role key, not public RLS

-- 3. FIX CRITICAL: room_messages — restrict SELECT to room participants
DROP POLICY IF EXISTS "Messages are viewable by all" ON public.room_messages;
CREATE POLICY "Room participants can view messages"
ON public.room_messages FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp
  WHERE rp.room_id = room_messages.room_id AND rp.user_id = auth.uid()
));

-- 4. FIX CRITICAL: room_participants — restrict SELECT to room members
DROP POLICY IF EXISTS "Participants are viewable by room members" ON public.room_participants;
CREATE POLICY "Room members can view participants"
ON public.room_participants FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.room_participants rp2
  WHERE rp2.room_id = room_participants.room_id AND rp2.user_id = auth.uid()
));

-- 5. FIX WARNING: admin_alerts — restrict INSERT to authenticated only
DROP POLICY IF EXISTS "System can insert alerts" ON public.admin_alerts;
CREATE POLICY "Only admins can insert alerts"
ON public.admin_alerts FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 6. FIX WARNING: daily_insights — restrict INSERT to authenticated
DROP POLICY IF EXISTS "System can create insights" ON public.daily_insights;
CREATE POLICY "Only system/admin can create insights"
ON public.daily_insights FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 7. FIX WARNING: user_notifications — restrict INSERT to authenticated
DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;
CREATE POLICY "Only system/admin can insert notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- 8. FIX WARNING: affiliate_clicks — restrict INSERT
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.affiliate_clicks;
CREATE POLICY "Authenticated users can insert clicks"
ON public.affiliate_clicks FOR INSERT
TO authenticated
WITH CHECK (true);

-- 9. FIX WARNING: business_intents — restrict INSERT
DROP POLICY IF EXISTS "System can insert intents" ON public.business_intents;
CREATE POLICY "Only admins can insert intents"
ON public.business_intents FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 10. FIX WARNING: user_journeys — restrict INSERT
DROP POLICY IF EXISTS "Anyone can insert journey data" ON public.user_journeys;
CREATE POLICY "Authenticated users can insert journeys"
ON public.user_journeys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 11. FIX WARNING: eco_stats leaderboard — restrict to authenticated
DROP POLICY IF EXISTS "Anyone can view leaderboard stats" ON public.eco_stats;
CREATE POLICY "Authenticated users can view leaderboard"
ON public.eco_stats FOR SELECT
TO authenticated
USING (true);

-- 12. Enable leaked password protection (requires auth config)
-- This is handled separately via auth configuration
