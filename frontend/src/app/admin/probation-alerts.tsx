"use client";
import { useState, useEffect } from "react";

type Alert = {
  id: string; name: string; department: string; position: string;
  join_date: string; probation_end: string; contract_type: string;
  days_left: number; is_urgent: boolean; is_warning: boolean;
};

export default function ProbationAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payroll?section=probation_alerts").then(r => r.json()).then(d => {
      setAlerts(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>;

  const urgent = alerts.filter(a => a.days_left >= 0 && a.is_urgent);
  const warning = alerts.filter(a => a.days_left >= 0 && a.is_warning && !a.is_urgent);
  const upcoming = alerts.filter(a => a.days_left > 30);
  const past = alerts.filter(a => a.days_left < 0);

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-1">Probation Management</h3>
      <p className="text-xs text-gray-500 mb-4">Track probation periods and get alerts before expiry</p>

      {urgent.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-sm font-bold text-red-700 mb-2">Expiring This Week</div>
          {urgent.map(a => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-red-100 last:border-0">
              <div>
                <div className="font-medium text-red-800">{a.name}</div>
                <div className="text-xs text-red-600">{a.position} — {a.department}</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">{a.days_left} days</span>
            </div>
          ))}
        </div>
      )}

      {warning.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-bold text-amber-700 mb-2">Expiring Within 30 Days</div>
          {warning.map(a => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-amber-100 last:border-0">
              <div>
                <div className="font-medium text-amber-800">{a.name}</div>
                <div className="text-xs text-amber-600">{a.position} — {a.department}</div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold">{a.days_left} days</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 font-semibold uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">Join Date</th>
              <th className="px-4 py-3 text-left">Probation End</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Days Left</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {alerts.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.position}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{a.department}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{String(a.join_date || "").slice(0, 10)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{String(a.probation_end || "").slice(0, 10)}</td>
                <td className="px-4 py-3">
                  {a.days_left < 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">Completed</span>
                  ) : a.is_urgent ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">Urgent</span>
                  ) : a.is_warning ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">Warning</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-mono font-bold ${a.days_left < 0 ? "text-green-600" : a.is_urgent ? "text-red-600" : "text-gray-700"}`}>
                    {a.days_left < 0 ? "Done" : a.days_left}
                  </span>
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No employees with probation periods found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
