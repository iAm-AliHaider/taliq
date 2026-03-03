"use client";
import { useState, useEffect } from "react";

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: string; pct: number }> = {
  applied:   { label: "Applied",   color: "bg-slate-500",   icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",         pct: 10 },
  screening: { label: "Screening", color: "bg-blue-500",    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",           pct: 30 },
  interview: { label: "Interview", color: "bg-amber-500",   icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", pct: 55 },
  offer:     { label: "Offer",     color: "bg-violet-500",  icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", pct: 80 },
  hired:     { label: "Hired!",    color: "bg-emerald-500", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", pct: 100 },
  rejected:  { label: "Closed",    color: "bg-red-400",     icon: "M6 18L18 6M6 6l12 12",                                   pct: 0 },
};

export default function CandidatePortal() {
  const [authed, setAuthed] = useState(false);
  const [ref, setRef] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptMsg, setAcceptMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("taliq_candidate");
    if (saved) { const p = JSON.parse(saved); setRef(p.ref); login(p.ref, p.pin); }
  }, []);

  async function login(r: string, p: string) {
    setLoading(true); setError("");
    const res = await fetch("/api/candidate?action=auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: r, pin: p })
    }).then(r => r.json());
    if (res.ok) {
      localStorage.setItem("taliq_candidate", JSON.stringify({ ref: r, pin: p }));
      setAuthed(true);
      loadStatus(r);
    } else { setError(res.error || "Invalid credentials"); }
    setLoading(false);
  }

  async function loadStatus(r: string) {
    const saved = JSON.parse(localStorage.getItem('taliq_candidate') || '{}');
    const res = await fetch(`/api/candidate?section=my_status&ref=${r}&pin=${saved.pin || ''}`).then(r => r.json());
    setData(res);
  }

  async function acceptOffer() {
    setAccepting(true);
    const res = await fetch("/api/candidate?action=accept_offer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_ref: ref })
    }).then(r => r.json());
    if (res.ok) {
      setAcceptMsg(res.message || "Offer accepted!");
      loadStatus(ref);
    }
    setAccepting(false);
  }

  async function rejectOffer() {
    if (!window.confirm("Are you sure you want to decline this offer?")) return;
    await fetch("/api/candidate?action=reject_offer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ application_ref: ref, reason: "Candidate declined via portal" })
    });
    loadStatus(ref);
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); login(ref, pin); }
  function logout() { localStorage.removeItem("taliq_candidate"); setAuthed(false); setData(null); setRef(""); setPin(""); }

  const app = data?.application;
  const offer = data?.offer;
  const onboarding = data?.onboarding;
  const stage = STAGE_CONFIG[app?.stage] || STAGE_CONFIG.applied;

  // ── Login Screen ──────────────────────────────────────────────────────────
  if (!authed) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg mb-4">
            <span className="text-white text-2xl font-black" style={{fontFamily:"serif"}}>ط</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Candidate Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Track your application status</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Application Reference</label>
            <input value={ref} onChange={e => setRef(e.target.value.toUpperCase())} placeholder="APP-2026-001"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500" required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">PIN</label>
            <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => { if (/^\d*$/.test(e.target.value)) setPin(e.target.value); }} placeholder="4-digit PIN"
              className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500" required />
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse space-y-3 w-80">
        <div className="h-6 bg-slate-200 rounded-lg w-48" />
        <div className="h-40 bg-slate-200 rounded-2xl" />
        <div className="h-20 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );

  // ── Portal Dashboard ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`${stage.color} text-white`}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 text-xs font-mono">{app.ref}</p>
              <h1 className="text-2xl font-bold mt-1">{app.candidate_name}</h1>
              <p className="text-white/80 text-sm mt-0.5">{app.job_title} · {app.job_department}</p>
            </div>
            <button onClick={logout} className="text-white/60 hover:text-white text-xs px-3 py-1 rounded-lg border border-white/20 hover:border-white/40 transition">Logout</button>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Status: <span className="text-white font-bold">{stage.label}</span></span>
              <span>{stage.pct}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{width:`${stage.pct}%`}} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Next Step Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${stage.color} flex items-center justify-center flex-shrink-0`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stage.icon}/></svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">What&apos;s Next?</h3>
              <p className="text-sm text-slate-600 mt-0.5">{data.nextStep}</p>
            </div>
          </div>
        </div>

        {/* Offer Section */}
        {offer && offer.status === "sent" && (
          <div className="bg-gradient-to-br from-violet-50 to-white rounded-2xl border border-violet-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-violet-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Offer Letter
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-slate-400">Position</span><p className="font-semibold text-slate-800">{offer.position}</p></div>
              <div><span className="text-xs text-slate-400">Start Date</span><p className="font-semibold text-slate-800">{String(offer.start_date || "").slice(0, 10)}</p></div>
              <div><span className="text-xs text-slate-400">Basic Salary</span><p className="font-bold text-emerald-700">SAR {Number(offer.offered_salary || 0).toLocaleString()}</p></div>
              <div><span className="text-xs text-slate-400">Total Package</span><p className="font-bold text-emerald-700">SAR {(Number(offer.offered_salary||0)+Number(offer.housing_allowance||0)+Number(offer.transport_allowance||0)).toLocaleString()}/mo</p></div>
              <div><span className="text-xs text-slate-400">Housing</span><p className="text-slate-700">SAR {Number(offer.housing_allowance || 0).toLocaleString()}</p></div>
              <div><span className="text-xs text-slate-400">Transport</span><p className="text-slate-700">SAR {Number(offer.transport_allowance || 0).toLocaleString()}</p></div>
              <div><span className="text-xs text-slate-400">Contract</span><p className="text-slate-700 capitalize">{offer.contract_type}</p></div>
            </div>
            {acceptMsg ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-800 font-bold">{acceptMsg}</p>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button onClick={acceptOffer} disabled={accepting}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition">
                  {accepting ? "Processing..." : "Accept Offer"}
                </button>
                <button onClick={rejectOffer}
                  className="px-6 py-3 rounded-xl border border-red-200 text-red-500 font-semibold hover:bg-red-50 transition">
                  Decline
                </button>
              </div>
            )}
          </div>
        )}

        {/* Onboarding Checklist */}
        {onboarding && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800">Onboarding Checklist</h3>
              <span className="text-sm font-bold text-emerald-600">{onboarding.done}/{onboarding.total} tasks</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{width:`${onboarding.total ? Math.round(Number(onboarding.done)/Number(onboarding.total)*100) : 0}%`}} />
            </div>
            <p className="text-xs text-slate-500 mt-2">Your HR team will guide you through these steps before and after your start date.</p>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4">Application Timeline</h3>
          <div className="space-y-0">
            {(data.timeline || []).map((t: any, i: number) => (
              <div key={i} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${t.status === "rejected" ? "bg-red-400" : "bg-emerald-500"}`} />
                  {i < (data.timeline || []).length - 1 && <div className="w-0.5 flex-1 bg-slate-200 my-0.5" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-medium text-slate-800">{t.event}</p>
                  {t.date && <p className="text-xs text-slate-400">{t.date}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-3">Application Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-xs text-slate-400">Email</span><p className="text-slate-700">{app.candidate_email}</p></div>
            <div><span className="text-xs text-slate-400">Phone</span><p className="text-slate-700">{app.candidate_phone || "Not provided"}</p></div>
            <div><span className="text-xs text-slate-400">Source</span><p className="text-slate-700 capitalize">{app.source}</p></div>
            <div><span className="text-xs text-slate-400">Applied</span><p className="text-slate-700">{String(app.applied_at || "").slice(0, 10)}</p></div>
          </div>
          {app.interview_score && (
            <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
              <span className="text-xs text-amber-700 font-semibold">Interview Score: {app.interview_score}/5</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-slate-400">
          <p>Questions? Contact HR at <span className="font-semibold text-emerald-600">hr@taliq.sa</span></p>
          <a href="/careers" className="text-emerald-600 hover:underline font-medium mt-1 inline-block">View more open positions</a>
        </div>
      </div>
    </div>
  );
}
