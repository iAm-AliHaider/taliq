"use client";

interface ApprovalItem {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
}

interface Props {
  items: ApprovalItem[];
}

export function ApprovalQueue({ items }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Pending Approvals</h3>
        <span className="badge badge-gold">{items.length} pending</span>
      </div>

      <div className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-2xl mb-2 block">✅</span>
            <p className="text-sm text-gray-400">All caught up!</p>
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.employeeName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.type} • {item.days} days • {item.startDate} → {item.endDate}
                </p>
              </div>
              <span className={`badge ${item.status === "pending" ? "badge-gold" : item.status === "approved" ? "badge-emerald" : "badge-red"}`}>
                {item.status}
              </span>
            </div>
            {item.reason && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mt-2">{item.reason}</p>
            )}
            {item.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors">
                  Approve
                </button>
                <button className="flex-1 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
