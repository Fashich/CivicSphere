-- ============================================
-- CivicSphere Database Schema
-- ============================================
-- This SQL file contains all the required tables for CivicSphere
-- Copy and paste each CREATE TABLE statement into your Supabase SQL Editor

-- ============================================
-- 1. PROFILES TABLE (for user profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  language TEXT DEFAULT 'id',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. COMMUNITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles ON DELETE SET NULL,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  member_count INTEGER DEFAULT 0,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for communities
CREATE POLICY "Communities are viewable by everyone"
  ON public.communities FOR SELECT
  USING (true);

CREATE POLICY "Users can create communities"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community creator can update community"
  ON public.communities FOR UPDATE
  USING (auth.uid() = creator_id);

-- ============================================
-- 3. COMMUNITY_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(community_id, user_id)
);

-- Enable RLS for community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for community_members
CREATE POLICY "Community members are viewable by everyone"
  ON public.community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. CLIMATE_ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.climate_actions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL,
  community_id UUID REFERENCES public.communities ON DELETE SET NULL,
  creator_id UUID REFERENCES public.profiles ON DELETE SET NULL,
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  impact_co2_saved DECIMAL(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for climate_actions
ALTER TABLE public.climate_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for climate_actions
CREATE POLICY "Climate actions are viewable by everyone"
  ON public.climate_actions FOR SELECT
  USING (true);

CREATE POLICY "Users can create climate actions"
  ON public.climate_actions FOR INSERT
  WITH CHECK (auth.uid() = creator_id OR creator_id IS NULL);

CREATE POLICY "Users can update their own climate actions"
  ON public.climate_actions FOR UPDATE
  USING (auth.uid() = creator_id);

-- ============================================
-- 5. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  community_id UUID NOT NULL REFERENCES public.communities ON DELETE CASCADE,
  creator_id UUID REFERENCES public.profiles ON DELETE SET NULL,
  status TEXT DEFAULT 'planning',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_co2_reduction DECIMAL(15, 2) DEFAULT 0,
  actual_co2_reduction DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Projects are viewable by everyone"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Project creator can update project"
  ON public.projects FOR UPDATE
  USING (auth.uid() = creator_id);

-- ============================================
-- 6. MESSAGES TABLE (for chat functionality)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT,
  sender_id UUID REFERENCES public.profiles ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.profiles ON DELETE SET NULL,
  text TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT check_message_target CHECK (
    (room_id IS NOT NULL) OR (recipient_id IS NOT NULL)
  )
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in community chat"
  ON public.messages FOR SELECT
  USING (
    room_id IS NOT NULL 
    OR sender_id = auth.uid() 
    OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- 7. FRIENDS TABLE (for friend connections)
-- ============================================
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, friend_id),
  CONSTRAINT check_not_self CHECK (user_id != friend_id)
);

-- Enable RLS for friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friends
CREATE POLICY "Users can view their own friends"
  ON public.friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friend relationships"
  ON public.friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their own friend relationships"
  ON public.friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ============================================
-- 8. NOTIFICATIONS TABLE (for user notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 9. BLOCKCHAIN_LEDGER TABLE (for verification)
-- ============================================
CREATE TABLE IF NOT EXISTS public.blockchain_ledger (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES public.climate_actions ON DELETE SET NULL,
  hash TEXT NOT NULL,
  previous_hash TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for blockchain_ledger
ALTER TABLE public.blockchain_ledger ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blockchain_ledger
CREATE POLICY "Blockchain ledger is viewable by everyone"
  ON public.blockchain_ledger FOR SELECT
  USING (true);

CREATE POLICY "System can insert blockchain records"
  ON public.blockchain_ledger FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 10. INDEXES for Performance
-- ============================================

-- Index for faster community lookups
CREATE INDEX IF NOT EXISTS idx_communities_creator_id ON public.communities(creator_id);
CREATE INDEX IF NOT EXISTS idx_communities_location ON public.communities(location_name);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON public.communities(created_at DESC);

-- Index for faster climate actions lookups
CREATE INDEX IF NOT EXISTS idx_climate_actions_community_id ON public.climate_actions(community_id);
CREATE INDEX IF NOT EXISTS idx_climate_actions_creator_id ON public.climate_actions(creator_id);
CREATE INDEX IF NOT EXISTS idx_climate_actions_status ON public.climate_actions(status);
CREATE INDEX IF NOT EXISTS idx_climate_actions_created_at ON public.climate_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_climate_actions_location ON public.climate_actions(location_name);

-- Index for faster projects lookups
CREATE INDEX IF NOT EXISTS idx_projects_community_id ON public.projects(community_id);
CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON public.projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- Index for faster message lookups
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Index for faster friend lookups
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- Index for faster notification lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Index for blockchain ledger
CREATE INDEX IF NOT EXISTS idx_blockchain_ledger_action_id ON public.blockchain_ledger(action_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_ledger_verified ON public.blockchain_ledger(verified);

-- ============================================
-- END OF SCHEMA
-- ============================================
