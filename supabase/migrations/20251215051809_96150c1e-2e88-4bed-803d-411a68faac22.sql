-- Create eco_stats table to track user environmental impact
CREATE TABLE public.eco_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_action_date DATE,
  co2_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  water_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  energy_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  money_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  actions_completed INTEGER NOT NULL DEFAULT 0,
  high_eroi_actions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create eco_actions table to store completed actions
CREATE TABLE public.eco_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  eroi INTEGER NOT NULL DEFAULT 5,
  co2_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  water_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  energy_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  money_saved DECIMAL(10,2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create oauth_tokens table for storing Gmail/Calendar tokens
CREATE TABLE public.oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on all tables
ALTER TABLE public.eco_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eco_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for eco_stats
CREATE POLICY "Users can view their own eco stats" ON public.eco_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own eco stats" ON public.eco_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own eco stats" ON public.eco_stats FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for eco_actions
CREATE POLICY "Users can view their own eco actions" ON public.eco_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own eco actions" ON public.eco_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for oauth_tokens (strict - only user access)
CREATE POLICY "Users can view their own oauth tokens" ON public.oauth_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own oauth tokens" ON public.oauth_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own oauth tokens" ON public.oauth_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own oauth tokens" ON public.oauth_tokens FOR DELETE USING (auth.uid() = user_id);

-- Public read policy for leaderboard (aggregated stats only)
CREATE POLICY "Anyone can view leaderboard stats" ON public.eco_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view earned badges" ON public.user_badges FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_eco_stats_updated_at BEFORE UPDATE ON public.eco_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON public.oauth_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();