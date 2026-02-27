"use client";

interface ClockInCardProps {
  employeeName?: string;
  date?: string;
  clockIn?: string;
  clockOut?: string;
  hoursWorked?: number;
  overtimeHours?: number;
  status?: string;
  location?: string;
  mode?: "clocked_in" | "clocked_out" | "not_clocked";
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const STATUS_MAP: Record<string, { bg: string; text: string; border: string; label: string }> = {
  present: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "On Time" },
  late: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Late" },
  remote: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Remote" },
  absent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Absent" },
};

export function ClockInCard({
  employeeName,
  date,
  clockIn,
  clockOut,
  hoursWorked,
  overtimeHours,
  status = "present",
  location = "office",
  mode = "not_clocked",
  onAction,
}: ClockInCardProps) {
  const statusConfig = STATUS_MAP[status] || STATUS_MAP.present;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 border-b ${mode === "clocked_out" ? "bg-emerald-50 border-emerald-100" : mode === "clocked_in" ? "bg-blue-50 border-blue-100" : "bg-gray-50 border-gray-100"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {mode === "clocked_out" ? "Day Complete" : mode === "clocked_in" ? "Clocked In" : "Attendance"}
            </h3>
            <p className="text-xs text-gray-500">{employeeName} - {date}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Time display */}
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Clock In</p>
            <p className={`text-2xl font-bold ${clockIn ? "text-gray-900" : "text-gray-300"}`}>
              {clockIn || "--:--"}
            </p>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Clock Out</p>
            <p className={`text-2xl font-bold ${clockOut ? "text-gray-900" : "text-gray-300"}`}>
              {clockOut || "--:--"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        {mode === "clocked_out" && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-lg font-bold text-gray-900">{hoursWorked?.toFixed(1) || "0"}h</p>
              <p className="text-[10px] text-gray-400">Worked</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-lg font-bold text-emerald-600">{overtimeHours?.toFixed(1) || "0"}h</p>
              <p className="text-[10px] text-gray-400">Overtime</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <p className="text-lg font-bold text-gray-900 capitalize">{location}</p>
              <p className="text-[10px] text-gray-400">Location</p>
            </div>
          </div>
        )}

        {/* Location badge for clocked in */}
        {mode === "clocked_in" && (
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-500 capitalize">{location}</span>
          </div>
        )}

        {/* Action buttons */}
        {mode === "not_clocked" && (
          <div className="flex gap-3">
            <button
              onClick={() => onAction?.("clock_in", { location: "office" })}
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600 transition-colors"
            >
              Clock In - Office
            </button>
            <button
              onClick={() => onAction?.("clock_in", { location: "remote" })}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-600 transition-colors"
            >
              Clock In - Remote
            </button>
          </div>
        )}

        {mode === "clocked_in" && (
          <button
            onClick={() => onAction?.("clock_out", {})}
            className="w-full py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            Clock Out
          </button>
        )}
      </div>
    </div>
  );
}
