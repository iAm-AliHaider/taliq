"""Gap #13 + #14: Overtime UI + Adjustments UI in payroll-extras"""
import pathlib, re

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\payroll-extras.tsx")
src = f.read_text("utf-8")

# 1. Expand tab union type
src = src.replace(
    'useState<"payslips"|"wps"|"gosi"|"anomalies">("payslips")',
    'useState<"payslips"|"wps"|"gosi"|"anomalies"|"overtime"|"adjustments">("payslips")'
)

# 2. Add state vars after existing state declarations
src = src.replace(
    "  const [loaded, setLoaded] = useState<Record<string, boolean>>({});",
    """  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [overtime, setOvertime] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [adjEmp, setAdjEmp] = useState("");
  const [adjCode, setAdjCode] = useState("");
  const [adjAmt, setAdjAmt] = useState("");
  const [adjNote, setAdjNote] = useState("");
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjMsg, setAdjMsg] = useState("");"""
)

# 3. Add load + action functions before switchTab
extra_fns = """
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

"""
src = src.replace("  function switchTab(t: typeof tab) {", extra_fns + "  function switchTab(t: typeof tab) {")

# 4. Wire new tabs in switchTab
src = src.replace(
    '    if (t === "anomalies") loadAnomalies();\n  }',
    '    if (t === "anomalies") loadAnomalies();\n    if (t === "overtime") loadOvertime();\n    if (t === "adjustments") loadAdjustments();\n  }'
)

# 5. Add tab buttons
src = src.replace(
    '{(["payslips","wps","gosi","anomalies"] as const).map(t => (',
    '{(["payslips","wps","gosi","overtime","adjustments","anomalies"] as const).map(t => ('
)
src = src.replace(
    '{t === "payslips" ? "Payslips" : t === "wps" ? "WPS SIF" : t === "gosi" ? "GOSI Report" : "Anomalies"}',
    '{t === "payslips" ? "Payslips" : t === "wps" ? "WPS SIF" : t === "gosi" ? "GOSI" : t === "overtime" ? "Overtime" : t === "adjustments" ? "Adjustments" : "Anomalies"}'
)

# 6. Write UI panels directly (no f-strings to avoid brace escaping)
OVERTIME_PANEL = r"""
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
"""

# Insert panels before closing div of content area
src = src.replace(
    "      </div>\n    </div>\n  );\n}",
    OVERTIME_PANEL + "\n      </div>\n    </div>\n  );\n}"
)

f.write_text(src, "utf-8")
print("Gap #13 + #14 DONE - Overtime and Adjustments tabs added")
