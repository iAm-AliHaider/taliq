"use client";

interface TeamMember {
  id: string;
  name: string;
  department: string;
  status: string;
  check_in: string | null;
}

interface AttendanceDashboardProps {
  managerName: string;
  date: string;
  team: TeamMember[];
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  present: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Present" },
  late: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Late" },
  on_leave: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "On Leave" },
  remote: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400", label: "Remote" },
  absent: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400", label: "Absent" },
};

export function AttendanceDashboard({ managerName, date, team }: AttendanceDashboardProps) {
  const present = team.filter(t => t.status === "present" || t.status === "remote").length;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Team Attendance</h3>
        <span className="text-[10px] text-zinc-500">{date}</span>
      </div>
      <p className="text-xs text-zinc-500 mb-4">{managerName}&apos;s team · {present}/{team.length} present</p>

      {/* Summary Bar */}
      <div className="flex h-2 rounded-full overflow-hidden mb-4 gap-0.5">
        {team.map((m, i) => {
          const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.absent;
          return <div key={i} className={`flex-1 ${cfg.dot} rounded-full`} />;
        })}
      </div>

      {/* Team List */}
      <div className="space-y-2">
        {team.map((member) => {
          const cfg = STATUS_CONFIG[member.status] || STATUS_CONFIG.absent;
          return (
            <div key={member.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${cfg.bg} border border-white/5`}>
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">{member.name}</p>
                <p className="text-[10px] text-zinc-500">{member.department}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-medium ${cfg.text}`}>{cfg.label}</span>
                {member.check_in && (
                  <p className="text-[9px] text-zinc-600">{member.check_in}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
