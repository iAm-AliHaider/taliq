"use client";

interface Props {
  employeeName: string;
  employeeId: string;
  contractType: string;
  startDate: string;
  endDate?: string | null;
  probationEnd?: string | null;
  renewalDate?: string | null;
  salary: number;
  status: string;
}

export function ContractCard(props: Props) {
  const isFixed = props.contractType === "fixed";
  const daysLeft = props.endDate ? Math.ceil((new Date(props.endDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Employment Contract</h3>
              <p className="text-[10px] text-gray-400">{props.employeeName} ({props.employeeId})</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${props.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>{props.status}</span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isFixed ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            {isFixed ? "Fixed Term" : "Unlimited"}
          </span>
          {daysLeft !== null && daysLeft <= 90 && (
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
              {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400">Start Date</p>
            <p className="text-sm font-bold text-gray-900">{props.startDate}</p>
          </div>
          {props.endDate && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">End Date</p>
              <p className="text-sm font-bold text-gray-900">{props.endDate}</p>
            </div>
          )}
          {props.probationEnd && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400">Probation End</p>
              <p className="text-sm font-bold text-gray-900">{props.probationEnd}</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400">Contract Salary</p>
            <p className="text-sm font-bold text-emerald-600">{props.salary?.toLocaleString()} SAR</p>
          </div>
        </div>
      </div>
    </div>
  );
}
