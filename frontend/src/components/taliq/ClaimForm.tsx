"use client";
import { useState } from "react";

const CLAIM_TYPES = ["medical", "dental", "vision", "education", "relocation", "other"];

export function ClaimForm({ prefill, onAction }: { prefill?: { claimType?: string; description?: string; amount?: number }; onAction?: (action: string, payload: any) => void }) {
  const [claimType, setClaimType] = useState(prefill?.claimType || "");
  const [description, setDescription] = useState(prefill?.description || "");
  const [amount, setAmount] = useState(prefill?.amount ? String(prefill.amount) : "");
  const [submitting, setSubmitting] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);

  const canSubmit = claimType && description && amount && Number(amount) > 0;

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    onAction?.("submit_claim", { claim_type: claimType, description, amount: Number(amount) });
  };

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out] ${submitting ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
        <h3 className="text-sm font-semibold text-gray-800">Submit Claim</h3>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Claim Type</label>
          <div className="flex flex-wrap gap-1.5">
            {(CLAIM_TYPES || []).map(t => (
              <button key={t} onClick={() => setClaimType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 ${
                  claimType === t ? "bg-violet-500 text-white shadow-sm" : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-violet-200"
                }`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the claim..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 transition-all" />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Amount (SAR)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-200 transition-all" />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Supporting Document (optional)</label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-emerald-300 transition-all">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <span className="text-xs text-gray-500">{docFile ? docFile.name : "Upload document (JPG, PNG, PDF)"}</span>
            <input type="file" accept="image/*,.pdf" onChange={e => setDocFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
            canSubmit && !submitting ? "bg-violet-500 text-white hover:bg-violet-600 shadow-md shadow-violet-500/20" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" /></svg>
              Submitting...
            </span>
          ) : "Submit Claim"}
        </button>
      </div>
    </div>
  );
}
