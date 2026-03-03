"use client";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";

function fmt(n: number) { return (n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }); }

export default function EmployeeSelfService() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"overview"|"payslips"|"leave"|"loans"|"training"|"docs">("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem("taliq_user");
    if (!u) { window.location.href = "/"; return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    loadData(parsed.employee_id);
  }, []);

  async function loadData(eid: string) {
    setLoading(true);
    try {
      const [empRes, leaveRes, loanRes, trainRes, payRes] = await Promise.all([
        fetch(`/api/admin?section=employees`).then(r => r.json()),
        fetch(`/api/admin?section=leave_requests`).then(r => r.json()),
        fetch(`/api/admin?section=loans`).then(r => r.json()),
        fetch(`/api/admin?section=training`).then(r => r.json()),
        fetch(`/api/payroll?section=my_payslips&employee_id=${eid}`).then(r => r.json()),
      ]);
      
      const emp = (empRes || []).find((e: any) => e.id === eid);
      const leaves = (leaveRes || []).filter((l: any) => l.employee_id === eid);
      const loans = (loanRes || []).filter((l: any) => l.employee_id === eid);
      const enrollments = (trainRes?.enrollments || []).filter((t: any) => t.employee_id === eid);
      
      setData({ employee: emp, leaves, loans, enrollments, payslips: payRes?.payslips || [] });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center text-slate-400">Redirecting...</div>;

  const tabs = [
    { key: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { key: "payslips", label: "Payslips", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { key: "leave", label: "Leave", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { key: "loans", label: "Loans", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" },
    { key: "training", label: "Training", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { key: "docs", label: "Documents", icon: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  ] as const;

  const emp = data?.employee;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              {user.name?.charAt(0) || "?"}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{user.name}</div>
              <div className="text-xs text-slate-500">{emp?.position || user.employee_id}</div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem("taliq_user"); window.location.href = "/"; }}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100">
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex gap-1 py-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${tab === t.key ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon}/></svg>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading your data...</div>
        ) : (
          <>
            {tab === "overview" && emp && (
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Department", value: emp.department, color: "blue" },
                    { label: "Grade", value: `${emp.grade || "-"} / Level ${emp.level || "-"}`, color: "emerald" },
                    { label: "Join Date", value: String(emp.join_date || "").slice(0, 10), color: "violet" },
                    { label: "Annual Leave", value: `${emp.annual_leave || 0} days`, color: "amber" },
                  ].map((s, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="text-xs text-slate-400">{s.label}</div>
                      <div className="font-bold text-slate-800 mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>
                
                {/* Personal info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ["Name", emp.name],
                      ["Name (AR)", emp.name_ar],
                      ["Employee ID", emp.id],
                      ["Email", emp.email],
                      ["Phone", emp.phone],
                      ["Nationality", emp.nationality],
                      ["Position", emp.position],
                      ["Manager", emp.manager_id || "None"],
                    ].map(([label, value], i) => (
                      <div key={i}>
                        <div className="text-xs text-slate-400">{label}</div>
                        <div className="text-slate-700 font-medium">{value || "-"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "payslips" && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">My Payslips</h3>
                {(!data?.payslips || data.payslips.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No payslips available</div>
                ) : (
                  data.payslips.map((ps: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="font-bold text-slate-800">{ps.period_label || ps.run_ref}</div>
                          <div className="text-xs text-slate-500">Run: {ps.run_ref}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700 text-lg">SAR {fmt(ps.net_pay)}</div>
                          <div className="text-xs text-slate-400">Net Pay</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <div className="font-semibold text-slate-500 mb-1">Earnings</div>
                          {(ps.earnings || []).map((e: any) => (
                            <div key={e.code} className="flex justify-between py-0.5">
                              <span className="text-slate-600">{e.name}</span>
                              <span className="font-mono">{fmt(e.amount)}</span>
                            </div>
                          ))}
                          <div className="font-bold text-green-700 border-t border-slate-100 pt-1 mt-1 flex justify-between">
                            <span>Total</span><span>{fmt(ps.total_earnings)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-500 mb-1">Deductions</div>
                          {(ps.deductions || []).map((d: any) => (
                            <div key={d.code} className="flex justify-between py-0.5">
                              <span className="text-slate-600">{d.name}</span>
                              <span className="font-mono text-red-600">{fmt(d.amount)}</span>
                            </div>
                          ))}
                          <div className="font-bold text-red-600 border-t border-slate-100 pt-1 mt-1 flex justify-between">
                            <span>Total</span><span>{fmt(ps.total_deductions)}</span>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-500 mb-1">Employer</div>
                          {(ps.employer_contributions || []).map((c: any) => (
                            <div key={c.code} className="flex justify-between py-0.5">
                              <span className="text-slate-600">{c.name}</span>
                              <span className="font-mono">{fmt(c.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "leave" && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Leave Requests</h3>
                  <div className="text-xs text-slate-500">Remaining: {emp?.annual_leave || 0} days annual</div>
                </div>
                {(!data?.leaves || data.leaves.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No leave requests</div>
                ) : (
                  data.leaves.map((l: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{l.leave_type} Leave</div>
                        <div className="text-xs text-slate-500">{String(l.start_date || "").slice(0,10)} to {String(l.end_date || "").slice(0,10)}</div>
                        {l.reason && <div className="text-xs text-slate-400 mt-1">{l.reason}</div>}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${l.status === "approved" ? "bg-green-50 text-green-700" : l.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                        {l.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "loans" && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">My Loans</h3>
                {(!data?.loans || data.loans.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No active loans</div>
                ) : (
                  data.loans.map((l: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{l.loan_type}</div>
                          <div className="text-xs text-slate-500">{l.ref}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${l.status === "active" ? "bg-blue-50 text-blue-700" : l.status === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {l.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                        <div><span className="text-slate-400">Amount</span><p className="font-bold text-slate-800">SAR {fmt(l.amount)}</p></div>
                        <div><span className="text-slate-400">Remaining</span><p className="font-bold text-red-600">SAR {fmt(l.remaining)}</p></div>
                        <div><span className="text-slate-400">Installment</span><p className="font-bold text-slate-800">SAR {fmt(l.monthly_installment)}</p></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "training" && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">My Training</h3>
                {(!data?.enrollments || data.enrollments.length === 0) ? (
                  <div className="text-center py-10 text-slate-400 text-sm">No training enrollments</div>
                ) : (
                  data.enrollments.map((t: any, i: number) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{t.course_title || t.course_id}</div>
                        <div className="text-xs text-slate-500">{t.provider || "Internal"}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${t.status === "completed" ? "bg-green-50 text-green-700" : t.status === "in_progress" ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-600"}`}>
                        {t.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "docs" && (
              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">My Documents</h3>
                <div className="text-center py-10 text-slate-400 text-sm">
                  Request documents via voice assistant or contact HR
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
