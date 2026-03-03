"use client";
import jsPDF from "jspdf";
import { useState } from "react";

function fmt(n: number) { return (n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }); }

type Payslip = {
  employee_id: string; employee_name: string; department: string;
  earnings: { code: string; name: string; amount: number }[];
  deductions: { code: string; name: string; amount: number }[];
  employer_contributions: { code: string; name: string; amount: number }[];
  total_earnings: number; total_deductions: number; net_pay: number;
  iban?: string; bank_name?: string; id_number?: string;
};
type Anomaly = {
  type: string; severity: string; employee_id?: string; employee_name?: string;
  message: string; pct_change?: number;
};

export default function PayrollExtras({ runId, runRef }: { runId: number; runRef: string }) {
  const [tab, setTab] = useState<"payslips"|"wps"|"gosi"|"anomalies"|"overtime"|"adjustments">("payslips");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [gosiReport, setGosiReport] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [overtime, setOvertime] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [adjEmp, setAdjEmp] = useState("");
  const [adjCode, setAdjCode] = useState("");
  const [adjAmt, setAdjAmt] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjMsg, setAdjMsg] = useState("");

  async function loadPayslips() {
    if (loaded.payslips) return;
    setLoading(true);
    const r = await fetch(`/api/payroll?section=payslip&run_id=${runId}`).then(r => r.json());
    setPayslips(Array.isArray(r?.payslips) ? r.payslips : []);
    setLoaded(p => ({...p, payslips: true})); setLoading(false);
  }

  async function loadGosi() {
    if (loaded.gosi) return;
    setLoading(true);
    const r = await fetch(`/api/payroll?section=gosi_report&run_id=${runId}`).then(r => r.json());
    setGosiReport(r); setLoaded(p => ({...p, gosi: true})); setLoading(false);
  }

  async function loadAnomalies() {
    if (loaded.anomalies) return;
    setLoading(true);
    const r = await fetch(`/api/payroll?section=anomalies&run_id=${runId}`).then(r => r.json());
    setAnomalies(r?.anomalies || []); setLoaded(p => ({...p, anomalies: true})); setLoading(false);
  }

  function downloadWPS() {
    window.open(`/api/payroll?section=wps_sif&run_id=${runId}`, "_blank");
  }


  async function loadOvertime() {
    if (loaded.overtime) return;
    setLoading(true);
    const r = await fetch(`/api/payroll?section=overtime&run_id=${runId}`).then(r => r.json());
    setOvertime(r?.overtime || []); setLoaded(p => ({...p, overtime: true})); setLoading(false);
  }
  async function loadAdjustments() {
    setLoading(true);
    const r = await fetch(`/api/payroll?section=adjustments&run_id=${runId}`).then(r => r.json());
    setAdjustments(r?.adjustments || []); setLoaded(p => ({...p, adjustments: true})); setLoading(false);
  }
  async function addAdjustment() {
    if (!adjEmp || !adjCode || !adjAmt) { setAdjMsg("Fill required fields"); return; }
    setAdjSaving(true);
    const r = await fetch("/api/payroll?action=add_adjustment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_id: runId, employee_id: adjEmp, paycode_code: adjCode, amount: Number(adjAmt), note: adjNote })
    }).then(r => r.json());
    if (r.ok) { setAdjMsg("Added!"); setAdjEmp(""); setAdjCode(""); setAdjAmt(""); setAdjNote(""); loadAdjustments(); }
    else { setAdjMsg(r.error || "Failed"); }
    setAdjSaving(false); setTimeout(() => setAdjMsg(""), 3000);
  }
  async function deleteAdjustment(id: number) {
    if (!window.confirm("Delete this adjustment?")) return;
    await fetch("/api/payroll?action=delete_adjustment", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
    });
    loadAdjustments();
  }

  function switchTab(t: typeof tab) {
    setTab(t);
    if (t === "payslips") loadPayslips();
    if (t === "gosi") loadGosi();
    if (t === "anomalies") loadAnomalies();
    if (t === "overtime") loadOvertime();
    if (t === "adjustments") loadAdjustments();
  }

  const SEVERITY: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
  };


  function downloadPayslipPDF(ps: Payslip) {
    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    let y = 20;
    
    // Header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, w, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("PAYSLIP", 15, 18);
    doc.setFontSize(10);
    doc.text(`${runRef} | Generated ${new Date().toISOString().slice(0,10)}`, 15, 28);
    
    y = 45;
    doc.setTextColor(30, 41, 59); // slate-800
    
    // Employee info
    doc.setFontSize(14);
    doc.text(ps.employee_name, 15, y); y += 7;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${ps.employee_id} | ${ps.department}`, 15, y);
    if (ps.iban) {
      y += 5;
      doc.text(`Bank: ${ps.bank_name || "N/A"} | IBAN: ${ps.iban}`, 15, y);
    }
    y += 12;
    
    // Table header helper
    function tableHeader(title: string, startY: number) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, startY - 4, w - 30, 7, "F");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(title.toUpperCase(), 17, startY);
      doc.text("AMOUNT (SAR)", w - 50, startY);
      return startY + 8;
    }
    
    function tableRow(name: string, amount: number, startY: number, bold = false) {
      doc.setFontSize(9);
      doc.setTextColor(bold ? 16 : 71, bold ? 185 : 85, bold ? 129 : 105);
      if (bold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.text(name, 17, startY);
      doc.text(fmt(amount), w - 50, startY);
      return startY + 6;
    }
    
    // Earnings
    y = tableHeader("Earnings", y);
    for (const e of ps.earnings) { y = tableRow(e.name, e.amount, y); }
    y = tableRow("Total Earnings", ps.total_earnings, y, true);
    y += 6;
    
    // Deductions
    y = tableHeader("Deductions", y);
    for (const d of ps.deductions) { y = tableRow(d.name, d.amount, y); }
    y = tableRow("Total Deductions", ps.total_deductions, y, true);
    y += 6;
    
    // Employer contributions
    if (ps.employer_contributions.length > 0) {
      y = tableHeader("Employer Contributions", y);
      for (const c of ps.employer_contributions) { y = tableRow(c.name, c.amount, y); }
      y += 6;
    }
    
    // Net pay box
    doc.setFillColor(16, 185, 129);
    doc.rect(15, y, w - 30, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("NET PAY", 20, y + 9);
    doc.text(`SAR ${fmt(ps.net_pay)}`, w - 55, y + 9);
    
    // Footer
    y += 25;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("This is a computer-generated document. | Taliq HR Platform", 15, y);
    
    doc.save(`payslip-${ps.employee_id}-${runRef}.pdf`);
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
        {(["payslips","wps","gosi","overtime","adjustments","anomalies"] as const).map(t => (
          <button key={t} onClick={() => switchTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${tab===t ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-200"}`}>
            {t === "payslips" ? "Payslips" : t === "wps" ? "WPS SIF" : t === "gosi" ? "GOSI" : t === "overtime" ? "Overtime" : t === "adjustments" ? "Adjustments" : "Anomalies"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading && <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>}

        {/* ── Payslips ─────────────────────────────────────────────────────────── */}
        {tab === "payslips" && !loading && (
          <div className="space-y-4">
            {payslips.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">Click to load payslips</div>}
            {payslips.map(ps => (
              <div key={ps.employee_id} className="border border-gray-200 rounded-xl p-4 print:break-inside-avoid">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-gray-800">{ps.employee_name}</div>
                    <div className="text-xs text-gray-500">{ps.employee_id} — {ps.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Net Pay</div>
                    <div className="font-bold text-emerald-700 text-lg">SAR {fmt(ps.net_pay)}</div>
                  </div>
                  <button onClick={() => downloadPayslipPDF(ps)} className="mt-1 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium hover:bg-emerald-100" title="Download PDF">PDF</button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-gray-600 uppercase mb-1">Earnings</div>
                    {ps.earnings.map(e => (
                      <div key={e.code} className="flex justify-between py-0.5"><span className="text-gray-600">{e.name}</span><span className="font-mono text-gray-800">{fmt(e.amount)}</span></div>
                    ))}
                    <div className="flex justify-between py-1 border-t border-gray-200 mt-1 font-bold text-green-700">
                      <span>Total</span><span>{fmt(ps.total_earnings)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-600 uppercase mb-1">Deductions</div>
                    {ps.deductions.map(d => (
                      <div key={d.code} className="flex justify-between py-0.5"><span className="text-gray-600">{d.name}</span><span className="font-mono text-red-600">{fmt(d.amount)}</span></div>
                    ))}
                    <div className="flex justify-between py-1 border-t border-gray-200 mt-1 font-bold text-red-600">
                      <span>Total</span><span>{fmt(ps.total_deductions)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-600 uppercase mb-1">Employer Cost</div>
                    {ps.employer_contributions.map(c => (
                      <div key={c.code} className="flex justify-between py-0.5"><span className="text-gray-600">{c.name}</span><span className="font-mono text-gray-800">{fmt(c.amount)}</span></div>
                    ))}
                  </div>
                </div>
                {ps.iban && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex gap-4">
                    <span>Bank: {ps.bank_name}</span>
                    <span>IBAN: {ps.iban}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── WPS SIF ──────────────────────────────────────────────────────────── */}
        {tab === "wps" && !loading && (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h4 className="font-bold text-gray-800 mb-1">WPS Salary Information File (SIF)</h4>
            <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
              Saudi Wage Protection System file for bank salary disbursement.
              Contains employee IBAN, bank code, ID number, and net salary.
            </p>
            <button onClick={downloadWPS}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
              Download WPS SIF File
            </button>
            <div className="mt-4 text-xs text-gray-400">Format: MOL tab-delimited | Upload to bank portal</div>
          </div>
        )}

        {/* ── GOSI Report ──────────────────────────────────────────────────────── */}
        {tab === "gosi" && !loading && gosiReport && (
          <div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Insurable", value: fmt(gosiReport.totals?.total_insurable), color: "text-gray-700" },
                { label: "Employee GOSI", value: fmt(gosiReport.totals?.total_employee), color: "text-red-600" },
                { label: "Employer GOSI", value: fmt(gosiReport.totals?.total_employer), color: "text-amber-700" },
                { label: "Combined", value: fmt(gosiReport.totals?.total_combined), color: "text-blue-700" },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center">
                  <div className={`font-bold text-sm ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">Employee</th>
                  <th className="px-3 py-2 text-left">ID Number</th>
                  <th className="px-3 py-2 text-left">Nationality</th>
                  <th className="px-3 py-2 text-right">Insurable</th>
                  <th className="px-3 py-2 text-right">Employee (9.75%)</th>
                  <th className="px-3 py-2 text-right">Employer (11.75%)</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(gosiReport.employees || []).map((e: any) => (
                  <tr key={e.employee_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{e.employee_name}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono">{e.id_number}</td>
                    <td className="px-3 py-2 text-gray-500">{e.nationality}</td>
                    <td className="px-3 py-2 text-right">{fmt(e.insurable_salary)}</td>
                    <td className="px-3 py-2 text-right text-red-600">{fmt(e.gosi_employee)}</td>
                    <td className="px-3 py-2 text-right text-amber-700">{fmt(e.gosi_employer)}</td>
                    <td className="px-3 py-2 text-right font-bold">{fmt(e.gosi_employee + e.gosi_employer)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Anomalies ────────────────────────────────────────────────────────── */}
        {tab === "anomalies" && !loading && (
          <div>
            {anomalies.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No anomalies detected. Everything looks normal compared to the previous run.
              </div>
            ) : (
              <div className="space-y-2">
                {anomalies.map((a, i) => (
                  <div key={i} className={`border rounded-xl p-3 ${SEVERITY[a.severity] || SEVERITY.low}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">{a.employee_name || "Payroll Total"}</div>
                        <div className="text-xs mt-0.5">{a.message}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase whitespace-nowrap">{a.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Overtime ─────────────────────────────────────────────────────────── */}
        {tab === "overtime" && !loading && (
          <div>
            {overtime.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No overtime records for this run.<br/><span className="text-xs">Overtime is pulled from attendance records.</span></div>
            ) : (
              <div>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b text-gray-500 font-semibold">
                    <tr>
                      <th className="px-3 py-2 text-left">Employee</th>
                      <th className="px-3 py-2 text-right">OT Hours</th>
                      <th className="px-3 py-2 text-right">Hourly Rate</th>
                      <th className="px-3 py-2 text-right">Amount (SAR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {overtime.map((o: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{o.employee_name}</td>
                        <td className="px-3 py-2 text-right font-mono">{Number(o.overtime_hours||0).toFixed(1)}h</td>
                        <td className="px-3 py-2 text-right font-mono">{fmt(o.hourly_rate)}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">{fmt(o.overtime_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t font-bold bg-gray-50">
                    <tr>
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right">{overtime.reduce((s:number,o:any)=>s+Number(o.overtime_hours||0),0).toFixed(1)}h</td>
                      <td></td>
                      <td className="px-3 py-2 text-right text-emerald-700">{fmt(overtime.reduce((s:number,o:any)=>s+Number(o.overtime_amount||0),0))}</td>
                    </tr>
                  </tfoot>
                </table>
                <p className="text-xs text-gray-400 mt-2">Saudi Labor Law: OT = 1.5x hourly. Hourly = monthly / 240.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Adjustments ──────────────────────────────────────────────────────── */}
        {tab === "adjustments" && !loading && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-700 text-sm mb-3">Add Ad-hoc Adjustment</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <label className="text-xs text-slate-500">Employee ID</label>
                  <input value={adjEmp} onChange={e=>setAdjEmp(e.target.value)} placeholder="E001"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Type</label>
                  <select value={adjCode} onChange={e=>setAdjCode(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="">Select...</option>
                    <option value="BONUS">Bonus</option>
                    <option value="OVERTIME">Overtime</option>
                    <option value="OTHER_ALW">Allowance</option>
                    <option value="OTHER_DED">Deduction</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Amount (SAR)</label>
                  <input value={adjAmt} onChange={e=>setAdjAmt(e.target.value)} type="number" placeholder="0.00"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500">Note</label>
                  <input value={adjNote} onChange={e=>setAdjNote(e.target.value)} placeholder="Reason..."
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={addAdjustment} disabled={adjSaving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {adjSaving ? "Saving..." : "Add Adjustment"}
                </button>
                {adjMsg && <span className={`text-xs font-medium ${adjMsg === "Added!" ? "text-emerald-600" : "text-red-500"}`}>{adjMsg}</span>}
              </div>
            </div>
            {adjustments.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No adjustments for this run.</div>
            ) : (
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b text-gray-500 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-left">Employee</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-left">Note</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {adjustments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{a.employee_name || a.employee_id}</td>
                      <td className="px-3 py-2 text-gray-500">{a.paycode_name || a.paycode_code}</td>
                      <td className={`px-3 py-2 text-right font-mono ${a.paycode_type==="deduction"?"text-red-600":"text-emerald-700"}`}>{fmt(a.amount)}</td>
                      <td className="px-3 py-2 text-gray-400">{a.note}</td>
                      <td className="px-3 py-2">
                        <button onClick={()=>deleteAdjustment(a.id)} className="text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
