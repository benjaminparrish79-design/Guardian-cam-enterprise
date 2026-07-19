CREATE TABLE "ai_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" text,
	"image_url" text NOT NULL,
	"prompt" text,
	"threat_level" text NOT NULL,
	"description" text NOT NULL,
	"objects_detected" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bounding_boxes" jsonb DEFAULT '[]'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text,
	"device_name" text NOT NULL,
	"timestamp" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"description" text NOT NULL,
	"objects_detected" jsonb DEFAULT '[]'::jsonb,
	"resolved" boolean DEFAULT false NOT NULL,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"user_email" text,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE "billing_configs" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"tier_name" text DEFAULT 'Starter' NOT NULL,
	"price" text DEFAULT '$99/mo' NOT NULL,
	"max_cameras" integer DEFAULT 5 NOT NULL,
	"max_vehicles" integer DEFAULT 2 NOT NULL,
	"max_properties" integer DEFAULT 2 NOT NULL,
	"unlocked_features" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE "compliance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"property_name" text NOT NULL,
	"inspector" text NOT NULL,
	"date" text NOT NULL,
	"score" integer NOT NULL,
	"status" text NOT NULL,
	"notes" text,
	"checklist" jsonb NOT NULL,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'online' NOT NULL,
	"battery" integer,
	"signal" text DEFAULT 'good' NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"last_active" text NOT NULL,
	"organization_id" uuid,
	"siren_on" boolean DEFAULT false,
	"light_on" boolean DEFAULT false,
	"recording" boolean DEFAULT false,
	"speed" integer,
	"license_plate" text,
	"driver_name" text
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"image_size" text NOT NULL,
	"image_url" text NOT NULL,
	"model" text NOT NULL,
	"timestamp" text NOT NULL,
	"organization_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'operator' NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assigned_to" text,
	"compliance_record_id" text,
	"due_date" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"organization_id" uuid
);
--> statement-breakpoint
ALTER TABLE "ai_events" ADD CONSTRAINT "ai_events_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_events" ADD CONSTRAINT "ai_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_configs" ADD CONSTRAINT "billing_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_compliance_record_id_compliance_records_id_fk" FOREIGN KEY ("compliance_record_id") REFERENCES "public"."compliance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_evt_org_id_idx" ON "ai_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "ai_evt_timestamp_idx" ON "ai_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "alerts_org_id_idx" ON "alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_org_id_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "compliance_org_id_idx" ON "compliance_records" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "devices_org_id_idx" ON "devices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "scenarios_org_id_idx" ON "scenarios" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_org_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "work_orders_org_id_idx" ON "work_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "work_orders_created_at_idx" ON "work_orders" USING btree ("created_at");--> statement-breakpoint

-- Enable RLS on all tables
ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."compliance_records" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."scenarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."billing_configs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."ai_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."work_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Drop existing policies if they exist (to ensure idempotency)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "public"."devices";--> statement-breakpoint
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "public"."alerts";--> statement-breakpoint
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "public"."ai_events";--> statement-breakpoint
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "public"."compliance_records";--> statement-breakpoint
DROP POLICY IF EXISTS "Enable all for authenticated users" ON "public"."work_orders";--> statement-breakpoint

-- Create RLS policies for authenticated users
CREATE POLICY "Enable all for authenticated users" ON "public"."devices" FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable all for authenticated users" ON "public"."alerts" FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable all for authenticated users" ON "public"."ai_events" FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable all for authenticated users" ON "public"."compliance_records" FOR ALL TO authenticated USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Enable all for authenticated users" ON "public"."work_orders" FOR ALL TO authenticated USING (true) WITH CHECK (true);