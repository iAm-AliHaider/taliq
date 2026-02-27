"use client";

interface Props {
  employeeName: string;
  month: string;
  basic: number;
  housing: number;
  transport: number;
  deductions: number;
  netPay: number;
  currency: string;
  otherAllowances?: number;
  gosiDeduction?: number;
}

export function PaySlipCard({ employeeName, month, basic, housing, transport, deductions, netPay, currency, otherAllowances, gosiDeduction }: Props) {
  const fmt = (n: number) => n.toLocaleString();
  const totalEarnings = basic + housing + transport + (otherAllowances || 0);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-amber-50 border-b border-emerald-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Pay Slip</h3>
          <p className="text-xs text-gray-400">{month}</p>
        </div>
        <span className="badge badge-emerald">{employeeName}</span>
      </div>

      <div className="p-5">
        {/* Earnings */}
        <div className="mb-4">
          <h4 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Earnings</h4>
          <div className="space-y-2">
            <Row label="Basic Salary" amount={basic} currency={currency} />
            <Row label="Housing Allowance" amount={housing} currency={currency} />
            <Row label="Transportation" amount={transport} currency={currency} />
            {otherAllowances ? <Row label="Other Allowances" amount={otherAllowances} currency={currency} /> : null}
            <div className="border-t border-gray-100 pt-2">
              <Row label="Total Earnings" amount={totalEarnings} currency={currency} bold />
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="mb-4">
          <h4 className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Deductions</h4>
          <div className="space-y-2">
            {gosiDeduction ? <Row label="GOSI (9.75%)" amount={-gosiDeduction} currency={currency} negative /> : null}
            <Row label="Total Deductions" amount={-deductions} currency={currency} negative />
          </div>
        </div>

        {/* Net Pay */}
        <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800">Net Pay</span>
          <span className="text-xl font-bold text-emerald-600">{fmt(netPay)} <span className="text-xs font-normal text-gray-400">{currency}</span></span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, amount, currency, bold, negative }: { label: string; amount: number; currency: string; bold?: boolean; negative?: boolean }) {
  const fmt = (n: number) => Math.abs(n).toLocaleString();
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${bold ? "font-semibold text-gray-800" : "text-gray-500"}`}>{label}</span>
      <span className={`text-xs ${bold ? "font-bold text-gray-900" : negative ? "text-red-600 font-medium" : "font-medium text-gray-700"}`}>
        {negative ? "-" : ""}{fmt(amount)} {currency}
      </span>
    </div>
  );
}
