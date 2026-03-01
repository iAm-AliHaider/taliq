"use client";

interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
  address: string;
}

export function GeofenceListCard({ locations }: { locations: Location[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Office Locations</h3>
            <p className="text-[10px] text-gray-400">{locations.length} registered geofence{locations.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {locations.map(loc => (
          <div key={loc.id} className="px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{loc.name}</h4>
                <p className="text-[10px] text-gray-500">{loc.address}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[9px] font-semibold border border-teal-200">
                  {loc.radius}m radius
                </span>
                <p className="text-[9px] text-gray-400 mt-1">{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
