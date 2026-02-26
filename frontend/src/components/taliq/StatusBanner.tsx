"use client";

interface StatusBannerProps {
  message: string;
  type: "info" | "success" | "warning" | "error";
}

const STYLES = {
  info: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", icon: "ℹ️" },
  success: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "✅" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", icon: "⚠️" },
  error: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: "❌" },
};

export function StatusBanner({ message, type }: StatusBannerProps) {
  const s = STYLES[type] || STYLES.info;
  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${s.bg} border ${s.border} rounded-xl`}>
      <span className="text-sm">{s.icon}</span>
      <p className={`text-sm ${s.text} flex-1`}>{message}</p>
    </div>
  );
}
