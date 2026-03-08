
-- Bug Bounty Programs table
CREATE TABLE public.bug_bounty_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'hackerone',
  program_name TEXT NOT NULL,
  program_url TEXT,
  scope TEXT,
  max_bounty NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bug Bounty Submissions table
CREATE TABLE public.bug_bounty_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  program_id UUID REFERENCES public.bug_bounty_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  vulnerability_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  bounty_amount NUMERIC DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  report_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cyber AI Chat History table
CREATE TABLE public.cyber_ai_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  context TEXT DEFAULT 'general',
  title TEXT DEFAULT 'New Security Analysis',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bug_bounty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_bounty_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cyber_ai_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own programs" ON public.bug_bounty_programs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own submissions" ON public.bug_bounty_submissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own cyber chats" ON public.cyber_ai_chats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
