import React, { useState } from "react";
import { Device, SecurityAlert, AIEvent } from "../types";
import { 
  ShieldAlert, 
  Activity, 
  Video, 
  Volume2, 
  Check, 
  BellRing, 
  Clock, 
  Server,
  Zap,
  Cpu
} from "lucide-react";

interface CommandCenterProps {
  devices: Device[];
  alerts: SecurityAlert[];
  aiEvents: AIEvent[];
  onResolveAlert: (id: string) => void;
  onResolveAIEvent: (id: string) => void;
  onTriggerGlobalSiren: () => void;
  globalSirenActive: boolean;
}

export default function CommandCenter({
  devices,
  alerts,
  aiEvents,
  onResolveAlert,
  onResolveAIEvent,
  onTriggerGlobalSiren,
  globalSirenActive
}: CommandCenterProps) {
  const [sidebarTab, setSidebarTab] = useState<"alerts" | "ai_events">("alerts");
  const [selectedAIEvent, setSelectedAIEvent] = useState<AIEvent | null>(null);

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const onlineCount = devices.filter((d) => d.status === "online" || d.status === "alerting").length;

  return (
    <div id="secops-command-center" className="space-y-6">
      
      {/* 1. Global Alarm Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_24px_rgba(239,68,68,0.08)] animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="p-2 bg-red-500 text-slate-950 rounded-lg animate-bounce">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest block">Critical Alarm Ingestion State</span>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">
                {activeAlerts[0].message} detected at {activeAlerts[0].deviceName} (#{activeAlerts[0].deviceId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => onResolveAlert(activeAlerts[0].id)}
              className="bg-red-500 hover:bg-red-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Squelch Alarm Code
            </button>
          </div>
        </div>
      )}

      {/* 2. Operations HUD Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Active Uplinks</span>
            <span className="text-2xl font-black text-slate-100 font-mono">
              {onlineCount} <span className="text-xs font-medium text-slate-500">/ {devices.length}</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-slate-950 text-indigo-400 rounded-lg border border-slate-800">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Radio Pings</span>
            <span className="text-2xl font-black text-slate-100 font-mono">
              99.8% <span className="text-xs font-medium text-emerald-500">EXC</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-slate-950 text-red-400 rounded-lg border border-slate-800">
            <BellRing className="w-5 h-5 animate-swing" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Active Sirens</span>
            <span className="text-2xl font-black text-slate-100 font-mono">
              {globalSirenActive ? "ENABLED" : "STANDBY"}
            </span>
          </div>
        </div>

        {/* Global manual alert trigger */}
        <button
          onClick={onTriggerGlobalSiren}
          className={`p-4 rounded-xl border flex items-center justify-between transition-all text-left cursor-pointer ${
            globalSirenActive
              ? "bg-red-500 text-slate-950 border-red-500 animate-pulse"
              : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200"
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">SecOps Protocol</span>
            <span className="text-xs font-black block mt-0.5">
              {globalSirenActive ? "SQUELCH SIRENS" : "TRIGGER GLOBAL ALARM"}
            </span>
          </div>
          <Volume2 className="w-5 h-5 animate-ping" />
        </button>

      </div>

      {/* 3. Perimeter Live visual layout & Terminal logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual camera feeds grids */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-400" />
                Live Perimeter Camera Stream Grid
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Click on an asset to lock on in the Intelligence vision analyzer.</p>
            </div>
            
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              LIVE MULTICAST ON PORT 3000
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.filter(d => d.type === "camera").map((cam) => {
              const isAlerting = activeAlerts.some((a) => a.deviceId === cam.id);
              return (
                <div
                  key={cam.id}
                  className={`border rounded-lg overflow-hidden relative min-h-[140px] flex flex-col justify-between p-4 ${
                    isAlerting || cam.sirenOn
                      ? "border-red-500 bg-red-950/20 shadow-[inset_0_0_12px_rgba(239,68,68,0.2)] animate-pulse"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  {/* Visual simulated monitor display overlay */}
                  <div className="absolute inset-0 opacity-10 select-none pointer-events-none" style={{
                    backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
                    backgroundSize: "100% 4px, 6px 100%"
                  }} />

                  <div className="flex justify-between items-start z-10">
                    <span className="text-xs font-bold text-slate-200">{cam.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold tracking-wider ${
                      isAlerting || cam.sirenOn
                        ? "bg-red-500 text-slate-950"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {isAlerting || cam.sirenOn ? "ALERT TRIGGERED" : "SECURE FEED"}
                    </span>
                  </div>

                  <div className="z-10 py-4 flex justify-center text-slate-700 select-none font-mono text-[10px]">
                    {cam.recording ? (
                      <span className="flex items-center gap-1.5 text-red-500">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                        LIVE HD ENCRYPTED STREAM
                      </span>
                    ) : (
                      <span className="text-slate-500">FEED DORMANT</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 z-10 pt-2 border-t border-slate-900">
                    <span>CAM #{cam.id}</span>
                    <span>SIGNAL: {cam.signal.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alarms History stack */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl flex flex-col justify-between max-h-[500px] overflow-hidden">
          <div>
            {/* Tab Headers */}
            <div className="flex gap-2 border-b border-slate-800 pb-2.5 mb-3">
              <button
                onClick={() => setSidebarTab("alerts")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sidebarTab === "alerts"
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Security Alerts ({alerts.filter(a => !a.resolved).length})
              </button>
              <button
                onClick={() => setSidebarTab("ai_events")}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === "ai_events"
                    ? "bg-slate-800 text-indigo-300"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                AI Ingests ({aiEvents.filter(e => !e.resolved).length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {sidebarTab === "alerts" ? (
              alerts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-500">No security alerts logged. Baseline normal.</p>
                </div>
              ) : (
                alerts.map((al) => (
                  <div
                    key={al.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                      al.resolved
                        ? "bg-slate-950/40 border-slate-800/60 opacity-60"
                        : "bg-red-950/15 border-red-500/30"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-300">{al.deviceName}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        al.severity === "critical"
                          ? "bg-red-500 text-slate-950"
                          : al.severity === "high"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {al.severity}
                      </span>
                    </div>
                    
                    <p className="text-slate-400 leading-normal">{al.description}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-1.5">
                      <span className="font-mono">{al.timestamp}</span>
                      {!al.resolved ? (
                        <button
                          onClick={() => onResolveAlert(al.id)}
                          className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                        >
                          Squelch
                        </button>
                      ) : (
                        <span className="text-slate-600 font-bold uppercase">Squelched</span>
                      )}
                    </div>
                  </div>
                ))
              )
            ) : (
              aiEvents.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-500">No AI machine vision logs. Stream is clean.</p>
                </div>
              ) : (
                aiEvents.map((e) => (
                  <div
                    key={e.id}
                    className={`p-3 rounded-lg border text-xs space-y-2 transition-all cursor-pointer hover:border-indigo-500/40 ${
                      e.resolved
                        ? "bg-slate-950/40 border-slate-800/60 opacity-60"
                        : "bg-indigo-950/10 border-indigo-500/20 shadow-[inset_0_0_8px_rgba(99,102,241,0.03)]"
                    }`}
                    onClick={() => setSelectedAIEvent(e)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-300 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        {e.deviceName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        e.threatLevel === "critical"
                          ? "bg-red-500 text-slate-950"
                          : e.threatLevel === "high"
                          ? "bg-orange-500/20 text-orange-400"
                          : e.threatLevel === "medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {e.threatLevel}
                      </span>
                    </div>
                    
                    <p className="text-slate-400 leading-normal line-clamp-2">{e.description}</p>
                    
                    {/* Objects detected chips */}
                    {e.objectsDetected && e.objectsDetected.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {e.objectsDetected.map((obj, idx) => (
                          <span key={idx} className="bg-slate-950 text-slate-500 border border-slate-900 text-[8px] px-1 rounded font-mono">
                            {obj}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-1.5">
                      <span className="font-mono">{e.timestamp}</span>
                      <div className="flex gap-2">
                        <span className="text-indigo-400 font-semibold hover:underline">Inspect</span>
                        {!e.resolved && (
                          <button
                            onClick={(clickEv) => {
                              clickEv.stopPropagation();
                              onResolveAIEvent(e.id);
                            }}
                            className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

      </div>

      {/* Forensic Inspection Modal */}
      {selectedAIEvent && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <button 
              onClick={() => setSelectedAIEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 font-bold text-xl cursor-pointer"
            >
              &times;
            </button>
            
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-black text-slate-100 text-sm">Machine Vision Forensic Ingestion</h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Device: {selectedAIEvent.deviceName} (#{selectedAIEvent.deviceId})</span>
              </div>
            </div>

            {/* Vision image with bounding boxes overlay */}
            <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-black aspect-video flex justify-center items-center">
              <img 
                src={selectedAIEvent.imageUrl} 
                alt="AI surveillance feed capture" 
                className="w-full h-full object-cover opacity-80"
              />
              {/* Render bounding boxes if any */}
              {selectedAIEvent.boundingBoxes?.map((box: any, idx: number) => (
                <div 
                  key={idx} 
                  className="absolute border-2 border-red-500 bg-red-500/10 text-red-500 font-mono text-[9px] font-black p-0.5"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.w}%`,
                    height: `${box.h}%`
                  }}
                >
                  {box.label.toUpperCase()}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Diagnostics Analysis</span>
                  <p className="text-xs text-slate-300 leading-normal">{selectedAIEvent.description}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Detected Signatures</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedAIEvent.objectsDetected.map((obj: string, idx: number) => (
                      <span key={idx} className="bg-slate-950 text-indigo-400 border border-indigo-900/40 text-[10px] px-2 py-0.5 rounded-md font-mono">
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">SecOps Dispatch Recommendation</span>
                  <p className="text-xs text-emerald-400 font-bold mt-1 leading-normal uppercase font-mono">{selectedAIEvent.prompt}</p>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-900 pt-3">
                  <span className="text-[10px] text-slate-500 font-mono">Ingestion Time: {selectedAIEvent.timestamp}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedAIEvent.threatLevel === "critical"
                      ? "bg-red-500 text-slate-950 animate-pulse"
                      : selectedAIEvent.threatLevel === "high"
                      ? "bg-orange-500/20 text-orange-400"
                      : selectedAIEvent.threatLevel === "medium"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {selectedAIEvent.threatLevel} Threat
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                onClick={() => setSelectedAIEvent(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs transition-all cursor-pointer"
              >
                Close Forensics
              </button>
              {!selectedAIEvent.resolved && (
                <button
                  onClick={() => {
                    onResolveAIEvent(selectedAIEvent.id);
                    setSelectedAIEvent(null);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer"
                >
                  Resolve Threat State
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
