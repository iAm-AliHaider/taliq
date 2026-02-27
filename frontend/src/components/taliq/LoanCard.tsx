"use client";

interface Props {
  employeeName: string;
  loanType: string;
  amount: number;
  currency: string;
  remainingBalance?: number;
  monthlyInstallment?: number;
  installmentsLeft?: number;
  eligible?: boolean;
  maxAmount?: number;
  status?: "active" | "eligible" | "ineligible" | "pending" | "completed";
}

export function LoanCard({ employeeName, loanType, amount, currency, remainingBalance, monthlyInstallment, installmentsLeft, eligible, maxAmount, status = "active" }: Props) {
  const fmt = (n: number) => n.toLocaleString();

  const statusConfig: Record<string, { badge: string; label: string }> = {
    active: { badge: "badge-blue", label: "Active" },
    eligible: { badge: "badge-emerald", label: "Eligible" },
    ineligible: { badge: "badge-red", label: "Not Eligible" },
    pending: { badge: "badge-gold", label: "Pending" },
    completed: { badge: "badge-gray", label: "Completed" },
  };
  const s = statusConfig[status];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Loan Details</h3>
          <p className="text-xs text-gray-400">{employeeName} • {loanType}</p>
        </div>
        <span className={`badge ${s.badge}`}>{s.label}</span>
      </div>

      <div className="p-5 space-y-4">
        {status === "eligible" || status === "ineligible" ? (
          <div className={`rounded-xl p-4 text-center ${eligible ? "bg-emerald-50" : "bg-red-50"}`}>
            <p className="text-xs text-gray-500 mb-1">{eligible ? "Maximum Loan Amount" : "Not eligible at this time"}</p>
            {maxAmount && <p className="text-2xl font-bold text-emerald-600">{fmt(maxAmount)} {currency}</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Loan Amount" value={`${fmt(amount)} ${currency}`} />
              {remainingBalance !== undefined && <Stat label="Remaining" value={`${fmt(remainingBalance)} ${currency}`} />}
              {monthlyInstallment !== undefined && <Stat label="Monthly EMI" value={`${fmt(monthlyInstallment)} ${currency}`} />}
              {installmentsLeft !== undefined && <Stat label="Installments Left" value={`${installmentsLeft}`} />}
            </div>
            {remainingBalance !== undefined && amount > 0 && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-400">Repayment Progress</span>
                  <span className="text-[10px] text-emerald-600 font-medium">{Math.round(((amount - remainingBalance) / amount) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${((amount - remainingBalance) / amount) * 100}%` }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
