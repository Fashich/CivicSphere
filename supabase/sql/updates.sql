-- Add id to community_members and keep (community_id, user_id) as unique identifier
DO $$ BEGIN
  ALTER TABLE public.community_members ADD COLUMN id uuid DEFAULT gen_random_uuid();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_pkey;
ALTER TABLE public.community_members ADD CONSTRAINT community_members_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX IF NOT EXISTS community_members_community_user_idx ON public.community_members(community_id, user_id);

-- Community join requests table
CREATE TABLE IF NOT EXISTS public.community_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_request_per_user_per_community ON public.community_join_requests(community_id, user_id) WHERE status = 'pending';

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  message text NOT NULL,
  url text,
  user_agent text,
  error_stack text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- Notifications helpful index
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Optional: ensure messages room for global chat is easily queryable
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages(room_id, created_at);
