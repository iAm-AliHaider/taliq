"""Gap #24: Group 29 admin tabs into 6 categories with 2-level nav"""
import pathlib, re

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx")
src = f.read_text("utf-8")

# Replace the flat TABS array with a grouped structure
old_tabs = '''const TABS = ["Overview", "Employees", "Leave Requests", "Loans", "Documents", "Grievances", "Announcements", "Settings", "Letters", "Contracts", "Assets", "Shifts", "Iqama/Visa", "Exits", "Reports", "Recruitment", "Interviews", "Geofencing", "Workflows", "Training", "Exams", "Templates", "Audit Log", "Paycodes & GL", "Payroll JV", "Org Chart", "Salary History", "EOS Provisions", "Probation"];'''

new_tabs = '''const TAB_GROUPS: Record<string, string[]> = {
  "Core":       ["Overview", "Employees", "Reports", "Org Chart"],
  "HR Ops":     ["Leave Requests", "Loans", "Documents", "Grievances", "Announcements"],
  "People":     ["Training", "Exams", "Interviews", "Recruitment", "Probation"],
  "Payroll":    ["Paycodes & GL", "Payroll JV", "Salary History", "EOS Provisions"],
  "Compliance": ["Contracts", "Letters", "Iqama/Visa", "Exits", "Geofencing", "Workflows"],
  "Admin":      ["Assets", "Shifts", "Templates", "Audit Log", "Settings"],
};
const TABS = Object.values(TAB_GROUPS).flat();'''

src = src.replace(old_tabs, new_tabs)
print("Replaced TABS with TAB_GROUPS")

# Now replace the tab bar rendering
old_tabbar = '''        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{t}</button>
          ))}
        </div>'''

new_tabbar = '''        {/* ── 2-level grouped tab nav ── */}
        <div className="mb-5 space-y-2">
          {/* Category row */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
            {Object.keys(TAB_GROUPS).map(grp => {
              const active = TAB_GROUPS[grp].includes(tab);
              return (
                <button key={grp} onClick={() => setTab(TAB_GROUPS[grp][0])}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${active ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:bg-white hover:text-gray-800"}`}>
                  {grp}
                </button>
              );
            })}
          </div>
          {/* Sub-tab row — only show current group's tabs */}
          {Object.entries(TAB_GROUPS).map(([grp, tabs]) => {
            if (!tabs.includes(tab) && tab !== tabs[0]) {
              const activeGrp = Object.entries(TAB_GROUPS).find(([,t]) => t.includes(tab));
              if (!activeGrp || activeGrp[0] !== grp) return null;
            }
            const activeGrp = Object.entries(TAB_GROUPS).find(([,t]) => t.includes(tab));
            if (!activeGrp || activeGrp[0] !== grp) return null;
            return (
              <div key={grp} className="flex gap-1 overflow-x-auto pb-0.5">
                {tabs.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${tab === t ? "bg-white text-gray-900 border-gray-200 shadow-sm" : "text-gray-500 border-transparent hover:bg-gray-100"}`}>
                    {t}
                  </button>
                ))}
              </div>
            );
          })}
        </div>'''

src = src.replace(old_tabbar, new_tabbar)
print("Replaced tab bar with 2-level grouped nav")

f.write_text(src, "utf-8")
print("Gap #24 DONE")
