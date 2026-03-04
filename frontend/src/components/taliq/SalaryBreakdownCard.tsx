"use client";

import { generatePayslipPDF } from "@/lib/pdf";

import { useState } from "react";

interface LoanDeduction {
  ref: string;
  type: string;
  emi: number;
  remaining: number;
}

interface Props {
  employeeName: string;
  employeeId: string;
  position: string;
  department: string;
  grade: string;
  month: string;
  basic: number;
  housing: number;
  transport: number;
  gosiRate: number;
  gosiAmount: number;
  loanDeductions: LoanDeduction[];
  totalLoanDeduction: number;
  otherDeductions?: { label: string; amount: number }[];
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
  ytdGross?: number;
  ytdDeductions?: number;
  ytdNet?: number;
  bankName?: string;
  iban?: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function SalaryBreakdownCard({
  employeeName, employeeId, position, department, grade, month,
  basic, housing, transport, gosiRate, gosiAmount,
  loanDeductions, totalLoanDeduction, otherDeductions,
  grossPay, totalDeductions, netPay, currency,
  ytdGross, ytdDeductions, ytdNet, bankName, iban, onAction,
}: Props) {
  const [activeTab, setActiveTab] = useState<"breakdown" | "ytd" | "info">("breakdown");
  const fmt = (n: number) => n.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (n: number, total: number) => total > 0 ? ((n / total) * 100).toFixed(0) : "0";

  const tabs = [
    { key: "breakdown" as const, label: "Breakdown" },
    { key: "ytd" as const, label: "Year to Date" },
    { key: "info" as const, label: "Pay Info" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Salary Statement</h3>
            <p className="text-xs text-gray-500">{employeeName} · {employeeId}</p>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-lg bg-white/80 border border-gray-200 text-xs font-semibold text-gray-700">{month}</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400">{position} · {department} · Grade {grade}</p>
      </div>

      {/* Net Pay Hero */}
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mb-0.5">Net Salary</p>
            <p className="text-3xl font-extrabold text-emerald-700">{fmt(netPay)}</p>
          </div>
          <p className="text-sm text-emerald-600 font-medium">{currency}</p>
        </div>
        {/* Mini bar showing earnings vs deductions */}
        <div className="mt-3 flex rounded-full overflow-hidden h-2 bg-gray-100">
          <div className="bg-emerald-400 transition-all" style={{ width: `${pct(netPay, grossPay)}%` }} />
          <div className="bg-red-300 transition-all" style={{ width: `${pct(totalDeductions, grossPay)}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-emerald-600">Take home {pct(netPay, grossPay)}%</span>
          <span className="text-[9px] text-red-400">Deductions {pct(totalDeductions, grossPay)}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(tabs || []).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
              activeTab === tab.key ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50/50" : "text-gray-400 hover:text-gray-600"
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        {activeTab === "breakdown" && (
          <div className="space-y-4 animate-[slideUp_0.15s_ease-out]">
            {/* Earnings */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Earnings</p>
              </div>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                <Row label="Basic Salary" amount={basic} currency={currency} sub={`${pct(basic, grossPay)}% of gross`} />
                <Row label="Housing Allowance" amount={housing} currency={currency} sub={`${pct(housing, grossPay)}% of gross`} />
                <Row label="Transport Allowance" amount={transport} currency={currency} sub={`${pct(transport, grossPay)}% of gross`} />
                <Row label="Gross Pay" amount={grossPay} currency={currency} bold accent="emerald" />
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Deductions</p>
              </div>
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
                <Row label={`GOSI (${gosiRate}%)`} amount={-gosiAmount} currency={currency} sub="Social insurance" />
                {(loanDeductions || []).map(loan => (
                  <Row key={loan.ref} label={`Loan EMI · ${loan.ref}`} amount={-loan.emi} currency={currency}
                    sub={`${loan.type} · ${fmt(loan.remaining)} remaining`} />
                ))}
                {otherDeductions?.map((d, i) => (
                  <Row key={i} label={d.label} amount={-d.amount} currency={currency} />
                ))}
                <Row label="Total Deductions" amount={-totalDeductions} currency={currency} bold accent="red" />
              </div>
            </div>

            {/* Net */}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800">Net Salary</p>
                <p className="text-[10px] text-emerald-600">Credited to account</p>
              </div>
              <p className="text-xl font-extrabold text-emerald-700">{fmt(netPay)} <span className="text-xs font-normal">{currency}</span></p>
            </div>
          </div>
        )}

        {activeTab === "ytd" && (
          <div className="space-y-3 animate-[slideUp_0.15s_ease-out]">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Year-to-Date Summary</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Gross YTD" value={fmt(ytdGross || grossPay * 2)} color="blue" />
              <StatBox label="Deductions YTD" value={fmt(ytdDeductions || totalDeductions * 2)} color="red" />
              <StatBox label="Net YTD" value={fmt(ytdNet || netPay * 2)} color="emerald" />
            </div>
            <div className="rounded-xl border border-gray-100 p-3 mt-2">
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Monthly Trend</p>
              <div className="flex items-end gap-1 h-16">
                {[0.85, 0.9, 0.88, 0.92, 0.87, 0.95, 1, 1].slice(0, new Date().getMonth() + 1).map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className={`w-full rounded-t ${i === new Date().getMonth() ? "bg-emerald-500" : "bg-gray-200"}`}
                      style={{ height: `${h * 100}%` }} />
                    <span className="text-[8px] text-gray-400">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "info" && (
          <div className="space-y-3 animate-[slideUp_0.15s_ease-out]">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Payment Information</p>
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
              <InfoRow label="Pay Period" value={month} />
              <InfoRow label="Pay Date" value="25th of month" />
              <InfoRow label="Payment Method" value="Bank Transfer (WPS)" />
              {bankName && <InfoRow label="Bank" value={bankName} />}
              {iban && <InfoRow label="IBAN" value={`${iban.slice(0, 6)}****${iban.slice(-4)}`} />}
              <InfoRow label="Grade" value={grade} />
            </div>
            <button onClick={() => generatePayslipPDF({ employeeName, employeeId, position, department, month, basic, housing, transport, grossPay, gosiAmount, totalLoanDeduction, totalDeductions, netPay, currency })}
              className="w-full mt-2 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 active:scale-[0.98] transition-all">
              Download Pay Slip PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, amount, currency, sub, bold, accent }: {
  label: string; amount: number; currency: string; sub?: string; bold?: boolean; accent?: "emerald" | "red";
}) {
  const fmt = (n: number) => Math.abs(n).toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isNeg = amount < 0;
  const color = accent ? (accent === "emerald" ? "text-emerald-700" : "text-red-600") : isNeg ? "text-red-500" : "text-gray-800";
  return (
    <div className={`px-3.5 py-2.5 flex items-center justify-between ${bold ? "bg-gray-50" : ""}`}>
      <div>
        <p className={`text-xs ${bold ? "font-bold text-gray-900" : "text-gray-600"}`}>{label}</p>
        {sub && <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-xs ${bold ? "font-extrabold" : "font-semibold"} ${color}`}>
        {isNeg ? "-" : ""}{fmt(amount)} <span className="text-[9px] text-gray-400 font-normal">{currency}</span>
      </p>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: "blue" | "red" | "emerald" }) {
  const bg = color === "blue" ? "bg-blue-50 border-blue-100" : color === "red" ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100";
  const txt = color === "blue" ? "text-blue-700" : color === "red" ? "text-red-600" : "text-emerald-700";
  return (
    <div className={`rounded-xl border p-3 text-center ${bg}`}>
      <p className="text-[9px] text-gray-400 uppercase font-semibold">{label}</p>
      <p className={`text-sm font-bold ${txt} mt-0.5`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3.5 py-2.5 flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-semibold text-gray-700">{value}</span>
    </div>
  );
}
