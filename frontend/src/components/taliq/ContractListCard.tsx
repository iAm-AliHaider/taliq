"use client";

interface Contract { employeeName: string; department: string; contractType: string; endDate: string; employeeId: string; }

export function ContractListCard({ title, contracts }: { title: string; contracts: Contract[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700">{contracts.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(contracts || []).map((c, i) => {
          const days = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000);
          return (
            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.employeeName}</p>
                <p className="text-[10px] text-gray-400">{c.employeeId} - {c.department}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">{c.endDate}</p>
                <span className={`text-[10px] font-medium ${days <= 30 ? "text-red-600" : days <= 60 ? "text-amber-600" : "text-gray-500"}`}>
                  {days > 0 ? `${days}d left` : "Expired"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
