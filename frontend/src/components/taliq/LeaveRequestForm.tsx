"use client";

interface LeaveRequestFormProps {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  balance: number;
  status: "preview" | "submitted" | "approved" | "rejected";
}

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  annual: { label: "Annual Leave", icon: "🏖️", color: "text-emerald-400" },
  sick: { label: "Sick Leave", icon: "🏥", color: "text-amber-400" },
  emergency: { label: "Emergency Leave", icon: "🚨", color: "text-red-400" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  preview: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Preview" },
  submitted: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Submitted ✓" },
  approved: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Approved" },
  rejected: { bg: "bg-red-500/10", text: "text-red-400", label: "Rejected" },
};

export function LeaveRequestForm({ employeeName, leaveType, startDate, endDate, days, reason, balance, status }: LeaveRequestFormProps) {
  const typeInfo = TYPE_LABELS[leaveType] || TYPE_LABELS.annual;
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.preview;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeInfo.icon}</span>
          <h3 className={`font-semibold text-sm ${typeInfo.color}`}>{typeInfo.label}</h3>
        </div>
        <span className={`text-[10px] px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} font-medium`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-xs text-zinc-500">Employee</span>
          <span className="text-sm text-white font-medium">{employeeName}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-xs text-zinc-500">From</span>
          <span className="text-sm text-white">{startDate}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-xs text-zinc-500">To</span>
          <span className="text-sm text-white">{endDate}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-xs text-zinc-500">Days</span>
          <span className="text-sm text-white font-bold">{days}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-xs text-zinc-500">Reason</span>
          <span className="text-sm text-zinc-300 text-right max-w-[60%]">{reason}</span>
        </div>
      </div>

      {/* Balance Indicator */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs text-zinc-400">Remaining balance:</span>
        <span className="text-xs text-emerald-400 font-bold ml-auto">{balance} days</span>
      </div>
    </div>
  );
}
