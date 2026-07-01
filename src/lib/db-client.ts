import { db } from "@/db";
import { devices, alerts, aiEvents, billingConfigs, organizations, complianceRecords, workOrders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { getOrganizationId } from "@/lib/supabase";

// Types
import { Device, SecurityAlert, AIEvent, BillingConfig, ComplianceRecord } from "@/types";

const FALLBACK_FILE_PATH = "/tmp/guardiancam_db.json";

// Default Initial Seed Data
const DEFAULT_DEVICES: Device[] = [
  { id: "cam-01", name: "Gate West Barrier Cam", type: "camera", status: "online", battery: 92, signal: "excellent", lastActive: "Just now", latitude: 27.9506, longitude: -82.4572, sirenOn: false, lightOn: false, recording: true },
  { id: "cam-02", name: "Hazmat Storage Cam", type: "camera", status: "online", battery: 84, signal: "good", lastActive: "2 min ago", latitude: 27.9495, longitude: -82.4585, sirenOn: false, lightOn: false, recording: true },
  { id: "cam-03", name: "Loading Dock Cam", type: "camera", status: "online", battery: 78, signal: "excellent", lastActive: "Just now", latitude: 27.9515, longitude: -82.4552, sirenOn: false, lightOn: false, recording: false },
  { id: "cam-04", name: "Visitor Lobby Cam", type: "camera", status: "online", battery: 100, signal: "good", lastActive: "5 min ago", latitude: 27.9520, longitude: -82.4560, sirenOn: false, lightOn: false, recording: true },
  { id: "patrol-01", name: "Patrol Alpha Cruiser", type: "vehicle", status: "online", signal: "excellent", lastActive: "Just now", latitude: 27.9480, longitude: -82.4590, speed: 22, licensePlate: "FL-GC1A", driverName: "Officer K. Vance" },
  { id: "patrol-02", name: "Patrol Bravo Rapid Response", type: "vehicle", status: "online", signal: "good", lastActive: "Just now", latitude: 27.9530, longitude: -82.4540, speed: 12, licensePlate: "FL-GC2B", driverName: "Officer J. Alvarez" }
];

const DEFAULT_ALERTS: SecurityAlert[] = [
  {
    id: "alert-101",
    deviceId: "cam-01",
    deviceName: "Gate West Barrier Cam",
    timestamp: "10:14 AM",
    severity: "medium",
    message: "Unauthorized Commercial Vehicle",
    description: "Delivery truck identified idling in designated fire egress corridor for over 15 minutes.",
    objectsDetected: ["unauthorized truck", "commercial vehicle"],
    resolved: false
  },
  {
    id: "alert-102",
    deviceId: "cam-02",
    deviceName: "Hazmat Storage Cam",
    timestamp: "09:45 AM",
    severity: "low",
    message: "Environmental Obstruction Check",
    description: "Solid waste material pile flagged blocking hazard disposal ventilation fans.",
    objectsDetected: ["cardboard boxes", "solid debris"],
    resolved: true
  }
];

const DEFAULT_AI_EVENTS: AIEvent[] = [
  {
    id: "ai-evt-101",
    deviceId: "cam-01",
    deviceName: "Gate West Barrier Cam",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=400",
    prompt: "Scan for suspects scaling the perimeter. Detect clothing, threat-markers, or lockpicks.",
    threatLevel: "high",
    description: "Thermal signature analysis confirms unauthorized individual wearing a dark-hooded garment attempting to scale the west security fence line.",
    objectsDetected: ["Intruder", "Chainlink Fence", "Hoodie"],
    boundingBoxes: [
      { label: "Suspected Intruder", x: 45, y: 35, w: 20, h: 45 }
    ],
    timestamp: "10:14 AM",
    resolved: false
  },
  {
    id: "ai-evt-102",
    deviceId: "cam-02",
    deviceName: "Hazmat Storage Cam",
    imageUrl: "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&q=80&w=600&h=400",
    prompt: "Detect active fire, thermal runaway, smoke emission, or barrel ruptures.",
    threatLevel: "critical",
    description: "Anomalous temperature gradient identified at loading point. Active combustion particles with smoke plumes detected near flammable inventory bins.",
    objectsDetected: ["Combustion Plume", "Hazmat Container", "Thermal Flare"],
    boundingBoxes: [
      { label: "Active Ignition Source", x: 60, y: 55, w: 25, h: 30 }
    ],
    timestamp: "09:45 AM",
    resolved: true
  }
];

const DEFAULT_BILLING: BillingConfig = {
  tierName: "Starter",
  price: "$99/mo",
  maxCameras: 5,
  maxVehicles: 2,
  maxProperties: 2,
  unlockedFeatures: ["gemini-3.5-flash", "1K image synthesis"]
};

const DEFAULT_COMPLIANCE: any[] = [
  {
    id: "inspect-301",
    propertyName: "Tampa Logistics Yard Perimeter",
    inspector: "Officer K. Vance (GIBMP #8822)",
    date: "06/28/2026",
    score: 90,
    status: "compliant",
    notes: "Site chemical fertilizer containment rules meet all state standards. Proximity buffers safely secured.",
    checklist: {
      fertilizerRules: true,
      runoffMitigation: true,
      pesticideStorage: true,
      bufferZones: true,
      irrigationSchedule: false,
      hazardousDisposal: true
    }
  },
  {
    id: "inspect-302",
    propertyName: "Everglades Marine Compound",
    inspector: "Inspector A. Chen (GIBMP #9410)",
    date: "06/25/2026",
    score: 50,
    status: "non-compliant",
    notes: "Pesticide storage unit is poorly ventilated. Drainage runoff paths lead too close to critical wetlands buffers.",
    checklist: {
      fertilizerRules: false,
      runoffMitigation: false,
      pesticideStorage: false,
      bufferZones: true,
      irrigationSchedule: false,
      hazardousDisposal: true
    }
  }
];

const DEFAULT_WORK_ORDERS: any[] = [];

interface FullState {
  devices: Device[];
  alerts: SecurityAlert[];
  aiEvents: AIEvent[];
  billing: BillingConfig;
  compliance?: any[];
  workOrders?: any[];
}

// Read/write from local file fallback
function getFallbackState(): FullState {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const data = fs.readFileSync(FALLBACK_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read fallback file state", err);
  }
  
  const defaultState: FullState = {
    devices: DEFAULT_DEVICES,
    alerts: DEFAULT_ALERTS,
    aiEvents: DEFAULT_AI_EVENTS,
    billing: DEFAULT_BILLING,
    compliance: DEFAULT_COMPLIANCE,
    workOrders: DEFAULT_WORK_ORDERS
  };
  saveFallbackState(defaultState);
  return defaultState;
}

function saveFallbackState(state: FullState) {
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write fallback file state", err);
  }
}

