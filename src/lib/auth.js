import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "trusthive-demo-secret-change-in-production";
const JWT_EXPIRY = "1d";

/**
 * Get client IP from request headers (for use in API routes).
 * @param {Request} request
 * @returns {string}
 */
export function getClientIpFromRequest(request) {
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
 * Create a JWT for the given user id (email).
 * @param {string} userId - user email or id
 * @returns {string}
 */
export function createToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT from Authorization header and return payload (or null).
 * @param {Request} request
 * @returns {{ sub: string } | null}
 */
export function getAuthUser(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const sub = payload?.sub;
    if (typeof sub !== "string") return null;
    return { sub };
  } catch {
    return null;
  }
}
