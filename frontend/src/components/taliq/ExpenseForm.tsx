"use client";
import { useState, useRef } from "react";

const CATEGORIES = ["travel", "meals", "supplies", "transport", "accommodation", "training", "communication", "other"];

export function ExpenseForm({ categories, onAction }: { categories?: string[]; onAction?: (action: string, payload: any) => void }) {
  const cats = categories?.length ? categories : CATEGORIES;
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const canSubmit = category && description && amount && Number(amount) > 0;

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    onAction?.("submit_expense", { category, description, amount: Number(amount), expense_date: expenseDate });
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 300);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center animate-[scaleIn_0.25s_ease-out]">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="text-sm font-semibold text-emerald-800">Expense Submitted</p>
        <p className="text-xs text-emerald-600 mt-1">{category} · {Number(amount).toLocaleString()} SAR</p>
      </div>
    );
  }

  return (
    <div ref={formRef} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <h3 className="text-sm font-semibold text-gray-800">Submit Expense</h3>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {cats.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 active:scale-95 ${
                  category === c ? "bg-orange-500 text-white shadow-sm" : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-orange-200"
                }`}>{c.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What was the expense for?"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Amount (SAR)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1.5">Date</label>
            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-all" />
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
            canSubmit && !submitting ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}>
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" /></svg>
              Submitting...
            </span>
          ) : "Submit Expense"}
        </button>
      </div>
    </div>
  );
}
