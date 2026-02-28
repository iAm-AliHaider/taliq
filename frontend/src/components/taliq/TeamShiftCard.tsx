"use client";

interface Member { id: string; name: string; department: string; shiftName: string; startTime: string; endTime: string; isNightShift: boolean; }

export function TeamShiftCard({ members }: { members: Member[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Team Shift Schedule</h3>
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">{members.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {members.map(m => (
          <div key={m.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-[10px] font-bold text-amber-700">{m.name.split(" ").map(n => n[0]).join("")}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                <p className="text-[10px] text-gray-400">{m.id}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900">{m.shiftName || "Unassigned"}</p>
              {m.startTime && <p className="text-[10px] text-gray-400">{m.startTime} - {m.endTime}</p>}
              {m.isNightShift && <span className="text-[10px] text-indigo-600 font-medium">Night</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
