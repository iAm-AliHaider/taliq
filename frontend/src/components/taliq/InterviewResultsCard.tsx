"use client";

import { useState } from "react";

interface DimensionConfig {
  label: string;
  description: string;
  weight: number;
}

interface QuestionSummary {
  question_index: number;
  question: string;
  overall_score: number;
  dimensions: Record<string, number>;
  strengths: string[];
  improvement_areas: string[];
  supporting_quote: string;
  feedback: string;
}

interface SupportingQuote {
  quote: string;
  question: string;
  type: "strength" | "improvement_area";
}

interface CandidateStatus {
  status: string;
  label: string;
  color: string;
  min: number;
}

interface Props {
  candidateName: string;
  position: string;
  stage: string;
  interviewRef: string;
  overallScore: number;
  simpleAverage: number;
  candidateStatus: CandidateStatus;
  dimensionScores: Record<string, number>;
  scoringDimensions: Record<string, DimensionConfig>;
  questionSummaries: QuestionSummary[];
  strengths: string[];
  improvementAreas: string[];
  supportingQuotes: SupportingQuote[];
  totalQuestions: number;
  scores: number[];
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  emerald: "from-emerald-400 to-emerald-600 text-emerald-700 bg-emerald-50 border-emerald-200",
  blue: "from-blue-400 to-blue-600 text-blue-700 bg-blue-50 border-blue-200",
  amber: "from-amber-400 to-amber-600 text-amber-700 bg-amber-50 border-amber-200",
  red: "from-red-400 to-red-600 text-red-700 bg-red-50 border-red-200",
};

const DIM_COLORS: Record<string, string> = {
  communication: "bg-blue-500",
  technical: "bg-purple-500",
  soft_skills: "bg-pink-500",
  cultural_fit: "bg-emerald-500",
};

function ScoreBar({ score, max = 5, color }: { score: number; max?: number; color: string }) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function InterviewResultsCard(props: Props) {
  const [tab, setTab] = useState<"overview" | "questions" | "quotes">("overview");
  const colors = STATUS_COLORS[props.candidateStatus?.color || "blue"] || STATUS_COLORS.blue;
  const [gradientPart, textPart, bgPart, borderPart] = colors.split(" ");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">
      {/* Header */}
      <div className={`px-5 py-4 ${bgPart} border-b ${borderPart}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">{props.candidateName}</h3>
            <p className="text-xs text-gray-500">{props.position} &mdash; {props.stage?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${textPart}`}>{props.overallScore}/5</div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${bgPart} ${textPart} border ${borderPart}`}>
              {props.candidateStatus?.label}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Ref: {props.interviewRef} | Weighted score (simple avg: {props.simpleAverage})</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(["overview", "questions", "quotes"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              tab === t ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "overview" ? "Dimensions" : t === "questions" ? `Questions (${props.totalQuestions})` : `Quotes (${props.supportingQuotes?.length || 0})`}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="space-y-5">
            {/* Dimension scores */}
            <div className="space-y-3">
              {Object.entries(props.scoringDimensions || {}).map(([key, dim]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-xs font-semibold text-gray-800">{dim.label}</span>
                      <span className="text-[10px] text-gray-400 ml-1">({Math.round(dim.weight * 100)}%)</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{props.dimensionScores?.[key] || 0}/5</span>
                  </div>
                  <ScoreBar score={props.dimensionScores?.[key] || 0} color={DIM_COLORS[key] || "bg-gray-400"} />
                  <p className="text-[10px] text-gray-400 mt-0.5">{dim.description}</p>
                </div>
              ))}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <h4 className="text-xs font-bold text-emerald-700 mb-2">Strengths</h4>
                {(props.strengths || []).length > 0 ? (
                  <ul className="space-y-1">
                    {props.(strengths || []).map((s, i) => (
                      <li key={i} className="text-[11px] text-emerald-600 flex items-start gap-1">
                        <span className="text-emerald-400 mt-0.5">+</span> {s}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-emerald-400">No strengths recorded</p>
                )}
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <h4 className="text-xs font-bold text-amber-700 mb-2">Areas to Improve</h4>
                {(props.improvementAreas || []).length > 0 ? (
                  <ul className="space-y-1">
                    {props.(improvementAreas || []).map((a, i) => (
                      <li key={i} className="text-[11px] text-amber-600 flex items-start gap-1">
                        <span className="text-amber-400 mt-0.5">-</span> {a}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-amber-400">No areas recorded</p>
                )}
              </div>
            </div>

            {/* Score distribution */}
            <div className="flex items-end gap-1 h-12">
              {(props.scores || []).map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t ${s >= 4 ? "bg-emerald-400" : s >= 3 ? "bg-blue-400" : s >= 2 ? "bg-amber-400" : "bg-red-400"}`}
                    style={{ height: `${(s / 5) * 40}px` }}
                  />
                  <span className="text-[8px] text-gray-400 mt-0.5">Q{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {tab === "questions" && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {(props.questionSummaries || []).map((q, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium text-gray-900 flex-1 pr-2">{q.question}</p>
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    q.overall_score >= 4 ? "bg-emerald-500" : q.overall_score >= 3 ? "bg-blue-500" : q.overall_score >= 2 ? "bg-amber-500" : "bg-red-500"
                  }`}>
                    {q.overall_score}
                  </span>
                </div>
                {q.feedback && <p className="text-[11px] text-gray-500 mb-1">{q.feedback}</p>}
                <div className="flex gap-3 text-[10px]">
                  {Object.entries(q.dimensions || {}).map(([dim, val]) => (
                    <span key={dim} className="text-gray-400">
                      {dim.replace("_", " ")}: <span className="font-semibold text-gray-600">{val}</span>
                    </span>
                  ))}
                </div>
                {q.strengths?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {q.(strengths || []).map((s, j) => (
                      <span key={j} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px]">+{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(!props.questionSummaries || props.questionSummaries.length === 0) && (
              <p className="text-center text-sm text-gray-400 py-4">No detailed question data available</p>
            )}
          </div>
        )}

        {/* QUOTES TAB */}
        {tab === "quotes" && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {(props.supportingQuotes || []).map((q, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 border ${
                  q.type === "strength" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                }`}
              >
                <p className="text-xs text-gray-700 italic mb-1">&ldquo;{q.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Re: {q.question}</span>
                  <span className={`text-[9px] font-semibold ${q.type === "strength" ? "text-emerald-600" : "text-amber-600"}`}>
                    {q.type === "strength" ? "STRENGTH" : "IMPROVEMENT"}
                  </span>
                </div>
              </div>
            ))}
            {(!props.supportingQuotes || props.supportingQuotes.length === 0) && (
              <p className="text-center text-sm text-gray-400 py-4">No quotes recorded</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
