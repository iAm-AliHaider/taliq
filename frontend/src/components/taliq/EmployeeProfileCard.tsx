"use client";

import { useState } from "react";

interface Props {
  name: string;
  nameAr?: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  employeeId: string;
  grade?: string;
  manager?: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function EmployeeProfileCard({ name, nameAr, position, department, email, phone, joinDate, employeeId, grade, manager, onAction }: Props) {
  const [expanded, setExpanded] = useState(false);
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{name}</h3>
            {nameAr && <p className="text-emerald-100 text-xs rtl">{nameAr}</p>}
            <p className="text-emerald-100 text-xs mt-0.5">{position}</p>
          </div>
          <span className="px-2 py-1 rounded-lg bg-white/20 text-white text-[10px] font-medium">{employeeId}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-gray-100">
        <InfoCell label="Department" value={department} />
        <InfoCell label="Grade" value={grade || "N/A"} />
        <InfoCell label="Join Date" value={joinDate} />
        <InfoCell label="Manager" value={manager || "N/A"} />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-gray-400 hover:text-emerald-600 hover:bg-gray-50 transition-all border-t border-gray-100"
      >
        <span>{expanded ? "Hide details" : "Show contact & actions"}</span>
        <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-4 animate-slide-up space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase">Email</p>
              <p className="text-xs font-medium text-gray-700 truncate">{email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase">Phone</p>
              <p className="text-xs font-medium text-gray-700">{phone}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onAction?.("show_pay_slip", { employee_id: employeeId })}
              className="flex-1 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 active:scale-[0.98] transition-all"
            >
              Pay Slip
            </button>
            <button
              onClick={() => onAction?.("check_leave_balance", { employee_id: employeeId })}
              className="flex-1 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 active:scale-[0.98] transition-all"
            >
              Leave
            </button>
            <button
              onClick={() => onAction?.("request_document", { employee_id: employeeId, document_type: "Salary Certificate" })}
              className="flex-1 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-100 active:scale-[0.98] transition-all"
            >
              Docs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
