"use client";
import React, { useState } from "react";

interface ManagerPendingCardProps {
  leaveRequests: { ref: string; employeeName: string; leaveType: string; days: number; startDate: string; reason: string }[];
  loanRequests: { ref: string; employeeName: string; loanType: string; amount: number; installments: number }[];
  travelRequests: { ref: string; employeeName: string; destination: string; days: number; allowance: number }[];
  overtimeRequests: { id: number; employeeName: string; hours: number; date: string; reason: string }[];
  documentRequests: { ref: string; employeeName: string; documentType: string; status: string }[];
  grievances: { ref: string; employeeName: string; category: string; severity: string; subject: string }[];
  pendingReviews: { employeeId: string; name: string; position: string }[];
  counts: Record<string, number>;
  total: number;
}

const TABS = [
  { key: "leave", label: "Leave", icon: "calendar" },
  { key: "loan", label: "Loans", icon: "banknotes" },
  { key: "travel", label: "Travel", icon: "plane" },
  { key: "overtime", label: "OT", icon: "clock" },
  { key: "document", label: "Docs", icon: "document" },
  { key: "grievance", label: "Grievance", icon: "flag" },
  { key: "review", label: "Reviews", icon: "star" },
];

const severityColor: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function ManagerPendingCard(props: ManagerPendingCardProps) {
  const [tab, setTab] = useState("leave");

  const tabCounts: Record<string, number> = {
    leave: props.leaveRequests.length,
    loan: props.loanRequests.length,
    travel: props.travelRequests.length,
    overtime: props.overtimeRequests.length,
    document: props.documentRequests.length,
    grievance: props.grievances.length,
    review: props.pendingReviews.length,
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
          <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-medium">{props.total} total</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b bg-gray-50 px-2 gap-1 py-1">
        {(TABS || []).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? "bg-white shadow-sm text-emerald-600 border border-emerald-200" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {tabCounts[t.key] > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px]">{tabCounts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="p-4 max-h-80 overflow-y-auto space-y-3">
        {tab === "leave" && props.(leaveRequests || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{r.employeeName}</p>
              <p className="text-xs text-gray-500">{r.leaveType} - {r.days} days from {r.startDate}</p>
              {r.reason && <p className="text-xs text-gray-400 mt-0.5">{r.reason}</p>}
            </div>
            <span className="text-xs font-mono text-gray-400">{r.ref}</span>
          </div>
        ))}

        {tab === "loan" && props.(loanRequests || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{r.employeeName}</p>
              <p className="text-xs text-gray-500">{r.loanType} - {r.amount.toLocaleString()} SAR ({r.installments} months)</p>
            </div>
            <span className="text-xs font-mono text-gray-400">{r.ref}</span>
          </div>
        ))}

        {tab === "travel" && props.(travelRequests || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{r.employeeName}</p>
              <p className="text-xs text-gray-500">To {r.destination} - {r.days} days ({r.allowance.toLocaleString()} SAR)</p>
            </div>
            <span className="text-xs font-mono text-gray-400">{r.ref}</span>
          </div>
        ))}

        {tab === "overtime" && props.(overtimeRequests || []).map(r => (
          <div key={r.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{r.employeeName}</p>
              <p className="text-xs text-gray-500">{r.hours}h on {r.date}</p>
              {r.reason && <p className="text-xs text-gray-400">{r.reason}</p>}
            </div>
            <span className="text-xs font-mono text-gray-400">#{r.id}</span>
          </div>
        ))}

        {tab === "document" && props.(documentRequests || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{r.employeeName}</p>
              <p className="text-xs text-gray-500">{r.documentType} ({r.status})</p>
            </div>
            <span className="text-xs font-mono text-gray-400">{r.ref}</span>
          </div>
        ))}

        {tab === "grievance" && props.(grievances || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900 text-sm">{r.employeeName}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${severityColor[r.severity] || "bg-gray-100"}`}>{r.severity}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{r.subject}</p>
            <p className="text-xs text-gray-400">{r.category} - {r.ref}</p>
          </div>
        ))}

        {tab === "review" && props.(pendingReviews || []).map(r => (
          <div key={r.employeeId} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 text-sm">{r.name}</p>
              <p className="text-xs text-gray-500">{r.position}</p>
            </div>
            <span className="text-xs text-orange-500 font-medium">Needs Review</span>
          </div>
        ))}

        {tabCounts[tab] === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No pending items</div>
        )}
      </div>
    </div>
  );
}
