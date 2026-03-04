"use client";

interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
  status: string;
}

interface TeamOverviewCardProps {
  managerName?: string;
  team?: TeamMember[];
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
  present: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Present" },
  remote: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Remote" },
  on_leave: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "On Leave" },
  absent: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Absent" },
  late: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Late" },
  unknown: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", label: "Unknown" },
};

const AVATAR_COLORS = [
  "from-emerald-400 to-emerald-500",
  "from-blue-400 to-blue-500",
  "from-violet-400 to-violet-500",
  "from-amber-400 to-amber-500",
  "from-rose-400 to-rose-500",
  "from-cyan-400 to-cyan-500",
];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function TeamOverviewCard({ managerName, team = [], onAction }: TeamOverviewCardProps) {
  const present = team.filter((m) => m.status === "present" || m.status === "remote").length;
  const onLeave = team.filter((m) => m.status === "on_leave").length;
  const absent = team.filter((m) => m.status === "absent").length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Team Overview</h3>
            <p className="text-xs text-gray-500">{managerName ? `${managerName}'s team` : "Your team"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold text-emerald-600">
              {present}/{team.length} active
            </span>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-gray-600">{present} Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[11px] text-gray-600">{onLeave} Leave</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-[11px] text-gray-600">{absent} Absent</span>
        </div>
      </div>

      {/* Team grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {(team || []).map((member, idx) => {
            const status = STATUS_CONFIG[member.status] || STATUS_CONFIG.unknown;
            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];

            return (
              <button
                key={member.id}
                onClick={() => onAction?.("view_employee", { employeeId: member.id })}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-center"
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-sm`}>
                  <span className="text-white text-sm font-bold">{getInitials(member.name)}</span>
                </div>

                {/* Info */}
                <div className="min-w-0 w-full">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{member.position}</p>
                </div>

                {/* Status badge */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${status.bg} ${status.text} ${status.border}`}>
                  {status.label}
                </span>
              </button>
            );
          })}
        </div>

        {team.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">No team members found</p>
          </div>
        )}
      </div>
    </div>
  );
}
