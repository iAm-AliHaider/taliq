"use client";
import { useState, useEffect, useRef } from "react";

const STAGES = ["applied","screening","interview","offer","hired"] as const;
type Stage = typeof STAGES[number] | "rejected";

const STAGE_CONFIG: Record<string, { label: string; color: string; pct: number }> = {
  applied:   { label: "Applied",   color: "bg-slate-500",   pct: 10 },
  screening: { label: "Screening", color: "bg-blue-500",    pct: 25 },
  interview: { label: "Interview", color: "bg-amber-500",   pct: 50 },
  offer:     { label: "Offer",     color: "bg-violet-500",  pct: 75 },
  hired:     { label: "Hired!",    color: "bg-emerald-500", pct: 100 },
  rejected:  { label: "Closed",    color: "bg-red-400",     pct: 0 },
};

const DOC_LABELS: Record<string, string> = {
  cv_resume: "CV / Resume",
  national_id: "National ID / Iqama",
  education: "Education Certificates",
  experience: "Experience Letters",
  references: "Professional References",
  other: "Other Supporting Documents",
};

export default function CandidatePortal() {
  const [authed, setAuthed] = useState(false);
  const [ref, setRef] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState("");

  // Interview state
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);
  const [interviewResult, setInterviewResult] = useState<any>(null);

  // Offer state
  const [negotiateMsg, setNegotiateMsg] = useState("");
  const [offerAction, setOfferAction] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState("cv_resume");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("taliq_candidate");
    if (saved) { const p = JSON.parse(saved); setRef(p.ref); setPin(p.pin); login(p.ref, p.pin); }
  }, []);

  async function login(r: string, p: string) {
    setLoading(true); setError("");
    const res = await fetch("/api/candidate?action=auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: r, pin: p })
    }).then(r => r.json());
    if (res.ok) {
      localStorage.setItem("taliq_candidate", JSON.stringify({ ref: r, pin: p }));
      setAuthed(true); setPin(p);
      loadStatus(r, p);
    } else { setError(res.error || "Invalid credentials"); }
    setLoading(false);
  }

  async function loadStatus(r: string, p: string) {
    const res = await fetch(`/api/candidate?section=my_status&ref=${r}&pin=${p}`).then(r => r.json());
    if (!res.error) setData(res);
  }

  async function post(action: string, extra: any = {}) {
    return fetch(`/api/candidate?action=${action}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_ref: ref, pin, ...extra })
    }).then(r => r.json());
  }

  // Document upload handler
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1] || "");
        reader.readAsDataURL(file);
      });
      await post("upload_document", { filename: file.name, mime_type: file.type, size_bytes: file.size, doc_type: uploadType, data_b64: b64 });
    }
    setUploading(false);
    loadStatus(ref, pin);
  }

  // Submit screening
  async function submitScreening() {
    const res = await post("submit_screening");
    if (res.ok) { setMsg(res.message); loadStatus(ref, pin); }
    else setMsg(res.error || "Error");
    setTimeout(() => setMsg(""), 5000);
  }

  // Start interview
  async function startInterview() {
    const res = await post("start_interview");
    if (res.ok) {
      setInterviewStarted(true);
      setInterviewQuestions(res.questions || []);
    } else { setMsg(res.error || res.message || "Error"); setTimeout(() => setMsg(""), 4000); }
  }

  // Submit interview
  async function submitInterview() {
    setInterviewSubmitting(true);
    const ansArray = interviewQuestions.map(q => ({
      question_id: q.id, question: q.question, answer: answers[q.id] || "", max_points: q.max_points
    }));
    const res = await post("submit_interview", { interview_id: data?.interview?.id, answers: ansArray });
    setInterviewSubmitting(false);
    if (res.ok) { setInterviewResult(res); loadStatus(ref, pin); }
    else { setMsg(res.error || "Error"); }
  }

  // Offer actions
  async function acceptOffer() {
    setOfferAction(true);
    const res = await post("accept_offer");
    setOfferAction(false);
    if (res.ok) { setMsg(res.message || "Offer accepted!"); loadStatus(ref, pin); }
    else { setMsg(res.error || "Error"); }
  }

  async function negotiateOffer() {
    if (!negotiateMsg.trim()) return;
    setOfferAction(true);
    const res = await post("negotiate_offer", { message: negotiateMsg });
    setOfferAction(false);
    if (res.ok) { setMsg(res.message); setNegotiateMsg(""); loadStatus(ref, pin); }
    else { setMsg(res.error || "Error"); }
  }

  async function rejectOffer() {
    if (!window.confirm("Are you sure you want to decline this offer?")) return;
    await post("reject_offer", { reason: "Candidate declined via portal" });
    loadStatus(ref, pin);
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); login(ref, pin); }
  function logout() { localStorage.removeItem("taliq_candidate"); setAuthed(false); setData(null); setRef(""); setPin(""); }

  const app = data?.application;
  const stage = STAGE_CONFIG[app?.stage as string] || STAGE_CONFIG.applied;

  // ── Login ──────────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg mb-4">
            <span className="text-white text-2xl font-black" style={{fontFamily:"serif"}}>ط</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Candidate Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Track your application journey</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Application Reference</label>
            <input value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="APP-2026-001"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">PIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => { if (/^\d*$/.test(e.target.value)) setPin(e.target.value); }} placeholder="4-digit PIN"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400" required />
          </div>
          {error && <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg py-2">{error}</p>}
          <button type="submit" disabled={loading || ref.length < 5 || pin.length !== 4}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-50 transition">
            {loading ? "Checking..." : "View My Application"}
          </button>
        </form>
        <div className="text-center mt-6">
          <a href="/careers" className="text-sm text-emerald-600 hover:underline font-medium">Looking for open positions? Visit Careers</a>
        </div>
      </div>
    </div>
  );

  if (!data) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading...</div></div>;

  // ── Portal Dashboard ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with progress */}
      <div className={`${stage.color} text-white`}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-xs font-mono">{app.ref}</p>
              <h1 className="text-2xl font-bold mt-1">{app.candidate_name}</h1>
              <p className="text-white/80 text-sm">{app.job_title} &middot; {app.job_department}</p>
            </div>
            <button onClick={logout} className="text-white/60 hover:text-white text-xs px-3 py-1 rounded-lg border border-white/20">Logout</button>
          </div>
          {/* Stage progress */}
          <div className="flex items-center gap-1 mt-4">
            {STAGES.map((s, i) => {
              const isActive = s === app.stage;
              const isDone = STAGES.indexOf(app.stage) > i;
              return (
                <div key={s} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-all ${isDone || isActive ? "bg-white" : "bg-white/20"}`} />
                  <p className={`text-[9px] mt-1 text-center capitalize ${isActive ? "text-white font-bold" : isDone ? "text-white/70" : "text-white/30"}`}>{s}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {msg && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 font-medium">{msg}</div>}

        {/* ── SCREENING STAGE: Document Upload ─────────────────────────────── */}
        {(app.stage === "applied" || app.stage === "screening") && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Document Upload for Screening
              </h3>
              <p className="text-xs text-slate-500 mt-1">Upload the required documents to proceed with your application. Items marked * are mandatory.</p>
            </div>

            {/* Document checklist */}
            <div className="space-y-2">
              {(data.docsChecklist || []).map((doc: any) => (
                <div key={doc.type} className={`flex items-center justify-between p-3 rounded-xl border ${doc.uploaded ? "border-emerald-200 bg-emerald-50" : doc.required ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${doc.uploaded ? "bg-emerald-500" : "bg-slate-200"}`}>
                      {doc.uploaded ? <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg> : <span className="text-[10px] text-slate-400">?</span>}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{doc.label}{doc.required && " *"}</div>
                      {doc.uploaded && doc.doc && <div className="text-[10px] text-emerald-600">{doc.doc.filename}</div>}
                    </div>
                  </div>
                  {!doc.uploaded && (
                    <button onClick={() => { setUploadType(doc.type); fileRef.current?.click(); }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                      Upload
                    </button>
                  )}
                </div>
              ))}
            </div>

            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => handleFileUpload(e.target.files)} />

            {uploading && <p className="text-sm text-blue-600 font-semibold text-center">Uploading...</p>}

            {/* Submit for screening */}
            {(data.docsChecklist || []).filter((d: any) => d.required && d.uploaded).length >= 3 && app.screening_status !== "submitted" && (
              <button onClick={submitScreening}
                className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition">
                Submit Documents for Review
              </button>
            )}

            {app.screening_status === "submitted" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-sm font-semibold text-blue-700">Documents submitted — under review by HR</p>
                <p className="text-xs text-blue-500 mt-1">You&apos;ll be notified when screening is complete</p>
              </div>
            )}
          </div>
        )}

        {/* ── INTERVIEW STAGE ─────────────────────────────────────────────── */}
        {app.stage === "interview" && !data.interview?.status?.includes("completed") && !interviewResult && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              AI Interview
            </h3>

            {!interviewStarted ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-slate-600">You&apos;ve been shortlisted! Complete the AI-powered interview to move to the next stage.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  <strong>Tips:</strong> Answer each question thoroughly. Write at least 2-3 sentences per answer. Be specific about your experience and achievements.
                </div>
                <button onClick={startInterview}
                  className="px-8 py-3 rounded-xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition">
                  Start Interview
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Answer each question below. Take your time — quality matters more than speed.</p>
                {interviewQuestions.map((q, i) => (
                  <div key={q.id} className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-white bg-amber-500 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{i+1}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{q.question}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Category: {q.category} &middot; Max {q.max_points} points</p>
                      </div>
                    </div>
                    <textarea value={answers[q.id] || ""} onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                      rows={4} placeholder="Type your answer here..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
                    <div className="text-right text-[10px] text-slate-400">{(answers[q.id] || "").split(/\s+/).filter(Boolean).length} words</div>
                  </div>
                ))}
                <button onClick={submitInterview} disabled={interviewSubmitting || Object.keys(answers).length < interviewQuestions.length}
                  className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600 disabled:opacity-50 transition">
                  {interviewSubmitting ? "Evaluating..." : "Submit Interview"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Interview result card */}
        {(interviewResult || data.interview?.status === "completed") && app.stage === "interview" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3">Interview Results</h3>
            <div className="text-center py-4">
              <div className={`text-4xl font-black ${(data.interview?.total_score || interviewResult?.score || 0) >= 60 ? "text-emerald-600" : "text-red-500"}`}>
                {data.interview?.total_score || interviewResult?.score || 0}%
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {(data.interview?.total_score || interviewResult?.score || 0) >= 60 
                  ? "Congratulations! You passed. HR will review and send an offer."
                  : "Thank you for participating. We'll be in touch."}
              </p>
            </div>
          </div>
        )}

        {/* ── OFFER STAGE ─────────────────────────────────────────────────── */}
        {app.stage === "offer" && data.offer && (
          <div className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-violet-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Offer Letter
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-slate-400">Position</span><p className="font-semibold text-slate-800">{data.offer.position}</p></div>
              <div><span className="text-xs text-slate-400">Department</span><p className="font-semibold text-slate-800">{data.offer.department}</p></div>
              <div><span className="text-xs text-slate-400">Basic Salary</span><p className="font-bold text-emerald-700">SAR {Number(data.offer.offered_salary || 0).toLocaleString()}</p></div>
              <div><span className="text-xs text-slate-400">Housing</span><p className="text-slate-700">SAR {Number(data.offer.housing_allowance || 0).toLocaleString()}</p></div>
              <div><span className="text-xs text-slate-400">Transport</span><p className="text-slate-700">SAR {Number(data.offer.transport_allowance || 0).toLocaleString()}</p></div>
              <div><span className="text-xs text-slate-400">Total Package</span><p className="font-bold text-emerald-700 text-lg">SAR {(Number(data.offer.offered_salary||0)+Number(data.offer.housing_allowance||0)+Number(data.offer.transport_allowance||0)).toLocaleString()}/mo</p></div>
              <div><span className="text-xs text-slate-400">Start Date</span><p className="font-semibold text-slate-800">{String(data.offer.start_date || "").slice(0,10)}</p></div>
              <div><span className="text-xs text-slate-400">Contract</span><p className="text-slate-700 capitalize">{data.offer.contract_type}</p></div>
            </div>

            {data.offer.status === "sent" && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <button onClick={acceptOffer} disabled={offerAction}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition">
                    {offerAction ? "Processing..." : "Accept Offer"}
                  </button>
                  <button onClick={rejectOffer}
                    className="px-4 py-3 rounded-xl border border-red-200 text-red-500 font-semibold hover:bg-red-50 transition">
                    Decline
                  </button>
                </div>

                {/* Negotiate */}
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-violet-700">Want to negotiate?</p>
                  <textarea value={negotiateMsg} onChange={e => setNegotiateMsg(e.target.value)} rows={2}
                    placeholder="e.g. I'd like to discuss the salary range, given my 8 years of experience..."
                    className="w-full px-3 py-2 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none bg-white" />
                  <button onClick={negotiateOffer} disabled={!negotiateMsg.trim() || offerAction}
                    className="px-4 py-2 rounded-lg bg-violet-500 text-white text-xs font-semibold disabled:opacity-50">
                    Send Negotiation Request
                  </button>
                </div>
              </div>
            )}

            {data.offer.status === "negotiating" && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                <p className="text-sm font-semibold text-violet-700">Negotiation in progress</p>
                <p className="text-xs text-violet-500 mt-1">HR is reviewing your request. You&apos;ll be notified of the updated offer.</p>
              </div>
            )}
          </div>
        )}

        {/* ── HIRED STAGE ─────────────────────────────────────────────────── */}
        {app.stage === "hired" && (
          <div className="space-y-4">
            {/* Credentials card */}
            {data.employeeCredentials && (
              <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-200 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                  Welcome Aboard!
                </h3>
                <p className="text-sm text-slate-600">Congratulations! Here are your employee credentials to access the Taliq HR platform:</p>
                <div className="bg-white rounded-xl border border-emerald-100 p-4 text-center space-y-2">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Employee ID</p>
                    <p className="text-2xl font-mono font-black text-emerald-700">{data.employeeCredentials.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Login PIN</p>
                    <p className="text-3xl font-mono font-black text-emerald-700 tracking-widest">{data.employeeCredentials.pin}</p>
                  </div>
                  <div className="text-xs text-slate-400">{data.employeeCredentials.position} &middot; {data.employeeCredentials.department}</div>
                </div>
                <a href="/" className="block w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-center hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition">
                  Login to Employee Portal
                </a>
              </div>
            )}

            {/* Onboarding checklist */}
            {data.onboarding && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-800">Onboarding Checklist</h3>
                  <span className="text-sm font-bold text-emerald-600">{data.onboardingTasks?.filter((t: any) => t.status === "completed").length || 0}/{data.onboardingTasks?.length || 0}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{width: `${data.onboardingTasks?.length ? Math.round(data.onboardingTasks.filter((t: any) => t.status === "completed").length / data.onboardingTasks.length * 100) : 0}%`}} />
                </div>
                {[...new Set((data.onboardingTasks || []).map((t: any) => t.category))].map(cat => (
                  <div key={cat as string} className="mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{(cat as string).replace(/_/g, " ")}</p>
                    {(data.onboardingTasks || []).filter((t: any) => t.category === cat).map((task: any) => (
                      <div key={task.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${task.status === "completed" ? "bg-emerald-50" : ""}`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${task.status === "completed" ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                          {task.status === "completed" && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                        </div>
                        <div className="flex-1">
                          <span className={`text-xs ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>{task.task}</span>
                          <span className="text-[9px] text-slate-400 ml-2">{task.responsible}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REJECTED ────────────────────────────────────────────────────── */}
        {app.stage === "rejected" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center py-8">
            <p className="text-lg font-bold text-slate-700">Thank you for your interest</p>
            <p className="text-sm text-slate-500 mt-2">Unfortunately, we&apos;ve decided to move forward with other candidates at this time. We encourage you to apply again in the future.</p>
            <a href="/careers" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition">View Open Positions</a>
          </div>
        )}

        {/* ── Timeline ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3">Application Timeline</h3>
          <div className="space-y-0">
            {(data.timeline || []).map((t: any, i: number) => (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${t.stage === "rejected" ? "bg-red-400" : t.done ? "bg-emerald-500" : "bg-slate-200"}`} />
                  {i < (data.timeline || []).length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-0.5" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium text-slate-800">{t.event}</p>
                  {t.date && <p className="text-xs text-slate-400">{t.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-slate-400">
          <p>Questions? Contact HR at <span className="font-semibold text-emerald-600">hr@taliq.sa</span></p>
        </div>
      </div>
    </div>
  );
}
