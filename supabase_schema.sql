-- =======================================================================
-- TAMPA SECURE COMMANDCENTER - SUPABASE DATABASE SCHEMA
-- =======================================================================
-- This script sets up the "cameras" and "events" tables required by 
-- @/lib/supabase.ts, configures Row Level Security (RLS), enables Realtime,
-- and inserts high-quality seed data.
-- 
-- How to Use:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Open your project, click on "SQL Editor" in the left sidebar.
-- 3. Click "New Query", paste the entire contents of this file, and click "Run".
-- =======================================================================

-- -----------------------------------------------------------------------
-- 1. CLEANUP (Optional - uncomment if you want to recreate tables)
-- -----------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.events CASCADE;
-- DROP TABLE IF EXISTS public.cameras CASCADE;

-- -----------------------------------------------------------------------
-- 2. CREATE TABLES
-- -----------------------------------------------------------------------

-- A. Cameras Table
CREATE TABLE IF NOT EXISTS public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(), -- Associates with Supabase Auth users
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Phone Camera', -- 'Phone Camera' | 'Dome IP Camera' | 'PTZ Camera' etc.
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- B. Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(), -- Associates with Supabase Auth users
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
  camera_name TEXT,
  type TEXT NOT NULL, -- e.g., 'Intruder Alert', 'Motion Detected', 'Siren Triggered'
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- C. AI Threat Events Table (Used by the Supabase Edge Function)
CREATE TABLE IF NOT EXISTS public.ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid(),
  device_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
  image_url TEXT,
  prompt TEXT,
  threat_level TEXT NOT NULL DEFAULT 'low' CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- -----------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------
-- By default, Supabase tables are secure but need RLS enabled to control access.

-- Enable RLS
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

-- A. Policies for Cameras Table
-- Allow anyone (even anonymous or unauthenticated sessions) to view cameras for ease of testing
CREATE POLICY "Allow public read-only access to cameras" 
  ON public.cameras FOR SELECT 
  USING (true);

-- Allow anyone to register/insert a new camera
CREATE POLICY "Allow any visitor to register cameras" 
  ON public.cameras FOR INSERT 
  WITH CHECK (true);

-- Allow owners (or any user if testing offline) to update cameras
CREATE POLICY "Allow any user to update cameras" 
  ON public.cameras FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- B. Policies for Events Table
-- Allow public read access to events
CREATE POLICY "Allow public read-only access to events" 
  ON public.events FOR SELECT 
  USING (true);

-- Allow anyone to log security events
CREATE POLICY "Allow anyone to log events" 
  ON public.events FOR INSERT 
  WITH CHECK (true);

-- C. Policies for AI Events Table
-- Allow public read access to AI events
CREATE POLICY "Allow public read-only access to ai_events" 
  ON public.ai_events FOR SELECT 
  USING (true);

-- Allow anyone to log AI events (including Edge Functions)
CREATE POLICY "Allow anyone to log ai_events" 
  ON public.ai_events FOR INSERT 
  WITH CHECK (true);


-- -----------------------------------------------------------------------
-- 4. ENABLE REALTIME
-- -----------------------------------------------------------------------
-- This ensures that the eventsService.subscribeToCameraEvents() listener in
-- the application immediately receives real-time updates when an alert or event is inserted.

BEGIN;
  -- Remove the publication if it already has the table, to prevent duplicates
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.events;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.cameras;
  ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.ai_events;

  -- Add tables to Supabase's Realtime publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cameras;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_events;
COMMIT;


-- -----------------------------------------------------------------------
-- 5. HIGH-QUALITY SEED DATA
-- -----------------------------------------------------------------------

-- Insert initial sample cameras (storing returned IDs is done in variables if needed,
-- here we use fixed UUIDs to establish relational integrity between cameras and events).

INSERT INTO public.cameras (id, name, location, type, status, last_seen)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', 'Gate West Barrier Cam', 'North Wall Fence / Tampa, FL', 'PTZ Camera', 'online', NOW() - INTERVAL '2 minutes'),
  ('c2222222-2222-2222-2222-222222222222', 'Hazmat Storage Cam', 'Hazard Area / Tampa, FL', 'Dome IP Camera', 'online', NOW() - INTERVAL '5 minutes'),
  ('c3333333-3333-3333-3333-333333333333', 'Loading Dock Cam', 'Warehouse B / Tampa, FL', 'Bullet Camera', 'maintenance', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Insert initial sample events linked to those cameras
INSERT INTO public.events (camera_id, camera_name, type, description, severity, time)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Gate West Barrier Cam', 'Intruder Alert', 'Thermal signature analysis confirms unauthorized individual attempting to scale the west security fence line.', 'critical', NOW() - INTERVAL '15 minutes'),
  ('c2222222-2222-2222-2222-222222222222', 'Hazmat Storage Cam', 'Motion Detected', 'Movement identified in the hazmat disposal locker zone outside designated working hours.', 'high', NOW() - INTERVAL '1 hour'),
  ('c1111111-1111-1111-1111-111111111111', 'Gate West Barrier Cam', 'Siren Triggered', 'Autonomous light and siren defense system activated remotely by operator.', 'medium', NOW() - INTERVAL '30 minutes')
ON CONFLICT DO NOTHING;
