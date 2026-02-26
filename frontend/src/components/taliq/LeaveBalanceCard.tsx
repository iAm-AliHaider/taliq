"use client";

import { useEffect, useState } from "react";

interface LeaveBalanceCardProps {
  employeeName: string;
  annual: number;
  sick: number;
  emergency: number;
}

export function LeaveBalanceCard({ employeeName, annual, sick, emergency }: LeaveBalanceCardProps) {
  const total = annual + sick + emergency;
  const maxTotal = 30 + 10 + 3;
  const [animatedTotal, setAnimatedTotal] = useState(0);

  // Count-up animation
  useEffect(() => {
    let frame = 0;
    const duration = 40;
    const step = () => {
      frame++;
      setAnimatedTotal(Math.round((frame / duration) * total));
      if (frame < duration) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [total]);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Leave Balance</h3>
          <p className="text-[10px] text-zinc-600 mt-0.5">{employeeName}</p>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <span className="text-[10px] text-emerald-400/70">2026</span>
        </div>
      </div>

      {/* Animated Circle */}
      <div className="flex justify-center mb-6">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="url(#balance-grad)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(total / maxTotal) * 264} 264`}
              style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            <defs>
              <linearGradient id="balance-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              {animatedTotal}
            </span>
            <span className="text-[9px] text-zinc-600">days remaining</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <BalanceRow label="Annual" value={annual} max={30} color="from-emerald-500 to-emerald-400" />
        <BalanceRow label="Sick" value={sick} max={10} color="from-amber-500 to-amber-400" />
        <BalanceRow label="Emergency" value={emergency} max={3} color="from-red-500 to-red-400" />
      </div>
    </div>
  );
}

function BalanceRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="group">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition">{label}</span>
        <span className="text-[11px] text-zinc-300 font-medium">{value}<span className="text-zinc-600">/{max}</span></span>
      </div>
      <div className="h-1 bg-white/[0.03] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%`, transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </div>
    </div>
  );
}
