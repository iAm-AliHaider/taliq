"use client";
import React, { useState } from "react";

interface Props {
  employeeName: string;
  leaveRequests: { ref: string; type: string; days: number; startDate: string; status: string }[];
  loans: { ref: string; type: string; amount: number; remaining: number; status: string }[];
  documents: { ref: string; type: string; status: string }[];
  travel: { ref: string; destination: string; days: number; status: string }[];
  grievances: { ref: string; subject: string; status: string }[];
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    active: "bg-blue-100 text-blue-700",
    ready: "bg-emerald-100 text-emerald-700",
    requested: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    submitted: "bg-yellow-100 text-yellow-700",
    resolved: "bg-emerald-100 text-emerald-700",
    draft: "bg-gray-100 text-gray-600",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
};

const TABS = [
  { key: "leave", label: "Leave" },
  { key: "loan", label: "Loans" },
  { key: "doc", label: "Documents" },
  { key: "travel", label: "Travel" },
  { key: "grievance", label: "Grievances" },
];

export default function MyRequestsCard(props: Props) {
  const [tab, setTab] = useState("leave");

  const counts: Record<string, number> = {
    leave: props.leaveRequests.length,
    loan: props.loans.length,
    doc: props.documents.length,
    travel: props.travel.length,
    grievance: props.grievances.length,
  };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">My Requests</h3>
          <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">{total} total</span>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b bg-gray-50 px-2 gap-1 py-1">
        {(TABS || []).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.key ? "bg-white shadow-sm text-blue-600 border border-blue-200" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
            {counts[t.key] > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[10px]">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      <div className="p-4 max-h-72 overflow-y-auto space-y-2">
        {tab === "leave" && (props.leaveRequests || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">{r.type} Leave</p>
              <p className="text-xs text-gray-500">{r.days} days from {r.startDate}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(r.status)}`}>{r.status}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.ref}</p>
            </div>
          </div>
        ))}

        {tab === "loan" && (props.loans || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{r.type}</p>
              <p className="text-xs text-gray-500">{r.amount.toLocaleString()} SAR (remaining: {r.remaining.toLocaleString()})</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(r.status)}`}>{r.status}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.ref}</p>
            </div>
          </div>
        ))}

        {tab === "doc" && (props.documents || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{r.type}</p>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(r.status)}`}>{r.status}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.ref}</p>
            </div>
          </div>
        ))}

        {tab === "travel" && (props.travel || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">To {r.destination}</p>
              <p className="text-xs text-gray-500">{r.days} days</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(r.status)}`}>{r.status}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.ref}</p>
            </div>
          </div>
        ))}

        {tab === "grievance" && (props.grievances || []).map(r => (
          <div key={r.ref} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">{r.subject}</p>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadge(r.status)}`}>{r.status}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.ref}</p>
            </div>
          </div>
        ))}

        {counts[tab] === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">No {TABS.find(t => t.key === tab)?.label.toLowerCase()} requests</div>
        )}
      </div>
    </div>
  );
}
