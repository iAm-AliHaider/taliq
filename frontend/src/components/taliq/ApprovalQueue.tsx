"use client";

import { useState } from "react";

interface ApprovalItem {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
}

interface Props {
  items: ApprovalItem[];
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function ApprovalQueue({ items: initialItems, onAction }: Props) {
  const [items, setItems] = useState(initialItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleDecision = (item: ApprovalItem, decision: "approved" | "rejected") => {
    setProcessingId(item.id);
    onAction?.("approve_leave", { request_id: item.id, decision });
    
    // Optimistic update
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: decision } : i));
      setProcessingId(null);
    }, 600);
  };

  const pending = items.filter(i => i.status === "pending");
  const processed = items.filter(i => i.status !== "pending");

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Pending Approvals</h3>
        <span className="badge badge-gold">{pending.length} pending</span>
      </div>

      <div className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <span className="text-2xl mb-2 block">✅</span>
            <p className="text-sm text-gray-400">All caught up!</p>
          </div>
        ) : items.map((item) => {
          const isExpanded = expandedId === item.id;
          const isProcessing = processingId === item.id;
          
          return (
            <div
              key={item.id}
              className={`transition-all duration-300 ${
                item.status === "approved" ? "bg-emerald-50/50" :
                item.status === "rejected" ? "bg-red-50/30" : ""
              }`}
            >
              {/* Main row — clickable to expand */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{item.employeeName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.type} • {item.days} days
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      item.status === "pending" ? "badge-gold" :
                      item.status === "approved" ? "badge-emerald" : "badge-red"
                    }`}>
                      {isProcessing ? "..." : item.status}
                    </span>
                    <svg className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-slide-up">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">From</p>
                        <p className="text-xs font-medium text-gray-700">{item.startDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">To</p>
                        <p className="text-xs font-medium text-gray-700">{item.endDate}</p>
                      </div>
                    </div>
                    {item.reason && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">Reason</p>
                        <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                      </div>
                    )}
                  </div>

                  {item.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDecision(item, "approved"); }}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDecision(item, "rejected"); }}
                        disabled={isProcessing}
                        className="flex-1 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Processed summary */}
      {processed.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-3">
          {processed.filter(p => p.status === "approved").length > 0 && (
            <span className="text-[10px] text-emerald-600">✓ {processed.filter(p => p.status === "approved").length} approved</span>
          )}
          {processed.filter(p => p.status === "rejected").length > 0 && (
            <span className="text-[10px] text-red-500">✕ {processed.filter(p => p.status === "rejected").length} rejected</span>
          )}
        </div>
      )}
    </div>
  );
}
