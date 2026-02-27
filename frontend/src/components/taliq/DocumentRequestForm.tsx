"use client";

import { useState } from "react";

interface Props {
  employeeName: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const DOC_TYPES = [
  { value: "Salary Certificate", desc: "Official salary verification", time: "2 business days" },
  { value: "Experience Certificate", desc: "Employment verification letter", time: "3 business days" },
  { value: "Employment Letter", desc: "General employment confirmation", time: "2 business days" },
  { value: "GOSI Certificate", desc: "Social insurance record", time: "5 business days" },
  { value: "Bank Letter", desc: "Salary transfer confirmation", time: "2 business days" },
];

export function DocumentRequestForm({ employeeName, onAction }: Props) {
  const [selectedType, setSelectedType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = selectedType.length > 0;
  const selected = DOC_TYPES.find(d => d.value === selectedType);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onAction?.("submit_document_request", { document_type: selectedType, purpose, urgent });
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Request Document</h3>
          <p className="text-xs text-gray-400">{employeeName}</p>
        </div>
        <span className="badge badge-blue">New Request</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Document types */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-2">Select Document</label>
          <div className="space-y-2">
            {DOC_TYPES.map(doc => (
              <button
                key={doc.value}
                onClick={() => setSelectedType(doc.value)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selectedType === doc.value
                    ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold ${selectedType === doc.value ? "text-indigo-700" : "text-gray-700"}`}>{doc.value}</p>
                  <p className="text-[10px] text-gray-400">{doc.desc}</p>
                </div>
                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{doc.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Purpose (optional) */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Purpose (optional)</label>
          <input
            type="text"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            placeholder="e.g., Bank loan, visa application..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-all"
          />
        </div>

        {/* Urgent toggle */}
        <button
          onClick={() => setUrgent(!urgent)}
          className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
            urgent ? "border-amber-400 bg-amber-50" : "border-gray-100 bg-gray-50"
          }`}
        >
          <div>
            <p className={`text-xs font-semibold ${urgent ? "text-amber-700" : "text-gray-600"}`}>Urgent Request</p>
            <p className="text-[10px] text-gray-400">Processed within 24 hours</p>
          </div>
          <div className={`w-10 h-6 rounded-full transition-all ${urgent ? "bg-amber-400" : "bg-gray-200"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${urgent ? "translate-x-4.5 ml-[18px]" : "ml-0.5"}`} />
          </div>
        </button>

        {/* Estimated time */}
        {selected && (
          <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-gray-600">Estimated Ready</span>
            <span className="text-xs font-bold text-blue-600">{urgent ? "24 hours" : selected.time}</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            canSubmit && !submitting
              ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Request Document"}
        </button>
      </div>
    </div>
  );
}
