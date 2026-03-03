"use client";
import { useState, useEffect } from "react";

type Job = {
  id: number; ref: string; title: string; department: string; description: string;
  requirements: string; salary_range: string; location: string; employment_type: string;
  deadline: string; applicant_count: number;
};

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Job | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ candidate_name: "", candidate_email: "", candidate_phone: "", cover_letter: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ref: string; pin: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/candidate?section=jobs").then(r => r.json()).then(d => {
      setJobs(d?.jobs || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !form.candidate_name || !form.candidate_email) return;
    setSubmitting(true); setError("");
    try {
      const r = await fetch("/api/candidate?action=apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, job_id: selected.id, source: "careers_page" })
      }).then(r => r.json());
      if (r.ok) { setResult({ ref: r.ref, pin: r.pin }); }
      else { setError(r.error || "Failed to submit"); }
    } catch { setError("Network error"); }
    setSubmitting(false);
  }

  const TYPE_LABELS: Record<string, string> = { full_time: "Full Time", part_time: "Part Time", contract: "Contract", internship: "Internship" };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl font-black" style={{fontFamily:"serif"}}>ط</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Taliq Careers</h1>
              <p className="text-emerald-200 text-sm">Join the future of HR technology</p>
            </div>
          </div>
          <p className="text-emerald-100 text-sm max-w-xl">
            We&apos;re building Saudi Arabia&apos;s most advanced voice-first HR platform. If you&apos;re passionate about AI, enterprise software, or making work better — we want to hear from you.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="/candidate" className="px-4 py-2 rounded-lg bg-white text-emerald-700 text-sm font-semibold hover:bg-emerald-50 transition">
              Track My Application
            </a>
            <a href="#positions" className="px-4 py-2 rounded-lg border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition">
              View Open Positions
            </a>
          </div>
        </div>
      </div>

      {/* Positions */}
      <div id="positions" className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Open Positions ({jobs.length})</h2>
        
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white rounded-2xl border border-slate-200 h-28" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-semibold">No open positions right now</p>
            <p className="text-sm mt-1">Check back soon — we&apos;re always growing!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md ${selected?.id === job.id ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"}`}
                onClick={() => { setSelected(selected?.id === job.id ? null : job); setShowApply(false); setResult(null); }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{job.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">{job.department}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{job.location}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">{TYPE_LABELS[job.employment_type] || job.employment_type}</span>
                      {job.salary_range && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">{job.salary_range}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{job.ref}</span>
                </div>

                {/* Expanded details */}
                {selected?.id === job.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    {job.description && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">About the Role</h4>
                        <p className="text-sm text-slate-700">{job.description}</p>
                      </div>
                    )}
                    {job.requirements && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Requirements</h4>
                        <p className="text-sm text-slate-700">{job.requirements}</p>
                      </div>
                    )}
                    {job.deadline && <p className="text-xs text-slate-400">Deadline: {String(job.deadline).slice(0,10)}</p>}

                    {!showApply && !result && (
                      <button onClick={(e) => { e.stopPropagation(); setShowApply(true); }}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition">
                        Apply Now
                      </button>
                    )}

                    {/* Application form */}
                    {showApply && !result && (
                      <form onSubmit={handleApply} onClick={e => e.stopPropagation()} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                        <h4 className="font-bold text-slate-800 text-sm">Apply for {job.title}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-500 font-medium">Full Name *</label>
                            <input required value={form.candidate_name} onChange={e => setForm({...form, candidate_name: e.target.value})}
                              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              placeholder="Your full name" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium">Email *</label>
                            <input required type="email" value={form.candidate_email} onChange={e => setForm({...form, candidate_email: e.target.value})}
                              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              placeholder="you@email.com" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 font-medium">Phone</label>
                            <input value={form.candidate_phone} onChange={e => setForm({...form, candidate_phone: e.target.value})}
                              className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              placeholder="+966 5xx xxx xxxx" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 font-medium">Cover Letter</label>
                          <textarea value={form.cover_letter} onChange={e => setForm({...form, cover_letter: e.target.value})} rows={3}
                            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                            placeholder="Tell us why you'd be great for this role..." />
                        </div>
                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                        <div className="flex gap-2">
                          <button type="submit" disabled={submitting}
                            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 disabled:opacity-50 transition">
                            {submitting ? "Submitting..." : "Submit Application"}
                          </button>
                          <button type="button" onClick={e => { e.stopPropagation(); setShowApply(false); }}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-100 transition">
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Success */}
                    {result && (
                      <div onClick={e => e.stopPropagation()} className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                          <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        </div>
                        <h4 className="font-bold text-emerald-800 text-lg">Application Submitted!</h4>
                        <div className="bg-white rounded-lg p-3 border border-emerald-100 inline-block">
                          <p className="text-xs text-slate-500">Your Reference Number</p>
                          <p className="text-xl font-mono font-bold text-emerald-700">{result.ref}</p>
                          <p className="text-xs text-slate-500 mt-2">Your PIN</p>
                          <p className="text-2xl font-mono font-bold text-emerald-700 tracking-widest">{result.pin}</p>
                        </div>
                        <p className="text-xs text-emerald-700 font-medium">Save your reference number and PIN to track your application at <a href="/candidate" className="underline font-bold">/candidate</a></p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-xs text-slate-400">
          <p>Taliq HR Platform — Voice-First, Saudi Labor Law Compliant, GOSI Ready</p>
          <a href="/candidate" className="text-emerald-600 hover:underline font-semibold mt-1 inline-block">Already applied? Track your application</a>
        </div>
      </div>
    </div>
  );
}
