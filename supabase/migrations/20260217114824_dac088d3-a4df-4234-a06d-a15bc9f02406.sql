
-- Personal AI Memory: auto-learned facts from conversations
CREATE TABLE public.ai_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'fact',
  source TEXT NOT NULL DEFAULT 'auto',
  confidence NUMERIC NOT NULL DEFAULT 0.8,
  times_referenced INTEGER NOT NULL DEFAULT 1,
  last_referenced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories" ON public.ai_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own memories" ON public.ai_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own memories" ON public.ai_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own memories" ON public.ai_memories FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_memories_user ON public.ai_memories(user_id);
CREATE INDEX idx_ai_memories_category ON public.ai_memories(user_id, category);

-- Proactive Intelligence Feed: daily insights pushed to users
CREATE TABLE public.daily_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  source TEXT NOT NULL DEFAULT 'ai',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" ON public.daily_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create insights" ON public.daily_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own insights" ON public.daily_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own insights" ON public.daily_insights FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_daily_insights_user ON public.daily_insights(user_id, generated_at DESC);

-- Living Knowledge Base: extracted knowledge from conversations  
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  source_conversation_id UUID,
  source_message_id TEXT,
  entry_type TEXT NOT NULL DEFAULT 'insight',
  connections UUID[] DEFAULT '{}'::uuid[],
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own knowledge" ON public.knowledge_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own knowledge" ON public.knowledge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own knowledge" ON public.knowledge_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own knowledge" ON public.knowledge_entries FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_knowledge_entries_user ON public.knowledge_entries(user_id);
CREATE INDEX idx_knowledge_entries_tags ON public.knowledge_entries USING GIN(tags);
CREATE INDEX idx_knowledge_entries_type ON public.knowledge_entries(user_id, entry_type);

-- User engagement streaks (for tracking daily return)
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_active_days INTEGER NOT NULL DEFAULT 0,
  streak_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_user_streaks_user ON public.user_streaks(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_ai_memories_updated_at BEFORE UPDATE ON public.ai_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_entries_updated_at BEFORE UPDATE ON public.knowledge_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
