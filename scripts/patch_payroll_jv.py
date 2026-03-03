import pathlib

f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\admin\payroll-jv.tsx")
src = f.read_text("utf-8")

# Fix GOSI rate in the info note
src = src.replace(
    "GOSI rates (9% employee, 11.75% employer)",
    "GOSI rates (9.75% employee, 11.75% employer for Saudis; 0%/2% for non-Saudis)"
)

f.write_text(src, "utf-8")
print("Patched payroll-jv.tsx: GOSI rate note fixed")
