-- Fix RLS policies with overly permissive expressions

-- First, let's check and fix gemini_api_keys policies
-- Drop the permissive INSERT policy and create a more secure one
DROP POLICY IF EXISTS "Anyone can insert gemini keys" ON public.gemini_api_keys;
DROP POLICY IF EXISTS "Admin can insert gemini keys" ON public.gemini_api_keys;

-- Only admins should be able to insert/update gemini keys
CREATE POLICY "Admin can insert gemini keys" 
ON public.gemini_api_keys 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update gemini keys" 
ON public.gemini_api_keys 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete gemini keys" 
ON public.gemini_api_keys 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix feedback table - only authenticated users should insert
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;

CREATE POLICY "Authenticated users can insert feedback" 
ON public.feedback 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix subscribers table - ensure proper RLS
DROP POLICY IF EXISTS "Anyone can insert subscriber" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can insert subscriber" ON public.subscribers;

CREATE POLICY "Users can manage their own subscription" 
ON public.subscribers 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add index for better query performance on high-volume tables
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_created ON public.usage_analytics(user_id, created_at DESC);