"use client";

import React, { useState, useEffect } from "react";
import { Device, SecurityAlert, ComplianceRecord, BillingConfig, AIEvent } from "../types";
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
  Activity,
  AlertTriangle,
  Play,
  CheckCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  Sliders,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BatteryCharging
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardOverviewProps {
  devices: Device[];
  alerts: SecurityAlert[];
  aiEvents: AIEvent[];
  complianceRecords: ComplianceRecord[];
  billingConfig: BillingConfig;
  user: { email: string; role: string; organization: string };
  onNavigateToTab: (tab: "command" | "devices" | "vision" | "scenarios" | "fleet" | "compliance" | "billing") => void;
  onTriggerGlobalSiren: () => void;
  globalSirenActive: boolean;
  onTriggerAlert: (alert: SecurityAlert) => void;
}

export default function DashboardOverview({
  devices,
  alerts,
  aiEvents,
  complianceRecords,
  billingConfig,
  user,
  onNavigateToTab,
  onTriggerGlobalSiren,
  globalSirenActive,
  onTriggerAlert
}: DashboardOverviewProps) {
  const activeAlerts = alerts.filter(a => !a.resolved);
  const activeEvents = aiEvents.filter(e => !e.resolved);
  
  // Selection state for simulated feed
  const cameras = devices.filter(d => d.type === "camera");
  const [selectedCameraId, setSelectedCameraId] = useState<string>(cameras[0]?.id || "");
  const selectedCamera = devices.find(d => d.id === selectedCameraId) || cameras[0];

  // Video feed filter effects
  const [visionMode, setVisionMode] = useState<"standard" | "infrared" | "night" | "thermal">("standard");
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [simulatedTelemetry, setSimulatedTelemetry] = useState({ fps: 24, temp: 31, rate: "1.4 Mbps" });
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);

  // Periodic random metric changes for visual interest
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedTelemetry({
        fps: Math.floor(Math.random() * 4) + 22,
        temp: Math.floor(Math.random() * 6) + 28,
        rate: `${(Math.random() * 0.4 + 1.2).toFixed(1)} Mbps`
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const calculateAverageCompliance = () => {
    if (complianceRecords.length === 0) return 90;
    const total = complianceRecords.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / complianceRecords.length);
  };

  const getSystemStatus = () => {
    if (activeAlerts.length > 0) return { label: "THREATS RECOGNIZED", color: "text-red-400 bg-red-950/40 border-red-900/50" };
    return { label: "ALL SYSTEMS NOMINAL", color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/50" };
  };

  const systemStatus = getSystemStatus();

  // Mock data for alert frequency chart over the last 7 days
  const chartData = [
    { day: "Mon", threats: 3, falsePositives: 12, cpuLoad: 42 },
    { day: "Tue", threats: 5, falsePositives: 18, cpuLoad: 48 },
    { day: "Wed", threats: 2, falsePositives: 15, cpuLoad: 41 },
    { day: "Thu", threats: 8, falsePositives: 21, cpuLoad: 62 },
    { day: "Fri", threats: 4, falsePositives: 14, cpuLoad: 45 },
    { day: "Sat", threats: 1, falsePositives: 8, cpuLoad: 35 },
    { day: "Sun", threats: activeAlerts.length, falsePositives: 11, cpuLoad: 40 }
  ];

  // Helper to trigger a realistic security alert for simulation
  const handleSimulateAlert = () => {
    if (!selectedCamera) return;

    const incidentTypes = [
      {
        message: "Motion Detected in Exclusion Corridor",
        description: "Thermal pattern analyzed. Human signature identified inside the restricted buffer zone.",
        severity: "high" as const,
        objects: ["Person", "Backpack"],
        boxes: [{ label: "Intruder (94%)", x: 40, y: 30, w: 22, h: 50 }]
      },
      {
        message: "Chemical Runoff Drainage Anomaly",
        description: "Visual analysis flags surface foam/excess discharge adjacent to Florida protected wetlands corridor.",
        severity: "critical" as const,
        objects: ["Runoff plume", "Drainage pipe"],
        boxes: [{ label: "Acidity Anomaly (88%)", x: 20, y: 55, w: 35, h: 25 }]
      },
      {
        message: "Loading Dock Blockage detected",
        description: "Unidentified cargo left unattended in high-traffic commercial transit lanes.",
        severity: "medium" as const,
        objects: ["Pallet", "Obstruction"],
        boxes: [{ label: "Cargo Obstruction (91%)", x: 60, y: 40, w: 18, h: 30 }]
      },
      {
        message: "License Plate Blacklist Warning",
        description: "Camera captured vehicle registered to a de-certified former operator entering Gate West lane.",
        severity: "medium" as const,
        objects: ["License Plate", "Commercial Sedan"],
        boxes: [{ label: "Blacklisted Vehicle (96%)", x: 30, y: 35, w: 40, h: 40 }]
      }
    ];

    const randomIncident = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newAlert: SecurityAlert = {
      id: `alert-${Math.floor(Math.random() * 900) + 100}`,
      deviceId: selectedCamera.id,
      deviceName: selectedCamera.name,
      timestamp,
      severity: randomIncident.severity,
      message: randomIncident.message,
      description: randomIncident.description,
      objectsDetected: randomIncident.objects,
      boundingBoxes: randomIncident.boxes,
      resolved: false
    };

    onTriggerAlert(newAlert);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* 1. INTERACTIVE HERO PANEL */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8">
        {/* Ambient neon backdrop lights */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded text-[10px] font-mono border ${systemStatus.color} flex items-center gap-1.5 font-bold tracking-wider animate-pulse`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {systemStatus.label}
              </span>
              <span className="bg-slate-900/60 text-slate-400 border border-slate-800 text-[10px] font-mono px-2.5 py-1 rounded tracking-wide">
                FLORIDA GIBMP SYNCED
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100 uppercase">
              Operations Control Dashboard
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Cognitive monitoring node established. Real-time telemetry, environmental runoff surveillance grids, and computer vision trigger queues are operational.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
            <button
              onClick={onTriggerGlobalSiren}
              className={`px-5 py-3 rounded-xl text-xs font-black tracking-wider uppercase flex items-center gap-2.5 border transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${
                globalSirenActive
                  ? "bg-red-500 text-white border-red-400 hover:bg-red-600 animate-pulse shadow-red-500/20"
                  : "bg-slate-900 text-red-400 border-red-950/80 hover:bg-red-950/30 hover:border-red-900/60"
              }`}
            >
              <Bell className={`w-4 h-4 ${globalSirenActive ? "animate-bounce" : ""}`} />
              {globalSirenActive ? "Siren Alert Active" : "Trigger base sirens"}
            </button>
            <button
              onClick={() => onNavigateToTab("vision")}
              className="bg-emerald-400 hover:bg-emerald-300 text-neutral-950 px-5 py-3 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
            >
              <Sparkles className="w-4 h-4" />
              Analyze Video
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Assets */}
        <div 
          onClick={() => onNavigateToTab("devices")}
          className="group bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-indigo-500/30 p-5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between h-36"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10 group-hover:border-indigo-500/30 transition-all">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors flex items-center gap-1">
              Active Fleet <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tracking-tight text-slate-100 font-mono">
              {devices.length}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>{cameras.length} Cameras</span>
              <span className="text-slate-600">&bull;</span>
              <span>{devices.length - cameras.length} Vehicles</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Live Threats */}
        <div 
          onClick={() => onNavigateToTab("command")}
          className="group bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-red-500/30 p-5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between h-36"
        >
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl border transition-all ${
              activeAlerts.length > 0 
                ? "bg-red-500/10 text-red-400 border-red-500/20 group-hover:border-red-500/50" 
                : "bg-slate-800/50 text-slate-400 border-slate-700/50"
            }`}>
              <AlertTriangle className={`w-5 h-5 ${activeAlerts.length > 0 ? "animate-bounce" : ""}`} />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest group-hover:text-red-400 transition-colors flex items-center gap-1">
              Threats Active <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-black tracking-tight font-mono ${activeAlerts.length > 0 ? "text-red-400" : "text-slate-100"}`}>
              {activeAlerts.length}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>{activeAlerts.filter(a => a.severity === "critical" || a.severity === "high").length} Critical/High</span>
              <span className="text-slate-600">&bull;</span>
              <span>{activeAlerts.filter(a => a.severity === "medium" || a.severity === "low").length} Med/Low</span>
            </div>
          </div>
        </div>

        {/* KPI 3: AI Detections */}
        <div 
          onClick={() => onNavigateToTab("vision")}
          className="group bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-emerald-500/30 p-5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between h-36"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest group-hover:text-emerald-400 transition-colors flex items-center gap-1">
              AI Vision Pipeline <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tracking-tight text-slate-100 font-mono">
              {aiEvents.length}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>{activeEvents.length} Unresolved Sweeps</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-emerald-400 font-medium">99.2% Accuracy</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Compliance Health */}
        <div 
          onClick={() => onNavigateToTab("compliance")}
          className="group bg-slate-900/40 hover:bg-slate-900/70 border border-slate-900 hover:border-amber-500/30 p-5 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between h-36"
        >
          <div className="flex items-start justify-between">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/10 group-hover:border-amber-500/30 transition-all">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest group-hover:text-amber-400 transition-colors flex items-center gap-1">
              Compliance score <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black tracking-tight text-slate-100 font-mono text-amber-400">
              {calculateAverageCompliance()}%
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>{complianceRecords.filter(r => r.status === "compliant").length} Compliant Sites</span>
              <span className="text-slate-600">&bull;</span>
              <span>GIBMP Standards Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CORE TWO-COLUMN INTERACTIVE MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: LIVE TACTICAL THREAT FEED SIMULATOR */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Base Live Surveillance Stream
              </h3>
            </div>
            
            {/* Camera Select Dropdown */}
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {cameras.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* SCREEN STREAM CONTAINER */}
          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-900 bg-black flex items-center justify-center">
            
            {/* Scanning Overlay Grid Effect */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"
              style={{ backgroundSize: "100% 4px, 6px 100%" }}
            />
            
            {/* Realtime Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_6px] opacity-20" />
            
            {/* Sweeping Laser Scan Line */}
            <div className="absolute w-full h-0.5 bg-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-[scan_3s_linear_infinite] top-0 left-0 pointer-events-none" />

            {/* Simulated Stream Feed Visual */}
            {selectedCamera ? (
              <div className="w-full h-full relative">
                {/* Image under filters */}
                <img
                  src={
                    selectedCamera.id === "cam-01" 
                      ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200" 
                      : selectedCamera.id === "cam-02" 
                      ? "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&q=80&w=1200" 
                      : "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=1200"
                  }
                  alt="Security stream mockup"
                  className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300 ${
                    visionMode === "infrared" ? "grayscale contrast-125 brightness-110 saturate-0 hue-rotate-180 bg-cyan-950/20" : 
                    visionMode === "night" ? "grayscale brightness-125 sepia contrast-150 saturate-100 hue-rotate-60" :
                    visionMode === "thermal" ? "invert hue-rotate-180 brightness-110 contrast-200 saturate-150" : ""
                  }`}
                />

                {/* Thermal color overlay simulation */}
                {visionMode === "thermal" && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/40 via-red-500/20 to-yellow-400/30 mix-blend-color-burn pointer-events-none" />
                )}

                {/* Simulated Bounding Boxes Overlay */}
                {showBoundingBoxes && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Person Bounding Box */}
                    {selectedCamera.id === "cam-01" && (
                      <div className="absolute border-2 border-red-500 bg-red-500/10 text-white font-mono text-[9px] px-1 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.8)]" style={{ top: "35%", left: "45%", width: "20%", height: "45%" }}>
                        <div className="absolute -top-5 left-0 bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap">
                          SUSPECT_INTRUDER 94%
                        </div>
                        <span className="absolute bottom-1 right-1 text-[7px] text-white/50">TRACK_ID: P-101</span>
                      </div>
                    )}
                    {/* Fuel Combustion bounding box */}
                    {selectedCamera.id === "cam-02" && (
                      <div className="absolute border-2 border-red-500 bg-red-500/10 text-white font-mono text-[9px] px-1 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" style={{ top: "55%", left: "55%", width: "25%", height: "30%" }}>
                        <div className="absolute -top-5 left-0 bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap">
                          THERMAL_FLARE_98%
                        </div>
                        <span className="absolute bottom-1 right-1 text-[7px] text-white/50">ANOMALY_03</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic Camera Technical Watermarks */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm border border-slate-800 rounded px-2.5 py-1 text-[9px] font-mono text-slate-300 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    LIVE TELEMETRY
                  </div>
                  <div>ID: {selectedCamera.id.toUpperCase()}</div>
                  <div>SIGNAL: {selectedCamera.signal.toUpperCase()}</div>
                  <div>FPS: {simulatedTelemetry.fps} fps</div>
                  <div>TEMP: {simulatedTelemetry.temp}&deg;C</div>
                </div>

                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm border border-slate-800 rounded px-2.5 py-1 text-[9px] font-mono text-slate-300 text-right">
                  <div>UTC TIME: {new Date().toLocaleTimeString()}</div>
                  <div>BITRATE: {simulatedTelemetry.rate}</div>
                  <div>PLAN LIMITS: OK</div>
                  <div className="text-indigo-400 font-bold uppercase">{visionMode} VIEW</div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="bg-black/80 backdrop-blur-sm border border-slate-800 rounded-lg px-3 py-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${selectedCamera.status === "alerting" ? "bg-red-500" : "bg-emerald-400"}`} />
                    {selectedCamera.status === "alerting" ? "SECTOR ALERTING" : "STREAMING STABLE"}
                  </span>

                  <span className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-400">
                    {selectedCamera.name}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm font-mono uppercase tracking-widest flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-slate-700 animate-spin" />
                Establishing camera sync...
              </div>
            )}
          </div>

          {/* LOWER INTERACTIVE CONTROLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            
            {/* View filter options */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                AI Vision Ingestion Lens
              </label>
              <div className="flex gap-1">
                {(["standard", "infrared", "night", "thermal"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setVisionMode(mode)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      visionMode === mode 
                        ? "bg-slate-800 text-slate-100 border-indigo-500" 
                        : "bg-slate-900/60 text-slate-500 border-slate-800/40 hover:text-slate-300"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick trigger simulator buttons */}
            <div className="flex items-center gap-2.5 justify-end mt-4 md:mt-0">
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className={`px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider border flex items-center gap-1.5 cursor-pointer transition-all ${
                  showBoundingBoxes 
                    ? "bg-indigo-950/40 text-indigo-400 border-indigo-900/50" 
                    : "bg-slate-900/40 text-slate-500 border-slate-800/40 hover:text-slate-300"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Bounding Boxes: {showBoundingBoxes ? "ON" : "OFF"}
              </button>
              
              <button
                onClick={handleSimulateAlert}
                disabled={!selectedCamera}
                className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Simulate Incident
              </button>
            </div>

          </div>

        </div>

        {/* RIGHT COMPONENT: METRIC FREQUENCY GRAPH & OPERATIONS LOG */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* SECURITY ALERTS TREND CHART */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Weekly Security Analytics
              </h3>
              <p className="text-[11px] text-slate-500">
                Threat spikes vs machine vision background sweeps
              </p>
            </div>

            {/* SVG CHART CONTAINER */}
            <div className="relative h-44 w-full">
              <svg className="w-full h-full overflow-visible">
                {/* Horizontal grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="0%"
                    y1={`${20 + i * 20}%`}
                    x2="100%"
                    y2={`${20 + i * 20}%`}
                    className="stroke-slate-900 stroke-[1px]"
                  />
                ))}

                {/* Area path for processed alerts */}
                <path
                  d={chartData.reduce((path, d, i) => {
                    const x = `${(i / (chartData.length - 1)) * 100}%`;
                    const y = `${100 - (d.falsePositives / 30) * 80}%`;
                    return path + `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  }, "") + ` L 100% 100% L 0% 100% Z`}
                  className="fill-indigo-500/5 stroke-none"
                />

                <path
                  d={chartData.reduce((path, d, i) => {
                    const x = `${(i / (chartData.length - 1)) * 100}%`;
                    const y = `${100 - (d.falsePositives / 30) * 80}%`;
                    return path + `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  }, "")}
                  className="stroke-indigo-500/40 stroke-[2px] fill-none"
                />

                {/* Threat path (Highlighted Red) */}
                <path
                  d={chartData.reduce((path, d, i) => {
                    const x = `${(i / (chartData.length - 1)) * 100}%`;
                    const y = `${100 - (d.threats / 10) * 85}%`;
                    return path + `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  }, "")}
                  className="stroke-red-500/80 stroke-[2.5px] fill-none"
                />

                {/* Chart interactable dots */}
                {chartData.map((d, i) => {
                  const x = `${(i / (chartData.length - 1)) * 100}%`;
                  const y = `${100 - (d.threats / 10) * 85}%`;
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r={chartHoverIndex === i ? 6 : 4}
                        onMouseEnter={() => setChartHoverIndex(i)}
                        onMouseLeave={() => setChartHoverIndex(null)}
                        className={`cursor-pointer transition-all ${
                          chartHoverIndex === i 
                            ? "fill-red-400 stroke-slate-950 stroke-[2px]" 
                            : "fill-red-500 stroke-none"
                        }`}
                      />
                      <text
                        x={x}
                        y="115%"
                        className="text-[9px] fill-slate-500 font-mono text-center"
                        textAnchor="middle"
                      >
                        {d.day}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip Hover Display */}
              {chartHoverIndex !== null && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[9px] font-mono text-slate-300 shadow-xl space-y-0.5">
                  <div className="font-bold text-slate-200 uppercase">{chartData[chartHoverIndex].day} REPORT</div>
                  <div className="flex items-center gap-1 text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Incidents: {chartData[chartHoverIndex].threats}
                  </div>
                  <div className="flex items-center gap-1 text-indigo-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    AI Sweeps: {chartData[chartHoverIndex].falsePositives}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-red-500 rounded" />
                Active Threats
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-indigo-500/40 rounded" />
                Background Ingestion (Sweeps x10)
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                +4% alerts
              </span>
            </div>
          </div>

          {/* REALTIME OPERATIONS SYSTEM LOG */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4 flex-1 min-h-[160px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                  Real-time System Operations
                </h3>
                <p className="text-[11px] text-slate-500">
                  Telemetry logs and database transaction queues
                </p>
              </div>
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              <div className="text-[10px] font-mono border-l-2 border-indigo-500 pl-2.5 py-0.5 space-y-0.5">
                <div className="text-slate-400 text-[9px]">10:04:11 AM - AUTHENTICATION SUCCESS</div>
                <div className="text-slate-500 text-[9px]">Operator session initialized successfully for user <span className="text-indigo-400">{user.email}</span></div>
              </div>

              {activeAlerts.length > 0 ? (
                activeAlerts.map(alert => (
                  <div key={alert.id} className="text-[10px] font-mono border-l-2 border-red-500 pl-2.5 py-0.5 space-y-0.5">
                    <div className="text-red-400 text-[9px] uppercase">{alert.timestamp} - ALERT QUEUED</div>
                    <div className="text-slate-400 font-bold">{alert.deviceName}: {alert.message}</div>
                    <div className="text-slate-500 text-[9px] line-clamp-1">{alert.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-mono border-l-2 border-emerald-500 pl-2.5 py-0.5 space-y-0.5">
                  <div className="text-emerald-400 text-[9px]">SYSTEM NOMINAL</div>
                  <div className="text-slate-500 text-[9px]">Listening on real-time channels: active base sirens synchronizer.</div>
                </div>
              )}

              <div className="text-[10px] font-mono border-l-2 border-slate-700 pl-2.5 py-0.5 space-y-0.5">
                <div className="text-slate-400 text-[9px]">09:30:15 AM - WEBHOOK QUEUE COMPLETED</div>
                <div className="text-slate-500 text-[9px]">Database sync complete for Stripe plan constraints update.</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
