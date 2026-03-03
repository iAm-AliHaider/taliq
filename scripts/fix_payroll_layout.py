import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\payroll-jv.tsx"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# Move PayrollExtras outside the grid — it's currently inside the grid cols-12 div
old = '        {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}\n      </div>'
new = '      </div>\n      {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}'

if old in src:
    src = src.replace(old, new, 1)
    print("[OK] Moved PayrollExtras outside grid to full-width")
else:
    print("[WARN] Pattern not found, trying alternate...")
    # Try without exact newline
    old2 = '{selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}\n      </div>\n\n      {/* '
    if old2 in src:
        src = src.replace(old2, '</div>\n      {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}\n\n      {/* ', 1)
        print("[OK] Fixed (alternate)")
    else:
        print("[ERR] Could not find pattern")
        # Show context around PayrollExtras
        idx = src.index("PayrollExtras")
        print(repr(src[idx-100:idx+100]))

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("Done")
