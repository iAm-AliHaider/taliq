"use client";
interface Grievance { ref?: string; category: string; subject: string; description?: string; severity: string; status: string; submitted_at?: string; resolution?: string; }
interface Props { grievances?: Grievance[]; mode?: string; onAction?: (a: string, p: Record<string, unknown>) => void; }
const SEV: Record<string, string> = { low: "bg-blue-50 text-blue-600 border-blue-100", medium: "bg-amber-50 text-amber-600 border-amber-100", high: "bg-orange-50 text-orange-600 border-orange-100", critical: "bg-red-50 text-red-600 border-red-100" };
const STAT: Record<string, string> = { submitted: "bg-blue-50 text-blue-600 border-blue-100", investigating: "bg-amber-50 text-amber-600 border-amber-100", resolved: "bg-emerald-50 text-emerald-600 border-emerald-100", closed: "bg-gray-50 text-gray-600 border-gray-100" };
export function GrievanceListCard({ grievances = [], mode, onAction }: Props) {
  const pending = grievances.filter(g => !["resolved", "closed"].includes(g.status)).length;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div><h3 className="text-base font-bold text-gray-900">{mode === "submitted" ? "Grievance Filed" : "My Grievances"}</h3><p className="text-xs text-gray-500">{grievances.length} total, {pending} pending</p></div>
        <button onClick={() => onAction?.("file_grievance", {})} className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[10px] font-semibold text-red-600 hover:bg-red-100">File New</button>
      </div>
      <div className="divide-y divide-gray-50">
        {(grievances || []).map((g, i) => { const sev = SEV[g.severity] || SEV.medium; const stat = STAT[g.status] || STAT.submitted; return (
          <div key={i} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-medium text-gray-900">{g.subject}</p><p className="text-[10px] text-gray-400">{g.ref} - {g.category} - {g.submitted_at?.slice(0, 10)}</p>{g.description && <p className="text-[10px] text-gray-500 mt-1">{g.description}</p>}{g.resolution && <p className="text-[10px] text-emerald-600 mt-1">Resolution: {g.resolution}</p>}</div>
              <div className="flex flex-col gap-1 items-end"><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${sev}`}>{g.severity}</span><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${stat}`}>{g.status}</span></div>
            </div>
          </div>); })}
        {grievances.length === 0 && <div className="px-5 py-8 text-center"><p className="text-sm text-gray-400">No grievances filed</p></div>}
      </div>
    </div>);
}
