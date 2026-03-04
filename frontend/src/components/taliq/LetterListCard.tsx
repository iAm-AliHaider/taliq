"use client";

interface Letter {
  ref: string;
  type: string;
  purpose: string;
  addressedTo: string;
  status: string;
  date: string;
}

const TYPE_LABELS: Record<string, string> = {
  employment_certificate: "Employment Certificate",
  salary_certificate: "Salary Certificate",
  experience_letter: "Experience Letter",
  noc_letter: "NOC",
  bank_letter: "Bank Letter",
  promotion_letter: "Promotion Letter",
};

export function LetterListCard({ letters }: { letters: Letter[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">My Letters</h3>
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">{letters.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(letters || []).map(l => (
          <div key={l.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
            <div>
              <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[l.type] || l.type}</p>
              <p className="text-[10px] text-gray-400">{l.ref} {l.purpose ? `- ${l.purpose}` : ""}</p>
              {l.addressedTo && <p className="text-[10px] text-gray-400">To: {l.addressedTo}</p>}
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${l.status === "issued" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{l.status}</span>
              <p className="text-[10px] text-gray-300 mt-1">{l.date?.split("T")[0]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
