-- Personal LLM Conversations table (for authenticated users' cloud backup)
CREATE TABLE public.personal_llm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  system_prompt TEXT DEFAULT 'You are a personal AI assistant running entirely on this device.',
  model_used TEXT,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Personal LLM Messages table
CREATE TABLE public.personal_llm_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.personal_llm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.personal_llm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_llm_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own personal LLM conversations"
ON public.personal_llm_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personal LLM conversations"
ON public.personal_llm_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal LLM conversations"
ON public.personal_llm_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal LLM conversations"
ON public.personal_llm_conversations FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view their own personal LLM messages"
ON public.personal_llm_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personal LLM messages"
ON public.personal_llm_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal LLM messages"
ON public.personal_llm_messages FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_personal_llm_conversations_user ON public.personal_llm_conversations(user_id);
CREATE INDEX idx_personal_llm_conversations_updated ON public.personal_llm_conversations(updated_at DESC);
CREATE INDEX idx_personal_llm_messages_conversation ON public.personal_llm_messages(conversation_id);
CREATE INDEX idx_personal_llm_messages_user ON public.personal_llm_messages(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_personal_llm_conversations_updated_at
BEFORE UPDATE ON public.personal_llm_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();