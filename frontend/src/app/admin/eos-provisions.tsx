"use client";
import { useState, useEffect } from "react";

function fmt(n: number) { return (n || 0).toLocaleString("en-SA", { minimumFractionDigits: 2 }); }

type EOSRow = { id: number; employee_id: string; employee_name?: string; years_of_service: number;
  monthly_basic: number; monthly_provision: number; cumulative_provision: number; join_date?: string };

export default function EOSProvisions() {
  const [provisions, setProvisions] = useState<EOSRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll?section=eos_provisions").then(r => r.json()).then(d => {
      setProvisions(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;

  const totalProvision = provisions.reduce((s, p) => s + (p.cumulative_provision || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">End of Service (EOS) Provisions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Saudi Labor Law gratuity accrual per employee. Auto-calculated when payroll is posted.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <div className="font-bold text-amber-700 text-sm">SAR {fmt(totalProvision)}</div>
          <div className="text-xs text-amber-600">Total EOS Liability</div>
        </div>
      </div>

      {provisions.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-300">
          No EOS provisions calculated yet. Post a payroll run to generate provisions.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-xs text-gray-500 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-right">Years of Service</th>
                <th className="px-4 py-3 text-right">Monthly Basic</th>
                <th className="px-4 py-3 text-right">Monthly Provision</th>
                <th className="px-4 py-3 text-right">Cumulative EOS</th>
                <th className="px-4 py-3 text-left">Calculation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {provisions.map(p => {
                const years = p.years_of_service || 0;
                const calcNote = years <= 5
                  ? `0.5 month x ${years.toFixed(1)} yrs`
                  : `0.5 month x 5 yrs + 1 month x ${(years - 5).toFixed(1)} yrs`;
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{p.employee_name || p.employee_id}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-gray-700">{years.toFixed(1)}</span>
                      <span className="text-xs text-gray-400 ml-1">yrs</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(p.monthly_basic)}</td>
                    <td className="px-4 py-3 text-right text-blue-700 font-medium">{fmt(p.monthly_provision)}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">{fmt(p.cumulative_provision)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{calcNote}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 border-t">
              <tr>
                <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-700 text-xs uppercase">Total EOS Liability</td>
                <td className="px-4 py-2 text-right font-bold text-amber-700">{fmt(totalProvision)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Saudi Labor Law — End of Service Calculation</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p>First 5 years: half month basic salary for each year</p>
          <p>After 5 years: one full month basic salary for each additional year</p>
          <p>Less than 2 years service: no gratuity payable on resignation</p>
          <p>Gratuity is calculated on last drawn basic salary</p>
        </div>
      </div>
    </div>
  );
}
