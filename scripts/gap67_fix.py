"""Gap #6: Create training_enrollments table + seed. Gap #7: Fix probation dates."""
import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DB)
cur = conn.cursor()

# ── Gap #6: Training enrollments ──
# Check if table exists with proper schema
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='training_enrollments' ORDER BY ordinal_position")
te_cols = [r[0] for r in cur.fetchall()]
print("training_enrollments cols:", te_cols)

if not te_cols:
    cur.execute("DROP TABLE IF EXISTS training_enrollments")
    cur.execute("""CREATE TABLE training_enrollments (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL,
        course_id INTEGER REFERENCES training_courses(id),
        status TEXT DEFAULT 'enrolled',
        enrolled_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        score FLOAT,
        certificate_url TEXT
    )""")
    print("Created training_enrollments table")

cur.execute("SELECT id, title FROM training_courses ORDER BY id")
courses = cur.fetchall()
cids = [c[0] for c in courses]
print(f"{len(courses)} courses available")

cur.execute("DELETE FROM training_enrollments")
enrollments = [
    ('E001', cids[0], 'completed', '2026-01-15', 92.0),
    ('E002', cids[0], 'completed', '2026-01-15', 88.0),
    ('E003', cids[min(1,len(cids)-1)], 'completed', '2026-02-01', 95.0),
    ('E004', cids[0], 'in_progress', None, None),
    ('E006', cids[min(1,len(cids)-1)], 'in_progress', None, None),
    ('E007', cids[min(2,len(cids)-1)], 'enrolled', None, None),
    ('E001', cids[min(3,len(cids)-1)], 'enrolled', None, None),
    ('E002', cids[min(2,len(cids)-1)], 'in_progress', None, None),
    ('E003', cids[min(4,len(cids)-1)], 'enrolled', None, None),
    ('E005', cids[min(1,len(cids)-1)], 'completed', '2026-02-15', 97.0),
]
for eid, cid, status, completed, score in enrollments:
    if completed:
        cur.execute("INSERT INTO training_enrollments (employee_id, course_id, status, completed_at, score, enrolled_at) VALUES (%s,%s,%s,%s,%s,NOW())",
            (eid, cid, status, completed, score))
    else:
        cur.execute("INSERT INTO training_enrollments (employee_id, course_id, status, enrolled_at) VALUES (%s,%s,%s,NOW())",
            (eid, cid, status))
print(f"Seeded {len(enrollments)} enrollments")

# ── Gap #7: Fix probation dates ──
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='employees' AND column_name LIKE '%probation%'")
prob_cols = [r[0] for r in cur.fetchall()]

if not prob_cols:
    cur.execute("ALTER TABLE employees ADD COLUMN probation_end DATE")
    cur.execute("UPDATE employees SET probation_end = join_date::date + INTERVAL '6 months'")
    prob_cols = ['probation_end']
    print("\nAdded probation_end column + backfilled")

col = prob_cols[0]
# E004 and E006 get future probation end dates (active probation for demo)
cur.execute(f"UPDATE employees SET join_date='2025-12-01', {col}='2026-06-01' WHERE id='E004'")
cur.execute(f"UPDATE employees SET join_date='2026-01-15', {col}='2026-07-15' WHERE id='E006'")
cur.execute(f"UPDATE employees SET {col}=NULL WHERE id='E005'")  # CHRO - no probation
print(f"\nProbation: E004->2026-06-01, E006->2026-07-15 (active), E005->cleared")

conn.commit()
conn.close()
print("\nGap #6, #7 DONE")
