
-- Marketplace agents table
CREATE TABLE public.marketplace_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'scripts',
  author TEXT NOT NULL,
  author_id UUID,
  downloads INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 0,
  price TEXT NOT NULL DEFAULT 'Free',
  tags TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT 'Bot',
  verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User installed agents
CREATE TABLE public.user_installed_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES public.marketplace_agents(id) ON DELETE CASCADE,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_installed_agents ENABLE ROW LEVEL SECURITY;

-- Marketplace agents: publicly readable
CREATE POLICY "Anyone can view active agents"
  ON public.marketplace_agents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage agents"
  ON public.marketplace_agents FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User installed agents policies
CREATE POLICY "Users can view their installed agents"
  ON public.user_installed_agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can install agents"
  ON public.user_installed_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can uninstall agents"
  ON public.user_installed_agents FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_agents_updated_at
  BEFORE UPDATE ON public.marketplace_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
