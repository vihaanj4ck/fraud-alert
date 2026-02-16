"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const ECOMMERCE_BANNERS = [
  {
    id: "secure-electronics",
    title: "Secure Electronics Sale",
    subtitle: "AI-protected checkout on all tech & gadgets",
    cta: "Shop Electronics",
    href: "/shop?category=electronics",
    gradient: "from-rose-600 via-amber-600 to-orange-500",
    accent: "text-white",
  },
  {
    id: "ai-verified",
    title: "AI-Verified Vendors",
    subtitle: "Every seller verified. Shop with confidence.",
    cta: "Explore",
    href: "/shop",
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    accent: "text-white",
  },
  {
    id: "trusthive-store",
    title: "TrustHive Store",
    subtitle: "B2B storefront with real-time fraud protection",
    cta: "Shop Now",
    href: "/shop",
    gradient: "from-slate-800 via-slate-700 to-slate-900",
    accent: "text-white",
  },
];

const DURATION_MS = 5000;
const TRANSITION_S = 0.6;

export default function PromoBanner({ banners = ECOMMERCE_BANNERS }) {
  const [index, setIndex] = useState(0);
  const [skipTransition, setSkipTransition] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => {
        if (i === banners.length) {
          setSkipTransition(true);
          return 0;
        }
        return i + 1;
      });
    }, DURATION_MS);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (skipTransition) {
      const id = requestAnimationFrame(() => setSkipTransition(false));
      return () => cancelAnimationFrame(id);
    }
  }, [skipTransition]);

  const slides = [...banners, banners[0]];

  return (
    <div className="relative w-full overflow-hidden bg-slate-100">
      <motion.div
        className="flex"
        style={{ width: `${slides.length * 100}%` }}
        animate={{ x: `${-(index * (100 / slides.length))}%` }}
        transition={{
          duration: skipTransition ? 0 : TRANSITION_S,
          ease: "easeInOut",
        }}
      >
        {slides.map((banner, slideIndex) => (
          <div
            key={banner.id + (slideIndex === slides.length - 1 ? "-clone" : "")}
            className="flex shrink-0 items-center justify-center px-4 py-6 sm:py-8"
            style={{ width: `${100 / slides.length}%` }}
          >
            <Link
              href={banner.href}
              className={`group relative flex w-full max-w-7xl items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r ${banner.gradient} px-6 py-5 shadow-lg sm:px-10 sm:py-6`}
            >
              <div className="relative z-10">
                <h2 className={`text-xl font-bold ${banner.accent} sm:text-2xl`}>
                  {banner.title}
                </h2>
                <p className={`mt-1 text-sm opacity-90 ${banner.accent} sm:text-base`}>
                  {banner.subtitle}
                </p>
                <span className="mt-3 inline-block rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition group-hover:bg-white/30">
                  {banner.cta} →
                </span>
              </div>
              <div className="relative z-10 hidden opacity-80 sm:block">
                <div className="h-16 w-16 rounded-full bg-white/20" />
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_80%_50%,rgba(255,255,255,0.15),transparent)]" />
            </Link>
          </div>
        ))}
      </motion.div>
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              index === i || (index === banners.length && i === 0)
                ? "w-6 bg-white"
                : "w-1.5 bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
