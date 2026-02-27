"use client";
interface Props { employeeName?: string; period?: string; rating?: number; goalsMet?: number; totalGoals?: number; strengths?: string; improvements?: string; comments?: string; reviewerName?: string; status?: string; goals?: { goal: string; progress: number; status: string; due_date: string }[]; onAction?: (a: string, p: Record<string, unknown>) => void; }
export function PerformanceReviewCard({ employeeName, period, rating = 0, goalsMet = 0, totalGoals = 0, strengths, improvements, comments, reviewerName, status, goals = [] }: Props) {
  const stars = Array.from({ length: 5 }, (_, i) => i < rating);
  const ratingLabel = ["", "Needs Improvement", "Below Average", "Meets Expectations", "Exceeds Expectations", "Outstanding"][rating] || "";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center justify-between">
          <div><h3 className="text-base font-bold text-gray-900">Performance Review</h3><p className="text-xs text-gray-500">{employeeName} - {period}</p></div>
          <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 text-[10px] font-semibold text-violet-600">{status}</span>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="text-center"><div className="flex justify-center gap-1 mb-1">{stars.map((filled, i) => (<div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${filled ? "bg-amber-400 border-amber-400" : "border-gray-200"}`}><span className={`text-xs font-bold ${filled ? "text-white" : "text-gray-300"}`}>{i + 1}</span></div>))}</div><p className="text-sm font-semibold text-gray-700">{ratingLabel}</p>{reviewerName && <p className="text-[10px] text-gray-400">Reviewed by {reviewerName}</p>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100"><p className="text-[10px] text-emerald-600 font-semibold uppercase mb-1">Strengths</p><p className="text-xs text-gray-700">{strengths || "—"}</p></div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100"><p className="text-[10px] text-amber-600 font-semibold uppercase mb-1">Improvements</p><p className="text-xs text-gray-700">{improvements || "—"}</p></div>
        </div>
        {comments && <div className="p-3 rounded-xl bg-gray-50"><p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Comments</p><p className="text-xs text-gray-700">{comments}</p></div>}
        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100"><span className="text-xs font-medium text-blue-700">Goals Met</span><span className="text-lg font-bold text-blue-700">{goalsMet}/{totalGoals}</span></div>
        {goals.length > 0 && <div><p className="text-[10px] text-gray-400 font-semibold uppercase mb-2">Goals</p>{goals.map((g, i) => (<div key={i} className="flex items-center gap-3 mb-2"><div className="flex-1"><p className="text-xs text-gray-700">{g.goal}</p><div className="h-1.5 rounded-full bg-gray-100 mt-1"><div className={`h-full rounded-full ${g.progress >= 100 ? "bg-emerald-400" : "bg-blue-400"}`} style={{ width: `${g.progress}%` }} /></div></div><span className="text-[10px] text-gray-500 w-10 text-right">{g.progress}%</span></div>))}</div>}
      </div>
    </div>);
}
