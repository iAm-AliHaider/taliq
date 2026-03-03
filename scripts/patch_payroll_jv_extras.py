import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\payroll-jv.tsx"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# 1. Add import for PayrollExtras
if "PayrollExtras" not in src:
    src = src.replace(
        '"use client";\nimport { useState, useEffect } from "react";',
        '"use client";\nimport { useState, useEffect } from "react";\nimport PayrollExtras from "./payroll-extras";'
    )
    print("[OK] Added PayrollExtras import")

# 2. Add postPayroll function after approveRun
if "post_payroll" not in src:
    old = "  async function selectRun"
    new = """  async function postRun(run_id: number) {
    const r = await fetch("/api/payroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "post_payroll", run_id }),
    });
    const data = await r.json();
    if (data.error) flash(data.error, "err");
    else flash("Payroll posted + loans decremented + EOS provisions calculated");
    loadRuns();
  }

  async function selectRun"""
    src = src.replace(old, new, 1)
    print("[OK] Added postRun function")

# 3. Add Post button after Approve button
if "Post to ERP" not in src:
    old_approve = """                {run.status === "draft" && (
                  <button onClick={e => { e.stopPropagation(); approveRun(run.id); }}
                    className="mt-2 w-full py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100">
                    Approve Run
                  </button>
                )}"""
    new_approve = """                {run.status === "draft" && (
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
                )}"""
    src = src.replace(old_approve, new_approve, 1)
    print("[OK] Added Post to ERP button")

# 4. Add PayrollExtras component below JV panel
if "<PayrollExtras" not in src:
    # Find the closing of the JV panel section and add extras after it
    old_end = "          )}\n        </div>\n      </div>"
    new_end = """          )}
        </div>
        {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}
      </div>"""
    # Be more specific - find the right closing
    src = src.replace(old_end, new_end, 1)
    print("[OK] Added PayrollExtras component")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("\nDone!")
