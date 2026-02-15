import { NextResponse } from "next/server";
import axios from "axios";
import { getTransactionsCollection } from "@/lib/mongodb";

const HF_INFERENCE_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli";

const KNOWN_CITIES = [
  "mumbai",
  "delhi",
  "bangalore",
  "hyderabad",
  "chennai",
  "kolkata",
  "pune",
  "bengaluru",
  "new delhi",
  "mumbai city",
  "delhi ncr",
  "greater mumbai",
];

const VELOCITY_THRESHOLD_MS = 15 * 1000; // 15 seconds
const BLOCK_THRESHOLD = 60;
const SCAM_DETECTED_THRESHOLD = 70; // AI risk + Velocity risk > 70% = Scam Detected

const TRUSTED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "rediffmail.com",
  "icloud.com",
  "hotmail.com",
  "live.com",
  "ymail.com",
];

/**
 * Returns true if digits show suspicious pattern: all same, sequential, or repeating pairs.
 */
function isSuspiciousDigitPattern(digits) {
  const s = String(digits || "").replace(/\D/g, "");
  if (s.length < 4) return false;
  const arr = s.split("").map(Number);
  if (arr.some((n) => Number.isNaN(n))) return false;
  // All identical
  if (arr.every((n) => n === arr[0])) return true;
  // Strict sequential up
  let sequentialUp = true;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== (arr[i - 1] + 1) % 10) {
      sequentialUp = false;
      break;
    }
  }
  if (sequentialUp) return true;
  // Strict sequential down
  let sequentialDown = true;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== (arr[i - 1] - 1 + 10) % 10) {
      sequentialDown = false;
      break;
    }
  }
  if (sequentialDown) return true;
  // Repeating pair (e.g. 2323232323 -> pair "23" repeats)
  if (s.length >= 4 && s.length % 2 === 0) {
    const pair = s.slice(0, 2);
    let repeats = true;
    for (let i = 2; i < s.length; i += 2) {
      if (s.slice(i, i + 2) !== pair) {
        repeats = false;
        break;
      }
    }
    if (repeats) return true;
  }
  return false;
}

/**
 * Suspicious mobile: +20% if pattern detected.
 */
function getMobilePatternRisk(mobile) {
  const s = String(mobile || "").replace(/\D/g, "");
  if (s.length !== 10) return { risk: 0, label: "" };
  const suspicious = isSuspiciousDigitPattern(s);
  return {
    risk: suspicious ? 20 : 0,
    label: suspicious ? "Suspicious mobile pattern (repeated/sequential digits)" : "",
  };
}

/**
 * Suspicious email domain: +10% if not in trust list.
 */
function getEmailDomainRisk(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e || !e.includes("@")) return { risk: 0, domain: "" };
  const domain = e.split("@").pop() || "";
  if (!domain) return { risk: 0, domain: "" };
  const trusted = TRUSTED_EMAIL_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
  return {
    risk: trusted ? 0 : 10,
    domain,
    label: trusted ? "" : "Email domain not in trust list",
  };
}

/**
 * Card pattern: +20% if same repeated/sequential logic on card number.
 */
function getCardPatternRisk(cardNumber) {
  const s = String(cardNumber || "").replace(/\D/g, "");
  if (s.length < 13 || s.length > 19) return { risk: 0, label: "" };
  const suspicious = isSuspiciousDigitPattern(s);
  return {
    risk: suspicious ? 20 : 0,
    label: suspicious ? "Suspicious card pattern (repeated/sequential digits)" : "",
  };
}

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "";
}

/**
 * Cart quantity: +10% per block of 4 items (4→10%, 8→20%, 12→30%).
 */
function getCartQuantityRisk(cartQuantity) {
  const n = Math.floor((Number(cartQuantity) || 0) / 4);
  return Math.min(100, Math.max(0, n) * 10);
}

/**
 * Velocity: time from "first item added" to "landing on checkout page". If < 15s, +50%.
 */
function getVelocityRisk(firstItemAddedAt, checkoutPageLandedAt) {
  if (!firstItemAddedAt) return 0;
  const t0 = Number(firstItemAddedAt);
  if (Number.isNaN(t0)) return 0;
  const t1 = checkoutPageLandedAt != null ? Number(checkoutPageLandedAt) : Date.now();
  if (Number.isNaN(t1)) return 0;
  const elapsed = t1 - t0;
  return elapsed < VELOCITY_THRESHOLD_MS ? 50 : 0;
}

