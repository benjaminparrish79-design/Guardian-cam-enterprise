import React, { useState } from "react";
import { BillingConfig } from "../types";
import { 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  FileText, 
  Terminal,
  Activity
} from "lucide-react";

interface BillingSettingsProps {
  currentConfig: BillingConfig;
  onUpgradePlan: (planName: "Free" | "Starter" | "Professional" | "Enterprise") => void;
  camerasCount: number;
  vehiclesCount: number;
  propertiesCount: number;
}

const TIER_PRICING: Record<"Free" | "Starter" | "Professional" | "Enterprise", {
  price: string;
  cameras: number;
  vehicles: number;
  properties: number;
  desc: string;
  features: string[];
}> = {
  Free: {
    price: "$0",
    cameras: 2,
    vehicles: 1,
    properties: 1,
    desc: "Single-property trial and basic evaluation.",
    features: [
      "Basic AI vision analysis (Lite model)",
      "2 camera stream endpoints",
      "1 GPS patrol fleet connection",
      "1 GIBMP compliance record",
      "Standard support email"
    ]
  },
  Starter: {
    price: "$99/mo",
    cameras: 5,
    vehicles: 2,
    properties: 2,
    desc: "Perimeter protection for small sites and HOAs.",
    features: [
      "Gemini 3.5-flash standard analysis",
      "5 camera stream endpoints",
      "2 GPS patrol fleets",
      "2 GIBMP compliance records",
      "Synthetic scenario synthesis (1K resolution)",
      "Automated webhook alerts"
    ]
  },
  Professional: {
    price: "$299/mo",
    cameras: 15,
    vehicles: 5,
    properties: 5,
    desc: "Production operations for regional logistics yards.",
    features: [
      "Unrestricted AI vision models access",
      "15 camera stream endpoints",
      "5 GPS patrol fleets",
      "5 GIBMP compliance records",
      "Synthetic scenario synthesis (2K resolution)",
      "Priority API rate-limits",
      "Auditing and server logs export"
    ]
  },
  Enterprise: {
    price: "$999/mo",
    cameras: 100,
    vehicles: 25,
    properties: 20,
    desc: "Tactical SecOps defense suite for municipal assets.",
    features: [
      "gemini-3.1-pro advanced forensics",
      "100 camera stream endpoints",
      "25 GPS patrol fleets",
      "20 GIBMP compliance records",
      "Scenario synthesis (Studio 4K resolution)",
      "Florida GIBMP Predictive Rating",
      "Instant Stripe webhook validation",
      "Dedicated SecOps engineer support"
    ]
  }
};

export default function BillingSettings({
  currentConfig,
  onUpgradePlan,
  camerasCount,
  vehiclesCount,
  propertiesCount
}: BillingSettingsProps) {
  const [activePlan, setActivePlan] = useState<"Free" | "Starter" | "Professional" | "Enterprise">(currentConfig.tierName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webhookLog, setWebhookLog] = useState<string | null>(null);

  const handleSimulateSubscription = async (tier: "Free" | "Starter" | "Professional" | "Enterprise") => {
    setIsProcessing(true);
    setWebhookLog(null);

    // Simulate safe Stripe checkout redirect and dynamic Webhook callback loop
    setTimeout(() => {
      onUpgradePlan(tier);
      setActivePlan(tier);
      setIsProcessing(false);

      // Print simulated Stripe webhook ledger event
      setWebhookLog(
        `STRIPE_WEBHOOK [evt_sub_updated]: Subscription updated to '${tier.toUpperCase()}' plan. Metadata limits: max_cameras=${TIER_PRICING[tier].cameras}, max_vehicles=${TIER_PRICING[tier].vehicles}. Applying changes to Org Database... SUCCESS.`
      );
    }, 1500);
  };

  return (
    <div id="stripe-billing-settings" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            SaaS Billing & Limits
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enforce real-time multi-tenant limits. Simulate Stripe webhook actions to upgrade security parameters.
          </p>
        </div>

        {/* Current limits diagnostic cards */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Subscription: {currentConfig.tierName} Plan
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-extrabold">{TIER_PRICING[currentConfig.tierName].price}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-slate-900/60 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Cameras</span>
              <span className="text-sm font-bold text-slate-200">{camerasCount} / {currentConfig.maxCameras}</span>
            </div>
            <div className="text-center bg-slate-900/60 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Vehicles</span>
              <span className="text-sm font-bold text-slate-200">{vehiclesCount} / {currentConfig.maxVehicles}</span>
            </div>
            <div className="text-center bg-slate-900/60 p-2 rounded border border-slate-900">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Properties</span>
              <span className="text-sm font-bold text-slate-200">{propertiesCount} / {currentConfig.maxProperties}</span>
            </div>
          </div>
        </div>

        {/* Webhook logs stream */}
        {webhookLog && (
          <div className="bg-black/80 rounded-lg p-3 border border-indigo-900/40 text-[10px] font-mono text-indigo-400 flex items-start gap-2">
            <Terminal className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{webhookLog}</span>
          </div>
        )}

        {/* Pricing Table Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(TIER_PRICING) as Array<"Free" | "Starter" | "Professional" | "Enterprise">).map((plan) => {
            const planDetails = TIER_PRICING[plan];
            const isCurrent = currentConfig.tierName === plan;

            return (
              <div
                key={plan}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? "bg-emerald-950/15 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.06)]"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-200">{plan}</span>
                    {isCurrent && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-widest">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-lg font-black text-slate-100 font-mono">{planDetails.price}</div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 h-7">{planDetails.desc}</p>
                  
                  <ul className="text-[9px] text-slate-500 space-y-1.5 border-t border-slate-900 pt-2 h-36 overflow-y-auto">
                    {planDetails.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulateSubscription(plan)}
                  disabled={isProcessing || isCurrent}
                  className={`w-full mt-4 py-2 rounded text-[10px] font-bold tracking-wider cursor-pointer transition-all ${
                    isCurrent
                      ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                      : isProcessing
                      ? "bg-slate-900 text-slate-600 animate-pulse"
                      : "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500 hover:to-teal-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 hover:border-transparent font-extrabold"
                  }`}
                >
                  {isCurrent ? "CURRENT PLAN" : isProcessing ? "SYNCING..." : `UPGRADE PLAN`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
