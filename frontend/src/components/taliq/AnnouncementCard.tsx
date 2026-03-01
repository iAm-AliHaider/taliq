"use client";

import { useState } from "react";

interface Props {
  id?: number;
  title: string;
  content: string;
  author?: string;
  date?: string;
  priority?: "normal" | "important" | "urgent";
  acknowledged?: boolean;
  acknowledgedCount?: number;
  totalCount?: number;
  requireAcknowledge?: boolean;
  onAction?: (action: string, payload: any) => void;
}

export function AnnouncementCard({ id, title, content, author, date, priority = "normal", acknowledged, acknowledgedCount, totalCount, requireAcknowledge, onAction }: Props) {
  const [acked, setAcked] = useState(acknowledged || false);
  const [acking, setAcking] = useState(false);

  const priorityConfig = {
    normal: { bg: "bg-blue-50", border: "border-blue-100", badge: "badge-blue", iconBg: "bg-blue-100 text-blue-600", ring: "ring-blue-200" },
    important: { bg: "bg-amber-50", border: "border-amber-100", badge: "badge-gold", iconBg: "bg-amber-100 text-amber-600", ring: "ring-amber-200" },
    urgent: { bg: "bg-red-50", border: "border-red-100", badge: "badge-red", iconBg: "bg-red-100 text-red-600", ring: "ring-red-200" },
  };
  const p = priorityConfig[priority];

  const handleAcknowledge = async () => {
    setAcking(true);
    // Send via data channel to agent
    if (onAction) {
      onAction("acknowledge_announcement", { announcement_id: id });
    }
    // Also call API directly as fallback
    try {
      const emp = JSON.parse(localStorage.getItem("taliq_employee") || "{}");
      if (emp.id && id) {
        await fetch(`/api/admin?action=acknowledge_announcement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ announcement_id: id, employee_id: emp.id }),
        });
      }
    } catch { /* fallback */ }
    setAcked(true);
    setAcking(false);
  };

  return (
    <div className={`card overflow-hidden ${requireAcknowledge && !acked ? `ring-2 ${p.ring} animate-[pulse_2s_ease-in-out_3]` : ""}`}>
      <div className={`px-5 py-3 ${p.bg} border-b ${p.border} flex items-center justify-between`}>
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${p.iconBg} flex items-center justify-center`}>
            {priority === "urgent" ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
            )}
          </div>
          Announcement
        </h3>
        <div className="flex items-center gap-2">
          {acked && <span className="badge badge-emerald">Acknowledged</span>}
          <span className={`badge ${p.badge}`}>{priority}</span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h4 className="text-base font-bold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{content}</p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {author && <span className="text-xs text-gray-400">By {author}</span>}
            {date && <span className="text-xs text-gray-400">{date}</span>}
          </div>
        </div>

        {/* Acknowledgment button */}
        {requireAcknowledge && !acked && (
          <button onClick={handleAcknowledge} disabled={acking}
            className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 shadow-sm shadow-emerald-200 transition-all flex items-center justify-center gap-2">
            {acking ? (
              <span>Acknowledging...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                I Acknowledge
              </>
            )}
          </button>
        )}

        {/* Acknowledgment progress bar */}
        {acknowledgedCount !== undefined && totalCount !== undefined && totalCount > 0 && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-400">Acknowledgment Rate</span>
              <span className="text-[10px] text-emerald-600 font-medium">{acknowledgedCount}/{totalCount} ({Math.round((acknowledgedCount / totalCount) * 100)}%)</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${(acknowledgedCount / totalCount) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
