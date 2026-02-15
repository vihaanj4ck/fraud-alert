"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { t } = useLanguage();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          TrustHive
        </Link>
        <nav className="hidden items-center gap-6 sm:flex">
          <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            {t("nav.home")}
          </Link>
          <Link href="/products" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            {t("nav.products")}
          </Link>
          <Link href="/cart" className="relative text-sm font-medium text-slate-600 hover:text-slate-900">
            {t("nav.cart")}
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Login
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/cart"
            className="flex h-9 items-center gap-1 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            {t("nav.cart")} {totalItems > 0 && `(${totalItems})`}
          </Link>
        </div>
      </div>
    </header>
  );
}
