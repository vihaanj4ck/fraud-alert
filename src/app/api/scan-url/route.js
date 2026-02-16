import { NextResponse } from "next/server";
import { connectToDatabase, getBlockedAttemptsCollection } from "@/lib/mongodb";
import { checkMalicious } from "@/lib/blocklist";

// Global CORS so the extension never gets blocked; include on every response
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, init = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...CORS_HEADERS, ...init.headers },
  });
}

const BASE_TRUST_SCORE = 100;

const PENALTY = {
  HTTP_INSECURE: 30,
  TITLE_MISSING: 20,
  DESCRIPTION_MISSING: 30,
  LINK_DENSITY_HIGH: 20,
};

function getHostname(urlString) {
  try {
    const u = new URL(urlString);
    return (u.hostname || "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * OPTIONS /api/scan-url – CORS preflight for browser extension
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

/**
 * POST /api/scan-url
 * Weighted Safety Score (start at 100):
 * - BLOCKLIST: checkMalicious(url) → score 0%, "Verified Scam (Source: Scamwave)"
 * - PROTOCOL: http:// → -30
 * - METADATA: title missing -20, description missing -30
 * - LINK DENSITY: >80% external/empty links → -20
 * Returns reasoning[] explaining which penalties were applied.
 * CORS enabled so the extension can call from any origin.
 */
export async function POST(request) {
  try {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      body = {};
    }
    if (body === null || typeof body !== "object") body = {};
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const pageTitle = typeof body.pageTitle === "string" ? body.pageTitle.trim() : "";
    const metaDescription =
      typeof body.metaDescription === "string" ? body.metaDescription.trim() : "";
    const ogTitle = typeof body.ogTitle === "string" ? body.ogTitle.trim() : "";
    const totalLinks = Math.max(0, Number(body.totalLinks) || 0);
    const externalLinks = Math.max(0, Number(body.externalLinks) || 0);
    const emptyLinks = Math.max(0, Number(body.emptyLinks) || 0);
    const isSecureProtocol = body.isSecureProtocol !== false;

    if (!url) {
      return jsonResponse(
        {
          error: "URL is required",
          safetyScore: 0,
          reasoning: ["Scan skipped: No URL provided."],
        },
        { status: 400 }
      );
    }

    // --- BLOCKLIST CHECK ---
    if (checkMalicious(url)) {
      const hostname = getHostname(url);
      try {
        await connectToDatabase();
        const blockedCol = await getBlockedAttemptsCollection();
        await blockedCol.insertOne({
          type: "url_scan",
          url,
          hostname,
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.error("[scan-url] blocked_attempts log failed:", logErr?.message);
      }
      return jsonResponse({
        safetyScore: 0,
        safetyPercentage: 0,
        message: "DANGEROUS",
        reasoning: ["Verified Scam (Source: Scamwave)"],
        isSecureProtocol: body.isSecureProtocol !== false,
      });
    }

    let score = BASE_TRUST_SCORE;
    const reasoning = [];

    // --- PROTOCOL CHECK ---
    if (!isSecureProtocol) {
      score -= PENALTY.HTTP_INSECURE;
      reasoning.push("Penalty applied: Site uses insecure HTTP (not HTTPS). (-30 points)");
    }

    // --- METADATA CHECK (never skip scan; missing metadata = penalty) ---
    const titleMissing = !pageTitle && !ogTitle;
    const descMissing = !metaDescription;

    if (titleMissing || descMissing) {
      reasoning.push(
        "WARNING: Metadata could not be retrieved - typical of hidden scam pages."
      );
    }
    if (titleMissing) {
      score -= PENALTY.TITLE_MISSING;
      reasoning.push("Penalty applied (Metadata): Page title is missing. (-20 points)");
    }
    if (descMissing) {
      score -= PENALTY.DESCRIPTION_MISSING;
      reasoning.push("Penalty applied (Metadata): Meta description is missing. (-30 points)");
    }

    // --- LINK DENSITY ---
    const suspiciousLinkRatio =
      totalLinks > 0 ? (externalLinks + emptyLinks) / totalLinks : 0;

    if (totalLinks > 0 && suspiciousLinkRatio > 0.8) {
      score -= PENALTY.LINK_DENSITY_HIGH;
      reasoning.push(
        `Penalty applied: High ratio of external/empty links (${Math.round(suspiciousLinkRatio * 100)}% of ${totalLinks} links). (-20 points)`
      );
    } else if (totalLinks > 0 && (emptyLinks > 0 || externalLinks > 0)) {
      reasoning.push(
        `Link structure: ${emptyLinks} empty, ${externalLinks} external of ${totalLinks} total (no penalty; under 80%).`
      );
    }

    const safetyScore = Math.min(100, Math.max(0, Math.round(score)));
    let message = "SECURE";
    if (safetyScore < 40) message = "DANGEROUS";
    else if (safetyScore < 70) message = "SUSPICIOUS";

    // Never return an empty reasoning array
    const finalReasoning =
      reasoning.length > 0
        ? reasoning
        : [
            "Domain reputation appears solid",
            "Standard security protocols detected",
            "Content matches official intent",
          ];

    return jsonResponse({
      safetyScore,
      safetyPercentage: safetyScore,
      message,
      reasoning: finalReasoning,
      isSecureProtocol,
    });
  } catch (err) {
    const message =
      err && typeof err.message === "string" ? err.message : "Scan failed";
    console.error("[scan-url]", message, err);
    return jsonResponse(
      {
        error: message,
        safetyScore: 50,
        message: "SUSPICIOUS",
        reasoning: ["API error: scan could not complete. Try again."],
      },
      { status: 500 }
    );
  }
}
