-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to communities table
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create climate_actions table
CREATE TABLE IF NOT EXISTS public.climate_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT,
  impact_co2_saved DECIMAL(10, 2),
  impact_unit TEXT DEFAULT 'kg',
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'todo',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS public.metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL,
  value DECIMAL(15, 4),
  unit TEXT,
  recorded_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS target_co2_reduction DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS actual_co2_reduction DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add missing column to community_members
ALTER TABLE public.community_members
ADD COLUMN IF NOT EXISTS contribution_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_climate_actions_location ON public.climate_actions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_climate_actions_community ON public.climate_actions(community_id);
CREATE INDEX IF NOT EXISTS idx_climate_actions_creator ON public.climate_actions(creator_id);
CREATE INDEX IF NOT EXISTS idx_climate_actions_status ON public.climate_actions(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_community ON public.messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_metrics_community ON public.metrics(community_id);
CREATE INDEX IF NOT EXISTS idx_metrics_project ON public.metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_communities_latitude_longitude ON public.communities(latitude, longitude);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.climate_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for climate_actions
DROP POLICY IF EXISTS "Climate actions are viewable by everyone" ON public.climate_actions;
CREATE POLICY "Climate actions are viewable by everyone" ON public.climate_actions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create climate actions" ON public.climate_actions;
CREATE POLICY "Users can create climate actions" ON public.climate_actions
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update own climate actions" ON public.climate_actions;
CREATE POLICY "Users can update own climate actions" ON public.climate_actions
  FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Messages are viewable by community members" ON public.messages;
CREATE POLICY "Messages are viewable by community members" ON public.messages
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM public.community_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to their communities" ON public.messages;
CREATE POLICY "Users can insert messages to their communities" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    community_id IN (
      SELECT community_id FROM public.community_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for project_tasks
DROP POLICY IF EXISTS "Project tasks are viewable" ON public.project_tasks;
CREATE POLICY "Project tasks are viewable" ON public.project_tasks
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE community_id IN (
        SELECT community_id FROM public.community_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for metrics
DROP POLICY IF EXISTS "Metrics are viewable by everyone" ON public.metrics;
CREATE POLICY "Metrics are viewable by everyone" ON public.metrics
  FOR SELECT USING (true);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS climate_actions_updated_at ON public.climate_actions;
CREATE TRIGGER climate_actions_updated_at BEFORE UPDATE ON public.climate_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS communities_updated_at ON public.communities;
CREATE TRIGGER communities_updated_at BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS messages_updated_at ON public.messages;
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
