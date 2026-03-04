"use client";

import { useState, useEffect } from "react";

// Types
interface Question {
  q: string;
  type: string;
  time: number;
}

interface InterviewTemplate {
  id: string;
  name: string;
  stage: string;
  questions: Question[];
}

interface Interview {
  id: number;
  ref: string;
  application_id: number | null;
  candidate_name: string;
  position: string;
  stage: string;
  status: string;
  total_score: number | null;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  current_question: number;
  answers: any[];
}

const STAGES = [
  { value: "hr_screening", label: "HR Screening" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "leadership", label: "Leadership" },
  { value: "custom", label: "Custom" },
];

const Q_TYPES = [
  "Behavioral", "Technical", "Problem Solving", "Cultural Fit",
  "Motivation", "Career Goals", "Practical", "Architecture",
  "Process", "Innovation", "Conflict Resolution", "Time Management",
  "Leadership", "Growth Mindset", "People Management", "Strategy",
  "Communication", "Decision Making", "Mentorship", "Custom",
];

function Badge({ text, color }: { text: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[color] || colors.gray}`}>{text}</span>;
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700">{score}%</span>
    </div>
  );
}

interface Props {
  interviews: Interview[];
  templates: InterviewTemplate[];
  onRefresh: () => void;
}

export default function InterviewBuilder({ interviews, templates, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<"interviews" | "templates" | "create">("interviews");
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  // Template builder state
  const [tplName, setTplName] = useState("");
  const [tplStage, setTplStage] = useState("hr_screening");
  const [tplQuestions, setTplQuestions] = useState<Question[]>([
    { q: "", type: "Behavioral", time: 3 },
  ]);

  // Create interview state
  const [newCandidate, setNewCandidate] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newStage, setNewStage] = useState("hr_screening");
  const [creating, setCreating] = useState(false);

  const addQuestion = () => {
    setTplQuestions([...tplQuestions, { q: "", type: "Behavioral", time: 3 }]);
  };

  const removeQuestion = (idx: number) => {
    if (tplQuestions.length <= 1) return;
    setTplQuestions(tplQuestions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof Question, value: string | number) => {
    const updated = [...tplQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setTplQuestions(updated);
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= tplQuestions.length) return;
    const updated = [...tplQuestions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setTplQuestions(updated);
  };

  const handleSaveTemplate = async () => {
    if (!tplName.trim() || tplQuestions.some(q => !q.q.trim())) return;
    await fetch("/api/admin?action=save_interview_template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tplName,
        stage: tplStage,
        questions: tplQuestions,
      }),
    });
    setShowCreateTemplate(false);
    setTplName("");
    setTplStage("hr_screening");
    setTplQuestions([{ q: "", type: "Behavioral", time: 3 }]);
    onRefresh();
  };

  const handleCreateInterview = async () => {
    if (!newCandidate.trim() || !newPosition.trim()) return;
    setCreating(true);
    await fetch("/api/admin?action=create_interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_name: newCandidate,
        position: newPosition,
        stage: newStage,
      }),
    });
    setCreating(false);
    setNewCandidate("");
    setNewPosition("");
    setActiveTab("interviews");
    onRefresh();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch("/api/admin?action=delete_interview_template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRefresh();
  };

  const handleMakeOffer = async (interview: Interview) => {
    if (!interview.application_id) {
      alert("This interview is not linked to a job application.");
      return;
    }
    if (!confirm(`Create an offer for ${interview.candidate_name}?`)) return;
    
    await fetch("/api/admin?action=create_offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: interview.application_id,
        position: interview.position,
        department: "General", // Default
        offered_salary: 15000,
        start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }),
    });
    alert("Offer letter created!");
    setSelectedInterview(null);
    onRefresh();
  };

  const tabs = [
    { id: "interviews" as const, label: "Past Interviews", count: (interviews || []).length },
    { id: "templates" as const, label: "Question Banks", count: (templates || []).length },
    { id: "create" as const, label: "Start Interview", count: null },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label} {t.count !== null && <span className="ml-1 text-[9px] text-gray-400">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* PAST INTERVIEWS */}
      {activeTab === "interviews" && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Interview History</h3>
            <div className="flex gap-2">
              <Badge text={`${(interviews || []).filter(i => i.status === "completed").length} completed`} color="emerald" />
              <Badge text={`${(interviews || []).filter(i => i.status === "in_progress").length} in progress`} color="amber" />
            </div>
          </div>
          <div className="max-h-[450px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Ref</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Candidate</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Position</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Stage</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Progress</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Score</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-500">Date</th>
                  <th className="text-right px-4 py-2 font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(interviews || []).map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedInterview(i)}>
                    <td className="px-4 py-2 font-mono text-gray-400">INT-{i.id}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900">{i.candidate_name || "Unknown"}</td>
                    <td className="px-4 py-2 text-gray-600">{i.position}</td>
                    <td className="px-4 py-2"><Badge text={i.stage?.replace("_", " ") || "Screening"} color="indigo" /></td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full" 
                            style={{ width: `${i.total_questions > 0 ? (i.current_question / i.total_questions) * 100 : 0}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-400">{i.current_question || 0}/{i.total_questions || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {i.total_score ? <ScoreBar score={i.total_score} /> : <span className="text-gray-300">--</span>}
                    </td>
                    <td className="px-4 py-2">
                      <Badge text={i.status} color={i.status === "completed" ? "emerald" : i.status === "in_progress" ? "amber" : "gray"} />
                    </td>
                    <td className="px-4 py-2 text-gray-400">{i.started_at?.slice(0, 10)}</td>
                    <td className="px-4 py-2 text-right">
                      <button className="text-indigo-500 font-semibold hover:underline">View Results</button>
                    </td>
                  </tr>
                ))}
                {(interviews || []).length === 0 && (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-gray-400">No interviews yet. Start one from the "Start Interview" tab or use voice: "Start an interview with Ahmed for Software Engineer"</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERVIEW DETAILS MODAL */}
      {selectedInterview && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedInterview.candidate_name || "Unknown Candidate"}</h3>
                <p className="text-sm text-slate-500 font-medium">{selectedInterview.position} &middot; {selectedInterview.stage?.replace('_', ' ')}</p>
              </div>
              <button onClick={() => setSelectedInterview(null)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Score Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Final Score</p>
                  <p className="text-3xl font-black text-slate-900">{selectedInterview.total_score || 0}%</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Questions</p>
                  <p className="text-3xl font-black text-slate-900">{selectedInterview.current_question || 0}/{selectedInterview.total_questions || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Result</p>
                  <div className="mt-2">
                    <Badge text={(selectedInterview.total_score || 0) >= 60 ? "RECOMMENDED" : "HOLD"} color={(selectedInterview.total_score || 0) >= 60 ? "emerald" : "amber"} />
                  </div>
                </div>
              </div>

              {/* Answers Breakdown */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest px-1">Detailed Responses</h4>
                {(selectedInterview.answers || []).map((a: any, idx: number) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-50 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900 leading-relaxed mb-1">{a.question}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase">{a.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-600">{a.average}/10</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Score</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">AI Analysis</p>
                        <p className="text-xs text-slate-600 leading-relaxed italic">&quot;{a.summary}&quot;</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-[9px] text-slate-400 font-bold mb-1">COMM</p>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400" style={{ width: `${(a.communication || 0) * 10}%` }} />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-slate-400 font-bold mb-1">RELEVANCE</p>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${(a.relevance || 0) * 10}%` }} />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-slate-400 font-bold mb-1">DEPTH</p>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-400" style={{ width: `${(a.depth || 0) * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(selectedInterview.answers || []).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    No detailed question responses found for this interview.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between gap-4">
              <button onClick={() => setSelectedInterview(null)} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all">
                Close
              </button>
              <div className="flex gap-2">
                <button className="px-6 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 transition-all">
                  Reject Application
                </button>
                <button onClick={() => handleMakeOffer(selectedInterview)}
                  className="px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95">
                  Generate Offer Letter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION BANK / TEMPLATES */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Question banks define what the AI interviewer asks during each interview stage.</p>
            <button onClick={() => setShowCreateTemplate(!showCreateTemplate)}
              className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 shadow-sm shadow-indigo-200">
              {showCreateTemplate ? "Cancel" : "+ New Question Bank"}
            </button>
          </div>

          {/* Template Creator */}
          {showCreateTemplate && (
            <div className="bg-white rounded-2xl border border-indigo-200 shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                <h3 className="text-sm font-bold text-gray-900">Create Question Bank</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Define questions the AI interviewer will ask candidates.</p>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Template Name *</label>
                    <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. Senior Developer Technical"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Interview Stage</label>
                    <select value={tplStage} onChange={e => setTplStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200">
                      {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Questions ({(tplQuestions || []).length})</label>
                    <button onClick={addQuestion} className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-semibold hover:bg-indigo-100 border border-indigo-200">
                      + Add Question
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(tplQuestions || []).map((q, i) => (
                      <div key={i} className="flex gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200 group hover:border-indigo-200 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                          {i + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <textarea value={q.q} onChange={e => updateQuestion(i, "q", e.target.value)}
                            placeholder="Enter the interview question..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs h-14 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                          <div className="flex gap-2">
                            <select value={q.type} onChange={e => updateQuestion(i, "type", e.target.value)}
                              className="px-2 py-1 rounded-lg border border-gray-200 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-200">
                              {Q_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="flex items-center gap-1">
                              <input type="number" value={q.time} onChange={e => updateQuestion(i, "time", parseInt(e.target.value) || 2)}
                                min={1} max={15} className="w-12 px-2 py-1 rounded-lg border border-gray-200 text-[10px] text-center" />
                              <span className="text-[9px] text-gray-400">min</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-30">
                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button onClick={() => moveQuestion(i, 1)} disabled={i === tplQuestions.length - 1} className="w-5 h-5 rounded flex items-center justify-center hover:bg-gray-200 disabled:opacity-30">
                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          <button onClick={() => removeQuestion(i)} disabled={tplQuestions.length <= 1} className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-100 disabled:opacity-30">
                            <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estimated Duration */}
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-xs text-indigo-700">Estimated duration: <strong>{tplQuestions.reduce((sum, q) => sum + q.time, 0)} minutes</strong> ({tplQuestions.length} questions)</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => setShowCreateTemplate(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100">Cancel</button>
                  <button onClick={handleSaveTemplate} disabled={!tplName.trim() || tplQuestions.some(q => !q.q.trim())}
                    className="px-6 py-2 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 disabled:opacity-50 shadow-sm shadow-indigo-200">
                    Save Question Bank
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing Templates */}
          <div className="space-y-3">
            {(templates || []).map(tpl => (
              <div key={tpl.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{tpl.name}</h3>
                    <p className="text-[10px] text-gray-400">Stage: {tpl.stage?.replace("_", " ")} &middot; {(tpl.questions || []).length} questions &middot; ~{(tpl.questions || []).reduce((s, q) => s + q.time, 0)} min</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge text={tpl.stage?.replace("_", " ")} color="indigo" />
                    <button onClick={() => handleDeleteTemplate(tpl.id)} className="text-[10px] text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
                <div className="px-5 py-3 space-y-1.5">
                  {(tpl.questions || []).map((q, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 rounded-full w-5 h-5 flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-[11px] text-gray-800">{q.q}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[9px] text-gray-400">{q.type}</span>
                          <span className="text-[9px] text-gray-400">&middot; {q.time}min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(templates || []).length === 0 && !showCreateTemplate && (
              <div className="text-center py-8 text-sm text-gray-400">
                No custom question banks yet. The default banks (HR Screening, Technical, Behavioral, Leadership) are built-in.
                <br />Create custom ones for specific roles or departments.
              </div>
            )}
          </div>
        </div>
      )}

      {/* START NEW INTERVIEW */}
      {activeTab === "create" && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Start AI Interview</h3>
              <p className="text-xs text-gray-500 mt-1">The AI interviewer will conduct the session using voice.</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Candidate Name *</label>
              <input value={newCandidate} onChange={e => setNewCandidate(e.target.value)} placeholder="e.g. Ahmed Al-Rashid"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Position *</label>
              <input value={newPosition} onChange={e => setNewPosition(e.target.value)} placeholder="e.g. Senior Software Engineer"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block mb-1">Interview Stage</label>
              <div className="grid grid-cols-2 gap-2">
                {STAGES.filter(s => s.value !== "custom").map(s => (
                  <button key={s.value} onClick={() => setNewStage(s.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${newStage === s.value ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-indigo-200"}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleCreateInterview} disabled={creating || !newCandidate.trim() || !newPosition.trim()}
              className="w-full py-3 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 disabled:opacity-50 shadow-sm shadow-indigo-200 transition-colors">
              {creating ? "Creating..." : "Start Interview Session"}
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              After creating, use voice: &quot;Start the interview&quot; to begin the AI-conducted session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
