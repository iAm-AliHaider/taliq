"use client";

interface Approval {
  ref: string;
  entityType: string;
  entityRef: string;
  requesterId: string;
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
  workflowName: string;
  created: string;
}

const TYPE_ICONS: Record<string, string> = {
  leave_request: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  expense: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 014.5 15h.75",
  loan: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33",
  exit_request: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
};

export function PendingApprovalsCard({ approvals }: { approvals: Approval[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Pending Your Approval</h3>
            <p className="text-[10px] text-gray-400">{approvals.length} request{approvals.length !== 1 ? "s" : ""} awaiting action</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {approvals.map(a => (
          <div key={a.ref} className="px-5 py-3 hover:bg-amber-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={TYPE_ICONS[a.entityType] || TYPE_ICONS.leave_request} />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">{a.entityType?.replace("_", " ")}</h4>
                  <p className="text-[10px] text-gray-400">{a.entityRef} &middot; by {a.requesterId}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-amber-600 font-semibold">{a.currentLabel}</span>
                <p className="text-[9px] text-gray-400">Step {a.currentStep}/{a.totalSteps}</p>
                <p className="text-[10px] text-gray-400 font-mono">{a.ref}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
