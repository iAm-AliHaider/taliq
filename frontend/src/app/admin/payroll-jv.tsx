"use client";
import { useState, useEffect } from "react";
import PayrollExtras from "./payroll-extras";

type PayrollRun = {
  id: number; ref: string; period_label: string; period_month: number; period_year: number;
  status: string; total_gross: number; total_deductions: number; total_net: number;
  total_gosi_employee: number; total_gosi_employer: number; employee_count: number;
  notes: string; posted_to_erp: boolean; erp_ref: string; created_at: string;
};
type JVLine = {
  id: number; line_no: number; account_number: string; account_name: string;
  debit: number; credit: number; dimension_dept: string; narration: string;
};
type JV = { id: number; jv_ref: string; jv_date: string; description: string;
  total_debit: number; total_credit: number; status: string; export_format: string; lines: JVLine[] };

const STATUS_COLORS: Record<string,string> = {
  draft: "bg-gray-100 text-gray-600",
  approved: "bg-blue-50 text-blue-700",
  posted: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

function fmt(n: number) { return (n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }); }

export default function PayrollJV() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [runLoading, setRunLoading] = useState(false);
  const [jvLoading, setJvLoading] = useState(false);
  const [msg, setMsg] = useState<{text:string; type:"ok"|"err"}>({text:"",type:"ok"});

  // Selected run
  const [selectedRun, setSelectedRun] = useState<PayrollRun|null>(null);
  const [jv, setJv] = useState<JV|null>(null);
  const [jvFetched, setJvFetched] = useState(false);

  // New run form
  const now = new Date();
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);
  const [newYear, setNewYear] = useState(now.getFullYear());
  const [newNotes, setNewNotes] = useState("");
  const [showRunForm, setShowRunForm] = useState(false);

  async function loadRuns() {
    setLoading(true);
    const r = await fetch("/api/paycodes?section=payroll_runs").then(r => r.json());
    setRuns(Array.isArray(r) ? r : []);
    setLoading(false);
  }
  useEffect(() => { loadRuns(); }, []);

  function flash(text: string, type: "ok"|"err" = "ok") {
    setMsg({text,type}); setTimeout(() => setMsg({text:"",type:"ok"}), 4000);
  }

  async function runPayroll() {
    setRunLoading(true);
    const r = await fetch("/api/paycodes", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"run_payroll", period_month: newMonth, period_year: newYear, notes: newNotes }),
    });
    const data = await r.json();
    if (data.error) { flash(data.error, "err"); }
    else {
      flash(`Payroll run ${data.ref} created — ${data.employee_count} employees, SAR ${fmt(data.total_net)} net`);
      setShowRunForm(false); setNewNotes("");
      loadRuns();
    }
    setRunLoading(false);
  }

  async function approveRun(run_id: number) {
    await fetch("/api/paycodes", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"approve_payroll", run_id }),
    });
    flash("Payroll run approved"); loadRuns();
  }

  async function postRun(run_id: number) {
    const r = await fetch("/api/payroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "post_payroll", run_id }),
    });
    const data = await r.json();
    if (data.error) flash(data.error, "err");
    else flash("Payroll posted + loans decremented + EOS provisions calculated");
    loadRuns();
  }

  async function selectRun(run: PayrollRun) {
    setSelectedRun(run); setJv(null); setJvFetched(false);
    const r = await fetch(`/api/paycodes?section=journal_voucher&run_id=${run.id}`).then(r => r.json());
    setJv(r); setJvFetched(true);
  }

  async function generateJV() {
    if (!selectedRun) return;
    setJvLoading(true);
    const r = await fetch("/api/paycodes", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"generate_jv", run_id: selectedRun.id }),
    });
    const data = await r.json();
    if (data.error) { flash(data.error, "err"); }
    else { setJv(data); flash("Journal Voucher generated successfully"); }
    setJvLoading(false);
  }

  async function exportJV(format: string) {
    if (!selectedRun) return;
    const r = await fetch("/api/paycodes", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"export_jv", run_id: selectedRun.id, format }),
    });
    if (!r.ok) { const e = await r.json(); flash(e.error, "err"); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JV-${selectedRun.ref}-${format}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash(`Exported as ${format.toUpperCase()}`);
  }

  const inputCls = "border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400";

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;

  return (
    <div>
      {msg.text && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${msg.type==="ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-gray-800">Payroll Runs & Journal Vouchers</h3>
          <p className="text-xs text-gray-500 mt-0.5">Run monthly payroll → generate JV → export to D365 BC / SAP / Oracle</p>
        </div>
        <button onClick={() => setShowRunForm(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Run Payroll
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* ── Runs list ───────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase">Payroll Runs</span>
            </div>
            {runs.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No payroll runs yet</div>
            )}
            {runs.map(run => (
              <div key={run.id}
                onClick={() => selectRun(run)}
                className={`px-4 py-3 border-b cursor-pointer transition-colors ${selectedRun?.id === run.id ? "bg-emerald-50 border-l-4 border-l-emerald-500" : "hover:bg-gray-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{run.period_label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{run.ref} &nbsp;·&nbsp; {run.employee_count} employees</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[run.status] || "bg-gray-100 text-gray-600"}`}>
                    {run.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="font-bold text-green-700">{fmt(run.total_gross)}</div>
                    <div className="text-gray-500">Gross</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 text-center">
                    <div className="font-bold text-red-600">{fmt(run.total_deductions)}</div>
                    <div className="text-gray-500">Deductions</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="font-bold text-blue-700">{fmt(run.total_net)}</div>
                    <div className="text-gray-500">Net</div>
                  </div>
                </div>
                {run.status === "draft" && (
                  <button onClick={e => { e.stopPropagation(); approveRun(run.id); }}
                    className="mt-2 w-full py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100">
                    Approve Run
                  </button>
                )}
                {run.status === "approved" && (
                  <button onClick={e => { e.stopPropagation(); postRun(run.id); }}
                    className="mt-2 w-full py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700">
                    Post to ERP
                  </button>
                )}
                {run.posted_to_erp && (
                  <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Posted to ERP {run.erp_ref && `(${run.erp_ref})`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── JV Panel ────────────────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-7">
          {!selectedRun ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center h-full min-h-[200px]">
              <p className="text-gray-400 text-sm">Select a payroll run to view or generate its Journal Voucher</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-800">{selectedRun.period_label} Journal Voucher</div>
                  <div className="text-xs text-gray-500 mt-0.5">{selectedRun.ref}</div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {(!jvFetched || !jv) ? (
                    <button onClick={generateJV} disabled={jvLoading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">
                      {jvLoading ? "Generating..." : "Generate JV"}
                    </button>
                  ) : (
                    <>
                      <button onClick={generateJV} disabled={jvLoading}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium hover:bg-amber-100 disabled:opacity-50">
                        {jvLoading ? "..." : "Regenerate"}
                      </button>
                      <button onClick={() => exportJV("bc_csv")}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        D365 BC
                      </button>
                      <button onClick={() => exportJV("sap_csv")}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        SAP
                      </button>
                      <button onClick={() => exportJV("generic_csv")}
                        className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-300 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                        Generic CSV
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Payroll summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b bg-gray-50">
                {[
                  { label: "Gross Pay", value: fmt(selectedRun.total_gross), color: "text-green-700" },
                  { label: "Deductions", value: fmt(selectedRun.total_deductions), color: "text-red-600" },
                  { label: "Net Pay", value: fmt(selectedRun.total_net), color: "text-blue-700" },
                  { label: "GOSI (Employer)", value: fmt(selectedRun.total_gosi_employer), color: "text-amber-700" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                    <div className={`font-bold text-sm ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label} (SAR)</div>
                  </div>
                ))}
              </div>

              {/* JV Lines */}
              {jvFetched && jv && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-600 uppercase">JV Lines — {jv.jv_ref}</div>
                    <div className="text-xs text-gray-500">{jv.jv_date}</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b text-gray-500 font-semibold uppercase">
                        <tr>
                          <th className="px-3 py-2 text-left">Line</th>
                          <th className="px-3 py-2 text-left">Account No.</th>
                          <th className="px-3 py-2 text-left">Account Name</th>
                          <th className="px-3 py-2 text-right">Debit (SAR)</th>
                          <th className="px-3 py-2 text-right">Credit (SAR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(jv.lines || []).map(l => (
                          <tr key={l.id} className={`${l.debit > 0 ? "bg-red-50/30" : "bg-green-50/30"} hover:bg-gray-50`}>
                            <td className="px-3 py-2 text-gray-400">{l.line_no}</td>
                            <td className="px-3 py-2 font-mono font-bold text-gray-700">{l.account_number}</td>
                            <td className="px-3 py-2 text-gray-600">{l.account_name}</td>
                            <td className="px-3 py-2 text-right font-medium text-red-600">{l.debit > 0 ? fmt(l.debit) : ""}</td>
                            <td className="px-3 py-2 text-right font-medium text-green-700">{l.credit > 0 ? fmt(l.credit) : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-100 border-t">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 font-bold text-gray-700 text-right uppercase">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-red-700">{fmt(jv.total_debit)}</td>
                          <td className="px-3 py-2 text-right font-bold text-green-700">{fmt(jv.total_credit)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {Number(jv.total_debit) === Number(jv.total_credit) ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        Balanced — Debit equals Credit
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        Unbalanced! Difference: SAR {fmt(Math.abs(Number(jv.total_debit) - Number(jv.total_credit)))}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {jvFetched && !jv && (
                <div className="p-6 text-center">
                  <div className="text-gray-400 text-sm mb-3">No Journal Voucher generated yet</div>
                  <button onClick={generateJV} disabled={jvLoading}
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                    {jvLoading ? "Generating..." : "Generate Journal Voucher"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}

      {/* ── New Run Modal ──────────────────────────────────────────────────────── */}
      {showRunForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-gray-800 text-lg">Run Payroll</h3>
              <button onClick={() => setShowRunForm(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                <select className={`w-full ${inputCls}`} value={newMonth} onChange={e => setNewMonth(Number(e.target.value))}>
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                <input className={`w-full ${inputCls}`} type="number" value={newYear} onChange={e => setNewYear(Number(e.target.value))}/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <input className={`w-full ${inputCls}`} value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="e.g. Including Ramadan bonus"/>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-xs text-amber-700">
              This will calculate payroll for all active employees using current salary data and GOSI rates (9.75% employee, 11.75% employer for Saudis; 0%/2% for non-Saudis).
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowRunForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={runPayroll} disabled={runLoading}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {runLoading ? "Running..." : "Run Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
