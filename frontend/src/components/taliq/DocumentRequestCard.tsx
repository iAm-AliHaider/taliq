"use client";

interface Props {
  employeeName: string;
  documentType: string;
  requestDate?: string;
  status: "requested" | "processing" | "ready" | "delivered";
  estimatedDate?: string;
  referenceNumber?: string;
}

export function DocumentRequestCard({ employeeName, documentType, requestDate, status, estimatedDate, referenceNumber }: Props) {
  const statusConfig = {
    requested: { badge: "badge-blue", label: "Requested", icon: "📋", step: 1 },
    processing: { badge: "badge-gold", label: "Processing", icon: "⏳", step: 2 },
    ready: { badge: "badge-emerald", label: "Ready", icon: "✅", step: 3 },
    delivered: { badge: "badge-gray", label: "Delivered", icon: "📬", step: 4 },
  };
  const s = statusConfig[status];
  const steps = ["Requested", "Processing", "Ready", "Delivered"];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{s.icon} Document Request</h3>
          <p className="text-xs text-gray-400">{employeeName}</p>
        </div>
        <span className={`badge ${s.badge}`}>{s.label}</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Document Type</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{documentType}</p>
          </div>
          {referenceNumber && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Reference</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{referenceNumber}</p>
            </div>
          )}
          {requestDate && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Requested</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{requestDate}</p>
            </div>
          )}
          {estimatedDate && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Estimated</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{estimatedDate}</p>
            </div>
          )}
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-full h-1.5 rounded-full ${i < s.step ? "bg-emerald-500" : "bg-gray-100"} transition-all duration-500`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map((step, i) => (
            <span key={step} className={`text-[9px] ${i < s.step ? "text-emerald-600 font-semibold" : "text-gray-300"}`}>{step}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
