import React, { useState, useEffect } from "react";
import { Device, SecurityAlert, ComplianceRecord, GeneratedScenario, BillingConfig } from "./types";
import CommandCenter from "./components/CommandCenter";
import DeviceManager from "./components/DeviceManager";
import IntelligenceHub from "./components/IntelligenceHub";
import ScenarioSynthesizer from "./components/ScenarioSynthesizer";
import FleetTracker from "./components/FleetTracker";
import ComplianceHub from "./components/ComplianceHub";
import BillingSettings from "./components/BillingSettings";
import { 
  ShieldCheck, 
  Server, 
  Cpu, 
  Image as ImageIcon, 
  Globe, 
  FileCheck, 
  CreditCard,
  Wifi,
  Radio,
  Clock,
  Volume2,
  VolumeX,
  AlertTriangle
} from "lucide-react";

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
    model: "gemini-3-pro-image-preview",
    timestamp: "11:02 AM"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"command" | "devices" | "vision" | "scenarios" | "fleet" | "compliance" | "billing">("command");
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  const [alerts, setAlerts] = useState<SecurityAlert[]>(INITIAL_ALERTS);
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

  // Fetch API key configurations on boot
  useEffect(() => {
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
    return () => clearInterval(timer);
  }, []);

  // Tactical device control toggling
  const handleToggleControl = (id: string, controlType: "siren" | "light" | "recording") => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d };
        if (controlType === "siren") updated.sirenOn = !d.sirenOn;
        if (controlType === "light") updated.lightOn = !d.lightOn;
        if (controlType === "recording") updated.recording = !d.recording;
        return updated;
      })
    );
  };

  const handleAddDevice = (newDevice: Omit<Device, "id" | "status" | "lastActive">) => {
    const id = `${newDevice.type === "camera" ? "cam" : "patrol"}-${Math.floor(Math.random() * 900) + 100}`;
    setDevices((prev) => [
      ...prev,
      {
        ...newDevice,
        id,
        status: "online",
        lastActive: "Just now",
        battery: newDevice.type === "camera" ? 100 : undefined
      }
    ]);
  };

  const handleRemoveDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const handleTriggerAlert = (newAlert: SecurityAlert) => {
    setAlerts((prev) => [newAlert, ...prev]);
    // Set device state to Alerting
    setDevices((prev) =>
      prev.map((d) => (d.id === newAlert.deviceId ? { ...d, status: "alerting" } : d))
    );
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
    // Find device linked to alert and restore status to online
    const targetAlert = alerts.find((a) => a.id === alertId);
    if (targetAlert) {
      setDevices((prev) =>
        prev.map((d) => (d.id === targetAlert.deviceId ? { ...d, status: "online" } : d))
      );
    }
  };

  const handleAddRecord = (newRecord: ComplianceRecord) => {
    setComplianceRecords((prev) => [newRecord, ...prev]);
  };

  const handleAddScenario = (newScenario: GeneratedScenario) => {
    setScenarios((prev) => [newScenario, ...prev]);
  };

  // Simulate Stripe Webhook callback changes limits
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

    setBillingConfig({
      tierName: planName,
      price,
      maxCameras,
      maxVehicles,
      maxProperties,
      unlockedFeatures: planName === "Enterprise" ? ["all models", "4K image synthesis"] : ["standard"]
    });
  };

  const handleTriggerGlobalSiren = () => {
    const nextState = !globalSirenActive;
    setGlobalSirenActive(nextState);
    setDevices((prev) =>
      prev.map((d) => (d.type === "camera" ? { ...d, sirenOn: nextState, status: nextState ? "alerting" : "online" } : d))
    );
  };

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
                  SecOps SaaS v1.1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Unified Security, Fleet & Florida GIBMP Operations Command Center</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* GPS Lock indicator */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-300">UHF TRANSCEIVER OK</span>
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
                {apiKeyLoaded ? "GEMINI SECRETS KEY LOCKED" : "AI SIMULATION FALLBACK ACTIVE"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* TABS NAVIGATION BAR */}
        <nav className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1 shadow-inner">
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
        </nav>

        {/* ACTIVE TABS VIEW CONTROLLER */}
        <div className="flex-1 min-h-[500px]">
          {activeTab === "command" && (
            <CommandCenter
              devices={devices}
              alerts={alerts}
              onResolveAlert={handleResolveAlert}
              onTriggerGlobalSiren={handleTriggerGlobalSiren}
              globalSirenActive={globalSirenActive}
            />
          )}

          {activeTab === "devices" && (
            <DeviceManager
              devices={devices}
              onToggleControl={handleToggleControl}
              onAddDevice={handleAddDevice}
              onRemoveDevice={handleRemoveDevice}
              onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
              isDemoMode={isDemoMode}
              maxCameras={billingConfig.maxCameras}
              maxVehicles={billingConfig.maxVehicles}
            />
          )}

          {activeTab === "vision" && (
            <IntelligenceHub
              devices={devices}
              onTriggerAlert={handleTriggerAlert}
              apiKeyLoaded={apiKeyLoaded}
            />
          )}

          {activeTab === "scenarios" && (
            <ScenarioSynthesizer
              onAddScenario={handleAddScenario}
              scenarios={scenarios}
              apiKeyLoaded={apiKeyLoaded}
            />
          )}

          {activeTab === "fleet" && (
            <FleetTracker
              vehicles={devices.filter((d) => d.type === "vehicle")}
            />
          )}

          {activeTab === "compliance" && (
            <ComplianceHub
              records={complianceRecords}
              onAddRecord={handleAddRecord}
              maxProperties={billingConfig.maxProperties}
            />
          )}

          {activeTab === "billing" && (
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
