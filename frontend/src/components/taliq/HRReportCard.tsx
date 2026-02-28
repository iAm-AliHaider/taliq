"use client";

import { useState } from "react";

interface Props {
  totalEmployees: number;
  byDepartment: { department: string; cnt: number }[];
  byNationality: { nationality: string; cnt: number }[];
  leaveStats: { approved_days: number; pending_days: number; rejected_days: number; total_requests: number } | null;
  salaryByDept: { department: string; dept_cost: number }[];
  totalMonthlyPayroll: number;
  activeExits: number;
  assetStats: { status: string; cnt: number }[];
  expiringDocs90d: number;
}

export function HRReportCard(props: Props) {
  const [tab, setTab] = useState<"overview" | "workforce" | "financial">("overview");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <h3 className="text-sm font-bold text-gray-900">HR Analytics Report</h3>
        <div className="flex gap-1 mt-2">
          {(["overview", "workforce", "financial"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-lg text-[10px] font-medium ${tab === t ? "bg-emerald-500 text-white" : "bg-white text-gray-500 border border-gray-200"}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {tab === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Total Employees" value={props.totalEmployees} color="text-gray-900" />
            <Stat label="Monthly Payroll" value={`${(props.totalMonthlyPayroll / 1000).toFixed(0)}K SAR`} color="text-emerald-600" />
            <Stat label="Active Exits" value={props.activeExits} color="text-red-600" />
            <Stat label="Docs Expiring (90d)" value={props.expiringDocs90d} color="text-amber-600" />
            {props.leaveStats && <>
              <Stat label="Leave Requests" value={props.leaveStats.total_requests} color="text-blue-600" />
              <Stat label="Approved Days" value={props.leaveStats.approved_days} color="text-emerald-600" />
              <Stat label="Pending Days" value={props.leaveStats.pending_days} color="text-amber-600" />
            </>}
          </div>
        )}
        {tab === "workforce" && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">By Department</p>
              {props.byDepartment.map(d => (
                <div key={d.department} className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs text-gray-600 w-36 truncate">{d.department}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(d.cnt / props.totalEmployees) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 w-6 text-right">{d.cnt}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">By Nationality</p>
              <div className="flex flex-wrap gap-2">
                {props.byNationality.map(n => (
                  <span key={n.nationality} className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">{n.nationality}: {n.cnt}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === "financial" && (
          <div className="space-y-3">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{props.totalMonthlyPayroll?.toLocaleString()} SAR</p>
              <p className="text-[10px] text-gray-500">Total Monthly Payroll</p>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Cost by Department</p>
            {props.salaryByDept.map(d => (
              <div key={d.department} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-700">{d.department}</span>
                <span className="text-xs font-bold text-gray-900">{d.dept_cost?.toLocaleString()} SAR</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
