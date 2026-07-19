"use client";

import React, { useState } from "react";
import { camerasService } from "@/lib/supabase-client";

export default function CameraRegistration() {
  const [form, setForm] = useState({ name: "", location: "", type: "Phone Camera" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Pass 'status: "online"' to satisfy the Camera schema requirements in supabase.ts
    const { error } = await camerasService.createCamera({
      ...form,
      status: "online"
    });

    if (!error) {
      alert("Camera registered!");
      setMessage({ type: "success", text: "Camera registered successfully!" });
      setForm({ name: "", location: "", type: "Phone Camera" });
    } else {
      setMessage({ type: "error", text: error.message || "Failed to register camera." });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-slate-100 mb-2">Register Live Camera Endpoint</h3>
      <p className="text-xs text-slate-400 mb-5">
        Provision a new edge video or phone camera feed to the secure monitoring grid.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Camera Name
          </label>
          <input
            type="text"
            placeholder="e.g., Gate 4 Entrance"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Location Coordinates or Label
          </label>
          <input
            type="text"
            placeholder="e.g., North Wall Fence / Tampa, FL"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Device Type
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm cursor-pointer"
          >
            <option value="Phone Camera">Phone Camera</option>
            <option value="Dome IP Camera">Dome IP Camera</option>
            <option value="Bullet Camera">Bullet Camera</option>
            <option value="PTZ Camera">PTZ Camera</option>
          </select>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 px-6 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Registering...
            </>
          ) : (
            "Register Camera"
          )}
        </button>
      </form>
    </div>
  );
}
