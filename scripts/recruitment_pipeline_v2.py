"""Recruitment Pipeline V2 — full connected flow DB changes"""
import psycopg2, json
DB = 'postgresql://neondb_owner:npg_laesRAW8Dui1@ep-plain-sound-aib5z9bz-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
conn = psycopg2.connect(DB)
cur = conn.cursor()

# 1. Add screening document uploads table (candidate-uploaded docs)
cur.execute("""
CREATE TABLE IF NOT EXISTS candidate_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES job_applications(id),
    filename TEXT NOT NULL,
    mime_type TEXT,
    size_bytes INTEGER,
    doc_type TEXT DEFAULT 'other',
    data_b64 TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("Created candidate_documents table")

# 2. Add interview tracking columns to job_applications
for col, typ in [
    ('interview_ref', 'TEXT'),
    ('interview_score', 'NUMERIC'),
    ('interview_completed_at', 'TIMESTAMP'),
    ('offer_id', 'INTEGER'),
    ('screening_status', 'TEXT DEFAULT \'pending\''),
    ('screening_notes', 'TEXT'),
    ('negotiation_notes', 'TEXT'),
    ('employee_pin', 'TEXT'),
]:
    try:
        cur.execute(f"ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS {col} {typ}")
    except Exception as e:
        print(f"  Skip {col}: {e}")
        conn.rollback()
print("Added pipeline columns to job_applications")

# 3. Create candidate_interviews table for AI interview results
cur.execute("""
CREATE TABLE IF NOT EXISTS candidate_interviews (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES job_applications(id),
    ref TEXT UNIQUE,
    position TEXT,
    stage TEXT DEFAULT 'hr_screening',
    questions JSONB DEFAULT '[]'::jsonb,
    answers JSONB DEFAULT '[]'::jsonb,
    scores JSONB DEFAULT '{}'::jsonb,
    total_score NUMERIC,
    max_score NUMERIC DEFAULT 100,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    reviewed_by TEXT,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
)
""")
print("Created candidate_interviews table")

# 4. Seed interview questions templates
cur.execute("""
CREATE TABLE IF NOT EXISTS interview_question_banks (
    id SERIAL PRIMARY KEY,
    stage TEXT NOT NULL,
    department TEXT,
    question TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    max_points INTEGER DEFAULT 10,
    evaluation_criteria TEXT,
    sort_order INTEGER DEFAULT 0
)
""")

# Seed some default questions
questions = [
    ('hr_screening', None, 'Tell us about yourself and your experience.', 'communication', 10, 'Clarity, relevance, confidence', 1),
    ('hr_screening', None, 'Why are you interested in this position?', 'motivation', 10, 'Research, enthusiasm, alignment', 2),
    ('hr_screening', None, 'What are your salary expectations?', 'expectations', 5, 'Realistic, flexible, market-aware', 3),
    ('hr_screening', None, 'When can you start?', 'availability', 5, 'Availability, notice period', 4),
    ('technical', None, 'Describe a challenging project you worked on.', 'technical', 15, 'Complexity, problem-solving, results', 1),
    ('technical', None, 'How do you stay current with technology trends?', 'learning', 10, 'Continuous learning, resources', 2),
    ('technical', None, 'How do you handle tight deadlines?', 'soft_skills', 10, 'Time management, prioritization', 3),
    ('culture_fit', None, 'How do you handle disagreements with colleagues?', 'teamwork', 10, 'Empathy, communication, resolution', 1),
    ('culture_fit', None, 'Describe your ideal work environment.', 'culture', 10, 'Alignment with company values', 2),
    ('culture_fit', None, 'Where do you see yourself in 5 years?', 'growth', 10, 'Ambition, realistic goals', 3),
]
for q in questions:
    cur.execute("SELECT id FROM interview_question_banks WHERE question=%s AND stage=%s", (q[2], q[0]))
    if not cur.fetchone():
        cur.execute("INSERT INTO interview_question_banks (stage, department, question, category, max_points, evaluation_criteria, sort_order) VALUES (%s,%s,%s,%s,%s,%s,%s)", q)
print(f"Seeded {len(questions)} interview questions")

# 5. Update existing applications with screening status
cur.execute("UPDATE job_applications SET screening_status='approved' WHERE stage IN ('interview','offer','hired')")
cur.execute("UPDATE job_applications SET screening_status='pending' WHERE stage='screening'")
cur.execute("UPDATE job_applications SET screening_status='not_required' WHERE stage='applied'")
print("Updated screening statuses")

conn.commit()
conn.close()
print("DB updates complete")
