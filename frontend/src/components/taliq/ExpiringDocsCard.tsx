"use client";

interface Doc { employeeName: string; department: string; type: string; number: string; expiryDate: string; status: string; employeeId: string; }

export function ExpiringDocsCard({ documents }: { documents: Doc[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-red-50 to-orange-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Expiring Documents (90 Days)</h3>
        <span className="px-2 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700">{documents.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {documents.map((d, i) => {
          const days = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
          return (
            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
              <div>
                <p className="text-sm font-medium text-gray-900">{d.employeeName}</p>
                <p className="text-[10px] text-gray-400">{d.employeeId} - {d.department}</p>
                <p className="text-[10px] text-gray-500 capitalize">{d.type.replace("_", " ")} ({d.number})</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">{d.expiryDate}</p>
                <span className={`text-[10px] font-medium ${days <= 30 ? "text-red-600" : "text-amber-600"}`}>
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
