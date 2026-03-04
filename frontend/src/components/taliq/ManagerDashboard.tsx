"use client";

import { useState } from "react";

interface DepartmentStats {
  headcount: number;
  on_leave: number;
  pending_approvals: number;
  avg_attendance: number;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
  status: string;
}

interface ManagerDashboardProps {
  managerName?: string;
  department?: string;
  stats?: DepartmentStats;
  team?: TeamMember[];
  activeTab?: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function ManagerDashboard({ managerName, department, stats, team, activeTab = "overview", onAction }: ManagerDashboardProps) {
  const [tab, setTab] = useState(activeTab);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Manager Dashboard</h3>
            <p className="text-xs text-gray-500">{department}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Manager</p>
            <p className="text-sm font-medium text-gray-700">{managerName}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {["overview", "team", "approvals", "calendar"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              tab === t
                ? "text-emerald-600 border-b-2 border-emerald-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "overview" && stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Headcount"
              value={stats.headcount}
              icon="users"
              color="emerald"
              onClick={() => onAction?.("view_team", {})}
            />
            <StatCard
              label="On Leave Today"
              value={stats.on_leave}
              icon="calendar"
              color="amber"
            />
            <StatCard
              label="Pending Approvals"
              value={stats.pending_approvals}
              icon="clock"
              color="blue"
              onClick={() => onAction?.("view_approvals", {})}
            />
            <StatCard
              label="Attendance"
              value={`${stats.avg_attendance}%`}
              icon="check"
              color="emerald"
            />
          </div>
        )}

        {tab === "team" && team && (
          <div className="space-y-3">
            {(team || []).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                  {member.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 truncate">{member.position}</p>
                </div>
                <StatusBadge status={member.status} />
              </div>
            ))}
          </div>
        )}

        {tab === "approvals" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Pending approvals</p>
            <p className="text-xs text-gray-400 mt-1">Check voice for pending items</p>
          </div>
        )}

        {tab === "calendar" && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Leave calendar</p>
            <p className="text-xs text-gray-400 mt-1">Check voice for team schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick }: { label: string; value: number | string; icon: string; color: string; onClick?: () => void }) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`p-4 rounded-xl border border-gray-100 text-left transition-all ${onClick ? "hover:border-gray-200 hover:shadow-sm cursor-pointer" : ""}`}
    >
      <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
        {icon === "users" && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {icon === "calendar" && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {icon === "clock" && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {icon === "check" && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    present: "bg-emerald-50 text-emerald-700 border-emerald-200",
    remote: "bg-blue-50 text-blue-700 border-blue-200",
    on_leave: "bg-amber-50 text-amber-700 border-amber-200",
    absent: "bg-red-50 text-red-700 border-red-200",
    late: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const labels: Record<string, string> = {
    present: "Present",
    remote: "Remote",
    on_leave: "On Leave",
    absent: "Absent",
    late: "Late",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${statusClasses[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {labels[status] || status}
    </span>
  );
}
