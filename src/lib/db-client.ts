import { db } from "@/db";
import { 
  devices, 
  alerts, 
  aiEvents, 
  billingConfigs, 
  organizations, 
  complianceRecords, 
  workOrders 
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganizationId } from "@/lib/supabase-server";

// Types
import { Device, SecurityAlert, AIEvent, BillingConfig, ComplianceRecord } from "@/types";

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

// Helper to ensure database client is connected
function getDb() {
  if (!db) {
    throw new Error("DATABASE_URL environment variable is not configured. Please supply a valid database connection string.");
  }
  return db;
}

// Helper to ensure organization exists to prevent foreign key issues
async function ensureOrgExists(orgId: string): Promise<string> {
  const database = getDb();
  try {
    const existing = await database.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (existing.length > 0) {
      return existing[0].id;
    }
    const created = await database.insert(organizations).values({
      id: orgId,
      name: "GuardianCam Secure CommandCenter"
    }).returning();
    return created[0].id;
  } catch (e) {
    console.error("ensureOrgExists failed, proceeding with default", e);
    return orgId;
  }
}

export const dbClient = {
  // === Devices Operations ===
  async getDevices(organizationId?: string): Promise<Device[]> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const rows = await database.select().from(devices).where(eq(devices.organizationId, orgId));

    if (rows.length === 0) {
      // Seed database for organization
      await database.insert(devices).values(
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
  },

  async addDevice(device: Device, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const existing = await database.select().from(devices).where(and(eq(devices.id, device.id), eq(devices.organizationId, orgId)));
    if (existing.length > 0) {
      await database.update(devices)
        .set({
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
          driverName: device.driverName || null
        })
        .where(and(eq(devices.id, device.id), eq(devices.organizationId, orgId)));
    } else {
      await database.insert(devices).values({
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
    }
  },

  async updateDevice(id: string, updatedFields: Partial<Device>, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const condition = and(eq(devices.id, id), eq(devices.organizationId, orgId));
    await database.update(devices)
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
  },

  async deleteDevice(id: string, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    const condition = and(eq(devices.id, id), eq(devices.organizationId, orgId));
    await database.delete(devices).where(condition);
  },

  // === Alerts Operations ===
  async getAlerts(organizationId?: string): Promise<SecurityAlert[]> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const rows = await database.select().from(alerts).where(eq(alerts.organizationId, orgId));
    if (rows.length === 0) {
      await database.insert(alerts).values(
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
      simulated: (r as any).simulated || false,
      organizationId: r.organizationId || undefined
    }));
  },

  async addAlert(alert: SecurityAlert, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const alertId = alert.id || `alert-${crypto.randomUUID()}`;

    const existing = await database.select().from(alerts).where(and(eq(alerts.id, alertId), eq(alerts.organizationId, orgId)));
    if (existing.length > 0) {
      await database.update(alerts)
        .set({
          deviceId: alert.deviceId,
          deviceName: alert.deviceName,
          timestamp: alert.timestamp,
          severity: alert.severity,
          message: alert.message,
          description: alert.description,
          objectsDetected: alert.objectsDetected,
          resolved: alert.resolved
        })
        .where(and(eq(alerts.id, alertId), eq(alerts.organizationId, orgId)));
    } else {
      await database.insert(alerts).values({
        id: alertId,
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
    }
  },

  async updateAlert(id: string, updatedFields: Partial<SecurityAlert>, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const condition = and(eq(alerts.id, id), eq(alerts.organizationId, orgId));
    await database.update(alerts)
      .set({
        resolved: updatedFields.resolved !== undefined ? updatedFields.resolved : undefined,
        severity: updatedFields.severity,
        message: updatedFields.message,
        description: updatedFields.description,
        objectsDetected: updatedFields.objectsDetected
      })
      .where(condition);
  },

  async deleteAlert(id: string, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    const condition = and(eq(alerts.id, id), eq(alerts.organizationId, orgId));
    await database.delete(alerts).where(condition);
  },

  // === AI Machine Vision Events ===
  async getAIEvents(organizationId?: string): Promise<AIEvent[]> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const rows = await database.select().from(aiEvents).where(eq(aiEvents.organizationId, orgId));
    if (rows.length === 0) {
      await database.insert(aiEvents).values(
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
      
      const seeded = await database.select().from(aiEvents).where(eq(aiEvents.organizationId, orgId));
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
        timestamp: r.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true }),
        resolved: (r as any).resolved || false,
        simulated: (r as any).simulated || false,
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
      simulated: (r as any).simulated || false,
      organizationId: r.organizationId || undefined
    }));
  },

  async addAIEvent(event: AIEvent, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    await database.insert(aiEvents).values({
      deviceId: event.deviceId,
      imageUrl: event.imageUrl,
      prompt: event.prompt,
      threatLevel: event.threatLevel,
      description: event.description,
      objectsDetected: event.objectsDetected,
      boundingBoxes: event.boundingBoxes,
      simulated: event.simulated || false,
      organizationId: orgId
    });
  },

  async updateAIEvent(id: string, resolved: boolean, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    // AI Events has uuid pk, let's parse or match string directly
    const condition = and(eq(aiEvents.id, id), eq(aiEvents.organizationId, orgId));
    await database.update(aiEvents)
      .set({ resolved })
      .where(condition);
  },

  async deleteAIEvent(id: string, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    const condition = and(eq(aiEvents.id, id), eq(aiEvents.organizationId, orgId));
    await database.delete(aiEvents).where(condition);
  },

  // === Billing Configuration Operations ===
  async getBillingConfig(organizationId?: string): Promise<BillingConfig> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const rows = await database.select().from(billingConfigs).where(eq(billingConfigs.organizationId, orgId));
    if (rows.length === 0) {
      await database.insert(billingConfigs).values({
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
  },

  async updateBillingConfig(config: BillingConfig, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const existing = await database.select().from(billingConfigs).where(eq(billingConfigs.organizationId, orgId));
    if (existing.length > 0) {
      await database.update(billingConfigs)
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
      await database.insert(billingConfigs).values({
        organizationId: orgId,
        tierName: config.tierName,
        price: config.price,
        maxCameras: config.maxCameras,
        maxVehicles: config.maxVehicles,
        maxProperties: config.maxProperties,
        unlockedFeatures: config.unlockedFeatures
      });
    }
  },

  // === GIBMP Compliance Operations ===
  async getComplianceRecords(organizationId?: string): Promise<any[]> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const rows = await database.select().from(complianceRecords).where(eq(complianceRecords.organizationId, orgId));
    if (rows.length === 0) {
      await database.insert(complianceRecords).values(
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
  },

  async addComplianceRecord(record: any, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const recordId = record.id || `inspect-${Math.random().toString(36).substring(2, 9)}`;

    const existing = await database.select().from(complianceRecords).where(and(eq(complianceRecords.id, recordId), eq(complianceRecords.organizationId, orgId)));
    if (existing.length > 0) {
      await database.update(complianceRecords)
        .set({
          propertyName: record.propertyName,
          inspector: record.inspector,
          date: record.date,
          score: record.score,
          status: record.status,
          notes: record.notes,
          checklist: record.checklist
        })
        .where(and(eq(complianceRecords.id, recordId), eq(complianceRecords.organizationId, orgId)));
    } else {
      await database.insert(complianceRecords).values({
        id: recordId,
        propertyName: record.propertyName,
        inspector: record.inspector,
        date: record.date,
        score: record.score,
        status: record.status,
        notes: record.notes,
        checklist: record.checklist,
        organizationId: orgId
      });
    }
  },

  async updateComplianceRecord(id: string, updatedFields: Partial<any>, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const condition = and(eq(complianceRecords.id, id), eq(complianceRecords.organizationId, orgId));
    await database.update(complianceRecords)
      .set({
        propertyName: updatedFields.propertyName,
        inspector: updatedFields.inspector,
        date: updatedFields.date,
        score: updatedFields.score,
        status: updatedFields.status,
        notes: updatedFields.notes,
        checklist: updatedFields.checklist
      })
      .where(condition);
  },

  async deleteComplianceRecord(id: string, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    const condition = and(eq(complianceRecords.id, id), eq(complianceRecords.organizationId, orgId));
    await database.delete(complianceRecords).where(condition);
  },

  // === Work Orders Operations ===
  async getWorkOrders(organizationId?: string): Promise<any[]> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const rows = await database.select().from(workOrders).where(eq(workOrders.organizationId, orgId));
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
  },

  async addWorkOrder(order: any, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    const orderId = order.id && order.id.includes("-") ? order.id : undefined;

    await database.insert(workOrders).values({
      id: orderId,
      title: order.title,
      description: order.description,
      status: order.status || "pending",
      priority: order.priority || "medium",
      assignedTo: order.assignedTo,
      complianceRecordId: order.complianceRecordId,
      dueDate: order.dueDate,
      organizationId: orgId
    });
  },

  async updateWorkOrder(id: string, updatedFields: Partial<any>, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    await ensureOrgExists(orgId);

    // uuid PK
    const condition = and(eq(workOrders.id, id), eq(workOrders.organizationId, orgId));
    await database.update(workOrders)
      .set({
        title: updatedFields.title,
        description: updatedFields.description,
        status: updatedFields.status,
        priority: updatedFields.priority,
        assignedTo: updatedFields.assignedTo,
        complianceRecordId: updatedFields.complianceRecordId,
        dueDate: updatedFields.dueDate
      })
      .where(condition);
  },

  async deleteWorkOrder(id: string, organizationId?: string): Promise<void> {
    const database = getDb();
    const orgId = organizationId || (await getOrganizationId());
    if (!orgId) {
      throw new Error("No organization context available for this operation.");
    }
    const condition = and(eq(workOrders.id, id), eq(workOrders.organizationId, orgId));
    await database.delete(workOrders).where(condition);
  }
};
