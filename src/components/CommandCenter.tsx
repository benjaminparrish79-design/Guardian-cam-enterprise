import React from "react";
import { Device, SecurityAlert, AIEvent } from "../types";
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Volume2 
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
  const activeAlerts = alerts.filter(a => !a.resolved);
  const activeEvents = aiEvents.filter(e => !e.resolved);

  return (
    <div className="space-y-6">
      {/* Global Tactical Controls */}
      <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            GLOBAL TACTICAL OVERRIDE
          </h3>
          <button
            onClick={onTriggerGlobalSiren}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm tracking-wider flex items-center gap-2 transition-all ${
              globalSirenActive 
                ? "bg-red-600 text-white animate-pulse" 
                : "bg-slate-800 hover:bg-red-600/80 text-slate-200"
            }`}
          >
            {globalSirenActive ? <Volume2 className="w-4 h-4" /> : "ACTIVATE BASE SIREN"}
          </button>
        </div>
        <p className="text-xs text-slate-400">Triggers sirens and alert status across all online cameras.</p>
      </div>

      {/* Active Threats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            ACTIVE ALERTS ({activeAlerts.length})
          </h3>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {activeAlerts.length === 0 ? (
              <p className="text-slate-500 text-sm">No active threats. All systems nominal.</p>
            ) : (
              activeAlerts.map(alert => (
                <div key={alert.id} className="bg-red-950/30 border border-red-900/60 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{alert.deviceName}</div>
                      <div className="text-xs text-slate-400">{alert.timestamp}</div>
                    </div>
                    <button
                      onClick={() => onResolveAlert(alert.id)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-white"
                    >
                      RESOLVE
                    </button>
                  </div>
                  <p className="text-sm mt-2 text-slate-200">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Vision Events */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            RECENT AI EVENTS ({activeEvents.length})
          </h3>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {activeEvents.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent vision events.</p>
            ) : (
              activeEvents.map(event => (
                <div key={event.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="text-sm font-medium">{event.deviceName}</div>
                    <span className={`px-2 py-0.5 text-[10px] rounded uppercase tracking-widest ${
                      event.threatLevel === "critical" ? "bg-red-500 text-white" : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {event.threatLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{event.description}</p>
                  <button
                    onClick={() => onResolveAIEvent(event.id)}
                    className="mt-3 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    MARK RESOLVED
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
