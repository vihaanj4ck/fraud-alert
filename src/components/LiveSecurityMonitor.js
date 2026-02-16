"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LiveSecurityMonitor() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Live Security Monitor
      </h3>
      <div className="mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-slate-700">
            Real-time IP Tracking Active
          </span>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">AI Risk Analysis</p>
          <p className="text-lg font-bold text-emerald-600">
            {mounted ? "0%" : "—"} Detected
          </p>
        </div>
        <p className="text-xs text-slate-500">
          All transactions protected by TrustHive AI.
        </p>
      </div>
    </motion.aside>
  );
}
