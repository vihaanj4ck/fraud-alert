"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/data/categories";
import { ALL_PRODUCTS } from "@/lib/data/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import LiveSecurityMonitor from "@/components/LiveSecurityMonitor";
import CategoryBar from "@/components/CategoryBar";
import { useLanguage } from "@/context/LanguageContext";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || "";
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = categorySlug
      ? ALL_PRODUCTS.filter((p) => p.categoryId === categorySlug)
      : ALL_PRODUCTS;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categorySlug, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <Suspense fallback={null}>
        <CategoryBar />
      </Suspense>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">{t("nav.products")}</h1>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-500">{t("filterBy")}:</span>
          <a
            href="/products"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              !categorySlug
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 shadow hover:bg-slate-50"
            }`}
          >
            {t("allCategories")}
          </a>
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                categorySlug === cat.slug
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 shadow hover:bg-slate-50"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-slate-500">No products match your filters.</p>
          )}
        </div>
        <div className="shrink-0 lg:w-72">
          <div className="lg:sticky lg:top-[140px]">
            <LiveSecurityMonitor />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
          <ProductsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
