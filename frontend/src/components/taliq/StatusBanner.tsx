"use client";

interface Props {
  message: string;
  type: "info" | "success" | "warning" | "error" | "loading";
}

export function StatusBanner({ message, type }: Props) {
  const config: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "i" },
    success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "ok" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "!" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: "x" },
    loading: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-700", icon: "" },
  };
  const c = config[type] || config.info;

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4 flex items-center gap-3 animate-[slideUp_0.2s_ease-out]`}>
      {type === "loading" ? (
        <svg className="w-5 h-5 text-emerald-500 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
        </svg>
      ) : (
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          type === "success" ? "bg-emerald-100 text-emerald-600" :
          type === "warning" ? "bg-amber-100 text-amber-600" :
          type === "error" ? "bg-red-100 text-red-600" :
          "bg-blue-100 text-blue-600"
        }`}>
          {type === "success" ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <span className="text-[10px] font-bold">{c.icon}</span>
          )}
        </div>
      )}
      <p className={`text-sm font-medium ${c.text}`}>{message}</p>
    </div>
  );
}
