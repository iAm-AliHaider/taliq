"use client";

interface Props {
  ref?: string;
  title: string;
  department: string;
  description: string;
  requirements: string;
  salaryRange: string;
  location: string;
  type: string;
  status: string;
  deadline: string;
  postedBy: string;
  created: string;
  applicants: number;
  stages: { screening: number; interview: number; offer: number; hired: number; rejected: number };
}

const STAGE_COLORS = ["bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-emerald-500", "bg-red-400"];

export function JobDetailCard(props: Props) {
  const total = props.applicants || 1;
  const stages = [
    { label: "Screening", count: props.stages?.screening || 0, color: STAGE_COLORS[0] },
    { label: "Interview", count: props.stages?.interview || 0, color: STAGE_COLORS[1] },
    { label: "Offer", count: props.stages?.offer || 0, color: STAGE_COLORS[2] },
    { label: "Hired", count: props.stages?.hired || 0, color: STAGE_COLORS[3] },
    { label: "Rejected", count: props.stages?.rejected || 0, color: STAGE_COLORS[4] },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{props.title}</h3>
            <p className="text-[10px] text-gray-500">{props.department} &middot; {props.location} &middot; {props.type?.replace("_", " ")}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${props.status === "open" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
            {props.status}
          </span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {props.description && (
          <div><p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Description</p><p className="text-xs text-gray-700 leading-relaxed">{props.description}</p></div>
        )}
        {props.requirements && (
          <div><p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Requirements</p><p className="text-xs text-gray-700 leading-relaxed">{props.requirements}</p></div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {props.salaryRange && <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-[9px] text-gray-400">Salary</p><p className="text-xs font-bold text-emerald-700">{props.salaryRange}</p></div>}
          <div className="bg-violet-50 rounded-xl p-3 text-center"><p className="text-[9px] text-gray-400">Applicants</p><p className="text-xs font-bold text-violet-700">{props.applicants}</p></div>
          {props.deadline && <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-[9px] text-gray-400">Deadline</p><p className="text-xs font-bold text-amber-700">{props.deadline}</p></div>}
        </div>
        {/* Pipeline funnel */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Pipeline</p>
          <div className="flex rounded-lg overflow-hidden h-6">
            {stages.filter(s => s.count > 0).map(s => (
              <div key={s.label} className={`${s.color} flex items-center justify-center text-[9px] text-white font-bold`} style={{ width: `${Math.max((s.count / total) * 100, 12)}%` }}>
                {s.count}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {(stages || []).map(s => (
              <span key={s.label} className="text-[8px] text-gray-400">{s.label} ({s.count})</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
