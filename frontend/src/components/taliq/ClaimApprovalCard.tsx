"use client";

interface PendingClaim {
  ref: string; employee_name: string; department: string; claim_type: string;
  description: string; amount: number;
}

export function ClaimApprovalCard({ claims = [], onAction }: { claims: PendingClaim[]; onAction?: (action: string, payload: any) => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Pending Claims</h3>
        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">{claims.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(claims || []).map(c => (
          <div key={c.ref} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.employee_name} <span className="text-gray-400 text-[10px]">({c.department})</span></p>
                <p className="text-xs text-gray-600">{c.description}</p>
                <p className="text-[10px] text-gray-400">{c.ref} · {c.claim_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{c.amount?.toLocaleString()} SAR</span>
                <button onClick={() => onAction?.("approve_claim", { ref: c.ref, decision: "approved" })} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100">Approve</button>
                <button onClick={() => onAction?.("reject_claim", { ref: c.ref, decision: "rejected" })} className="px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-[10px] font-medium text-red-600 hover:bg-red-100">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
