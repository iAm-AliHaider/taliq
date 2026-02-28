"use client";

interface Asset { ref: string; type: string; name: string; serialNumber: string; assignedTo: string; status: string; condition: string; }

export function AssetInventoryCard({ assets }: { assets: Asset[] }) {
  const assigned = assets.filter(a => a.status === "assigned").length;
  const available = assets.filter(a => a.status === "available").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-cyan-50 to-sky-50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Asset Inventory</h3>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-200">{assigned} assigned</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">{available} available</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Asset</th>
            <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Type</th>
            <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Assigned To</th>
            <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase font-semibold">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {assets.map(a => (
              <tr key={a.ref} className="hover:bg-gray-50/50">
                <td className="px-4 py-2">
                  <p className="text-xs font-medium text-gray-900">{a.name}</p>
                  <p className="text-[10px] text-gray-400">{a.ref}</p>
                </td>
                <td className="px-4 py-2 text-xs text-gray-600 capitalize">{a.type.replace("_", " ")}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{a.assignedTo}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${a.status === "assigned" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
