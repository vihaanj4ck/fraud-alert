"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, getToken } = useAuth();
  const [accountData, setAccountData] = useState(null);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.replace("/login");
      return;
    }
    const token = getToken?.();
    if (!token) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setAccountData(data.user);
      })
      .catch(() => {});
  }, [isAuthenticated, loading, getToken, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  const savedCards = accountData?.savedCards || [];
  const ipLogs = accountData?.ipLogs || [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">My Account</h1>
        <p className="mt-1 text-slate-600">{user.email}</p>

        <div className="mt-8 space-y-8">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Saved Cards</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cards saved for faster checkout. Only last 4 digits are stored.
            </p>
            {savedCards.length === 0 ? (
              <p className="mt-4 text-slate-500">No saved cards yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {savedCards.map((card, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="font-mono text-slate-700">
                      {card.masked || `•••• •••• •••• ${card.last4}`}
                    </span>
                    <span className="text-sm text-slate-500">{card.brand || "Card"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Login History</h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent IP addresses and devices used to access your account.
            </p>
            {ipLogs.length === 0 ? (
              <p className="mt-4 text-slate-500">No login history yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="py-3 pr-4">IP</th>
                      <th className="py-3 pr-4">Device</th>
                      <th className="py-3 pr-4">OS</th>
                      <th className="py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipLogs.map((log, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-3 pr-4 font-mono text-slate-700">{log.ip || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{log.deviceModel || "—"}</td>
                        <td className="py-3 pr-4 text-slate-600">{log.os || "—"}</td>
                        <td className="py-3 text-slate-500">
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="mt-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            Continue shopping
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
