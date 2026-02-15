"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLanguage } = useLanguage();

  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          lang === "en" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          lang === "hi" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}
