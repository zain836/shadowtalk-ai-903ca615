-- =============================================================================
-- SOVEREIGN EXECUTION ENGINE (S.E.E.) - Mission Database Schema
-- =============================================================================

-- Create missions table for persistent background tasks
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Execution metadata
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_step INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  
  -- Timing
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_duration_ms INTEGER,
  actual_duration_ms INTEGER,
  
  -- Configuration
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  notify_on_complete BOOLEAN NOT NULL DEFAULT true,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mission_actions table for action stream / proof of action
CREATE TABLE public.mission_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  action_type TEXT NOT NULL,
  action_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  
  -- Action details
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  -- Tool integration
  tool_id TEXT,
  tool_name TEXT,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shadow_vault_connections table for sovereign tool integration
CREATE TABLE public.shadow_vault_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('email', 'calendar', 'storage', 'messaging', 'payment', 'crm', 'social', 'custom')),
  
  -- Connection status
  is_connected BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Encrypted credentials (stored securely)
  credentials_encrypted TEXT,
  iv TEXT,
  salt TEXT,
  
  -- OAuth tokens if applicable
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Permissions
  scopes TEXT[] DEFAULT '{}',
  permissions JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, service_name)
);

-- Enable Row Level Security
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shadow_vault_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for missions
CREATE POLICY "Users can view their own missions" ON public.missions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own missions" ON public.missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own missions" ON public.missions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own missions" ON public.missions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for mission_actions
CREATE POLICY "Users can view their own actions" ON public.mission_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own actions" ON public.mission_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own actions" ON public.mission_actions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for shadow_vault_connections
CREATE POLICY "Users can view their own connections" ON public.shadow_vault_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections" ON public.shadow_vault_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections" ON public.shadow_vault_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections" ON public.shadow_vault_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_missions_user_id ON public.missions(user_id);
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_created_at ON public.missions(created_at DESC);
CREATE INDEX idx_mission_actions_mission_id ON public.mission_actions(mission_id);
CREATE INDEX idx_mission_actions_user_id ON public.mission_actions(user_id);
CREATE INDEX idx_shadow_vault_user_id ON public.shadow_vault_connections(user_id);

-- Enable realtime for mission updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mission_actions;

-- Create updated_at trigger for missions
CREATE TRIGGER update_missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for shadow_vault_connections
CREATE TRIGGER update_shadow_vault_updated_at
  BEFORE UPDATE ON public.shadow_vault_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();