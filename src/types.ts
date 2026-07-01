export type DeviceType = "camera" | "vehicle" | "sensor";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: "online" | "offline" | "alerting";
  battery?: number; // percentage
  signal: "excellent" | "good" | "fair" | "weak";
  lastActive: string;
  latitude: number;
  longitude: number;
  sirenOn?: boolean;
  lightOn?: boolean;
  recording?: boolean;
  videoUrl?: string; // fallback mock streaming
  speed?: number; // km/h (for vehicles)
  licensePlate?: string; // (for vehicles)
  driverName?: string; // (for vehicles)
}

export interface SecurityAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  description: string;
  objectsDetected: string[];
  resolved: boolean;
  boundingBoxes?: Array<{
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

export interface InspectionChecklist {
  fertilizerRules: boolean;
  runoffMitigation: boolean;
  pesticideStorage: boolean;
  bufferZones: boolean;
  irrigationSchedule: boolean;
  hazardousDisposal: boolean;
}

export interface ComplianceRecord {
  id: string;
  propertyName: string;
  inspector: string;
  date: string;
  score: number; // 0-100 GIBMP rating
  status: "compliant" | "warning" | "non-compliant";
  notes: string;
  checklist: InspectionChecklist;
}

export interface GeneratedScenario {
  id: string;
  prompt: string;
  aspectRatio: string;
  imageSize: string;
  imageUrl: string;
  model: string;
  timestamp: string;
}

export interface BillingConfig {
  tierName: "Free" | "Starter" | "Professional" | "Enterprise";
  price: string;
  maxCameras: number;
  maxVehicles: number;
  maxProperties: number;
  unlockedFeatures: string[];
}

export interface AIEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  imageUrl: string;
  prompt: string;
  threatLevel: "low" | "medium" | "high" | "critical" | "none";
  description: string;
  objectsDetected: string[];
  boundingBoxes?: Array<{
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  timestamp: string;
  resolved: boolean;
}

