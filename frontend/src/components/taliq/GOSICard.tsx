"use client";

import { useState } from "react";

interface Breakdown {
  annuities_employee?: number;
  annuities_employer?: number;
  saned_employee?: number;
  saned_employer?: number;
  occupational_hazards?: number;
  total_employee?: number;
  total_employer?: number;
}

interface Compliance {
  payment_due_day?: number;
  late_penalty_pct?: number;
  registration_deadline_days?: number;
  portal?: string;
  regulatory_body?: string;
}

interface Benefits {
  retirement_age?: number;
  min_months_pension?: number;
  min_months_early_retirement?: number;
  disability_min_months?: number;
  coverage?: string[];
}

interface RateSchedule {
  [key: string]: { employee: number; employer: number; total: number };
}

interface Props {
  name: string;
  employeeId: string;
  nationality: string;
  isSaudi: boolean;
  isGcc?: boolean;
  newSystem?: boolean;
  system?: string;
  basicSalary: number;
  housingAllowance: number;
  insurableSalary: number;
  minInsurable?: number;
  maxInsurable?: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  employeeRate: number;
  employerRate: number;
  totalRate?: number;
  breakdown: Breakdown;
  annualEmployee: number;
  annualEmployer: number;
  annualTotal: number;
  compliance?: Compliance;
  benefits?: Benefits;
  rateSchedule?: RateSchedule;
}

