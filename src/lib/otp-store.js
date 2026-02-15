const OTP_STORE = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 min so verify isn't "expired" too soon
const MAX_ATTEMPTS = 3;

export function setOtp(sessionId, code, transactionId = null) {
  OTP_STORE.set(sessionId, {
    code: String(code).trim().padStart(4, "0").slice(-4),
    transactionId,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
}

export function getOtp(sessionId) {
  const data = OTP_STORE.get(sessionId);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    OTP_STORE.delete(sessionId);
    return null;
  }
  if (data.attempts >= MAX_ATTEMPTS) {
    OTP_STORE.delete(sessionId);
    return null;
  }
  return data;
}

/** Increment failed attempt; returns { attempts, locked }. If locked, session is deleted. */
export function incrementFailedAttempts(sessionId) {
  const data = OTP_STORE.get(sessionId);
  if (!data) return { attempts: 0, locked: false };
  data.attempts = (data.attempts || 0) + 1;
  const locked = data.attempts >= MAX_ATTEMPTS;
  if (locked) OTP_STORE.delete(sessionId);
  return { attempts: data.attempts, locked };
}

export function deleteOtp(sessionId) {
  OTP_STORE.delete(sessionId);
}

export function pruneOtpStore() {
  const now = Date.now();
  for (const [sid, data] of OTP_STORE.entries()) {
    if (data.expiresAt < now) OTP_STORE.delete(sid);
  }
}
