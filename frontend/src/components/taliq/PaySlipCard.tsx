"use client";

import { useState } from "react";

interface Props {
  employeeName: string;
  month: string;
  basic: number;
  housing: number;
  transport: number;
  deductions: number;
  gosiDeduction?: number;
  netPay: number;
  currency: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function PaySlipCard({ employeeName, month, basic, housing, transport, deductions, gosiDeduction, netPay, currency, onAction }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const fmt = (n: number) => n.toLocaleString();
  const grossPay = basic + housing + transport;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Pay Slip</h3>
          <p className="text-xs text-gray-400">{employeeName} - {month}</p>
        </div>
        <span className="badge badge-blue">{month}</span>
      </div>

      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-b border-gray-100">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Net Pay</p>
        <p className="text-2xl font-bold text-emerald-600">{fmt(netPay)} <span className="text-sm font-normal text-gray-400">{currency}</span></p>
      </div>

      <div className="grid grid-cols-3 gap-px bg-gray-100">
        <div className="bg-white p-3 text-center">
          <p className="text-[10px] text-gray-400">Gross</p>
          <p className="text-sm font-semibold text-gray-800">{fmt(grossPay)}</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-[10px] text-gray-400">Deductions</p>
          <p className="text-sm font-semibold text-red-500">-{fmt(deductions)}</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-[10px] text-gray-400">GOSI</p>
          <p className="text-sm font-semibold text-amber-600">{fmt(gosiDeduction || deductions)}</p>
        </div>
      </div>

      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-gray-400 hover:text-emerald-600 hover:bg-gray-50 transition-all border-t border-gray-100"
      >
        <span>{showBreakdown ? "Hide breakdown" : "View full breakdown"}</span>
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showBreakdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showBreakdown && (
        <div className="px-5 pb-4 animate-slide-up space-y-2">
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Earnings</p>
            <Row label="Basic Salary" amount={basic} currency={currency} color="text-gray-800" />
            <Row label="Housing Allowance" amount={housing} currency={currency} color="text-gray-800" />
            <Row label="Transport Allowance" amount={transport} currency={currency} color="text-gray-800" />
            <div className="border-t border-gray-100 pt-1.5">
              <Row label="Gross Total" amount={grossPay} currency={currency} color="text-gray-900" bold />
            </div>
          </div>
          <div className="space-y-1.5 pt-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Deductions</p>
            <Row label="GOSI (9.75%)" amount={-(gosiDeduction || deductions)} currency={currency} color="text-red-500" />
          </div>

          <button
            onClick={() => onAction?.("download_payslip", { month })}
            className="w-full mt-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 active:scale-[0.98] transition-all"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}

function Row({ label, amount, currency, color, bold }: { label: string; amount: number; currency: string; color: string; bold?: boolean }) {
  const fmt = (n: number) => Math.abs(n).toLocaleString();
  return (
    <div className="flex justify-between items-center">
      <span className={`text-xs ${bold ? "font-semibold text-gray-800" : "text-gray-500"}`}>{label}</span>
      <span className={`text-xs ${bold ? "font-bold" : "font-medium"} ${color}`}>
        {amount < 0 ? "-" : ""}{fmt(amount)} {currency}
      </span>
    </div>
  );
}
