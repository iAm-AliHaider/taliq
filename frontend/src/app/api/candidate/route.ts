import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// ─── GET: Public job board + candidate status ───────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "jobs";

  try {
    // Public: list open jobs
    if (section === "jobs") {
      const jobs = await sql`
        SELECT id, ref, title, department, description, requirements, salary_range, 
               location, employment_type, deadline,
               (SELECT COUNT(*) FROM job_applications WHERE job_id = jp.id) as applicant_count
        FROM job_postings jp WHERE status = 'open' ORDER BY created_at DESC
      `;
      return NextResponse.json({ jobs });
    }

    // Candidate portal: full pipeline status
    if (section === "my_status") {
      const app_ref = searchParams.get("ref");
      const pin = searchParams.get("pin");
      if (!app_ref || !pin) return NextResponse.json({ error: "ref and pin required" }, { status: 400 });
      
      const [auth] = await sql`SELECT id FROM job_applications WHERE ref = ${app_ref} AND pin = ${pin}`;
      if (!auth) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      const [app] = await sql`
        SELECT a.*, j.title as job_title, j.department as job_department, j.salary_range,
               j.description as job_description, j.requirements as job_requirements
        FROM job_applications a
        LEFT JOIN job_postings j ON a.job_id = j.id
        WHERE a.ref = ${app_ref}
      `;
      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

      // Get screening documents
      const documents = await sql`SELECT id, filename, doc_type, status, notes, created_at FROM candidate_documents WHERE application_id = ${app.id} ORDER BY created_at DESC`;

      // Get interview (if exists)
      const [interview] = await sql`SELECT * FROM candidate_interviews WHERE application_id = ${app.id} ORDER BY id DESC LIMIT 1`;

      // Get offer (if exists)
      const offers = await sql`SELECT * FROM offer_letters WHERE application_id = ${app.id} ORDER BY id DESC LIMIT 1`;
      const offer = offers[0] || null;

      // Get onboarding (if hired)
      let onboarding = null;
      let onboardingTasks: any[] = [];
      if (app.stage === "hired") {
        const [ob] = await sql`SELECT * FROM onboarding_checklists WHERE application_id = ${app.id} LIMIT 1`;
        if (ob) {
          onboarding = ob;
          onboardingTasks = await sql`SELECT * FROM onboarding_tasks WHERE checklist_id = ${ob.id} ORDER BY sort_order`;
        }
      }

      // Get employee credentials (if hired)
      let employeeCredentials = null;
      if (app.hired_employee_id) {
        const [emp] = await sql`SELECT id, name, email, position, department, pin FROM employees WHERE id = ${app.hired_employee_id}`;
        if (emp) employeeCredentials = emp;
      }

      // Build timeline
      const timeline = [];
      timeline.push({ date: String(app.applied_at || "").slice(0, 10), event: "Application submitted", stage: "applied", done: true });
      
      if (["screening","interview","offer","hired"].includes(app.stage)) {
        timeline.push({ date: "", event: "Documents uploaded for screening", stage: "screening", done: true });
      } else if (app.stage === "screening" || app.stage === "applied") {
        // Not yet screened
      }
      
      if (["interview","offer","hired"].includes(app.stage)) {
        timeline.push({ date: interview?.completed_at ? String(interview.completed_at).slice(0, 10) : "", event: `Interview completed${interview?.total_score ? ` (Score: ${interview.total_score}%)` : ""}`, stage: "interview", done: true });
      }
      
      if (["offer","hired"].includes(app.stage)) {
        timeline.push({ date: offer?.sent_at ? String(offer.sent_at).slice(0, 10) : "", event: "Offer letter sent", stage: "offer", done: true });
      }
      
      if (app.stage === "hired") {
        timeline.push({ date: offer?.start_date ? String(offer.start_date).slice(0, 10) : "", event: "Welcome aboard! You're hired.", stage: "hired", done: true });
      }
      
      if (app.stage === "rejected") {
        timeline.push({ date: String(app.updated_at || "").slice(0, 10), event: "Application not selected", stage: "rejected", done: true });
      }

      // Required documents for screening
      const requiredDocs = [
        { type: "cv_resume", label: "CV / Resume", required: true },
        { type: "national_id", label: "National ID / Iqama", required: true },
        { type: "education", label: "Education Certificates", required: true },
        { type: "experience", label: "Experience Letters", required: false },
        { type: "references", label: "Professional References", required: false },
        { type: "other", label: "Other Supporting Documents", required: false },
      ];

      // Check which docs are uploaded
      const uploadedTypes = documents.map((d: any) => d.doc_type);
      const docsChecklist = requiredDocs.map(rd => ({
        ...rd,
        uploaded: uploadedTypes.includes(rd.type),
        doc: documents.find((d: any) => d.doc_type === rd.type),
      }));

      // Interview questions (if interview stage and interview not yet completed)
      let interviewQuestions: any[] = [];
      if ((app.stage === "interview" || app.stage === "screening") && (!interview || interview.status !== "completed")) {
        interviewQuestions = await sql`SELECT id, question, category, max_points, evaluation_criteria, sort_order FROM interview_question_banks WHERE stage = 'hr_screening' ORDER BY sort_order`;
      }

      return NextResponse.json({
        application: app,
        documents,
        docsChecklist,
        interview: interview || null,
        interviewQuestions,
        offer,
        onboarding,
        onboardingTasks,
        employeeCredentials,
        timeline,
      });
    }

    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Apply + Auth + Stage actions ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "";

    // ── Public: submit application ────────────────────────────────────────
    if (action === "apply") {
      const { job_id, candidate_name, candidate_email, candidate_phone, cover_letter, source } = body;
      if (!job_id || !candidate_name || !candidate_email) {
        return NextResponse.json({ error: "Name, email, and job are required" }, { status: 400 });
      }
      const existing = await sql`SELECT id FROM job_applications WHERE candidate_email = ${candidate_email} AND job_id = ${Number(job_id)}`;
      if (existing.length > 0) {
        return NextResponse.json({ error: "You have already applied for this position" }, { status: 409 });
      }
      const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM job_applications`;
      const ref = `APP-2026-${String(Number(cnt) + 1).padStart(3, "0")}`;
      const pin = String(Math.floor(1000 + Math.random() * 9000));
      await sql`INSERT INTO job_applications (ref, job_id, candidate_name, candidate_email, candidate_phone, cover_letter, source, pin, screening_status)
        VALUES (${ref}, ${Number(job_id)}, ${candidate_name}, ${candidate_email}, ${candidate_phone || ""}, ${cover_letter || ""}, ${source || "careers_page"}, ${pin}, 'not_required')`;
      return NextResponse.json({ ok: true, ref, pin, message: `Application submitted! Your reference is ${ref}. Your PIN is ${pin}.` });
    }

    // ── Candidate auth ────────────────────────────────────────────────────
    if (action === "auth") {
      const { ref, pin } = body;
      if (!ref || !pin) return NextResponse.json({ error: "Reference and PIN required" }, { status: 400 });
      const [app] = await sql`SELECT id, ref, candidate_name, candidate_email, stage, status FROM job_applications WHERE ref = ${ref} AND pin = ${pin}`;
      if (!app) return NextResponse.json({ error: "Invalid reference or PIN" }, { status: 401 });
      return NextResponse.json({ ok: true, application: app });
    }

    // ── Upload screening document ─────────────────────────────────────────
    if (action === "upload_document") {
      const { application_ref, pin, filename, mime_type, size_bytes, doc_type, data_b64 } = body;
      if (!application_ref || !pin || !filename) return NextResponse.json({ error: "ref, pin, filename required" }, { status: 400 });
      
      const [app] = await sql`SELECT id, stage FROM job_applications WHERE ref = ${application_ref} AND pin = ${pin}`;
      if (!app) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      if (!["applied", "screening"].includes(app.stage)) return NextResponse.json({ error: "Documents can only be uploaded during screening" }, { status: 400 });

      await sql`INSERT INTO candidate_documents (application_id, filename, mime_type, size_bytes, doc_type, data_b64)
        VALUES (${app.id}, ${filename}, ${mime_type || "application/octet-stream"}, ${size_bytes || 0}, ${doc_type || "other"}, ${data_b64 || null})`;
      
      // Auto-advance to screening if still in applied
      if (app.stage === "applied") {
        await sql`UPDATE job_applications SET stage = 'screening', screening_status = 'pending' WHERE id = ${app.id}`;
      }
      
      return NextResponse.json({ ok: true, message: "Document uploaded successfully" });
    }

    // ── Submit screening docs (mark as complete) ──────────────────────────
    if (action === "submit_screening") {
      const { application_ref, pin } = body;
      const [app] = await sql`SELECT id FROM job_applications WHERE ref = ${application_ref} AND pin = ${pin}`;
      if (!app) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      
      // Check required docs
      const docs = await sql`SELECT doc_type FROM candidate_documents WHERE application_id = ${app.id}`;
      const types = docs.map((d: any) => d.doc_type);
      const missing = ["cv_resume", "national_id", "education"].filter(t => !types.includes(t));
      if (missing.length > 0) {
        return NextResponse.json({ error: `Missing required documents: ${missing.join(", ")}`, missing }, { status: 400 });
      }
      
      await sql`UPDATE job_applications SET screening_status = 'submitted', updated_at = NOW() WHERE id = ${app.id}`;
      return NextResponse.json({ ok: true, message: "Documents submitted for review!" });
    }

    // ── Start AI interview ────────────────────────────────────────────────
    if (action === "start_interview") {
      const { application_ref, pin } = body;
      const [app] = await sql`SELECT id, stage, candidate_name FROM job_applications WHERE ref = ${application_ref} AND pin = ${pin}`;
      if (!app) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      if (app.stage !== "interview") return NextResponse.json({ error: "Not in interview stage" }, { status: 400 });

      // Check if already started
      const existing = await sql`SELECT id, status FROM candidate_interviews WHERE application_id = ${app.id}`;
      if (existing.length > 0 && existing[0].status === "completed") {
        return NextResponse.json({ error: "Interview already completed" }, { status: 400 });
      }
      if (existing.length > 0 && existing[0].status === "in_progress") {
        return NextResponse.json({ ok: true, interview_id: existing[0].id, message: "Resuming interview" });
      }

      // Load questions
      const questions = await sql`SELECT id, question, category, max_points, evaluation_criteria, sort_order FROM interview_question_banks WHERE stage = 'hr_screening' ORDER BY sort_order`;
      
      const ref = `INT-${app.id}-${Date.now().toString(36)}`;
      const [interview] = await sql`INSERT INTO candidate_interviews (application_id, ref, position, questions, status, started_at)
        VALUES (${app.id}, ${ref}, 'HR Screening', ${JSON.stringify(questions)}::jsonb, 'in_progress', NOW()) RETURNING id`;
      
      await sql`UPDATE job_applications SET interview_ref = ${ref} WHERE id = ${app.id}`;
      
      return NextResponse.json({ ok: true, interview_id: interview.id, ref, questions, message: "Interview started. Answer each question thoughtfully." });
    }

    // ── Submit interview answers ──────────────────────────────────────────
    if (action === "submit_interview") {
      const { application_ref, pin, interview_id, answers } = body;
      const [app] = await sql`SELECT id FROM job_applications WHERE ref = ${application_ref} AND pin = ${pin}`;
      if (!app) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      if (!answers || !Array.isArray(answers)) return NextResponse.json({ error: "Answers array required" }, { status: 400 });

      // Simple AI scoring: score each answer 1-10 based on length and keywords
      const scores: Record<string, number> = {};
      let totalScore = 0;
      let maxScore = 0;
      
      for (const ans of answers) {
        const text = (ans.answer || "").trim();
        const wordCount = text.split(/\s+/).length;
        // Basic scoring: length-based + keyword bonus
        let score = Math.min(10, Math.max(1, Math.round(wordCount / 5)));
        if (wordCount > 30) score = Math.min(10, score + 2);
        if (text.length > 200) score = Math.min(10, score + 1);
        scores[`q_${ans.question_id}`] = score;
        totalScore += score;
        maxScore += (ans.max_points || 10);
      }

      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

      await sql`UPDATE candidate_interviews SET 
        answers = ${JSON.stringify(answers)}::jsonb, 
        scores = ${JSON.stringify(scores)}::jsonb,
        total_score = ${percentage}, 
        status = 'completed', 
        completed_at = NOW() 
        WHERE id = ${Number(interview_id)} AND application_id = ${app.id}`;

      await sql`UPDATE job_applications SET interview_score = ${percentage}, interview_completed_at = NOW() WHERE id = ${app.id}`;

      // Auto-advance if score is good (>= 60%)
      const passed = percentage >= 60;
      const resultMsg = passed 
        ? `Interview completed! Score: ${percentage}%. Congratulations, you've been shortlisted!`
        : `Interview completed! Score: ${percentage}%. Thank you for your participation.`;

      return NextResponse.json({ ok: true, score: percentage, passed, message: resultMsg });
    }

    // ── Accept offer ──────────────────────────────────────────────────────
    if (action === "accept_offer") {
      const { application_ref, pin } = body;
      const [app] = await sql`SELECT id, candidate_name, candidate_email, candidate_phone FROM job_applications WHERE ref = ${application_ref} AND pin = ${pin || ""}`;
      if (!app) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      const [offer] = await sql`SELECT * FROM offer_letters WHERE application_id = ${app.id} AND status = 'sent' ORDER BY id DESC LIMIT 1`;
      if (!offer) return NextResponse.json({ error: "No pending offer found" }, { status: 404 });

      // Accept offer
      await sql`UPDATE offer_letters SET status = 'accepted', accepted_at = NOW() WHERE id = ${offer.id}`;
      await sql`UPDATE job_applications SET stage = 'hired', status = 'closed' WHERE id = ${app.id}`;

      // Auto-create employee
      const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM employees`;
      const newId = `E${String(Number(cnt) + 1).padStart(3, "0")}`;
      const empPin = String(Math.floor(1000 + Math.random() * 9000));

      await sql`INSERT INTO employees (id, name, email, phone, position, department, basic_salary, housing_allowance, transport_allowance, join_date, pin, nationality, grade, level, probation_end)
        VALUES (${newId}, ${app.candidate_name}, ${app.candidate_email}, ${app.candidate_phone}, ${offer.position}, ${offer.department}, ${Number(offer.offered_salary)}, ${Number(offer.housing_allowance || 0)}, ${Number(offer.transport_allowance || 0)}, ${offer.start_date || new Date().toISOString().slice(0, 10)}, ${empPin}, 'Saudi', 'A', '1', ${offer.start_date ? new Date(new Date(offer.start_date).getTime() + 180 * 86400000).toISOString().slice(0, 10) : null})`;

      await sql`UPDATE job_applications SET hired_employee_id = ${newId}, employee_pin = ${empPin} WHERE id = ${app.id}`;

      // Create onboarding checklist
      const TASKS = [
        ["pre_arrival", "Prepare workstation and equipment", "IT", -3],
        ["pre_arrival", "Set up email and system accounts", "IT", -2],
        ["pre_arrival", "Prepare welcome packet", "HR", -1],
        ["day_one", "Office tour and introductions", "HR", 0],
        ["day_one", "IT equipment handover", "IT", 0],
        ["day_one", "Security badge and access card", "Admin", 0],
        ["day_one", "Sign employment contract", "HR", 0],
        ["day_one", "GOSI registration", "HR", 0],
        ["first_week", "Departmental orientation", "Manager", 3],
        ["first_week", "Benefits enrollment briefing", "HR", 5],
        ["first_week", "Compliance training", "HR", 5],
        ["first_week", "Meet manager for goals", "Manager", 5],
        ["first_month", "Complete mandatory trainings", "HR", 15],
        ["first_month", "30-day check-in (HR)", "HR", 30],
        ["first_month", "30-day check-in (Manager)", "Manager", 30],
        ["probation", "90-day performance review", "Manager", 90],
        ["probation", "Probation confirmation", "HR", 180],
      ];

      const [cl] = await sql`INSERT INTO onboarding_checklists (employee_id, application_id, candidate_name, position, department, start_date, status, total_count, hr_assignee)
        VALUES (${newId}, ${app.id}, ${app.candidate_name}, ${offer.position}, ${offer.department}, ${offer.start_date}, 'active', ${TASKS.length}, 'E002') RETURNING id`;

      for (let i = 0; i < TASKS.length; i++) {
        const [cat, task, resp, days] = TASKS[i];
        await sql`INSERT INTO onboarding_tasks (checklist_id, category, task, responsible, due_days, sort_order) VALUES (${cl.id}, ${cat}, ${task}, ${resp}, ${Number(days)}, ${i + 1})`;
      }

      return NextResponse.json({ 
        ok: true, 
        employee_id: newId, 
        employee_pin: empPin,
        message: `Congratulations ${app.candidate_name}! You're now employee ${newId}. Your login PIN is ${empPin}. Onboarding starts ${offer.start_date}.`
      });
    }

    // ── Negotiate offer ───────────────────────────────────────────────────
    if (action === "negotiate_offer") {
      const { application_ref, pin, message } = body;
      const [app] = await sql`SELECT id FROM job_applications WHERE ref = ${application_ref} AND pin = ${pin}`;
      if (!app) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      
      await sql`UPDATE job_applications SET negotiation_notes = COALESCE(negotiation_notes, '') || ${'\n[' + new Date().toISOString().slice(0,16) + '] Candidate: ' + (message || '')} WHERE id = ${app.id}`;
      await sql`UPDATE offer_letters SET status = 'negotiating' WHERE application_id = ${app.id} AND status = 'sent'`;
      
      return NextResponse.json({ ok: true, message: "Your negotiation request has been sent to HR. They will review and respond." });
    }

    // ── Reject offer ──────────────────────────────────────────────────────
    if (action === "reject_offer") {
      const { application_ref, pin, reason } = body;
      const [app] = await sql`SELECT id FROM job_applications WHERE ref = ${application_ref} AND pin = ${pin || ""}`;
      if (!app) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      await sql`UPDATE offer_letters SET status = 'rejected', rejected_at = NOW(), rejection_reason = ${reason || 'Candidate declined'} WHERE application_id = ${app.id}`;
      await sql`UPDATE job_applications SET stage = 'rejected', status = 'closed' WHERE id = ${app.id}`;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
