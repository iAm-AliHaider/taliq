"use client";

interface Expense {
  ref: string; category: string; description: string; amount: number;
  expense_date: string; status: string; approver_name?: string; rejection_reason?: string;
}
interface Summary { total: number; pending: number; approved: number; approved_amount: number; pending_amount: number; }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const CAT_ICONS: Record<string, string> = {
  travel: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  meals: "M3 3h18v18H3zM12 8v8m-4-4h8",
  office_supplies: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  training: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
};

export function ExpenseListCard({ expenses = [], summary }: { expenses: Expense[]; summary?: Summary }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <h3 className="text-sm font-semibold text-gray-800">My Expenses</h3>
        {summary && (
          <div className="flex gap-4 mt-2">
            <div><span className="text-[10px] text-gray-400 block">Pending</span><span className="text-sm font-bold text-amber-600">{summary.pending_amount?.toLocaleString()} SAR</span></div>
            <div><span className="text-[10px] text-gray-400 block">Approved</span><span className="text-sm font-bold text-emerald-600">{summary.approved_amount?.toLocaleString()} SAR</span></div>
          </div>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {(expenses || []).map(e => (
          <div key={e.ref} className="px-5 py-3 hover:bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{e.description}</p>
                <p className="text-[10px] text-gray-400">{e.ref} · {e.category} · {e.expense_date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{e.amount?.toLocaleString()} SAR</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[e.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{e.status}</span>
              </div>
            </div>
            {e.rejection_reason && <p className="text-[10px] text-red-500 mt-1">Reason: {e.rejection_reason}</p>}
          </div>
        ))}
        {expenses.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No expenses yet</div>}
      </div>
    </div>
  );
}
