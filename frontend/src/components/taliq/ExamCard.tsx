"use client";
import { useState, useEffect } from "react";

interface Question {
  id: number;
  question: string;
  question_type: string;
  options: string[];
  points: number;
}

interface Props {
  examId?: number;
  examTitle?: string;
  description?: string;
  passingScore?: number;
  timeLimitMinutes?: number;
  questions?: Question[];
  attemptId?: number;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function ExamCard({ examId, examTitle, description, passingScore = 70, timeLimitMinutes = 30, questions = [], attemptId, onAction }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);

  // Timer
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [submitted, timeLeft]);

  // Auto-submit on time up
  useEffect(() => {
    if (timeLeft === 0 && !submitted) handleSubmit();
  }, [timeLeft]);

  const handleSubmit = () => {
    setSubmitted(true);
    onAction?.("submit_exam", { attempt_id: attemptId, answers });
  };

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeColor = timeLeft < 60 ? "text-red-600" : timeLeft < 300 ? "text-amber-600" : "text-gray-600";

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Exam Submitted</h3>
        <p className="text-sm text-gray-500">Your answers are being graded...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">{examTitle || "Exam"}</h3>
          <div className={`px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-mono font-bold ${timeColor}`}>
            {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
          </div>
        </div>
        {description && <p className="text-xs text-gray-500">{description}</p>}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
          <span>Pass: {passingScore}%</span>
          <span>Questions: {questions.length}</span>
          <span>Answered: {answeredCount}/{questions.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      {q && (
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">{currentQ + 1}</span>
            <div>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">{q.question}</p>
              <p className="text-[10px] text-gray-400 mt-1">{q.points} point{q.points > 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2 ml-11">
            {(q.options || []).map((opt, i) => {
              const selected = answers[String(q.id)] === opt;
              return (
                <button key={i} onClick={() => setAnswers(prev => ({...prev, [String(q.id)]: opt}))}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selected ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? "border-emerald-500" : "border-gray-300"}`}>
                      {selected && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    </div>
                    <span className={`text-sm ${selected ? "text-emerald-700 font-medium" : "text-gray-600"}`}>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question nav dots */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-center gap-1.5 flex-wrap">
        {(questions || []).map((qq, i) => (
          <button key={i} onClick={() => setCurrentQ(i)}
            className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all ${i === currentQ ? "bg-blue-500 text-white" : answers[String(qq.id)] ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 disabled:opacity-30 transition-all">Previous</button>
        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(p => p + 1)} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-all">Next</button>
        ) : (
          <button onClick={handleSubmit} disabled={answeredCount < questions.length}
            className="px-6 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-40 transition-all">
            Submit Exam ({answeredCount}/{questions.length})
          </button>
        )}
      </div>
    </div>
  );
}
