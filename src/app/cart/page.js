"use client";

import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { t } = useLanguage();
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("cart.title")}</h1>
        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-600">{t("cart.empty")}</p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800"
            >
              {t("nav.products")}
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ul className="space-y-4">
                {items.map(({ product, quantity }) => (
                  <li
                    key={product.id}
                    className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-md transition-shadow hover:shadow-lg"
                  >
                    <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <ProductImage src={product.image} alt={product.name} categoryId={product.categoryId} fill className="object-cover" sizes="112px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${product.id}`} className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {t("rupee")}{product.price.toLocaleString("en-IN")} × {quantity}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="h-9 w-9 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="ml-2 text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          {t("cart.remove")}
                        </button>
                      </div>
                    </div>
                    <div className="text-right font-bold text-slate-900 text-lg">
                      {t("rupee")}{(product.price * quantity).toLocaleString("en-IN")}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sticky top-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Order summary</h3>
                <div className="flex justify-between text-base">
                  <span className="text-slate-600">{t("cart.total")}</span>
                  <span className="font-bold text-slate-900 text-xl">
                    {t("rupee")}{totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  className="mt-5 block w-full rounded-xl bg-slate-900 py-3.5 text-center font-semibold text-white hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
                >
                  {t("cart.proceedToCheckout")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
