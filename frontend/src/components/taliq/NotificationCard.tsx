"use client";
interface Notification { id?: number; type: string; title: string; message?: string; read: number; created_at?: string; }
interface Props { notifications?: Notification[]; unreadCount?: number; onAction?: (a: string, p: Record<string, unknown>) => void; }
const TYPE_CLR: Record<string, { bg: string; icon: string }> = { leave: { bg: "bg-blue-50 text-blue-600", icon: "LV" }, loan: { bg: "bg-indigo-50 text-indigo-600", icon: "LN" }, document: { bg: "bg-orange-50 text-orange-600", icon: "DC" }, announcement: { bg: "bg-purple-50 text-purple-600", icon: "AN" }, approval: { bg: "bg-emerald-50 text-emerald-600", icon: "AP" }, review: { bg: "bg-violet-50 text-violet-600", icon: "RV" }, training: { bg: "bg-teal-50 text-teal-600", icon: "TR" } };
export function NotificationCard({ notifications = [], unreadCount = 0, onAction }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div><h3 className="text-base font-bold text-gray-900">Notifications</h3></div>
        {unreadCount > 0 && <span className="px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-[10px] font-bold text-red-600">{unreadCount} new</span>}
      </div>
      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {notifications.map((n, i) => { const tc = TYPE_CLR[n.type] || { bg: "bg-gray-50 text-gray-600", icon: "NT" }; return (
          <div key={i} className={`px-5 py-3.5 flex items-start gap-3 ${n.read ? "opacity-60" : ""} hover:bg-gray-50/50 transition-colors`}>
            <div className={`w-8 h-8 rounded-lg ${tc.bg} flex items-center justify-center flex-shrink-0`}><span className="text-[9px] font-bold">{tc.icon}</span></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between"><p className={`text-sm ${n.read ? "text-gray-500" : "font-medium text-gray-900"}`}>{n.title}</p>{!n.read && <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}</div>
              {n.message && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{n.message}</p>}
              {n.created_at && <p className="text-[9px] text-gray-300 mt-0.5">{n.created_at.slice(0, 16)}</p>}
            </div>
          </div>); })}
        {notifications.length === 0 && <div className="px-5 py-8 text-center"><p className="text-sm text-gray-400">No notifications</p></div>}
      </div>
    </div>);
}
