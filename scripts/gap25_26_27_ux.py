"""Gap #25 (skeletons) + #26 (confirm dialogs) + #27 (login branding)"""
import pathlib, re

# ── Gap #25: Add skeleton component + use in admin page ──────────────────────
admin = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx")
src = admin.read_text("utf-8")

# Add Skeleton component after imports
skeleton_comp = """
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />;
}
function SkeletonCard() {
  return (
    <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}
function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
"""

if "function Skeleton(" not in src:
    src = src.replace("function StatCard(", skeleton_comp + "\nfunction StatCard(")
    print("Added Skeleton components")

# Replace plain "Loading..." divs with skeleton cards in Overview
src = src.replace(
    '<div className="text-center py-20 text-gray-400">Loading...</div>',
    '<div className="grid grid-cols-2 md:grid-cols-4 gap-4"><SkeletonCard/><SkeletonCard/><SkeletonCard/><SkeletonCard/></div><div className="mt-4"><SkeletonTable rows={6}/></div>'
)

admin.write_text(src, "utf-8")
print("Gap #25 DONE - Skeletons added")

# ── Gap #26: Add confirm dialogs to destructive actions ───────────────────────
# Check admin page for delete buttons without confirm
src2 = admin.read_text("utf-8")

# Pattern: onClick functions that call delete/remove without confirm
# Add window.confirm check to delete actions that are inline onClick handlers
count = 0
# Look for inline delete onClick patterns - add confirm wrapper
patterns = [
    ("onClick={() => handleDeleteAnnouncement(", "onClick={() => { if(!window.confirm('Delete this announcement?')) return; handleDeleteAnnouncement("),
    ("onClick={() => handleDeleteCourse(", "onClick={() => { if(!window.confirm('Delete this course?')) return; handleDeleteCourse("),
    ("onClick={() => handleDeleteExam(", "onClick={() => { if(!window.confirm('Delete this exam?')) return; handleDeleteExam("),
    ("onClick={() => handleDeleteGeofence(", "onClick={() => { if(!window.confirm('Delete this geofence?')) return; handleDeleteGeofence("),
]

for old, new in patterns:
    if old in src2 and new not in src2:
        # Need to close the wrapper - find the ) after and add }
        idx = src2.find(old)
        if idx >= 0:
            # Find the closing )} of this onClick
            end = src2.find("}", idx + len(old))
            if end >= 0 and src2[end-1] == ")":
                src2 = src2[:idx] + new + src2[idx + len(old):]
                count += 1

admin.write_text(src2, "utf-8")
print(f"Gap #26 DONE - {count} delete confirmations added (window.confirm)")

# ── Gap #27: Enhance login page branding ────────────────────────────────────
login = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\components\LoginPage.tsx")
lsrc = login.read_text("utf-8")

# Replace the logo+title section with richer branding
old_brand = """          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 mb-4">
              <span className="text-white text-2xl font-bold">ت</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("auth.title", lang)}</h1>
            <p className="text-sm text-gray-500 mt-1">{t("auth.subtitle", lang)}</p>
          </div>"""

new_brand = """          <div className="text-center mb-8">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-500/25 mb-5">
              <span className="text-white text-4xl font-black" style={{fontFamily:"serif"}}>ط</span>
            </div>
            {/* Brand name */}
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Taliq</h1>
            <p className="text-sm font-medium text-emerald-600 mt-0.5">طليق — نظام إدارة الموارد البشرية</p>
            <p className="text-xs text-gray-400 mt-2">{t("auth.subtitle", lang)}</p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {["Voice-First", "Saudi Labor Law", "GOSI Compliant", "WPS Ready"].map(f => (
                <span key={f} className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-semibold">{f}</span>
              ))}
            </div>
          </div>"""

if "طليق" not in lsrc:
    lsrc = lsrc.replace(old_brand, new_brand)
    print("Gap #27 DONE - Login branding enhanced")
else:
    print("Gap #27 already done")

login.write_text(lsrc, "utf-8")
print("All UX gaps patched")
