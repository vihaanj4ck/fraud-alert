"use client";

import { useParams, useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { getProductById } from "@/lib/data/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const product = getProductById(params.id);
  const { t } = useLanguage();
  const { addToCart } = useCart();

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <p className="text-slate-600">Product not found.</p>
            <Link href="/products" className="mt-2 inline-block text-emerald-600 hover:underline">
              Back to products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-slate-700">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-900">{product.name}</span>
        </nav>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-md">
            <ProductImage
              src={product.image}
              alt={product.name}
              categoryId={product.categoryId}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              {t("rupee")}{product.price.toLocaleString("en-IN")}
            </p>
            <p className="mt-4 text-slate-600">{product.description}</p>
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => {
                  addToCart(product);
                  router.push("/cart");
                }}
                className="rounded-xl bg-slate-900 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-slate-800"
              >
                {t("addToCart")}
              </button>
              <Link
                href="/cart"
                className="rounded-xl border border-slate-300 bg-white px-8 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t("nav.cart")}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
