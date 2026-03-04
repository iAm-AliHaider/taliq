"use client";

interface Props {
  employeeName: string;
  annual: number;
  sick: number;
  emergency: number;
  study?: number;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function LeaveBalanceCard({ employeeName, annual, sick, emergency, study, onAction }: Props) {
  const leaves = [
    { label: "Annual", value: annual, max: 30, color: "bg-emerald-500", bgColor: "bg-emerald-50", textColor: "text-emerald-700" },
    { label: "Sick", value: sick, max: 30, color: "bg-blue-500", bgColor: "bg-blue-50", textColor: "text-blue-700" },
    { label: "Emergency", value: emergency, max: 5, color: "bg-amber-500", bgColor: "bg-amber-50", textColor: "text-amber-700" },
    ...(study !== undefined && study !== null ? [{ label: "Study", value: study, max: 15, color: "bg-purple-500", bgColor: "bg-purple-50", textColor: "text-purple-700" }] : []),
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Leave Balance</h3>
          <p className="text-xs text-gray-400">{employeeName}</p>
        </div>
        <button
          onClick={() => onAction?.("apply_leave_prompt", {})}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-semibold hover:bg-emerald-600 active:scale-[0.97] transition-all"
        >
          + Apply Leave
        </button>
      </div>

      <div className="p-5 space-y-4">
        {(leaves || []).map((leave) => (
          <div key={leave.label} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${leave.bgColor} flex items-center justify-center`}>
              <span className={`text-lg font-bold ${leave.textColor}`}>{leave.value}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">{leave.label}</span>
                <span className="text-[10px] text-gray-400">{leave.value}/{leave.max} days</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${leave.color} transition-all duration-700`}
                  style={{ width: `${Math.min((leave.value / leave.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
