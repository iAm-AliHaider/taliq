"use client";

interface TeamMember {
  name: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
}

interface Props {
  managerName: string;
  date: string;
  team: TeamMember[];
}

export function AttendanceDashboard({ managerName, date, team }: Props) {
  const present = team.filter(m => m.status === "present" || m.status === "remote").length;
  const absent = team.filter(m => m.status === "absent").length;
  const late = team.filter(m => m.status === "late").length;
  const onLeave = team.filter(m => m.status === "on_leave").length;

  const statusConfig: Record<string, { color: string; label: string; dot: string }> = {
    present: { color: "badge-emerald", label: "Present", dot: "bg-emerald-500" },
    remote: { color: "badge-blue", label: "Remote", dot: "bg-blue-500" },
    late: { color: "badge-gold", label: "Late", dot: "bg-amber-500" },
    absent: { color: "badge-red", label: "Absent", dot: "bg-red-500" },
    on_leave: { color: "badge-gray", label: "On Leave", dot: "bg-gray-400" },
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Team Attendance</h3>
          <p className="text-xs text-gray-400">{managerName} - {date}</p>
        </div>
        <span className="badge badge-blue">{present}/{team.length}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
        {[
          { label: "Present", value: present, color: "text-emerald-600" },
          { label: "Late", value: late, color: "text-amber-600" },
          { label: "Absent", value: absent, color: "text-red-600" },
          { label: "Leave", value: onLeave, color: "text-gray-500" },
        ].map(s => (
          <div key={s.label} className="bg-white p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {(team || []).map((m, i) => {
          const sc = statusConfig[m.status] || statusConfig.absent;
          return (
            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${sc.dot}`} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  {m.checkIn && <p className="text-[10px] text-gray-400">{m.checkIn}{m.checkOut ? ` - ${m.checkOut}` : ""}</p>}
                </div>
              </div>
              <span className={`badge ${sc.color}`}>{sc.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
