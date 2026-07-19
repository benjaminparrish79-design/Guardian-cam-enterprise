-- =======================================================================
-- GUARDIAN CAM / TAMPA SECURE COMMANDCENTER - DATABASE SCHEMA & SEED DATA
-- =======================================================================
-- Compatible with Supabase, PostgreSQL 13+, and Drizzle ORM
-- =======================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if they exist (Reverse order of dependencies)
-- Uncomment these if you want to perform a clean start:
-- DROP TABLE IF EXISTS audit_logs;
-- DROP TABLE IF EXISTS work_orders;
-- DROP TABLE IF EXISTS ai_events;
-- DROP TABLE IF EXISTS billing_configs;
-- DROP TABLE IF EXISTS scenarios;
-- DROP TABLE IF EXISTS compliance_records;
-- DROP TABLE IF EXISTS alerts;
-- DROP TABLE IF EXISTS devices;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS organizations;

-- 3. Create Organizations (Multi-tenant structure)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'operator' NOT NULL, -- 'admin' | 'operator' | 'inspector'
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Create Unified Devices Table (Cameras & Vehicles)
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'camera' | 'vehicle'
  status TEXT DEFAULT 'online' NOT NULL, -- 'online' | 'offline' | 'alerting'
  battery INTEGER,
  signal TEXT DEFAULT 'good' NOT NULL, -- 'poor' | 'fair' | 'good' | 'excellent'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  last_active TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Camera specific fields
  siren_on BOOLEAN DEFAULT FALSE,
  light_on BOOLEAN DEFAULT FALSE,
  recording BOOLEAN DEFAULT FALSE,

  -- Vehicle specific fields
  speed INTEGER,
  license_plate TEXT,
  driver_name TEXT
);

-- 6. Create Security Threat Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low' | 'medium' | 'high' | 'critical'
  message TEXT NOT NULL,
  description TEXT NOT NULL,
  objects_detected JSONB DEFAULT '[]'::jsonb,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  simulated BOOLEAN DEFAULT FALSE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- 7. Create Florida GIBMP Compliance Records Table
CREATE TABLE IF NOT EXISTS compliance_records (
  id TEXT PRIMARY KEY,
  property_name TEXT NOT NULL,
  inspector TEXT NOT NULL,
  date TEXT NOT NULL,
  score INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'compliant' | 'non-compliant'
  notes TEXT,
  checklist JSONB NOT NULL, -- e.g. { fertilizerRules: boolean, ... }
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- 8. Create Synthetic Scenarios Table
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  image_size TEXT NOT NULL,
  image_url TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- 9. Create SaaS Billing Configuration Table
CREATE TABLE IF NOT EXISTS billing_configs (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  tier_name TEXT DEFAULT 'Starter' NOT NULL, -- 'Free' | 'Starter' | 'Professional' | 'Enterprise'
  price TEXT DEFAULT '$99/mo' NOT NULL,
  max_cameras INTEGER DEFAULT 5 NOT NULL,
  max_vehicles INTEGER DEFAULT 2 NOT NULL,
  max_properties INTEGER DEFAULT 2 NOT NULL,
  unlocked_features JSONB DEFAULT '[]'::jsonb
);

-- 10. Create Machine Vision Ingest Events Table (AI Events)
CREATE TABLE IF NOT EXISTS ai_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  threat_level TEXT NOT NULL, -- 'low' | 'medium' | 'high' | 'critical' | 'none'
  description TEXT NOT NULL,
  objects_detected JSONB DEFAULT '[]'::jsonb NOT NULL,
  bounding_boxes JSONB DEFAULT '[]'::jsonb,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  simulated BOOLEAN DEFAULT FALSE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- 11. Create Compliance Remediation Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending' | 'in_progress' | 'completed'
  priority TEXT DEFAULT 'medium' NOT NULL, -- 'low' | 'medium' | 'high' | 'critical'
  assigned_to TEXT,
  compliance_record_id TEXT REFERENCES compliance_records(id) ON DELETE CASCADE,
  due_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);

-- 12. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL, -- e.g. "SIREN_ACTIVATED", "DEVICE_ADDED", "PLAN_UPGRADED"
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE
);


-- =======================================================================
-- SEED INITIAL SYSTEM DATA (Default Tenant & Configuration)
-- =======================================================================

-- A. Seed Default Organization
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Tampa Secure CommandCenter')
ON CONFLICT (id) DO NOTHING;

