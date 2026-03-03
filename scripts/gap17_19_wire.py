"""Wire DashboardCharts + FileUploads into admin page."""
import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx")
src = f.read_text("utf-8")

# ─── 1. Add imports ───────────────────────────────────────────────────────────
if "DashboardCharts" not in src:
    src = src.replace(
        'import dynamic from "next/dynamic";',
        'import dynamic from "next/dynamic";\nimport DashboardCharts from "./dashboard-charts";\nimport FileUploads from "./file-uploads";'
    )
    print("Added imports")

# ─── 2. Add state vars ────────────────────────────────────────────────────────
if "dashboardData" not in src:
    # Find a good place to insert — after geofenceData
    src = src.replace(
        "  const [geofenceData, setGeofenceData] = useState<any>(null);",
        "  const [geofenceData, setGeofenceData] = useState<any>(null);\n  const [dashboardData, setDashboardData] = useState<any>(null);\n  const [uploadsData, setUploadsData] = useState<any>(null);"
    )
    print("Added state vars")

# ─── 3. Wire fetches on tab switch ───────────────────────────────────────────
if 'section=dashboard' not in src:
    src = src.replace(
        'if (t === "Geofencing") adminFetch("section=geofences").then(d => d && setGeofenceData(d));',
        'if (t === "Geofencing") adminFetch("section=geofences").then(d => d && setGeofenceData(d));\n      if (t === "Overview") adminFetch("section=dashboard").then(d => d && setDashboardData(d));\n      if (t === "Documents") adminFetch("section=uploads").then(d => d && setUploadsData(d));'
    )
    print("Wired tab fetches")
else:
    print("Tab fetches already wired")

# Also load dashboard on initial load (when Overview is the default tab)
if 'section=dashboard' in src and '"section=dashboard"' in src:
    pass  # good

# ─── 4. Enhance Overview tab — add charts below existing stats ────────────────
OLD_OVERVIEW_END = (
    '            </div>\n'
    '          </div>\n'
    '        )}\n'
    '\n'
    '        {/* EMPLOYEES with Manager Assignment */}'
)
NEW_OVERVIEW_END = (
    '            </div>\n'
    '          </div>\n'
    '          <DashboardCharts data={dashboardData} />\n'
    '        )}\n'
    '\n'
    '        {/* EMPLOYEES with Manager Assignment */}'
)
if "DashboardCharts data={dashboardData}" not in src:
    if OLD_OVERVIEW_END in src:
        src = src.replace(OLD_OVERVIEW_END, NEW_OVERVIEW_END)
        print("Wired DashboardCharts into Overview tab")
    else:
        # Fallback: find the overview closing braces
        print("WARNING: Could not find Overview end anchor, trying fallback")
        # Try finding the unique text
        idx = src.find('{/* EMPLOYEES with Manager Assignment */}')
        if idx > 0:
            # Insert before this comment
            insert = '          <DashboardCharts data={dashboardData} />\n        )}\n\n        '
            # Find the )} before this comment
            close_idx = src.rfind('        )}', 0, idx)
            if close_idx > 0:
                src = src[:close_idx] + '          <DashboardCharts data={dashboardData} />\n' + src[close_idx:]
                print("Wired DashboardCharts (fallback)")

# ─── 5. Replace Documents tab with FileUploads panel ─────────────────────────
OLD_DOCS = (
    '        {tab === "Documents" && (\n'
    '          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">\n'
    '            <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Document Requests</h3></div>'
)
NEW_DOCS_START = (
    '        {tab === "Documents" && (\n'
    '          <div className="space-y-4">\n'
    '            {/* Document requests (approvals) */}\n'
    '            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">\n'
    '            <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Document Requests</h3></div>'
)

# Find and wrap the existing Documents tab content
if "FileUploads" not in src:
    # Find where the Documents tab ends (the closing )} )
    doc_start = src.find('        {tab === "Documents" && (')
    # Find the next tab section after Documents
    next_tab = src.find('        {/* GRIEVANCES */', doc_start)
    if doc_start > 0 and next_tab > 0:
        old_doc_block = src[doc_start:next_tab]
        # Rebuild: keep existing doc requests, add FileUploads below
        new_doc_block = (
            '        {tab === "Documents" && (\n'
            '          <div className="space-y-5">\n'
            '            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">\n'
            '              <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">Document Requests (Approvals)</h3></div>\n'
            '              <div className="divide-y divide-gray-50">\n'
            '              {documents.map(d => (\n'
            '                <div key={d.ref} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">\n'
            '                  <div>\n'
            '                    <p className="text-sm font-medium text-gray-900">{d.employeeName}</p>\n'
            '                    <p className="text-[10px] text-gray-400">{d.ref} - {d.documentType}</p>\n'
            '                  </div>\n'
            '                  <div className="flex items-center gap-2">\n'
            '                    <StatusBadge status={d.status} />\n'
            '                    {d.status !== "ready" && d.status !== "rejected" && (\n'
            '                      <div className="flex gap-1">\n'
            '                        <button onClick={() => handleApprove("document", d.ref, "ready")}\n'
            '                          className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-600">Ready</button>\n'
            '                        <button onClick={() => handleApprove("document", d.ref, "rejected")}\n'
            '                          className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] text-red-600">Reject</button>\n'
            '                      </div>\n'
            '                    )}\n'
            '                  </div>\n'
            '                </div>\n'
            '              ))}\n'
            '              {documents.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No document requests</div>}\n'
            '              </div>\n'
            '            </div>\n'
            '            <FileUploads\n'
            '              data={uploadsData}\n'
            '              employees={employees}\n'
            '              onRefresh={() => adminFetch("section=uploads").then(d => d && setUploadsData(d))}\n'
            '            />\n'
            '          </div>\n'
            '        )}\n'
            '\n'
        )
        src = src[:doc_start] + new_doc_block + src[next_tab:]
        print("Replaced Documents tab with Documents + FileUploads")
    else:
        print("WARNING: Could not find Documents tab boundaries")

# ─── 6. Ensure dashboard loads on Overview (default tab) ─────────────────────
# Load dashboard on initial useEffect when overview loads
if 'section=dashboard' not in src:
    src = src.replace(
        'adminFetch("section=overview").then(d => d && setOverview(d));',
        'adminFetch("section=overview").then(d => d && setOverview(d));\n      adminFetch("section=dashboard").then(d => d && setDashboardData(d));'
    )
    print("Wired dashboard fetch on initial load")

f.write_text(src, "utf-8")
print("Done patching admin page")
