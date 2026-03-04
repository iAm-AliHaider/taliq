"use client";

import { useState } from "react";

interface Props {
  employeeName: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  reason?: string;
  balance?: number;
  status?: string;
  reference?: string;
  mode?: "form" | "display";
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave", max: 30 },
  { value: "sick", label: "Sick Leave", max: 30 },
  { value: "emergency", label: "Emergency Leave", max: 5 },
  { value: "study", label: "Study Leave", max: 15 },
];

const STATUS_CONFIG: Record<string, { badge: string; label: string; color: string }> = {
  preview: { badge: "badge-blue", label: "Draft", color: "bg-blue-50 border-blue-100" },
  submitted: { badge: "badge-gold", label: "Submitted", color: "bg-amber-50 border-amber-100" },
  pending: { badge: "badge-gold", label: "Pending", color: "bg-amber-50 border-amber-100" },
  approved: { badge: "badge-emerald", label: "Approved", color: "bg-emerald-50 border-emerald-100" },
  rejected: { badge: "badge-red", label: "Rejected", color: "bg-red-50 border-red-100" },
};

export function LeaveRequestForm({
  employeeName, leaveType: initType, startDate: initStart, endDate: initEnd,
  days: initDays, reason: initReason, balance, status = "preview", reference, mode, onAction,
}: Props) {
  const isForm = mode === "form" || status === "preview";
  const [leaveType, setLeaveType] = useState(initType || "");
  const [startDate, setStartDate] = useState(initStart || "");
  const [endDate, setEndDate] = useState(initEnd || "");
  const [reason, setReason] = useState(initReason || "");
  const [submitting, setSubmitting] = useState(false);
  

  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  // Calculate days from dates
  const calcDays = () => {
    if (!startDate || !endDate) return initDays || 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };
  const days = calcDays();

  const canSubmit = leaveType && startDate && endDate && reason && days > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onAction?.("submit_leave", { leave_type: leaveType, start_date: startDate, end_date: endDate, days, reason });
    
  };

  // Display mode (submitted/approved/rejected)
  if (!isForm) {
    return (
      <div className="card overflow-hidden">
        <div className={`px-5 py-2.5 flex items-center justify-between border-b ${s.color}`}>
          <div>
            <span className="text-xs font-semibold text-gray-700">Leave Request</span>
            {reference && <span className="text-[10px] text-gray-400 ml-2">{reference}</span>}
          </div>
          <span className={`badge ${s.badge}`}>{s.label}</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee" value={employeeName || "--"} />
            <Field label="Type" value={leaveType || initType || "--"} />
            <Field label="From" value={startDate || initStart || "--"} />
            <Field label="To" value={endDate || initEnd || "--"} />
            <Field label="Days" value={String(days || initDays || 0)} />
            {balance !== undefined && <Field label="Balance After" value={`${balance} days`} />}
          </div>
          {(reason || initReason) && (
            <div className="mt-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Reason</span>
              <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-lg p-3">{reason || initReason}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interactive form mode
  return (
    <div className={`card overflow-hidden ${submitting ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Apply for Leave</h3>
          <p className="text-xs text-gray-400">{employeeName}</p>
        </div>
        <span className="badge badge-blue">Draft</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Leave Type */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Leave Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(LEAVE_TYPES || []).map(lt => (
              <button
                key={lt.value}
                onClick={() => setLeaveType(lt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  leaveType === lt.value
                    ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <p className={`text-xs font-semibold ${leaveType === lt.value ? "text-emerald-700" : "text-gray-700"}`}>{lt.label}</p>
                <p className="text-[10px] text-gray-400">Max {lt.max} days</p>
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all"
            />
          </div>
        </div>

        {/* Days & Balance preview */}
        {days > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-blue-500 uppercase">Duration</p>
              <p className="text-lg font-bold text-blue-700">{days} <span className="text-xs font-normal">days</span></p>
            </div>
            {balance !== undefined && (
              <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-emerald-500 uppercase">Balance After</p>
                <p className={`text-lg font-bold ${balance - days >= 0 ? "text-emerald-700" : "text-red-600"}`}>{balance - days} <span className="text-xs font-normal">days</span></p>
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Reason</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Why do you need this leave?"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 transition-all resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            canSubmit && !submitting
              ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Leave Request"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{label}</span>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
