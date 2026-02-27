"use client";
import React from "react";

interface Props {
  totalRequests: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

const typeColors: Record<string, string> = {
  annual: "bg-blue-500", sick: "bg-red-500", emergency: "bg-orange-500", study: "bg-purple-500",
};
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500", approved: "bg-emerald-500", rejected: "bg-red-500",
};

export default function LeaveAnalyticsCard({ totalRequests, byType, byStatus }: Props) {
  const maxType = Math.max(...Object.values(byType), 1);
  const maxStatus = Math.max(...Object.values(byStatus), 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-pink-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Leave Analytics</h3>
        <p className="text-xs text-gray-500">{totalRequests} total requests</p>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">By Type</p>
          <div className="space-y-2">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20 capitalize">{type}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${typeColors[type] || "bg-gray-500"}`}
                    style={{ width: `${(count / maxType) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">By Status</p>
          <div className="flex gap-3">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${statusColors[status] || "bg-gray-400"}`} />
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 capitalize">{status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
