-- App-wide update feed (logged-in + guest clients) and realtime notifications

CREATE TABLE IF NOT EXISTS public.app_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('changelog', 'announcement', 'release', 'broadcast')),
  source_id uuid,
  version text,
  title text NOT NULL,
  message text NOT NULL,
  action_url text DEFAULT '/changelog',
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_id)
);

ALTER TABLE public.app_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app updates"
  ON public.app_updates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage app updates"
  ON public.app_updates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_app_updates_published ON public.app_updates (published_at DESC);

-- Realtime for in-app notification bell
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'user_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
  END IF;
END $$;

-- Notify when a changelog entry is newly published
CREATE OR REPLACE FUNCTION public.trigger_changelog_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_published = true AND (TG_OP = 'INSERT' OR (OLD IS NOT NULL AND OLD.is_published IS DISTINCT FROM true)) THEN
    PERFORM extensions.http_post(
      url := 'https://axsudmhjpfzffcicfvuj.supabase.co/functions/v1/notify-app-update',
      body := jsonb_build_object(
        'source', 'changelog',
        'record', row_to_json(NEW)
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

DROP TRIGGER IF EXISTS on_changelog_published ON public.changelog_entries;
CREATE TRIGGER on_changelog_published
  AFTER INSERT OR UPDATE OF is_published ON public.changelog_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_changelog_notify();

-- Re-notify when an announcement is activated
CREATE OR REPLACE FUNCTION public.trigger_announcement_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active = true AND (TG_OP = 'INSERT' OR (OLD IS NOT NULL AND OLD.is_active IS DISTINCT FROM true)) THEN
    PERFORM extensions.http_post(
      url := 'https://axsudmhjpfzffcicfvuj.supabase.co/functions/v1/notify-app-update',
      body := jsonb_build_object(
        'source', 'announcement',
        'record', row_to_json(NEW)
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

DROP TRIGGER IF EXISTS on_announcement_inserted ON public.announcements;
DROP TRIGGER IF EXISTS on_announcement_notify ON public.announcements;
CREATE TRIGGER on_announcement_notify
  AFTER INSERT OR UPDATE OF is_active ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_announcement_notify();
