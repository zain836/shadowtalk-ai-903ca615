-- Create business_memories table for AI workspace memory
CREATE TABLE public.business_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('profile', 'voice', 'customers', 'facts')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX idx_business_memories_user_id ON public.business_memories(user_id);
CREATE INDEX idx_business_memories_category ON public.business_memories(category);
CREATE INDEX idx_business_memories_active ON public.business_memories(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.business_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own memories
CREATE POLICY "Users can view their own memories" 
ON public.business_memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own memories" 
ON public.business_memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories" 
ON public.business_memories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.business_memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_business_memories_updated_at
BEFORE UPDATE ON public.business_memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.business_memories;