import sys
sys.stdout.reconfigure(encoding="utf-8")

path = r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\page.tsx"

with open(path, "r", encoding="utf-8") as f:
    src = f.read()

if 'import PaycodesGL' in src:
    print("Already patched")
else:
    # Insert after the last import TemplatesPanel line
    old = 'import TemplatesPanel from "./templates";\n'
    new = 'import TemplatesPanel from "./templates";\nimport PaycodesGL from "./paycodes-gl";\nimport PayrollJV from "./payroll-jv";\n'
    if old in src:
        src = src.replace(old, new, 1)
        print("[OK] Imports added")
    else:
        # fallback: insert after first import line
        lines = src.split('\n')
        # Find last import line
        last_import = 0
        for i, line in enumerate(lines):
            if line.startswith('import '):
                last_import = i
        lines.insert(last_import + 1, 'import PaycodesGL from "./paycodes-gl";')
        lines.insert(last_import + 2, 'import PayrollJV from "./payroll-jv";')
        src = '\n'.join(lines)
        print("[OK] Imports added (fallback)")

with open(path, "w", encoding="utf-8") as f:
    f.write(src)
print("Done")
