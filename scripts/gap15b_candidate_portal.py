"""Add candidate_pin column + API auth for candidate portal"""
import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DB)
cur = conn.cursor()

# Add PIN + tracking columns to job_applications
for col, typ, default in [
    ('pin', 'TEXT', None),
    ('portal_token', 'TEXT', None),
]:
    cur.execute(f"ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS {col} {typ}")

# Set PINs for seeded candidates
pins = [
    ('APP-2026-001', '1234'),
    ('APP-2026-002', '5678'),
    ('APP-2026-003', '1111'),
    ('APP-2026-004', '2222'),
    ('APP-2026-005', '3333'),
    ('APP-2026-006', '4444'),
    ('APP-2026-007', '5555'),
]
for ref, pin in pins:
    cur.execute("UPDATE job_applications SET pin=%s WHERE ref=%s", (pin, ref))
print(f"Set PINs for {len(pins)} candidates")

# Add hired_employee_id to track conversion
cur.execute("ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS hired_employee_id TEXT")
print("Added hired_employee_id column")

conn.commit()
conn.close()
print("DB updates done")
