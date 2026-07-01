import { z } from "zod";

// Device validation
export const deviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2).max(100),
  type: z.enum(["camera", "vehicle"]),
  status: z.enum(["online", "offline", "alerting"]).optional(),
  battery: z.number().min(0).max(100).optional(),
  signal: z.enum(["excellent", "good", "fair", "weak"]),
  latitude: z.number(),
  longitude: z.number(),
  sirenOn: z.boolean().optional(),
  lightOn: z.boolean().optional(),
  recording: z.boolean().optional(),
  speed: z.number().optional(),
  licensePlate: z.string().max(20).optional(),
  driverName: z.string().max(100).optional(),
});

// Alert validation
export const alertSchema = z.object({
  id: z.string().optional(),
  deviceId: z.string(),
  deviceName: z.string(),
  timestamp: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  message: z.string().min(3).max(200),
  description: z.string().min(5),
  objectsDetected: z.array(z.string()),
  resolved: z.boolean().optional(),
});

// AI Event validation
export const aiEventSchema = z.object({
  deviceId: z.string(),
  imageUrl: z.string().url().or(z.string().startsWith("data:")),
  prompt: z.string().optional(),
  threatLevel: z.enum(["low", "medium", "high", "critical", "none"]),
  description: z.string(),
  objectsDetected: z.array(z.string()),
  boundingBoxes: z.array(z.object({
    label: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  })).optional(),
  resolved: z.boolean().optional(),
});

// Billing config validation
export const billingConfigSchema = z.object({
  tierName: z.enum(["Free", "Starter", "Professional", "Enterprise"]),
  price: z.string(),
  maxCameras: z.number().min(0),
  maxVehicles: z.number().min(0),
  maxProperties: z.number().min(0),
  unlockedFeatures: z.array(z.string()),
});

// Compliance record validation
export const complianceSchema = z.object({
  id: z.string().optional(),
  propertyName: z.string().min(3),
  inspector: z.string(),
  date: z.string(),
  score: z.number().min(0).max(100),
  status: z.enum(["compliant", "warning", "non-compliant"]),
  notes: z.string().optional(),
  checklist: z.object({
    fertilizerRules: z.boolean(),
    runoffMitigation: z.boolean(),
    pesticideStorage: z.boolean(),
    bufferZones: z.boolean(),
    irrigationSchedule: z.boolean(),
    hazardousDisposal: z.boolean(),
  }),
});

// AI Analyze request
export const aiAnalyzeSchema = z.object({
  image: z.string(),
  prompt: z.string().optional(),
  model: z.string().optional(),
  selectedDevice: z.string().optional(),
  selectedDeviceName: z.string().optional(),
});

// Image generation request
export const generateImageSchema = z.object({
  prompt: z.string().min(5),
  aspectRatio: z.string().optional(),
  imageSize: z.string().optional(),
  model: z.string().optional(),
});

// Work Order validation
export const workOrderSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(150),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  assignedTo: z.string().optional(),
  complianceRecordId: z.string().optional(),
  dueDate: z.string(),
});
