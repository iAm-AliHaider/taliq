"use client";

interface Asset { ref: string; type: string; name: string; serialNumber: string; condition: string; assignedDate: string; }

const ICONS: Record<string, string> = { laptop: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25", phone: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" };

export function AssetListCard({ assets }: { assets: Asset[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-[slideUp_0.2s_ease-out]">
      <div className="px-5 py-3 bg-gradient-to-r from-cyan-50 to-sky-50 border-b flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">My Company Assets</h3>
        <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">{assets.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {(assets || []).map(a => (
          <div key={a.ref} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
            <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ICONS[a.type] || ICONS.laptop} /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
              <p className="text-[10px] text-gray-400">{a.ref} - {a.serialNumber}</p>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${a.condition === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{a.condition}</span>
              <p className="text-[10px] text-gray-300 mt-0.5">{a.assignedDate}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
