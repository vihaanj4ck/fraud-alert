"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "./ProductCard";

export default function FeaturedSection({ products }) {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">{t("featured")}</h2>
        <Link href="/products" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
          {t("viewAll")} →
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} featured />
        ))}
      </div>
    </section>
  );
}
