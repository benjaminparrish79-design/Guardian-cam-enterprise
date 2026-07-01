import React, { useState, useRef } from "react";
import { Device, SecurityAlert } from "../types";
import { 
  Cpu, 
  Brain, 
  ShieldAlert, 
  Sparkles, 
  Upload, 
  AlertOctagon, 
  Compass, 
  CheckCircle2, 
  RefreshCw,
  FileText
} from "lucide-react";

interface IntelligenceHubProps {
  devices: Device[];
  onTriggerAlert: (alert: SecurityAlert) => void;
  apiKeyLoaded: boolean;
}

// Preset security scenes for easy testing
const PRESET_SCENES = [
  {
    name: "Zone Perimeter - Suspected Intruder",
    prompt: "Scan for suspects scaling the perimeter. Detect clothing, threat-markers, or lockpicks.",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600&h=400",
    key: "intruder"
  },
  {
    name: "Hazmat Yard - Active Ignition Threat",
    prompt: "Detect active fire, thermal runaway, smoke emission, or barrel ruptures.",
    imageUrl: "https://images.unsplash.com/photo-1508873699372-7aeab60b44ab?auto=format&fit=crop&q=80&w=600&h=400",
    key: "fire"
  },
  {
    name: "Loading Dock - Unregistered Vehicle",
    prompt: "Scan for commercial logistics vehicles, delivery vans, or blockades in fire lanes.",
    imageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600&h=400",
    key: "vehicle"
  },
  {
    name: "Facility Rear - Egress Compliance Obstruction",
    prompt: "Compliance inspection. Identify discarded equipment, solid waste, blocked doors, or GIBMP fertilizer runoff.",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600&h=400",
    key: "compliance"
  }
];

