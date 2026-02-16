/**
 * Scamwave Archive 2026 – domains and emails used in phishing/fraud campaigns.
 * Deployed with the app on Vercel; the extension always gets the latest blocklist
 * via /api/scan-url (no re-install needed when you update this file).
 */
export const SCAM_DATABASE = {
  domains: [
    "munatechconstructionholdingsllc.com",
    "amaz0n-deals.xyz",
    "payoneer-verify.me",
    "scamwave.com",
    "apple-tax-invoice.icu",
  ],
  emails: [
    "phishing@paypal.com",
    "it-support-update@company-portal.xyz",
    "no-reply@payoneer-verification.net",
    "hr-notice@bamboohr-benefits.com",
    "security@log-in-microsoft.com",
  ],
};

/**
 * Safely checks if an input string matches any domain (substring) or email (exact, case-insensitive).
 * Uses null-checks to avoid "Cannot read properties of undefined" errors.
 * @param {unknown} input - Usually a URL string or email string
 * @returns {boolean}
 */
export function checkMalicious(input) {
  if (input == null || typeof input !== "string") return false;
  const db = SCAM_DATABASE;
  if (!db || typeof db !== "object") return false;
  const domains = Array.isArray(db.domains) ? db.domains : [];
  const emails = Array.isArray(db.emails) ? db.emails : [];
  const normalized = input.trim().toLowerCase();
  if (normalized === "") return false;
  const isDomainMatch = domains.some((d) => typeof d === "string" && normalized.includes(d.toLowerCase()));
  const isEmailMatch = emails.some((e) => typeof e === "string" && normalized === e.toLowerCase());
  return isDomainMatch || isEmailMatch;
}
