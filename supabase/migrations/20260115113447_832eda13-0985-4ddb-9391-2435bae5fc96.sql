-- ShadowTalk AI Complete Schema - Missing Tables Migration
-- Generated: 2026-01-15

-- ============================================
-- ENTERPRISE TABLES
-- ============================================

-- Workspaces for multi-tenancy
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace invitations
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SSO Configurations
CREATE TABLE IF NOT EXISTS public.sso_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('saml', 'oauth', 'oidc')),
  entity_id TEXT,
  sso_url TEXT,
  certificate TEXT,
  client_id TEXT,
  client_secret_encrypted TEXT,
  authorization_url TEXT,
  token_url TEXT,
  user_info_url TEXT,
  issuer_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

-- Workspace branding for white-label
CREATE TABLE IF NOT EXISTS public.workspace_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL DEFAULT 'ShadowTalk AI',
  tagline TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#7c3aed',
  secondary_color TEXT DEFAULT '#8b5cf6',
  accent_color TEXT DEFAULT '#f97316',
  background_color TEXT DEFAULT '#0a0a0a',
  foreground_color TEXT DEFAULT '#fafafa',
  font_family TEXT DEFAULT 'Inter',
  border_radius TEXT DEFAULT '0.5rem',
  custom_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- API & DEVELOPER TABLES
-- ============================================

-- API Keys for developers
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '["read", "write"]'::jsonb,
  rate_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhooks for integrations
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI MODEL CUSTOMIZATION
-- ============================================

-- Custom models for fine-tuning
CREATE TABLE IF NOT EXISTS public.custom_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  training_examples JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================
-- AUTOMATION & SCRIPTS
-- ============================================

-- User automation scripts
CREATE TABLE IF NOT EXISTS public.automation_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('schedule', 'event', 'manual')),
  trigger_config JSONB DEFAULT '{}'::jsonb,
  script_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script execution logs
CREATE TABLE IF NOT EXISTS public.script_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.automation_scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  output JSONB,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- PUSH NOTIFICATIONS
-- ============================================

-- Push subscription storage
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view workspaces they are members of" ON public.workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners can update their workspaces" ON public.workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Workspace members policies
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Workspace admins can manage members" ON public.workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- SSO policies
CREATE POLICY "Workspace admins can manage SSO" ON public.sso_configurations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Branding policies
CREATE POLICY "Workspace admins can manage branding" ON public.workspace_branding
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- API keys policies
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Webhooks policies
CREATE POLICY "Users can manage their own webhooks" ON public.webhooks
  FOR ALL USING (auth.uid() = user_id);

-- Custom models policies
CREATE POLICY "Users can manage their own custom models" ON public.custom_models
  FOR ALL USING (auth.uid() = user_id);

-- Automation scripts policies
CREATE POLICY "Users can manage their own scripts" ON public.automation_scripts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their script executions" ON public.script_executions
  FOR SELECT USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Workspace invitations policies
CREATE POLICY "Users can view invitations for their workspaces" ON public.workspace_invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace admins can create invitations" ON public.workspace_invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_models_user ON public.custom_models(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_scripts_user ON public.automation_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sso_configurations_updated_at
  BEFORE UPDATE ON public.sso_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_branding_updated_at
  BEFORE UPDATE ON public.workspace_branding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_models_updated_at
  BEFORE UPDATE ON public.custom_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_scripts_updated_at
  BEFORE UPDATE ON public.automation_scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add owner as workspace member
CREATE OR REPLACE FUNCTION public.add_owner_as_workspace_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER add_workspace_owner_member
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_workspace_member();