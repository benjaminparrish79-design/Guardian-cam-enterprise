"use client";

import React, { useState, useEffect } from "react";
import { Device, SecurityAlert, ComplianceRecord, GeneratedScenario, BillingConfig, AIEvent } from "../types";
import CommandCenter from "../components/CommandCenter";
import DeviceManager from "../components/DeviceManager";
import IntelligenceHub from "../components/IntelligenceHub";
import ScenarioSynthesizer from "../components/ScenarioSynthesizer";
import FleetTracker from "../components/FleetTracker";
import ComplianceHub from "../components/ComplianceHub";
import BillingSettings from "../components/BillingSettings";
import { 
  ShieldCheck, 
  Server, 
  Cpu, 
  Image as ImageIcon, 
  Globe, 
  FileCheck, 
  CreditCard,
  Radio,
  Clock,
  Lock,
  User,
  LogOut,
  Building,
  Key,
  ShieldAlert
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

const INITIAL_DEVICES: Device[] = [
  { id: "cam-01", name: "Gate West Barrier Cam", type: "camera", status: "online", battery: 92, signal: "excellent", lastActive: "Just now", latitude: 27.9506, longitude: -82.4572, sirenOn: false, lightOn: false, recording: true },
  { id: "cam-02", name: "Hazmat Storage Cam", type: "camera", status: "online", battery: 84, signal: "good", lastActive: "2 min ago", latitude: 27.9495, longitude: -82.4585, sirenOn: false, lightOn: false, recording: true },
  { id: "cam-03", name: "Loading Dock Cam", type: "camera", status: "online", battery: 78, signal: "excellent", lastActive: "Just now", latitude: 27.9515, longitude: -82.4552, sirenOn: false, lightOn: false, recording: false },
  { id: "cam-04", name: "Visitor Lobby Cam", type: "camera", status: "online", battery: 100, signal: "good", lastActive: "5 min ago", latitude: 27.9520, longitude: -82.4560, sirenOn: false, lightOn: false, recording: true },
  { id: "patrol-01", name: "Patrol Alpha Cruiser", type: "vehicle", status: "online", signal: "excellent", lastActive: "Just now", latitude: 27.9480, longitude: -82.4590, speed: 22, licensePlate: "FL-GC1A", driverName: "Officer K. Vance" },
  { id: "patrol-02", name: "Patrol Bravo Rapid Response", type: "vehicle", status: "online", signal: "good", lastActive: "Just now", latitude: 27.9530, longitude: -82.4540, speed: 12, licensePlate: "FL-GC2B", driverName: "Officer J. Alvarez" }
];

const INITIAL_ALERTS: SecurityAlert[] = [
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

const INITIAL_AI_EVENTS: AIEvent[] = [
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

const INITIAL_COMPLIANCE: ComplianceRecord[] = [
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

const INITIAL_SCENARIOS: GeneratedScenario[] = [
  {
    id: "scen-1",
    prompt: "A suspicious character wearing a dark hoodie scaling a chainlink security fence line, night vision infrared, green thermal visual overlay",
    aspectRatio: "16:9",
    imageSize: "1K",
    imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=600&h=340",
    model: "gemini-3.1-flash-image",
    timestamp: "11:02 AM"
  }
];

export interface AuthUser {
  email: string;
  role: "admin" | "operator" | "inspector";
  organization: string;
}

export default function Home() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"command" | "devices" | "vision" | "scenarios" | "fleet" | "compliance" | "billing">("command");
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(INITIAL_ALERTS);
  const [aiEvents, setAiEvents] = useState<AIEvent[]>(INITIAL_AI_EVENTS);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>(INITIAL_COMPLIANCE);
  const [scenarios, setScenarios] = useState<GeneratedScenario[]>(INITIAL_SCENARIOS);
  
  const [billingConfig, setBillingConfig] = useState<BillingConfig>({
    tierName: "Starter",
    price: "$99/mo",
    maxCameras: 5,
maxVehicles: 2,
    maxProperties: 2,
    unlockedFeatures: ["gemini-3.5-flash", "1K image synthesis"]
  });

  const [isDemoMode, setIsDemoMode] = useState(true);
  const [globalSirenActive, setGlobalSirenActive] = useState(false);
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Fetch API key configurations and database-backed data on boot, and restore auth session
  useEffect(() => {
    // Check localStorage session first
    const savedSession = localStorage.getItem("guardian_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        // Default active tab based on role
        if (parsed.role === "inspector") {
          setActiveTab("compliance");
        } else {
          setActiveTab("command");
        }
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }

    // Load API configuration
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setApiKeyLoaded(data.apiKeyLoaded);
        // If real API key is loaded, we turn off demo mode by default so they use real Gemini models!
        if (data.apiKeyLoaded) {
          setIsDemoMode(false);
        }
      })
      .catch((err) => console.log("Failed to contact server config API", err));

    // Load persistent devices from Database
    fetch("/api/devices")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDevices(data);
        }
      })
      .catch((err) => console.error("Failed to load devices from DB", err));

    // Load persistent alerts from Database
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAlerts(data);
        }
      })
      .catch((err) => console.error("Failed to load alerts from DB", err));

    // Load persistent machine vision AI events from Database
    fetch("/api/ai-events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAiEvents(data);
        }
      })
      .catch((err) => console.error("Failed to load AI events from DB", err));

    // Load persistent billing configuration from Database
    fetch("/api/billing")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setBillingConfig(data);
        }
      })
      .catch((err) => console.error("Failed to load billing configuration from DB", err));

    // Load persistent GIBMP compliance records from Database
    fetch("/api/compliance")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setComplianceRecords(data);
        }
      })
      .catch((err) => console.error("Failed to load compliance records from DB", err));

    // Dynamic clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString() + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSupabaseSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Email and password are required.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else if (data?.user) {
          // Infer user role by email keyword
          let role: "admin" | "operator" | "inspector" = "admin";
          if (authEmail.includes("operator")) role = "operator";
          if (authEmail.includes("inspector")) role = "inspector";
          
          const loggedUser: AuthUser = {
            email: data.user.email || authEmail,
            role: role,
            organization: "Supabase Cloud Tenant"
          };
          setUser(loggedUser);
          localStorage.setItem("guardian_session", JSON.stringify(loggedUser));
          if (role === "inspector") {
            setActiveTab("compliance");
          } else {
            setActiveTab("command");
          }
        }
      } else {
        // Fallback/Simulated sign in if Supabase config is empty
        let role: "admin" | "operator" | "inspector" = "admin";
        if (authEmail.includes("operator")) role = "operator";
        if (authEmail.includes("inspector")) role = "inspector";

        const loggedUser: AuthUser = {
          email: authEmail,
          role: role,
          organization: "Local Sandbox Tenant"
        };
        setUser(loggedUser);
        localStorage.setItem("guardian_session", JSON.stringify(loggedUser));
        if (role === "inspector") {
          setActiveTab("compliance");
        } else {
          setActiveTab("command");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBypassLogin = (role: "admin" | "operator" | "inspector") => {
    let email = "admin@guardiancam.com";
    let org = "Tampa Command Depot #1";
    if (role === "operator") {
      email = "operator@guardiancam.com";
      org = "Tampa Logistics Fleet Hub";
    } else if (role === "inspector") {
      email = "inspector@green-guard.gov";
      org = "Florida GreenGuard Compliance Division";
    }

    const loggedUser: AuthUser = {
      email,
      role,
      organization: org
    };
    setUser(loggedUser);
    localStorage.setItem("guardian_session", JSON.stringify(loggedUser));
    if (role === "inspector") {
      setActiveTab("compliance");
    } else {
      setActiveTab("command");
    }
  };

  const handleSignOut = () => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        supabase.auth.signOut();
      }
    } catch (e) {
      console.warn("Supabase signout call skipped", e);
    }
    setUser(null);
    localStorage.removeItem("guardian_session");
    setAuthEmail("");
    setAuthPassword("");
    setActiveTab("command");
  };

  // Tactical device control toggling
  const handleToggleControl = (id: string, controlType: "siren" | "light" | "recording") => {
    let updatedDev: Device | null = null;
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d };
        if (controlType === "siren") updated.sirenOn = !d.sirenOn;
        if (controlType === "light") updated.lightOn = !d.lightOn;
        if (controlType === "recording") updated.recording = !d.recording;
        updatedDev = updated;
        return updated;
      })
    );

    if (updatedDev) {
      fetch("/api/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDev)
      }).catch((err) => console.error("Failed to persist device control state in DB", err));
    }
  };

  const handleAddDevice = (newDevice: Omit<Device, "id" | "status" | "lastActive">) => {
    const id = `${newDevice.type === "camera" ? "cam" : "patrol"}-${Math.floor(Math.random() * 900) + 100}`;
    const deviceToCreate: Device = {
      ...newDevice,
      id,
      status: "online",
      lastActive: "Just now",
      battery: newDevice.type === "camera" ? 100 : undefined
    };

    setDevices((prev) => [...prev, deviceToCreate]);

    fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deviceToCreate)
    }).catch((err) => console.error("Failed to add device to DB", err));
  };

  const handleRemoveDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));

    fetch(`/api/devices?id=${id}`, {
      method: "DELETE"
    }).catch((err) => console.error("Failed to delete device from DB", err));
  };

  const handleUpdateDevice = (id: string, updatedFields: Partial<Device>) => {
    let updatedDev: Device | null = null;
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          updatedDev = { ...d, ...updatedFields };
          return updatedDev;
        }
        return d;
      })
    );

    if (updatedDev) {
      fetch("/api/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDev)
      }).catch((err) => console.error("Failed to update device in DB", err));
    }
  };

  const handleTriggerAlert = (newAlert: SecurityAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    
    // Auto-create a corresponding machine vision AI event
    const newAiEvent: AIEvent = {
      id: `ai-evt-${Math.floor(Math.random() * 900000) + 100000}`,
      deviceId: newAlert.deviceId,
      deviceName: newAlert.deviceName,
      imageUrl: newAlert.severity === "high" 
        ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=400" // Intruder
        : newAlert.severity === "critical"
        ? "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&q=80&w=600&h=400" // Fire
        : "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600&h=400", // Vehicle/Other
      prompt: "Ingest automatic computer vision sweep for threat triggers.",
      threatLevel: newAlert.severity,
      description: newAlert.description,
      objectsDetected: newAlert.objectsDetected,
      boundingBoxes: newAlert.boundingBoxes,
      timestamp: newAlert.timestamp,
      resolved: false
    };
    setAiEvents((prev) => [newAiEvent, ...prev]);

    // Set device state to Alerting
    let updatedDev: Device | null = null;
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === newAlert.deviceId) {
          updatedDev = { ...d, status: "alerting" };
          return updatedDev;
        }
        return d;
      })
    );

    // Save alert to DB
    fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAlert)
    }).catch((err) => console.error("Failed to trigger alert in DB", err));

    // Save AI Ingestion Event to DB
    fetch("/api/ai-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAiEvent)
    }).catch((err) => console.error("Failed to add AI Event in DB", err));

    // Save Device Alerting status to DB
    if (updatedDev) {
      fetch("/api/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDev)
      }).catch((err) => console.error("Failed to sync device alerting state in DB", err));
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
    // Find device linked to alert and restore status to online
    const targetAlert = alerts.find((a) => a.id === alertId);
    if (targetAlert) {
      let updatedDev: Device | null = null;
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === targetAlert.deviceId) {
            updatedDev = { ...d, status: "online" };
            return updatedDev;
          }
          return d;
        })
      );
      // Auto-resolve corresponding AI event
      setAiEvents((prev) =>
        prev.map((e) => (e.deviceId === targetAlert.deviceId ? { ...e, resolved: true } : e))
      );

      // Squelch / Resolve alert in DB
      fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, resolved: true })
      }).catch((err) => console.error("Failed to resolve alert in DB", err));

      // Restore device online in DB
      if (updatedDev) {
        fetch("/api/devices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDev)
        }).catch((err) => console.error("Failed to restore device status in DB", err));
      }

      // Resolve AI ingestion event if exists
      const relatedAiEvent = aiEvents.find((e) => e.deviceId === targetAlert.deviceId);
      if (relatedAiEvent) {
        fetch("/api/ai-events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: relatedAiEvent.id, resolved: true })
        }).catch((err) => console.error("Failed to resolve corresponding AI event in DB", err));
      }
    }
  };

  const handleResolveAIEvent = (eventId: string) => {
    setAiEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, resolved: true } : e))
    );
    // Auto-resolve corresponding alert
    const targetEvent = aiEvents.find((e) => e.id === eventId);
    if (targetEvent) {
      setAlerts((prev) =>
        prev.map((a) => (a.deviceId === targetEvent.deviceId ? { ...a, resolved: true } : a))
      );
      let updatedDev: Device | null = null;
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === targetEvent.deviceId) {
            updatedDev = { ...d, status: "online" };
            return updatedDev;
          }
          return d;
        })
      );

      // Save AI Event resolution to DB
      fetch("/api/ai-events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, resolved: true })
      }).catch((err) => console.error("Failed to resolve AI event in DB", err));

      // Save Alert resolution to DB
      const correspondingAlert = alerts.find((a) => a.deviceId === targetEvent.deviceId);
      if (correspondingAlert) {
        fetch("/api/alerts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: correspondingAlert.id, resolved: true })
        }).catch((err) => console.error("Failed to resolve corresponding alert in DB", err));
      }

      // Save Device status to DB
      if (updatedDev) {
        fetch("/api/devices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDev)
        }).catch((err) => console.error("Failed to restore device status in DB", err));
      }
    }
  };

  const handleAddRecord = (newRecord: ComplianceRecord) => {
    setComplianceRecords((prev) => [newRecord, ...prev]);

    fetch("/api/compliance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecord)
    }).catch((err) => console.error("Failed to save compliance record in DB", err));
  };

  const handleAddScenario = (newScenario: GeneratedScenario) => {
    setScenarios((prev) => [newScenario, ...prev]);
  };

  // Simulate Stripe Webhook callback changes limits and save to database
  const handleUpgradePlan = (planName: "Free" | "Starter" | "Professional" | "Enterprise") => {
    let maxCameras = 2;
    let maxVehicles = 1;
    let maxProperties = 1;
    let price = "$0";

    if (planName === "Starter") {
      maxCameras = 5;
      maxVehicles = 2;
      maxProperties = 2;
      price = "$99/mo";
    } else if (planName === "Professional") {
      maxCameras = 15;
      maxVehicles = 5;
      maxProperties = 5;
      price = "$299/mo";
    } else if (planName === "Enterprise") {
      maxCameras = 100;
      maxVehicles = 25;
      maxProperties = 20;
      price = "$999/mo";
    }

    const nextConfig: BillingConfig = {
      tierName: planName,
      price,
      maxCameras,
      maxVehicles,
      maxProperties,
      unlockedFeatures: planName === "Enterprise" ? ["all models", "4K image synthesis"] : ["standard"]
    };

    setBillingConfig(nextConfig);

    // Save Billing Configuration & Limits to DB
    fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextConfig)
    }).catch((err) => console.error("Failed to upgrade plan in database", err));
  };

  const handleTriggerGlobalSiren = () => {
    const nextState = !globalSirenActive;
    setGlobalSirenActive(nextState);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === "camera") {
          const updated = { ...d, sirenOn: nextState, status: nextState ? ("alerting" as const) : ("online" as const) };
          // Fire individual device update call to DB
          fetch("/api/devices", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated)
          }).catch((err) => console.error("Failed to update global siren on device in DB", err));
          return updated;
        }
        return d;
      })
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
        {/* Visual top lighting glow line */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-red-500 w-full" />
        
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.04),transparent_50%)]" />
          
          <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-3 bg-slate-950 text-emerald-400 rounded-2xl border border-slate-800 shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-100 uppercase">GuardianCam Enterprise</h2>
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono px-2.5 py-0.5 rounded tracking-widest uppercase mt-2">
                SecOps SaaS Gate
              </span>
            </div>

            {authError && (
              <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSupabaseSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">SecOps Identity (Email)</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="operator@guardiancam.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Operational Secret (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
              >
                {authLoading ? "Initializing credentials..." : "ENGAGE SECURE ACCESS"}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-slate-900 px-3 text-slate-500">Demo Access Passes</span></div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => handleBypassLogin("admin")}
                className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 py-2 rounded-lg text-xs font-semibold flex items-center justify-between px-4 transition-all duration-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SecOps System Administrator</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500">FULL ACCESS</span>
              </button>

              <button
                onClick={() => handleBypassLogin("operator")}
                className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 py-2 rounded-lg text-xs font-semibold flex items-center justify-between px-4 transition-all duration-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Command Center Operator</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500">OPERATIONS ONLY</span>
              </button>

              <button
                onClick={() => handleBypassLogin("inspector")}
                className="w-full bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-400 border border-yellow-500/20 hover:border-yellow-500/40 py-2 rounded-lg text-xs font-semibold flex items-center justify-between px-4 transition-all duration-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Florida GIBMP Inspector</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500">COMPLIANCE ONLY</span>
              </button>
            </div>
          </div>
        </div>
        <footer className="border-t border-slate-900 bg-slate-950 p-4 text-center text-[10px] text-slate-600 font-mono">
          SECURE PROTOCOL 3000 &bull; GUARDIANCAM COGNITIVE INCIDENT DEFENSE ENGINE
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* Visual top lighting glow line */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-red-500 w-full" />

      {/* HEADER HUD */}
      <header className="border-b border-slate-900 bg-slate-950 p-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-100 uppercase">GuardianCam Enterprise</h1>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono px-2 py-0.5 rounded tracking-widest uppercase">
                  {user.role.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Connected: <span className="text-slate-300 font-medium">{user.organization}</span> &bull; {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* GPS Lock indicator */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-300">TRANSCEIVER OK</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-300">{currentTime || "00:00:00 UTC"}</span>
            </div>

            {/* API Secret status */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className={`w-1.5 h-1.5 rounded-full ${apiKeyLoaded ? "bg-emerald-400" : "bg-yellow-400"}`} />
              <span className="text-[10px] text-slate-400 font-mono">
                {apiKeyLoaded ? "GEMINI SECRETS ACTIVE" : "AI FALLBACK ACTIVE"}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/40 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit Gate
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* TABS NAVIGATION BAR */}
        <nav className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1 shadow-inner">
          {(user.role === "admin" || user.role === "operator") && (
            <button
              onClick={() => setActiveTab("command")}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "command"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Command Center
            </button>
          )}

          {(user.role === "admin" || user.role === "operator") && (
            <button
              onClick={() => setActiveTab("devices")}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "devices"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Server className="w-4 h-4 text-indigo-400" />
              Assets Grid
            </button>
          )}

          {(user.role === "admin" || user.role === "operator") && (
            <button
              onClick={() => setActiveTab("vision")}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "vision"
                  ? "bg-slate-800 text-slate-100 shadow animate-pulse"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              AI Vision Pipeline
            </button>
          )}

          {(user.role === "admin" || user.role === "operator") && (
            <button
              onClick={() => setActiveTab("scenarios")}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "scenarios"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Scenario Synthesizer
            </button>
          )}

          {(user.role === "admin" || user.role === "operator") && (
            <button
              onClick={() => setActiveTab("fleet")}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "fleet"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              GPS Fleet Map
            </button>
          )}

          {(user.role === "admin" || user.role === "inspector") && (
            <button
              onClick={() => setActiveTab("compliance")}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "compliance"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Florida GIBMP Checklist
            </button>
          )}

          {user.role === "admin" && (
            <button
              onClick={() => setActiveTab("billing")}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "billing"
                  ? "bg-slate-800 text-slate-100 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Plan & Billing
            </button>
          )}
        </nav>

        {/* ACTIVE TABS VIEW CONTROLLER */}
        <div className="flex-1 min-h-[500px]">
          {activeTab === "command" && (user.role === "admin" || user.role === "operator") && (
            <CommandCenter
              devices={devices}
              alerts={alerts}
              aiEvents={aiEvents}
              onResolveAlert={handleResolveAlert}
              onResolveAIEvent={handleResolveAIEvent}
              onTriggerGlobalSiren={handleTriggerGlobalSiren}
              globalSirenActive={globalSirenActive}
            />
          )}

          {activeTab === "devices" && (user.role === "admin" || user.role === "operator") && (
            <DeviceManager
              devices={devices}
              onToggleControl={handleToggleControl}
              onAddDevice={handleAddDevice}
              onRemoveDevice={handleRemoveDevice}
              onUpdateDevice={handleUpdateDevice}
              onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
              isDemoMode={isDemoMode}
              maxCameras={billingConfig.maxCameras}
              maxVehicles={billingConfig.maxVehicles}
              userRole={user.role}
            />
          )}

          {activeTab === "vision" && (user.role === "admin" || user.role === "operator") && (
            <IntelligenceHub
              devices={devices}
              onTriggerAlert={handleTriggerAlert}
              apiKeyLoaded={apiKeyLoaded}
            />
          )}

          {activeTab === "scenarios" && (user.role === "admin" || user.role === "operator") && (
            <ScenarioSynthesizer
              onAddScenario={handleAddScenario}
              scenarios={scenarios}
              apiKeyLoaded={apiKeyLoaded}
            />
          )}

          {activeTab === "fleet" && (user.role === "admin" || user.role === "operator") && (
            <FleetTracker
              vehicles={devices.filter((d) => d.type === "vehicle")}
            />
          )}

          {activeTab === "compliance" && (user.role === "admin" || user.role === "inspector") && (
            <ComplianceHub
              records={complianceRecords}
              onAddRecord={handleAddRecord}
              maxProperties={billingConfig.maxProperties}
            />
          )}

          {activeTab === "billing" && user.role === "admin" && (
            <BillingSettings
              currentConfig={billingConfig}
              onUpgradePlan={handleUpgradePlan}
              camerasCount={devices.filter((d) => d.type === "camera").length}
              vehiclesCount={devices.filter((d) => d.type === "vehicle").length}
              propertiesCount={complianceRecords.length}
            />
          )}
        </div>

      </main>

      {/* FOOTER SYSTEM MONITOR */}
      <footer className="border-t border-slate-900 bg-slate-950 p-4 text-center text-xs text-slate-500 font-mono mt-auto flex flex-col md:flex-row md:justify-between max-w-7xl mx-auto w-full gap-2">
        <span>GUARDIANCAM ENTERPRISE COMMAND &bull; ALL RIGHTS RESERVED 2026</span>
        <span className="flex items-center gap-1.5 justify-center md:justify-end text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          SYSTEM SECURE PORTAL 3000 ACTIVE
        </span>
      </footer>

    </div>
  );
}
