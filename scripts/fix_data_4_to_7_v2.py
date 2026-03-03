"""Fix items 4-7 — details column is JSON."""
import psycopg2, json, sys
sys.stdout.reconfigure(encoding="utf-8")

conn = psycopg2.connect("postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require")
conn.autocommit = True
cur = conn.cursor()

# 4. Audit log — details is JSON
print("[4/7] Seeding audit log...")
entries = [
    ("E005", "login", "auth", "E005", {"action": "Admin login to dashboard"}),
    ("E005", "create_employee", "employees", "E007", {"name": "Rajesh Kumar", "department": "IT"}),
    ("E002", "approve_leave", "leave_requests", "LR-2026-003", {"employee": "Ahmed", "days": 5, "type": "annual"}),
    ("E005", "update_policy", "policies", "gosi", {"field": "employee_rate", "old": 9.0, "new": 9.75}),
    ("E005", "run_payroll", "payroll_runs", "PR-2026-04", {"employees": 7, "gross": 158625}),
    ("E005", "post_payroll", "payroll_runs", "PR-2026-04", {"status": "posted", "loans_decremented": True}),
    ("E002", "create_letter", "letters", "LTR-2026-001", {"type": "salary_certificate", "employee": "E001"}),
    ("E005", "create_announcement", "announcements", "1", {"title": "Ramadan Working Hours"}),
    ("E003", "approve_expense", "expenses", "EXP-2026-001", {"amount": 2500, "currency": "SAR"}),
    ("E005", "assign_asset", "assets", "AST-001", {"asset": "MacBook Pro", "employee": "E001"}),
    ("E002", "update_employee", "employees", "E006", {"field": "probation_end", "value": "2026-04-15"}),
    ("E005", "generate_jv", "journal_vouchers", "JV-PR-2026-04", {"debit": 175737, "credit": 175737}),
]
for actor, action, entity_type, entity_id, details in entries:
    cur.execute("""
        INSERT INTO audit_log (timestamp, actor_id, action, entity_type, entity_id, details, ip_address)
        VALUES (NOW() - interval '1 hour' * (random() * 720)::int, %s, %s, %s, %s, %s::jsonb, '192.168.1.10')
    """, (actor, action, entity_type, entity_id, json.dumps(details)))
print(f"  Seeded {len(entries)} entries")

# 5. Performance reviews + goals
print("\n[5/7] Seeding performance reviews & goals...")
reviews = [
    ("E001", "E002", "2025-Q4", 4.2, 3, 4, "Strong technical skills, reliable", "Needs to improve documentation", "Excellent year overall", "completed"),
    ("E002", "E005", "2025-Q4", 4.5, 4, 4, "Outstanding HR leadership", "Could delegate more", "Promoted to senior", "completed"),
    ("E004", "E002", "2025-Q4", 3.8, 2, 3, "Analytical, detail-oriented", "Communication with team", "Good first year", "completed"),
    ("E006", "E002", "2025-Q4", 3.5, 2, 3, "Fast learner, proactive", "Needs more recruitment experience", "Solid start", "completed"),
    ("E007", "E003", "2025-Q4", 4.0, 3, 4, "Excellent DevOps expertise", "Language barrier occasionally", "Valuable addition", "completed"),
    ("E001", "E002", "2026-Q1", 0, 0, 4, "", "", "Pending Q1 review", "pending"),
    ("E004", "E002", "2026-Q1", 0, 0, 3, "", "", "Pending Q1 review", "pending"),
]
for eid, rev, period, rating, met, total, strengths, improvements, comments, status in reviews:
    cur.execute("""
        INSERT INTO performance_reviews (employee_id, reviewer_id, period, rating, goals_met, total_goals, strengths, improvements, comments, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW() - interval '1 day' * (random() * 60)::int)
    """, (eid, rev, period, rating, met, total, strengths, improvements, comments, status))

goals = [
    ("E001", "Complete AWS Solutions Architect certification", "Pass exam by June 2026", 60, "in_progress", "2026-06-30"),
    ("E001", "Reduce server downtime by 20%", "Achieve 99.9% uptime Q1", 40, "in_progress", "2026-03-31"),
    ("E002", "Implement 360-degree feedback system", "Roll out to all departments", 0, "not_started", "2026-06-30"),
    ("E002", "Reduce time-to-hire to under 30 days", "From current 45 days average", 30, "in_progress", "2026-04-30"),
    ("E004", "Automate monthly financial closing", "Reduce close from 5 to 2 days", 70, "in_progress", "2026-03-31"),
    ("E004", "Complete SOCPA certification", "Saudi CPA equivalent", 0, "not_started", "2026-09-30"),
    ("E006", "Master the ATS platform", "Full proficiency in recruitment tools", 100, "completed", "2026-02-28"),
    ("E007", "Build infrastructure monitoring dashboard", "Real-time alerts + metrics", 50, "in_progress", "2026-04-30"),
]
for eid, goal, target, progress, status, due in goals:
    cur.execute("""
        INSERT INTO performance_goals (employee_id, goal, target, progress, status, due_date, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, NOW() - interval '1 day' * (random() * 30)::int)
    """, (eid, goal, target, progress, status, due))
print(f"  {len(reviews)} reviews + {len(goals)} goals")

# 6. Employee trainings
print("\n[6/7] Seeding training enrollments...")
cur.execute("SELECT id FROM training_courses ORDER BY id")
cids = [r[0] for r in cur.fetchall()]
if len(cids) >= 4:
    enrollments = [
        ("E001", cids[0], "2026-01-05", "2026-01-15", 92, "CERT-2026-001", "completed"),
        ("E001", cids[2], "2026-02-01", None, None, None, "in_progress"),
        ("E002", cids[1], "2025-12-10", "2026-02-01", 88, "CERT-2026-002", "completed"),
        ("E002", cids[3], "2026-02-15", None, None, None, "enrolled"),
        ("E004", cids[0], "2026-01-10", "2026-01-20", 95, "CERT-2026-003", "completed"),
        ("E004", cids[1], "2026-02-20", None, None, None, "enrolled"),
        ("E006", cids[0], "2026-01-20", None, None, None, "in_progress"),
        ("E006", cids[1], "2026-02-25", None, None, None, "enrolled"),
        ("E007", cids[2], "2026-01-15", None, None, None, "in_progress"),
        ("E007", cids[0], "2025-12-15", "2026-02-10", 85, "CERT-2026-004", "completed"),
    ]
    for eid, cid, enrolled, completed, score, cert, status in enrollments:
        cur.execute("""
            INSERT INTO employee_trainings (employee_id, course_id, enrollment_date, completion_date, score, certificate_ref, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (eid, cid, enrolled, completed, score, cert, status))
    print(f"  {len(enrollments)} enrollments")

# 7. Probation (already updated in previous run — verify)
print("\n[7/7] Verifying probation...")
cur.execute("SELECT c.employee_id, e.name, c.probation_end FROM contracts c JOIN employees e ON e.id = c.employee_id ORDER BY c.probation_end DESC")
for r in cur.fetchall():
    print(f"  {r[0]} {r[1]}: {r[2]}")

# Final
print("\n=== FINAL ===")
for t in ['audit_log', 'performance_reviews', 'performance_goals', 'employee_trainings', 'eos_provisions', 'payroll_runs']:
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    print(f"  {t}: {cur.fetchone()[0]}")

cur.close(); conn.close()
print("\nDone!")
