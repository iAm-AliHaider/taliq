"use client";

interface Props {
  jobs: { total_jobs: number; open_jobs: number; closed_jobs: number };
  applications: { total_apps: number; screening: number; interviewing: number; offer: number; hired: number; rejected: number };
}

export function RecruitmentDashboardCard({ jobs, applications }: Props) {
  const funnelStages = [
    { label: "Screening", count: applications?.screening || 0, color: "bg-blue-500", lightColor: "bg-blue-50 text-blue-700" },
    { label: "Interview", count: applications?.interviewing || 0, color: "bg-amber-500", lightColor: "bg-amber-50 text-amber-700" },
    { label: "Offer", count: applications?.offer || 0, color: "bg-violet-500", lightColor: "bg-violet-50 text-violet-700" },
    { label: "Hired", count: applications?.hired || 0, color: "bg-emerald-500", lightColor: "bg-emerald-50 text-emerald-700" },
    { label: "Rejected", count: applications?.rejected || 0, color: "bg-red-400", lightColor: "bg-red-50 text-red-600" },
  ];
  const maxCount = Math.max(...funnelStages.map(s => s.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Recruitment Dashboard</h3>
      </div>
      <div className="p-5 space-y-4">
        {/* Job stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-violet-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-violet-700">{jobs?.open_jobs || 0}</p>
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Open</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-gray-700">{jobs?.closed_jobs || 0}</p>
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Closed</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-cyan-700">{applications?.total_apps || 0}</p>
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Applications</p>
          </div>
        </div>
        {/* Funnel */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-semibold mb-3">Hiring Funnel</p>
          <div className="space-y-2">
            {funnelStages.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 w-16">{s.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div className={`${s.color} h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                    style={{ width: `${Math.max((s.count / maxCount) * 100, 8)}%` }}>
                    <span className="text-[9px] text-white font-bold">{s.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
