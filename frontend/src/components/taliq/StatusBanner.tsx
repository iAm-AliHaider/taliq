"use client";

interface Props {
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export function StatusBanner({ message, type }: Props) {
  const config = {
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "ℹ️" },
    success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "✅" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "⚠️" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "❌" },
  };
  const c = config[type];

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4 flex items-start gap-3`}>
      <span className="text-base flex-shrink-0">{c.icon}</span>
      <p className={`text-sm font-medium ${c.text}`}>{message}</p>
    </div>
  );
}
