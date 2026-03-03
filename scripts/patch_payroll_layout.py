import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\payroll-jv.tsx"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

# Fix: PayrollExtras needs col-span-12 and should be OUTSIDE the grid, not inside
old = '        {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}\n      </div>'
new = '      </div>\n      {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}'

if old in src:
    src = src.replace(old, new, 1)
    print("[OK] Moved PayrollExtras outside grid")
else:
    print("[WARN] Pattern not found — checking alternate...")
    # Try with \r\n
    old2 = '        {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}\r\n      </div>'
    new2 = '      </div>\r\n      {selectedRun && <PayrollExtras runId={selectedRun.id} runRef={selectedRun.ref} />}'
    if old2 in src:
        src = src.replace(old2, new2, 1)
        print("[OK] Moved PayrollExtras outside grid (CRLF)")
    else:
        print("[ERR] Could not find anchor")
        # Debug: find the PayrollExtras line
        for i, line in enumerate(src.split('\n')):
            if 'PayrollExtras' in line:
                print(f"  Line {i+1}: {line.strip()}")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("Done")
