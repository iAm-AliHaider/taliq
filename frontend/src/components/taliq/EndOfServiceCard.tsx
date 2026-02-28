"use client";

import { useState } from "react";

interface Props {
  name: string;
  employeeId: string;
  position: string;
  department: string;
  joinDate: string;
  yearsOfService: number;
  monthsOfService: number;
  baseWage: number;
  dailyWage: number;
  reason: string;
  eligible: boolean;
  gratuityAmount: number;
  first5Years: number;
  after5Years: number;
  multiplier: number;
  note: string;
  currency: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function EndOfServiceCard({
  name, employeeId, position, department, joinDate,
  yearsOfService, monthsOfService, baseWage, dailyWage,
  reason, eligible, gratuityAmount, first5Years, after5Years,
  multiplier, note, currency, onAction,
}: Props) {
  const [simReason, setSimReason] = useState(reason);
  const fmt = (n: number) => n.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const years = Math.floor(yearsOfService);
  const months = Math.round((yearsOfService - years) * 12);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">End of Service Benefits</h3>
            <p className="text-xs text-gray-500">{name} · {employeeId}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${eligible ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            {eligible ? "Eligible" : "Not Eligible"}
          </span>
        </div>
      </div>

      {/* Gratuity Amount Hero */}
      {eligible && (
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
          <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mb-0.5">Estimated Gratuity</p>
          <p className="text-3xl font-extrabold text-emerald-700">{fmt(gratuityAmount)}</p>
          <p className="text-xs text-emerald-500 mt-0.5">{currency} · {note}</p>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Service Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
            <p className="text-[9px] text-blue-500 uppercase font-semibold">Service</p>
            <p className="text-lg font-bold text-blue-700">{years}<span className="text-xs font-normal">y</span> {months}<span className="text-xs font-normal">m</span></p>
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
            <p className="text-[9px] text-violet-500 uppercase font-semibold">Base Wage</p>
            <p className="text-sm font-bold text-violet-700">{fmt(baseWage)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
            <p className="text-[9px] text-amber-500 uppercase font-semibold">Daily</p>
            <p className="text-sm font-bold text-amber-700">{fmt(dailyWage)}</p>
          </div>
        </div>

        {/* Calculation Breakdown */}
        {eligible && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Calculation Breakdown</p>
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
              <div className="px-3.5 py-2.5 flex justify-between">
                <div>
                  <p className="text-xs text-gray-600">First 5 years</p>
                  <p className="text-[9px] text-gray-400">Half month salary per year</p>
                </div>
                <span className="text-xs font-semibold text-gray-800">{fmt(first5Years)} {currency}</span>
              </div>
              {after5Years > 0 && (
                <div className="px-3.5 py-2.5 flex justify-between">
                  <div>
                    <p className="text-xs text-gray-600">After 5 years</p>
                    <p className="text-[9px] text-gray-400">Full month salary per year</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{fmt(after5Years)} {currency}</span>
                </div>
              )}
              {multiplier < 1 && (
                <div className="px-3.5 py-2.5 flex justify-between bg-amber-50">
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Resignation Adjustment</p>
                    <p className="text-[9px] text-amber-500">{(multiplier * 100).toFixed(0)}% of full gratuity</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-700">&times;{multiplier.toFixed(2)}</span>
                </div>
              )}
              <div className="px-3.5 py-2.5 flex justify-between bg-emerald-50">
                <span className="text-xs font-bold text-emerald-800">Total Gratuity</span>
                <span className="text-sm font-extrabold text-emerald-700">{fmt(gratuityAmount)} {currency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Scenario Simulator */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Simulate Scenario</p>
          <div className="flex gap-2">
            {["termination", "resignation"].map(r => (
              <button key={r} onClick={() => { setSimReason(r); onAction?.("calculate_eos", { reason: r }); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] ${
                  simReason === r ? (r === "termination" ? "bg-blue-500 text-white" : "bg-amber-500 text-white") : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}>{r === "termination" ? "Termination" : "Resignation"}</button>
            ))}
          </div>
        </div>

        {/* Employment Details */}
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
          <div className="px-3.5 py-2 flex justify-between">
            <span className="text-xs text-gray-400">Position</span>
            <span className="text-xs font-semibold text-gray-700">{position}</span>
          </div>
          <div className="px-3.5 py-2 flex justify-between">
            <span className="text-xs text-gray-400">Department</span>
            <span className="text-xs font-semibold text-gray-700">{department}</span>
          </div>
          <div className="px-3.5 py-2 flex justify-between">
            <span className="text-xs text-gray-400">Joined</span>
            <span className="text-xs font-semibold text-gray-700">{joinDate}</span>
          </div>
          <div className="px-3.5 py-2 flex justify-between">
            <span className="text-xs text-gray-400">Calculation Basis</span>
            <span className="text-xs font-semibold text-gray-700">Basic + Housing</span>
          </div>
        </div>

        {!eligible && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs text-amber-800 font-medium">{note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
