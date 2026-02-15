"use client";

import { useState, useEffect } from "react";

const MESSAGES = [
  "Analyzing security signals...",
  "Checking IP reputation...",
  "Verifying device fingerprint...",
  "Running behavioral anomaly detection...",
  "Evaluating login patterns...",
];

const MIN_DISPLAY_MS = 2000;

/**
 * Full-screen overlay shown during auth/checkout submit.
 * Cycles messages every 700ms and enforces minimum 2s display.
 */
export default function SecurityOverlay({ show, onMinTimeElapsed }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    if (!show) {
      setMessageIndex(0);
      setMinTimeDone(false);
      return;
    }

    const start = Date.now();
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length);
    }, 700);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setMinTimeDone(true);
      onMinTimeElapsed?.();
    }, MIN_DISPLAY_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [show, onMinTimeElapsed]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 text-white">
      <div className="mx-4 max-w-sm text-center">
        <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white mx-auto" />
        <p className="text-lg font-medium">
          {MESSAGES[messageIndex]}
        </p>
      </div>
    </div>
  );
}