-- B. Seed Default Unified Devices (Cameras & Patrol Vehicles)
INSERT INTO devices (
  id, name, type, status, battery, signal, latitude, longitude, last_active,
  siren_on, light_on, recording, speed, license_plate, driver_name, organization_id
) VALUES
  ('cam-01', 'Gate West Barrier Cam', 'camera', 'online', 92, 'excellent', 27.9506, -82.4572, 'Just now', FALSE, FALSE, TRUE, NULL, NULL, NULL, '00000000-0000-0000-0000-000000000000'),
  ('cam-02', 'Hazmat Storage Cam', 'camera', 'online', 84, 'good', 27.9495, -82.4585, '2 min ago', FALSE, FALSE, TRUE, NULL, NULL, NULL, '00000000-0000-0000-0000-000000000000'),
  ('cam-03', 'Loading Dock Cam', 'camera', 'online', 78, 'excellent', 27.9515, -82.4552, 'Just now', FALSE, FALSE, FALSE, NULL, NULL, NULL, '00000000-0000-0000-0000-000000000000'),
  ('cam-04', 'Visitor Lobby Cam', 'camera', 'online', 100, 'good', 27.9520, -82.4560, '5 min ago', FALSE, FALSE, TRUE, NULL, NULL, NULL, '00000000-0000-0000-0000-000000000000'),
  ('patrol-01', 'Patrol Alpha Cruiser', 'vehicle', 'online', NULL, 'excellent', 27.9480, -82.4590, 'Just now', NULL, NULL, NULL, 22, 'FL-GC1A', 'Officer K. Vance', '00000000-0000-0000-0000-000000000000'),
  ('patrol-02', 'Patrol Bravo Rapid Response', 'vehicle', 'online', NULL, 'good', 27.9530, -82.4540, 'Just now', NULL, NULL, NULL, 12, 'FL-GC2B', 'Officer J. Alvarez', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- C. Seed Default Security Alerts
INSERT INTO alerts (
  id, device_id, device_name, timestamp, severity, message, description, objects_detected, resolved, organization_id
) VALUES
  ('alert-101', 'cam-01', 'Gate West Barrier Cam', '10:14 AM', 'medium', 'Unauthorized Commercial Vehicle', 'Delivery truck identified idling in designated fire egress corridor for over 15 minutes.', '["unauthorized truck", "commercial vehicle"]'::jsonb, FALSE, '00000000-0000-0000-0000-000000000000'),
  ('alert-102', 'cam-02', 'Hazmat Storage Cam', '09:45 AM', 'low', 'Environmental Obstruction Check', 'Solid waste material pile flagged blocking hazard disposal ventilation fans.', '["cardboard boxes", "solid debris"]'::jsonb, TRUE, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- D. Seed Billing Configuration
INSERT INTO billing_configs (
  organization_id, tier_name, price, max_cameras, max_vehicles, max_properties, unlocked_features
) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Starter', '$99/mo', 5, 2, 2, '["gemini-3.5-flash", "1K image synthesis"]'::jsonb)
ON CONFLICT (organization_id) DO NOTHING;

-- E. Seed Florida GIBMP Compliance Records
INSERT INTO compliance_records (
  id, property_name, inspector, date, score, status, notes, checklist, organization_id
) VALUES
  ('inspect-301', 'Tampa Logistics Yard Perimeter', 'Officer K. Vance (GIBMP #8822)', '06/28/2026', 90, 'compliant', 'Site chemical fertilizer containment rules meet all state standards. Proximity buffers safely secured.', '{"fertilizerRules": true, "runoffMitigation": true, "pesticideStorage": true, "bufferZones": true, "irrigationSchedule": false, "hazardousDisposal": true}'::jsonb, '00000000-0000-0000-0000-000000000000'),
  ('inspect-302', 'Everglades Marine Compound', 'Inspector A. Chen (GIBMP #9410)', '06/25/2026', 50, 'non-compliant', 'Pesticide storage unit is poorly ventilated. Drainage runoff paths lead too close to critical wetlands buffers.', '{"fertilizerRules": false, "runoffMitigation": false, "pesticideStorage": false, "bufferZones": true, "irrigationSchedule": false, "hazardousDisposal": true}'::jsonb, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- F. Seed Machine Vision Events (AI Events)
INSERT INTO ai_events (
  id, device_id, image_url, prompt, threat_level, description, objects_detected, bounding_boxes, timestamp, organization_id
) VALUES
  ('3908f906-81cf-4d9b-8e10-c0cf47021cb0', 'cam-01', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=400', 'Scan for suspects scaling the perimeter. Detect clothing, threat-markers, or lockpicks.', 'high', 'Thermal signature analysis confirms unauthorized individual wearing a dark-hooded garment attempting to scale the west security fence line.', '["Intruder", "Chainlink Fence", "Hoodie"]'::jsonb, '[{"label": "Suspected Intruder", "x": 45, "y": 35, "w": 20, "h": 45}]'::jsonb, NOW() - INTERVAL '3 hours', '00000000-0000-0000-0000-000000000000'),
  ('3908f906-81cf-4d9b-8e10-c0cf47021cb1', 'cam-02', 'https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&q=80&w=600&h=400', 'Detect active fire, thermal runaway, smoke emission, or barrel ruptures.', 'critical', 'Anomalous temperature gradient identified at loading point. Active combustion particles with smoke plumes detected near flammable inventory bins.', '["Combustion Plume", "Hazmat Container", "Thermal Flare"]'::jsonb, '[{"label": "Active Ignition Source", "x": 60, "y": 55, "w": 25, "h": 30}]'::jsonb, NOW() - INTERVAL '4 hours', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;
