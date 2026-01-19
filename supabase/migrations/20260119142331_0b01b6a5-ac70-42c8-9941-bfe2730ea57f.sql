-- Enable realtime for usage_analytics table
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_analytics;

-- Enable realtime for feedback table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;