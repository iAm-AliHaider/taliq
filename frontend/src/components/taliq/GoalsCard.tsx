"use client";
interface Goal { id?: number; goal: string; target?: string; progress: number; status: string; due_date?: string; }
interface Props { employeeName?: string; goals?: Goal[]; onAction?: (a: string, p: Record<string, unknown>) => void; }
const STATUS_CLR: Record<string, string> = { active: "text-blue-600 bg-blue-50 border-blue-100", completed: "text-emerald-600 bg-emerald-50 border-emerald-100", overdue: "text-red-600 bg-red-50 border-red-100" };
export function GoalsCard({ employeeName, goals = [], onAction }: Props) {
  const active = goals.filter(g => g.status === "active").length;
  const completed = goals.filter(g => g.status === "completed").length;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div><h3 className="text-base font-bold text-gray-900">My Goals</h3><p className="text-xs text-gray-500">{employeeName}</p></div>
        <div className="flex gap-1.5"><span className="px-2 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-semibold text-blue-600">{active} active</span><span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600">{completed} done</span></div>
      </div>
      <div className="divide-y divide-gray-50">
        {(goals || []).map((g, i) => { const clr = STATUS_CLR[g.status] || STATUS_CLR.active; return (
          <div key={i} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3 mb-2"><div><p className="text-sm font-medium text-gray-900">{g.goal}</p>{g.target && <p className="text-[10px] text-gray-400">Target: {g.target}</p>}</div><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${clr}`}>{g.status}</span></div>
            <div className="flex items-center gap-3"><div className="flex-1 h-2 rounded-full bg-gray-100"><div className={`h-full rounded-full transition-all ${g.progress >= 100 ? "bg-emerald-400" : g.progress >= 50 ? "bg-blue-400" : "bg-amber-400"}`} style={{ width: `${Math.min(100, g.progress)}%` }} /></div><span className="text-xs font-bold text-gray-600 w-12 text-right">{g.progress}%</span></div>
            {g.due_date && <p className="text-[10px] text-gray-400 mt-1">Due: {g.due_date}</p>}
          </div>); })}
        {goals.length === 0 && <div className="px-5 py-8 text-center"><p className="text-sm text-gray-400">No goals set</p><button onClick={() => onAction?.("set_goal", {})} className="mt-3 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-600 font-medium">Set a Goal</button></div>}
      </div>
    </div>);
}
