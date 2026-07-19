import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mb-4">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">OPERATIONAL BOUNDARY EXCEEDED</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">
        The requested secure node path is not registered on this gateway, or access is restricted by current SecOps policies.
      </p>
      <Link
        href="/"
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs uppercase tracking-wider font-medium py-3 px-6 rounded-xl transition-colors cursor-pointer"
      >
        Return to Portal Gate
      </Link>
    </div>
  );
}
