"use client";
import React from "react";

interface Props {
  departments: { department: string; count: number; percentage: number }[];
  total: number;
}

const deptColors = [
  "bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-amber-500",
  "bg-pink-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500",
];

export default function HeadcountCard({ departments, total }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-cyan-50 to-sky-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Headcount Report</h3>
        <p className="text-2xl font-bold text-emerald-600 mt-1">{total} <span className="text-sm font-normal text-gray-500">employees</span></p>
      </div>
      <div className="p-4">
        {/* Stacked bar */}
        <div className="h-6 rounded-full overflow-hidden flex mb-4">
          {(departments || []).map((d, i) => (
            <div key={d.department} className={`${deptColors[i % deptColors.length]} transition-all`}
              style={{ width: `${d.percentage}%` }}
              title={`${d.department}: ${d.count}`} />
          ))}
        </div>
        {/* Legend */}
        <div className="space-y-2">
          {(departments || []).map((d, i) => (
            <div key={d.department} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${deptColors[i % deptColors.length]}`} />
                <span className="text-sm text-gray-700">{d.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{d.count}</span>
                <span className="text-xs text-gray-400">{d.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
