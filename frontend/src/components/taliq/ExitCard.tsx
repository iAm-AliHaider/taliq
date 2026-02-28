"use client";

interface Props {
  ref?: string;
  exitType: string;
  lastWorkingDay: string;
  clearance: Record<string, string>;
  settlement: { eos_amount: number; leave_encashment: number; pending_salary: number; total_settlement: number };
  status?: string;
}

const CLEARANCE_LABELS: Record<string, string> = {
  it_assets: "IT Assets Return", access_cards: "Access Cards", finance_clearance: "Finance Clearance",
  hr_documents: "HR Documents", knowledge_transfer: "Knowledge Transfer", manager_signoff: "Manager Sign-off",
};

export function ExitCard(props: Props) {
  const clearanceEntries = Object.entries(props.clearance || {});
  const cleared = clearanceEntries.filter(([, v]) => v === "cleared").length;
  const total = clearanceEntries.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Exit / Offboarding</h3>
              {props.ref && <p className="text-[10px] text-gray-400">{props.ref}</p>}
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border capitalize ${props.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : props.status === "cleared" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{props.status || "initiated"}</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400">Exit Type</p>
            <p className="text-sm font-bold text-gray-900 capitalize">{props.exitType}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400">Last Working Day</p>
            <p className="text-sm font-bold text-gray-900">{props.lastWorkingDay}</p>
          </div>
        </div>

        {/* Clearance */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Clearance Progress</p>
            <span className="text-xs font-bold text-gray-900">{cleared}/{total}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${total > 0 ? (cleared / total) * 100 : 0}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {clearanceEntries.map(([key, val]) => (
              <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${val === "cleared" ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${val === "cleared" ? "bg-emerald-500" : "bg-gray-300"}`}>
                  {val === "cleared" && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-[10px] text-gray-700">{CLEARANCE_LABELS[key] || key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Settlement */}
        {props.settlement && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Final Settlement</p>
            <div className="space-y-1.5">
              <div className="flex justify-between px-3 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">End of Service (EOS)</span>
                <span className="text-xs font-bold text-gray-900">{props.settlement.eos_amount?.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Leave Encashment</span>
                <span className="text-xs font-bold text-gray-900">{props.settlement.leave_encashment?.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-600">Pending Salary</span>
                <span className="text-xs font-bold text-gray-900">{props.settlement.pending_salary?.toLocaleString()} SAR</span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-sm font-semibold text-emerald-800">Total Settlement</span>
                <span className="text-sm font-bold text-emerald-700">{props.settlement.total_settlement?.toLocaleString()} SAR</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
