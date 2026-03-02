"use client";
import { useState, useEffect } from "react";

type SalaryChange = {
  id: number; employee_id: string; employee_name?: string; effective_date: string;
  change_type: string; old_basic: number; new_basic: number;
  old_housing: number; new_housing: number; old_transport: number; new_transport: number;
  old_total: number; new_total: number; percentage_change: number;
  reason: string; approved_by: string;
};

function fmt(n: number) { return (n || 0).toLocaleString("en-SA"); }

const TYPE_COLORS: Record<string, string> = {
  hire: "bg-green-50 text-green-700",
  increment: "bg-blue-50 text-blue-700",
  promotion: "bg-purple-50 text-purple-700",
  adjustment: "bg-amber-50 text-amber-700",
  demotion: "bg-red-50 text-red-700",
};

export default function SalaryHistory() {
  const [history, setHistory] = useState<SalaryChange[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    employee_id: "", effective_date: new Date().toISOString().slice(0, 10),
    change_type: "increment", new_basic: 0, new_housing: 0, new_transport: 0,
    reason: "", approved_by: "",
  });

  async function load() {
    setLoading(true);
    const [h, e] = await Promise.all([
      fetch("/api/payroll?section=salary_history").then(r => r.json()),
      fetch("/api/admin?section=employees").then(r => r.json()),
    ]);
    setHistory(Array.isArray(h) ? h : []);
    const empList = Array.isArray(e) ? e : (e?.employees || []);
    setEmployees(empList);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 3000); }

  async function save() {
    setSaving(true);
    const r = await fetch("/api/payroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "record_salary_change", ...form }),
    });
    const data = await r.json();
    if (data.error) flash(data.error);
    else { flash("Salary change recorded + employee updated"); setShowForm(false); load(); }
    setSaving(false);
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      {msg && <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">{msg}</div>}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">Salary History</h3>
          <p className="text-xs text-gray-500 mt-0.5">Track salary increments, promotions, and adjustments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Record Change
        </button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 font-semibold uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-right">Old Total</th>
              <th className="px-4 py-3 text-right">New Total</th>
              <th className="px-4 py-3 text-right">Change</th>
              <th className="px-4 py-3 text-left">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map(h => (
              <tr key={h.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{h.employee_name || h.employee_id}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{h.effective_date}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_COLORS[h.change_type] || "bg-gray-100 text-gray-600"}`}>{h.change_type}</span>
                </td>
                <td className="px-4 py-3 text-right text-gray-500">{fmt(h.old_total)}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(h.new_total)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={h.percentage_change > 0 ? "text-green-600" : h.percentage_change < 0 ? "text-red-600" : "text-gray-400"}>
                    {h.percentage_change > 0 ? "+" : ""}{h.percentage_change}%
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[150px]">{h.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4">Record Salary Change</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Employee</label>
                <select className={inputCls} value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}>
                  <option value="">Select employee</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Effective Date</label>
                <input type="date" className={inputCls} value={form.effective_date} onChange={e => setForm({...form, effective_date: e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Change Type</label>
                <select className={inputCls} value={form.change_type} onChange={e => setForm({...form, change_type: e.target.value})}>
                  {["increment","promotion","adjustment","demotion"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Basic Salary</label>
                <input type="number" className={inputCls} value={form.new_basic} onChange={e => setForm({...form, new_basic: Number(e.target.value)})}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Housing</label>
                <input type="number" className={inputCls} value={form.new_housing} onChange={e => setForm({...form, new_housing: Number(e.target.value)})}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Transport</label>
                <input type="number" className={inputCls} value={form.new_transport} onChange={e => setForm({...form, new_transport: Number(e.target.value)})}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Approved By</label>
                <input className={inputCls} value={form.approved_by} onChange={e => setForm({...form, approved_by: e.target.value})} placeholder="HR Manager"/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <input className={inputCls} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Annual increment, promotion to Senior..."/>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={save} disabled={saving || !form.employee_id} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save & Update Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
