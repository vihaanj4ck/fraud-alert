"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { CATEGORIES } from "@/lib/data/categories";
import { ALL_PRODUCTS } from "@/lib/data/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
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
    <div className="space-y-6">
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
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <a
          href="/shop"
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            !categorySlug
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All
        </a>
        {CATEGORIES.map((cat) => (
          <a
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              categorySlug === cat.slug
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {cat.name}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-500">No products match your filters.</p>
          <a href="/shop" className="mt-2 inline-block text-blue-600 hover:underline">
            Clear filters
          </a>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-200" />}>
          <ShopContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
