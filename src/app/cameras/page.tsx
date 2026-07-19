"use client";

import { useEffect, useState, useCallback } from "react";
import { camerasService, eventsService } from "@/lib/supabase-client";
import type { Camera, Event } from "@/types/guardiancam";
import CameraRegistration from "@/components/CameraRegistration";
import AuthGuard from "@/components/AuthGuard";
import { 
  Camera as CameraIcon, 
  ArrowLeft, 
  Plus, 
  X, 
  Activity, 
  MapPin, 
  Cpu, 
  ShieldAlert, 
  Tv, 
  Clock, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCameras = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await camerasService.getUserCameras();
      if (error) {
        throw new Error(error.message || "Failed to load cameras");
      }
      const fetchedCameras = data || [];
      setCameras(fetchedCameras);
      if (fetchedCameras.length > 0 && !selectedCameraId) {
        setSelectedCameraId(fetchedCameras[0].id);
      }
    } catch (err: any) {
      console.error("Error loading cameras:", err);
      setError(err.message || "Could not retrieve camera network status.");
    } finally {
      setLoading(false);
    }
  }, [selectedCameraId]);

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  const handleSelect = (id: string) => {
    setSelectedCameraId(id);
    setEvents([]);
  };

  useEffect(() => {
    if (!selectedCameraId) return;

    // Load existing events or set empty state before real-time kicks in
    setEvents([]);

    // Establish Supabase Realtime Subscription for the selected camera
    const sub = eventsService.subscribeToCameraEvents(selectedCameraId, (payload) => {
      console.log("Real-time camera event payload received:", payload);
      if (payload?.new) {
        setEvents((prev) => [payload.new as Event, ...prev].slice(0, 50));
      }
    });

    return () => {
      if (sub && typeof sub.unsubscribe === "function") {
        sub.unsubscribe();
      }
    };
  }, [selectedCameraId]);

  const activeCamera = cameras.find((c) => c.id === selectedCameraId);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased relative">
      {/* Dynamic top ambient glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 p-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition-all shadow-inner flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] tracking-[0.2em] text-indigo-400 uppercase bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/10">
                  SecOps Pipeline
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-mono tracking-widest uppercase">REAL-TIME ACTIVE</span>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-50 uppercase">
                GuardianCam Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Camera</span>
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 z-10">
        
        {/* Left Side: Camera Selection List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Live Edge Nodes ({cameras.length})
            </h2>
            <button 
              onClick={loadCameras}
              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 border border-slate-900 bg-slate-900/10 rounded-2xl">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Syncing Nodes...</span>
            </div>
          ) : cameras.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 bg-slate-900/10 rounded-3xl text-center space-y-4">
              <CameraIcon className="w-12 h-12 text-slate-700 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">No Edge Devices Registered</p>
                <p className="text-[10px] text-slate-600 max-w-[200px] mx-auto leading-relaxed">
                  Provision your first IP dome, bullet, or phone camera to begin live threat tracking.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="mx-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                + Register First Node
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {cameras.map((cam) => {
                const isSelected = cam.id === selectedCameraId;
                const isOnline = cam.status === "online";
                
                return (
                  <button
                    key={cam.id}
                    onClick={() => handleSelect(cam.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected 
                        ? "bg-indigo-950/30 border-indigo-500/40 shadow-lg shadow-indigo-500/5" 
                        : "bg-slate-900/40 border-slate-900 hover:border-slate-800 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected 
                          ? "bg-indigo-500/10 text-indigo-400" 
                          : "bg-slate-950 text-slate-500"
                      }`}>
                        <CameraIcon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className={`text-xs font-bold truncate ${
                          isSelected ? "text-indigo-200" : "text-slate-200"
                        }`}>
                          {cam.name || "Unnamed Node"}
                        </p>
                        <span className="text-[10px] font-mono text-slate-500 tracking-wide block truncate">
                          {cam.location || "Tampa Corridor"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className={`w-2 h-2 rounded-full ${
                        isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "bg-slate-600"
                      }`} />
                      <span className="text-[8px] font-mono text-slate-600 mt-1 uppercase">
                        {cam.type || "IP Cam"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Primary Surveillance & Live Real-time Logs */}
        <section className="space-y-6">
          {activeCamera ? (
            <div className="space-y-6">
              
              {/* Camera Header Stats */}
              <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-50">
                      {activeCamera.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{activeCamera.location}</span>
                      </span>
                      <span className="text-slate-700">&bull;</span>
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-slate-500" />
                        <span>Type: {activeCamera.type}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl px-4 py-2 text-right">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">NODE ID</span>
                    <span className="text-xs font-mono text-slate-300 font-bold">{activeCamera.id.substring(0, 8)}...</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 rounded-2xl px-4 py-2 text-right">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">STATUS</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold uppercase">{activeCamera.status}</span>
                  </div>
                </div>
              </div>

              {/* Feed & Events Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                
                {/* Simulated Lens Viewport */}
                <div className="space-y-3">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block">
                    Active Surveillance Stream
                  </span>
                  
                  <div className="relative aspect-video bg-slate-950 border border-slate-900 rounded-3xl overflow-hidden shadow-2xl group flex flex-col items-center justify-center">
                    {/* Retro Camera Grid overlay */}
                    <div className="absolute inset-0 border border-emerald-500/5 pointer-events-none" />
                    <div className="absolute top-4 left-4 font-mono text-[10px] text-emerald-400/80 bg-slate-950/80 px-2.5 py-1 rounded border border-emerald-500/10 flex items-center gap-1.5 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      <span>REC {activeCamera.name.substring(0, 10).toUpperCase()}</span>
                    </div>

                    <div className="absolute bottom-4 right-4 font-mono text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-900">
                      FL-SEC-NODE-{activeCamera.id.substring(0, 4).toUpperCase()}
                    </div>

                    {/* Immersive placeholder visuals */}
                    <CameraIcon className="w-16 h-16 text-slate-800 mb-2 animate-pulse" />
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                      Node Telemetry Connection Standby
                    </p>
                    <p className="text-[10px] text-slate-600 max-w-xs text-center mt-1">
                      Awaiting remote client capture or mobile SDK upload triggers.
                    </p>
                  </div>
                </div>

                {/* Real-time Event Subscriptions Logs */}
                <div className="flex flex-col h-[400px]">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-3">
                    Live Channel Signals
                  </span>

                  <div className="flex-1 bg-slate-950 border border-slate-900 rounded-3xl p-5 flex flex-col overflow-hidden relative">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-900 pb-3">
                      <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        Realtime PostgreSQL Hook
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {events.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600 space-y-3">
                          <Clock className="w-8 h-8 text-slate-800" />
                          <div>
                            <p className="text-xs font-semibold text-slate-500">Listening to Channel...</p>
                            <p className="text-[10px] text-slate-700 max-w-[180px] mx-auto mt-1 leading-relaxed">
                              Insert new rows in the <strong>public.events</strong> table linked to this camera ID to see real-time updates instantly.
                            </p>
                          </div>
                        </div>
                      ) : (
                        events.map((evt, idx) => {
                          const isHigh = evt.severity === "high" || evt.severity === "critical";
                          return (
                            <div 
                              key={evt.id || idx} 
                              className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition-all ${
                                isHigh 
                                  ? "bg-red-950/20 border-red-900/30 text-red-200" 
                                  : "bg-slate-900/40 border-slate-900 text-slate-300"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                                  isHigh 
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                }`}>
                                  {evt.severity || "medium"}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500">
                                  {evt.time ? new Date(evt.time).toLocaleTimeString() : "Just now"}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-200 mb-0.5">
                                {evt.type || "Surveillance Threat Identified"}
                              </p>
                              {evt.description && (
                                <p className="text-slate-400 text-[11px] leading-relaxed">
                                  {evt.description}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="py-32 text-center space-y-3 bg-slate-900/10 border border-slate-900 rounded-3xl p-8">
              <CameraIcon className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">No Node Selected</p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                Please register a camera or select an active node from the left channel selector to begin auditing real-time telemetry events.
              </p>
            </div>
          )}
        </section>

      </main>

      {/* Camera Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button
              onClick={() => {
                setShowRegisterModal(false);
                loadCameras(); // refresh list after adding
              }}
              className="absolute top-4 right-4 p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="p-1 max-w-full overflow-hidden">
              <CameraRegistration />
            </div>
            <div className="bg-slate-950 p-4 border-t border-slate-800/60 flex justify-end">
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  loadCameras(); // refresh list
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer monitor bar */}
      <footer className="border-t border-slate-900 bg-slate-950 p-4 text-center text-xs text-slate-500 font-mono mt-auto flex flex-col md:flex-row md:justify-between max-w-7xl mx-auto w-full gap-2">
        <span>GUARDIANCAM OPERATIONAL SUITE &bull; NODE MONITORS</span>
        <span className="flex items-center gap-1.5 justify-center md:justify-end text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ENCRYPTED POSTGRES CHANNELS ONLINE
        </span>
      </footer>

    </div>
    </AuthGuard>
  );
}
