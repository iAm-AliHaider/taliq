"use client";

interface Props {
  title: string;
  content: string;
  author?: string;
  date?: string;
  priority?: "normal" | "important" | "urgent";
  acknowledged?: boolean;
  acknowledgedCount?: number;
  totalCount?: number;
}

export function AnnouncementCard({ title, content, author, date, priority = "normal", acknowledged, acknowledgedCount, totalCount }: Props) {
  const priorityConfig = {
    normal: { bg: "bg-blue-50", border: "border-blue-100", badge: "badge-blue", iconBg: "bg-blue-100 text-blue-600" },
    important: { bg: "bg-amber-50", border: "border-amber-100", badge: "badge-gold", iconBg: "bg-amber-100 text-amber-600" },
    urgent: { bg: "bg-red-50", border: "border-red-100", badge: "badge-red", iconBg: "bg-red-100 text-red-600" },
  };
  const p = priorityConfig[priority];

  return (
    <div className="card overflow-hidden">
      <div className={`px-5 py-3 ${p.bg} border-b ${p.border} flex items-center justify-between`}>
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${p.iconBg} flex items-center justify-center`}>
            <span className="text-[10px] font-bold">A</span>
          </div>
          Announcement
        </h3>
        <span className={`badge ${p.badge}`}>{priority}</span>
      </div>

      <div className="p-5 space-y-3">
        <h4 className="text-base font-bold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{content}</p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {author && <span className="text-xs text-gray-400">By {author}</span>}
            {date && <span className="text-xs text-gray-400">{date}</span>}
          </div>
          {acknowledged !== undefined && (
            <span className={`badge ${acknowledged ? "badge-emerald" : "badge-gold"}`}>
              {acknowledged ? "Acknowledged" : "Pending"}
            </span>
          )}
        </div>

        {acknowledgedCount !== undefined && totalCount !== undefined && totalCount > 0 && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-400">Acknowledgment Rate</span>
              <span className="text-[10px] text-emerald-600 font-medium">{Math.round((acknowledgedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${(acknowledgedCount / totalCount) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
