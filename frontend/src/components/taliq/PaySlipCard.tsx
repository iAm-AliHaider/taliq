"use client";

import { useEffect, useState } from "react";

interface PaySlipCardProps {
  employeeName: string;
  month: string;
  basic: number;
  housing: number;
  transport: number;
  deductions: number;
  netPay: number;
  currency: string;
}

export function PaySlipCard({ employeeName, month, basic, housing, transport, deductions, netPay, currency }: PaySlipCardProps) {
  const gross = basic + housing + transport;
  const [animatedNet, setAnimatedNet] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 50;
    const step = () => {
      frame++;
      setAnimatedNet(Math.round((frame / duration) * netPay));
      if (frame < duration) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [netPay]);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Pay Slip</h3>
          <p className="text-[10px] text-zinc-600 mt-0.5">{employeeName}</p>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <span className="text-[10px] text-zinc-400">{month}</span>
        </div>
      </div>

      {/* Earnings */}
      <div className="mb-4">
        <p className="text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-3">Earnings</p>
        <div className="space-y-2">
          <SlipRow label="Basic Salary" amount={basic} currency={currency} />
          <SlipRow label="Housing Allowance" amount={housing} currency={currency} />
          <SlipRow label="Transport Allowance" amount={transport} currency={currency} />
        </div>
        <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.04]">
          <span className="text-[11px] text-zinc-400">Gross</span>
          <span className="text-[11px] text-white font-semibold">{gross.toLocaleString()} {currency}</span>
        </div>
      </div>

      {/* Deductions */}
      <div className="mb-5">
        <p className="text-[9px] text-zinc-600 uppercase tracking-[0.15em] mb-3">Deductions</p>
        <SlipRow label="GOSI (9.75%)" amount={deductions} currency={currency} isDeduction />
      </div>

      {/* Net Pay - Hero number */}
      <div className="relative px-5 py-4 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-amber-500/10" />
        <div className="absolute inset-0 border border-emerald-500/10 rounded-2xl" />
        <div className="relative flex justify-between items-center">
          <span className="text-xs text-zinc-400">Net Pay</span>
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
            {animatedNet.toLocaleString()} {currency}
          </span>
        </div>
      </div>
    </div>
  );
}

function SlipRow({ label, amount, currency, isDeduction }: { label: string; amount: number; currency: string; isDeduction?: boolean }) {
  return (
    <div className="flex justify-between items-center group">
      <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition">{label}</span>
      <span className={`text-[11px] font-medium ${isDeduction ? "text-red-400/80" : "text-zinc-300"}`}>
        {isDeduction ? "-" : ""}{Math.abs(amount).toLocaleString()} {currency}
      </span>
    </div>
  );
}
