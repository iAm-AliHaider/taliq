"use client";

interface Props {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  balance: number;
  status: "preview" | "submitted" | "approved" | "rejected";
}

export function LeaveRequestForm({ employeeName, leaveType, startDate, endDate, days, reason, balance, status }: Props) {
  const statusConfig = {
    preview: { badge: "badge-blue", label: "Preview", icon: "👁️" },
    submitted: { badge: "badge-gold", label: "Submitted", icon: "📨" },
    approved: { badge: "badge-emerald", label: "Approved", icon: "✅" },
    rejected: { badge: "badge-red", label: "Rejected", icon: "❌" },
  };
  const s = statusConfig[status];

  return (
    <div className="card overflow-hidden">
      {/* Status bar */}
      <div className={`px-5 py-2 flex items-center justify-between ${
        status === "approved" ? "bg-emerald-50 border-b border-emerald-100" :
        status === "rejected" ? "bg-red-50 border-b border-red-100" :
        status === "submitted" ? "bg-amber-50 border-b border-amber-100" :
        "bg-blue-50 border-b border-blue-100"
      }`}>
        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">{s.icon} Leave Request</span>
        <span className={`badge ${s.badge}`}>{s.label}</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee" value={employeeName} />
          <Field label="Type" value={leaveType.charAt(0).toUpperCase() + leaveType.slice(1)} />
          <Field label="From" value={startDate} />
          <Field label="To" value={endDate} />
          <Field label="Days" value={String(days)} />
          <Field label="Balance After" value={`${balance} days`} />
        </div>
        {reason && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Reason</span>
            <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">{reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
