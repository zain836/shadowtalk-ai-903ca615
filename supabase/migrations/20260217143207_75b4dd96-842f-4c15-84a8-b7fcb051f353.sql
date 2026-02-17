
-- Fix remaining WITH CHECK (true) on affiliate_clicks
DROP POLICY IF EXISTS "Authenticated users can insert clicks" ON public.affiliate_clicks;
CREATE POLICY "Authenticated users can insert own clicks"
ON public.affiliate_clicks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
