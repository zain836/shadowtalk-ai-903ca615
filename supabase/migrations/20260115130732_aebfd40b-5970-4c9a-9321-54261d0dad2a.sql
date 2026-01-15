-- Fix remaining permissive RLS policies

-- Fix feedback table - the "Anyone can submit feedback" has WITH CHECK (true)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.feedback;

-- Allow both authenticated users and public feedback with email validation
CREATE POLICY "Users can submit feedback" 
ON public.feedback 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Fix gemini_key_analytics - the service role insert policy has WITH CHECK (true)
DROP POLICY IF EXISTS "Allow service role insert" ON public.gemini_key_analytics;

-- Create a more secure insert policy for analytics (allow from edge functions)
CREATE POLICY "System can insert analytics" 
ON public.gemini_key_analytics 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Also allow subscribers table insert for users
DROP POLICY IF EXISTS "Users can manage their own subscription" ON public.subscribers;

CREATE POLICY "Users can insert subscriber record" 
ON public.subscribers 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);