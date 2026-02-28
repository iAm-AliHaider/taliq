"use client";

interface Claim {
  ref: string; claim_type: string; description: string; amount: number;
  status: string; approved_amount?: number; approver_name?: string; submitted_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export function ClaimListCard({ claims = [] }: { claims: Claim[] }) {
  const pending = claims.filter(c => c.status === "pending").length;
  const totalApproved = claims.filter(c => c.status === "approved").reduce((s, c) => s + (c.approved_amount || c.amount), 0);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-sm font-semibold text-gray-800">My Claims</h3>
        <div className="flex gap-4 mt-2">
          <div><span className="text-[10px] text-gray-400 block">Pending</span><span className="text-sm font-bold text-amber-600">{pending}</span></div>
          <div><span className="text-[10px] text-gray-400 block">Approved Total</span><span className="text-sm font-bold text-emerald-600">{totalApproved.toLocaleString()} SAR</span></div>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {claims.map(c => (
          <div key={c.ref} className="px-5 py-3 hover:bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.description}</p>
                <p className="text-[10px] text-gray-400">{c.ref} · {c.claim_type} · {c.submitted_at?.split("T")[0]}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{c.amount?.toLocaleString()} SAR</p>
                {c.approved_amount && c.approved_amount !== c.amount && <p className="text-[10px] text-emerald-600">Approved: {c.approved_amount.toLocaleString()}</p>}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_COLORS[c.status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>{c.status}</span>
              </div>
            </div>
          </div>
        ))}
        {claims.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No claims yet</div>}
      </div>
    </div>
  );
}
