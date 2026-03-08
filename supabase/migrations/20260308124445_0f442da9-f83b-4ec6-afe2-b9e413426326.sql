
-- Fix newsletter insert to not use WITH CHECK (true) - use email validation instead
DROP POLICY IF EXISTS "Authenticated users can subscribe to newsletter" ON public.newsletter_subscriptions;

CREATE POLICY "Authenticated users can subscribe to newsletter"
  ON public.newsletter_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (email IS NOT NULL AND length(email) > 0 AND length(email) <= 255)
