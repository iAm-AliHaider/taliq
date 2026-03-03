import pathlib
f = pathlib.Path(r"C:\Users\AI\.openclaw\workspace\taliq\frontend\src\app\api\candidate\route.ts")
src = f.read_text("utf-8")

# Fix the escaped backticks/dollars from previous patch
src = src.replace(
    r'const [auth] = await sql\`SELECT id FROM job_applications WHERE ref = \${app_ref} AND pin = \${pin}\`;',
    'const [auth] = await sql`SELECT id FROM job_applications WHERE ref = ${app_ref} AND pin = ${pin}`;'
)

f.write_text(src, "utf-8")
print("Fixed backtick escaping")
