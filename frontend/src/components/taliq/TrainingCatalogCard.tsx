"use client";
interface Course { id: number; title: string; description?: string; provider?: string; duration_hours: number; category: string; mandatory: number; }
interface Props { courses?: Course[]; onAction?: (a: string, p: Record<string, unknown>) => void; }
const CAT_CLR: Record<string, string> = { compliance: "bg-red-50 text-red-600 border-red-100", leadership: "bg-violet-50 text-violet-600 border-violet-100", technical: "bg-blue-50 text-blue-600 border-blue-100", professional: "bg-amber-50 text-amber-600 border-amber-100", safety: "bg-orange-50 text-orange-600 border-orange-100", language: "bg-teal-50 text-teal-600 border-teal-100", general: "bg-gray-50 text-gray-600 border-gray-100" };
export function TrainingCatalogCard({ courses = [], onAction }: Props) {
  const mandatory = courses.filter(c => c.mandatory);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div><h3 className="text-base font-bold text-gray-900">Training Catalog</h3><p className="text-xs text-gray-500">{courses.length} courses available</p></div>
        {mandatory.length > 0 && <span className="px-2 py-1 rounded-full bg-red-50 border border-red-100 text-[10px] font-semibold text-red-600">{mandatory.length} mandatory</span>}
      </div>
      <div className="p-4 grid grid-cols-1 gap-3">
        {courses.map(c => { const cat = CAT_CLR[c.category] || CAT_CLR.general; return (
          <div key={c.id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div><p className="text-sm font-medium text-gray-900">{c.title}</p>{c.description && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{c.description}</p>}</div>
              {c.mandatory ? <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-[9px] font-bold text-red-600 flex-shrink-0">Required</span> : null}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${cat}`}>{c.category}</span><span className="text-[10px] text-gray-400">{c.duration_hours}h - {c.provider}</span></div>
              <button onClick={() => onAction?.("enroll_training", { courseId: c.id })} className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors">Enroll</button>
            </div>
          </div>); })}
      </div>
    </div>);
}
