"use client";

import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product, featured }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:border-slate-300">
      <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-slate-100">
        <ProductImage
          src={product.image}
          alt={product.name}
          categoryId={product.categoryId}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes={featured ? "(max-width: 768px) 50vw, 25vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-slate-900 line-clamp-2 transition-colors hover:text-emerald-600">{product.name}</h3>
        </Link>
        <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{product.description}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="text-xl font-bold text-slate-900">
            {t("rupee")}{product.price.toLocaleString("en-IN")}
          </span>
          <button
            type="button"
            onClick={() => addToCart(product)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
          >
            {t("addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
