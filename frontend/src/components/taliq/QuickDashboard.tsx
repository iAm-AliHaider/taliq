"use client";

interface QuickDashboardProps {
  employeeName?: string;
  employeeId?: string;
  position?: string;
  department?: string;
  isManager?: boolean;
  leaveBalance?: { annual: number; sick: number; emergency: number };
  activeLoans?: number;
  pendingRequests?: number;
  pendingApprovals?: number;
  todayAttendance?: { clockIn?: string; clockOut?: string; status?: string } | null;
  teamSize?: number;
  announcements?: number;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

function QuickAction({ label, sublabel, icon, color, onClick }: { label: string; sublabel: string; icon: React.ReactNode; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:shadow-sm active:scale-[0.98] ${color}`}>
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      <span className="text-[11px] font-semibold">{label}</span>
      <span className="text-[9px] opacity-70">{sublabel}</span>
    </button>
  );
}

export function QuickDashboard({
  employeeName,
  employeeId,
  position,
  department,
  isManager,
  leaveBalance,
  activeLoans = 0,
  pendingRequests = 0,
  pendingApprovals = 0,
  todayAttendance,
  teamSize = 0,
  announcements = 0,
  onAction,
}: QuickDashboardProps) {
  const firstName = employeeName?.split(" ")[0] || "User";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const isClockedIn = todayAttendance?.clockIn && !todayAttendance?.clockOut;

  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-5 bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium">{greeting}</p>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">{firstName}</h2>
              <p className="text-xs text-gray-500 mt-1">{position} - {department}</p>
              <p className="text-[10px] text-gray-400">{employeeId}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {isClockedIn ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  In since {todayAttendance?.clockIn}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-[10px] font-medium text-gray-500">
                  Not clocked in
                </span>
              )}
              {isManager && (
                <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-[10px] font-semibold text-violet-600">
                  Manager
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-px bg-gray-100 border-t border-gray-100">
          <button onClick={() => onAction?.("check_leave_balance", {})} className="bg-white p-3 text-center hover:bg-gray-50 transition-colors">
            <p className="text-lg font-bold text-emerald-600">{leaveBalance?.annual ?? "--"}</p>
            <p className="text-[9px] text-gray-400">Annual Leave</p>
          </button>
          <button onClick={() => onAction?.("show_loan_balance", {})} className="bg-white p-3 text-center hover:bg-gray-50 transition-colors">
            <p className="text-lg font-bold text-blue-600">{activeLoans}</p>
            <p className="text-[9px] text-gray-400">Active Loans</p>
          </button>
          <button onClick={() => onAction?.("show_my_documents", {})} className="bg-white p-3 text-center hover:bg-gray-50 transition-colors">
            <p className="text-lg font-bold text-amber-600">{pendingRequests}</p>
            <p className="text-[9px] text-gray-400">Requests</p>
          </button>
          {isManager ? (
            <button onClick={() => onAction?.("show_pending_approvals", {})} className="bg-white p-3 text-center hover:bg-gray-50 transition-colors">
              <p className="text-lg font-bold text-red-500">{pendingApprovals}</p>
              <p className="text-[9px] text-gray-400">Approvals</p>
            </button>
          ) : (
            <button onClick={() => onAction?.("show_announcements", {})} className="bg-white p-3 text-center hover:bg-gray-50 transition-colors">
              <p className="text-lg font-bold text-purple-600">{announcements}</p>
              <p className="text-[9px] text-gray-400">News</p>
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-2">
          {!isClockedIn ? (
            <QuickAction label="Clock In" sublabel="Start day" color="bg-emerald-50 border-emerald-100 text-emerald-700"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => onAction?.("clock_in", { location: "office" })} />
          ) : (
            <QuickAction label="Clock Out" sublabel="End day" color="bg-red-50 border-red-100 text-red-700"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => onAction?.("clock_out", {})} />
          )}
          <QuickAction label="Apply Leave" sublabel={`${leaveBalance?.annual ?? 0} days`} color="bg-blue-50 border-blue-100 text-blue-700"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            onClick={() => onAction?.("apply_leave_prompt", {})} />
          <QuickAction label="Pay Slip" sublabel="Feb 2026" color="bg-amber-50 border-amber-100 text-amber-700"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>}
            onClick={() => onAction?.("show_pay_slip", {})} />
          <QuickAction label="Documents" sublabel="Request" color="bg-orange-50 border-orange-100 text-orange-700"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            onClick={() => onAction?.("request_document", {})} />
          <QuickAction label="Attendance" sublabel="This week" color="bg-teal-50 border-teal-100 text-teal-700"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            onClick={() => onAction?.("show_my_attendance", {})} />
          <QuickAction label="Loans" sublabel="Check" color="bg-indigo-50 border-indigo-100 text-indigo-700"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            onClick={() => onAction?.("show_loan_balance", {})} />
        </div>
      </div>

      {/* Manager Actions */}
      {isManager && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-3">Manager Actions</p>
          <div className="grid grid-cols-3 gap-2">
            <QuickAction label="Team" sublabel={`${teamSize} members`} color="bg-violet-50 border-violet-100 text-violet-700"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              onClick={() => onAction?.("show_team_overview", {})} />
            <QuickAction label="Approvals" sublabel={`${pendingApprovals} pending`} color="bg-rose-50 border-rose-100 text-rose-700"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              onClick={() => onAction?.("show_pending_approvals", {})} />
            <QuickAction label="Interview" sublabel="Start new" color="bg-cyan-50 border-cyan-100 text-cyan-700"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
              onClick={() => onAction?.("start_interview", {})} />
          </div>
        </div>
      )}
    </div>
  );
}
