-- Create profiles table for user customization
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  notification_email boolean DEFAULT true,
  notification_push boolean DEFAULT true,
  notification_mentions boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by authenticated users
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add room moderation columns
ALTER TABLE public.chat_rooms ADD COLUMN IF NOT EXISTS banned_users uuid[] DEFAULT '{}';

-- Create room_bans table for tracking banned users
CREATE TABLE public.room_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  banned_by uuid NOT NULL,
  reason text,
  banned_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;

-- Room creators can view and manage bans
CREATE POLICY "Room creators can manage bans"
ON public.room_bans FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id AND created_by = auth.uid()
  )
);

-- Participants can see if they are banned
CREATE POLICY "Users can see their own bans"
ON public.room_bans FOR SELECT
USING (user_id = auth.uid());

-- Add unique constraint to room_participants for upsert
ALTER TABLE public.room_participants 
ADD CONSTRAINT room_participants_room_user_unique UNIQUE (room_id, user_id);

-- Allow room creators to delete messages
CREATE POLICY "Room creators can delete messages"
ON public.room_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id AND created_by = auth.uid()
  )
);

-- Allow room creators to kick participants
CREATE POLICY "Room creators can remove participants"
ON public.room_participants FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = room_id AND created_by = auth.uid()
  )
);

-- Enable realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;