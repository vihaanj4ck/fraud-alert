"use client";

import Link from "next/link";

export default function BannedPage() {
  return (
    <div className="flex min-h-screen flex-col bg-red-600">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border-4 border-red-800 bg-white p-8 shadow-2xl">
          <div className="flex justify-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-6xl">
              🚫
            </span>
          </div>
          <h1 className="mt-6 text-center text-3xl font-black uppercase tracking-tight text-red-700 sm:text-4xl">
            Account Banned
          </h1>
          <p className="mt-4 text-center text-lg font-bold text-red-600">
            Your account has been suspended due to suspicious activity.
          </p>
          <p className="mt-3 text-center text-slate-600">
            Our system detected multiple IP addresses accessing your account within a short time.
            This may indicate account compromise or fraudulent behavior.
          </p>
          <div className="mt-8 rounded-xl border-2 border-red-300 bg-red-50 p-5">
            <p className="text-center font-semibold text-red-900">
              Contact support if you believe this is an error.
            </p>
            <p className="mt-1 text-center text-red-700">support@trusthive.com</p>
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="rounded-lg border-2 border-slate-300 bg-white px-8 py-3 font-semibold text-slate-700 shadow hover:bg-slate-50"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
