"use client";
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
  const [tab, setTab] = useState<"payslips"|"wps"|"gosi"|"anomalies">("payslips");
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [gosiReport, setGosiReport] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

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

  function switchTab(t: typeof tab) {
    setTab(t);
    if (t === "payslips") loadPayslips();
    if (t === "gosi") loadGosi();
    if (t === "anomalies") loadAnomalies();
  }

  const SEVERITY: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto">
        {(["payslips","wps","gosi","anomalies"] as const).map(t => (
          <button key={t} onClick={() => switchTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${tab===t ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-200"}`}>
            {t === "payslips" ? "Payslips" : t === "wps" ? "WPS SIF" : t === "gosi" ? "GOSI Report" : "Anomalies"}
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
      </div>
    </div>
  );
}
