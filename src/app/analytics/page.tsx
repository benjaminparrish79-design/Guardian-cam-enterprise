'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({ cameras: 0, alerts: 0, compliance: 92 });

  useEffect(() => {
    // Mock data or fetch from API
    setStats({ cameras: 12, alerts: 47, compliance: 92 });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <BarChart3 className="w-8 h-8" /> SecOps Intelligence
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-3xl">
          <div className="text-emerald-400 text-sm font-mono">ACTIVE CAMERAS</div>
          <div className="text-5xl font-black mt-2">{stats.cameras}</div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-3xl">
          <div className="text-rose-400 text-sm font-mono">THREAT ALERTS</div>
          <div className="text-5xl font-black mt-2">{stats.alerts}</div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-3xl">
          <div className="text-amber-400 text-sm font-mono">GIBMP SCORE</div>
          <div className="text-5xl font-black mt-2">{stats.compliance}%</div>
        </div>
      </div>
    </div>
  );
}
