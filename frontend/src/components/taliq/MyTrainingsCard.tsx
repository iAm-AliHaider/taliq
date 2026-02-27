"use client";
interface Training { title: string; duration_hours: number; category: string; mandatory: number; status: string; enrollment_date?: string; completion_date?: string; score?: number; certificate_ref?: string; }
interface Stats { total_enrolled: number; completed: number; mandatory_total: number; mandatory_completed: number; compliance: number; }
interface Props { trainings?: Training[]; stats?: Stats; onAction?: (a: string, p: Record<string, unknown>) => void; }
export function MyTrainingsCard({ trainings = [], stats, onAction }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-base font-bold text-gray-900">My Training</h3></div>
      {stats && <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
        <div className="bg-white p-3 text-center"><p className="text-lg font-bold text-blue-600">{stats.total_enrolled}</p><p className="text-[9px] text-gray-400">Enrolled</p></div>
        <div className="bg-white p-3 text-center"><p className="text-lg font-bold text-emerald-600">{stats.completed}</p><p className="text-[9px] text-gray-400">Completed</p></div>
        <div className="bg-white p-3 text-center"><p className="text-lg font-bold text-red-600">{stats.mandatory_completed}/{stats.mandatory_total}</p><p className="text-[9px] text-gray-400">Mandatory</p></div>
        <div className="bg-white p-3 text-center"><p className={`text-lg font-bold ${stats.compliance >= 100 ? "text-emerald-600" : "text-amber-600"}`}>{stats.compliance}%</p><p className="text-[9px] text-gray-400">Compliance</p></div>
      </div>}
      <div className="divide-y divide-gray-50">
        {trainings.map((t, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center justify-between">
            <div><p className="text-sm font-medium text-gray-900">{t.title}</p><p className="text-[10px] text-gray-400">{t.duration_hours}h - {t.category} {t.mandatory ? "(mandatory)" : ""}</p>{t.score != null && <p className="text-[10px] text-emerald-600">Score: {t.score}% {t.certificate_ref ? `- ${t.certificate_ref}` : ""}</p>}</div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${t.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>{t.status}</span>
          </div>))}
        {trainings.length === 0 && <div className="px-5 py-8 text-center"><p className="text-sm text-gray-400">No trainings yet</p><button onClick={() => onAction?.("show_trainings", {})} className="mt-3 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-600 font-medium">Browse Courses</button></div>}
      </div>
    </div>);
}
