"use client";

interface LeaveRequest {
  ref: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason?: string;
}

interface LeaveHistoryCardProps {
  employeeName?: string;
  requests?: LeaveRequest[];
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Pending" },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Approved" },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Rejected" },
  submitted: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Submitted" },
};

const TYPE_ICONS: Record<string, string> = {
  annual: "bg-blue-100 text-blue-600",
  sick: "bg-red-100 text-red-600",
  emergency: "bg-amber-100 text-amber-600",
  study: "bg-purple-100 text-purple-600",
};

export function LeaveHistoryCard({ employeeName, requests = [], onAction }: LeaveHistoryCardProps) {
  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Leave History</h3>
            <p className="text-xs text-gray-500">{employeeName} - {requests.length} request(s)</p>
          </div>
          <div className="flex gap-2">
            {pending > 0 && (
              <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100 text-[10px] font-semibold text-amber-600">
                {pending} pending
              </span>
            )}
            <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600">
              {approved} approved
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {requests.map((req) => {
          const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
          const typeColor = TYPE_ICONS[req.leave_type] || "bg-gray-100 text-gray-600";

          return (
            <div key={req.ref} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${typeColor} flex items-center justify-center mt-0.5`}>
                    <span className="text-xs font-bold capitalize">{req.leave_type.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{req.leave_type} Leave</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{req.start_date} - {req.end_date}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{req.ref} - {req.days} day(s)</p>
                    {req.reason && <p className="text-[10px] text-gray-400 mt-0.5 italic">{req.reason}</p>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          );
        })}
        {requests.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No leave requests yet</p>
            <button onClick={() => onAction?.("apply_leave_prompt", {})} className="mt-3 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-600 font-medium hover:bg-emerald-100 transition-colors">
              Apply for Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
