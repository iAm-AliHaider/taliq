"use client";

interface Employee { id: string; name: string; department: string; basic: number; housing: number; transport: number; gross: number; loanDeduction: number; }

export function PayrollSummaryCard({ employees, totalGross, totalDeductions, totalNet }: { employees: Employee[]; totalGross: number; totalDeductions: number; totalNet: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">Monthly Payroll Summary</h3>
          <div className="flex gap-3 text-[10px]">
            <span className="text-gray-500">Gross: <strong className="text-gray-900">{totalGross?.toLocaleString()}</strong></span>
            <span className="text-gray-500">Net: <strong className="text-emerald-600">{totalNet?.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-3 py-2 text-[10px] text-gray-400 uppercase font-semibold">Employee</th>
            <th className="text-right px-3 py-2 text-[10px] text-gray-400 uppercase font-semibold">Basic</th>
            <th className="text-right px-3 py-2 text-[10px] text-gray-400 uppercase font-semibold">Housing</th>
            <th className="text-right px-3 py-2 text-[10px] text-gray-400 uppercase font-semibold">Transport</th>
            <th className="text-right px-3 py-2 text-[10px] text-gray-400 uppercase font-semibold">Gross</th>
            <th className="text-right px-3 py-2 text-[10px] text-gray-400 uppercase font-semibold">Deductions</th>
            <th className="text-right px-3 py-2 text-[10px] text-gray-400 uppercase font-semibold">Net</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {(employees || []).map(e => (
              <tr key={e.id} className="hover:bg-gray-50/50">
                <td className="px-3 py-2">
                  <p className="text-xs font-medium text-gray-900">{e.name}</p>
                  <p className="text-[10px] text-gray-400">{e.department}</p>
                </td>
                <td className="px-3 py-2 text-xs text-right text-gray-700">{e.basic?.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-right text-gray-700">{e.housing?.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-right text-gray-700">{e.transport?.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-right font-medium text-gray-900">{e.gross?.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-right text-red-600">{e.loanDeduction > 0 ? `-${e.loanDeduction?.toLocaleString()}` : "-"}</td>
                <td className="px-3 py-2 text-xs text-right font-bold text-emerald-600">{((e.gross || 0) - (e.loanDeduction || 0)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
