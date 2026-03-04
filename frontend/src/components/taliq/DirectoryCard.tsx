"use client";

interface Employee { id: string; name: string; nameAr: string; position: string; department: string; email: string; phone: string; grade: string; }

export function DirectoryCard({ employees, query }: { employees: Employee[]; query?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Employee Directory</h3>
          {query && <p className="text-[10px] text-gray-400">Search: &quot;{query}&quot;</p>}
        </div>
        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{employees.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(employees || []).map(e => (
          <div key={e.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{e.name.split(" ").map(n => n[0]).join("")}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{e.name}</p>
              <p className="text-[10px] text-gray-500">{e.position} - {e.department}</p>
              <div className="flex gap-3 mt-0.5">
                {e.email && <p className="text-[10px] text-blue-500">{e.email}</p>}
                {e.phone && <p className="text-[10px] text-gray-400">{e.phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">{e.id}</p>
              {e.grade && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-600 border border-gray-200">{e.grade}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
