"use client";
import React from "react";

interface Props {
  employee: {
    id: string; name: string; nameAr?: string;
    position: string; department: string;
    email?: string; phone?: string;
    joinDate: string; grade?: string; nationality?: string;
    salary: { basic: number; housing: number; transport: number; total: number };
    leaveBalance: { annual: number; sick: number; emergency: number; study: number };
  };
  leaveRequests: number;
  pendingLeaves: number;
  activeLoans: number;
  loanBalance: number;
  reviews: { period: string; rating: number }[];
  goalsTotal: number;
  goalsCompleted: number;
  trainingCompliance: number;
  trainingsCompleted: number;
  grievanceCount: number;
  openGrievances: number;
}

export default function EmployeeDetailCard(props: Props) {
  const { employee: e } = props;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-sky-50 to-blue-50 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold text-lg">
            {e.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{e.name}</h3>
            {e.nameAr && <p className="text-sm text-gray-500 font-arabic">{e.nameAr}</p>}
            <p className="text-xs text-gray-500">{e.position} - {e.department} ({e.id})</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Personal Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-gray-400">Email</span>
            <p className="text-gray-700 font-medium">{e.email || "-"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-gray-400">Phone</span>
            <p className="text-gray-700 font-medium">{e.phone || "-"}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-gray-400">Join Date</span>
            <p className="text-gray-700 font-medium">{e.joinDate}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <span className="text-gray-400">Nationality</span>
            <p className="text-gray-700 font-medium">{e.nationality || "-"}</p>
          </div>
        </div>

        {/* Salary */}
        <div className="bg-emerald-50 rounded-xl p-3">
          <p className="text-xs text-emerald-600 font-medium mb-1">Compensation (SAR)</p>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div><p className="text-gray-400">Basic</p><p className="font-bold text-gray-900">{e.salary.basic.toLocaleString()}</p></div>
            <div><p className="text-gray-400">Housing</p><p className="font-bold text-gray-900">{e.salary.housing.toLocaleString()}</p></div>
            <div><p className="text-gray-400">Transport</p><p className="font-bold text-gray-900">{e.salary.transport.toLocaleString()}</p></div>
            <div><p className="text-gray-400">Total</p><p className="font-bold text-emerald-600">{e.salary.total.toLocaleString()}</p></div>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {Object.entries(e.leaveBalance).map(([k, v]) => (
            <div key={k} className="bg-gray-50 rounded-lg p-2">
              <p className="text-gray-400 capitalize">{k}</p>
              <p className="font-bold text-gray-900 text-sm">{v}d</p>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-blue-400">Leave Reqs</p>
            <p className="text-xl font-bold text-blue-700">{props.leaveRequests}</p>
            {props.pendingLeaves > 0 && <p className="text-orange-500">{props.pendingLeaves} pending</p>}
          </div>
          <div className="bg-purple-50 rounded-xl p-3 text-center">
            <p className="text-purple-400">Loans</p>
            <p className="text-xl font-bold text-purple-700">{props.activeLoans}</p>
            <p className="text-purple-500">{props.loanBalance.toLocaleString()} SAR</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-amber-400">Training</p>
            <p className="text-xl font-bold text-amber-700">{props.trainingCompliance}%</p>
            <p className="text-amber-500">{props.trainingsCompleted} done</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-green-400">Goals</p>
            <p className="text-lg font-bold text-green-700">{props.goalsCompleted}/{props.goalsTotal}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-red-400">Grievances</p>
            <p className="text-lg font-bold text-red-700">{props.grievanceCount}</p>
            {props.openGrievances > 0 && <p className="text-red-500">{props.openGrievances} open</p>}
          </div>
        </div>

        {/* Reviews */}
        {props.reviews.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Recent Reviews</p>
            <div className="flex gap-2">
              {props.(reviews || []).map((r, i) => (
                <div key={i} className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-gray-500">{r.period}</span>
                  <span className="ml-2 font-bold text-yellow-600">{"★".repeat(r.rating)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