// Helpers for Drizzle organization ID
async function getOrCreateOrgId(): Promise<string> {
  const defaultOrgUuid = "00000000-0000-0000-0000-000000000000";
  if (!db) return defaultOrgUuid;
  try {
    const existing = await db.select().from(organizations).limit(1);
    if (existing.length > 0) {
      return existing[0].id;
    }
    const created = await db.insert(organizations).values({
      id: defaultOrgUuid,
      name: "Tampa Secure CommandCenter"
    }).returning();
    return created[0].id;
  } catch (e) {
    return defaultOrgUuid;
  }
}

export const dbClient = {
  // === Devices Operations ===
  async getDevices(organizationId?: string): Promise<Device[]> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    if (!db) {
      const state = getFallbackState();
      state.devices.forEach(d => {
        if (!(d as any).organizationId) (d as any).organizationId = "00000000-0000-0000-0000-000000000000";
      });
      return state.devices.filter(d => (d as any).organizationId === orgId);
    }
    try {
      const rows = await db.select().from(devices).where(eq(devices.organizationId, orgId));

      if (rows.length === 0) {
        // Seed database for organization
        await db.insert(devices).values(
          DEFAULT_DEVICES.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            status: d.status,
            battery: d.battery || null,
            signal: d.signal,
            latitude: d.latitude,
            longitude: d.longitude,
            lastActive: d.lastActive,
            sirenOn: d.sirenOn || false,
            lightOn: d.lightOn || false,
            recording: d.recording || false,
            speed: d.speed || null,
            licensePlate: d.licensePlate || null,
            driverName: d.driverName || null,
            organizationId: orgId
          }))
        );
        return DEFAULT_DEVICES.map(d => ({ ...d, organizationId: orgId } as any));
      }
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type as "camera" | "vehicle",
        status: r.status as "online" | "offline" | "alerting",
        battery: r.battery ?? undefined,
        signal: r.signal as any,
        latitude: r.latitude,
        longitude: r.longitude,
        lastActive: r.lastActive,
        sirenOn: r.sirenOn ?? undefined,
        lightOn: r.lightOn ?? undefined,
        recording: r.recording ?? undefined,
        speed: r.speed ?? undefined,
        licensePlate: r.licensePlate ?? undefined,
        driverName: r.driverName ?? undefined,
        organizationId: r.organizationId || undefined
      }));
    } catch (err) {
      console.warn("DB getDevices failed, falling back", err);
      return getFallbackState().devices.filter(d => !(d as any).organizationId || (d as any).organizationId === orgId);
    }
  },

  async addDevice(device: Device, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    const withOrg = { ...device, organizationId: orgId };
    if (!state.devices.some(d => d.id === device.id)) {
      state.devices.push(withOrg as any);
      saveFallbackState(state);
    } else {
      state.devices = state.devices.map(d => d.id === device.id ? (withOrg as any) : d);
      saveFallbackState(state);
    }

    if (!db) return;
    try {
      await db.insert(devices).values({
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        battery: device.battery || null,
        signal: device.signal,
        latitude: device.latitude,
        longitude: device.longitude,
        lastActive: device.lastActive,
        sirenOn: device.sirenOn || false,
        lightOn: device.lightOn || false,
        recording: device.recording || false,
        speed: device.speed || null,
        licensePlate: device.licensePlate || null,
        driverName: device.driverName || null,
        organizationId: orgId
      });
    } catch (err) {
      console.warn("DB addDevice failed", err);
    }
  },

  async updateDevice(id: string, updatedFields: Partial<Device>, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    state.devices = state.devices.map(d => d.id === id ? { ...d, ...updatedFields, organizationId: orgId } : d);
    saveFallbackState(state);

    if (!db) return;
    try {
      const condition = and(eq(devices.id, id), eq(devices.organizationId, orgId));

      await db.update(devices)
        .set({
          name: updatedFields.name,
          status: updatedFields.status,
          battery: updatedFields.battery !== undefined ? updatedFields.battery : undefined,
          signal: updatedFields.signal,
          latitude: updatedFields.latitude !== undefined ? updatedFields.latitude : undefined,
          longitude: updatedFields.longitude !== undefined ? updatedFields.longitude : undefined,
          lastActive: updatedFields.lastActive,
          sirenOn: updatedFields.sirenOn !== undefined ? updatedFields.sirenOn : undefined,
          lightOn: updatedFields.lightOn !== undefined ? updatedFields.lightOn : undefined,
          recording: updatedFields.recording !== undefined ? updatedFields.recording : undefined,
          speed: updatedFields.speed !== undefined ? updatedFields.speed : undefined,
          licensePlate: updatedFields.licensePlate,
          driverName: updatedFields.driverName
        })
        .where(condition);
    } catch (err) {
      console.warn("DB updateDevice failed", err);
    }
  },

  async deleteDevice(id: string, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    state.devices = state.devices.filter(d => d.id !== id);
    saveFallbackState(state);

    if (!db) return;
    try {
      const condition = and(eq(devices.id, id), eq(devices.organizationId, orgId));
      await db.delete(devices).where(condition);
    } catch (err) {
      console.warn("DB deleteDevice failed", err);
    }
  },

  // === Alerts Operations ===
  async getAlerts(organizationId?: string): Promise<SecurityAlert[]> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    if (!db) {
      const state = getFallbackState();
      state.alerts.forEach(a => {
        if (!(a as any).organizationId) (a as any).organizationId = "00000000-0000-0000-0000-000000000000";
      });
      return state.alerts.filter(a => (a as any).organizationId === orgId);
    }
    try {
      const rows = await db.select().from(alerts).where(eq(alerts.organizationId, orgId));
      if (rows.length === 0) {
        // Seed database
        await db.insert(alerts).values(
          DEFAULT_ALERTS.map(a => ({
            id: a.id,
            deviceId: a.deviceId,
            deviceName: a.deviceName,
            timestamp: a.timestamp,
            severity: a.severity,
            message: a.message,
            description: a.description,
            objectsDetected: a.objectsDetected,
            resolved: a.resolved,
            organizationId: orgId
          }))
        );
        return DEFAULT_ALERTS.map(a => ({ ...a, organizationId: orgId } as any));
      }
      return rows.map(r => ({
        id: r.id,
        deviceId: r.deviceId || "",
        deviceName: r.deviceName,
        timestamp: r.timestamp,
        severity: r.severity as any,
        message: r.message,
        description: r.description,
        objectsDetected: (r.objectsDetected as string[]) || [],
        resolved: r.resolved,
        organizationId: r.organizationId || undefined
      }));
    } catch (err) {
      console.warn("DB getAlerts failed, falling back", err);
      return getFallbackState().alerts.filter(a => !(a as any).organizationId || (a as any).organizationId === orgId);
    }
  },

  async addAlert(alert: SecurityAlert, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    const withOrg = { ...alert, organizationId: orgId };
    state.alerts = [withOrg as any, ...state.alerts];
    saveFallbackState(state);

    if (!db) return;
    try {
      await db.insert(alerts).values({
        id: alert.id,
        deviceId: alert.deviceId,
        deviceName: alert.deviceName,
        timestamp: alert.timestamp,
        severity: alert.severity,
        message: alert.message,
        description: alert.description,
        objectsDetected: alert.objectsDetected,
        resolved: alert.resolved,
        organizationId: orgId
      });
    } catch (err) {
      console.warn("DB addAlert failed", err);
    }
  },

  async updateAlert(id: string, updatedFields: Partial<SecurityAlert>, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    state.alerts = state.alerts.map(a => a.id === id ? { ...a, ...updatedFields, organizationId: orgId } : a);
    saveFallbackState(state);

    if (!db) return;
    try {
      const condition = and(eq(alerts.id, id), eq(alerts.organizationId, orgId));
      await db.update(alerts)
        .set({
          resolved: updatedFields.resolved !== undefined ? updatedFields.resolved : undefined,
          severity: updatedFields.severity,
          message: updatedFields.message,
          description: updatedFields.description
        })
        .where(condition);
    } catch (err) {
      console.warn("DB updateAlert failed", err);
    }
  },

  // === AI Machine Vision Events ===
  async getAIEvents(organizationId?: string): Promise<AIEvent[]> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    if (!db) {
      const state = getFallbackState();
      state.aiEvents.forEach(e => {
        if (!(e as any).organizationId) (e as any).organizationId = "00000000-0000-0000-0000-000000000000";
      });
      return state.aiEvents.filter(e => (e as any).organizationId === orgId);
    }
    try {
      const rows = await db.select().from(aiEvents).where(eq(aiEvents.organizationId, orgId));
      if (rows.length === 0) {
        // Seed database
        await db.insert(aiEvents).values(
          DEFAULT_AI_EVENTS.map(e => ({
            deviceId: e.deviceId,
            imageUrl: e.imageUrl,
            prompt: e.prompt,
            threatLevel: e.threatLevel,
            description: e.description,
            objectsDetected: e.objectsDetected,
            boundingBoxes: e.boundingBoxes,
            organizationId: orgId
          }))
        );
        // Re-read with actual IDs
        const seeded = await db.select().from(aiEvents).where(eq(aiEvents.organizationId, orgId));
        return seeded.map(r => ({
          id: r.id,
          deviceId: r.deviceId || "",
          deviceName: DEFAULT_DEVICES.find(d => d.id === r.deviceId)?.name || "Secure Endpoint",
          imageUrl: r.imageUrl,
          prompt: r.prompt || "",
          threatLevel: r.threatLevel as any,
          description: r.description,
          objectsDetected: (r.objectsDetected as string[]) || [],
          boundingBoxes: (r.boundingBoxes as any[]) || undefined,
          timestamp: r.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric" }) + " AM",
          resolved: (r as any).resolved || false,
          organizationId: r.organizationId || undefined
        }));
      }
      return rows.map(r => ({
        id: r.id,
        deviceId: r.deviceId || "",
        deviceName: DEFAULT_DEVICES.find(d => d.id === r.deviceId)?.name || "Surveillance Stream",
        imageUrl: r.imageUrl,
        prompt: r.prompt || "",
        threatLevel: r.threatLevel as any,
        description: r.description,
        objectsDetected: (r.objectsDetected as string[]) || [],
        boundingBoxes: (r.boundingBoxes as any[]) || undefined,
        timestamp: r.timestamp ? r.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true }) : "Just now",
        resolved: (r as any).resolved || false,
        organizationId: r.organizationId || undefined
      }));
    } catch (err) {
      console.warn("DB getAIEvents failed, falling back", err);
      return getFallbackState().aiEvents.filter(e => !(e as any).organizationId || (e as any).organizationId === orgId);
    }
  },

  async addAIEvent(event: AIEvent, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    const withOrg = { ...event, organizationId: orgId };
    state.aiEvents = [withOrg as any, ...state.aiEvents];
    saveFallbackState(state);

    if (!db) return;
    try {
      await db.insert(aiEvents).values({
        deviceId: event.deviceId,
        imageUrl: event.imageUrl,
        prompt: event.prompt,
        threatLevel: event.threatLevel,
        description: event.description,
        objectsDetected: event.objectsDetected,
        boundingBoxes: event.boundingBoxes,
        organizationId: orgId
      });
    } catch (err) {
      console.warn("DB addAIEvent failed", err);
    }
  },

  async updateAIEvent(id: string, resolved: boolean, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    state.aiEvents = state.aiEvents.map(e => e.id === id ? { ...e, resolved, organizationId: orgId } : e);
    saveFallbackState(state);
  },

  // === Billing Configuration Operations ===
  async getBillingConfig(organizationId?: string): Promise<BillingConfig> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    if (!db) {
      return getFallbackState().billing;
    }
    try {
      const rows = await db.select().from(billingConfigs).where(eq(billingConfigs.organizationId, orgId));
      if (rows.length === 0) {
        // Seed billing configuration for organization
        await db.insert(billingConfigs).values({
          organizationId: orgId,
          tierName: DEFAULT_BILLING.tierName,
          price: DEFAULT_BILLING.price,
          maxCameras: DEFAULT_BILLING.maxCameras,
          maxVehicles: DEFAULT_BILLING.maxVehicles,
          maxProperties: DEFAULT_BILLING.maxProperties,
          unlockedFeatures: DEFAULT_BILLING.unlockedFeatures
        });
        return DEFAULT_BILLING;
      }
      return {
        tierName: rows[0].tierName as any,
        price: rows[0].price,
        maxCameras: rows[0].maxCameras,
        maxVehicles: rows[0].maxVehicles,
        maxProperties: rows[0].maxProperties,
        unlockedFeatures: (rows[0].unlockedFeatures as string[]) || []
      };
    } catch (err) {
      console.warn("DB getBillingConfig failed, falling back", err);
      return getFallbackState().billing;
    }
  },

  async updateBillingConfig(config: BillingConfig, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    state.billing = config;
    saveFallbackState(state);

    if (!db) return;
    try {
      // Try to update or insert if not exists
      const existing = await db.select().from(billingConfigs).where(eq(billingConfigs.organizationId, orgId));
      if (existing.length > 0) {
        await db.update(billingConfigs)
          .set({
            tierName: config.tierName,
            price: config.price,
            maxCameras: config.maxCameras,
            maxVehicles: config.maxVehicles,
            maxProperties: config.maxProperties,
            unlockedFeatures: config.unlockedFeatures
          })
          .where(eq(billingConfigs.organizationId, orgId));
      } else {
        await db.insert(billingConfigs).values({
          organizationId: orgId,
          tierName: config.tierName,
          price: config.price,
          maxCameras: config.maxCameras,
          maxVehicles: config.maxVehicles,
          maxProperties: config.maxProperties,
          unlockedFeatures: config.unlockedFeatures
        });
      }
    } catch (err) {
      console.warn("DB updateBillingConfig failed", err);
    }
  },

  async getComplianceRecords(organizationId?: string): Promise<any[]> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    if (!db) {
      const state = getFallbackState();
      const records = state.compliance || [];
      records.forEach(r => {
        if (!(r as any).organizationId) (r as any).organizationId = "00000000-0000-0000-0000-000000000000";
      });
      return records.filter(r => (r as any).organizationId === orgId);
    }
    try {
      const rows = await db.select().from(complianceRecords).where(eq(complianceRecords.organizationId, orgId));
      if (rows.length === 0) {
        // Seed the compliance records table
        await db.insert(complianceRecords).values(
          DEFAULT_COMPLIANCE.map(r => ({
            id: r.id,
            propertyName: r.propertyName,
            inspector: r.inspector,
            date: r.date,
            score: r.score,
            status: r.status,
            notes: r.notes,
            checklist: r.checklist,
            organizationId: orgId
          }))
        );
        return DEFAULT_COMPLIANCE.map(r => ({ ...r, organizationId: orgId }));
      }
      return rows.map(r => ({
        id: r.id,
        propertyName: r.propertyName,
        inspector: r.inspector,
        date: r.date,
        score: r.score,
        status: r.status as any,
        notes: r.notes || "",
        checklist: r.checklist as any,
        organizationId: r.organizationId || undefined
      }));
    } catch (err) {
      console.warn("DB getComplianceRecords failed, falling back", err);
      const records = getFallbackState().compliance || [];
      return records.filter(r => !(r as any).organizationId || (r as any).organizationId === orgId);
    }
  },

  async addComplianceRecord(record: any, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    const withOrg = { ...record, organizationId: orgId };
    state.compliance = [...(state.compliance || []), withOrg];
    saveFallbackState(state);

    if (!db) return;
    try {
      await db.insert(complianceRecords).values({
        id: record.id,
        propertyName: record.propertyName,
        inspector: record.inspector,
        date: record.date,
        score: record.score,
        status: record.status,
        notes: record.notes,
        checklist: record.checklist,
        organizationId: orgId
      });
    } catch (err) {
      console.warn("DB addComplianceRecord failed", err);
    }
  },

  async getWorkOrders(organizationId?: string): Promise<any[]> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    if (!db) {
      const state = getFallbackState();
      const orders = state.workOrders || [];
      orders.forEach(o => {
        if (!(o as any).organizationId) (o as any).organizationId = "00000000-0000-0000-0000-000000000000";
      });
      return orders.filter(o => (o as any).organizationId === orgId);
    }
    try {
      const rows = await db.select().from(workOrders).where(eq(workOrders.organizationId, orgId));
      return rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description || "",
        status: r.status,
        priority: r.priority,
        assignedTo: r.assignedTo || "",
        complianceRecordId: r.complianceRecordId || "",
        dueDate: r.dueDate || "",
        createdAt: r.createdAt ? r.createdAt.toISOString() : undefined,
        organizationId: r.organizationId || undefined
      }));
    } catch (err) {
      console.warn("DB getWorkOrders failed, falling back", err);
      const orders = getFallbackState().workOrders || [];
      return orders.filter(o => !(o as any).organizationId || (o as any).organizationId === orgId);
    }
  },

  async addWorkOrder(order: any, organizationId?: string): Promise<void> {
    const orgId = organizationId || (await getOrganizationId()) || "00000000-0000-0000-0000-000000000000";
    const state = getFallbackState();
    const withOrg = { ...order, organizationId: orgId };
    state.workOrders = [...(state.workOrders || []), withOrg];
    saveFallbackState(state);

    if (!db) return;
    try {
      await db.insert(workOrders).values({
        id: order.id && order.id.includes("-") ? order.id : undefined, // Will use db auto uuid if invalid format
        title: order.title,
        description: order.description,
        status: order.status || "pending",
        priority: order.priority || "medium",
        assignedTo: order.assignedTo,
        complianceRecordId: order.complianceRecordId,
        dueDate: order.dueDate,
        organizationId: orgId
      });
    } catch (err) {
      console.warn("DB addWorkOrder failed", err);
    }
  }
};
