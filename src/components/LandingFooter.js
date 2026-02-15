"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

function StatusIndicator({ label, status, statusText }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          status ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
        }`}
      />
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className="text-sm text-slate-500">—</span>
      <span className={`text-sm font-semibold ${status ? "text-emerald-400" : "text-slate-500"}`}>
        {status ? statusText : "Checking…"}
      </span>
    </div>
  );
}

export default function LandingFooter() {
  const [status, setStatus] = useState({ ai: false, db: false });

  useEffect(() => {
    Promise.all([
      fetch("/api/status").then((r) => r.json()).catch(() => ({ ai: true, db: false })),
    ]).then(([data]) => {
      setStatus({ ai: data?.ai !== false, db: data?.db === true });
    });
  }, []);

  return (
    <footer className="relative border-t border-slate-800/50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <StatusIndicator label="AI Models" status={status.ai} statusText="Active" />
            <StatusIndicator label="Database" status={status.db} statusText="Connected" />
          </div>
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} TrustHive. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
