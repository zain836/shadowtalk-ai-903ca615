-- Allow users to archive conversations without deleting them
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_user_active
ON public.conversations (user_id, updated_at DESC)
WHERE archived_at IS NULL;
