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
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-slate-900">{t("categories")}</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {CATEGORIES.map((cat, i) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="text-3xl">{ICONS[i]}</span>
            <span className="mt-2 text-center text-sm font-medium text-slate-700">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
