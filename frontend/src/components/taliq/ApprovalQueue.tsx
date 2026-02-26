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

interface ApprovalQueueProps {
  items: ApprovalItem[];
}

const TYPE_ICONS: Record<string, string> = {
  annual: "🏖️",
  sick: "🏥",
  emergency: "🚨",
};

export function ApprovalQueue({ items }: ApprovalQueueProps) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Pending Approvals</h3>
        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-medium">
          {items.length} pending
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-2xl">✅</span>
          <p className="text-xs text-zinc-500 mt-2">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{TYPE_ICONS[item.type] || "📋"}</span>
                  <span className="text-sm text-white font-medium">{item.employeeName}</span>
                </div>
                <span className="text-[10px] text-zinc-500">{item.id}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                <span>{item.type} leave</span>
                <span>·</span>
                <span>{item.days} days</span>
                <span>·</span>
                <span>{item.startDate} → {item.endDate}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{item.reason}</p>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition">
                  Approve
                </button>
                <button className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
