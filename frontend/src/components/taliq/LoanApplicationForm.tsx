"use client";

import { useState } from "react";

interface Props {
  employeeName: string;
  eligible: boolean;
  maxAmount: number;
  currency?: string;
  basicSalary?: number;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const LOAN_TYPES = [
  { value: "Interest-Free", label: "Interest-Free Loan", desc: "Max 2x basic, 12 months" },
  { value: "Advance Salary", label: "Advance Salary", desc: "1 month basic, 3 months" },
];

export function LoanApplicationForm({ employeeName, eligible, maxAmount, currency = "SAR", basicSalary = 0, onAction }: Props) {
  const [loanType, setLoanType] = useState("");
  const [amount, setAmount] = useState(0);
  const [months, setMonths] = useState(12);
  const [submitting, setSubmitting] = useState(false);
  

  const fmt = (n: number) => n.toLocaleString();
  const monthly = months > 0 && amount > 0 ? Math.round(amount / months) : 0;
  const maxMonths = loanType === "Advance Salary" ? 3 : 12;
  const effectiveMax = loanType === "Advance Salary" ? basicSalary : maxAmount;
  const canSubmit = eligible && loanType && amount > 0 && amount <= effectiveMax && months > 0 && months <= maxMonths;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onAction?.("submit_loan", { loan_type: loanType, amount, months });
  };

  if (!eligible) {
    return (
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Loan Application</h3>
          <span className="badge badge-red">Not Eligible</span>
        </div>
        <div className="p-5 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-red-500 text-lg font-bold">!</span>
          </div>
          <p className="text-sm text-gray-600">Not eligible for a loan at this time.</p>
          <p className="text-xs text-gray-400 mt-1">Contact HR for more details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Loan Application</h3>
          <p className="text-xs text-gray-400">{employeeName}</p>
        </div>
        <span className="badge badge-emerald">Eligible</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Max eligible banner */}
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase">Maximum Eligible</p>
          <p className="text-2xl font-bold text-emerald-600">{fmt(maxAmount)} <span className="text-xs font-normal text-gray-400">{currency}</span></p>
        </div>

        {/* Loan Type */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Loan Type</label>
          <div className="space-y-2">
            {LOAN_TYPES.map(lt => (
              <button
                key={lt.value}
                onClick={() => {
                  setLoanType(lt.value);
                  if (lt.value === "Advance Salary") {
                    setAmount(basicSalary);
                    setMonths(3);
                  }
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  loanType === lt.value
                    ? "border-purple-400 bg-purple-50 ring-1 ring-purple-200"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <p className={`text-xs font-semibold ${loanType === lt.value ? "text-purple-700" : "text-gray-700"}`}>{lt.label}</p>
                <p className="text-[10px] text-gray-400">{lt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        {loanType && (
          <>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Amount ({currency})</label>
                <span className="text-xs font-bold text-purple-600">{fmt(amount)}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={effectiveMax}
                step={1000}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-gray-200 accent-purple-500"
              />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-gray-400">1,000</span>
                <span className="text-[10px] text-gray-400">{fmt(effectiveMax)}</span>
              </div>
            </div>

            {/* Months */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Duration (Months)</label>
                <span className="text-xs font-bold text-purple-600">{months} months</span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: maxMonths }, (_, i) => i + 1).filter(m => m <= 3 || m % 3 === 0).map(m => (
                  <button
                    key={m}
                    onClick={() => setMonths(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      months === m ? "bg-purple-500 text-white" : "bg-gray-50 border border-gray-100 text-gray-600 hover:border-purple-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly installment preview */}
            {monthly > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-400">Total</p>
                  <p className="text-sm font-bold text-gray-800">{fmt(amount)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-400">Monthly</p>
                  <p className="text-sm font-bold text-purple-600">{fmt(monthly)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-gray-400">Duration</p>
                  <p className="text-sm font-bold text-gray-800">{months}m</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            canSubmit && !submitting
              ? "bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Apply for Loan"}
        </button>
      </div>
    </div>
  );
}
