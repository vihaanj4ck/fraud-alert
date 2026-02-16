"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/data/categories";
import { ALL_PRODUCTS } from "@/lib/data/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import LiveSecurityMonitor from "@/components/LiveSecurityMonitor";
import PromoBanner from "@/components/PromoBanner";
import CategoryBar from "@/components/CategoryBar";
import { useLanguage } from "@/context/LanguageContext";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") || "";
  const searchQuery = searchParams.get("q") || "";
  const { t } = useLanguage();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const filtered = useMemo(() => {
    let list = categorySlug
      ? ALL_PRODUCTS.filter((p) => p.categoryId === categorySlug)
      : ALL_PRODUCTS;
    const q = (searchQuery || localSearch || "").trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categorySlug, searchQuery, localSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (localSearch.trim()) params.set("q", localSearch.trim());
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="space-y-0"
    >
      <PromoBanner />
      <Suspense fallback={null}>
        <CategoryBar />
      </Suspense>
      <div className="space-y-6 px-0 pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">
          {t("nav.products")}
        </h1>
        <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
          <input
            type="search"
            placeholder={t("search")}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-500 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-amber-600"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-slate-200 bg-white py-16 text-center"
            >
              <p className="text-slate-500">No products match your filters.</p>
              <a href="/shop" className="mt-2 inline-block text-amber-600 hover:underline">
                Clear filters
              </a>
            </motion.div>
          )}
        </div>

        <div className="shrink-0 lg:w-72">
          <div className="lg:sticky lg:top-[140px]">
            <LiveSecurityMonitor />
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-0 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-200" />}>
          <ShopContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
