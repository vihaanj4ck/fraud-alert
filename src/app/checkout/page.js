"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SecurityOverlay from "@/components/SecurityOverlay";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const PAYMENT_METHODS = { card: "card", upi: "upi", cod: "cod" };
const VELOCITY_THRESHOLD_MS = 15 * 1000;

function getCartQuantityRisk(cartQuantity) {
  const n = Math.floor((Number(cartQuantity) || 0) / 4);
  return Math.min(100, Math.max(0, n) * 10);
}

/**
 * Velocity: time from first item added to landing on checkout page. If < 15s, +50%.
 * Uses checkoutLandedAt (set once on page load) so the penalty is persistent.
 */
function getVelocityRiskFromLanding(firstItemAddedAt, checkoutLandedAt) {
  if (!firstItemAddedAt || !checkoutLandedAt) return 0;
  const elapsed = Number(checkoutLandedAt) - Number(firstItemAddedAt);
  return elapsed < VELOCITY_THRESHOLD_MS ? 50 : 0;
}

function RiskMeterBar({ score }) {
  const n = Math.min(100, Math.max(0, Number(score) || 0));
  let color = "bg-emerald-500";
  if (n >= 60) color = "bg-red-500";
  else if (n >= 50) color = "bg-amber-500";
  return (
    <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${n}%` }} />
    </div>
  );
}

function RiskAnalysisSidebar({ items, firstItemAddedAt, checkoutLandedAt, fraudResult, liveScore, velocityRiskPersistent }) {
  const cartQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const cartRisk = getCartQuantityRisk(cartQuantity);
  const velocityRisk = velocityRiskPersistent ?? getVelocityRiskFromLanding(firstItemAddedAt, checkoutLandedAt);
  const score = fraudResult ? fraudResult.finalScore : liveScore ?? cartRisk + velocityRisk;
  const signals = fraudResult?.triggeredSignals ?? [];
  const breakdown = fraudResult?.riskBreakdown;

  const liveSignals = useMemo(() => {
    const list = [];
    if (cartRisk > 0) list.push({ label: `Cart quantity (${cartQuantity} items)`, points: cartRisk, key: "cart" });
    if (velocityRisk > 0) list.push({ label: "⚠️ Fast Checkout (< 15s): +50% Risk", points: velocityRisk, key: "velocity" });
    return list;
  }, [cartQuantity, cartRisk, velocityRisk]);

  const displaySignals = signals.length ? signals : liveSignals;
  const isHighRisk = score >= 50 && score < 60;
  const isBlocked = score >= 60;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Risk Analysis</h3>
      {velocityRisk > 0 && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
          ⚠️ Fast Checkout (&lt; 15s): +50% Risk
        </div>
      )}
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>0</span>
        <span className="font-medium text-slate-700">Risk: {Math.round(score)}%</span>
        <span>100</span>
      </div>
      <RiskMeterBar score={score} />
      <div className="flex justify-between mt-0.5 text-[10px] text-slate-400">
        <span>Safe</span>
        <span>{isHighRisk ? "High Risk" : ""}</span>
        <span>Block 60%+</span>
      </div>
      {isHighRisk && !isBlocked && (
        <p className="mt-2 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">High Risk User</p>
      )}
      {breakdown && (
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-600">
          <span>Cart: {breakdown.cartQuantity ?? 0}%</span>
          <span>Velocity: {breakdown.velocity ?? 0}%</span>
          <span>Geo: {breakdown.geolocation ?? 0}%</span>
          <span>AI: {breakdown.aiContext ?? 0}%</span>
          <span>Mobile: {breakdown.mobilePattern ?? 0}%</span>
          <span>Email: {breakdown.emailDomain ?? 0}%</span>
          <span>Card: {breakdown.cardPattern ?? 0}%</span>
        </div>
      )}
      <div className="mt-3 space-y-1.5">
        <p className="text-xs font-medium text-slate-600">Triggered signals</p>
        {displaySignals.length === 0 ? (
          <p className="text-xs text-slate-400">None yet</p>
        ) : (
          <ul className="space-y-1 text-xs text-slate-700">
            {displaySignals.map((sig, i) => (
              <li key={sig.key || i} className="flex justify-between gap-2">
                <span className="truncate">{sig.label}</span>
                <span className="font-medium text-amber-700 shrink-0">+{sig.points}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OtpModal({ open, demoOtp, onVerify, onClose, loading, error, t }) {
  const [otp, setOtp] = useState("");
  useEffect(() => {
    if (!open) setOtp("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{t("checkout.securityOtp")}</h3>
        <p className="mt-2 font-mono text-2xl font-bold text-emerald-600">{demoOtp}</p>
        <p className="mt-2 text-sm text-slate-500">Enter the code above to complete payment.</p>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-lg font-mono tracking-widest"
          placeholder="0000"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onVerify(otp)}
            disabled={loading || otp.length !== 4}
            className="flex-1 rounded-lg bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Verifying..." : t("checkout.verify")}
          </button>
        </div>
      </div>
    </div>
  );
}

function TransactionFailedOverlay({ open, reason, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border-2 border-red-300 bg-white p-6 shadow-xl text-center">
        <p className="text-xl font-bold text-red-700">Transaction Failed</p>
        {reason && <p className="mt-2 text-sm text-slate-600">{reason}</p>}
        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-lg bg-slate-800 px-6 py-2 text-white hover:bg-slate-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}

function FraudDetectedModal({ open, redirectIn, scamDetected, blockReason }) {
  if (!open) return null;
  const useBlockReason = Boolean(blockReason);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-900/95 p-4 text-center text-white">
      <p className="text-2xl font-bold text-red-400">
        {useBlockReason ? "🚨 RISK DETECTED" : scamDetected ? "🚨 SCAM DETECTED" : "🚨 FRAUD DETECTED"}
      </p>
      <p className="mt-2 text-lg">
        {useBlockReason
          ? `Risk Detected: ${blockReason}. Payment blocked.`
          : scamDetected
            ? "AI analysis and velocity patterns indicate potential fraud. Payment blocked."
            : "Transaction Cancelled for your safety."}
      </p>
      <p className="mt-4 text-sm text-slate-300">Redirecting to homepage in {redirectIn} seconds...</p>
    </div>
  );
}

function PaymentMethodBadges() {
  const badges = [
    { name: "Visa", bg: "bg-[#1A1F71]", text: "text-white" },
    { name: "Mastercard", bg: "bg-[#EB001B]", text: "text-white" },
    { name: "RuPay", bg: "bg-[#0C2461]", text: "text-white" },
    { name: "UPI", bg: "bg-[#00B894]", text: "text-white" },
    { name: "COD", bg: "bg-slate-700", text: "text-white" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges.map((b) => (
        <span key={b.name} className={`rounded px-2.5 py-1 text-xs font-semibold ${b.bg} ${b.text}`}>
          {b.name}
        </span>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, getToken } = useAuth();
  const { items, totalPrice, totalItems, firstItemAddedAt, clearCart } = useCart();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.card);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [fraudResult, setFraudResult] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [demoOtp, setDemoOtp] = useState("");
  const [otpSessionId, setOtpSessionId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [failedReason, setFailedReason] = useState("");
  const [success, setSuccess] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [velocityRiskPersistent, setVelocityRiskPersistent] = useState(null);
  const [checkoutLandedAt, setCheckoutLandedAt] = useState(null);
  const [fraudDetected, setFraudDetected] = useState(false);
  const [scamDetected, setScamDetected] = useState(false);
  const [blockReason, setBlockReason] = useState(null);
  const [fraudCountdown, setFraudCountdown] = useState(3);
  const [accountBanned, setAccountBanned] = useState(false);
  const checkoutLandedAtRef = useRef(null);

  const productNames = useMemo(() => items.map((i) => i.product.name).filter(Boolean), [items]);
  const cartQuantity = totalItems;

  useEffect(() => {
    if (minTimePassed && requestDone) setShowOverlay(false);
  }, [minTimePassed, requestDone]);

  // Redirect banned users to /banned page
  useEffect(() => {
    const token = getToken?.();
    if (!token) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.banned) router.replace("/banned");
      })
      .catch(() => {});
  }, [getToken, router]);

  // On checkout page load: record landing time once and set persistent velocity risk (first item → checkout page)
  useEffect(() => {
    if (checkoutLandedAtRef.current !== null) return;
    const landed = Date.now();
    checkoutLandedAtRef.current = landed;
    setCheckoutLandedAt(landed);
    const first = firstItemAddedAt ? Number(firstItemAddedAt) : 0;
    setVelocityRiskPersistent(first && landed - first < VELOCITY_THRESHOLD_MS ? 50 : 0);
  }, [firstItemAddedAt]);

  const effectiveVelocityRisk = velocityRiskPersistent ?? (checkoutLandedAt && firstItemAddedAt ? getVelocityRiskFromLanding(firstItemAddedAt, checkoutLandedAt) : 0);

  useEffect(() => {
    const cartR = getCartQuantityRisk(cartQuantity);
    const velR = effectiveVelocityRisk;
    const newScore = cartR + velR;
    setLiveScore(newScore);
    if (newScore >= 60) setFraudDetected(true);
  }, [cartQuantity, effectiveVelocityRisk]);

  useEffect(() => {
    if (!fraudDetected) return;
    const t = setInterval(() => {
      setFraudCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          router.replace("/");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [fraudDetected, router]);

  const validateMobile = (value) => /^\d{10}$/.test((value || "").trim());
  const validateCard = () => {
    const num = cardNumber.replace(/\s/g, "");
    if (num.length < 13 || num.length > 19) return false;
    const [mm, yy] = expiry.split("/").map((s) => s.trim());
    if (!/^\d{2}$/.test(mm) || !/^\d{2}$/.test(yy)) return false;
    const m = parseInt(mm, 10);
    if (m < 1 || m > 12) return false;
    return true;
  };
  const validateUpi = () => /@/.test((upiId || "").trim());

  const handleProceedToPay = async (e) => {
    e.preventDefault();
    setOtpError("");
    setFailedOverlay(false);
    setAccountBanned(false);
    if (!validateMobile(mobile)) {
      setFailedReason("Mobile number must be exactly 10 digits.");
      setFailedOverlay(true);
      return;
    }
    // IP velocity ban: if logged in, check loginHistory (last 10 min) for >3 unique IPs → ban & redirect to /banned
    if (user?.email && getToken?.()) {
      try {
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (checkoutRes.status === 403) {
          setAccountBanned(true);
          router.replace("/banned");
          return;
        }
      } catch (_) {
        // do not block if checkout API fails (e.g. network)
      }
    }
    const userId = user?.email || (email || mobile || "guest").toString().trim() || "guest";
    try {
      const ipRes = await fetch("/api/ip/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, accountId: userId }),
      });
      const ipData = await ipRes.json().catch(() => ({}));
      if (ipData && (ipData.banned === true || ipData.highRisk === true)) {
        setAccountBanned(true);
        router.replace("/banned");
        return;
      }
    } catch (_) {
      // never block Proceed to Pay if IP log fails (e.g. MongoDB down or network error)
    }
    if (paymentMethod === PAYMENT_METHODS.card && !validateCard()) {
      setFailedReason("Invalid card: use 13–19 digits and valid MM/YY.");
      setFailedOverlay(true);
      return;
    }
    if (paymentMethod === PAYMENT_METHODS.upi && !validateUpi()) {
      setFailedReason("UPI ID must contain @ (e.g. name@bank).");
      setFailedOverlay(true);
      return;
    }

    setLoading(true);
    setRequestDone(false);
    setMinTimePassed(false);
    setShowOverlay(true);
    setFraudResult(null);

    try {
      const res = await fetch("/api/check-fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.email ?? null,
          totalAmount: totalPrice,
          cartQuantity,
          productNames,
          firstItemAddedAt,
          checkoutPageLandedAt: checkoutLandedAtRef.current ?? checkoutLandedAt ?? Date.now(),
          mobile: mobile.trim(),
          email: email.trim(),
          cardNumber: paymentMethod === PAYMENT_METHODS.card ? cardNumber.replace(/\D/g, "") : "",
          shippingName: name.trim(),
          shippingAddress: address.trim(),
          cartItems: items.map((i) => ({ product: i.product, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fraud check failed");
      setFraudResult(data);

      if (Number(data.finalScore) >= 60 || data.status === "Blocked") {
        setScamDetected(!!data.scamDetected);
        setBlockReason(data.blockReason || null);
        if (data.transactionId) {
          const failureReason = data.blockReason
            ? `Risk Detected: ${data.blockReason}. Transaction blocked.`
            : "Fraud detected: risk >= 60%, transaction cancelled";
          fetch("/api/transactions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: data.transactionId,
              outcome: "failed",
              failureReason,
            }),
          }).catch(() => {});
        }
        setFraudDetected(true);
        setLoading(false);
        setRequestDone(true);
        return;
      }

      const otpRes = await fetch("/api/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: data.transactionId }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || "OTP generation failed");
      setTransactionId(data.transactionId || "");
      setOtpSessionId(String(otpData.sessionId || "").trim());
      setDemoOtp(String(otpData.demoOtp || otpData.message?.replace(/.*:\s*/i, "").trim() || "").slice(0, 6));
      setOtpModalOpen(true);
    } catch (err) {
      setFailedReason(err.message || "Request failed");
      setFailedOverlay(true);
    } finally {
      setLoading(false);
      setRequestDone(true);
    }
  };

  const handleOtpVerify = async (enteredOtp) => {
    setOtpError("");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: otpSessionId, otp: enteredOtp }),
      });
      const data = await res.json();
      if (!data.valid) {
        if (data.locked) {
          setOtpModalOpen(false);
          if (transactionId) {
            fetch("/api/transactions", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transactionId,
                outcome: "failed",
                failureReason: "Too many wrong OTP attempts",
              }),
            }).catch(() => {});
          }
          setFailedReason("Too many wrong OTP attempts. Transaction failed.");
          setFailedOverlay(true);
        } else {
          setOtpError(data.error || "Incorrect OTP, please try again.");
        }
        setOtpLoading(false);
        return;
      }
      setOtpModalOpen(false);
      if (transactionId) {
        await fetch("/api/transactions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId,
            outcome: "success",
            paymentMethod,
            mobile: mobile.trim(),
          }),
        });
      }
      if (paymentMethod === PAYMENT_METHODS.card && cardNumber) {
        const last4 = cardNumber.replace(/\D/g, "").slice(-4);
        const token = getToken?.();
        if (last4.length === 4 && token) {
          fetch("/api/account/save-card", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ last4, brand: "Card" }),
          }).catch(() => {});
        }
      }
      setSuccess(true);
      clearCart();
    } catch (err) {
      setOtpError(err.message || "Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpClose = () => {
    setOtpModalOpen(false);
    if (transactionId) {
      fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, outcome: "failed", failureReason: "User cancelled OTP" }),
      }).catch(() => {});
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="mx-auto flex flex-1 items-center justify-center px-4 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Your cart is empty.</p>
            <Link href="/shop" className="mt-4 inline-block text-amber-600 hover:underline">
              Continue shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Navbar />
        <main className="mx-auto flex flex-1 items-center justify-center px-4 py-12">
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
            <p className="text-xl font-semibold text-emerald-700">{t("checkout.transactionSuccess")}</p>
            <Link href="/shop" className="mt-4 inline-block rounded-lg bg-amber-500 px-6 py-2 text-white hover:bg-amber-600">
              Continue shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SecurityOverlay show={showOverlay} onMinTimeElapsed={() => setMinTimePassed(true)} />
      <TransactionFailedOverlay open={failedOverlay} reason={failedReason} onClose={() => setFailedOverlay(false)} />
      <FraudDetectedModal open={fraudDetected} redirectIn={fraudCountdown} scamDetected={scamDetected} blockReason={blockReason} />
      <OtpModal
        open={otpModalOpen}
        demoOtp={demoOtp}
        onVerify={handleOtpVerify}
        onClose={handleOtpClose}
        loading={otpLoading}
        error={otpError}
        t={t}
      />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("checkout.title")}</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-slate-600">
                {t("checkout.cartTotal")}: <span className="font-bold text-slate-900">{t("rupee")}{totalPrice.toLocaleString("en-IN")}</span>
              </p>
            </div>

            <form onSubmit={handleProceedToPay} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {accountBanned && (
                <div className="rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3 text-center">
                  <p className="font-bold text-red-700">ACCOUNT BANNED</p>
                  <p className="mt-1 text-sm text-red-600">Too many IP addresses detected. Transaction blocked.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700">{t("checkout.name")}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t("checkout.address")}</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="you@example.com"
                />
                <p className="mt-0.5 text-xs text-slate-500">Trusted: gmail.com, yahoo.com, outlook.com, rediffmail.com, icloud.com</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t("checkout.mobile")} *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="9876543210"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                />
                {mobile.length > 0 && !validateMobile(mobile) && (
                  <p className="mt-1 text-xs text-red-600">Exactly 10 digits (numbers only) required.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">{t("checkout.payWith")}</label>
                <div className="mt-2 flex items-center gap-4 flex-wrap">
                  {["card", "upi", "cod"].map((key) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === key}
                        onChange={() => setPaymentMethod(key)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{t(`checkout.${key}`)}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2">
                  <PaymentMethodBadges />
                </div>
              </div>

              {paymentMethod === PAYMENT_METHODS.card && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">{t("checkout.cardNumber")}</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
                      placeholder="1234567890123456"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t("checkout.expiry")}</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (v.length >= 2) v = v.slice(0, 2) + "/" + v.slice(2);
                        setExpiry(v);
                      }}
                      placeholder="MM/YY"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">{t("checkout.cvv")}</label>
                    <input
                      type="text"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === PAYMENT_METHODS.upi && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t("checkout.upiId")}</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@paytm"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !validateMobile(mobile) || accountBanned}
                className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Checking..." : accountBanned ? "Account banned" : t("checkout.proceedToPay")}
              </button>
              {liveScore >= 60 && (
                <p className="text-xs font-medium text-amber-600">Risk score is 60% or above. You can still try to pay; the system may block the transaction.</p>
              )}
              {!validateMobile(mobile) && mobile.length > 0 && liveScore < 60 && (
                <p className="text-xs text-amber-600">Complete a valid 10-digit mobile number to enable Pay.</p>
              )}
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <RiskAnalysisSidebar
                items={items}
                firstItemAddedAt={firstItemAddedAt}
                checkoutLandedAt={checkoutLandedAt ?? checkoutLandedAtRef.current}
                fraudResult={fraudResult}
                liveScore={liveScore}
                velocityRiskPersistent={velocityRiskPersistent}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
