"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SecurityOverlay from "@/components/SecurityOverlay";

const DEVICE_ID_KEY = "trusthive_device_id";

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function LoginRiskBadge({ score }) {
  if (score <= 39) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-lg font-semibold text-emerald-800">Secure Login</p>
        <p className="text-sm text-emerald-700">Risk score: {score}</p>
      </div>
    );
  }
  if (score <= 60) {
    return (
      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-lg font-semibold text-amber-800">Suspicious Login Detected</p>
        <p className="text-sm text-amber-700">Risk score: {score}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-center">
      <p className="text-lg font-semibold text-red-800">High Risk Login Attempt</p>
      <p className="text-sm text-red-700">Risk score: {score}</p>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [loginResult, setLoginResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  useEffect(() => {
    if (minTimePassed && loginResult !== null) {
      setShowOverlay(false);
    }
  }, [minTimePassed, loginResult]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setLoginResult(null);
      setMinTimePassed(false);
      setShowOverlay(true);

      try {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            deviceId: deviceId || getOrCreateDeviceId(),
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setLoginResult({ error: data.error || "Login failed" });
          return;
        }

        setLoginResult({
          token: data.token,
          loginRiskScore: data.loginRiskScore ?? 0,
          triggeredSignals: data.triggeredSignals || [],
        });

        if (data.token && typeof window !== "undefined") {
          localStorage.setItem("trusthive_token", data.token);
        }
      } catch (err) {
        setLoginResult({ error: err.message || "Login failed" });
      } finally {
        setMinTimePassed(false);
      }
    },
    [email, password, deviceId]
  );

  const onMinTimeElapsed = useCallback(() => {
    setMinTimePassed(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SecurityOverlay show={showOverlay} onMinTimeElapsed={onMinTimeElapsed} />

      <Navbar />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-emerald-600 hover:underline">
            Register
          </Link>
        </p>

        {loginResult !== null && !loginResult.error ? (
          <div className="mt-8 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Login complete</h2>
            <LoginRiskBadge score={loginResult.loginRiskScore} />
            {loginResult.triggeredSignals && loginResult.triggeredSignals.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Triggered signals</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                  {loginResult.triggeredSignals.map((sig, i) => (
                    <li key={i}>{sig}</li>
                  ))}
                </ul>
              </div>
            )}
            <Link
              href="/"
              className="inline-block rounded-lg bg-slate-900 px-6 py-2 text-white hover:bg-slate-800"
            >
              Continue to shop
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {loginResult?.error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {loginResult.error}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
            >
              Sign in
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
