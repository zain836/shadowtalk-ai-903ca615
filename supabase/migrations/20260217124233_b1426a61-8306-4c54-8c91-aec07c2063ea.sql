-- Enable the pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function that calls the auto-broadcast edge function
CREATE OR REPLACE FUNCTION public.trigger_auto_broadcast()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger for active announcements
  IF NEW.is_active = true THEN
    PERFORM extensions.http_post(
      url := 'https://axsudmhjpfzffcicfvuj.supabase.co/functions/v1/auto-broadcast',
      body := jsonb_build_object(
        'record', row_to_json(NEW),
        'type', 'INSERT'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4c3VkbWhqcGZ6ZmZjaWNmdnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzY2NTgsImV4cCI6MjA4MDg1MjY1OH0.Jdbo00BVo0QqChuZCxwHYwzdyJK4oBzCxelv1hILEZ4'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger on the announcements table
CREATE TRIGGER on_announcement_inserted
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_broadcast();
