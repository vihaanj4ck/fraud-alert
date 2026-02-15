import { NextResponse } from "next/server";

const HF_INFERENCE_URL =
  "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli";

const TRUSTED_TLDS = [".com", ".in", ".org", ".net"];
const TLD_DEDUCT = 30;
const DEDUCT_PER_HYPHEN_OR_EXTRA_DOT = 10;
const MAX_SUBDOMAINS_BEFORE_PENALTY = 3;
const BROKEN_LINK_RATIO_THRESHOLD = 0.2;
const BROKEN_LINK_DEDUCT = 20;
const EXTERNAL_ASSET_RATIO_THRESHOLD = 0.6;
const EXTERNAL_ASSET_DEDUCT = 15;

const BART_LABELS = [
  "official portal",
  "neutral information",
  "urgent security alert",
  "prize giveaway scam",
  "suspicious landing page",
];

function getHostnameAndTld(urlString) {
  try {
    const u = new URL(urlString);
    const hostname = u.hostname || "";
    const parts = hostname.split(".");
    const tld = parts.length >= 2 ? "." + parts.slice(-1)[0] : "";
    const dots = (hostname.match(/\./g) || []).length;
    const hyphens = (hostname.match(/-/g) || []).length;
    const hasTrustedTld = TRUSTED_TLDS.some((t) => hostname.endsWith(t));
    return { hostname, tld, dots, hyphens, hasTrustedTld };
  } catch {
    return { hostname: "", tld: "", dots: 0, hyphens: 0, hasTrustedTld: false };
  }
}

/**
 * POST /api/scan-url
 * Data-driven: TLD check, hyphen/dots, BART (official +10*conf, threat -50*conf), broken link ratio, external asset ratio.
 * Returns safetyPercentage and findings[] with specific reasons.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const pageTitle = typeof body.pageTitle === "string" ? body.pageTitle : "";
    const metaDescription =
      typeof body.metaDescription === "string" ? body.metaDescription : "";
    const nullLinksCount = Math.max(0, Number(body.nullLinksCount) || 0);
    const totalLinks = Math.max(0, Number(body.totalLinks) || 0);
    const externalImages = Math.max(0, Number(body.externalImages) || 0);
    const totalImages = Math.max(0, Number(body.totalImages) || 0);
    const externalScripts = Math.max(0, Number(body.externalScripts) || 0);
    const totalScripts = Math.max(0, Number(body.totalScripts) || 0);

    if (!url) {
      return NextResponse.json(
        { error: "URL is required", safetyPercentage: 0, findings: [] },
        { status: 400 }
      );
    }

    let score = 100;
    const findings = [];

    // --- 1. DOMAIN AUTHORITY (TLD + hyphen + subdomains) ---
    const { hostname, tld, dots, hyphens, hasTrustedTld } =
      getHostnameAndTld(url);

    if (hostname && !hasTrustedTld) {
      score -= TLD_DEDUCT;
      const displayTld = tld || "(unknown)";
      findings.push(`Non-standard TLD detected (${displayTld})`);
    }

    if (hyphens > 0) {
      const deduct = hyphens * DEDUCT_PER_HYPHEN_OR_EXTRA_DOT;
      score -= deduct;
      findings.push(
        `Domain contains ${hyphens} hyphen(s) (often used in phishing)`
      );
    }

    if (dots > MAX_SUBDOMAINS_BEFORE_PENALTY) {
      const extra = dots - MAX_SUBDOMAINS_BEFORE_PENALTY;
      const deduct = extra * DEDUCT_PER_HYPHEN_OR_EXTRA_DOT;
      score -= deduct;
      findings.push(
        `More than 3 subdomains detected (${dots} dots in hostname)`
      );
    }

    // --- 2. STRUCTURAL HEURISTICS ---
    const brokenLinkRatio = totalLinks > 0 ? nullLinksCount / totalLinks : 0;
    if (brokenLinkRatio > BROKEN_LINK_RATIO_THRESHOLD) {
      score -= BROKEN_LINK_DEDUCT;
      findings.push(
        `Detected ${nullLinksCount} broken links out of ${totalLinks}, suggesting a hollow phishing shell (${Math.round(brokenLinkRatio * 100)}% broken link ratio).`
      );
    }

    const totalAssets = totalImages + totalScripts;
    const externalAssets = externalImages + externalScripts;
    const externalAssetRatio = totalAssets > 0 ? externalAssets / totalAssets : 0;
    if (externalAssetRatio > EXTERNAL_ASSET_RATIO_THRESHOLD) {
      score -= EXTERNAL_ASSET_DEDUCT;
      findings.push(
        `External asset ratio ${Math.round(externalAssetRatio * 100)}% (over 60% threshold); possible clone or low-quality site.`
      );
    }

    // --- 3. AI SEMANTIC ANALYSIS (BART) ---
    const token = process.env.HF_TOKEN;
    if (token) {
      const textToAnalyze = [pageTitle, metaDescription]
        .filter(Boolean)
        .join(" ")
        .trim() || url;
      const text = `Site title and description: ${textToAnalyze}`;

      const res = await fetch(HF_INFERENCE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: {
            candidate_labels: BART_LABELS,
            multi_label: false,
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      const aiResponse = await res.json();

      if (res.ok) {
        let data = aiResponse;
        if (Array.isArray(data) && data[0]) data = data[0];
        const scores = data.scores || [];
        const labelsOut = data.labels || [];

        const getScore = (key) => {
          const i = labelsOut.findIndex(
            (l) => l && String(l).toLowerCase().includes(key)
          );
          return i >= 0 ? scores[i] ?? 0 : 0;
        };

        const officialScore = getScore("official");
        const urgentScore = getScore("urgent");
        const prizeScamScore = getScore("prize") || getScore("scam");
        const suspiciousScore = getScore("suspicious");

        const threatDeduct = Math.round(
          urgentScore * 50 + prizeScamScore * 50
        );
        if (threatDeduct > 0) {
          score -= threatDeduct;
          if (urgentScore > 0.3)
            findings.push(
              `High-pressure urgency detected in site metadata (${Math.round(urgentScore * 100)}% confidence).`
            );
          if (prizeScamScore > 0.3)
            findings.push(
              `Prize or giveaway scam signals in content (${Math.round(prizeScamScore * 100)}% confidence).`
            );
        }
        if (suspiciousScore > 0.3)
          findings.push(
            `Suspicious landing page tone (${Math.round(suspiciousScore * 100)}% confidence).`
          );

        const officialAdd = Math.round(officialScore * 10);
        if (officialAdd > 0) {
          score = Math.min(100, score + officialAdd);
          findings.push(
            `Official or trustworthy tone in metadata (${Math.round(officialScore * 100)}% confidence).`
          );
        }
      }
    }

    const safetyPercentage = Math.min(100, Math.max(0, Math.round(score)));

    let message = "SECURE";
    if (safetyPercentage < 30) message = "DANGEROUS";
    else if (safetyPercentage < 80) message = "SUSPICIOUS";

    return NextResponse.json({
      safetyPercentage,
      safety: safetyPercentage,
      message,
      findings,
    });
  } catch (err) {
    console.error("[scan-url]", err.message);
    return NextResponse.json(
      {
        error: err.message || "Scan failed",
        safetyPercentage: 50,
        message: "SUSPICIOUS",
        findings: ["Scan failed"],
      },
      { status: 500 }
    );
  }
}
