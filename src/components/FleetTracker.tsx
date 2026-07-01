import React, { useState, useEffect } from "react";
import { Device } from "../types";
import { 
  Globe, 
  MapPin, 
  Navigation, 
  Terminal, 
  Radio, 
  ShieldCheck, 
  Zap,
  Play,
  RotateCcw
} from "lucide-react";

interface FleetTrackerProps {
  vehicles: Device[];
}

interface DispatchLog {
  time: string;
  vehicle: string;
  message: string;
  type: "status" | "warning" | "success";
}

export default function FleetTracker({ vehicles }: FleetTrackerProps) {
  const [logs, setLogs] = useState<DispatchLog[]>([
    { time: "00:01:12", vehicle: "Patrol-Alpha", message: "GPS lock stabilized. Beginning Sector 1 sweep.", type: "status" },
    { time: "00:02:45", vehicle: "Patrol-Bravo", message: "GIBMP Environmental buffer gate inspected. All secure.", type: "success" },
    { time: "00:04:10", vehicle: "Patrol-Alpha", message: "Checking hazardous waste drum seal at Zone B.", type: "status" }
  ]);

  const [simulationSpeed, setSimulationSpeed] = useState<"normal" | "fast" | "stopped">("normal");
  const [simulatedPositions, setSimulatedPositions] = useState<Record<string, { lat: number; lng: number; angle: number }>>({});

  // Initialize and run vehicle simulation
  useEffect(() => {
    // Initial positions
    const initial: Record<string, { lat: number; lng: number; angle: number }> = {};
    vehicles.forEach((v) => {
      initial[v.id] = { lat: v.latitude, lng: v.longitude, angle: Math.random() * 360 };
    });
    setSimulatedPositions(initial);
  }, [vehicles]);

  useEffect(() => {
    if (simulationSpeed === "stopped") return;

    const intervalTime = simulationSpeed === "fast" ? 1000 : 3000;

    const simInterval = setInterval(() => {
      setSimulatedPositions((prev) => {
        const next = { ...prev };
        vehicles.forEach((v) => {
          if (!next[v.id]) {
            next[v.id] = { lat: v.latitude, lng: v.longitude, angle: Math.random() * 360 };
            return;
          }

          const curr = next[v.id];
          // Slow patrol circular orbit/random walk simulating real security sweeps
          const speedFactor = simulationSpeed === "fast" ? 0.003 : 0.001;
          const deltaLat = (Math.random() - 0.5) * speedFactor;
          const deltaLng = (Math.random() - 0.5) * speedFactor;
          
          // Calculate angle for icon orientation
          const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);

          next[v.id] = {
            lat: curr.lat + deltaLat,
            lng: curr.lng + deltaLng,
            angle: angle
          };

          // Occasionally inject logs
          if (Math.random() > 0.7) {
            const possibleMessages = [
              "Conducting visual sweep of secondary chainlink perimeter.",
              "Speed regulated at 15 km/h. High thermal cameras functional.",
              "Environmental checklist scan active. Drainage basins are clear.",
              "Secure radio beacon check-in. Signal strength excellent.",
              "Encountered minor waste debris on pathway. Dispatching removal task."
            ];
            const randomMsg = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
            const timestamp = new Date().toTimeString().split(" ")[0];
            
            setLogs((prevLogs) => [
              { time: timestamp, vehicle: v.name, message: randomMsg, type: "status" },
              ...prevLogs.slice(0, 15) // Keep last 15 entries
            ]);
          }
        });
        return next;
      });
    }, intervalTime);

    return () => clearInterval(simInterval);
  }, [vehicles, simulationSpeed]);

  const handleManualDispatch = (vName: string) => {
    const timestamp = new Date().toTimeString().split(" ")[0];
    setLogs((prev) => [
      { time: timestamp, vehicle: vName, message: "Manual vector override code sent. Recalculating patrol sweep.", type: "warning" },
      ...prev
    ]);
  };

  const handleResetSim = () => {
    const initial: Record<string, { lat: number; lng: number; angle: number }> = {};
    vehicles.forEach((v) => {
      initial[v.id] = { lat: v.latitude, lng: v.longitude, angle: Math.random() * 360 };
    });
    setSimulatedPositions(initial);
    const timestamp = new Date().toTimeString().split(" ")[0];
    setLogs((prev) => [
      { time: timestamp, vehicle: "System", message: "Tactical Fleet GPS tracker coordinates reset to baseline.", type: "status" },
      ...prev
    ]);
  };

  return (
    <div id="gps-fleet-tracker" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            Command GPS Fleet Map
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time orbital telemetry coordinates and routing for active field patrol units.
          </p>
        </div>

        {/* Speed selectors */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setSimulationSpeed("normal")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
              simulationSpeed === "normal" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            NORMAL
          </button>
          <button
            onClick={() => setSimulationSpeed("fast")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
              simulationSpeed === "fast" ? "bg-indigo-500 text-slate-950" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            FAST
          </button>
          <button
            onClick={() => setSimulationSpeed("stopped")}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
              simulationSpeed === "stopped" ? "bg-red-500/20 text-red-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            PAUSE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Tactical Map Grid view */}
        <div className="lg:col-span-7 bg-slate-950 rounded-xl border border-slate-800/80 relative overflow-hidden h-[300px] lg:h-auto min-h-[300px] flex flex-col justify-between">
          
          {/* Complex Technical grid background representing target facility map */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, #312e81 1px, transparent 1px), linear-gradient(to right, #1e1b4b 1px, transparent 1px), linear-gradient(to bottom, #1e1b4b 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />

          {/* Map Compass HUD lines */}
          <div className="absolute top-4 left-4 z-10 text-[10px] font-mono text-indigo-400/80 uppercase space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
              FACILITY GRID LOCK: ACTIVE
            </div>
            <div>LAT ACCURACY: ±0.0001m</div>
          </div>

          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleResetSim}
              className="p-1.5 bg-slate-900 border border-slate-800 text-indigo-400 hover:text-indigo-200 rounded transition-all"
              title="Reset GPS telemetry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive vehicle position elements on visual map vector canvas */}
          <div className="relative flex-1 flex items-center justify-center">
            
            {/* Main Facility Compound Boundary mockup line */}
            <div className="w-[85%] h-[75%] border-2 border-dashed border-indigo-900/50 rounded-xl relative flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-950/5 rounded-xl border border-indigo-950/20" />
              <div className="text-[10px] font-mono font-bold text-indigo-950 uppercase absolute bottom-2 right-3">
                SEC-COMPOUND ALPHA
              </div>

              {/* GIBMP compliance buffer zones visually highlighted */}
              <div className="absolute top-4 left-4 text-[9px] font-mono bg-emerald-950/30 border border-emerald-900/40 text-emerald-500/80 px-1.5 py-0.5 rounded">
                GIBMP BUFFER ZONE A
              </div>

              {/* Render simulated patrol positions inside visual boundary */}
              {vehicles.map((v) => {
                const pos = simulatedPositions[v.id] || { lat: v.latitude, lng: v.longitude, angle: 0 };
                // Map the latitude/longitude bounds into 0-100% space
                const percentX = Math.max(5, Math.min(95, ((pos.lng - (-82.48)) / 0.05) * 100));
                const percentY = Math.max(5, Math.min(95, ((pos.lat - 27.92) / 0.05) * 100));

                return (
                  <div
                    key={v.id}
                    className="absolute transition-all duration-1000 ease-linear flex flex-col items-center"
                    style={{
                      left: `${percentX}%`,
                      top: `${percentY}%`
                    }}
                  >
                    <div className="relative group cursor-pointer" onClick={() => handleManualDispatch(v.name)}>
                      <div className="p-1.5 bg-indigo-500 text-slate-950 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)] transform transition-transform" style={{
                        transform: `rotate(${pos.angle}deg)`
                      }}>
                        <Navigation className="w-3.5 h-3.5 fill-current" />
                      </div>
                      
                      {/* Telemetry popup tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-slate-950 text-[10px] border border-slate-800 text-slate-200 px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        <span className="font-bold">{v.name}</span>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          Lat: {pos.lat.toFixed(5)}<br />
                          Lng: {pos.lng.toFixed(5)}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 mt-1 uppercase tracking-wide">
                      {v.name}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Map Footer status */}
          <div className="p-3 bg-slate-900 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              ALL GPS CHANNELS SYNCHRONIZED
            </span>
            <span>UHF FREQ: 462.5625 MHz</span>
          </div>
        </div>

        {/* Right Side: Tactical Dispatch Terminal */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-slate-950 rounded-xl border border-slate-800/80 flex-1 flex flex-col overflow-hidden max-h-[350px]">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-400" />
                Radio Dispatch Monitor
              </span>
              <span className="animate-pulse w-2 h-2 bg-indigo-500 rounded-full" />
            </div>

            <div className="p-4 space-y-3 overflow-y-auto font-mono text-[11px] leading-relaxed flex-1 scrollbar-thin">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 text-slate-400 border-b border-slate-900/60 pb-1.5">
                  <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                  <div className="space-y-0.5">
                    <span className="text-indigo-400 font-bold hover:underline cursor-pointer">
                      {log.vehicle}:
                    </span>{" "}
                    <span className={
                      log.type === "success" 
                        ? "text-emerald-400 font-medium" 
                        : log.type === "warning" 
                        ? "text-yellow-400" 
                        : "text-slate-300"
                    }>
                      {log.message}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
