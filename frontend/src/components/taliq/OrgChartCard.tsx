"use client";

interface Employee { id: string; name: string; position: string; department: string; managerId: string | null; grade: string; }

const DEPT_COLORS: Record<string, string> = {
  "Executive": "from-purple-400 to-purple-500",
  "Human Resources": "from-pink-400 to-pink-500",
  "Information Technology": "from-blue-400 to-blue-500",
  "Finance": "from-emerald-400 to-emerald-500",
};

export function OrgChartCard({ employees }: { employees: Employee[] }) {
  const top = employees.filter(e => !e.managerId);
  const getReports = (id: string) => employees.filter(e => e.managerId === id);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <h3 className="text-sm font-bold text-gray-900">Organization Chart</h3>
        <p className="text-[10px] text-gray-400">{employees.length} employees</p>
      </div>
      <div className="p-5 overflow-x-auto">
        <div className="flex flex-col items-center gap-4 min-w-[300px]">
          {top.map(t => (
            <div key={t.id} className="w-full">
              <PersonNode emp={t} />
              <div className="ml-8 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                {getReports(t.id).map(r => (
                  <div key={r.id}>
                    <PersonNode emp={r} small />
                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-100 pl-3">
                      {getReports(r.id).map(rr => <PersonNode key={rr.id} emp={rr} small />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonNode({ emp, small }: { emp: Employee; small?: boolean }) {
  const bg = DEPT_COLORS[emp.department] || "from-gray-400 to-gray-500";
  return (
    <div className={`flex items-center gap-2 ${small ? "" : "bg-gray-50 rounded-xl p-3"}`}>
      <div className={`${small ? "w-7 h-7" : "w-10 h-10"} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center flex-shrink-0`}>
        <span className={`text-white font-bold ${small ? "text-[9px]" : "text-xs"}`}>{emp.name.split(" ").map(n => n[0]).join("")}</span>
      </div>
      <div>
        <p className={`font-medium text-gray-900 ${small ? "text-xs" : "text-sm"}`}>{emp.name}</p>
        <p className={`text-gray-400 ${small ? "text-[9px]" : "text-[10px]"}`}>{emp.position}</p>
      </div>
    </div>
  );
}
