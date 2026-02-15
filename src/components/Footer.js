"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t("footer.about")}</h3>
            <p className="mt-2 text-sm text-slate-600">{t("footer.desc")}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t("footer.links")}</h3>
            <ul className="mt-2 space-y-2">
              <li>
                <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-sm text-slate-600 hover:text-slate-900">
                  {t("nav.products")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-slate-600 hover:text-slate-900">
                  {t("nav.cart")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{t("footer.contact")}</h3>
            <p className="mt-2 text-sm text-slate-600">support@trusthive.com</p>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} TrustHive. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
