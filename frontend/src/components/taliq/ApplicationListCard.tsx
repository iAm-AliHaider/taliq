"use client";

interface Application {
  ref: string;
  candidateName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  stage: string;
  status: string;
  score: number;
  applied: string;
}

const STAGE_COLORS: Record<string, string> = {
  screening: "bg-blue-50 text-blue-700 border-blue-200",
  interview: "bg-amber-50 text-amber-700 border-amber-200",
  offer: "bg-violet-50 text-violet-700 border-violet-200",
  hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

export function ApplicationListCard({ applications }: { applications: Application[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Applications</h3>
            <p className="text-[10px] text-gray-400">{applications.length} candidate{applications.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {applications.map((a) => (
          <div key={a.ref} className="px-5 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {a.candidateName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{a.candidateName}</h4>
                    <p className="text-[10px] text-gray-400">{a.jobTitle} &middot; {a.department}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.score > 0 && (
                  <span className="text-xs font-bold text-gray-700">{a.score}%</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${STAGE_COLORS[a.stage] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {a.stage}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
