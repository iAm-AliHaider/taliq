"use client";

import { useEffect, useState } from "react";

interface InterviewPanelProps {
  title: string;
  candidateName: string;
  currentQuestion: number;
  totalQuestions: number;
  question: string;
  questionType: string;
  timeMinutes: number;
  scores: number[];
  status: "in_progress" | "completed";
  averageScore?: number;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  behavioral: { bg: "bg-blue-500/10", text: "text-blue-400" },
  technical: { bg: "bg-purple-500/10", text: "text-purple-400" },
  coding: { bg: "bg-amber-500/10", text: "text-amber-400" },
  summary: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

export function InterviewPanel({ title, candidateName, currentQuestion, totalQuestions, question, questionType, timeMinutes, scores, status, averageScore }: InterviewPanelProps) {
  const progress = (currentQuestion / totalQuestions) * 100;
  const typeStyle = TYPE_COLORS[questionType] || TYPE_COLORS.behavioral;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
          {questionType}
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-3">Candidate: {candidateName}</p>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] text-zinc-500">{currentQuestion}/{totalQuestions}</span>
      </div>

      {status === "completed" ? (
        /* Completed Summary */
        <div className="text-center py-4">
          <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent mb-1">
            {averageScore}/5
          </div>
          <p className="text-xs text-zinc-500 mb-4">Average Score</p>
          <div className="flex justify-center gap-1.5">
            {scores.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  s >= 4 ? "bg-emerald-500/20 text-emerald-400" : s >= 3 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                }`}>{s}</div>
                <span className="text-[8px] text-zinc-600">Q{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Active Question */
        <div>
          <div className="px-4 py-4 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
            <p className="text-sm text-zinc-200 leading-relaxed">{question}</p>
          </div>
          {timeMinutes > 0 && <Timer minutes={timeMinutes} />}
          {scores.length > 0 && (
            <div className="flex gap-1 mt-3">
              {scores.map((s, i) => (
                <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                  s >= 4 ? "bg-emerald-500/20 text-emerald-400" : s >= 3 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                }`}>{s}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Timer({ minutes }: { minutes: number }) {
  const [seconds, setSeconds] = useState(minutes * 60);

  useEffect(() => {
    setSeconds(minutes * 60);
    const interval = setInterval(() => {
      setSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [minutes]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const pct = (seconds / (minutes * 60)) * 100;
  const isLow = pct < 20;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${isLow ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono ${isLow ? "text-red-400" : "text-zinc-400"}`}>
        {m}:{s.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
