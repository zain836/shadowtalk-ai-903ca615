-- Create table for real-time shared documents
CREATE TABLE public.room_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  last_edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id)
);

-- Enable Row Level Security
ALTER TABLE public.room_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for room participants to access documents
CREATE POLICY "Room participants can view documents"
ON public.room_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = room_documents.room_id
    AND rp.user_id = auth.uid()
  )
);

CREATE POLICY "Room participants can create documents"
ON public.room_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = room_documents.room_id
    AND rp.user_id = auth.uid()
  )
);

CREATE POLICY "Room participants can update documents"
ON public.room_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.room_participants rp
    WHERE rp.room_id = room_documents.room_id
    AND rp.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_room_documents_updated_at
BEFORE UPDATE ON public.room_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for room_documents table
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_documents;