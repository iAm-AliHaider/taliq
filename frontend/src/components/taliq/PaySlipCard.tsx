"use client";

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

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Pay Slip</h3>
        <span className="text-[10px] text-zinc-500">{month}</span>
      </div>
      <p className="text-xs text-zinc-400 mb-4">{employeeName}</p>

      {/* Earnings */}
      <div className="mb-3">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Earnings</p>
        <div className="space-y-1.5">
          <SlipRow label="Basic Salary" amount={basic} currency={currency} />
          <SlipRow label="Housing Allowance" amount={housing} currency={currency} />
          <SlipRow label="Transport Allowance" amount={transport} currency={currency} />
        </div>
        <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
          <span className="text-xs text-zinc-400 font-medium">Gross</span>
          <span className="text-xs text-white font-bold">{gross.toLocaleString()} {currency}</span>
        </div>
      </div>

      {/* Deductions */}
      <div className="mb-4">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Deductions</p>
        <SlipRow label="GOSI (9.75%)" amount={-deductions} currency={currency} isDeduction />
      </div>

      {/* Net Pay */}
      <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-amber-500/10 border border-emerald-500/20">
        <div className="flex justify-between items-center">
          <span className="text-xs text-zinc-300 font-medium">Net Pay</span>
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
            {netPay.toLocaleString()} {currency}
          </span>
        </div>
      </div>
    </div>
  );
}

function SlipRow({ label, amount, currency, isDeduction }: { label: string; amount: number; currency: string; isDeduction?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`text-xs font-medium ${isDeduction ? "text-red-400" : "text-zinc-200"}`}>
        {isDeduction ? "-" : ""}{Math.abs(amount).toLocaleString()} {currency}
      </span>
    </div>
  );
}
