"use client";

interface Props {
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function StatusBanner({ message, type }: Props) {
  const config = {
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "i" },
    success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "ok" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "!" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "x" },
  };
  const c = config[type];

  const iconBg = {
    info: "bg-blue-100 text-blue-600",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    error: "bg-red-100 text-red-600",
  };

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4 flex items-start gap-3`}>
      <div className={`w-6 h-6 rounded-full ${iconBg[type]} flex items-center justify-center flex-shrink-0`}>
        <span className="text-[10px] font-bold">{c.icon}</span>
      </div>
      <p className={`text-sm font-medium ${c.text}`}>{message}</p>
    </div>
  );
}
