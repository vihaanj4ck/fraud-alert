"use client";

import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, featured }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-200">
      <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-100">
        <ProductImage
          src={product.image}
          alt={product.name}
          categoryId={product.categoryId}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={featured ? "(max-width: 768px) 50vw, 25vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"}
        />
        <span className="absolute left-2 top-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
          AI-Verified
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-slate-900 line-clamp-2 transition-colors group-hover:text-blue-600">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-lg font-bold text-slate-900">
            {t("rupee")}{product.price.toLocaleString("en-IN")}
          </span>
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            {t("addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
