"use client";
import { useState } from "react";

export function ExpenseForm({ categories = [], onAction }: { categories: string[]; onAction?: (action: string, payload: any) => void }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = () => {
    if (!category || !description || !amount) return;
    onAction?.("submit_expense", { category, description, amount: Number(amount), expense_date: expenseDate });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <h3 className="text-sm font-semibold text-gray-800">Submit Expense</h3>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm">
            <option value="">Select category</option>
            {categories.map(c => <option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Description</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="What was the expense for?" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Amount (SAR)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Date</label>
            <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm" />
          </div>
        </div>
        <button onClick={handleSubmit} disabled={!category || !description || !amount} className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-all">
          Submit Expense
        </button>
      </div>
    </div>
  );
}
