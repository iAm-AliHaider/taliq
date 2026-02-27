"use client";

interface AttendanceRecord {
  date: string;
  clock_in?: string;
  clock_out?: string;
  status: string;
  hours_worked?: number;
  overtime_hours?: number;
  location?: string;
}

interface MyAttendanceCardProps {
  employeeName?: string;
  records?: AttendanceRecord[];
  today?: AttendanceRecord | null;
  days?: number;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const STATUS_DOT: Record<string, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  remote: "bg-blue-500",
  absent: "bg-red-500",
  on_leave: "bg-gray-400",
};

const STATUS_LABEL: Record<string, string> = {
  present: "Present",
  late: "Late",
  remote: "Remote",
  absent: "Absent",
  on_leave: "On Leave",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function MyAttendanceCard({ employeeName, records = [], today, days = 7, onAction }: MyAttendanceCardProps) {
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "present" || r.status === "remote").length;
  const lateDays = records.filter((r) => r.status === "late").length;
  const totalHours = records.reduce((sum, r) => sum + (r.hours_worked || 0), 0);
  const totalOvertime = records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">My Attendance</h3>
            <p className="text-xs text-gray-500">{employeeName} - Last {days} days</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600">
            {presentDays}/{totalDays} present
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{presentDays}</p>
          <p className="text-[10px] text-gray-400">Present</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{lateDays}</p>
          <p className="text-[10px] text-gray-400">Late</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
          <p className="text-[10px] text-gray-400">Hours</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-lg font-bold text-blue-600">{totalOvertime.toFixed(1)}h</p>
          <p className="text-[10px] text-gray-400">Overtime</p>
        </div>
      </div>

      {/* Today's status */}
      {today && (
        <div className="px-5 py-3 bg-blue-50/50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[today.status] || "bg-gray-400"} animate-pulse`} />
              <span className="text-xs font-medium text-gray-700">Today</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>In: {today.clock_in || "--:--"}</span>
              <span>Out: {today.clock_out || "--:--"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Records list */}
      <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {records.map((r, i) => (
          <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[r.status] || "bg-gray-400"}`} />
              <div>
                <p className="text-sm font-medium text-gray-800">{formatDate(r.date)}</p>
                <p className="text-[10px] text-gray-400">
                  {r.clock_in || "--:--"} - {r.clock_out || "--:--"}
                  {r.hours_worked ? ` (${r.hours_worked.toFixed(1)}h)` : ""}
                </p>
              </div>
            </div>
            <span className={`text-[10px] font-medium ${
              r.status === "present" ? "text-emerald-600" :
              r.status === "late" ? "text-amber-600" :
              r.status === "remote" ? "text-blue-600" :
              "text-gray-400"
            }`}>
              {STATUS_LABEL[r.status] || r.status}
            </span>
          </div>
        ))}
        {records.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No attendance records found</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!today?.clock_in && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => onAction?.("clock_in", { location: "office" })}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600 transition-colors"
          >
            Clock In Now
          </button>
        </div>
      )}
    </div>
  );
}
