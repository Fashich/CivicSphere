import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export const handleSetup: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    // Check if tables already exist
    const { data: existingTables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (existingTables && existingTables.length > 0) {
      return res.json({
        message: "Database already initialized",
        status: "already_exists",
      });
    }

    // Execute schema setup via Supabase SQL
    const schemaSQL = `
    -- Enable necessary extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Profiles table (extends auth.users)
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      portfolio_url TEXT,
      linkedin_url TEXT,
      instagram_url TEXT,
      whatsapp TEXT,
      custom_links JSONB DEFAULT '[]'::jsonb,
      language TEXT DEFAULT 'id',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Climate Actions table
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
      community_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    );

    -- Communities table
    CREATE TABLE IF NOT EXISTS public.communities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      location_name TEXT,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      avatar_url TEXT,
      banner_url TEXT,
      creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      member_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      visibility TEXT DEFAULT 'public'
    );

    -- Community Members table
    CREATE TABLE IF NOT EXISTS public.community_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      contribution_points INTEGER DEFAULT 0,
      UNIQUE(community_id, user_id)
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS public.projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'planning',
      start_date DATE,
      end_date DATE,
      budget DECIMAL(15, 2),
      target_co2_reduction DECIMAL(10, 2),
      actual_co2_reduction DECIMAL(10, 2) DEFAULT 0,
      creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Project Tasks table
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

    -- Messages/Chat table
    CREATE TABLE IF NOT EXISTS public.messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Analytics/Metrics table
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

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_climate_actions_location ON public.climate_actions(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_climate_actions_community ON public.climate_actions(community_id);
    CREATE INDEX IF NOT EXISTS idx_climate_actions_creator ON public.climate_actions(creator_id);
    CREATE INDEX IF NOT EXISTS idx_community_members_community ON public.community_members(community_id);
    CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_community ON public.projects(community_id);
    CREATE INDEX IF NOT EXISTS idx_messages_community ON public.messages(community_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_community ON public.metrics(community_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_project ON public.metrics(project_id);

    -- Triggers for updated_at timestamps
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER climate_actions_updated_at BEFORE UPDATE ON public.climate_actions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER communities_updated_at BEFORE UPDATE ON public.communities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER messages_updated_at BEFORE UPDATE ON public.messages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Note: Direct SQL execution through Supabase SDK is limited
    // Recommend running migration through Supabase dashboard instead
    res.json({
      message:
        "Please run the SQL migration in your Supabase dashboard at: https://supabase.com/dashboard",
      status: "manual_required",
      instructions:
        "Go to SQL Editor in your Supabase dashboard and run the migration SQL from supabase/migrations/001_initial_schema.sql",
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({
      error: "Setup failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
