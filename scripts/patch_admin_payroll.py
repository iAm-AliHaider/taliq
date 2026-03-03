"""Patch admin/page.tsx to add Paycodes & GL and Payroll JV tabs."""
import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# 1. Add imports at top (after existing imports)
old_import = '"use client";\nimport { useState, useEffect } from "react";'
new_import = '''"use client";
import { useState, useEffect } from "react";
import PaycodesGL from "./paycodes-gl";
import PayrollJV from "./payroll-jv";'''

if 'import PaycodesGL' not in src:
    src = src.replace(old_import, new_import, 1)
    print("[OK] Added imports")
else:
    print("[SKIP] Imports already present")

# 2. Add tabs to TABS array
old_tabs = '"Audit Log"];'
new_tabs = '"Audit Log", "Paycodes & GL", "Payroll JV"];'

if '"Paycodes & GL"' not in src:
    src = src.replace(old_tabs, new_tabs, 1)
    print("[OK] Added tabs to TABS array")
else:
    print("[SKIP] Tabs already in array")

# 3. Add tab panels before closing </div> of tab content
old_panel = '        {tab === "Audit Log" && ('
new_panel = '''        {tab === "Paycodes & GL" && (
          <div className="p-1">
            <PaycodesGL />
          </div>
        )}
        {tab === "Payroll JV" && (
          <div className="p-1">
            <PayrollJV />
          </div>
        )}
        {tab === "Audit Log" && ('''

if '"Paycodes & GL"' not in src or 'PaycodesGL' not in src.split('{tab === "Paycodes & GL"')[0]:
    # Try inserting before Audit Log section
    if old_panel in src:
        src = src.replace(old_panel, new_panel, 1)
        print("[OK] Added tab panels")
    else:
        print("[WARN] Could not find Audit Log panel anchor — trying alternate pattern")
        # Try alternate
        alt = '        {tab === "Audit Log"'
        if alt in src:
            src = src.replace(alt, new_panel.rstrip(' && (') + "\n" + alt, 1)
            print("[OK] Added tab panels (alternate)")
else:
    print("[SKIP] Tab panels already present")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("\nPatch complete!")
