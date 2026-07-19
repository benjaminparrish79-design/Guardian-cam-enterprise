-- Run this against your database (or fold it into a proper
-- `drizzle-kit generate` migration once drizzle-kit is set up locally) to
-- bring the schema in line with src/db/schema.ts.

ALTER TABLE "ai_events" ADD COLUMN IF NOT EXISTS "resolved" boolean DEFAULT false NOT NULL;
ALTER TABLE "ai_events" ADD COLUMN IF NOT EXISTS "simulated" boolean DEFAULT false NOT NULL;
ALTER TABLE "alerts" ADD COLUMN IF NOT EXISTS "simulated" boolean DEFAULT false NOT NULL;
