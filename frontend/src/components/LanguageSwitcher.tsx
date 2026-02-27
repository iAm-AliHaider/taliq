"use client";
import { Lang, saveLang } from "@/lib/i18n";

interface Props { lang: Lang; onSwitch: (lang: Lang) => void; }

export function LanguageSwitcher({ lang, onSwitch }: Props) {
  const toggle = () => {
    const next: Lang = lang === "en" ? "ar" : "en";
    saveLang(next);
    onSwitch(next);
  };
  return (
    <button onClick={toggle} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors" title={lang === "en" ? "Switch to Arabic" : "Switch to English"}>
      {lang === "en" ? "عربي" : "EN"}
    </button>
  );
}
