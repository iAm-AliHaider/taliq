"use client";

interface Notification {
  id: number;
  employee: string;
  phone: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

interface Props {
  notifications: Notification[];
  total: number;
  onAction?: (action: string, data?: any) => void;
}

const TYPE_COLORS: Record<string, string> = {
  leave: "bg-blue-50 text-blue-700",
  expense: "bg-emerald-50 text-emerald-700",
  loan: "bg-amber-50 text-amber-700",
  exit: "bg-red-50 text-red-700",
  grievance: "bg-orange-50 text-orange-700",
  training: "bg-purple-50 text-purple-700",
};

export function NotificationQueueCard({ notifications, total, onAction }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden animate-[slideUp_0.3s_ease-out]">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Notification Queue</h3>
          <p className="text-xs text-gray-500 mt-0.5">{total} pending delivery</p>
        </div>
        <button
          onClick={() => onAction?.("deliver_all_notifications", { ids: (notifications || []).map((n) => n.id) })}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 active:scale-95 transition-all"
        >
          Deliver All
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
        {(notifications || []).map((n) => (
          <div key={n.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  TYPE_COLORS[n.type] || "bg-gray-50 text-gray-700"
                }`}
              >
                {n.type?.toUpperCase()}
              </span>
              <span className="text-xs font-medium text-gray-800 truncate">{n.title}</span>
              <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">
                {n.createdAt?.slice(0, 16)?.replace("T", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-1">{n.message}</p>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span>To: {n.employee}</span>
              {n.phone && <span>Phone: {n.phone}</span>}
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">All caught up!</div>
        )}
      </div>
    </div>
  );
}
