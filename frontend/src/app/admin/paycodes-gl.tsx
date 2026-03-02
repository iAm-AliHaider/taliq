"use client";
import { useState, useEffect } from "react";

type GlAccount = {
  id: number; account_number: string; account_name: string; account_name_ar: string;
  account_type: string; parent_account: string; cost_center: string; is_active: boolean;
};
type Paycode = {
  id: number; code: string; name: string; name_ar: string; paycode_type: string;
  category: string; gl_debit_account: string; gl_credit_account: string;
  gl_debit_name?: string; gl_credit_name?: string;
  is_taxable: boolean; is_gosi: boolean; is_active: boolean; sort_order: number;
};

const ACCOUNT_TYPES = ["asset","liability","equity","revenue","expense"];
const ACCOUNT_TYPE_COLORS: Record<string,string> = {
  asset: "bg-blue-50 text-blue-700",
  liability: "bg-red-50 text-red-700",
  equity: "bg-purple-50 text-purple-700",
  revenue: "bg-green-50 text-green-700",
  expense: "bg-amber-50 text-amber-700",
};
const PAYCODE_TYPE_COLORS: Record<string,string> = {
  earning: "bg-emerald-50 text-emerald-700",
  deduction: "bg-red-50 text-red-700",
  employer_contribution: "bg-indigo-50 text-indigo-700",
};

const EMPTY_GL: Partial<GlAccount> = { account_number:"", account_name:"", account_name_ar:"", account_type:"expense", parent_account:"", cost_center:"", is_active:true };
const EMPTY_PC: Partial<Paycode> = { code:"", name:"", name_ar:"", paycode_type:"earning", category:"salary", gl_debit_account:"", gl_credit_account:"", is_taxable:false, is_gosi:false, is_active:true, sort_order:0 };

