"use client";

interface Props {
  shiftName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isNightShift: boolean;
  differentialPct: number;
  effectiveDate: string;
}

export function ShiftCard(props: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{props.shiftName} Shift</h3>
              <p className="text-[10px] text-gray-400">Since {props.effectiveDate}</p>
            </div>
          </div>
          {props.isNightShift && <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-[10px] font-medium text-indigo-700 border border-indigo-200">Night Shift</span>}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{props.startTime}</p>
            <p className="text-[10px] text-gray-400">Start</p>
          </div>
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{props.endTime}</p>
            <p className="text-[10px] text-gray-400">End</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-gray-900">{props.breakMinutes} min</p>
            <p className="text-[10px] text-gray-400">Break</p>
          </div>
          {props.differentialPct > 0 && (
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">+{props.differentialPct}%</p>
              <p className="text-[10px] text-gray-400">Night Differential</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
