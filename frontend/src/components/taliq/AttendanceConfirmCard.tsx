"use client";

interface Props {
  action: "clock_in" | "clock_out";
  time: string;
  hours?: number;
  geofenceName?: string;
  geofenceValid?: boolean;
  distance?: number;
  latitude?: number;
  longitude?: number;
}

export function AttendanceConfirmCard(props: Props) {
  const isIn = props.action === "clock_in";
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[scaleIn_0.2s_ease-out]">
      <div className={`px-5 py-4 ${isIn ? "bg-gradient-to-r from-emerald-50 to-green-50" : "bg-gradient-to-r from-orange-50 to-amber-50"} border-b border-gray-100`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isIn ? "bg-emerald-100" : "bg-orange-100"}`}>
            <svg className={`w-6 h-6 ${isIn ? "text-emerald-600" : "text-orange-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">{props.time}</h3>
            <p className="text-xs text-gray-500">{isIn ? "Clocked In" : "Clocked Out"}</p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {props.hours !== undefined && (
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-emerald-700">{props.hours}h</p>
            <p className="text-[9px] text-gray-500 uppercase font-semibold">Hours Worked</p>
          </div>
        )}
        {props.geofenceName && (
          <div className="flex items-center gap-2 text-xs">
            <svg className={`w-4 h-4 ${props.geofenceValid ? "text-emerald-500" : "text-red-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-gray-700">{props.geofenceName}</span>
            {props.distance !== undefined && <span className="text-gray-400">({props.distance}m)</span>}
          </div>
        )}
      </div>
    </div>
  );
}
