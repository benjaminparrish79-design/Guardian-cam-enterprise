import React from "react";
import { BillingConfig } from "../types";
import { CreditCard, Zap, Users, Camera, Car } from "lucide-react";

interface BillingSettingsProps {
  currentConfig: BillingConfig;
  onUpgradePlan: (plan: "Free" | "Starter" | "Professional" | "Enterprise") => void;
  camerasCount: number;
  vehiclesCount: number;
  propertiesCount: number;
}

const PLANS = [
  { name: "Starter", price: "$99/mo", maxCams: 5, maxVehicles: 2, maxProps: 2, color: "emerald" },
  { name: "Professional", price: "$299/mo", maxCams: 15, maxVehicles: 5, maxProps: 5, color: "indigo" },
  { name: "Enterprise", price: "$999/mo", maxCams: 100, maxVehicles: 25, maxProps: 20, color: "amber" },
];

export default function BillingSettings({
  currentConfig,
  onUpgradePlan,
  camerasCount,
  vehiclesCount,
  propertiesCount
}: BillingSettingsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Current Plan: <span className="text-emerald-400">{currentConfig.tierName}</span></h2>
        <p className="text-slate-400">{currentConfig.price}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.name === currentConfig.tierName;
          return (
            <div
              key={plan.name}
              className={`border rounded-2xl p-6 transition-all ${isCurrent ? "border-emerald-500 bg-emerald-950/30" : "border-slate-800 hover:border-slate-700"}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{plan.price}</div>
                </div>
                {isCurrent && <span className="text-emerald-400 text-xs font-bold px-3 py-1 bg-emerald-900/50 rounded">CURRENT</span>}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>{plan.maxCams} Cameras</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Car className="w-4 h-4 text-slate-400" />
                  <span>{plan.maxVehicles} Vehicles</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{plan.maxProps} Properties</span>
                </div>
              </div>

              <button
                onClick={() => onUpgradePlan(plan.name as any)}
                disabled={isCurrent}
                className={`w-full py-3 rounded-lg text-sm font-bold transition-all ${
                  isCurrent 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                }`}
              >
                {isCurrent ? "ACTIVE PLAN" : "UPGRADE TO THIS PLAN"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 border border-slate-800 rounded-lg p-4">
        Upgrading immediately updates resource limits and unlocks higher-tier Gemini models.
      </div>
    </div>
  );
}
