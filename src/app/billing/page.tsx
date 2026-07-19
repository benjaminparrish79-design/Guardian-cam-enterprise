"use client";

import { useEffect, useState } from "react";
import { CreditCard, ShieldCheck, Camera, Car, Building, ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function BillingPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing");
        if (!res.ok) {
          throw new Error("Failed to load billing configuration");
        }
        const data = await res.json();
        setConfig(data);
      } catch (err: any) {
        console.error("Error loading billing config:", err);
        setError(err.message || "Failed to contact billing service");
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  const upgrade = async () => {
    setUpgrading(true);
    setError(null);
    try {
      // Call secure /api/billing/checkout endpoint with price ID
      const res = await fetch("/api/billing/checkout", { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          priceId: "price_1Pjprofessional", // Placeholder/Test Stripe Price ID 
        }) 
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate billing checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from the billing server.");
      }
    } catch (err: any) {
      console.error("Stripe Checkout Redirect Error:", err);
      setError(err?.message || "Stripe billing checkout is currently unavailable. Ensure STRIPE_SECRET_KEY is configured.");
      setUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased relative">
      {/* Top ambient color glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md p-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to CommandCenter</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">GuardianCam SecOps Billing</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 md:py-20 relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-[0.2em] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operational Limits</span>
          </div>
          <h1 id="billing-title" className="text-4xl font-extrabold tracking-tight text-slate-50">
            Billing & Subscription
          </h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed">
            Manage your GuardianCam Enterprise limits, unlock advanced model reasoning tiers, and upgrade environmental monitoring pipelines.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wider block">Operational Error</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-900/20 border border-slate-900 rounded-3xl">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Querying subscription registry...</span>
          </div>
        ) : (
          config && (
            <div className="space-y-8">
              {/* Main Card */}
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl relative overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <CreditCard className="w-40 h-40" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1">Active Status</span>
                    <p className="text-3xl font-black tracking-tight text-slate-50">
                      {config.tierName} Plan
                    </p>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-2xl px-6 py-3 text-right">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block mb-0.5">Billing Rate</span>
                    <span className="text-xl font-bold text-emerald-300">{config.price}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-4">Resource Allocation</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cameras */}
                    <div className="bg-slate-950/50 border border-slate-900/80 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Surveillance</span>
                        <span className="text-lg font-bold text-slate-200">{config.maxCameras} Cameras</span>
                      </div>
                    </div>

                    {/* Vehicles */}
                    <div className="bg-slate-950/50 border border-slate-900/80 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Fleet Transit</span>
                        <span className="text-lg font-bold text-slate-200">{config.maxVehicles} Vehicles</span>
                      </div>
                    </div>

                    {/* Properties */}
                    <div className="bg-slate-950/50 border border-slate-900/80 p-5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-slate-900 rounded-xl text-slate-400">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Compliance</span>
                        <span className="text-lg font-bold text-slate-200">{config.maxProperties} Properties</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                {config.unlockedFeatures && config.unlockedFeatures.length > 0 && (
                  <div className="mt-8">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-3">Unlocked Capabilities</span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
                      {config.unlockedFeatures.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-emerald-400">✓</span> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-mono text-slate-500">
                    Florida SecOps Registry ID: <span className="text-slate-400">GC-3000-M1</span>
                  </div>
                  <button 
                    id="upgrade-button"
                    onClick={upgrade} 
                    disabled={upgrading || config.tierName === "Professional"}
                    className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] cursor-pointer disabled:cursor-not-allowed"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Initializing Stripe Checkout...</span>
                      </>
                    ) : config.tierName === "Professional" ? (
                      <span>Unmatched Tier Active</span>
                    ) : (
                      <span>Upgrade to Professional</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Secure Transaction Notice */}
              <div className="text-center font-mono text-[10px] text-slate-500 uppercase tracking-widest mt-6">
                🔒 Secured via stripe checkout encryption protocol
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
