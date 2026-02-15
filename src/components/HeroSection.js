"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2 34V22aDItMTQtMTQgMTQgMTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-4 text-lg text-slate-300 sm:text-xl">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
