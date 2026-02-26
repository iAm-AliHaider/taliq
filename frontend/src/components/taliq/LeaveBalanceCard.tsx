"use client";

interface LeaveBalanceCardProps {
  employeeName: string;
  annual: number;
  sick: number;
  emergency: number;
}

export function LeaveBalanceCard({ employeeName, annual, sick, emergency }: LeaveBalanceCardProps) {
  const total = annual + sick + emergency;
  const maxTotal = 30 + 10 + 3; // typical max

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Leave Balance</h3>
        <span className="text-[10px] text-zinc-500">{employeeName}</span>
      </div>

      {/* Total Circle */}
      <div className="flex justify-center mb-5">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#taliq-grad)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={`${(total / maxTotal) * 264} 264`} />
            <defs>
              <linearGradient id="taliq-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{total}</span>
            <span className="text-[9px] text-zinc-500">days left</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <BalanceRow label="Annual" value={annual} max={30} color="bg-emerald-500" />
        <BalanceRow label="Sick" value={sick} max={10} color="bg-amber-500" />
        <BalanceRow label="Emergency" value={emergency} max={3} color="bg-red-500" />
      </div>
    </div>
  );
}

function BalanceRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs text-white font-medium">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