export function GOSICard({
  name, employeeId, nationality, isSaudi, isGcc, newSystem, system,
  basicSalary, housingAllowance, insurableSalary, minInsurable, maxInsurable,
  employeeContribution, employerContribution, totalContribution,
  employeeRate, employerRate, totalRate,
  breakdown, annualEmployee, annualEmployer, annualTotal,
  compliance, benefits, rateSchedule,
}: Props) {
  const [tab, setTab] = useState<"contributions" | "breakdown" | "benefits" | "compliance">("contributions");
  const [view, setView] = useState<"monthly" | "annual">("monthly");
  const fmt = (n: number) => n.toLocaleString("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const m = view === "monthly" ? 1 : 12;

  const tabs = [
    { key: "contributions" as const, label: "Summary" },
    { key: "breakdown" as const, label: "Breakdown" },
    ...(isSaudi ? [{ key: "benefits" as const, label: "Benefits" }] : []),
    { key: "compliance" as const, label: "Compliance" },
  ];

  if (isGcc) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-[slideUp_0.2s_ease-out]">
        <h3 className="text-sm font-bold text-amber-800 mb-1">GOSI — GCC National</h3>
        <p className="text-xs text-amber-700">{name} ({nationality})</p>
        <p className="text-xs text-amber-600 mt-2">GCC nationals follow home country social security regulations rather than Saudi GOSI requirements.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-bold text-gray-900">GOSI Social Insurance</h3>
            <p className="text-xs text-gray-500">{name} · {employeeId}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${isSaudi ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {nationality}
            </span>
            {newSystem !== undefined && isSaudi && (
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold ${newSystem ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                {newSystem ? "New System" : "Existing System"}
              </span>
            )}
          </div>
        </div>
        {system && <p className="text-[10px] text-gray-400">{system}</p>}
      </div>

      {/* Hero Numbers */}
      <div className="px-5 py-3 bg-gradient-to-r from-teal-50/50 to-transparent border-b border-gray-100">
        <div className="flex gap-1 mb-3">
          {(["monthly", "annual"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                view === v ? "bg-teal-500 text-white" : "bg-white text-gray-400 border border-gray-200"
              }`}>{v === "monthly" ? "Monthly" : "Annual"}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatBox label="You Pay" value={fmt(employeeContribution * m)} sub={`${employeeRate}%`} color="blue" />
          <StatBox label="Employer" value={fmt(employerContribution * m)} sub={`${employerRate}%`} color="violet" />
          <StatBox label="Total" value={fmt(totalContribution * m)} sub={totalRate ? `${totalRate}%` : "SAR"} color="teal" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-[10px] font-semibold transition-all ${
              tab === t.key ? "text-teal-600 border-b-2 border-teal-500 bg-teal-50/50" : "text-gray-400"
            }`}>{t.label}</button>
        ))}
      </div>

      <div className="p-4">
        {tab === "contributions" && (
          <div className="space-y-3 animate-[slideUp_0.15s_ease-out]">
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
              <Row label="Basic Salary" value={`${fmt(basicSalary)} SAR`} />
              <Row label="Housing Allowance" value={`${fmt(housingAllowance)} SAR`} />
              <Row label="Contribution Base" value={`${fmt(insurableSalary)} SAR`} bold />
            </div>
            {(minInsurable || maxInsurable) && (
              <div className="flex gap-2">
                {minInsurable && <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Min: {fmt(minInsurable)}</span>}
                {maxInsurable && <span className="text-[9px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Max: {fmt(maxInsurable)}</span>}
              </div>
            )}
            {/* Visual ratio */}
            <div>
              <p className="text-[9px] text-gray-400 mb-1">Contribution Split</p>
              <div className="flex rounded-full overflow-hidden h-3">
                <div className="bg-blue-400 flex items-center justify-center" style={{ width: `${totalRate ? (employeeRate / totalRate * 100) : 45}%` }}>
                  <span className="text-[8px] text-white font-bold">{employeeRate}%</span>
                </div>
                <div className="bg-violet-400 flex items-center justify-center" style={{ width: `${totalRate ? (employerRate / totalRate * 100) : 55}%` }}>
                  <span className="text-[8px] text-white font-bold">{employerRate}%</span>
                </div>
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[8px] text-blue-500">Employee</span>
                <span className="text-[8px] text-violet-500">Employer</span>
              </div>
            </div>
          </div>
        )}

        {tab === "breakdown" && (
          <div className="space-y-3 animate-[slideUp_0.15s_ease-out]">
            {isSaudi ? (
              <>
                <Section title="Employee Deductions">
                  {breakdown.annuities_employee != null && <Row label="Retirement Pension (Annuities)" value={`${fmt(breakdown.annuities_employee * m)} SAR`} sub="Old age, disability, death" />}
                  {breakdown.saned_employee != null && <Row label="SANED Unemployment" value={`${fmt(breakdown.saned_employee * m)} SAR`} sub="Unemployment insurance" />}
                  {breakdown.total_employee != null && <Row label="Total Employee" value={`${fmt(breakdown.total_employee * m)} SAR`} bold accent="blue" />}
                </Section>
                <Section title="Employer Contributions">
                  {breakdown.annuities_employer != null && <Row label="Retirement Pension (Annuities)" value={`${fmt(breakdown.annuities_employer * m)} SAR`} />}
                  {breakdown.saned_employer != null && <Row label="SANED Unemployment" value={`${fmt(breakdown.saned_employer * m)} SAR`} />}
                  {breakdown.occupational_hazards != null && <Row label="Occupational Hazards (2.0%)" value={`${fmt(breakdown.occupational_hazards * m)} SAR`} sub="Work injuries & diseases" />}
                  {breakdown.total_employer != null && <Row label="Total Employer" value={`${fmt(breakdown.total_employer * m)} SAR`} bold accent="violet" />}
                </Section>
              </>
            ) : (
              <Section title="Employer Only">
                {breakdown.occupational_hazards != null && <Row label="Occupational Hazards (2.0%)" value={`${fmt(breakdown.occupational_hazards * m)} SAR`} />}
              </Section>
            )}
            {rateSchedule && Object.keys(rateSchedule).length > 0 && newSystem && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Rate Increase Schedule</p>
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 divide-y divide-blue-100">
                  {Object.entries(rateSchedule).map(([period, rates]) => (
                    <div key={period} className="px-3 py-2 flex justify-between items-center">
                      <span className="text-xs text-gray-600">{period.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                      <div className="flex gap-3">
                        <span className="text-[10px] text-blue-600">Emp {rates.employee}%</span>
                        <span className="text-[10px] text-violet-600">Er {rates.employer}%</span>
                        <span className="text-[10px] font-bold text-gray-700">{rates.total}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "benefits" && benefits && (
          <div className="space-y-3 animate-[slideUp_0.15s_ease-out]">
            {benefits.coverage && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">Coverage</p>
                <div className="flex flex-wrap gap-1.5">
                  {benefits.coverage.map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-medium">{c}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
              {benefits.retirement_age && <Row label="Retirement Age" value={`${benefits.retirement_age} years`} />}
              {benefits.min_months_pension && <Row label="Min Months for Pension" value={`${benefits.min_months_pension} months (${(benefits.min_months_pension / 12).toFixed(1)} years)`} />}
              {benefits.min_months_early_retirement && <Row label="Early Retirement" value={`${benefits.min_months_early_retirement} months (${(benefits.min_months_early_retirement / 12).toFixed(1)} years)`} />}
              {benefits.disability_min_months && <Row label="Disability Pension Min" value={`${benefits.disability_min_months} months`} />}
            </div>
          </div>
        )}

        {tab === "compliance" && compliance && (
          <div className="space-y-3 animate-[slideUp_0.15s_ease-out]">
            <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
              <Row label="Regulatory Body" value={compliance.regulatory_body || "GOSI"} />
              <Row label="Payment Due" value={`${compliance.payment_due_day || 15}th of following month`} />
              <Row label="Late Payment Penalty" value={`${compliance.late_penalty_pct || 2}% of contribution`} />
              <Row label="Registration Deadline" value={`${compliance.registration_deadline_days || 15} days from hire`} />
            </div>
            {compliance.portal && (
              <a href={compliance.portal} target="_blank" rel="noopener noreferrer"
                className="block w-full py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold text-center hover:bg-teal-100 transition-all">
                Visit GOSI Portal
              </a>
            )}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <p className="text-[10px] text-amber-700 font-semibold mb-1">Important Deadlines</p>
              <ul className="text-[10px] text-amber-600 space-y-0.5">
                <li>Register new employees within 15 days of hire</li>
                <li>Monthly contributions due by the 15th</li>
                <li>Report injuries within 3 working days</li>
                <li>Update salary changes within 15 days</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub: string; color: "blue" | "violet" | "teal" }) {
  const styles = {
    blue: "bg-blue-50 border-blue-100 text-blue-700",
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    teal: "bg-teal-50 border-teal-100 text-teal-700",
  };
  const subStyles = { blue: "text-blue-400", violet: "text-violet-400", teal: "text-teal-400" };
  return (
    <div className={`rounded-xl border p-2.5 text-center ${styles[color]}`}>
      <p className={`text-[9px] uppercase font-semibold ${subStyles[color]}`}>{label}</p>
      <p className="text-sm font-bold mt-0.5">{value}</p>
      <p className={`text-[9px] ${subStyles[color]}`}>{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-2">{title}</p>
      <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">{children}</div>
    </div>
  );
}

function Row({ label, value, sub, bold, accent }: { label: string; value: string; sub?: string; bold?: boolean; accent?: "blue" | "violet" }) {
  const valColor = accent === "blue" ? "text-blue-700" : accent === "violet" ? "text-violet-700" : "text-gray-800";
  return (
    <div className={`px-3.5 py-2.5 flex items-center justify-between ${bold ? "bg-gray-50" : ""}`}>
      <div>
        <p className={`text-xs ${bold ? "font-bold text-gray-900" : "text-gray-600"}`}>{label}</p>
        {sub && <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-xs ${bold ? "font-extrabold" : "font-semibold"} ${valColor}`}>{value}</span>
    </div>
  );
}
