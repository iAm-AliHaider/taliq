"use client";

import { useState } from "react";

interface Props {
  employeeName: string;
  grade?: string;
  perDiemRates?: { international: number; local: number };
  currency?: string;
  onAction?: (action: string, payload: Record<string, unknown>) => void;
}

const POPULAR_DESTINATIONS = [
  { city: "Dubai", country: "UAE", type: "international" },
  { city: "Jeddah", country: "Saudi", type: "local" },
  { city: "Riyadh", country: "Saudi", type: "local" },
  { city: "Bahrain", country: "Bahrain", type: "international" },
  { city: "Cairo", country: "Egypt", type: "international" },
  { city: "Dammam", country: "Saudi", type: "local" },
];

export function TravelRequestForm({ employeeName, grade, perDiemRates, currency = "SAR", onAction }: Props) {
  const [destination, setDestination] = useState("");
  const [customDest, setCustomDest] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelType, setTravelType] = useState<"business" | "vacation">("business");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fmt = (n: number) => n.toLocaleString();
  const effectiveDest = destination || customDest;
  const isLocal = POPULAR_DESTINATIONS.find(d => d.city === destination)?.type === "local";

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };
  const days = calcDays();

  const perDiem = perDiemRates
    ? (isLocal ? perDiemRates.local : perDiemRates.international)
    : (isLocal ? 900 : 1350);
  const totalAllowance = perDiem * Math.min(days, 5);
  const isMission = days > 5;

  const canSubmit = effectiveDest && startDate && endDate && days > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    onAction?.("submit_travel", {
      destination: effectiveDest, start_date: startDate, end_date: endDate,
      days, travel_type: travelType, purpose,
    });
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-cyan-50 border-b border-cyan-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Travel Request</h3>
          <p className="text-xs text-gray-400">{employeeName} {grade ? `- Grade ${grade}` : ""}</p>
        </div>
        <span className="badge badge-blue">New</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Travel type toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-gray-100">
          {(["business", "vacation"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTravelType(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                travelType === t ? "bg-white shadow-sm text-gray-800" : "text-gray-500"
              }`}
            >
              {t === "business" ? "Business" : "Vacation"}
            </button>
          ))}
        </div>

        {/* Popular destinations */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-2">Destination</label>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {(POPULAR_DESTINATIONS || []).map(d => (
              <button
                key={d.city}
                onClick={() => { setDestination(d.city); setCustomDest(""); }}
                className={`p-2 rounded-lg border text-center transition-all ${
                  destination === d.city
                    ? "border-cyan-400 bg-cyan-50 ring-1 ring-cyan-200"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                <p className={`text-[11px] font-semibold ${destination === d.city ? "text-cyan-700" : "text-gray-700"}`}>{d.city}</p>
                <p className="text-[9px] text-gray-400">{d.type === "local" ? "Local" : "Intl"}</p>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customDest}
            onChange={e => { setCustomDest(e.target.value); setDestination(""); }}
            placeholder="Or type a custom destination..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 transition-all"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 transition-all"
            />
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">Purpose (optional)</label>
          <input
            type="text"
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            placeholder="Meeting, training, conference..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 transition-all"
          />
        </div>

        {/* Allowance breakdown */}
        {days > 0 && effectiveDest && (
          <div className="bg-cyan-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Per Diem ({isLocal ? "Local" : "International"})</span>
              <span className="text-xs font-semibold text-gray-800">{fmt(perDiem)} {currency}/day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Duration</span>
              <span className="text-xs font-semibold text-gray-800">{days} days {isMission ? "(Mission)" : ""}</span>
            </div>
            <div className="border-t border-cyan-200 pt-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Allowance</span>
              <span className="text-lg font-bold text-cyan-700">{fmt(totalAllowance)} {currency}</span>
            </div>
            {isMission && (
              <p className="text-[10px] text-amber-600">* Trips &gt;5 days qualify as mission: accommodation + 200 SAR/day extra</p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] ${
            canSubmit && !submitting
              ? "bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Submit Travel Request"}
        </button>
      </div>
    </div>
  );
}
