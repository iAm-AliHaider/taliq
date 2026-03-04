"use client";

interface WorkflowStep {
  step: number;
  role: string;
  label: string;
  action: string;
  condition: string;
}

interface Workflow {
  name: string;
  entityType: string;
  description: string;
  steps: WorkflowStep[];
}

export function WorkflowListCard({ workflows }: { workflows: Workflow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Approval Workflows</h3>
            <p className="text-[10px] text-gray-400">{workflows.length} configured workflow{workflows.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {(workflows || []).map(w => (
          <div key={w.name} className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-900">{w.description || w.name}</h4>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-semibold border border-indigo-200">
                {w.entityType?.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {(w.steps || []).map((s, i) => (
                <div key={i} className="flex items-center">
                  <div className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-[9px] font-semibold text-gray-700">{s.label}</p>
                    {s.condition && <p className="text-[8px] text-gray-400">if {s.condition}</p>}
                  </div>
                  {i < w.steps.length - 1 && (
                    <svg className="w-3 h-3 text-gray-300 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
