"use client";

interface Step {
  step: number;
  role: string;
  label: string;
  action_required: string;
  status: string;
  approver?: string;
  comment?: string;
  timestamp?: string;
}

interface Props {
  ref?: string;
  entityType: string;
  entityRef: string;
  overallStatus: string;
  requesterId?: string;
  chain: Step[];
}

const STATUS_STYLES: Record<string, { bg: string; ring: string; icon: string }> = {
  approve: { bg: "bg-emerald-500", ring: "ring-emerald-200", icon: "M5 13l4 4L19 7" },
  reject: { bg: "bg-red-500", ring: "ring-red-200", icon: "M6 18L18 6M6 6l12 12" },
  awaiting: { bg: "bg-amber-500", ring: "ring-amber-200", icon: "M12 6v6h4.5" },
  upcoming: { bg: "bg-gray-300", ring: "ring-gray-100", icon: "M12 6v6h4.5" },
  pending: { bg: "bg-gray-300", ring: "ring-gray-100", icon: "M12 6v6h4.5" },
};

const OVERALL_COLORS: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export function ApprovalChainCard(props: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Approval Chain</h3>
              <p className="text-[10px] text-gray-400">{props.entityType?.replace("_", " ")} &middot; {props.entityRef}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border ${OVERALL_COLORS[props.overallStatus] || OVERALL_COLORS.pending}`}>
            {props.overallStatus}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="relative">
          {props.chain?.map((step, i) => {
            const style = STATUS_STYLES[step.status] || STATUS_STYLES.pending;
            const isLast = i === props.chain.length - 1;
            return (
              <div key={step.step} className="flex gap-4 mb-0">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full ${style.bg} ring-4 ${style.ring} flex items-center justify-center z-10`}>
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={style.icon} />
                    </svg>
                  </div>
                  {!isLast && <div className="w-0.5 h-10 bg-gray-200" />}
                </div>
                {/* Content */}
                <div className="pb-6 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-semibold ${step.status === "awaiting" ? "text-amber-700" : "text-gray-900"}`}>
                      Step {step.step}: {step.label}
                    </h4>
                    <span className="text-[9px] text-gray-400 capitalize">{step.status}</span>
                  </div>
                  {step.approver && <p className="text-[10px] text-gray-500 mt-0.5">By: {step.approver}</p>}
                  {step.comment && <p className="text-[10px] text-gray-400 italic mt-0.5">&quot;{step.comment}&quot;</p>}
                  {step.timestamp && <p className="text-[9px] text-gray-300 mt-0.5">{step.timestamp.slice(0, 16)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
