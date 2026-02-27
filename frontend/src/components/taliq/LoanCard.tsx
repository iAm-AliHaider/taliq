"use client";

import { useState } from "react";

interface Props {
  employeeName: string;
  loanType: string;
  amount: number;
  currency: string;
  remainingBalance?: number;
  monthlyInstallment?: number;
  installmentsLeft?: number;
  eligible?: boolean;
  maxAmount?: number;
  status?: "active" | "eligible" | "ineligible" | "pending" | "completed";
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function LoanCard({ employeeName, loanType, amount, currency, remainingBalance, monthlyInstallment, installmentsLeft, eligible, maxAmount, status = "active", onAction }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const fmt = (n: number) => n.toLocaleString();

  const statusConfig: Record<string, { badge: string; label: string }> = {
    active: { badge: "badge-blue", label: "Active" },
    eligible: { badge: "badge-emerald", label: "Eligible" },
    ineligible: { badge: "badge-red", label: "Not Eligible" },
    pending: { badge: "badge-gold", label: "Pending" },
    completed: { badge: "badge-gray", label: "Completed" },
  };
  const s = statusConfig[status] || statusConfig.active;
  const paidPct = amount > 0 && remainingBalance !== undefined ? ((amount - remainingBalance) / amount) * 100 : 0;

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Loan: {loanType}</h3>
          <p className="text-xs text-gray-400">{employeeName}</p>
        </div>
        <span className={`badge ${s.badge}`}>{s.label}</span>
      </div>

      <div className="p-5 space-y-4">
        {status === "eligible" ? (
          <div className="bg-emerald-50 rounded-xl p-4 text-center space-y-3">
            <p className="text-xs text-gray-500">You qualify for up to</p>
            <p className="text-3xl font-bold text-emerald-600">{fmt(maxAmount || 0)} {currency}</p>
            <button
              onClick={() => onAction?.("apply_loan", { max_amount: maxAmount })}
              className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 active:scale-[0.97] transition-all"
            >
              Apply for Loan
            </button>
          </div>
        ) : status === "ineligible" ? (
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <p className="text-sm text-red-600 font-medium">Not eligible at this time</p>
            <p className="text-xs text-gray-400 mt-1">Contact HR for more details</p>
          </div>
        ) : (
          <>
            {/* Progress */}
            {remainingBalance !== undefined && amount > 0 && (
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Repaid</span>
                  <span className="text-xs text-emerald-600 font-semibold">{Math.round(paidPct)}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${paidPct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-gray-400">Paid: {fmt(amount - remainingBalance)} {currency}</span>
                  <span className="text-[10px] text-gray-400">Left: {fmt(remainingBalance)} {currency}</span>
                </div>
              </div>
            )}

            {/* Key stats */}
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Total" value={`${fmt(amount)}`} sub={currency} />
              {monthlyInstallment && <Stat label="Monthly" value={`${fmt(monthlyInstallment)}`} sub={currency} />}
              {installmentsLeft !== undefined && <Stat label="Remaining" value={`${installmentsLeft}`} sub="months" />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-gray-400 uppercase">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
      <p className="text-[9px] text-gray-400">{sub}</p>
    </div>
  );
}
