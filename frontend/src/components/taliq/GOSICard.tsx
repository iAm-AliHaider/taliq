"use client";

import { useState } from "react";

interface Breakdown {
  annuities_employee?: number;
  annuities_employer?: number;
  occupational_hazards?: number;
  saned?: number;
}

interface Props {
  name: string;
  employeeId: string;
  nationality: string;
  isSaudi: boolean;
  basicSalary: number;
  housingAllowance: number;
  insurableSalary: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  employeeRate: number;
  employerRate: number;
  breakdown: Breakdown;
  annualEmployee: number;
  annualEmployer: number;
  annualTotal: number;
}

export function GOSICard({
  name, employeeId, nationality, isSaudi,
  basicSalary, housingAllowance, insurableSalary,
  employeeContribution, employerContribution, totalContribution,
  employeeRate, employerRate, breakdown,
  annualEmployee, annualEmployer, annualTotal,
}: Props) {
  const [view, setView] = useState<"monthly" | "annual">("monthly");
  const fmt = (n: number) => n.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const empAmt = view === "monthly" ? employeeContribution : annualEmployee;
  const erAmt = view === "monthly" ? employerContribution : annualEmployer;
  const totalAmt = view === "monthly" ? totalContribution : annualTotal;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">GOSI Social Insurance</h3>
            <p className="text-xs text-gray-500">{name} · {employeeId}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${isSaudi ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {nationality}
          </span>
        </div>
      </div>

      {/* Toggle */}
      <div className="px-5 pt-3 flex gap-1">
        {(["monthly", "annual"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === v ? "bg-teal-500 text-white shadow-sm" : "bg-gray-50 text-gray-400 hover:text-gray-600"
            }`}>{v === "monthly" ? "Monthly" : "Annual"}</button>
        ))}
      </div>

      {/* Summary */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
            <p className="text-[9px] text-blue-500 uppercase font-semibold">You Pay</p>
            <p className="text-sm font-bold text-blue-700">{fmt(empAmt)}</p>
            <p className="text-[9px] text-blue-400">{employeeRate}%</p>
          </div>
          <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
            <p className="text-[9px] text-violet-500 uppercase font-semibold">Employer</p>
            <p className="text-sm font-bold text-violet-700">{fmt(erAmt)}</p>
            <p className="text-[9px] text-violet-400">{employerRate}%</p>
          </div>
          <div className="rounded-xl bg-teal-50 border border-teal-100 p-3 text-center">
            <p className="text-[9px] text-teal-500 uppercase font-semibold">Total</p>
            <p className="text-sm font-bold text-teal-700">{fmt(totalAmt)}</p>
            <p className="text-[9px] text-teal-400">SAR</p>
          </div>
        </div>

        {/* Insurable Salary */}
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 mb-3">
          <div className="px-3.5 py-2.5 flex justify-between">
            <span className="text-xs text-gray-500">Basic Salary</span>
            <span className="text-xs font-semibold text-gray-800">{fmt(basicSalary)} SAR</span>
          </div>
          <div className="px-3.5 py-2.5 flex justify-between">
            <span className="text-xs text-gray-500">Housing Allowance</span>
            <span className="text-xs font-semibold text-gray-800">{fmt(housingAllowance)} SAR</span>
          </div>
          <div className="px-3.5 py-2.5 flex justify-between bg-gray-50">
            <span className="text-xs font-bold text-gray-700">Insurable Salary</span>
            <span className="text-xs font-bold text-gray-900">{fmt(insurableSalary)} SAR</span>
          </div>
        </div>

        {/* Breakdown */}
        {isSaudi && breakdown && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Contribution Breakdown</p>
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
              {breakdown.annuities_employee != null && (
                <div className="px-3.5 py-2 flex justify-between">
                  <span className="text-xs text-gray-500">Annuities (Employee 9.75%)</span>
                  <span className="text-xs font-semibold text-blue-600">{fmt(view === "monthly" ? breakdown.annuities_employee : breakdown.annuities_employee * 12)}</span>
                </div>
              )}
              {breakdown.annuities_employer != null && (
                <div className="px-3.5 py-2 flex justify-between">
                  <span className="text-xs text-gray-500">Annuities (Employer 9.0%)</span>
                  <span className="text-xs font-semibold text-violet-600">{fmt(view === "monthly" ? breakdown.annuities_employer : breakdown.annuities_employer * 12)}</span>
                </div>
              )}
              {breakdown.occupational_hazards != null && (
                <div className="px-3.5 py-2 flex justify-between">
                  <span className="text-xs text-gray-500">Occupational Hazards (2.0%)</span>
                  <span className="text-xs font-semibold text-violet-600">{fmt(view === "monthly" ? breakdown.occupational_hazards : breakdown.occupational_hazards * 12)}</span>
                </div>
              )}
              {breakdown.saned != null && (
                <div className="px-3.5 py-2 flex justify-between">
                  <span className="text-xs text-gray-500">SANED Unemployment (0.75%)</span>
                  <span className="text-xs font-semibold text-violet-600">{fmt(view === "monthly" ? breakdown.saned : breakdown.saned * 12)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
