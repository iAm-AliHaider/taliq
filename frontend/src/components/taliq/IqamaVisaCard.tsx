"use client";

interface Doc { id: number; type: string; number: string; issueDate: string; expiryDate: string; status: string; cost: number; }

const TYPE_LABELS: Record<string, string> = {
  iqama: "Iqama (Residency Permit)", passport: "Passport", work_visa: "Work Visa",
  medical_insurance: "Medical Insurance", exit_reentry: "Exit/Re-entry Visa",
};

export function IqamaVisaCard({ documents }: { documents: Doc[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Iqama &amp; Visa Documents</h3>
        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">{documents.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {documents.map(d => {
          const daysLeft = Math.ceil((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
          const isExpiring = daysLeft <= 90 && daysLeft > 0;
          const isExpired = daysLeft <= 0;
          return (
            <div key={d.id} className="px-5 py-3 hover:bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[d.type] || d.type}</p>
                  <p className="text-[10px] text-gray-400">No: {d.number}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${isExpired ? "bg-red-50 text-red-700 border-red-200" : isExpiring ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {isExpired ? "Expired" : isExpiring ? `${daysLeft}d left` : "Valid"}
                </span>
              </div>
              <div className="flex gap-4 mt-1.5">
                <span className="text-[10px] text-gray-400">Issued: {d.issueDate}</span>
                <span className={`text-[10px] font-medium ${isExpired ? "text-red-500" : isExpiring ? "text-amber-500" : "text-gray-400"}`}>Expires: {d.expiryDate}</span>
                {d.cost > 0 && <span className="text-[10px] text-gray-400">Cost: {d.cost} SAR</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
