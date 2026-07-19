"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { Device, SecurityAlert, ComplianceRecord, GeneratedScenario, BillingConfig, AIEvent } from "../types";
import CommandCenter from "../components/CommandCenter";
import DeviceManager from "../components/DeviceManager";
import IntelligenceHub from "../components/IntelligenceHub";
import ScenarioSynthesizer from "../components/ScenarioSynthesizer";
import FleetTracker from "../components/FleetTracker";
import ComplianceHub from "../components/ComplianceHub";
import BillingSettings from "../components/BillingSettings";
import DashboardOverview from "../components/DashboardOverview";
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
  ShieldAlert,
  LayoutDashboard,
  Eye,
  Terminal,
  Database,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
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
  const [isRegistering, setIsRegistering] = useState(false);

  const [activeTab, setActiveTab] = useState<"dashboard" | "command" | "devices" | "vision" | "scenarios" | "fleet" | "compliance" | "billing">("dashboard");
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
  // 1. Initial setup and authentication recovery
  useEffect(() => {
    // Check localStorage session first for instant UX
    const savedSession = localStorage.getItem("guardian_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        if (parsed.role === "inspector") {
          setActiveTab("compliance");
        } else {
          setActiveTab("dashboard");
        }
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }

    // Verify and sync with server-side session
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          const loggedUser: AuthUser = {
            email: data.user.email,
            role: data.user.role,
            organization: data.user.organizationName || "Supabase Cloud Tenant"
          };
          setUser(loggedUser);
          localStorage.setItem("guardian_session", JSON.stringify(loggedUser));
          if (data.user.role === "inspector") {
            setActiveTab("compliance");
          } else {
            setActiveTab("dashboard");
          }
        }
      })
      .catch((err) => console.log("Failed to verify server-side auth state", err));

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

    // Dynamic clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString() + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // 2. Fetch data and set up subscriptions when user session is active
  useEffect(() => {
    if (!user) {
      return;
    }

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

    // Setup Supabase Realtime Subscriptions
    const supabaseClient = getSupabase();
    let devicesChannel: any;
    let alertsChannel: any;
    let aiEventsChannel: any;

    if (supabaseClient) {
      console.log("Initializing Supabase Realtime subscriptions...");

      devicesChannel = supabaseClient
        .channel("realtime-devices")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "devices" },
          (payload: any) => {
            console.log("Realtime Device Change:", payload);
            if (payload.eventType === "INSERT") {
              const newDevice = payload.new as Device;
              setDevices((prev) => {
                if (prev.some((d) => d.id === newDevice.id)) return prev;
                return [...prev, newDevice];
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedDevice = payload.new as Device;
              setDevices((prev) =>
                prev.map((d) => (d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d))
              );
            } else if (payload.eventType === "DELETE") {
              const deletedDevice = payload.old as { id: string };
              setDevices((prev) => prev.filter((d) => d.id !== deletedDevice.id));
            }
          }
        )
        .subscribe();

      alertsChannel = supabaseClient
        .channel("realtime-alerts")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "alerts" },
          (payload: any) => {
            console.log("Realtime Alert Change:", payload);
            if (payload.eventType === "INSERT") {
              const newAlert = payload.new as SecurityAlert;
              setAlerts((prev) => {
                if (prev.some((a) => a.id === newAlert.id)) return prev;
                return [newAlert, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedAlert = payload.new as SecurityAlert;
              setAlerts((prev) =>
                prev.map((a) => (a.id === updatedAlert.id ? { ...a, ...updatedAlert } : a))
              );
            } else if (payload.eventType === "DELETE") {
              const deletedAlert = payload.old as { id: string };
              setAlerts((prev) => prev.filter((a) => a.id !== deletedAlert.id));
            }
          }
        )
        .subscribe();

      aiEventsChannel = supabaseClient
        .channel("realtime-ai-events")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ai_events" },
          (payload: any) => {
            console.log("Realtime AI Event Change:", payload);
            if (payload.eventType === "INSERT") {
              const newEvent = payload.new as AIEvent;
              setAiEvents((prev) => {
                if (prev.some((e) => e.id === newEvent.id)) return prev;
                return [newEvent, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              const updatedEvent = payload.new as AIEvent;
              setAiEvents((prev) =>
                prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
              );
            } else if (payload.eventType === "DELETE") {
              const deletedEvent = payload.old as { id: string };
              setAiEvents((prev) => prev.filter((e) => e.id !== deletedEvent.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (supabaseClient) {
        if (devicesChannel) supabaseClient.removeChannel(devicesChannel);
        if (alertsChannel) supabaseClient.removeChannel(alertsChannel);
        if (aiEventsChannel) supabaseClient.removeChannel(aiEventsChannel);
      }
    };
  }, [user]);

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
      if (!supabase) {
        setAuthError("Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        return;
      }

      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else if (data?.session) {
          // Session established immediately: pull the authoritative
          // role/org from the server (never guessed from the email).
          await syncSessionFromServer();
          setIsRegistering(false);
        } else {
          setAuthError("Account created. Check your email to confirm before signing in.");
          setIsRegistering(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError(error.message);
        } else {
          await syncSessionFromServer();
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Pulls the verified role/org for the current session from the server —
  // this, not anything computed on the client, is what every subsequent
  // API call is actually authorized against.
  const syncSessionFromServer = async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    if (data.authenticated && data.user) {
      const loggedUser: AuthUser = {
        email: data.user.email,
        role: data.user.role,
        organization: data.user.organizationName || "Supabase Cloud Tenant",
      };
      setUser(loggedUser);
      localStorage.setItem("guardian_session", JSON.stringify(loggedUser));
      setActiveTab(loggedUser.role === "inspector" ? "compliance" : "dashboard");
    } else {
      setAuthError("Signed in, but the server could not establish a session. Please try again.");
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
    setActiveTab("dashboard");
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

  const handleDemoLogin = (role: "admin" | "operator" | "inspector") => {
    const demoUser: AuthUser = {
      email: `${role}@guardiancam.demo`,
      role,
      organization: "GuardianCam Tactical Demo Division"
    };
    setUser(demoUser);
    localStorage.setItem("guardian_session", JSON.stringify(demoUser));
    setActiveTab(role === "inspector" ? "compliance" : "dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased relative overflow-hidden">
        {/* Modern glowing spots */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Technical Background Grid Pattern */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.12] mix-blend-screen"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
            maskImage: 'radial-gradient(circle at center, black, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 90%)',
          }}
        />

        <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 md:p-8 gap-8 items-center">
          
          {/* Left Column: Interactive Immersive Brand HUD Side (7 columns) */}
          <section className="hidden lg:flex lg:col-span-7 flex-col justify-between h-[600px] bg-slate-950/40 border border-slate-900 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm">
            
            {/* Top Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-[0.25em] text-emerald-400 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SECURE GATEWAY NODE_03 ACTIVE
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {currentTime || "00:00:00 UTC"}
              </span>
            </div>

            {/* Immersive Rotating Circular Radar Visual */}
            <div className="my-auto flex flex-col items-center justify-center relative py-6">
              <div className="absolute w-72 h-72 rounded-full border border-indigo-500/10 animate-[spin_40s_linear_infinite]" />
              <div className="absolute w-56 h-56 rounded-full border border-indigo-500/20 border-dashed animate-[spin_20s_linear_infinite_reverse]" />
              <div className="absolute w-40 h-40 rounded-full border border-emerald-500/15 animate-[pulse_3s_ease-in-out_infinite]" />
              
              <div className="relative p-6 bg-slate-900/60 border border-slate-800 rounded-3xl text-emerald-400 shadow-2xl flex flex-col items-center">
                <ShieldCheck className="w-10 h-10 animate-pulse mb-3" />
                <span className="text-xs font-mono font-bold tracking-widest text-slate-300">GUARDIANCAM</span>
                <span className="text-[9px] font-mono text-slate-500 mt-0.5">SECURE INTEL GRID</span>
              </div>
            </div>

            {/* Simulated Live Core Network Feed logs */}
            <div className="space-y-3 bg-slate-950/60 border border-slate-900 p-4 rounded-2xl">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Peripheral Diagnostics Queue
              </div>
              
              <div className="space-y-1.5 font-mono text-[9px] text-slate-500">
                <div className="flex justify-between items-center border-b border-slate-900/40 pb-1">
                  <span>[01:14:02 UTC] SECURE_PORT_3000</span>
                  <span className="text-emerald-500">LISTENING</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900/40 pb-1">
                  <span>[01:14:22 UTC] TACTICAL_FLT_COGNITION</span>
                  <span className="text-emerald-500">6_ONLINE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>[01:14:50 UTC] ENVIRONMENTAL_GIBMP_SYNC</span>
                  <span className="text-indigo-400">90%_HEALTH</span>
                </div>
              </div>
            </div>
            
          </section>

          {/* Right Column: Glassmorphism Access Form Card (5 columns) */}
          <section className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl p-6 sm:p-10 rounded-3xl flex flex-col justify-center min-h-[600px] relative shadow-2xl">
            
            {/* Header displaying brand */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl mb-4">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100">
                GuardianCam
              </h1>
              <span className="font-mono text-[9px] tracking-[0.25em] text-indigo-400 uppercase mt-1">
                SECURE OPERATIONAL ENTRY
              </span>
            </div>

            {authError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-mono flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            {/* Custom visual tab selectors for modern UX */}
            <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-900 mb-5">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setAuthError("");
                }}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  !isRegistering 
                    ? "bg-slate-800 text-slate-100 shadow" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setAuthError("");
                }}
                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isRegistering 
                    ? "bg-slate-800 text-slate-100 shadow" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Register
              </button>
            </div>

            {/* Actual Credentials Form */}
            <form onSubmit={handleSupabaseSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] tracking-[0.15em] text-slate-500 uppercase">
                  Identity Token (Email)
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="operator@guardiancam.com"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] tracking-[0.15em] text-slate-500 uppercase">
                  Security Secret (Password)
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-indigo-500 hover:bg-indigo-400 text-slate-950 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.15)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] disabled:opacity-50 disabled:pointer-events-none text-white"
              >
                {authLoading ? (
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    AUTHENTICATING...
                  </span>
                ) : isRegistering ? (
                  "CREATE REGISTERED IDENTITY"
                ) : (
                  "ENGAGE CONTROL CONSOLE"
                )}
              </button>
            </form>

            {/* 4. DEMO / OFFLINE BYPASS CREDENTIALS (INVALUABLE FOR UX & DEMO EVALUATION) */}
            <div className="mt-6 pt-5 border-t border-slate-900 space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400 animate-pulse" />
                Demo Credentials Sandbox
              </div>
              <p className="text-[9px] text-slate-500 leading-relaxed font-mono">
                Bypass database server and access full dashboard features as:
              </p>
              
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin")}
                  className="bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-900/30 text-indigo-400 rounded-lg py-1.5 text-[9px] font-mono uppercase tracking-wide cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("operator")}
                  className="bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-900/30 text-indigo-400 rounded-lg py-1.5 text-[9px] font-mono uppercase tracking-wide cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Operator
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("inspector")}
                  className="bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-900/30 text-indigo-400 rounded-lg py-1.5 text-[9px] font-mono uppercase tracking-wide cursor-pointer transition-all hover:scale-[1.02]"
                >
                  Inspector
                </button>
              </div>
            </div>

          </section>
        </main>

        <footer className="relative z-20 border-t border-slate-900 bg-slate-950 px-8 py-4 flex flex-col md:flex-row justify-between items-center font-mono text-[9px] tracking-wider text-slate-500 gap-2">
          <span>SECURE SYSTEM INTERFACE • GUARDIANCAM ENTERPRISE MONITORING NETWORK</span>
          <span className="flex items-center gap-1.5 text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            STANDBY PORT 3000
          </span>
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
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-slate-100 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400" />
            Dashboard
          </button>

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
          {activeTab === "dashboard" && (
            <DashboardOverview
              devices={devices}
              alerts={alerts}
              aiEvents={aiEvents}
              complianceRecords={complianceRecords}
              billingConfig={billingConfig}
              user={user}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onTriggerGlobalSiren={handleTriggerGlobalSiren}
              globalSirenActive={globalSirenActive}
              onTriggerAlert={handleTriggerAlert}
            />
          )}

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
