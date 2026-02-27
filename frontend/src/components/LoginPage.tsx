"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
}

interface LoginPageProps {
  onLogin: (employee: { id: string; name: string; position: string; department: string; isManager: boolean }) => void;
}

function AuroraBackground() {
  return (
    <div className="aurora-bg">
      <div className="aurora-blob" style={{ width: "700px", height: "700px", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", top: "-15%", left: "-10%", animationDelay: "0s" }} />
      <div className="aurora-blob" style={{ width: "500px", height: "500px", background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", bottom: "-10%", right: "-5%", animationDelay: "-7s" }} />
      <div className="aurora-blob" style={{ width: "400px", height: "400px", background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)", top: "50%", left: "40%", animationDelay: "-14s" }} />
      <div className="absolute inset-0 geo-grid" />
    </div>
  );
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then(setEmployees)
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmployee, pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Authentication failed");
        return;
      }

      const employee = await res.json();
      onLogin({ ...employee, isManager: employee.isManager });
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAFBFC] flex flex-col relative overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 mb-4">
              <span className="text-white text-2xl font-bold">ت</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Taliq</h1>
            <p className="text-sm text-gray-500 mt-1">Voice-First HR Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                required
              >
                <option value="">Select your profile</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.position}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">PIN Code</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                placeholder="Enter 4-digit PIN"
                className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                maxLength={4}
                required
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedEmployee || pin.length !== 4}
              className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Default PINs: 1234, 2345, 3456, 4567, 5678, 6789, 7890
          </p>
        </div>
      </div>
    </div>
  );
}
