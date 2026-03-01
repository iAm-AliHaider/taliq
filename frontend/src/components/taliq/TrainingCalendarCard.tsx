"use client";
interface Training { course_id?: number; title: string; category: string; duration_hours: number; start_date?: string; end_date?: string; schedule?: string; location?: string; status: string; enrollment_date?: string; mandatory: number; }
interface Props { trainings?: Training[]; upcoming?: Training[]; onAction?: (a: string, p: Record<string, unknown>) => void; }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function TrainingCalendarCard({ trainings = [], upcoming = [], onAction }: Props) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Build calendar grid
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Map training dates to days
  const trainingDays = new Map<number, Training[]>();
  [...trainings, ...upcoming].forEach(t => {
    const dateStr = t.start_date || t.enrollment_date;
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      const day = d.getDate();
      if (!trainingDays.has(day)) trainingDays.set(day, []);
      trainingDays.get(day)!.push(t);
    }
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Training Calendar</h3>
          <p className="text-xs text-gray-500">{MONTHS[currentMonth]} {currentYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Completed</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Enrolled</span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400"><span className="w-2 h-2 rounded-full bg-red-400"></span>Mandatory</span>
        </div>
      </div>
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>)}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} className="h-16" />;
            const dayTrainings = trainingDays.get(day) || [];
            const isToday = day === now.getDate();
            return (
              <div key={day} className={`h-16 rounded-lg border p-1 transition-all ${isToday ? "border-emerald-300 bg-emerald-50/50" : "border-gray-100 hover:border-gray-200"}`}>
                <p className={`text-[10px] font-medium ${isToday ? "text-emerald-600" : "text-gray-500"}`}>{day}</p>
                <div className="mt-0.5 space-y-0.5">
                  {dayTrainings.slice(0, 2).map((t, j) => (
                    <div key={j} className={`px-1 py-0.5 rounded text-[7px] font-medium truncate ${t.status === "completed" ? "bg-emerald-100 text-emerald-700" : t.mandatory ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{t.title.slice(0, 12)}</div>
                  ))}
                  {dayTrainings.length > 2 && <p className="text-[7px] text-gray-400">+{dayTrainings.length - 2} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming trainings list */}
      {upcoming.length > 0 && (
        <div className="border-t border-gray-100 p-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upcoming</h4>
          <div className="space-y-2">
            {upcoming.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.title}</p>
                  <p className="text-[10px] text-gray-400">{t.start_date ? `Starts ${t.start_date}` : ""} {t.location ? `@ ${t.location}` : ""} {t.schedule || ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {t.mandatory ? <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[8px] font-bold">Required</span> : null}
                  <span className="text-[10px] text-gray-400">{t.duration_hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
