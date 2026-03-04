"use client";

interface Props {
  title: string;
  candidateName: string;
  currentQuestion: number;
  totalQuestions: number;
  question: string;
  questionType: string;
  timeMinutes: number;
  scores: number[];
  status: string;
  averageScore?: number;
}

export function InterviewPanel({ title, candidateName, currentQuestion, totalQuestions, question, questionType, timeMinutes, scores, status, averageScore }: Props) {
  const isComplete = status === "completed";
  const progressPct = Math.round((currentQuestion / totalQuestions) * 100);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 border-b flex items-center justify-between ${isComplete ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"}`}>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-400">Candidate: {candidateName}</p>
        </div>
        <span className={`badge ${isComplete ? "badge-emerald" : "badge-blue"}`}>
          {isComplete ? "Complete" : `${currentQuestion}/${totalQuestions}`}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Progress</span>
            <span className="text-[10px] text-gray-500">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Current Question */}
        {!isComplete && (
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="badge badge-blue">{questionType}</span>
              <span className="text-[10px] text-gray-400">⏱️ {timeMinutes} min</span>
            </div>
            <p className="text-sm font-medium text-gray-800">{question}</p>
          </div>
        )}

        {/* Scores */}
        {scores.length > 0 && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Scores</span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {(scores || []).map((s, i) => (
                <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  s >= 4 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  s >= 3 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {isComplete && averageScore !== undefined && (
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-emerald-600">{averageScore}</p>
            <p className="text-xs text-gray-400 mt-1">out of 5.0</p>
          </div>
        )}
      </div>
    </div>
  );
}
