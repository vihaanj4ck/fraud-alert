"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BannedPage() {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(220,38,38,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlZjQ0NDQiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0di0xMmgtMjR2MjRoMTJWMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="overflow-hidden rounded-2xl border border-red-500/30 bg-slate-900/95 shadow-2xl shadow-red-950/50 backdrop-blur">
            <div className="border-b border-red-500/20 bg-red-950/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Cybersecurity Alert
                  </p>
                  <p className="text-sm font-medium text-slate-300">
                    TrustHive Security System
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex justify-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-950/50"
                >
                  <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </motion.span>
              </div>
              <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Account Access Suspended
              </h1>
              <p className="mt-3 text-center text-base font-medium text-red-400">
                Your account has been suspended due to suspicious activity.
              </p>
              <p className="mt-4 text-center text-sm leading-relaxed text-slate-400">
                Our system detected multiple IP addresses and devices accessing your
                account within a short time. This may indicate account compromise or
                fraudulent behavior. Access is temporarily restricted.
              </p>

              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-950/20 p-4">
                <p className="text-center text-sm font-medium text-slate-300">
                  Contact support if you believe this is an error.
                </p>
                <p className="mt-1 text-center font-mono text-sm text-red-400">
                  support@trusthive.com
                </p>
              </div>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-slate-700 hover:border-slate-500"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
