"use client";

interface Payment {
  ref: string; payment_type: string; description: string; amount: number;
  status: string; payment_method?: string; payment_date?: string; employee_name?: string;
}
interface Summary { total_received: number; processing: number; pending: number; total_payments: number; }

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

const TYPE_COLORS: Record<string, string> = {
  salary: "bg-emerald-100 text-emerald-700",
  reimbursement: "bg-blue-100 text-blue-700",
  bonus: "bg-violet-100 text-violet-700",
  advance: "bg-amber-100 text-amber-700",
};

export default function PaymentListCard({ payments = [], summary, isAdmin }: { payments: Payment[]; summary?: Summary; isAdmin?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
        <h3 className="text-sm font-semibold text-gray-800">{isAdmin ? "All Payments" : "My Payments"}</h3>
        {summary && (
          <div className="flex gap-4 mt-2">
            <div><span className="text-[10px] text-gray-400 block">Received</span><span className="text-sm font-bold text-emerald-600">{summary.total_received?.toLocaleString()} SAR</span></div>
            <div><span className="text-[10px] text-gray-400 block">Processing</span><span className="text-sm font-bold text-blue-600">{summary.processing?.toLocaleString()} SAR</span></div>
            <div><span className="text-[10px] text-gray-400 block">Pending</span><span className="text-sm font-bold text-amber-600">{summary.pending?.toLocaleString()} SAR</span></div>
          </div>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {payments.map(p => (
          <div key={p.ref} className="px-5 py-3 hover:bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                {isAdmin && p.employee_name && <p className="text-[10px] text-gray-400 font-medium mb-0.5">{p.employee_name}</p>}
                <p className="text-sm font-medium text-gray-900">{p.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${TYPE_COLORS[p.payment_type] || "bg-gray-100 text-gray-600"}`}>{p.payment_type}</span>
                  <span className="text-[10px] text-gray-400">{p.ref}{p.payment_date ? ` · ${p.payment_date}` : ""}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{p.amount?.toLocaleString()} SAR</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[p.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{p.status}</span>
              </div>
            </div>
          </div>
        ))}
        {payments.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No payments yet</div>}
      </div>
    </div>
  );
}
