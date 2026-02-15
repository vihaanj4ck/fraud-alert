"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { CATEGORIES } from "@/lib/data/categories";

const ICONS = [
  "📱", "👕", "🏠", "💄", "📚", "⚽", "🧸", "🛒", "👟", "👜",
];

export default function CategoryGrid() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{t("categories")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:border-amber-200 hover:-translate-y-0.5"
            >
              <span className="text-3xl">{ICONS[i]}</span>
              <span className="mt-2 text-center text-sm font-medium text-slate-700">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