export default function IntelligenceHub({ devices, onTriggerAlert, apiKeyLoaded }: IntelligenceHubProps) {
  const [selectedDevice, setSelectedDevice] = useState(devices[0]?.id || "");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [customPrompt, setCustomPrompt] = useState("");
  const [imageSrc, setImageSrc] = useState(PRESET_SCENES[0].imageUrl);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activePreset, setActivePreset] = useState("intruder");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read upload image
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageSrc(reader.result);
        setActivePreset(""); // Clear preset highlight
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  // Run computer vision pipeline
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setReport(null);

    const deviceObj = devices.find((d) => d.id === selectedDevice) || devices[0];
    const promptToSend = customPrompt || 
      (PRESET_SCENES.find((p) => p.imageUrl === imageSrc)?.prompt) ||
      "Analyze this surveillance camera frame. Check for security threats, fires, hazards, or intrusions.";

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageSrc,
          prompt: promptToSend,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error("Server responded with error status " + response.status);
      }

      const data = await response.json();
      setReport(data);

      // Trigger standard alerts system if threat is medium or above
      if (data.threatLevel && ["medium", "high", "critical"].includes(data.threatLevel)) {
        onTriggerAlert({
          id: `alert-${Math.floor(Math.random() * 900000) + 100000}`,
          deviceId: deviceObj?.id || "manual-camera",
          deviceName: deviceObj?.name || "Direct Uplink AI Stream",
          timestamp: new Date().toLocaleTimeString(),
          severity: data.threatLevel,
          message: data.recommendation || "AI Threat Flagged",
          description: data.description || "Unidentified thermal target scanned.",
          objectsDetected: data.objectsDetected || [],
          resolved: false,
          boundingBoxes: data.boundingBoxes
        });
      }

    } catch (err: any) {
      console.error(err);
      alert("Failed to analyze image: " + (err.message || String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectPreset = (preset: typeof PRESET_SCENES[0]) => {
    setImageSrc(preset.imageUrl);
    setActivePreset(preset.key);
    setCustomPrompt(preset.prompt);
  };

  return (
    <div id="ai-intelligence-hub" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">SecOps AI Vision Hub</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time server-side threat analyzer using Gemini vision pipelines.
          </p>
        </div>

        {/* API Indicator */}
        <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className={`w-2 h-2 rounded-full ${apiKeyLoaded ? "bg-emerald-500 animate-pulse" : "bg-yellow-500"}`} />
          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
            {apiKeyLoaded ? "Gemini Live API Key" : "Simulation Mode Active"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Side: Setup & Image Upload */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              Diagnostics Scope
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Camera Uplink</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Intelligence Processor</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Threat scan)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (Standard general analysis)</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Advanced incident forensics)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Custom Tactical Instructions (Prompt Override)</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Instruct the AI specifically (e.g. 'Look for a person near the emergency vehicle tires...')"
                className="w-full h-16 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Quick Scene Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Security Threat Presets</span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SCENES.map((scene) => (
                <button
                  key={scene.key}
                  onClick={() => selectPreset(scene)}
                  className={`p-2 rounded-lg border text-left text-xs transition-all ${
                    activePreset === scene.key
                      ? "bg-emerald-950/30 border-emerald-500/50 text-slate-100"
                      : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="font-semibold block truncate">{scene.name}</span>
                  <span className="text-[9px] text-slate-500 block truncate mt-0.5">{scene.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Surveillance Screen & Live Canvas */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-center items-center group">
            
            {/* Drag & Drop Overlay */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-300 ${
                isDragOver 
                  ? "bg-emerald-500/10 border-2 border-dashed border-emerald-500/60" 
                  : "bg-transparent group-hover:bg-slate-950/40"
              }`}
            >
              {isDragOver && (
                <div className="bg-slate-900/95 p-6 rounded-xl border border-emerald-500/30 shadow-2xl flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-emerald-400 animate-bounce" />
                  <span className="text-sm font-bold text-slate-100">Drop Threat Asset Here</span>
                  <span className="text-xs text-slate-400">Ready to ingest into machine vision</span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
              accept="image/*"
            />

            {/* Bounding box viewport container */}
            <div className="relative max-w-full max-h-[300px] select-none">
              <img
                src={imageSrc}
                alt="Surveillance Feed Analysis"
                className="max-h-[300px] w-full object-cover rounded-lg border border-slate-800"
              />

              {/* Render canvas/vector Bounding boxes beautifully on top of image */}
              {report && report.boundingBoxes && report.boundingBoxes.map((box: any, i: number) => (
                <div
                  key={i}
                  className="absolute border-2 border-red-500 bg-red-500/10 flex flex-col text-[10px] font-bold text-white px-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`,
                  }}
                >
                  <span className="bg-red-500 text-[9px] px-1 py-0.5 rounded-sm self-start whitespace-nowrap mt-[-16px] ml-[-2px]">
                    {box.label}
                  </span>
                </div>
              ))}
            </div>

            {/* In-view instructions */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
              <span className="flex items-center gap-1">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                DRAG OR CLICK TO UPLOAD SECURITY PHOTO
              </span>
              <span className="text-slate-500">UPLINK ACTIVE</span>
            </div>
          </div>

          {/* Trigger Scan */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`w-full py-3 rounded-lg text-xs font-bold tracking-wider cursor-pointer uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              isAnalyzing
                ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold hover:shadow-emerald-500/20"
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                Processing computer vision stream...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                EXECUTE AI SURVEILLANCE SCAN
              </>
            )}
          </button>

          {/* Diagnostics Report */}
          {report && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">AI Core SecOps Diagnosis</span>
                </div>
                
                {/* Threat severity level indicator */}
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
                  report.threatLevel === "critical"
                    ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
                    : report.threatLevel === "high"
                    ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                    : report.threatLevel === "medium"
                    ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}>
                  <AlertOctagon className="w-3 h-3" />
                  {report.threatLevel?.toUpperCase() || "LOW"} THREAT
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded border border-slate-900">
                {report.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Identified Perimeter Anomalies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.objectsDetected && report.objectsDetected.map((obj: string, i: number) => (
                      <span key={i} className="bg-slate-900 text-slate-400 border border-slate-800/80 px-2 py-0.5 rounded text-[10px]">
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Immediate Tactical Action Code</span>
                  <div className="bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded text-[10px] font-mono leading-tight">
                    {report.recommendation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
