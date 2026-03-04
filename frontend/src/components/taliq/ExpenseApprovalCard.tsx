"use client";

interface PendingExpense {
  ref: string; employee_name: string; department: string; category: string;
  description: string; amount: number; expense_date: string;
}

export function ExpenseApprovalCard({ expenses = [], onAction }: { expenses: PendingExpense[]; onAction?: (action: string, payload: any) => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Pending Expenses</h3>
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">{expenses.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(expenses || []).map(e => (
          <div key={e.ref} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{e.employee_name} <span className="text-gray-400 text-[10px]">({e.department})</span></p>
                <p className="text-xs text-gray-600">{e.description}</p>
                <p className="text-[10px] text-gray-400">{e.ref} · {e.category} · {e.expense_date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{e.amount?.toLocaleString()} SAR</span>
                <button onClick={() => onAction?.("approve_expense", { ref: e.ref, decision: "approved" })} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100">Approve</button>
                <button onClick={() => onAction?.("reject_expense", { ref: e.ref, decision: "rejected" })} className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-[10px] font-medium text-red-600 hover:bg-red-100">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
