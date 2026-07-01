import React, { useState } from "react";
import { ComplianceRecord, InspectionChecklist } from "../types";
import { 
  FileCheck, 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  User, 
  Activity,
  Award
} from "lucide-react";

interface ComplianceHubProps {
  records: ComplianceRecord[];
  onAddRecord: (record: ComplianceRecord) => void;
  maxProperties: number;
}

export default function ComplianceHub({ records, onAddRecord, maxProperties }: ComplianceHubProps) {
  const [activeRecordId, setActiveRecordId] = useState<string>(records[0]?.id || "");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [propertyName, setPropertyName] = useState("");
  const [inspector, setInspector] = useState("");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<InspectionChecklist>({
    fertilizerRules: true,
    runoffMitigation: true,
    pesticideStorage: false,
    bufferZones: true,
    irrigationSchedule: false,
    hazardousDisposal: true
  });

  const activeRecord = records.find((r) => r.id === activeRecordId) || records[0];

  // Dynamic GIBMP Scorer based on checklist items
  const calculateScore = (ch: InspectionChecklist): number => {
    let pts = 0;
    if (ch.fertilizerRules) pts += 20;
    if (ch.runoffMitigation) pts += 20;
    if (ch.pesticideStorage) pts += 15;
    if (ch.bufferZones) pts += 15;
    if (ch.irrigationSchedule) pts += 15;
    if (ch.hazardousDisposal) pts += 15;
    return pts;
  };

  const getStatus = (score: number) => {
    if (score >= 85) return "compliant";
    if (score >= 60) return "warning";
    return "non-compliant";
  };

  // Toggle active record's items to demonstrate interactive GIBMP simulator
  const handleToggleChecklist = (key: keyof InspectionChecklist) => {
    if (!activeRecord) return;
    
    const updatedChecklist = {
      ...activeRecord.checklist,
      [key]: !activeRecord.checklist[key]
    };
    
    const newScore = calculateScore(updatedChecklist);
    const newStatus = getStatus(newScore);

    // Update records in-place for simulation purposes
    activeRecord.checklist = updatedChecklist;
    activeRecord.score = newScore;
    activeRecord.status = newStatus;
    
    // Trigger State refresh
    setActiveRecordId(activeRecord.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim()) return;

    if (records.length >= maxProperties) {
      alert(`Property limit reached (${maxProperties}) for your current billing plan. Upgrade subscription to unlock more.`);
      return;
    }

    const calculatedNewScore = calculateScore(checklist);
    const newRecord: ComplianceRecord = {
      id: `inspect-${Date.now()}`,
      propertyName,
      inspector: inspector || "Officer Vance",
      date: new Date().toLocaleDateString(),
      score: calculatedNewScore,
      status: getStatus(calculatedNewScore),
      notes: notes || "Baseline chemical buffer zone inspection conducted.",
      checklist: { ...checklist }
    };

    onAddRecord(newRecord);
    setActiveRecordId(newRecord.id);
    setShowAddForm(false);
    
    // Reset
    setPropertyName("");
    setInspector("");
    setNotes("");
  };

  return (
    <div id="gimbp-compliance-hub" className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            Florida GIBMP Compliance Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track and score environmental best practices, buffer perimeters, and fertilizer runoff.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ml-auto sm:ml-0"
        >
          <Plus className="w-4 h-4" />
          Log GIBMP Audit
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-sm font-semibold text-slate-100">Log Florida GIBMP Inspection Audit</span>
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
              <label className="block text-xs font-medium text-slate-400 mb-1">Property Name</label>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Everglades Marina Perimeter"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Lead Environmental Inspector</label>
              <input
                type="text"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="e.g. Officer K. Vance (GIBMP #8822)"
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick checklist configuration in creation form */}
          <div>
            <span className="block text-xs font-medium text-slate-400 mb-2">Environmental Checklist Configuration</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.keys(checklist).map((key) => {
                const checked = checklist[key as keyof InspectionChecklist];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChecklist(prev => ({ ...prev, [key]: !prev[key as keyof InspectionChecklist] }))}
                    className={`p-2 text-[10px] font-semibold border rounded text-left transition-all ${
                      checked 
                        ? "bg-emerald-950/20 border-emerald-500/50 text-slate-200" 
                        : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
                    }`}
                  >
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Audit Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Confirmed chemical fertilizers comply with Florida GIBMP buffer zones near water basin lines."
              className="w-full h-16 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded text-xs font-bold transition-all"
            >
              Log Compliance Record
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Side: Property ledger lists */}
        <div className="lg:col-span-4 bg-slate-950 rounded-xl border border-slate-800/80 p-3 flex flex-col max-h-[360px] overflow-y-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3 px-1">Monitored Properties</span>
          <div className="space-y-2">
            {records.map((rec) => (
              <button
                key={rec.id}
                onClick={() => setActiveRecordId(rec.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                  activeRecordId === rec.id
                    ? "bg-slate-900 border-slate-700 text-slate-100"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-900/40"
                }`}
              >
                <div className="truncate pr-2">
                  <span className="font-semibold text-xs block truncate text-slate-200">{rec.propertyName}</span>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5">Score: {rec.score}/100 GIBMP</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                  rec.status === "compliant"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : rec.status === "warning"
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                    : "bg-red-500/10 text-red-400 border border-red-500/30"
                }`}>
                  {rec.status === "compliant" ? "Pass" : "Warning"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Detailed properties GIBMP diagnostic card */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          {activeRecord ? (
            <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 space-y-4">
              
              {/* Score header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-3">
                <div>
                  <h3 className="font-bold text-slate-200 text-sm">{activeRecord.propertyName}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono uppercase mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {activeRecord.inspector}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {activeRecord.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Dynamic Ring/badge */}
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Predictive Score</div>
                    <div className="text-xl font-black text-slate-100 font-mono">{activeRecord.score}%</div>
                  </div>

                  <div className={`p-2 rounded-lg shrink-0 ${
                    activeRecord.status === "compliant"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {activeRecord.status === "compliant" ? (
                      <ShieldCheck className="w-7 h-7" />
                    ) : (
                      <AlertTriangle className="w-7 h-7" />
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive checklist toggles: clicking them dynamically updates GIBMP scores! */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex justify-between">
                  <span>Chemical Runoffs & Buffer Checklist</span>
                  <span className="text-emerald-500 font-normal normal-case">Click items to simulate live compliance adjustments</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.keys(activeRecord.checklist).map((key) => {
                    const checked = activeRecord.checklist[key as keyof InspectionChecklist];
                    return (
                      <div
                        key={key}
                        onClick={() => handleToggleChecklist(key as keyof InspectionChecklist)}
                        className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                          checked
                            ? "bg-slate-900/60 border-slate-800 text-slate-100 hover:border-slate-700"
                            : "bg-slate-900/20 border-slate-900/40 text-slate-500 hover:bg-slate-900/30"
                        }`}
                      >
                        <span className="text-xs font-semibold">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>

                        <div>
                          {checked ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-slate-700" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Environmental certification status */}
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-900 flex items-start gap-3">
                <Award className={`w-5 h-5 shrink-0 mt-0.5 ${
                  activeRecord.status === "compliant" ? "text-yellow-400" : "text-slate-600"
                }`} />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">GIBMP Certification Recommendation</span>
                  <p className="text-xs text-slate-400 leading-normal">
                    {activeRecord.status === "compliant" 
                      ? "Recommended for complete state environmental GIBMP credentialing. Certified chemical application and zero runoff threats detected."
                      : "Certification pending. Adjust fertilizer buffers and runoff channels to achieve GIBMP clearance codes."
                    }
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Log an inspection audit to view compliance breakdowns.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
