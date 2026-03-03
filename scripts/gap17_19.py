"""Gap #17: File upload table + API. Gap #19: Dashboard chart data API."""
import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DB)
cur = conn.cursor()

# ─── Gap #17: File uploads table ─────────────────────────────────────────────
cur.execute("""
CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    employee_id TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    category TEXT DEFAULT 'general',
    description TEXT,
    data_b64 TEXT,
    blob_url TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("Created uploads table")

# Seed a couple of sample docs
cur.execute("""
INSERT INTO uploads (employee_id, filename, mime_type, size_bytes, category, description, uploaded_by)
VALUES
  ('E001', 'employment_contract.pdf', 'application/pdf', 245000, 'contract', 'Original employment contract', 'admin'),
  ('E001', 'national_id.jpg', 'image/jpeg', 180000, 'identity', 'National ID scan', 'admin'),
  ('E002', 'hr_certification.pdf', 'application/pdf', 312000, 'certificate', 'SHRM certification', 'E002'),
  ('E003', 'degree_certificate.pdf', 'application/pdf', 520000, 'education', 'B.Sc Computer Science', 'E003'),
  ('E007', 'iqama_scan.pdf', 'application/pdf', 195000, 'identity', 'Iqama residence permit', 'admin')
ON CONFLICT DO NOTHING
""")
print("Seeded 5 sample uploads")

# ─── Gap #19: Dashboard data views ──────────────────────────────────────────
# Monthly headcount (simulate 6 months)
cur.execute("""
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id SERIAL PRIMARY KEY,
    metric TEXT NOT NULL,
    period TEXT NOT NULL,
    value NUMERIC,
    detail JSONB,
    created_at TIMESTAMP DEFAULT NOW()
)
""")

# Seed 6 months of metrics
import json
months = ['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03']
headcounts = [5, 5, 6, 6, 7, 7]
payroll_costs = [95000, 95000, 115000, 118000, 158625, 158625]
leave_used = [8, 12, 15, 10, 14, 6]
turnover = [0, 0, 1, 0, 0, 0]

for i, m in enumerate(months):
    for metric, val in [('headcount', headcounts[i]), ('payroll_cost', payroll_costs[i]), ('leave_days_used', leave_used[i]), ('turnover', turnover[i])]:
        cur.execute("SELECT id FROM dashboard_metrics WHERE metric=%s AND period=%s", (metric, m))
        if not cur.fetchone():
            cur.execute("INSERT INTO dashboard_metrics (metric, period, value) VALUES (%s, %s, %s)", (metric, m, val))

print("Seeded 24 dashboard metrics (6 months x 4 metrics)")

conn.commit()
conn.close()
print("DB done")
