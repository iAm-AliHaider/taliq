"use client";

interface Exit { ref: string; employeeName: string; department: string; exitType: string; lastWorkingDay: string; status: string; clearanceProgress: string; }

export function ExitListCard({ exits }: { exits: Exit[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-red-50 to-pink-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Exit Requests</h3>
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700">{exits.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(exits || []).map(e => (
          <div key={e.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
            <div>
              <p className="text-sm font-medium text-gray-900">{e.employeeName}</p>
              <p className="text-[10px] text-gray-400">{e.ref} - {e.department}</p>
              <p className="text-[10px] text-gray-400 capitalize">{e.exitType} - Last day: {e.lastWorkingDay}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${e.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : e.status === "cleared" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{e.status}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">Clearance: {e.clearanceProgress}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
