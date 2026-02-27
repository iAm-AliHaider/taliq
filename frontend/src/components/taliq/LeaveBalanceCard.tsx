"use client";

interface Props {
  employeeName: string;
  annual: number;
  sick: number;
  emergency: number;
  study?: number;
}

export function LeaveBalanceCard({ employeeName, annual, sick, emergency, study }: Props) {
  const leaves = [
    { label: "Annual", value: annual, max: 30, color: "emerald", icon: "🏖️" },
    { label: "Sick", value: sick, max: 30, color: "blue", icon: "🏥" },
    { label: "Emergency", value: emergency, max: 5, color: "amber", icon: "⚡" },
    ...(study !== undefined ? [{ label: "Study", value: study, max: 15, color: "purple" as const, icon: "📚" }] : []),
  ];

  const colorMap: Record<string, { bg: string; fill: string; text: string }> = {
    emerald: { bg: "bg-emerald-50", fill: "bg-emerald-500", text: "text-emerald-700" },
    blue: { bg: "bg-blue-50", fill: "bg-blue-500", text: "text-blue-700" },
    amber: { bg: "bg-amber-50", fill: "bg-amber-500", text: "text-amber-700" },
    purple: { bg: "bg-purple-50", fill: "bg-purple-500", text: "text-purple-700" },
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Leave Balance</h3>
          <p className="text-xs text-gray-400 mt-0.5">{employeeName}</p>
        </div>
        <div className="badge badge-emerald">Active</div>
      </div>
      <div className="space-y-3">
        {leaves.map((l) => {
          const c = colorMap[l.color];
          const pct = Math.round((l.value / l.max) * 100);
          return (
            <div key={l.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span>{l.icon}</span> {l.label}
                </span>
                <span className={`text-xs font-bold ${c.text}`}>{l.value}/{l.max} days</span>
              </div>
              <div className={`h-2 rounded-full ${c.bg}`}>
                <div className={`h-full rounded-full ${c.fill} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