/**
 * Geolocation: fetch city from ipapi.co; if not in known list, +5%.
 */
async function getGeoRisk(clientIp) {
  if (!clientIp || clientIp === "127.0.0.1" || clientIp === "::1") return { risk: 0, city: "local" };
  try {
    const res = await axios.get(`https://ipapi.co/${clientIp}/json/`, {
      timeout: 5000,
      validateStatus: () => true,
    });
    if (res.status !== 200) return { risk: 0, city: "unknown" };
    const city = (res.data?.city || "").toString().trim().toLowerCase();
    const region = (res.data?.region || "").toString().trim().toLowerCase();
    const combined = `${city} ${region}`;
    const isKnown = KNOWN_CITIES.some((c) => city.includes(c) || region.includes(c) || combined.includes(c));
    return { risk: isKnown ? 0 : 5, city: city || "unknown" };
  } catch (err) {
    console.warn("[check-fraud] ipapi.co failed:", err.message);
    return { risk: 0, city: "unknown" };
  }
}

/**
 * AI context: BART-MNLI zero-shot. If cart is "unrelated/anomalous" or "suspicious", +20%.
 * Uses real Hugging Face Inference API; on timeout/failure adds 0% and continues.
 */
async function getAiCartRisk(productNames) {
  if (!Array.isArray(productNames) || productNames.length === 0) return { risk: 0, label: "", score: 0 };

  const token = process.env.HF_TOKEN;
  console.log("--- STARTING AI CHECK ---");
  console.log("HF Token Status:", process.env.HF_TOKEN ? "Loaded" : "MISSING!");

  if (!token) {
    console.warn("[check-fraud] HF_TOKEN not set, skipping AI check");
    return { risk: 0, label: "skipped", score: 0 };
  }

  const itemsToAnalyze = productNames.slice(0, 15).join(", ");
  const text = `Shopping cart contains: ${itemsToAnalyze}.`;
  console.log("Sending to HF API:", itemsToAnalyze);

  const labels = [
    "coherent related products typically bought together",
    "unrelated or anomalous mix of products",
  ];

  try {
    const res = await fetch(HF_INFERENCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: labels,
          multi_label: false,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const aiResponse = await res.json();
    console.log("HF API Response:", aiResponse);

    if (!res.ok) {
      console.warn("[check-fraud] HF Inference error", res.status, aiResponse);
      return { risk: 0, label: "error", score: 0 };
    }

    let data = aiResponse;
    if (Array.isArray(data) && data[0]) data = data[0];
    const scores = data.scores || [];
    const labelsOut = data.labels || [];
    const idx = labelsOut.findIndex((l) => l && String(l).toLowerCase().includes("unrelated"));
    const unrelatedScore = idx >= 0 ? scores[idx] || 0 : 0;
    const anomalous = unrelatedScore > 0.5;
    return {
      risk: anomalous ? 50 : 0, // Higher weight so AI+Velocity can exceed 70%
      label: anomalous ? "unrelated or anomalous mix" : "coherent related products",
      score: unrelatedScore,
    };
  } catch (err) {
    console.error("HF API Error:", err.message);
    return { risk: 0, label: "error", score: 0 };
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON", finalScore: 0, status: "Safe", triggeredSignals: [] },
      { status: 400 }
    );
  }

  const cartQuantity = Math.max(0, Number(body.cartQuantity) || 0);
  const productNames = Array.isArray(body.productNames)
    ? body.productNames.filter((n) => typeof n === "string")
    : [];
  const firstItemAddedAt = body.firstItemAddedAt ?? null;
  const checkoutPageLandedAt = body.checkoutPageLandedAt ?? null;
  const mobile = body.mobile ?? "";
  const email = body.email ?? "";
  const cardNumber = body.cardNumber ?? "";

  const triggeredSignals = [];
  let cartQuantityRisk = getCartQuantityRisk(cartQuantity);
  if (cartQuantityRisk > 0) {
    const blocks = Math.floor(cartQuantity / 4);
    triggeredSignals.push({
      label: `Cart quantity (${cartQuantity} items, ${blocks} blocks of 4)`,
      points: cartQuantityRisk,
      key: "cart",
    });
  }

  let velocityRisk = getVelocityRisk(firstItemAddedAt, checkoutPageLandedAt);
  if (velocityRisk > 0) {
    triggeredSignals.push({
      label: "Fast Checkout (< 15s from first item to checkout page)",
      points: velocityRisk,
      key: "velocity",
    });
  }

  const clientIp = getClientIp(request);
  const geo = await getGeoRisk(clientIp);
  if (geo.risk > 0) {
    triggeredSignals.push({
      label: `Location not in known cities (${geo.city})`,
      points: geo.risk,
      key: "geo",
    });
  }

  const mobilePattern = getMobilePatternRisk(mobile);
  if (mobilePattern.risk > 0 && mobilePattern.label) {
    triggeredSignals.push({
      label: "Suspicious mobile pattern (identical/sequential/repeating digits)",
      points: mobilePattern.risk,
      key: "mobilePattern",
    });
  }

  const emailDomain = getEmailDomainRisk(email);
  if (emailDomain.risk > 0 && emailDomain.label) {
    triggeredSignals.push({
      label: `Suspicious email domain (${emailDomain.domain} not in trust list)`,
      points: emailDomain.risk,
      key: "emailDomain",
    });
  }

  const cardPattern = getCardPatternRisk(cardNumber);
  if (cardPattern.risk > 0 && cardPattern.label) {
    triggeredSignals.push({
      label: "Suspicious card pattern (repeated/sequential digits)",
      points: cardPattern.risk,
      key: "cardPattern",
    });
  }

  const ai = await getAiCartRisk(productNames.length ? productNames : body.cartItems?.map((i) => i.product?.name).filter(Boolean));
  if (ai.risk > 0) {
    triggeredSignals.push({
      label: "Cart items semantically unrelated (AI)",
      points: ai.risk,
      key: "ai",
    });
  }

  const finalScore = Math.min(
    100,
    cartQuantityRisk + velocityRisk + geo.risk + ai.risk + mobilePattern.risk + emailDomain.risk + cardPattern.risk
  );
  const aiPlusVelocity = ai.risk + velocityRisk;
  const scamDetected = aiPlusVelocity > SCAM_DETECTED_THRESHOLD;
  const blockedByTotal = finalScore > BLOCK_THRESHOLD;
  const status = scamDetected || blockedByTotal ? "Blocked" : "Allowed";
  const reasoning =
    status === "Blocked"
      ? scamDetected
        ? "Scam Detected: AI analysis and velocity patterns indicate high fraud risk."
        : "High Security Risk. Transaction blocked by behavioral fraud engine."
      : `Cumulative risk ${finalScore}%. Below block threshold (${BLOCK_THRESHOLD}%).`;

  const riskBreakdown = {
    cartQuantity: cartQuantityRisk,
    velocity: velocityRisk,
    geolocation: geo.risk,
    aiContext: ai.risk,
    mobilePattern: mobilePattern.risk,
    emailDomain: emailDomain.risk,
    cardPattern: cardPattern.risk,
  };

  const record = {
    userId: body.userId ?? null,
    clientIp,
    totalAmount: Number(body.totalAmount) || 0,
    cartQuantity,
    productNames,
    firstItemAddedAt,
    mobile: mobile ? String(mobile).slice(0, 20) : null,
    email: email ? String(email).slice(0, 128) : null,
    riskBreakdown,
    finalScore,
    status,
    reasoning,
    triggeredSignals,
    geoCity: geo.city,
    aiLabel: ai.label,
    createdAt: new Date(),
    outcome: status === "Blocked" ? "blocked" : "pending",
  };

  try {
    const coll = await getTransactionsCollection();
    const { insertedId } = await coll.insertOne(record);
    record._id = insertedId;
  } catch (dbErr) {
    console.error("[check-fraud] MongoDB transactions insert failed:", dbErr.message);
  }

  if (status === "Blocked") {
    return NextResponse.json({
      finalScore,
      status: "Blocked",
      reason: scamDetected ? "Scam Detected" : "High Security Risk",
      scamDetected: !!scamDetected,
      reasoning,
      triggeredSignals,
      riskBreakdown,
      transactionId: record._id?.toString(),
    });
  }

  return NextResponse.json({
    finalScore,
    status: "Allowed",
    reasoning,
    triggeredSignals,
    riskBreakdown,
    transactionId: record._id?.toString(),
  });
}
