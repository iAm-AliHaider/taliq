"use client";

interface QuestionResult {
  question_id: number;
  question: string;
  user_answer: string;
  correct_answer: string;
  correct: boolean;
  explanation: string;
  points: number;
}

interface Props {
  examTitle?: string;
  score?: number;
  passed?: boolean;
  passingScore?: number;
  earnedPoints?: number;
  totalPoints?: number;
  results?: QuestionResult[];
  participantName?: string;
  timeTaken?: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

export function ExamResultsCard({ examTitle, score = 0, passed = false, passingScore = 70, earnedPoints = 0, totalPoints = 0, results = [], participantName, timeTaken, onAction }: Props) {
  const correct = results.filter(r => r.correct).length;
  const wrong = results.filter(r => !r.correct).length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Score hero */}
      <div className={`px-6 py-8 text-center ${passed ? "bg-gradient-to-br from-emerald-50 to-green-50" : "bg-gradient-to-br from-red-50 to-orange-50"}`}>
        <div className={`w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center border-4 ${passed ? "border-emerald-400 bg-white" : "border-red-300 bg-white"}`}>
          <span className={`text-2xl font-black ${passed ? "text-emerald-600" : "text-red-500"}`}>{score}%</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900">{passed ? "Passed!" : "Not Passed"}</h3>
        {participantName && <p className="text-sm text-gray-600 mt-1">{participantName}</p>}
        <p className="text-xs text-gray-500 mt-1">{examTitle}</p>
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px]">
          <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500">{earnedPoints}/{totalPoints} points</span>
          <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500">Pass: {passingScore}%</span>
          {timeTaken && <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-500">{timeTaken}</span>}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-px bg-gray-100 border-b border-gray-100">
        <div className="bg-white p-3 text-center"><p className="text-lg font-bold text-emerald-600">{correct}</p><p className="text-[9px] text-gray-400">Correct</p></div>
        <div className="bg-white p-3 text-center"><p className="text-lg font-bold text-red-500">{wrong}</p><p className="text-[9px] text-gray-400">Wrong</p></div>
        <div className="bg-white p-3 text-center"><p className="text-lg font-bold text-gray-600">{results.length}</p><p className="text-[9px] text-gray-400">Total</p></div>
      </div>

      {/* Question review */}
      <div className="divide-y divide-gray-50">
        {results.map((r, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${r.correct ? "bg-emerald-100" : "bg-red-100"}`}>
                {r.correct ? (
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{r.question}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-[11px]"><span className="text-gray-400">Your answer: </span><span className={r.correct ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>{r.user_answer || "Not answered"}</span></p>
                  {!r.correct && <p className="text-[11px]"><span className="text-gray-400">Correct: </span><span className="text-emerald-600 font-medium">{r.correct_answer}</span></p>}
                  {r.explanation && <p className="text-[11px] text-blue-600 bg-blue-50 px-2 py-1 rounded-lg mt-1">{r.explanation}</p>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-gray-100 flex justify-center gap-3">
        {!passed && <button onClick={() => onAction?.("retry_exam", {})} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600">Retry Exam</button>}
        <button onClick={() => onAction?.("show_trainings", {})} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">Back to Training</button>
      </div>
    </div>
  );
}
