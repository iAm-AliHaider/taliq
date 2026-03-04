"use client";
import React from "react";

interface Employee {
  employeeId: string;
  name: string;
  position: string;
  totalEnrolled: number;
  completed: number;
  mandatoryTotal: number;
  mandatoryCompleted: number;
  compliance: number;
}

export default function TeamTrainingCard({ employees }: { employees: Employee[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Training Compliance</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {(employees || []).map(emp => (
          <div key={emp.employeeId} className="p-4 flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{emp.name}</p>
              <p className="text-xs text-gray-500">{emp.position}</p>
              <p className="text-xs text-gray-400 mt-1">
                {emp.completed}/{emp.totalEnrolled} courses | Mandatory: {emp.mandatoryCompleted}/{emp.mandatoryTotal}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 relative">
                <svg viewBox="0 0 36 36" className="w-12 h-12 transform -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={emp.compliance >= 100 ? "#10b981" : emp.compliance >= 50 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="3"
                    strokeDasharray={`${emp.compliance}, 100`} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  {emp.compliance}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
