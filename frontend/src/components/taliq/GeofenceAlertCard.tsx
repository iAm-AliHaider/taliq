"use client";

interface Props {
  type: "blocked" | "success";
  message: string;
  latitude?: number;
  longitude?: number;
  nearestFence?: string;
  distance?: number;
}

export function GeofenceAlertCard(props: Props) {
  const isBlocked = props.type === "blocked";
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out] ${isBlocked ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isBlocked ? "bg-red-100" : "bg-emerald-100"}`}>
            <svg className={`w-5 h-5 ${isBlocked ? "text-red-600" : "text-emerald-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isBlocked
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
            </svg>
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-bold ${isBlocked ? "text-red-800" : "text-emerald-800"}`}>
              {isBlocked ? "Location Outside Geofence" : "Location Verified"}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{props.message}</p>
            {props.distance && (
              <p className="text-[10px] text-gray-400 mt-2">
                {props.nearestFence && <span>Nearest: {props.nearestFence} &middot; </span>}
                Distance: {props.distance}m
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
