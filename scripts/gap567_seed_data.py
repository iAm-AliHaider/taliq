"""Gap #5, #6, #7: Seed performance reviews, training enrollments, fix probation dates"""
import psycopg2
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'

conn = psycopg2.connect(DB)
cur = conn.cursor()

# ── Gap #5: Performance reviews ──
# Schema: id, employee_id, reviewer_id, period, rating, goals_met, total_goals, strengths, improvements, comments, status, created_at
cur.execute("DELETE FROM performance_reviews")
print(f"Cleared {cur.rowcount} old reviews")

reviews = [
    ('E001', 'E003', '2025', 4.2, 8, 10, 'Technical leadership, problem solving', 'Delegation skills', 'Excellent year. Delivered 3 major projects.'),
    ('E002', 'E005', '2025', 4.5, 9, 10, 'HR strategy, people management', 'Data-driven decision making', 'Outstanding HR transformation.'),
    ('E003', 'E005', '2025', 4.0, 7, 9, 'Infrastructure management, security', 'Budget management', 'Strong IT leadership.'),
    ('E004', 'E003', '2025', 3.8, 6, 8, 'Financial analysis, attention to detail', 'Forecasting accuracy', 'Good performance with growth areas.'),
    ('E006', 'E002', '2025', 3.5, 5, 7, 'Recruitment, sourcing', 'Employer branding', 'Solid recruiter. Developing well.'),
    ('E007', 'E003', '2025', 4.3, 9, 10, 'DevOps, automation, reliability', 'Documentation', 'Exceptional. Zero-downtime deployments.'),
]

for eid, reviewer, period, rating, met, total, strengths, improvements, comments in reviews:
    cur.execute("""INSERT INTO performance_reviews 
        (employee_id, reviewer_id, period, rating, goals_met, total_goals, strengths, improvements, comments, status) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed')""",
        (eid, reviewer, period, rating, met, total, strengths, improvements, comments))
print(f"Seeded {len(reviews)} performance reviews")

# Goals table doesn't exist — create it
cur.execute("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='goals')")
if not cur.fetchone()[0]:
    cur.execute("""CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        employee_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'in_progress',
        progress FLOAT DEFAULT 0,
        due_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
    )""")
    print("Created goals table")

cur.execute("DELETE FROM goals")
goals = [
    ('E001', 'Complete AI integration project', 'Integrate GPT-4 into customer support', 'in_progress', 0.7, '2026-06-30'),
    ('E001', 'AWS Solutions Architect cert', 'Pass professional level exam', 'in_progress', 0.3, '2026-09-30'),
    ('E002', 'HRIS modernization', 'Deploy Taliq across all departments', 'in_progress', 0.85, '2026-06-30'),
    ('E002', 'Reduce turnover by 15%', 'Retention programs and exit analysis', 'in_progress', 0.5, '2026-12-31'),
    ('E003', 'Zero security incidents', 'SOC2 compliance, zero breaches', 'completed', 1.0, '2026-03-31'),
    ('E003', 'Cloud cost optimization 25%', 'Rightsizing and reserved instances', 'in_progress', 0.6, '2026-06-30'),
    ('E004', 'Automate financial reports', 'Automated monthly reporting pipeline', 'in_progress', 0.4, '2026-06-30'),
    ('E006', 'Fill 15 open positions', 'Complete Q2 approved headcount', 'in_progress', 0.6, '2026-06-30'),
    ('E007', 'CI/CD all microservices', 'Full pipeline automation with testing', 'completed', 1.0, '2026-03-31'),
    ('E007', 'DR drill quarterly', 'Quarterly disaster recovery exercises', 'in_progress', 0.5, '2026-12-31'),
]
for eid, title, desc, status, progress, due in goals:
    cur.execute("INSERT INTO goals (employee_id, title, description, status, progress, due_date) VALUES (%s,%s,%s,%s,%s,%s)",
        (eid, title, desc, status, progress, due))
print(f"Seeded {len(goals)} goals")

# ── Gap #6: Training enrollments ──
cur.execute("SELECT id, name FROM training_courses ORDER BY id LIMIT 10")
courses = cur.fetchall()
print(f"\n{len(courses)} training courses exist")

if courses:
    cur.execute("DELETE FROM training_enrollments")
    cids = [c[0] for c in courses]
    enrollments = [
        ('E001', cids[0], 'completed', '2026-01-15'),
        ('E002', cids[0], 'completed', '2026-01-15'),
        ('E003', cids[min(1,len(cids)-1)], 'completed', '2026-02-01'),
        ('E004', cids[0], 'in_progress', None),
        ('E006', cids[min(1,len(cids)-1)], 'in_progress', None),
        ('E007', cids[min(2,len(cids)-1)], 'enrolled', None),
        ('E001', cids[min(3,len(cids)-1)], 'enrolled', None),
        ('E002', cids[min(2,len(cids)-1)], 'in_progress', None),
    ]
    for eid, cid, status, completed in enrollments:
        if completed:
            cur.execute("INSERT INTO training_enrollments (employee_id, course_id, status, completed_at, enrolled_at) VALUES (%s,%s,%s,%s,NOW())",
                (eid, cid, status, completed))
        else:
            cur.execute("INSERT INTO training_enrollments (employee_id, course_id, status, enrolled_at) VALUES (%s,%s,%s,NOW())",
                (eid, cid, status))
    print(f"Seeded {len(enrollments)} enrollments")

# ── Gap #7: Fix probation dates ──
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='employees' AND column_name LIKE '%probation%'")
prob_cols = [r[0] for r in cur.fetchall()]
print(f"\nProbation cols: {prob_cols}")

if not prob_cols:
    cur.execute("ALTER TABLE employees ADD COLUMN probation_end DATE")
    cur.execute("UPDATE employees SET probation_end = join_date::date + INTERVAL '6 months'")
    prob_cols = ['probation_end']
    print("Added probation_end column + backfilled")

col = prob_cols[0]
# Make E004 and E006 have future/active probation
cur.execute(f"UPDATE employees SET join_date='2025-12-01', {col}='2026-06-01' WHERE id='E004'")
cur.execute(f"UPDATE employees SET join_date='2026-01-15', {col}='2026-07-15' WHERE id='E006'")
print(f"E004 probation_end=2026-06-01, E006 probation_end=2026-07-15 (active!)")

# Also update E005 join date to be realistic for CHRO
cur.execute(f"UPDATE employees SET {col}=NULL WHERE id='E005'")
print("E005 CHRO: probation cleared (executive)")

conn.commit()
conn.close()
print("\nGap #5, #6, #7 ALL DONE")
