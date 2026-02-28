"use client";

import { useState } from "react";

interface AuditEntry {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
}

interface Props {
  entries: AuditEntry[];
  total: number;
  onAction?: (action: string, data?: any) => void;
}

const ACTION_COLORS: Record<string, string> = {
  approve: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reject: "bg-red-50 text-red-700 border-red-200",
  create: "bg-blue-50 text-blue-700 border-blue-200",
  update: "bg-amber-50 text-amber-700 border-amber-200",
  clock: "bg-purple-50 text-purple-700 border-purple-200",
  initiate: "bg-orange-50 text-orange-700 border-orange-200",
  bulk: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delete: "bg-red-50 text-red-700 border-red-200",
};

function getActionColor(action: string): string {
  for (const [key, val] of Object.entries(ACTION_COLORS)) {
    if (action.toLowerCase().includes(key)) return val;
  }
  return "bg-gray-50 text-gray-700 border-gray-200";
}

const ICONS: Record<string, string> = {
  leave: "🏖",
  expense: "💳",
  policy: "⚙",
  attendance: "⏰",
  exit: "🚪",
  loan: "💰",
  employee: "👤",
  notification: "🔔",
};

export function AuditLogCard({ entries, total }: Props) {
  const [filter, setFilter] = useState("");
  const filtered = filter
    ? entries.filter(
        (e) =>
          e.action.includes(filter) ||
          e.entityType?.includes(filter) ||
          e.actor?.includes(filter)
      )
    : entries;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Audit Trail</h3>
          <p className="text-xs text-gray-500 mt-0.5">{total} entries</p>
        </div>
        <input
          type="text"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs w-40 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
      </div>
      <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
        {filtered.map((e) => (
          <div key={e.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{ICONS[e.entityType] || "📋"}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getActionColor(
                  e.action
                )}`}
              >
                {e.action.replace(/_/g, " ").toUpperCase()}
              </span>
              <span className="text-[10px] text-gray-400 ml-auto">
                {e.timestamp?.slice(0, 16)?.replace("T", " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span>
                By: <span className="font-medium text-gray-800">{e.actor}</span>
              </span>
              {e.entityType && (
                <span>
                  {e.entityType}: <span className="font-mono text-gray-800">{e.entityId}</span>
                </span>
              )}
            </div>
            {e.details && Object.keys(e.details).length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {Object.entries(e.details).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-500"
                  >
                    {k}: {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No entries match filter</div>
        )}
      </div>
    </div>
  );
}
