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

    // Candidate portal: my application status
    if (section === "my_status") {
      const app_ref = searchParams.get("ref");
      const pin = searchParams.get("pin");
      if (!app_ref || !pin) return NextResponse.json({ error: "ref and pin required" }, { status: 400 });
      
      // Verify PIN
      const [auth] = await sql`SELECT id FROM job_applications WHERE ref = ${app_ref} AND pin = ${pin}`;
      if (!auth) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      
      const [app] = await sql`
        SELECT a.*, j.title as job_title, j.department as job_department, j.salary_range,
               i.status as interview_status, i.average_score as interview_score, 
               i.completed_at as interview_completed
        FROM job_applications a
        LEFT JOIN job_postings j ON a.job_id = j.id
        LEFT JOIN interviews i ON a.interview_id = i.id
        WHERE a.ref = ${app_ref}
      `;
      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

      // Get offer if exists
      const offers = await sql`
        SELECT ref, position, offered_salary, housing_allowance, transport_allowance,
               start_date, contract_type, status, sent_at
        FROM offer_letters WHERE application_id = ${app.id} ORDER BY id DESC LIMIT 1
      `;

      // Get onboarding if exists
      const onboarding = await sql`
        SELECT oc.*, 
               (SELECT COUNT(*) FROM onboarding_tasks WHERE checklist_id = oc.id) as total,
               (SELECT COUNT(*) FROM onboarding_tasks WHERE checklist_id = oc.id AND status = 'completed') as done
        FROM onboarding_checklists oc WHERE oc.application_id = ${app.id} LIMIT 1
      `;

      // Build timeline
      const timeline = [
        { date: String(app.applied_at || "").slice(0, 10), event: "Application submitted", status: "done" },
      ];
      if (["screening","interview","offer","hired"].includes(app.stage)) {
        timeline.push({ date: "", event: "Application screened", status: "done" });
      }
      if (["interview","offer","hired"].includes(app.stage)) {
        timeline.push({ date: String(app.interview_completed || "").slice(0, 10), event: "Interview completed", status: "done" });
      }
      if (["offer","hired"].includes(app.stage)) {
        timeline.push({ date: String(offers[0]?.sent_at || "").slice(0, 10), event: "Offer letter sent", status: "done" });
      }
      if (app.stage === "hired") {
        timeline.push({ date: String(offers[0]?.start_date || "").slice(0, 10), event: "Hired! Welcome aboard", status: "done" });
      }
      if (app.stage === "rejected") {
        timeline.push({ date: String(app.updated_at || "").slice(0, 10), event: "Application not selected", status: "rejected" });
      }

      // Next step based on current stage
      const nextSteps: Record<string, string> = {
        applied: "Your application is under review. We'll contact you soon.",
        screening: "Your profile is being reviewed by the hiring team.",
        interview: "Interview stage — our team will schedule your interview.",
        offer: "You have a pending offer letter. Please review and respond.",
        hired: "Congratulations! Check your onboarding checklist below.",
        rejected: "Thank you for your interest. We encourage you to apply again in the future.",
      };

      return NextResponse.json({
        application: app,
        offer: offers[0] || null,
        onboarding: onboarding[0] || null,
        timeline,
        nextStep: nextSteps[app.stage] || "",
      });
    }

    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ─── POST: Apply + Auth + Offer response ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "";

    // Public: submit application
    if (action === "apply") {
      const { job_id, candidate_name, candidate_email, candidate_phone, cover_letter, source } = body;
      if (!job_id || !candidate_name || !candidate_email) {
        return NextResponse.json({ error: "Name, email, and job are required" }, { status: 400 });
      }

      // Check for duplicate
      const existing = await sql`SELECT id FROM job_applications WHERE candidate_email = ${candidate_email} AND job_id = ${Number(job_id)}`;
      if (existing.length > 0) {
        return NextResponse.json({ error: "You have already applied for this position" }, { status: 409 });
      }

      // Generate ref and PIN
      const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM job_applications`;
      const ref = `APP-2026-${String(Number(cnt) + 1).padStart(3, "0")}`;
      const pin = String(Math.floor(1000 + Math.random() * 9000));

      await sql`INSERT INTO job_applications (ref, job_id, candidate_name, candidate_email, candidate_phone, cover_letter, source, pin)
        VALUES (${ref}, ${Number(job_id)}, ${candidate_name}, ${candidate_email}, ${candidate_phone || ""}, ${cover_letter || ""}, ${source || "careers_page"}, ${pin})`;

      return NextResponse.json({ ok: true, ref, pin, message: `Application submitted! Your reference is ${ref}. Your PIN is ${pin} — save it to track your application.` });
    }

    // Candidate auth
    if (action === "auth") {
      const { ref, pin } = body;
      if (!ref || !pin) return NextResponse.json({ error: "Reference and PIN required" }, { status: 400 });

      const [app] = await sql`SELECT id, ref, candidate_name, candidate_email, stage, status FROM job_applications WHERE ref = ${ref} AND pin = ${pin}`;
      if (!app) return NextResponse.json({ error: "Invalid reference or PIN" }, { status: 401 });

      return NextResponse.json({ ok: true, application: app });
    }

    // Candidate: accept offer
    if (action === "accept_offer") {
      const { application_ref } = body;
      const [app] = await sql`SELECT id FROM job_applications WHERE ref = ${application_ref}`;
      if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

      await sql`UPDATE offer_letters SET status = 'accepted', accepted_at = NOW() WHERE application_id = ${app.id} AND status = 'sent'`;
      await sql`UPDATE job_applications SET stage = 'hired', status = 'closed' WHERE id = ${app.id}`;

      // Auto-create employee
      const [offer] = await sql`SELECT * FROM offer_letters WHERE application_id = ${app.id} ORDER BY id DESC LIMIT 1`;
      const [appFull] = await sql`SELECT * FROM job_applications WHERE id = ${app.id}`;
      
      if (offer && appFull) {
        const [{ cnt }] = await sql`SELECT COUNT(*) as cnt FROM employees`;
        const newId = `E${String(Number(cnt) + 1).padStart(3, "0")}`;
        
        await sql`INSERT INTO employees (id, name, email, phone, position, department, basic_salary, housing_allowance, transport_allowance, join_date, pin, nationality, grade, level, probation_end)
          VALUES (${newId}, ${appFull.candidate_name}, ${appFull.candidate_email}, ${appFull.candidate_phone}, ${offer.position}, ${offer.department}, ${Number(offer.offered_salary)}, ${Number(offer.housing_allowance || 0)}, ${Number(offer.transport_allowance || 0)}, ${offer.start_date || new Date().toISOString().slice(0, 10)}, '1234', 'Saudi', 'A', '1', ${offer.start_date ? new Date(new Date(offer.start_date).getTime() + 180 * 86400000).toISOString().slice(0, 10) : null})`;
        
        await sql`UPDATE job_applications SET hired_employee_id = ${newId} WHERE id = ${app.id}`;

        // Create onboarding checklist
        const ONBOARDING_TASKS = [
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
          VALUES (${newId}, ${app.id}, ${appFull.candidate_name}, ${offer.position}, ${offer.department}, ${offer.start_date}, 'active', ${ONBOARDING_TASKS.length}, 'E002') RETURNING id`;

        for (let i = 0; i < ONBOARDING_TASKS.length; i++) {
          const [cat, task, resp, days] = ONBOARDING_TASKS[i];
          await sql`INSERT INTO onboarding_tasks (checklist_id, category, task, responsible, due_days, sort_order) VALUES (${cl.id}, ${cat}, ${task}, ${resp}, ${Number(days)}, ${i + 1})`;
        }

        return NextResponse.json({ ok: true, message: `Congratulations! You're now employee ${newId}. Your onboarding starts on ${offer.start_date}. Check your onboarding checklist!`, employee_id: newId });
      }

      return NextResponse.json({ ok: true, message: "Offer accepted!" });
    }

    // Candidate: reject offer
    if (action === "reject_offer") {
      const { application_ref, reason } = body;
      const [app] = await sql`SELECT id FROM job_applications WHERE ref = ${application_ref}`;
      if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await sql`UPDATE offer_letters SET status = 'rejected', rejected_at = NOW(), rejection_reason = ${reason || 'Candidate declined'} WHERE application_id = ${app.id}`;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
