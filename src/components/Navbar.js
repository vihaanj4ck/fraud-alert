"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { CATEGORIES } from "@/lib/data/categories";

export default function Navbar() {
  const router = useRouter();
  const { t } = useLanguage();
  const { totalItems } = useCart();
  const { user, logout, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const q = search.trim();
      if (q) router.push(`/shop?q=${encodeURIComponent(q)}`);
      else router.push("/shop");
    },
    [search, router]
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight text-amber-500 hover:text-amber-600 sm:text-2xl"
          >
            TrustHive
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 max-w-xl sm:flex">
            <div className="flex w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-50 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="flex-1 border-0 bg-transparent px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="bg-amber-500 px-4 py-2.5 text-white hover:bg-amber-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          <nav className="flex items-center gap-1 sm:gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategories(!showCategories)}
                onBlur={() => setTimeout(() => setShowCategories(false), 150)}
                className="hidden items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:flex"
              >
                Categories
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCategories && (
                <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?category=${cat.slug}`}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  <Link
                    href="/shop"
                    className="block border-t border-slate-100 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-slate-50"
                  >
                    View All
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:block"
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/shop"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:block"
            >
              Shop
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">{t("nav.cart")}</span>
              {totalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            <div className="relative">
              {isAuthenticated && user ? (
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  onBlur={() => setTimeout(() => setShowProfileMenu(false), 150)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200"
                >
                  <span className="text-sm font-semibold">
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              )}
              {showProfileMenu && user && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-2">
                    <p className="truncate text-sm font-medium text-slate-900">{user.name || "User"}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/cart"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    My Cart
                  </Link>
                  <Link
                    href="/checkout"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Checkout
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                      router.push("/");
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <LanguageSwitcher />
          </nav>
        </div>

        <form onSubmit={handleSearch} className="mt-2 sm:hidden">
          <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-slate-50">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="flex-1 border-0 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-500"
            />
            <button type="submit" className="bg-amber-500 px-3 py-2 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </header>
  );
}
