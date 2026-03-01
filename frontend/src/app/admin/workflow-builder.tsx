"use client";

import { useState } from "react";

interface WorkflowStep {
  role: string;
  label: string;
  action: string;
  condition: string;
}

const ROLES = [
  { value: "direct_manager", label: "Direct Manager" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "finance", label: "Finance Department" },
  { value: "cfo", label: "CFO / Finance Head" },
  { value: "it_admin", label: "IT Admin" },
  { value: "ceo", label: "CEO / General Manager" },
  { value: "department_head", label: "Department Head" },
  { value: "legal", label: "Legal / Compliance" },
  { value: "procurement", label: "Procurement" },
  { value: "custom", label: "Custom Role" },
];

const ENTITY_TYPES = [
  { value: "leave_request", label: "Leave Request" },
  { value: "expense", label: "Expense" },
  { value: "loan", label: "Loan" },
  { value: "exit_request", label: "Exit / Offboarding" },
  { value: "travel_request", label: "Travel Request" },
  { value: "document_request", label: "Document Request" },
  { value: "overtime", label: "Overtime" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "custom", label: "Custom" },
];

interface Props {
  onSave: (workflow: { name: string; entity_type: string; description: string; steps: WorkflowStep[] }) => void;
  onCancel: () => void;
  initial?: { name: string; entity_type: string; description: string; steps: WorkflowStep[] };
}

export default function WorkflowBuilder({ onSave, onCancel, initial }: Props) {
  const [name, setName] = useState(initial?.name || "");
  const [entityType, setEntityType] = useState(initial?.entity_type || "leave_request");
  const [description, setDescription] = useState(initial?.description || "");
  const [steps, setSteps] = useState<WorkflowStep[]>(
    initial?.steps || [{ role: "direct_manager", label: "Direct Manager", action: "approve", condition: "" }]
  );

  const addStep = () => {
    setSteps([...steps, { role: "hr_manager", label: "HR Manager", action: "approve", condition: "" }]);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, field: keyof WorkflowStep, value: string) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], [field]: value };
    // Auto-set label from role
    if (field === "role") {
      const roleObj = ROLES.find(r => r.value === value);
      if (roleObj && roleObj.value !== "custom") {
        updated[idx].label = roleObj.label;
      }
    }
    setSteps(updated);
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= steps.length) return;
    const updated = [...steps];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setSteps(updated);
  };

  const handleSave = () => {
    if (!name.trim() || steps.length === 0) return;
    const wfName = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    onSave({ name: wfName, entity_type: entityType, description: description || name, steps });
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
        <h3 className="text-sm font-bold text-gray-900">
          {initial ? "Edit Workflow" : "Create New Approval Workflow"}
        </h3>
        <p className="text-[10px] text-gray-500 mt-0.5">Define who needs to approve what, in what order.</p>
      </div>
      <div className="p-6 space-y-5">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Workflow Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Travel Request Approval" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Applies To *</label>
            <select value={entityType} onChange={e => setEntityType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200">
              {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        </div>

        {/* Steps Builder */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Approval Steps ({steps.length})</label>
            <button onClick={addStep} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-semibold hover:bg-indigo-100 transition-colors border border-indigo-200">
              + Add Step
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 group hover:border-indigo-200 transition-colors">
                {/* Step Number */}
                <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>

                {/* Role */}
                <select value={step.role} onChange={e => updateStep(i, "role", e.target.value)} className="px-2 py-1.5 rounded-lg border border-gray-200 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-200 w-36">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                {/* Label */}
                <input value={step.label} onChange={e => updateStep(i, "label", e.target.value)} placeholder="Display label" className="px-2 py-1.5 rounded-lg border border-gray-200 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-200 flex-1" />

                {/* Action */}
                <select value={step.action} onChange={e => updateStep(i, "action", e.target.value)} className="px-2 py-1.5 rounded-lg border border-gray-200 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-200 w-24">
                  <option value="approve">Approve</option>
                  <option value="review">Review</option>
                  <option value="clearance">Clearance</option>
                  <option value="sign">Sign Off</option>
                </select>

                {/* Condition */}
                <input value={step.condition} onChange={e => updateStep(i, "condition", e.target.value)} placeholder="Condition (optional)" className="px-2 py-1.5 rounded-lg border border-gray-200 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-200 w-40" />

                {/* Move & Delete */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-30">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-30">
                    <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => removeStep(i)} disabled={steps.length <= 1} className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 disabled:opacity-30">
                    <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-2">Preview</label>
          <div className="flex items-center gap-1 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 overflow-x-auto">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center shrink-0">
                <div className="px-3 py-2 rounded-xl bg-white border border-indigo-200 shadow-sm">
                  <p className="text-[10px] font-bold text-indigo-700">Step {i + 1}</p>
                  <p className="text-[10px] text-gray-800">{s.label}</p>
                  <p className="text-[9px] text-gray-400">{s.action}</p>
                  {s.condition && <p className="text-[8px] text-amber-600 mt-0.5">if {s.condition}</p>}
                </div>
                {i < steps.length - 1 && (
                  <svg className="w-5 h-5 text-indigo-300 mx-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || steps.length === 0} className="px-6 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 disabled:opacity-50 shadow-sm shadow-indigo-200 transition-colors">
            {initial ? "Update Workflow" : "Create Workflow"}
          </button>
        </div>
      </div>
    </div>
  );
}
