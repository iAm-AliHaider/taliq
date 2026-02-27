"use client";

interface Props {
  employeeName: string;
  destination: string;
  travelType: "business" | "vacation";
  startDate: string;
  endDate: string;
  days: number;
  perDiem?: number;
  totalAllowance?: number;
  currency?: string;
  status: string;
  flightBooked?: boolean;
  hotelBooked?: boolean;
  visaRequired?: boolean;
  visaStatus?: string;
}

export function TravelRequestCard({ employeeName, destination, travelType, startDate, endDate, days, perDiem, totalAllowance, currency = "SAR", status, flightBooked, hotelBooked, visaRequired, visaStatus }: Props) {
  const statusConfig: Record<string, any> = {
    draft: { badge: "badge-gray", label: "Draft" },
    pending: { badge: "badge-gold", label: "Pending" },
    approved: { badge: "badge-emerald", label: "Approved" },
    rejected: { badge: "badge-red", label: "Rejected" },
    completed: { badge: "badge-blue", label: "Completed" },
  };
  const s = statusConfig[status] || statusConfig[Object.keys(statusConfig)[0]];
  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-cyan-50 border-b border-cyan-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">✈️ Travel Request</h3>
          <p className="text-xs text-gray-400">{employeeName}</p>
        </div>
        <span className={`badge ${s.badge}`}>{s.label}</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Destination" value={destination} />
          <Stat label="Type" value={travelType === "business" ? "Business" : "Vacation"} />
          <Stat label="From" value={startDate} />
          <Stat label="To" value={endDate} />
          <Stat label="Duration" value={`${days} days`} />
          {perDiem && <Stat label="Per Diem" value={`${fmt(perDiem)} ${currency}/day`} />}
        </div>

        {totalAllowance && (
          <div className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Allowance</span>
            <span className="text-lg font-bold text-emerald-600">{fmt(totalAllowance)} {currency}</span>
          </div>
        )}

        {/* Checklist */}
        {(flightBooked !== undefined || hotelBooked !== undefined || visaRequired !== undefined) && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Travel Checklist</p>
            {flightBooked !== undefined && <Check label="Flight Booked" checked={flightBooked} />}
            {hotelBooked !== undefined && <Check label="Hotel Booked" checked={hotelBooked} />}
            {visaRequired !== undefined && (
              <Check label={`Visa ${visaStatus || (visaRequired ? "Required" : "Not Required")}`} checked={!visaRequired || visaStatus === "Approved"} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function Check({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${checked ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-300"}`}>
        {checked ? "✓" : "○"}
      </div>
      <span className={`text-xs ${checked ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}
