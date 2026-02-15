"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [onlySuspicious, setOnlySuspicious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url = onlySuspicious ? "/api/admin/transactions?suspicious=true" : "/api/admin/transactions";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        setTransactions(data.transactions || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [onlySuspicious]);

  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const formatAmount = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              ← TrustHive
            </Link>
            <h1 className="text-xl font-bold text-slate-900">Fraud Detection – Transactions</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            {onlySuspicious ? " (Suspicious only)" : ""}
          </p>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={onlySuspicious}
              onChange={(e) => setOnlySuspicious(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            <span className="text-sm font-medium text-slate-700">Show only risky (non-Safe)</span>
          </label>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            Loading transactions…
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      User ID
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rule
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      AI
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Final
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      AI Reasoning
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {transactions.map((tx) => {
                    const isBlocked = tx.status === "Blocked" || tx.status === "Suspicious";
                    const isMediumRisk = tx.status && tx.status.includes("Medium Risk") && !isBlocked;
                    const rowBg = isBlocked ? "bg-red-50/80" : isMediumRisk ? "bg-amber-50/80" : "bg-white hover:bg-slate-50/50";
                    const badgeClass = isBlocked
                      ? "bg-red-100 text-red-800"
                      : isMediumRisk
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800";
                    return (
                    <tr key={tx.id} className={rowBg}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                        {tx.userId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                        {tx.ruleScore}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-slate-700">
                        {tx.aiScore}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        {tx.finalScore}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-sm text-slate-600">
                        <span className="line-clamp-2" title={tx.reasoning}>
                          {tx.reasoning || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {formatDate(tx.timestamp)}
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
