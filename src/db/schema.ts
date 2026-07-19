import { pgTable, text, integer, boolean, doublePrecision, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";

// 1. Organizations (Multi-tenant structure)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Users with Roles
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  role: text("role").default("operator").notNull(), // 'admin' | 'operator' | 'inspector'
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  usersOrgIdIdx: index("users_org_id_idx").on(table.organizationId),
}));

// 3. Unified Devices (Cameras & Vehicles)
export const devices = pgTable("devices", {
  id: text("id").primaryKey(), // e.g. 'cam-01', 'patrol-01'
  name: text("name").notNull(),
  type: text("type").notNull(), // 'camera' | 'vehicle'
  status: text("status").default("online").notNull(), // 'online' | 'offline' | 'alerting'
  battery: integer("battery"),
  signal: text("signal").default("good").notNull(), // 'poor' | 'fair' | 'good' | 'excellent'
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  lastActive: text("last_active").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  
  // Camera specific fields
  sirenOn: boolean("siren_on").default(false),
  lightOn: boolean("light_on").default(false),
  recording: boolean("recording").default(false),

  // Vehicle specific fields
  speed: integer("speed"),
  licensePlate: text("license_plate"),
  driverName: text("driver_name"),
}, (table) => ({
  devicesOrgIdIdx: index("devices_org_id_idx").on(table.organizationId),
}));

// 4. Ingested Security Threat Alerts
export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").references(() => devices.id, { onDelete: "cascade" }),
  deviceName: text("device_name").notNull(),
  timestamp: text("timestamp").notNull(),
  severity: text("severity").notNull(), // 'low' | 'medium' | 'high' | 'critical'
  message: text("message").notNull(),
  description: text("description").notNull(),
  objectsDetected: jsonb("objects_detected").default([]),
  resolved: boolean("resolved").default(false).notNull(),
  simulated: boolean("simulated").default(false).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
}, (table) => ({
  alertsOrgIdIdx: index("alerts_org_id_idx").on(table.organizationId),
}));

// 5. Florida GIBMP Compliance Records
export const complianceRecords = pgTable("compliance_records", {
  id: text("id").primaryKey(),
  propertyName: text("property_name").notNull(),
  inspector: text("inspector").notNull(),
  date: text("date").notNull(),
  score: integer("score").notNull(),
  status: text("status").notNull(), // 'compliant' | 'non-compliant'
  notes: text("notes"),
  checklist: jsonb("checklist").notNull(), // { fertilizerRules: boolean, ... }
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
}, (table) => ({
  complianceOrgIdIdx: index("compliance_org_id_idx").on(table.organizationId),
}));

// 6. Synthetic Scenarios
export const scenarios = pgTable("scenarios", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  aspectRatio: text("aspect_ratio").notNull(),
  imageSize: text("image_size").notNull(),
  imageUrl: text("image_url").notNull(),
  model: text("model").notNull(),
  timestamp: text("timestamp").notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
}, (table) => ({
  scenariosOrgIdIdx: index("scenarios_org_id_idx").on(table.organizationId),
}));

// 7. SaaS Billing Configuration & Limits
export const billingConfigs = pgTable("billing_configs", {
  organizationId: uuid("organization_id").primaryKey().references(() => organizations.id, { onDelete: "cascade" }),
  tierName: text("tier_name").default("Starter").notNull(), // 'Free' | 'Starter' | 'Professional' | 'Enterprise'
  price: text("price").default("$99/mo").notNull(),
  maxCameras: integer("max_cameras").default(5).notNull(),
  maxVehicles: integer("max_vehicles").default(2).notNull(),
  maxProperties: integer("max_properties").default(2).notNull(),
  unlockedFeatures: jsonb("unlocked_features").default([]),
});

// 8. Machine Vision Ingest Events (AI Events)
export const aiEvents = pgTable("ai_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: text("device_id").references(() => devices.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  prompt: text("prompt"),
  threatLevel: text("threat_level").notNull(), // 'low' | 'medium' | 'high' | 'critical' | 'none'
  description: text("description").notNull(),
  objectsDetected: jsonb("objects_detected").default([]).notNull(),
  boundingBoxes: jsonb("bounding_boxes").default([]),
  resolved: boolean("resolved").default(false).notNull(),
  simulated: boolean("simulated").default(false).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
}, (table) => ({
  aiEvtOrgIdIdx: index("ai_evt_org_id_idx").on(table.organizationId),
  aiEvtTimestampIdx: index("ai_evt_timestamp_idx").on(table.timestamp),
}));

// 9. Compliance Remediation Work Orders
export const workOrders = pgTable("work_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending").notNull(), // 'pending' | 'in_progress' | 'completed'
  priority: text("priority").default("medium").notNull(), // 'low' | 'medium' | 'high' | 'critical'
  assignedTo: text("assigned_to"),
  complianceRecordId: text("compliance_record_id").references(() => complianceRecords.id, { onDelete: "cascade" }),
  dueDate: text("due_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
}, (table) => ({
  workOrdersOrgIdIdx: index("work_orders_org_id_idx").on(table.organizationId),
  workOrdersCreatedAtIdx: index("work_orders_created_at_idx").on(table.createdAt),
}));

// 10. Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  userEmail: text("user_email"),
  action: text("action").notNull(), // e.g. "SIREN_ACTIVATED", "DEVICE_ADDED", "PLAN_UPGRADED"
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
}, (table) => ({
  auditLogsOrgIdIdx: index("audit_logs_org_id_idx").on(table.organizationId),
  auditLogsTimestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
}));
