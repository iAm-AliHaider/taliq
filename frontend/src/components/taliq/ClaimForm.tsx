"use client";
import { useState } from "react";

export function ClaimForm({ types = [], onAction }: { types: string[]; onAction?: (action: string, payload: any) => void }) {
  const [claimType, setClaimType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    if (!claimType || !description || !amount) return;
    onAction?.("submit_claim", { claim_type: claimType, description, amount: Number(amount) });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-sm font-semibold text-gray-800">Submit Claim</h3>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Claim Type</label>
          <select value={claimType} onChange={e => setClaimType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm">
            <option value="">Select type</option>
            {types.map(t => <option key={t} value={t}>{t.replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your claim..." rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm resize-none" />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Amount (SAR)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm" />
        </div>
        <button onClick={handleSubmit} disabled={!claimType || !description || !amount} className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all">
          Submit Claim
        </button>
      </div>
    </div>
  );
}
