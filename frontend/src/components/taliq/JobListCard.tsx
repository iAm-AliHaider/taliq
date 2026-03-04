"use client";

interface Job {
  ref: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salaryRange: string;
  status: string;
  deadline: string;
  applicants: number;
}

const TYPE_COLORS: Record<string, string> = {
  full_time: "bg-emerald-50 text-emerald-700 border-emerald-200",
  part_time: "bg-blue-50 text-blue-700 border-blue-200",
  contract: "bg-amber-50 text-amber-700 border-amber-200",
  internship: "bg-purple-50 text-purple-700 border-purple-200",
};

export function JobListCard({ jobs }: { jobs: Job[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Open Positions</h3>
            <p className="text-[10px] text-gray-400">{jobs.length} posting{jobs.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {(jobs || []).map((j) => (
          <div key={j.ref} className="px-5 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{j.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${TYPE_COLORS[j.type] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                    {j.type?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                  <span>{j.department}</span>
                  <span>{j.location}</span>
                  {j.salaryRange && <span className="font-medium text-emerald-600">{j.salaryRange}</span>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400">{j.ref}</span>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-violet-600">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {j.applicants} applicant{j.applicants !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
