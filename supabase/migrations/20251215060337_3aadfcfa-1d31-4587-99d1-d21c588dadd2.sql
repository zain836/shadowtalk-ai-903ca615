-- Performance indexes for scalability (handling billions of records)

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Room messages indexes for real-time performance
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON public.room_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_created ON public.room_messages(room_id, created_at DESC);

-- Room participants indexes
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);

-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON public.chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_public ON public.chat_rooms(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON public.chat_rooms(created_at DESC);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Subscribers indexes
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer_id ON public.subscribers(stripe_customer_id);

-- Room bans indexes
CREATE INDEX IF NOT EXISTS idx_room_bans_room_id ON public.room_bans(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bans_user_id ON public.room_bans(user_id);

-- Eco stats indexes for leaderboard
CREATE INDEX IF NOT EXISTS idx_eco_stats_xp ON public.eco_stats(xp DESC);
CREATE INDEX IF NOT EXISTS idx_eco_stats_level ON public.eco_stats(level DESC);

-- Add statement timeout for long-running queries (security)
ALTER DATABASE postgres SET statement_timeout = '30s';

-- Enable additional security extensions if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;