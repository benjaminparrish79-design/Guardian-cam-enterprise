import React, { useState } from "react";
import { Device } from "../types";
import { 
  Camera, 
  Car, 
  Plus, 
  Volume2, 
  VolumeX, 
  Lightbulb, 
  Play, 
  Pause, 
  Battery, 
  Wifi, 
  Trash2, 
  MapPin, 
  ShieldAlert,
  Server
} from "lucide-react";

interface DeviceManagerProps {
  devices: Device[];
  onToggleControl: (id: string, controlType: "siren" | "light" | "recording") => void;
  onAddDevice: (device: Omit<Device, "id" | "status" | "lastActive">) => void;
  onRemoveDevice: (id: string) => void;
  onToggleDemoMode: () => void;
  isDemoMode: boolean;
  maxCameras: number;
  maxVehicles: number;
}

export default function DeviceManager({
  devices,
  onToggleControl,
  onAddDevice,
  onRemoveDevice,
  onToggleDemoMode,
  isDemoMode,
  maxCameras,
  maxVehicles
}: DeviceManagerProps) {
  const [activeTab, setActiveTab] = useState<"all" | "camera" | "vehicle">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState<"camera" | "vehicle">("camera");
  const [driverName, setDriverName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");

  const filteredDevices = devices.filter(
    (d) => activeTab === "all" || d.type === activeTab
  );

  const camerasCount = devices.filter((d) => d.type === "camera").length;
  const vehiclesCount = devices.filter((d) => d.type === "vehicle").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    if (newDeviceType === "camera" && camerasCount >= maxCameras) {
      alert(`Camera limit reached (${maxCameras}) for your current billing plan. Upgrade your subscription to add more.`);
      return;
    }
    if (newDeviceType === "vehicle" && vehiclesCount >= maxVehicles) {
      alert(`Vehicle limit reached (${maxVehicles}) for your current billing plan. Upgrade your subscription to add more.`);
      return;
    }

    onAddDevice({
      name: newDeviceName,
      type: newDeviceType,
      signal: "excellent",
      latitude: 27.9506 + (Math.random() - 0.5) * 0.05,
      longitude: -82.4572 + (Math.random() - 0.5) * 0.05,
      driverName: newDeviceType === "vehicle" ? driverName || "Operator" : undefined,
      licensePlate: newDeviceType === "vehicle" ? licensePlate || "SEC-991" : undefined,
      sirenOn: false,
      lightOn: false,
      recording: false,
    });

    setNewDeviceName("");
    setDriverName("");
    setLicensePlate("");
    setShowAddForm(false);
  };

  return (
    <div id="secops-device-manager" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            SecOps Asset Grid
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time management of tactical endpoints, cameras, and patrols.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDemoMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-2 border ${
              isDemoMode
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isDemoMode ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            {isDemoMode ? "SIMULATOR ACTIVE" : "SIMULATOR PAUSED"}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Provision Asset
          </button>
        </div>
      </div>

      {/* Limit meters */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-400">Cameras Limit</span>
            <span className="text-slate-200">{camerasCount} / {maxCameras}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${camerasCount >= maxCameras ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, (camerasCount / maxCameras) * 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-400">Patrol Vehicles Limit</span>
            <span className="text-slate-200">{vehiclesCount} / {maxVehicles}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${vehiclesCount >= maxVehicles ? "bg-red-500" : "bg-indigo-500"}`}
              style={{ width: `${Math.min(100, (vehiclesCount / maxVehicles) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Provision Form Modal/Overlay styled clean */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
            <span className="text-sm font-semibold text-slate-100">Provision Endpoints</span>
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)} 
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Asset Name</label>
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g. Fence Line Zone 4"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Asset Type</label>
              <select
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value as "camera" | "vehicle")}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="camera">Static AI Thermal Camera</option>
                <option value="vehicle">Tactical Patrol Vehicle</option>
              </select>
            </div>
          </div>

          {newDeviceType === "vehicle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-900 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Patrol Officer / Driver</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Officer K. Vance"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Plate Reg Number</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="e.g. FL-GCR77"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded text-xs font-bold transition-all duration-300"
            >
              Confirm Provisioning
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            activeTab === "all"
              ? "bg-slate-800 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Assets ({devices.length})
        </button>
        <button
          onClick={() => setActiveTab("camera")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "camera"
              ? "bg-slate-800 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-emerald-400" />
          AI Cameras ({camerasCount})
        </button>
        <button
          onClick={() => setActiveTab("vehicle")}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "vehicle"
              ? "bg-slate-800 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Car className="w-3.5 h-3.5 text-indigo-400" />
          Patrol Fleets ({vehiclesCount})
        </button>
      </div>

      {/* Devices List */}
      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {filteredDevices.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
            <p className="text-sm text-slate-500">No security assets deployed under this view filter.</p>
          </div>
        ) : (
          filteredDevices.map((device) => (
            <div
              key={device.id}
              className={`p-4 rounded-xl border transition-all ${
                device.status === "alerting"
                  ? "bg-red-950/20 border-red-900/60 shadow-[inset_0_0_12px_rgba(239,68,68,0.06)]"
                  : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    device.status === "alerting"
                      ? "bg-red-500/10 text-red-400 animate-pulse"
                      : "bg-slate-900 text-slate-300"
                  }`}>
                    {device.type === "camera" ? (
                      <Camera className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Car className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-sm">{device.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        device.status === "online" 
                          ? "bg-emerald-500" 
                          : device.status === "alerting"
                          ? "bg-red-500"
                          : "bg-slate-600"
                      }`} />
                      <span className="text-[10px] text-slate-500 font-mono">#{device.id}</span>
                    </div>
                    
                    {/* Extra context */}
                    {device.type === "vehicle" ? (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Plate: <span className="font-mono text-slate-300">{device.licensePlate}</span> | Ops: <span className="text-slate-300">{device.driverName}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Field of view: Emergency Gates Zone | Lat: <span className="font-mono">{device.latitude.toFixed(4)}</span>
                      </p>
                    )}

                    {/* Sensor Diagnostics bar */}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5 text-slate-400" />
                        {device.signal.toUpperCase()}
                      </span>
                      {device.battery !== undefined && (
                        <span className="flex items-center gap-1">
                          <Battery className="w-3.5 h-3.5 text-slate-400" />
                          {device.battery}%
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        GPS SYNCED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Tactical Actions for Camera */}
                  {device.type === "camera" && (
                    <>
                      <button
                        onClick={() => onToggleControl(device.id, "siren")}
                        title={device.sirenOn ? "Siren Active" : "Trigger Siren"}
                        className={`p-1.5 rounded-lg border transition-all ${
                          device.sirenOn
                            ? "bg-red-500/20 text-red-400 border-red-500/40 animate-bounce"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {device.sirenOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => onToggleControl(device.id, "light")}
                        title={device.lightOn ? "Light Active" : "Trigger Spotlight"}
                        className={`p-1.5 rounded-lg border transition-all ${
                          device.lightOn
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Standard Record command */}
                  <button
                    onClick={() => onToggleControl(device.id, "recording")}
                    title={device.recording ? "Recording Live" : "Start Live Feed Recording"}
                    className={`p-1.5 rounded-lg border transition-all ${
                      device.recording
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {device.recording ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                        <span className="text-[10px] font-bold">REC</span>
                      </span>
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => onRemoveDevice(device.id)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-950/30 hover:border-red-900/40 transition-all cursor-pointer"
                    title="Deprovision Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
