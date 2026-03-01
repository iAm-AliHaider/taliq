"use client";
interface Material { title: string; url?: string; type: string; }
interface Props {
  courseTitle?: string;
  syllabus?: string;
  materialsUrl?: string;
  materials?: Material[];
  onAction?: (a: string, p: Record<string, unknown>) => void;
}

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "PDF", color: "bg-red-50 text-red-600 border-red-100" },
  video: { icon: "VID", color: "bg-purple-50 text-purple-600 border-purple-100" },
  link: { icon: "URL", color: "bg-blue-50 text-blue-600 border-blue-100" },
  doc: { icon: "DOC", color: "bg-sky-50 text-sky-600 border-sky-100" },
  quiz: { icon: "Q&A", color: "bg-amber-50 text-amber-600 border-amber-100" },
  default: { icon: "FILE", color: "bg-gray-50 text-gray-600 border-gray-100" },
};

export function CourseMaterialsCard({ courseTitle, syllabus, materialsUrl, materials = [], onAction }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-bold text-gray-900">Course Materials</h3>
        {courseTitle && <p className="text-xs text-gray-500">{courseTitle}</p>}
      </div>

      {/* Syllabus */}
      {syllabus && (
        <div className="px-5 py-4 border-b border-gray-50">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Syllabus</h4>
          <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{syllabus}</div>
        </div>
      )}

      {/* External materials link */}
      {materialsUrl && (
        <div className="px-5 py-3 border-b border-gray-50">
          <a href={materialsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <div>
              <p className="text-sm font-medium text-emerald-700">Access Course Materials</p>
              <p className="text-[10px] text-emerald-500 truncate max-w-[250px]">{materialsUrl}</p>
            </div>
          </a>
        </div>
      )}

      {/* Materials list */}
      {materials.length > 0 && (
        <div className="p-4 space-y-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Resources</h4>
          {materials.map((m, i) => {
            const t = TYPE_ICON[m.type] || TYPE_ICON.default;
            return (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${t.color} border flex items-center justify-center`}>
                    <span className="text-[10px] font-bold">{t.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.title}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{m.type}</p>
                  </div>
                </div>
                {m.url && (
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Open</a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!syllabus && !materialsUrl && materials.length === 0 && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-gray-400">No materials available for this course yet</p>
        </div>
      )}
    </div>
  );
}
