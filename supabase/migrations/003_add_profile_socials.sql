-- Add social/profile fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Ensure updated_at trigger will update timestamps
-- (Assumes update_updated_at_column trigger already exists from initial migration)
