
-- Phase 5: Offline Intelligence DB Tables

-- 1. Offline sync queue — persists queued operations server-side for cross-device sync
CREATE TABLE public.offline_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation_type text NOT NULL, -- 'message', 'conversation', 'knowledge', 'vault'
  operation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  priority integer NOT NULL DEFAULT 1,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 5,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  device_id text
);

ALTER TABLE public.offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sync queue"
  ON public.offline_sync_queue FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_offline_sync_queue_user_status ON public.offline_sync_queue(user_id, status);
CREATE INDEX idx_offline_sync_queue_priority ON public.offline_sync_queue(priority, created_at);

-- 2. Offline session analytics — tracks offline usage patterns
CREATE TABLE public.offline_session_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_start timestamptz NOT NULL,
  session_end timestamptz,
  duration_ms integer,
  messages_sent integer NOT NULL DEFAULT 0,
  model_used text,
  features_used text[] DEFAULT '{}'::text[],
  device_type text, -- 'desktop', 'mobile', 'tablet'
  was_synced boolean NOT NULL DEFAULT false,
  synced_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offline_session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own offline analytics"
  ON public.offline_session_analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_offline_session_user ON public.offline_session_analytics(user_id, created_at DESC);

-- 3. Knowledge snapshots — server-side backup of local knowledge graph
CREATE TABLE public.knowledge_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snapshot_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  entity_count integer NOT NULL DEFAULT 0,
  relationship_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  checksum text, -- for conflict detection
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own snapshots"
  ON public.knowledge_snapshots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_knowledge_snapshots_user ON public.knowledge_snapshots(user_id, created_at DESC);
