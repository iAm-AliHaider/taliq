"use client";
import React from "react";

interface Employee {
  employeeId: string;
  name: string;
  position: string;
  rating: number | null;
  reviewPeriod: string | null;
  goalsTotal: number;
  goalsCompleted: number;
  trainingsEnrolled: number;
  trainingsCompleted: number;
  attendanceDays: number;
  attendancePresent: number;
}

const ratingColor = (r: number | null) => {
  if (!r) return "text-gray-400";
  if (r >= 4) return "text-emerald-600";
  if (r >= 3) return "text-yellow-600";
  return "text-red-600";
};

const stars = (r: number | null) => {
  if (!r) return "N/A";
  return "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));
};

export default function TeamPerformanceCard({ employees }: { employees: Employee[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
        <p className="text-xs text-gray-500 mt-0.5">{employees.length} direct reports</p>
      </div>

      <div className="divide-y divide-gray-50">
        {employees.map(emp => {
          const goalPct = emp.goalsTotal > 0 ? Math.round(emp.goalsCompleted / emp.goalsTotal * 100) : 0;
          const attPct = emp.attendanceDays > 0 ? Math.round(emp.attendancePresent / emp.attendanceDays * 100) : 0;

          return (
            <div key={emp.employeeId} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.position}</p>
                </div>
                <span className={`text-sm font-medium ${ratingColor(emp.rating)}`}>
                  {stars(emp.rating)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Goals</p>
                  <p className="text-sm font-semibold text-gray-900">{emp.goalsCompleted}/{emp.goalsTotal}</p>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                    <div className="h-1 bg-emerald-500 rounded-full" style={{ width: `${goalPct}%` }} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Training</p>
                  <p className="text-sm font-semibold text-gray-900">{emp.trainingsCompleted}/{emp.trainingsEnrolled}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-500">Attendance</p>
                  <p className="text-sm font-semibold text-gray-900">{attPct}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
