"use client";

import { useState, useRef, useCallback } from "react";
import ProductImage from "@/components/ProductImage";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";

function getOriginalPrice(product) {
  if (product.originalPrice != null && product.originalPrice > product.price) {
    return product.originalPrice;
  }
  return Math.round(product.price * 1.15);
}

const TILT_MAX = 8;

export default function ProductCard({ product, featured, index = 0 }) {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const originalPrice = getOriginalPrice(product);
  const hasDiscount = originalPrice > product.price;
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [addedFeedback, setAddedFeedback] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotate({ x: -y * TILT_MAX, y: x * TILT_MAX });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setRotate({ x: 0, y: 0 });
  }, []);

  const handleAddToCart = useCallback(() => {
    addToCart(product);
    setAddedFeedback(true);
    const id = setTimeout(() => setAddedFeedback(false), 1500);
    return () => clearTimeout(id);
  }, [addToCart, product]);

  return (
    <div className="origin-center" style={{ perspective: "1000px" }}>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300"
        style={{
          transformStyle: "preserve-3d",
          rotateX: rotate.x,
          rotateY: rotate.y,
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-square overflow-hidden bg-slate-100"
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          categoryId={product.categoryId}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={
            featured
              ? "(max-width: 768px) 50vw, 25vw"
              : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          }
        />
        <span className="absolute left-2 top-2 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
          AI Secured
        </span>
        <span className="absolute right-2 top-2 rounded-lg border border-slate-200 bg-white/95 px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm">
          Verified Vendor
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-slate-900 line-clamp-2 transition-colors group-hover:text-amber-600">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
          {product.description}
        </p>
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-900">
              {t("rupee")}
              {product.price.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">
                {t("rupee")}
                {originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <div className="mt-3 overflow-hidden">
            <motion.button
              type="button"
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 sm:translate-y-4 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 group-hover:bg-amber-600 group-hover:shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {addedFeedback ? (
                <>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.span>
                  <span>Added</span>
                </>
              ) : (
                t("addToCart")
              )}
            </motion.button>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
}