export default function PaycodesGL() {
  const [glAccounts, setGlAccounts] = useState<GlAccount[]>([]);
  const [paycodes, setPaycodes] = useState<Paycode[]>([]);
  const [panel, setPanel] = useState<"paycodes"|"gl_accounts">("paycodes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // GL form
  const [glForm, setGlForm] = useState<Partial<GlAccount>>(EMPTY_GL);
  const [glEditId, setGlEditId] = useState<number|null>(null);
  const [showGlForm, setShowGlForm] = useState(false);

  // Paycode form
  const [pcForm, setPcForm] = useState<Partial<Paycode>>(EMPTY_PC);
  const [pcEditId, setPcEditId] = useState<number|null>(null);
  const [showPcForm, setShowPcForm] = useState(false);

  async function load() {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch("/api/paycodes?section=paycodes").then(r => r.json()),
      fetch("/api/paycodes?section=gl_accounts").then(r => r.json()),
    ]);
    setPaycodes(Array.isArray(r1) ? r1 : []);
    setGlAccounts(Array.isArray(r2) ? r2 : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 3000); }

  // ── GL Account actions ─────────────────────────────────────────────────────
  async function saveGL() {
    setSaving(true);
    await fetch("/api/paycodes", {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ action: glEditId ? "update_gl_account" : "create_gl_account", id: glEditId, ...glForm }),
    });
    flash(glEditId ? "GL account updated" : "GL account created");
    setShowGlForm(false); setGlEditId(null); setGlForm(EMPTY_GL);
    setSaving(false); load();
  }

  async function deleteGL(id: number) {
    if (!confirm("Delete this GL account?")) return;
    await fetch("/api/paycodes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"delete_gl_account", id }) });
    flash("Deleted"); load();
  }

  function editGL(g: GlAccount) {
    setGlForm({ ...g }); setGlEditId(g.id); setShowGlForm(true);
  }

  // ── Paycode actions ────────────────────────────────────────────────────────
  async function savePC() {
    setSaving(true);
    await fetch("/api/paycodes", {
      method: "POST", headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ action: pcEditId ? "update_paycode" : "create_paycode", id: pcEditId, ...pcForm }),
    });
    flash(pcEditId ? "Paycode updated" : "Paycode created");
    setShowPcForm(false); setPcEditId(null); setPcForm(EMPTY_PC);
    setSaving(false); load();
  }

  async function deletePC(id: number) {
    if (!confirm("Delete this paycode?")) return;
    await fetch("/api/paycodes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"delete_paycode", id }) });
    flash("Deleted"); load();
  }

  function editPC(p: Paycode) {
    setPcForm({ ...p }); setPcEditId(p.id); setShowPcForm(true);
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      {msg && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">{msg}</div>
      )}

      {/* Sub-panel switcher */}
      <div className="flex gap-2 mb-6">
        {(["paycodes","gl_accounts"] as const).map(p => (
          <button key={p} onClick={() => setPanel(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${panel===p ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {p === "paycodes" ? "Paycodes" : "GL Accounts"}
          </button>
        ))}
        <button onClick={() => { if(panel==="paycodes") { setShowPcForm(true); setPcEditId(null); setPcForm(EMPTY_PC); } else { setShowGlForm(true); setGlEditId(null); setGlForm(EMPTY_GL); } }}
          className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          {panel === "paycodes" ? "New Paycode" : "New GL Account"}
        </button>
      </div>

      {/* ── PAYCODES PANEL ───────────────────────────────────────────────────── */}
      {panel === "paycodes" && (
        <>
          <div className="mb-3 text-xs text-gray-500">
            {paycodes.length} paycodes &nbsp;·&nbsp; Each paycode maps to Debit/Credit GL accounts for JV generation
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-xs text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Arabic Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Dr Account</th>
                  <th className="px-4 py-3 text-left">Cr Account</th>
                  <th className="px-4 py-3 text-left">Flags</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paycodes.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${!p.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono font-semibold text-xs text-emerald-700">{p.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600" dir="rtl">{p.name_ar}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYCODE_TYPE_COLORS[p.paycode_type] || "bg-gray-100 text-gray-600"}`}>
                        {p.paycode_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-700">{p.gl_debit_account}</span>
                      {p.gl_debit_name && <div className="text-xs text-gray-400 mt-0.5">{p.gl_debit_name}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-purple-700">{p.gl_credit_account}</span>
                      {p.gl_credit_name && <div className="text-xs text-gray-400 mt-0.5">{p.gl_credit_name}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.is_gosi && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-600">GOSI</span>}
                        {p.is_taxable && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-600">Tax</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => editPC(p)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Edit</button>
                        <button onClick={() => deletePC(p.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paycode Form Modal */}
          {showPcForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-gray-800 text-lg">{pcEditId ? "Edit Paycode" : "New Paycode"}</h3>
                  <button onClick={() => setShowPcForm(false)} className="text-gray-400 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Code *</label>
                    <input className={inputCls} value={pcForm.code||""} onChange={e => setPcForm({...pcForm, code: e.target.value.toUpperCase()})} placeholder="BASIC"/>
                  </div>
                  <div>
                    <label className={labelCls}>Type *</label>
                    <select className={inputCls} value={pcForm.paycode_type} onChange={e => setPcForm({...pcForm, paycode_type: e.target.value})}>
                      <option value="earning">Earning</option>
                      <option value="deduction">Deduction</option>
                      <option value="employer_contribution">Employer Contribution</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Name (English) *</label>
                    <input className={inputCls} value={pcForm.name||""} onChange={e => setPcForm({...pcForm, name: e.target.value})} placeholder="Basic Salary"/>
                  </div>
                  <div>
                    <label className={labelCls}>Name (Arabic)</label>
                    <input className={inputCls} dir="rtl" value={pcForm.name_ar||""} onChange={e => setPcForm({...pcForm, name_ar: e.target.value})} placeholder="الراتب الأساسي"/>
                  </div>
                  <div>
                    <label className={labelCls}>Category</label>
                    <select className={inputCls} value={pcForm.category} onChange={e => setPcForm({...pcForm, category: e.target.value})}>
                      {["salary","allowance","bonus","overtime","gosi","tax","loan","advance","leave","eos","other"].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Sort Order</label>
                    <input className={inputCls} type="number" value={pcForm.sort_order||0} onChange={e => setPcForm({...pcForm, sort_order: Number(e.target.value)})}/>
                  </div>
                  <div>
                    <label className={labelCls}>GL Debit Account (Dr)</label>
                    <select className={inputCls} value={pcForm.gl_debit_account||""} onChange={e => setPcForm({...pcForm, gl_debit_account: e.target.value})}>
                      <option value="">-- Select --</option>
                      {glAccounts.filter(g => g.is_active).map(g => (
                        <option key={g.id} value={g.account_number}>{g.account_number} — {g.account_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>GL Credit Account (Cr)</label>
                    <select className={inputCls} value={pcForm.gl_credit_account||""} onChange={e => setPcForm({...pcForm, gl_credit_account: e.target.value})}>
                      <option value="">-- Select --</option>
                      {glAccounts.filter(g => g.is_active).map(g => (
                        <option key={g.id} value={g.account_number}>{g.account_number} — {g.account_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={!!pcForm.is_gosi} onChange={e => setPcForm({...pcForm, is_gosi: e.target.checked})} className="rounded"/>
                    GOSI Component
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={!!pcForm.is_taxable} onChange={e => setPcForm({...pcForm, is_taxable: e.target.checked})} className="rounded"/>
                    Taxable
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={pcForm.is_active !== false} onChange={e => setPcForm({...pcForm, is_active: e.target.checked})} className="rounded"/>
                    Active
                  </label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowPcForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={savePC} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Paycode"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── GL ACCOUNTS PANEL ────────────────────────────────────────────────── */}
      {panel === "gl_accounts" && (
        <>
          <div className="mb-3 text-xs text-gray-500">
            {glAccounts.length} accounts &nbsp;·&nbsp; These map to your chart of accounts in D365 BC / SAP / Oracle
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-xs text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Account No.</th>
                  <th className="px-4 py-3 text-left">Account Name</th>
                  <th className="px-4 py-3 text-left">Arabic Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Cost Center</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {glAccounts.map(g => (
                  <tr key={g.id} className={`hover:bg-gray-50 ${!g.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">{g.account_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{g.account_name}</td>
                    <td className="px-4 py-3 text-gray-600" dir="rtl">{g.account_name_ar}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ACCOUNT_TYPE_COLORS[g.account_type] || "bg-gray-100 text-gray-600"}`}>
                        {g.account_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{g.cost_center || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${g.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {g.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => editGL(g)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Edit</button>
                        <button onClick={() => deleteGL(g.id)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GL Account Form Modal */}
          {showGlForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-gray-800 text-lg">{glEditId ? "Edit GL Account" : "New GL Account"}</h3>
                  <button onClick={() => setShowGlForm(false)} className="text-gray-400 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Account Number *</label>
                    <input className={inputCls} value={glForm.account_number||""} onChange={e => setGlForm({...glForm, account_number: e.target.value})} placeholder="5100"/>
                  </div>
                  <div>
                    <label className={labelCls}>Type *</label>
                    <select className={inputCls} value={glForm.account_type} onChange={e => setGlForm({...glForm, account_type: e.target.value})}>
                      {ACCOUNT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Account Name (English) *</label>
                    <input className={inputCls} value={glForm.account_name||""} onChange={e => setGlForm({...glForm, account_name: e.target.value})} placeholder="Basic Salary Expense"/>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Account Name (Arabic)</label>
                    <input className={inputCls} dir="rtl" value={glForm.account_name_ar||""} onChange={e => setGlForm({...glForm, account_name_ar: e.target.value})} placeholder="مصروف الراتب الأساسي"/>
                  </div>
                  <div>
                    <label className={labelCls}>Parent Account</label>
                    <input className={inputCls} value={glForm.parent_account||""} onChange={e => setGlForm({...glForm, parent_account: e.target.value})} placeholder="5000"/>
                  </div>
                  <div>
                    <label className={labelCls}>Cost Center</label>
                    <input className={inputCls} value={glForm.cost_center||""} onChange={e => setGlForm({...glForm, cost_center: e.target.value})} placeholder="HR"/>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="gl_active" checked={glForm.is_active !== false} onChange={e => setGlForm({...glForm, is_active: e.target.checked})} className="rounded"/>
                  <label htmlFor="gl_active" className="text-sm text-gray-600 cursor-pointer">Active</label>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowGlForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={saveGL} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
